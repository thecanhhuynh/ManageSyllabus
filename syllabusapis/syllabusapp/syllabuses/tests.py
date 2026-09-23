from unittest.mock import patch
from django.db import DatabaseError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from syllabuses.models import Faculty, Lecturer, User


class UserRegistrationTestCase(TestCase):
    """Bộ kiểm thử cho chức năng Đăng ký người dùng và tạo Lecturer đi kèm."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.valid_payload = {
            "username": "nguyenvana",
            "password": "SecurePassword123@",
            "email": "nguyenvana@example.com",
            "first_name": "Van A",
            "last_name": "Nguyen",
        }

    def test_register_success_creates_user_and_lecturer(self):
        """Kiểm tra đăng ký thành công: Tạo đồng thời User và Lecturer, password bị ẩn."""
        response = self.client.post(
            self.register_url, self.valid_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "nguyenvana")
        self.assertEqual(response.data["email"], "nguyenvana@example.com")
        self.assertNotIn("password", response.data)

        # Kiểm tra User tồn tại trong DB và password được hash
        user = User.objects.filter(username="nguyenvana").first()
        self.assertIsNotNone(user)
        self.assertTrue(user.check_password("SecurePassword123@"))
        self.assertEqual(user.user_role, User.UserRole.USER)

        # Kiểm tra Lecturer tồn tại và liên kết đúng với User
        lecturer = Lecturer.objects.filter(user=user).first()
        self.assertIsNotNone(lecturer)
        self.assertEqual(lecturer.user, user)

    def test_register_duplicate_username_returns_409(self):
        """Kiểm tra đăng ký với username đã tồn tại -> Trả về HTTP 409 Conflict."""
        # Tạo user trước
        self.client.post(self.register_url, self.valid_payload, format="json")

        # Đăng ký lại cùng username
        duplicate_payload = self.valid_payload.copy()
        duplicate_payload["email"] = "other_email@example.com"
        response = self.client.post(
            self.register_url, duplicate_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)

    def test_register_duplicate_email_returns_409(self):
        """Kiểm tra đăng ký với email đã tồn tại -> Trả về HTTP 409 Conflict."""
        # Tạo user trước
        self.client.post(self.register_url, self.valid_payload, format="json")

        # Đăng ký với email trùng lặp nhưng username khác
        duplicate_payload = self.valid_payload.copy()
        duplicate_payload["username"] = "other_username"
        response = self.client.post(
            self.register_url, duplicate_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)

    def test_register_missing_username_returns_400(self):
        """Kiểm tra đăng ký thiếu username -> Trả về HTTP 400 Bad Request."""
        invalid_payload = self.valid_payload.copy()
        invalid_payload["username"] = ""

        response = self.client.post(
            self.register_url, invalid_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch("syllabuses.models.Lecturer.objects.create")
    def test_register_lecturer_failure_rollbacks_user(self, mock_create_lecturer):
        """
        Kiểm tra tính toàn vẹn: Khi tạo Lecturer thất bại, User phải bị rollback,
        không lưu rác trong database.
        """
        mock_create_lecturer.side_effect = DatabaseError("Mô phỏng lỗi DB khi tạo Lecturer")

        fail_payload = {
            "username": "user_will_be_rollbacked",
            "password": "Password123@",
            "email": "rollback@example.com",
            "first_name": "Test",
            "last_name": "Rollback",
        }

        response = self.client.post(
            self.register_url, fail_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Xác minh quan trọng: User không được tồn tại trong DB do đã rollback
        user_exists = User.objects.filter(username="user_will_be_rollbacked").exists()
        self.assertFalse(
            user_exists,
            "User vẫn tồn tại trong database! Rollback thất bại khi tạo Lecturer gặp lỗi.",
        )


class AdminUserManagementTestCase(TestCase):
    """Bộ kiểm thử cho chức năng Quản lý người dùng dành cho Admin."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username="admin_user",
            password="AdminPassword123@",
            email="admin@example.com",
            user_role=User.UserRole.ADMIN,
        )
        self.regular_user = User.objects.create_user(
            username="regular_user",
            password="UserPassword123@",
            email="regular@example.com",
            user_role=User.UserRole.USER,
        )
        Lecturer.objects.create(user=self.regular_user, room="Room A1")

        self.specialist_user = User.objects.create_user(
            username="specialist_user",
            password="SpecialistPassword123@",
            email="specialist@example.com",
            user_role=User.UserRole.SPECIALIST,
        )
        Lecturer.objects.create(user=self.specialist_user, room="Room B2")
        self.faculty = Faculty.objects.create(name="Khoa Cong nghe Thong tin")

    def test_non_admin_cannot_access_admin_users(self):
        """User thường truy cập /admin/users/ bị chặn với HTTP 403 Forbidden."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_access_admin_users(self):
        """Khách chưa đăng nhập truy cập /admin/users/ bị chặn với HTTP 401 Unauthorized."""
        response = self.client.get("/admin/users/")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_admin_can_list_users(self):
        """Admin có thể lấy danh sách người dùng thành công (HTTP 200 OK)."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(len(response.data["results"]), 3)

    def test_admin_can_filter_by_role_and_search(self):
        """Admin có thể lọc người dùng theo role và tìm kiếm theo từ khóa."""
        self.client.force_authenticate(user=self.admin_user)

        # Lọc theo vai trò specialist
        res_filter = self.client.get("/admin/users/?user_role=specialist")
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        results = res_filter.data["results"]
        self.assertTrue(all(u["user_role"] == "specialist" for u in results))

        # Tìm kiếm theo username
        res_search = self.client.get("/admin/users/?q=regular_user")
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data["results"]), 1)
        self.assertEqual(res_search.data["results"][0]["username"], "regular_user")

    def test_admin_can_retrieve_user_detail(self):
        """Admin có thể xem chi tiết user kèm thông tin Lecturer."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f"/admin/users/{self.regular_user.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "regular_user")
        self.assertIn("lecturer", response.data)
        self.assertEqual(response.data["lecturer"]["room"], "Room A1")

    def test_admin_can_update_user_and_lecturer(self):
        """Admin có thể cập nhật thông tin User và Lecturer liên quan."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "first_name": "Nguyen",
            "last_name": "Van B",
            "room": "Room C303",
        }
        response = self.client.patch(
            f"/admin/users/{self.regular_user.id}/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.first_name, "Nguyen")
        self.assertEqual(self.regular_user.lecturer_profile.room, "Room C303")

    def test_admin_can_soft_delete_user(self):
        """Admin có thể vô hiệu hóa (soft delete) user, không xóa vật lý khỏi database."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f"/admin/users/{self.regular_user.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)
        self.assertFalse(self.regular_user.active)
        # Xác minh user vẫn còn trong database
        self.assertTrue(User.objects.filter(id=self.regular_user.id).exists())

    def test_admin_cannot_self_deactivate(self):
        """Admin không thể tự vô hiệu hóa tài khoản của chính mình."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f"/admin/users/{self.admin_user.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

    def test_admin_can_activate_user(self):
        """Admin có thể kích hoạt lại tài khoản đã bị vô hiệu hóa."""
        self.regular_user.is_active = False
        self.regular_user.active = False
        self.regular_user.save()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f"/admin/users/{self.regular_user.id}/activate/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)
        self.assertTrue(self.regular_user.active)

    def test_admin_can_update_user_faculty_and_empty_room(self):
        """Admin có thể cập nhật faculty (Khoa) và room rỗng cho Lecturer qua PATCH."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            "faculty": self.faculty.id,
            "room": "",
        }
        response = self.client.patch(
            f"/admin/users/{self.regular_user.id}/", payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.lecturer_profile.faculty, self.faculty)
        self.assertEqual(self.regular_user.lecturer_profile.room, "")

        # Test cập nhật faculty = None (xóa khoa)
        clear_payload = {"faculty": None}
        res_clear = self.client.patch(
            f"/admin/users/{self.regular_user.id}/", clear_payload, format="json"
        )
        self.assertEqual(res_clear.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertIsNone(self.regular_user.lecturer_profile.faculty)


