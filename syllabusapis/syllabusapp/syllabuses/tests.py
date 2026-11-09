from unittest.mock import patch
from docx import Document
from django.db import DatabaseError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from syllabuses.models import (
    Faculty, Lecturer, TemplateBlock, TemplateSyllabus, User,
    CustomColumn, CustomColumnValue, Syllabus, Subject, Credit,
    TemplateMainSection, TemplateSubSection,
)
from lxml import etree
from handlers.shell_renderer import ShellDocxRenderer, _to_roman, W_NS
from handlers.preview_builder import PreviewBuilder

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

        user = User.objects.filter(username="nguyenvana").first()
        self.assertIsNotNone(user)
        self.assertTrue(user.check_password("SecurePassword123@"))
        self.assertEqual(user.user_role, User.UserRole.USER)

        lecturer = Lecturer.objects.filter(user=user).first()
        self.assertIsNotNone(lecturer)
        self.assertEqual(lecturer.user, user)

    def test_register_duplicate_username_returns_409(self):
        """Kiểm tra đăng ký với username đã tồn tại -> Trả về HTTP 409 Conflict."""
        self.client.post(self.register_url, self.valid_payload, format="json")

        duplicate_payload = self.valid_payload.copy()
        duplicate_payload["email"] = "other_email@example.com"
        response = self.client.post(
            self.register_url, duplicate_payload, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("error", response.data)

    def test_register_duplicate_email_returns_409(self):
        """Kiểm tra đăng ký với email đã tồn tại -> Trả về HTTP 409 Conflict."""
        self.client.post(self.register_url, self.valid_payload, format="json")

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

        res_filter = self.client.get("/admin/users/?user_role=specialist")
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        results = res_filter.data["results"]
        self.assertTrue(all(u["user_role"] == "specialist" for u in results))

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

        clear_payload = {"faculty": None}
        res_clear = self.client.patch(
            f"/admin/users/{self.regular_user.id}/", clear_payload, format="json"
        )
        self.assertEqual(res_clear.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertIsNone(self.regular_user.lecturer_profile.faculty)

import io
import zipfile

from lxml import etree

def _build_minimal_docx(document_xml_body: str) -> bytes:
    """
    Helper: Tạo file DOCX tối giản trong bộ nhớ.
    Chỉ chứa word/document.xml với nội dung được truyền vào.
    Dùng để kiểm thử mà không cần file DOCX thật.
    """
    W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    full_xml = (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W}">'
        f'<w:body>{document_xml_body}</w:body>'
        f'</w:document>'
    ).encode('utf-8')

    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as z:
        z.writestr('word/document.xml', full_xml)
        z.writestr('[Content_Types].xml', '<Types/>')
    return output.getvalue()

def _parse_document_xml_from_bytes(docx_bytes: bytes) -> etree._Element:
    """Helper: Đọc và parse word/document.xml từ DOCX BytesIO."""
    with zipfile.ZipFile(io.BytesIO(docx_bytes)) as z:
        return etree.fromstring(z.read('word/document.xml'))

_W_NS_TEST = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def _wt(name):
    return f'{{{_W_NS_TEST}}}{name}'

class TestCleanReport(TestCase):
    """Kiểm thử dataclass CleanReport."""

    def test_total_stripped_is_sum_of_all_counters(self):
        from handlers.docx_cleaner import CleanReport
        report = CleanReport(
            sz_stripped=5, sz_cs_stripped=3, lang_stripped=10,
            spacing_stripped=2, jc_stripped=4
        )
        self.assertEqual(report.total_stripped, 24)

    def test_total_stripped_zero_when_empty(self):
        from handlers.docx_cleaner import CleanReport
        self.assertEqual(CleanReport().total_stripped, 0)

    def test_summary_contains_all_fields(self):
        from handlers.docx_cleaner import CleanReport
        report = CleanReport(sz_stripped=3, lang_stripped=7)
        self.assertIn('sz=3', report.summary())
        self.assertIn('lang=7', report.summary())

class TestDocxCleanerService_ValidateInput(TestCase):
    """Kiểm thử các trường hợp input không hợp lệ."""

    def test_raise_bad_zip_on_invalid_bytes(self):
        from handlers.docx_cleaner import DocxCleanerService
        with self.assertRaises(zipfile.BadZipFile):
            DocxCleanerService.clean(b'not a zip file')

    def test_raise_value_error_when_no_document_xml(self):
        from handlers.docx_cleaner import DocxCleanerService
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as z:
            z.writestr('word/styles.xml', '<styles/>')
        with self.assertRaises(ValueError) as ctx:
            DocxCleanerService.clean(buf.getvalue())
        self.assertIn('document.xml', str(ctx.exception))

class TestDocxCleanerService_CleanFile(TestCase):
    """Kiểm thử logic làm sạch trên file DOCX tối giản."""

    def test_strips_sz_szcs_lang_from_rpr(self):
        """sz, szCs, lang phải bị xóa khỏi w:rPr."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:r>'
            '    <w:rPr>'
            '      <w:sz w:val="26"/>'
            '      <w:szCs w:val="26"/>'
            '      <w:lang w:val="nl-NL"/>'
            '    </w:rPr>'
            '    <w:t>Hello</w:t>'
            '  </w:r>'
            '</w:p>'
        )
        cleaned_buf, report = DocxCleanerService.clean(_build_minimal_docx(body))
        root = _parse_document_xml_from_bytes(cleaned_buf.read())

        self.assertEqual(len(list(root.iter(_wt('rPr')))), 0)
        self.assertEqual(report.sz_stripped, 1)
        self.assertEqual(report.sz_cs_stripped, 1)
        self.assertEqual(report.lang_stripped, 1)
        self.assertEqual(report.empty_rpr_removed, 1)

    def test_strips_spacing_and_jc_from_ppr(self):
        """spacing và jc phải bị xóa khỏi w:pPr."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:pPr>'
            '    <w:spacing w:line="360" w:lineRule="auto"/>'
            '    <w:jc w:val="both"/>'
            '  </w:pPr>'
            '  <w:r><w:t>Content</w:t></w:r>'
            '</w:p>'
        )
        cleaned_buf, report = DocxCleanerService.clean(_build_minimal_docx(body))
        root = _parse_document_xml_from_bytes(cleaned_buf.read())
        pPr = root.find('.//' + _wt('pPr'))

        self.assertIsNotNone(pPr)
        self.assertIsNone(pPr.find(_wt('spacing')))
        self.assertIsNone(pPr.find(_wt('jc')))
        self.assertEqual(report.spacing_stripped, 1)
        self.assertEqual(report.jc_stripped, 1)

    def test_preserves_bold_italic_color_in_rpr(self):
        """b, i, color PHẢI được giữ nguyên — đây là whitelist."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:r>'
            '    <w:rPr>'
            '      <w:b/>'
            '      <w:i/>'
            '      <w:color w:val="FF0000"/>'
            '      <w:sz w:val="26"/>'
            '    </w:rPr>'
            '    <w:t>Important</w:t>'
            '  </w:r>'
            '</w:p>'
        )
        cleaned_buf, report = DocxCleanerService.clean(_build_minimal_docx(body))
        root = _parse_document_xml_from_bytes(cleaned_buf.read())
        rPr = root.find('.//' + _wt('rPr'))

        self.assertIsNotNone(rPr, "rPr bị xóa nhầm — vẫn còn b/i/color")
        self.assertIsNotNone(rPr.find(_wt('b')),     "b (bold) bị strip nhầm!")
        self.assertIsNotNone(rPr.find(_wt('i')),     "i (italic) bị strip nhầm!")
        self.assertIsNotNone(rPr.find(_wt('color')), "color bị strip nhầm!")
        self.assertIsNone(rPr.find(_wt('sz')),       "sz phải bị strip")
        self.assertEqual(report.sz_stripped, 1)

    def test_preserves_numpr_in_ppr(self):
        """numPr (cấu trúc đánh số) PHẢI được giữ nguyên."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:pPr>'
            '    <w:pStyle w:val="ListParagraph"/>'
            '    <w:numPr>'
            '      <w:ilvl w:val="0"/>'
            '      <w:numId w:val="24"/>'
            '    </w:numPr>'
            '    <w:jc w:val="both"/>'
            '    <w:spacing w:line="360" w:lineRule="auto"/>'
            '  </w:pPr>'
            '  <w:r><w:t>I. Thong tin</w:t></w:r>'
            '</w:p>'
        )
        cleaned_buf, report = DocxCleanerService.clean(_build_minimal_docx(body))
        root = _parse_document_xml_from_bytes(cleaned_buf.read())
        pPr = root.find('.//' + _wt('pPr'))

        self.assertIsNotNone(pPr.find(_wt('numPr')),  "numPr bị strip nhầm!")
        self.assertIsNone(pPr.find(_wt('jc')),        "jc phải bị strip")
        self.assertIsNone(pPr.find(_wt('spacing')),   "spacing phải bị strip")
        self.assertEqual(report.jc_stripped, 1)
        self.assertEqual(report.spacing_stripped, 1)

    def test_preserves_gridspan_and_vmerge_in_table(self):
        """gridSpan và vMerge (ô bảng merge) PHẢI được giữ nguyên."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:tr>'
            '    <w:tc>'
            '      <w:tcPr><w:gridSpan w:val="3"/></w:tcPr>'
            '      <w:p>'
            '        <w:pPr><w:jc w:val="center"/></w:pPr>'
            '        <w:r><w:rPr><w:sz w:val="26"/></w:rPr><w:t>Merged</w:t></w:r>'
            '      </w:p>'
            '    </w:tc>'
            '    <w:tc>'
            '      <w:tcPr><w:vMerge w:val="restart"/></w:tcPr>'
            '      <w:p><w:r><w:t>Cell</w:t></w:r></w:p>'
            '    </w:tc>'
            '  </w:tr>'
            '</w:tbl>'
        )
        cleaned_buf, report = DocxCleanerService.clean(_build_minimal_docx(body))
        root = _parse_document_xml_from_bytes(cleaned_buf.read())

        self.assertIsNotNone(root.find('.//' + _wt('gridSpan')), "gridSpan bị strip nhầm!")
        self.assertIsNotNone(root.find('.//' + _wt('vMerge')),   "vMerge bị strip nhầm!")
        self.assertEqual(report.sz_stripped, 1)
        self.assertEqual(report.jc_stripped, 1)

    def test_clean_already_clean_file_returns_zero_report(self):
        """File không có direct formatting → report total = 0."""
        from handlers.docx_cleaner import DocxCleanerService
        body = (
            '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            '  <w:pPr><w:pStyle w:val="Normal"/></w:pPr>'
            '  <w:r><w:t>Clean</w:t></w:r>'
            '</w:p>'
        )
        _, report = DocxCleanerService.clean(_build_minimal_docx(body))
        self.assertEqual(report.total_stripped, 0)
        self.assertEqual(report.empty_rpr_removed, 0)

    def test_output_is_valid_zip_with_document_xml(self):
        """File đầu ra phải là ZIP hợp lệ chứa word/document.xml."""
        from handlers.docx_cleaner import DocxCleanerService
        body = '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'
        cleaned_buf, _ = DocxCleanerService.clean(_build_minimal_docx(body))
        with zipfile.ZipFile(cleaned_buf) as z:
            self.assertIn('word/document.xml', z.namelist())

    def test_clean_real_template_file(self):
        """Integration test: Chạy trên file template_master_final.docx thật."""
        import os
        from handlers.docx_cleaner import DocxCleanerService

        template_path = os.path.join(
            os.path.dirname(__file__),
            '..', 'media', 'templates', 'docx', 'template_master_final.docx'
        )
        if not os.path.exists(template_path):
            self.skipTest("File template_master_final.docx không tìm thấy")

        with open(template_path, 'rb') as f:
            file_bytes = f.read()

        cleaned_buf, report = DocxCleanerService.clean(file_bytes)

        self.assertGreater(report.total_stripped, 100)
        with zipfile.ZipFile(cleaned_buf) as z:
            self.assertIn('word/document.xml', z.namelist())
        self.assertGreater(report.sz_stripped, 0)
        self.assertGreater(report.lang_stripped, 0)

_W_STYLES_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def _wts(name):
    """Helper tag builder for injector tests."""
    return f'{{{_W_STYLES_NS}}}{name}'

def _build_docx_with_styles(styles_xml_body: str) -> bytes:
    """
    Helper: Tạo DOCX tối giản với word/styles.xml tuỳ chỉnh.
    Dùng để kiểm thử StylesXmlInjector mà không cần file thật.
    """
    W = _W_STYLES_NS
    full_styles = (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:styles xmlns:w="{W}">'
        f'{styles_xml_body}'
        f'</w:styles>'
    ).encode('utf-8')

    minimal_doc = (
        f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<w:document xmlns:w="{W}"><w:body/></w:document>'
    ).encode('utf-8')

    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as z:
        z.writestr('word/document.xml', minimal_doc)
        z.writestr('word/styles.xml', full_styles)
        z.writestr('[Content_Types].xml', '<Types/>')
    return output.getvalue()

def _parse_styles_xml(docx_buf: io.BytesIO) -> etree._Element:
    """Helper: Parse word/styles.xml từ kết quả inject."""
    docx_buf.seek(0)
    with zipfile.ZipFile(docx_buf) as z:
        return etree.fromstring(z.read('word/styles.xml'))

def _find_style(root, style_id: str):
    """Helper: Tìm <w:style w:styleId='...'>."""
    for s in root.findall(_wts('style')):
        if s.get(_wts('styleId')) == style_id:
            return s
    return None

class TestStylesXmlInjector_Input(TestCase):
    """Kiểm thử validation input."""

    def test_raise_bad_zip_on_invalid_bytes(self):
        from handlers.styles_xml_injector import StylesXmlInjector
        with self.assertRaises(zipfile.BadZipFile):
            StylesXmlInjector.inject(b'invalid zip', {'named_styles': {'X': {'word_style_id': '1'}}})

    def test_raise_value_error_when_no_styles_xml(self):
        from handlers.styles_xml_injector import StylesXmlInjector
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as z:
            z.writestr('word/document.xml', '<doc/>')
        with self.assertRaises(ValueError) as ctx:
            StylesXmlInjector.inject(buf.getvalue(), {'named_styles': {'X': {'word_style_id': '1'}}})
        self.assertIn('styles.xml', str(ctx.exception))

    def test_empty_named_styles_returns_original_bytes(self):
        """block_layout rỗng → trả lại bytes gốc không thay đổi."""
        from handlers.styles_xml_injector import StylesXmlInjector
        docx = _build_docx_with_styles('<w:style w:styleId="Normal" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>')
        result = StylesXmlInjector.inject(docx, {'named_styles': {}})
        self.assertIsNotNone(result)

    def test_unknown_style_id_is_silently_skipped(self):
        """word_style_id không tồn tại trong styles.xml → bỏ qua, không crash."""
        from handlers.styles_xml_injector import StylesXmlInjector
        docx = _build_docx_with_styles(
            '<w:style xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:styleId="Normal"/>'
        )
        block_layout = {'named_styles': {'X': {'word_style_id': 'DOES_NOT_EXIST', 'font_size_pt': 13}}}
        result = StylesXmlInjector.inject(docx, block_layout)
        self.assertIsNotNone(result)

class TestStylesXmlInjector_FontAndSize(TestCase):
    """Kiểm thử inject font name và font size."""

    def _inject_and_get_rPr(self, style_id: str, config: dict):
        from handlers.styles_xml_injector import StylesXmlInjector
        W = _W_STYLES_NS
        styles_body = f'<w:style xmlns:w="{W}" w:styleId="{style_id}"><w:name w:val="test"/></w:style>'
        docx = _build_docx_with_styles(styles_body)
        block_layout = {'named_styles': {'TEST': {**config, 'word_style_id': style_id}}}
        result = StylesXmlInjector.inject(docx, block_layout)
        root = _parse_styles_xml(result)
        style_el = _find_style(root, style_id)
        return style_el.find(_wts('rPr'))

    def test_sets_font_name_on_rFonts(self):
        """font_name phải được ghi vào w:rFonts ascii/hAnsi/cs."""
        rPr = self._inject_and_get_rPr('Normal', {'font_name': 'Times New Roman'})
        rFonts = rPr.find(_wts('rFonts'))
        self.assertIsNotNone(rFonts, "w:rFonts không được tạo")
        self.assertEqual(rFonts.get(_wts('ascii')), 'Times New Roman')
        self.assertEqual(rFonts.get(_wts('hAnsi')), 'Times New Roman')
        self.assertEqual(rFonts.get(_wts('cs')), 'Times New Roman')

    def test_sets_font_size_as_half_points(self):
        """13pt → w:sz val='26', w:szCs val='26'."""
        rPr = self._inject_and_get_rPr('Normal', {'font_size_pt': 13})
        sz = rPr.find(_wts('sz'))
        szCs = rPr.find(_wts('szCs'))
        self.assertIsNotNone(sz)
        self.assertEqual(sz.get(_wts('val')), '26')
        self.assertEqual(szCs.get(_wts('val')), '26')

    def test_replaces_existing_font_size(self):
        """Size cũ trong styles.xml phải bị thay thế, không bị duplicate."""
        from handlers.styles_xml_injector import StylesXmlInjector
        W = _W_STYLES_NS
        styles_body = (
            f'<w:style xmlns:w="{W}" w:styleId="Heading2">'
            f'  <w:rPr><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>'
            f'</w:style>'
        )
        docx = _build_docx_with_styles(styles_body)
        block_layout = {'named_styles': {'H': {'word_style_id': 'Heading2', 'font_size_pt': 16}}}
        result = StylesXmlInjector.inject(docx, block_layout)
        root = _parse_styles_xml(result)
        rPr = _find_style(root, 'Heading2').find(_wts('rPr'))
        sz_elements = rPr.findall(_wts('sz'))
        self.assertEqual(len(sz_elements), 1)
        self.assertEqual(sz_elements[0].get(_wts('val')), '32')

class TestStylesXmlInjector_BoldItalic(TestCase):
    """Kiểm thử inject bold và italic."""

    def _inject_style(self, existing_rpr_body: str, config: dict):
        from handlers.styles_xml_injector import StylesXmlInjector
        W = _W_STYLES_NS
        styles_body = (
            f'<w:style xmlns:w="{W}" w:styleId="TestStyle">'
            f'  <w:rPr>{existing_rpr_body}</w:rPr>'
            f'</w:style>'
        )
        docx = _build_docx_with_styles(styles_body)
        block_layout = {'named_styles': {'T': {**config, 'word_style_id': 'TestStyle'}}}
        result = StylesXmlInjector.inject(docx, block_layout)
        root = _parse_styles_xml(result)
        return _find_style(root, 'TestStyle').find(_wts('rPr'))

    def test_adds_bold_when_true(self):
        """bold=True → w:b phải có mặt trong rPr."""
        rPr = self._inject_style('', {'bold': True})
        self.assertIsNotNone(rPr.find(_wts('b')), "w:b không được tạo")

    def test_removes_bold_when_false(self):
        """bold=False và style gốc đang có w:b → phải bị xóa."""
        W = _W_STYLES_NS
        rPr = self._inject_style(f'<w:b xmlns:w="{W}"/>', {'bold': False})
        self.assertIsNone(rPr.find(_wts('b')), "w:b không bị xóa")

    def test_adds_italic_when_true(self):
        """italic=True → w:i phải có mặt trong rPr."""
        rPr = self._inject_style('', {'italic': True})
        self.assertIsNotNone(rPr.find(_wts('i')), "w:i không được tạo")

    def test_no_bold_by_default(self):
        """Không truyền bold → không tạo w:b."""
        rPr = self._inject_style('', {'font_size_pt': 13})
        self.assertIsNone(rPr.find(_wts('b')))

class TestStylesXmlInjector_Alignment(TestCase):
    """Kiểm thử inject alignment."""

    def _inject_and_get_pPr(self, alignment: str, existing_ppr_body: str = ''):
        from handlers.styles_xml_injector import StylesXmlInjector
        W = _W_STYLES_NS
        styles_body = (
            f'<w:style xmlns:w="{W}" w:styleId="MyStyle">'
            f'  <w:pPr>{existing_ppr_body}</w:pPr>'
            f'</w:style>'
        )
        docx = _build_docx_with_styles(styles_body)
        block_layout = {'named_styles': {'X': {'word_style_id': 'MyStyle', 'alignment': alignment}}}
        result = StylesXmlInjector.inject(docx, block_layout)
        root = _parse_styles_xml(result)
        return _find_style(root, 'MyStyle').find(_wts('pPr'))

    def test_justify_maps_to_both(self):
        """JUSTIFY → w:jc val='both'."""
        pPr = self._inject_and_get_pPr('JUSTIFY')
        jc = pPr.find(_wts('jc'))
        self.assertIsNotNone(jc)
        self.assertEqual(jc.get(_wts('val')), 'both')

    def test_center_maps_to_center(self):
        """CENTER → w:jc val='center'."""
        pPr = self._inject_and_get_pPr('CENTER')
        self.assertEqual(pPr.find(_wts('jc')).get(_wts('val')), 'center')

    def test_left_maps_to_left(self):
        """LEFT → w:jc val='left'."""
        pPr = self._inject_and_get_pPr('LEFT')
        self.assertEqual(pPr.find(_wts('jc')).get(_wts('val')), 'left')

    def test_replaces_existing_alignment(self):
        """Style gốc có jc='center', inject LEFT → phải đổi thành 'left', không duplicate."""
        W = _W_STYLES_NS
        pPr = self._inject_and_get_pPr('LEFT', f'<w:jc xmlns:w="{W}" w:val="center"/>')
        jc_elements = pPr.findall(_wts('jc'))
        self.assertEqual(len(jc_elements), 1)
        self.assertEqual(jc_elements[0].get(_wts('val')), 'left')

class TestStylesXmlInjector_Spacing(TestCase):
    """Kiểm thử inject line/paragraph spacing."""

    def _inject_spacing(self, space_before=None, space_after=None, line_spacing=None):
        from handlers.styles_xml_injector import StylesXmlInjector
        W = _W_STYLES_NS
        styles_body = f'<w:style xmlns:w="{W}" w:styleId="S1"><w:name w:val="s1"/></w:style>'
        docx = _build_docx_with_styles(styles_body)
        config = {'word_style_id': 'S1'}
        if space_before is not None:
            config['space_before_pt'] = space_before
        if space_after is not None:
            config['space_after_pt'] = space_after
        if line_spacing is not None:
            config['line_spacing'] = line_spacing
        block_layout = {'named_styles': {'X': config}}
        result = StylesXmlInjector.inject(docx, block_layout)
        root = _parse_styles_xml(result)
        pPr = _find_style(root, 'S1').find(_wts('pPr'))
        return pPr.find(_wts('spacing')) if pPr is not None else None

    def test_space_before_converts_pt_to_twips(self):
        """12pt → before='240' (12 * 20 twips)."""
        spacing = self._inject_spacing(space_before=12)
        self.assertIsNotNone(spacing)
        self.assertEqual(spacing.get(_wts('before')), '240')

    def test_space_after_converts_pt_to_twips(self):
        """6pt → after='120'."""
        spacing = self._inject_spacing(space_after=6)
        self.assertEqual(spacing.get(_wts('after')), '120')

    def test_line_spacing_double_is_480(self):
        """line_spacing=2.0 → line='480', lineRule='auto'."""
        spacing = self._inject_spacing(line_spacing=2.0)
        self.assertEqual(spacing.get(_wts('line')), '480')
        self.assertEqual(spacing.get(_wts('lineRule')), 'auto')

    def test_no_spacing_element_when_not_configured(self):
        """Không truyền spacing → w:spacing không được tạo."""
        spacing = self._inject_spacing()
        self.assertIsNone(spacing)

class TestStylesXmlInjector_Integration(TestCase):
    """Integration test trên file template_master_final.docx thật."""

    def test_inject_on_real_template(self):
        """Inject block_layout vào file thật → styles.xml phải được cập nhật."""
        import os
        from handlers.styles_xml_injector import StylesXmlInjector

        template_path = os.path.join(
            os.path.dirname(__file__),
            '..', 'media', 'templates', 'docx', 'template_master_final.docx'
        )
        if not os.path.exists(template_path):
            self.skipTest("File template_master_final.docx không tìm thấy")

        with open(template_path, 'rb') as f:
            file_bytes = f.read()

        block_layout = {
            'named_styles': {
                'SYLLABUS_MAIN_HEADING': {
                    'word_style_id': 'Heading2',
                    'font_name': 'Times New Roman',
                    'font_size_pt': 14,
                    'bold': True,
                    'alignment': 'CENTER',
                },
                'SYLLABUS_LIST_ITEM': {
                    'word_style_id': '0text1',
                    'font_name': 'Times New Roman',
                    'font_size_pt': 13,
                    'bold': False,
                    'alignment': 'JUSTIFY',
                    'line_spacing': 2.0,
                },
            }
        }

        result = StylesXmlInjector.inject(file_bytes, block_layout)

        result.seek(0)
        with zipfile.ZipFile(result) as z:
            self.assertIn('word/styles.xml', z.namelist())
            styles_root = etree.fromstring(z.read('word/styles.xml'))

        heading2 = _find_style(styles_root, 'Heading2')
        self.assertIsNotNone(heading2)
        rPr = heading2.find(_wts('rPr'))
        sz = rPr.find(_wts('sz'))
        self.assertEqual(sz.get(_wts('val')), '28')

        rFonts = rPr.find(_wts('rFonts'))
        self.assertEqual(rFonts.get(_wts('ascii')), 'Times New Roman')

        text1 = _find_style(styles_root, '0text1')
        self.assertIsNotNone(text1)
        pPr = text1.find(_wts('pPr'))
        spacing = pPr.find(_wts('spacing'))
        self.assertEqual(spacing.get(_wts('line')), '480')

class TestBlockStyleDocxRenderer(TestCase):
    """Kiểm thử pipeline render DOCX của BlockStyleDocxRenderer."""

    def test_init_raises_on_empty_bytes(self):
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        with self.assertRaises(ValueError):
            BlockStyleDocxRenderer(b'')

    def test_render_raises_on_empty_syllabus(self):
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        renderer = BlockStyleDocxRenderer(b'some bytes')
        with self.assertRaises(ValueError):
            renderer.render(None)

    def test_render_real_template_with_syllabus(self):
        """Integration test: Render trên file template_master_final.docx thật."""
        import os
        from docx import Document
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        from syllabuses.models import Faculty, Subject, Lecturer, TemplateSyllabus, Syllabus, User

        template_path = os.path.join(
            os.path.dirname(__file__),
            '..', 'media', 'templates', 'docx', 'template_master_final.docx'
        )
        if not os.path.exists(template_path):
            self.skipTest("File template_master_final.docx không tìm thấy")

        with open(template_path, 'rb') as f:
            template_bytes = f.read()

        from syllabuses.models import Credit
        credit = Credit.objects.create(number_theory=2, number_practice=1, hour_self_study=60)
        user = User.objects.create(username='test_lec_renderer', email='lec@test.com')
        faculty = Faculty.objects.create(name='Khoa CNTT')
        subject = Subject.objects.create(code='IT101', name='Lập trình Web', credit=credit)
        lecturer = Lecturer.objects.create(user=user, faculty=faculty)
        template = TemplateSyllabus.objects.create(name='Template Test', version='1.0')
        syllabus = Syllabus.objects.create(
            name='Đề cương Test',
            subject=subject,
            faculty=faculty,
            lecturer=lecturer,
            template=template
        )

        block_layout = {
            'named_styles': {
                'SYLLABUS_MAIN_HEADING': {
                    'word_style_id': 'Heading2',
                    'font_name': 'Times New Roman',
                    'font_size_pt': 14,
                    'bold': True,
                    'alignment': 'CENTER',
                },
            },
            'table_structures': {
                'SYLLABUS_TABLE_HEADER': {
                    'cell_fill_hex': '003366',
                    'font_name': 'Times New Roman',
                    'font_size_pt': 12,
                    'bold': True,
                    'alignment': 'CENTER',
                },
            },
        }

        renderer = BlockStyleDocxRenderer(template_bytes, block_layout)
        output_buffer = renderer.render(syllabus)

        self.assertGreater(output_buffer.getbuffer().nbytes, 1000)
        doc = Document(output_buffer)
        self.assertIsNotNone(doc)

class TestBlockStyleValidator(TestCase):
    """Kiểm thử schema validation trong handlers.block_style_validator."""

    def test_default_layout_valid(self):
        from handlers.block_style_validator import get_default_block_layout, validate_block_layout
        layout = get_default_block_layout()
        err = validate_block_layout(layout)
        self.assertIsNone(err)

    def test_invalid_display_type(self):
        from handlers.block_style_validator import get_default_block_layout, validate_block_layout
        layout = get_default_block_layout()
        layout['section_display_types']['CREDITS'] = 'INVALID_TYPE'
        err = validate_block_layout(layout)
        self.assertIsNotNone(err)
        self.assertIn("chỉ nhận 'TABLE' hoặc 'TEXT'", err)

    def test_invalid_symbol_style(self):
        from handlers.block_style_validator import get_default_block_layout, validate_block_layout
        layout = get_default_block_layout()
        layout['symbol_style'] = 'TRIANGLE'
        err = validate_block_layout(layout)
        self.assertIsNotNone(err)
        self.assertIn("chỉ nhận 'CHECKBOX' hoặc 'RADIO'", err)

class TestBlockStyleDocxRenderer_NewFeatures(TestCase):
    """Kiểm thử tính năng mới của BlockStyleDocxRenderer: Line alignment, Display type, Symbol switch."""

    def test_symbol_replacement_radio(self):
        from docx import Document
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        doc = Document()
        p = doc.add_paragraph("Phương thức: ☐ Trực tiếp ☐ Trực tuyến ☑ Kết hợp")
        tbl = doc.add_table(rows=1, cols=1)
        tbl.rows[0].cells[0].text = "☐ Kiến thức chuyên ngành"

        buf = io.BytesIO()
        doc.save(buf)

        renderer = BlockStyleDocxRenderer(buf.getvalue(), {'symbol_style': 'RADIO'})
        out_buf = renderer._apply_custom_transforms(buf)

        res_doc = Document(out_buf)
        self.assertIn("◯ Trực tiếp", res_doc.paragraphs[0].text)
        self.assertIn("◉ Kết hợp", res_doc.paragraphs[0].text)
        self.assertIn("◯ Kiến thức chuyên ngành", res_doc.tables[0].rows[0].cells[0].text)

    def test_credits_table_to_text(self):
        from docx import Document
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        doc = Document()
        tbl = doc.add_table(rows=2, cols=4)
        tbl.rows[0].cells[0].text = "Tổng số/Total"
        tbl.rows[0].cells[1].text = "Lý thuyết"
        tbl.rows[0].cells[2].text = "Thực hành"
        tbl.rows[0].cells[3].text = "Tự học"
        tbl.rows[1].cells[0].text = "3"
        tbl.rows[1].cells[1].text = "2"
        tbl.rows[1].cells[2].text = "1"
        tbl.rows[1].cells[3].text = "90"

        buf = io.BytesIO()
        doc.save(buf)

        layout = {'section_display_types': {'CREDITS': 'TEXT'}}
        renderer = BlockStyleDocxRenderer(buf.getvalue(), layout)
        out_buf = renderer._apply_custom_transforms(buf)

        res_doc = Document(out_buf)
        self.assertEqual(len(res_doc.tables), 0)
        text_found = any("Số tín chỉ: 3" in p.text for p in res_doc.paragraphs)
        self.assertTrue(text_found)

    def test_header_line_by_line_alignment(self):
        from docx import Document
        from handlers.block_style_renderer import BlockStyleDocxRenderer
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        doc = Document()
        doc.add_paragraph("BỘ GIÁO DỤC VÀ ĐÀO TẠO")
        doc.add_paragraph("TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH")
        doc.add_paragraph("ĐỀ CƯƠNG CHI TIẾT HỌC PHẦN")

        buf = io.BytesIO()
        doc.save(buf)

        layout = {
            'named_styles': {
                'SYLLABUS_HEADER_LINE_1': {'alignment': 'CENTER'},
                'SYLLABUS_HEADER_LINE_2': {'alignment': 'RIGHT'},
                'SYLLABUS_TITLE': {'alignment': 'CENTER'},
            }
        }
        renderer = BlockStyleDocxRenderer(buf.getvalue(), layout)
        out_buf = renderer._apply_custom_transforms(buf)

        res_doc = Document(out_buf)
        self.assertEqual(res_doc.paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.CENTER)
        self.assertEqual(res_doc.paragraphs[1].alignment, WD_ALIGN_PARAGRAPH.RIGHT)
        self.assertEqual(res_doc.paragraphs[2].alignment, WD_ALIGN_PARAGRAPH.CENTER)

class TestBuildDataContext(TestCase):
    """Kiểm thử tính năng làm phẳng (flatten) dữ liệu JSON thành context dictionary."""

    def setUp(self):
        self.sample_json = {
            "id": 1,
            "name": "Đề cương chi tiết học phần CTDL & GT",
            "status": "Active",
            "main_sections": [
                {
                    "id": 1,
                    "name": "Thông tin tổng quát",
                    "code": "general_info",
                    "sub_sections": [
                        {
                            "type": "text",
                            "code": "subject_name_vi",
                            "content": "Cấu trúc dữ liệu và giải thuật",
                        },
                        {
                            "type": "text",
                            "code": "subject_code",
                            "content": "CSE101",
                        },
                        {
                            "type": "text",
                            "code": "english_title",
                            "content": "Data Structures and Algorithms - test",
                        },
                        {
                            "type": "selection",
                            "code": "teaching_methods",
                            "selected_values": [
                                {"id": 101, "name_value": "Trực tiếp (Face-to-face)"},
                                {"id": 102, "name_value": "Trực tuyến (Online)"},
                            ],
                        },
                        {
                            "type": "reference",
                            "code": "credit",
                            "reference_data": {
                                "number_theory": 4,
                                "number_practice": 2,
                                "hour_self_study": 100,
                            },
                        },
                        {
                            "type": "reference",
                            "code": "lecturer_info",
                            "reference_data": {
                                "first_name": "Trần",
                                "last_name": "Thị",
                                "email": "lecturer_201@ou.edu.vn",
                                "room": "Phòng 201",
                                "faculty": "Công nghệ",
                            },
                        },
                    ],
                },
                {
                    "id": 2,
                    "name": "Mô tả môn học",
                    "code": "course_overview",
                    "sub_sections": [
                        {
                            "type": "text",
                            "code": "course_detail",
                            "content": "Môn học cung cấp kiến thức nền tảng về tổ chức dữ liệu..",
                        }
                    ],
                },
            ],
        }

    def test_build_data_context_flattens_scalar_fields(self):
        from handlers.data_mapper import _build_data_context
        ctx = _build_data_context(self.sample_json)

        self.assertEqual(ctx.get("TEN_MON_HOC"), "Cấu trúc dữ liệu và giải thuật")
        self.assertEqual(ctx.get("SUBJECT_CODE"), "CSE101")
        self.assertEqual(ctx.get("ENGLISH_TITLE"), "Data Structures and Algorithms - test")
        self.assertEqual(ctx.get("MO_TA_MON_HOC"), "Môn học cung cấp kiến thức nền tảng về tổ chức dữ liệu..")

    def test_build_data_context_flattens_credits_and_lecturer(self):
        from handlers.data_mapper import _build_data_context
        ctx = _build_data_context(self.sample_json)

        self.assertEqual(ctx.get("SO_TIN_CHI"), "6")
        self.assertEqual(ctx.get("CREDIT_THEORY"), "4")
        self.assertEqual(ctx.get("CREDIT_PRACTICE"), "2")
        self.assertEqual(ctx.get("CREDIT_SELF_STUDY"), "100")
        self.assertEqual(ctx.get("GIANG_VIEN"), "Thị Trần")
        self.assertEqual(ctx.get("EMAIL"), "lecturer_201@ou.edu.vn")
        self.assertEqual(ctx.get("KHOA_BO_MON"), "Công nghệ")

    def test_build_data_context_with_null_and_empty(self):
        from handlers.data_mapper import _build_data_context
        self.assertEqual(_build_data_context(None), {})
        self.assertEqual(_build_data_context({}), {"SYLLABUS_NAME": "", "SYLLABUS_ID": "", "STATUS": ""})

    def test_render_populates_template_fields_with_json(self):
        from docx import Document
        from handlers.block_style_renderer import BlockStyleDocxRenderer

        doc = Document()
        doc.add_paragraph("Tên môn học tiếng Việt/ Course title in Vietnamese: MẪU CŨ")
        doc.add_paragraph("Mã môn học/Course code: OLD101")
        doc.add_paragraph("Tên môn học tiếng Anh/ Course title in English: OLD ENGLISH")
        doc.add_paragraph("Mô tả môn học/Course description: MÔ TẢ CŨ")

        tbl_credit = doc.add_table(rows=2, cols=4)
        tbl_credit.rows[0].cells[0].text = "Tổng số/Total"
        tbl_credit.rows[0].cells[1].text = "Lý thuyết"
        tbl_credit.rows[0].cells[2].text = "Thực hành"
        tbl_credit.rows[0].cells[3].text = "Tự học"
        tbl_credit.rows[1].cells[0].text = "3"
        tbl_credit.rows[1].cells[1].text = "2"
        tbl_credit.rows[1].cells[2].text = "1"
        tbl_credit.rows[1].cells[3].text = "90"

        tbl_lecturer = doc.add_table(rows=3, cols=2)
        tbl_lecturer.rows[0].cells[0].text = "Khoa/Bộ môn"
        tbl_lecturer.rows[0].cells[1].text = "Khoa Cũ"
        tbl_lecturer.rows[1].cells[0].text = "Giảng viên"
        tbl_lecturer.rows[1].cells[1].text = "Thầy Cũ"
        tbl_lecturer.rows[2].cells[0].text = "Địa chỉ email"
        tbl_lecturer.rows[2].cells[1].text = "old@ou.edu.vn"

        buf = io.BytesIO()
        doc.save(buf)

        renderer = BlockStyleDocxRenderer(buf.getvalue(), {})
        out_buf = renderer.render(syllabus=None, syllabus_json=self.sample_json)

        res_doc = Document(out_buf)
        self.assertTrue(any("Cấu trúc dữ liệu và giải thuật" in p.text for p in res_doc.paragraphs))
        self.assertTrue(any("CSE101" in p.text for p in res_doc.paragraphs))
        self.assertTrue(any("Data Structures and Algorithms - test" in p.text for p in res_doc.paragraphs))
        self.assertTrue(any("Môn học cung cấp kiến thức nền tảng về tổ chức dữ liệu.." in p.text for p in res_doc.paragraphs))

        credit_row = [c.text for c in res_doc.tables[0].rows[1].cells]
        self.assertEqual(credit_row, ["6", "4", "2", "100"])

        lecturer_table_texts = [c.text for row in res_doc.tables[1].rows for c in row.cells]
        self.assertIn("Thị Trần", lecturer_table_texts)
        self.assertIn("lecturer_201@ou.edu.vn", lecturer_table_texts)
        self.assertIn("Công nghệ", lecturer_table_texts)

class TestSubRenderers(TestCase):
    """Kiểm thử chi tiết các Sub-Renderer theo yêu cầu kiến trúc mới."""

    def test_requirement_renderer_empty_and_three_subjects(self):
        from docx import Document
        from handlers.renderers.complex.requirement_renderer import RequirementSubRenderer

        doc = Document()
        tbl = doc.add_table(rows=2, cols=3)
        tbl.rows[0].cells[0].text = "STT/No."
        tbl.rows[0].cells[1].text = "Môn học điều kiện/ Requirements"
        tbl.rows[0].cells[2].text = "Mã môn học/Code"
        tbl.rows[1].cells[0].text = "1."
        tbl.rows[1].cells[1].text = "Môn cũ"
        tbl.rows[1].cells[2].text = "OLD"

        renderer = RequirementSubRenderer()

        sub_empty = {"code": "requirement_subject", "reference_data": []}
        renderer.render(doc, sub_empty, {})
        self.assertEqual(len(tbl.rows), 2)
        self.assertEqual(tbl.rows[1].cells[0].text, "1")
        self.assertIn("Không có", tbl.rows[1].cells[1].text)

        sub_3 = {
            "code": "requirement_subject",
            "reference_data": [
                {"subject_name": "Nhập môn Lập trình", "subject_code": "PRG101", "requirement_type": {"name": "Tiên quyết"}},
                {"subject_name": "Cơ sở dữ liệu", "subject_code": "DBM201", "requirement_type": {"name": "Học trước"}},
                {"subject_name": "Phát triển web", "subject_code": "WEB101", "requirement_type": {"name": "Song hành"}},
            ],
        }
        renderer.render(doc, sub_3, {})
        self.assertEqual(len(tbl.rows), 4)
        self.assertEqual(tbl.rows[1].cells[0].text, "1")
        self.assertIn("Nhập môn Lập trình", tbl.rows[1].cells[1].text)
        self.assertEqual(tbl.rows[1].cells[2].text, "PRG101")
        self.assertEqual(tbl.rows[2].cells[0].text, "2")
        self.assertIn("Cơ sở dữ liệu", tbl.rows[2].cells[1].text)
        self.assertEqual(tbl.rows[2].cells[2].text, "DBM201")
        self.assertEqual(tbl.rows[3].cells[0].text, "3")
        self.assertIn("Phát triển web", tbl.rows[3].cells[1].text)
        self.assertEqual(tbl.rows[3].cells[2].text, "WEB101")

    def test_clo_renderer_clones_correct_number_of_rows(self):
        from docx import Document
        from handlers.renderers.complex.clo_renderer import CLOSubRenderer

        doc = Document()
        tbl = doc.add_table(rows=2, cols=3)
        tbl.rows[0].cells[0].text = "Mục tiêu môn học"
        tbl.rows[0].cells[1].text = "CĐR môn học (CLO)"
        tbl.rows[0].cells[2].text = "Mô tả CĐR"
        tbl.rows[1].cells[0].text = "CO1"
        tbl.rows[1].cells[1].text = "CLO1"
        tbl.rows[1].cells[2].text = "Mô tả cũ"

        sub_clos = {
            "code": "course_learning_outcomes",
            "reference_data": [
                {
                    "id": 1,
                    "clos": [
                        {"content": "CLO 1 nội dung"},
                        {"content": "CLO 2 nội dung"},
                        {"content": "CLO 3 nội dung"},
                        {"content": "CLO 4 nội dung"},
                    ],
                },
                {
                    "id": 2,
                    "clos": [
                        {"content": "CLO 5 nội dung"},
                        {"content": "CLO 6 nội dung"},
                    ],
                },
            ],
        }
        renderer = CLOSubRenderer()
        renderer.render(doc, sub_clos, {})

        self.assertEqual(len(tbl.rows), 7)
        self.assertEqual(tbl.rows[1].cells[1].text, "CLO1")
        self.assertEqual(tbl.rows[4].cells[1].text, "CLO4")
        self.assertEqual(tbl.rows[5].cells[1].text, "CLO5")
        self.assertEqual(tbl.rows[6].cells[1].text, "CLO6")

    def test_schedule_renderer_distinguishes_groups(self):
        from docx import Document
        from handlers.renderers.complex.schedule_renderer import ScheduleSubRenderer

        doc = Document()
        p_morning = doc.add_paragraph("Kế hoạch học tập - Lớp buổi sáng")
        tbl_morning = doc.add_table(rows=2, cols=3)
        tbl_morning.rows[0].cells[0].text = "Buổi"
        tbl_morning.rows[0].cells[1].text = "Nội dung"
        tbl_morning.rows[0].cells[2].text = "CLO"

        p_evening = doc.add_paragraph("Kế hoạch học tập - Lớp buổi tối")
        tbl_evening = doc.add_table(rows=2, cols=3)
        tbl_evening.rows[0].cells[0].text = "Buổi"
        tbl_evening.rows[0].cells[1].text = "Nội dung"
        tbl_evening.rows[0].cells[2].text = "CLO"

        p_practice = doc.add_paragraph("Kế hoạch học tập - Thực hành")
        tbl_practice = doc.add_table(rows=2, cols=3)
        tbl_practice.rows[0].cells[0].text = "Buổi"
        tbl_practice.rows[0].cells[1].text = "Nội dung"
        tbl_practice.rows[0].cells[2].text = "CLO"

        sub_schedule = {
            "code": "teaching_schedule",
            "reference_data": [
                {"session_no": 1, "content": "Nội dung sáng 1", "schedule_group": {"name": "Lớp buổi sáng"}},
                {"session_no": 2, "content": "Nội dung sáng 2", "schedule_group": {"name": "Lớp buổi sáng"}},
                {"session_no": 1, "content": "Nội dung tối 1", "schedule_group": {"name": "Lớp buổi tối"}},
                {"session_no": 1, "content": "Nội dung thực hành 1", "schedule_group": {"name": "Thực hành"}},
            ],
        }

        renderer = ScheduleSubRenderer()
        renderer.render(doc, sub_schedule, {})

        self.assertEqual(len(tbl_morning.rows), 3)
        self.assertIn("Nội dung sáng 1", tbl_morning.rows[1].cells[1].text)
        self.assertIn("Nội dung sáng 2", tbl_morning.rows[2].cells[1].text)

        self.assertEqual(len(tbl_evening.rows), 2)
        self.assertIn("Nội dung tối 1", tbl_evening.rows[1].cells[1].text)

        self.assertEqual(len(tbl_practice.rows), 2)
        self.assertIn("Nội dung thực hành 1", tbl_practice.rows[1].cells[1].text)

    def test_schedule_renderer_11_columns_and_total(self):
        from docx import Document
        from handlers.renderers.complex.schedule_renderer import ScheduleSubRenderer

        doc = Document()
        doc.add_paragraph("Kế hoạch học tập - Lớp buổi sáng")
        tbl = doc.add_table(rows=6, cols=11)
        for r in range(4):
            tbl.rows[r].cells[0].text = "Header"
        tbl.rows[4].cells[0].text = "(1)"
        tbl.rows[4].cells[1].text = "(2)"
        tbl.rows[4].cells[2].text = "(3)"
        tbl.rows[4].cells[3].text = "(4)"
        tbl.rows[4].cells[5].text = "(5)"
        tbl.rows[4].cells[7].text = "(6)"
        tbl.rows[4].cells[9].text = "(7)"
        tbl.rows[4].cells[10].text = "(8)"
        tbl.rows[5].cells[0].text = "Tổng cộng/Total"

        sub_schedule = {
            "code": "teaching_schedule",
            "reference_data": [
                {
                    "schedule_group": {"name": "Lớp buổi sáng"},
                    "teaching_sessions": [
                        {
                            "session_no": 1,
                            "content": "Chương 1. Tổng quan",
                            "course_learning_outcomes": [{"position": 1}, {"position": 2}],
                            "self_study_activity": "Xem bài giảng LMS",
                            "self_study_hours": 11,
                            "offline_activity": "Thuyết giảng",
                            "offline_hours": 10,
                            "online_activity": "",
                            "online_hours": 0,
                            "assessments": [{"name": "A2.1"}, {"name": "A3.1"}],
                            "learning_materials": [{"name": "1"}, {"name": "2"}],
                        },
                        {
                            "session_no": 2,
                            "content": "Chương 2. Mẫu kiến tạo",
                            "course_learning_outcomes": [{"position": 3}],
                            "self_study_activity": "Làm trắc nghiệm",
                            "self_study_hours": 12,
                            "offline_activity": "Thực hành",
                            "offline_hours": 10,
                            "online_activity": "",
                            "online_hours": 0,
                            "assessments": [{"name": "A2.1"}],
                            "learning_materials": [{"name": "1"}],
                        },
                    ],
                }
            ],
        }

        renderer = ScheduleSubRenderer()
        renderer.render(doc, sub_schedule, {})

        self.assertEqual(len(tbl.rows), 8)
        self.assertEqual(tbl.rows[5].cells[0].text, "1")
        self.assertEqual(tbl.rows[5].cells[1].text, "Chương 1. Tổng quan")
        self.assertIn("1\n2", tbl.rows[5].cells[2].text)
        self.assertEqual(tbl.rows[5].cells[3].text, "Xem bài giảng LMS")
        self.assertEqual(tbl.rows[5].cells[4].text, "11")
        self.assertEqual(tbl.rows[5].cells[5].text, "Thuyết giảng")
        self.assertEqual(tbl.rows[5].cells[6].text, "10")
        self.assertIn("A2.1\nA3.1", tbl.rows[5].cells[9].text)
        self.assertEqual(tbl.rows[5].cells[10].text, "[1][2]")

        self.assertIn("Tổng cộng", tbl.rows[7].cells[0].text)
        self.assertEqual(tbl.rows[7].cells[4].text, "23")
        self.assertEqual(tbl.rows[7].cells[6].text, "20")

    def test_schedule_renderer_landscape_section(self):
        from docx import Document
        from docx.enum.section import WD_ORIENT
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        doc.add_paragraph("Nội dung mục trước")
        block = TemplateBlock(code="teaching_schedule", name="Kế hoạch giảng dạy chi tiết", block_type="reference")
        sub_map = {
            "teaching_schedule": {
                "code": "teaching_schedule",
                "reference_data": [
                    {"session_no": 1, "content": "Bài 1", "schedule_group": {"name": "Lớp buổi sáng"}},
                ],
            }
        }
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=sub_map)
        doc.add_paragraph("Nội dung mục sau")

        self.assertGreaterEqual(len(doc.sections), 3)
        self.assertEqual(doc.sections[0].orientation, WD_ORIENT.PORTRAIT)
        self.assertEqual(doc.sections[1].orientation, WD_ORIENT.LANDSCAPE)
        self.assertEqual(doc.sections[2].orientation, WD_ORIENT.PORTRAIT)
        self.assertAlmostEqual(doc.sections[1].page_width.mm, 297, delta=1)
        self.assertAlmostEqual(doc.sections[1].page_height.mm, 210, delta=1)

    def test_schedule_renderer_custom_columns(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="teaching_schedule", name="Kế hoạch giảng dạy chi tiết", block_type="reference")
        sub_map = {
            "teaching_schedule": {
                "code": "teaching_schedule",
                "reference_data": [
                    {"session_no": 1, "content": "Bài 1", "schedule_group": {"name": "Lớp buổi sáng"}},
                    {"session_no": 2, "content": "Bài 2", "schedule_group": {"name": "Lớp buổi sáng"}},
                ],
            }
        }
        custom_cols = [
            {"column_key": "custom_teaching_schedule_001", "column_label": "Ghi chú GV", "column_type": "text", "default_value": "Lưu ý"},
        ]
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=sub_map, custom_columns=custom_cols)

        self.assertGreater(len(doc.tables), 0)
        tbl = doc.tables[0]
        self.assertEqual(len(tbl.columns), 12)
        self.assertEqual(tbl.rows[0].cells[11].text, "Ghi chú GV")
        self.assertEqual(tbl.rows[3].cells[11].text, "(12)")
        self.assertEqual(tbl.rows[4].cells[11].text, "Lưu ý")
        self.assertEqual(tbl.rows[5].cells[11].text, "Lưu ý")
        self.assertEqual(tbl.rows[6].cells[11].text, "x")

    def test_cell_alignments_override_table_and_column(self):
        from docx import Document
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from handlers.docx_renderer.style_manager import StyleManager

        doc = Document()
        tbl = doc.add_table(rows=3, cols=3)
        for r in range(3):
            for c in range(3):
                tbl.cell(r, c).text = f"Cell {r},{c}"

        block = TemplateBlock(
            code="test_table",
            name="Bảng kiểm thử",
            block_type="table",
            config={
                "column_styles": {
                    "0": {"alignment": "LEFT"},
                    "1": {"alignment": "CENTER"},
                },
                "cell_alignments": {
                    "0,0": "RIGHT",
                    "2,1": "JUSTIFY",
                    "-1,2": "RIGHT",
                },
            },
        )
        content_style = {"alignment": "LEFT"}
        StyleManager._format_single_table(tbl, block, None, content_style=content_style)

        self.assertEqual(tbl.cell(0, 0).paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.RIGHT)
        self.assertEqual(tbl.cell(1, 0).paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.LEFT)
        self.assertEqual(tbl.cell(1, 1).paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.CENTER)
        self.assertEqual(tbl.cell(2, 1).paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.JUSTIFY)
        self.assertEqual(tbl.cell(2, 2).paragraphs[0].alignment, WD_ALIGN_PARAGRAPH.RIGHT)


class ShellDocxRendererTestCase(TestCase):
    """Bộ kiểm thử cho HeaderFooterRenderer và ShellDocxRenderer (Giai đoạn 1)."""

    def setUp(self):
        self.template = TemplateSyllabus.objects.create(
            name="Template Test V3",
            version="v3.0",
        )
        TemplateBlock.objects.create(
            template=self.template,
            code="BLOCK_001",
            name="Tên môn học tiếng Việt",
            block_type="text",
            xml_template='<w:p><w:r><w:t>{{subject_name_vi}}</w:t></w:r></w:p>',
            position=1,
            is_active=True,
        )

    def test_header_footer_renderer(self):
        from handlers.header_footer_renderer import HeaderFooterRenderer
        doc = Document()
        renderer = HeaderFooterRenderer()
        renderer.render_header(doc)
        renderer.render_footer(doc)

        all_text = " ".join(p.text for p in doc.paragraphs)
        self.assertIn("BỘ GIÁO DỤC VÀ ĐÀO TẠO", all_text)
        self.assertIn("TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH", all_text)
        self.assertIn("ĐỀ CƯƠNG MÔN HỌC", all_text)
        self.assertIn("Thành phố Hồ Chí Minh", all_text)
        self.assertGreater(len(doc.tables), 0)

    def test_shell_docx_renderer(self):
        from handlers.shell_renderer import ShellDocxRenderer
        renderer = ShellDocxRenderer()
        data = {"subject_name_vi": "Kiến trúc Phần mềm"}
        buf = renderer.render(self.template, data_context=data)

        self.assertGreater(len(buf.getvalue()), 0)
        out_doc = Document(buf)
        found = any("Kiến trúc Phần mềm" in p.text for p in out_doc.paragraphs)
        self.assertTrue(found)

    def test_shell_docx_renderer_with_reference_blocks(self):
        from handlers.shell_renderer import ShellDocxRenderer
        TemplateBlock.objects.create(
            template=self.template,
            code="BLOCK_009",
            name="Số tín chỉ / Credits",
            block_type="reference",
            config={"code": "credit"},
            position=2,
            is_active=True,
        )
        renderer = ShellDocxRenderer()
        data = {
            "credit": {
                "number_theory": 3,
                "number_practice": 1,
                "hour_self_study": 90,
            }
        }
        buf = renderer.render(self.template, data_context=data)
        out_doc = Document(buf)
        credit_tables = [
            t for t in out_doc.tables
            if any("tổng số" in c.text.lower() for c in t.rows[0].cells)
        ]
        self.assertEqual(len(credit_tables), 1)
        row1_vals = [c.text.strip() for c in credit_tables[0].rows[1].cells]
        self.assertEqual(row1_vals, ["4", "3", "1", "90"])


class TemplateBackendAPIsTestCase(TestCase):
    """Bộ kiểm thử cho Giai đoạn 3: Backend APIs (Blocks, Custom Columns, Custom Values, Header/Footer, Preview, Export)."""

    def setUp(self):
        self.client = APIClient()
        self.specialist = User.objects.create_user(
            username="specialist_v3",
            password="Password123@",
            user_role="specialist",
        )
        self.client.force_authenticate(user=self.specialist)
        self.template = TemplateSyllabus.objects.create(
            name="Template Test APIs V3",
            version="v3.0",
        )
        self.faculty = Faculty.objects.create(name="Khoa Công nghệ Thông tin")
        self.lecturer = Lecturer.objects.create(user=self.specialist, faculty=self.faculty)
        self.credit = Credit.objects.create(number_theory=3, number_practice=1, hour_self_study=90)
        self.subject = Subject.objects.create(name="Lập trình Python", code="PYT101", credit=self.credit)
        self.syllabus = Syllabus.objects.create(
            name="Đề cương Python",
            template=self.template,
            subject=self.subject,
            faculty=self.faculty,
            lecturer=self.lecturer,
        )

    def test_blocks_api_list_and_create(self):
        url = f"/templates/{self.template.id}/blocks/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

        create_data = {
            "code": "BLOCK_001",
            "name": "Tên môn học tiếng Việt",
            "block_type": "text",
            "xml_template": "<w:p><w:r><w:t>{{name}}</w:t></w:r></w:p>",
            "position": 1,
        }
        post_resp = self.client.post(url, create_data, format="json")
        self.assertEqual(post_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post_resp.data["code"], "BLOCK_001")

    def test_blocks_api_bulk_reorder(self):
        b1 = TemplateBlock.objects.create(template=self.template, code="B1", name="B1", block_type="text", position=1)
        b2 = TemplateBlock.objects.create(template=self.template, code="B2", name="B2", block_type="text", position=2)
        url = f"/templates/{self.template.id}/blocks/"
        resp = self.client.post(url, {"blocks": [{"id": b1.id, "position": 2}, {"id": b2.id, "position": 1}]}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        b1.refresh_from_db()
        b2.refresh_from_db()
        self.assertEqual(b1.position, 2)
        self.assertEqual(b2.position, 1)

    def test_custom_columns_api_create_and_limit_10(self):
        url = f"/templates/{self.template.id}/custom-columns/"
        data = {
            "table_code": "credit",
            "column_label": "Số buổi học",
            "column_type": "int",
        }
        resp = self.client.post(url, data, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["column_key"], "custom_credit_001")

        for i in range(2, 11):
            CustomColumn.objects.create(
                template=self.template,
                table_code="credit",
                column_key=f"custom_credit_{i:03d}",
                column_label=f"Cột {i}",
            )

        resp_limit = self.client.post(url, data, format="json")
        self.assertEqual(resp_limit.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("10 cột", resp_limit.data.get("error", ""))

    def test_header_footer_api(self):
        url = f"/templates/{self.template.id}/header-footer/"
        get_resp = self.client.get(url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)

        patch_data = {
            "header": {"title": "TRƯỜNG ĐẠI HỌC MỞ TP.HCM"},
            "footer": {"date_line": {"text": "TP.HCM, 2026"}},
        }
        patch_resp = self.client.patch(url, patch_data, format="json")
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.template.refresh_from_db()
        self.assertEqual(self.template.block_layout["header_footer"]["header"]["title"], "TRƯỜNG ĐẠI HỌC MỞ TP.HCM")

    def test_syllabus_custom_values_api(self):
        col = CustomColumn.objects.create(
            template=self.template,
            table_code="credit",
            column_key="custom_credit_001",
            column_label="Số buổi",
        )
        url = f"/syllabuses/{self.syllabus.id}/custom-values/"
        post_data = {
            "values": [
                {"column_id": col.id, "object_id": "1", "value": "15"}
            ]
        }
        post_resp = self.client.post(url, post_data, format="json")
        self.assertEqual(post_resp.status_code, status.HTTP_200_OK)

        get_resp = self.client.get(url)
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_resp.data), 1)
        self.assertEqual(get_resp.data[0]["value"], "15")

    def test_lecturer_can_fetch_custom_columns(self):
        lecturer_user = User.objects.create_user(
            username="lecturer_custom_cols",
            password="Password123@",
            user_role="lecturer",
        )
        CustomColumn.objects.create(
            template=self.template,
            table_code="credit",
            column_key="custom_credit_002",
            column_label="Ghi chú tín chỉ",
        )
        self.client.force_authenticate(user=lecturer_user)
        url = f"/templates/{self.template.id}/custom-columns/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(len(resp.data) >= 1)

    def test_preview_template_endpoint(self):
        url = f"/templates/{self.template.id}/preview/"
        resp = self.client.post(url, {}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("preview_url", resp.data)

    def test_export_syllabus_with_blocks(self):
        TemplateBlock.objects.create(
            template=self.template,
            code="BLOCK_001",
            name="Tên môn học tiếng Việt",
            block_type="text",
            xml_template="<w:p><w:r><w:t>{{subject_name_vi}}</w:t></w:r></w:p>",
            position=1,
        )
        url = f"/export-syllabus/{self.syllabus.id}/"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp["Content-Type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")


class TemplateBlockStyleHelpersTestCase(TestCase):
    """Bộ kiểm thử cho các hàm tiện ích style XML và chuyển đổi số La Mã."""

    def test_to_roman_standard_and_extended(self):
        self.assertEqual(_to_roman(1), "I")
        self.assertEqual(_to_roman(4), "IV")
        self.assertEqual(_to_roman(9), "IX")
        self.assertEqual(_to_roman(10), "X")
        self.assertEqual(_to_roman(11), "XI")
        self.assertEqual(_to_roman(14), "XIV")
        self.assertEqual(_to_roman(20), "XX")

    def test_apply_style_guard_clause_empty_styles(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        self.assertEqual(ShellDocxRenderer._apply_style_to_xml(sample_xml, {}, {}), sample_xml)
        self.assertEqual(ShellDocxRenderer._apply_style_to_xml(sample_xml, None, None), sample_xml)
        self.assertEqual(ShellDocxRenderer._apply_style_to_xml("", {"bold": True}), "")

    def test_apply_style_font_and_size_and_underline(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        out = ShellDocxRenderer._apply_style_to_xml(
            sample_xml,
            {"font_name": "Times New Roman", "font_size_pt": 14, "underline": True}
        )
        self.assertIn('w:ascii="Times New Roman"', out)
        self.assertIn('w:hAnsi="Times New Roman"', out)
        self.assertIn('w:cs="Times New Roman"', out)
        self.assertIn('<w:sz w:val="28"', out)
        self.assertIn('<w:szCs w:val="28"', out)
        self.assertIn('<w:u w:val="single"', out)

    def test_apply_style_bold_italic_toggle(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        out = ShellDocxRenderer._apply_style_to_xml(
            sample_xml,
            {"bold": True, "italic": False}
        )
        self.assertIn('<w:b', out)
        self.assertNotIn('<w:i', out)

    def test_apply_style_alignment_and_spacing(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        out = ShellDocxRenderer._apply_style_to_xml(
            sample_xml,
            {
                "alignment": "center",
                "line_spacing": 1.5,
                "space_before_pt": 6,
                "space_after_pt": 12,
            }
        )
        self.assertIn('<w:jc w:val="center"', out)
        self.assertIn('w:line="360"', out)
        self.assertIn('w:lineRule="auto"', out)
        self.assertIn('w:before="120"', out)
        self.assertIn('w:after="240"', out)

    def test_apply_style_justify_maps_to_both(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        out = ShellDocxRenderer._apply_style_to_xml(sample_xml, {"alignment": "justify"})
        self.assertIn('<w:jc w:val="both"', out)

    def test_apply_style_cascade_priority(self):
        sample_xml = '<w:p><w:r><w:t>Testing</w:t></w:r></w:p>'
        fallback = {"font_name": "Calibri", "font_size_pt": 11, "bold": False}
        block_cfg = {"font_size_pt": 13, "bold": True}
        out = ShellDocxRenderer._apply_style_to_xml(sample_xml, block_cfg, fallback)
        self.assertIn('w:ascii="Calibri"', out)
        self.assertIn('<w:sz w:val="26"', out)
        self.assertIn('<w:b', out)

    def test_apply_style_table_xml_support(self):
        tbl_xml = '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell 1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
        out = ShellDocxRenderer._apply_style_to_xml(tbl_xml, {"font_name": "Arial", "font_size_pt": 10})
        self.assertIn('w:ascii="Arial"', out)
        self.assertIn('<w:sz w:val="20"', out)

    def test_render_block_with_empty_style_receives_syllabus_body(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="TXT_01",
            name="Text 1",
            block_type="text",
            xml_template="<w:p><w:r><w:t>{{subject_code}}</w:t></w:r></w:p>",
            style_config={},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_BODY": {"font_name": "Times New Roman", "font_size_pt": 12}
            }
        }
        renderer._render_block(doc, block, {"subject_code": "IT101"}, block_layout)
        p = doc.paragraphs[-1]
        self.assertIn("IT101", p.text)
        xml = p._p.xml
        self.assertIn('w:ascii="Times New Roman"', xml)
        self.assertIn('<w:sz w:val="24"', xml)

    def test_render_block_with_custom_style_overrides_syllabus_body(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="TXT_02",
            name="Text 2",
            block_type="text",
            xml_template="<w:p><w:r><w:t>Custom</w:t></w:r></w:p>",
            style_config={"font_size_pt": 16, "bold": True},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_BODY": {"font_name": "Times New Roman", "font_size_pt": 12, "bold": False}
            }
        }
        renderer._render_block(doc, block, {}, block_layout)
        p = doc.paragraphs[-1]
        xml = p._p.xml
        self.assertIn('w:ascii="Times New Roman"', xml)
        self.assertIn('<w:sz w:val="32"', xml)
        self.assertIn('<w:b', xml)

    def test_render_reference_block_title_styling(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="credit",
            name="1. Số tín chỉ",
            block_type="reference",
            style_config={},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Calibri", "font_size_pt": 13, "italic": True}
            }
        }
        sub_sections_map = {"credit": {"type": "reference", "code": "credit", "reference_data": {}}}
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        title_p = doc.paragraphs[0]
        self.assertEqual(title_p.text, "1. Số tín chỉ")
        xml = title_p._p.xml
        self.assertIn('w:ascii="Calibri"', xml)
        self.assertIn('<w:sz w:val="26"', xml)
        self.assertIn('<w:i', xml)
        self.assertIn('<w:b', xml)

    def test_reference_block_credit_paragraphs_styled(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="lecturer_info",
            name="2. Lecturer Information",
            block_type="reference",
            style_config={"font_name": "Calibri", "font_size_pt": 11, "italic": True},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Arial", "font_size_pt": 14, "bold": True},
                "SYLLABUS_BODY": {"font_name": "Times New Roman", "font_size_pt": 10},
            }
        }
        sub_sections_map = {
            "lecturer_info": {
                "type": "reference",
                "code": "lecturer_info",
                "reference_data": {
                    "first_name": "Nam",
                    "last_name": "Nguyen",
                    "email": "nam@example.com",
                    "room": "A101",
                    "faculty": "CNTT",
                },
            }
        }
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        self.assertGreater(len(doc.paragraphs), 1)
        for p in doc.paragraphs[1:]:
            xml = p._p.xml
            self.assertIn('w:ascii="Calibri"', xml)
            self.assertIn('<w:sz w:val="22"', xml)
            self.assertIn('<w:i', xml)

    def test_reference_block_empty_output_no_crash(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="non_existent_code",
            name="Empty Ref Block",
            block_type="reference",
            style_config={},
        )
        block_layout = {"named_styles": {}}
        renderer._render_block(doc, block, {}, block_layout, {})
        self.assertEqual(len(doc.paragraphs), 1)
        self.assertEqual(doc.paragraphs[0].text, "Empty Ref Block")

    def test_reference_block_credit_header_styled(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="credit",
            name="1. Số tín chỉ",
            block_type="reference",
            style_config={"font_name": "Calibri", "font_size_pt": 11},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Arial", "font_size_pt": 14, "bold": True},
                "SYLLABUS_TABLE_HEADER": {"font_name": "Arial", "font_size_pt": 10, "bold": True, "alignment": "center"},
                "SYLLABUS_TABLE_BODY": {"font_name": "Times New Roman", "font_size_pt": 10},
            }
        }
        sub_sections_map = {
            "credit": {
                "type": "reference",
                "code": "credit",
                "reference_data": {"number_theory": 2, "number_practice": 1, "hour_self_study": 30},
            }
        }
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        self.assertGreater(len(doc.tables), 0)
        table = doc.tables[0]
        header_p = table.rows[0].cells[0].paragraphs[0]
        xml = header_p._p.xml
        self.assertIn('w:ascii="Arial"', xml)
        self.assertIn('<w:jc w:val="center"', xml)
        self.assertIn('<w:b', xml)

    def test_reference_block_credit_body_styled(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="credit",
            name="1. Số tín chỉ",
            block_type="reference",
            style_config={"font_name": "Calibri", "font_size_pt": 11},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Arial", "font_size_pt": 14, "bold": True},
                "SYLLABUS_TABLE_HEADER": {"font_name": "Arial", "font_size_pt": 10, "bold": True},
                "SYLLABUS_TABLE_BODY": {"font_name": "Times New Roman", "font_size_pt": 10},
            }
        }
        sub_sections_map = {
            "credit": {
                "type": "reference",
                "code": "credit",
                "reference_data": {"number_theory": 2, "number_practice": 1, "hour_self_study": 30},
            }
        }
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        self.assertGreater(len(doc.tables), 0)
        table = doc.tables[0]
        body_p = table.rows[1].cells[0].paragraphs[0]
        xml = body_p._p.xml
        self.assertIn('w:ascii="Calibri"', xml)
        self.assertIn('<w:sz w:val="22"', xml)

    def test_reference_block_nested_table_not_touched(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        table = doc.add_table(rows=2, cols=2)
        cell = table.rows[1].cells[1]
        nested = cell.add_table(rows=1, cols=1)
        nested_p = nested.rows[0].cells[0].paragraphs[0]
        nested_r = nested_p.add_run("Nested Content")
        nested_r.font.name = "Courier New"
        block = TemplateBlock(code="tbl", name="Outer Table", style_config={"font_name": "Calibri"})
        block_layout = {
            "named_styles": {
                "SYLLABUS_TABLE_HEADER": {"font_name": "Arial"},
                "SYLLABUS_TABLE_BODY": {"font_name": "Times New Roman"},
            }
        }
        renderer._format_tables([table], block, block_layout)
        nested_xml = nested_p._p.xml
        self.assertNotIn('w:ascii="Calibri"', nested_xml)
        self.assertNotIn('w:ascii="Times New Roman"', nested_xml)

    def test_reference_block_column_styles_override_block_and_named_styles(self):
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="credit",
            name="1. Số tín chỉ",
            block_type="reference",
            config={
                "code": "credit",
                "column_styles": {
                    "credit_total": {"align": "CENTER", "bold": True, "font_name": "Arial"},
                },
            },
            style_config={"font_name": "Calibri", "alignment": "left", "bold": False},
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Arial", "font_size_pt": 14, "bold": True},
                "SYLLABUS_TABLE_HEADER": {"font_name": "Arial", "font_size_pt": 10, "bold": True},
                "SYLLABUS_TABLE_BODY": {"font_name": "Times New Roman", "font_size_pt": 10},
            }
        }
        sub_sections_map = {
            "credit": {
                "type": "reference",
                "code": "credit",
                "reference_data": {"number_theory": 2, "number_practice": 1, "hour_self_study": 30},
            }
        }
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        table = doc.tables[0]
        # Col 0 (credit_total) should have column_styles applied
        col0_p = table.rows[1].cells[0].paragraphs[0]
        xml0 = col0_p._p.xml
        self.assertIn('w:ascii="Arial"', xml0)
        self.assertIn('<w:jc w:val="center"', xml0)
        self.assertIn('<w:b', xml0)

        # Col 1 (number_theory) should have block.style_config applied
        col1_p = table.rows[1].cells[1].paragraphs[0]
        xml1 = col1_p._p.xml
        self.assertIn('w:ascii="Calibri"', xml1)
        self.assertIn('<w:jc w:val="left"', xml1)
        self.assertNotIn('<w:b', xml1)

    def test_render_styled_block_applies_draft_configs(self):
        from handlers.shell_renderer import ShellDocxRenderer
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="BLOCK_OBJ_TEST",
            name="Mục tiêu môn học, Chuẩn đầu ra và PLOs",
            block_type="reference",
            config={"code": "objective_outcomes"},
        )
        block_layout = {
            "block_configs": {
                "BLOCK_OBJ_TEST": {
                    "cell_alignments": {"1,0": "CENTER", "2,0": "CENTER"},
                }
            }
        }
        data_ctx = {
            "sub_sections_map": {
                "objective_outcomes": {
                    "type": "reference",
                    "code": "objective_outcomes",
                    "reference_data": [
                        {"content": "Content CO1", "programme_learning_outcomes": []},
                        {"content": "Content CO2", "programme_learning_outcomes": []},
                    ],
                }
            }
        }
        renderer._render_styled_block(
            doc, block, data_ctx, block_layout, data_ctx["sub_sections_map"],
            {}, None, {}, 1, draft_configs=block_layout["block_configs"]
        )
        tbl = doc.tables[0]
        co1_cell = tbl.rows[1].cells[0]
        co2_cell = tbl.rows[2].cells[0]
        self.assertIn('<w:jc w:val="center"/>', co1_cell._tc.xml)
        self.assertIn('<w:jc w:val="center"/>', co2_cell._tc.xml)
        self.assertIn('<w:vAlign w:val="center"/>', co1_cell._tc.xml)
        self.assertIn('<w:vAlign w:val="center"/>', co2_cell._tc.xml)

    def test_column_mapping_with_custom_column_at_end(self):
        doc = Document()
        table = doc.add_table(rows=2, cols=5)
        keys = ShellDocxRenderer._resolve_column_keys(table, "credit")
        self.assertEqual(keys, ["credit_total", "number_theory", "number_practice", "hour_self_study", "4"])

    def test_extract_styles_old_schema_flat(self):
        """Schema cũ dạng phẳng được coi là content_style, title_style rỗng."""
        old_cfg = {"font_name": "Arial", "bold": True}
        title_style, content_style = ShellDocxRenderer._extract_styles(old_cfg)
        self.assertEqual(title_style, {})
        self.assertEqual(content_style, {"font_name": "Arial", "bold": True})

    def test_extract_styles_new_schema_titled(self):
        """Schema mới tách biệt rõ ràng title_style và content_style."""
        new_cfg = {"title_style": {"bold": True}, "content_style": {"italic": True}}
        title_style, content_style = ShellDocxRenderer._extract_styles(new_cfg)
        self.assertEqual(title_style, {"bold": True})
        self.assertEqual(content_style, {"italic": True})

    def test_toggle_xml_element_unset_bold(self):
        """Toggle bold=False xóa hoàn toàn tag w:b khỏi rPr thay vì gán val='0'."""
        rPr = etree.Element(f"{{{W_NS}}}rPr")
        ShellDocxRenderer._toggle_xml_element(rPr, "b", True)
        self.assertIsNotNone(rPr.find(f"{{{W_NS}}}b"))
        ShellDocxRenderer._toggle_xml_element(rPr, "b", False)
        self.assertIsNone(rPr.find(f"{{{W_NS}}}b"))

    def test_render_text_block_with_title_and_content_styles(self):
        """Text block áp dụng độc lập title_style cho label và content_style cho value."""
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="course_name",
            name="Tên học phần",
            block_type="text",
            xml_template='<w:p><w:r><w:t>Label: </w:t></w:r><w:r><w:t>{{course_name}}</w:t></w:r></w:p>',
            style_config={
                "title_style": {"bold": True, "font_name": "Arial", "font_size_pt": 16},
                "content_style": {"italic": True, "font_name": "Times New Roman", "font_size_pt": 12},
            },
        )
        data_ctx = {"course_name": "Cấu trúc dữ liệu"}
        renderer._render_block(doc, block, data_ctx, {})

        p = doc.paragraphs[0]
        xml = p._p.xml

        # Run 0 (title): Arial, size 32, bold
        self.assertIn('w:ascii="Arial"', xml)
        self.assertIn('<w:sz w:val="32"', xml)
        self.assertIn("<w:b", xml)

        # Run 1 (content): Times New Roman, size 24, italic
        self.assertIn('w:ascii="Times New Roman"', xml)
        self.assertIn('<w:sz w:val="24"', xml)
        self.assertIn("<w:i", xml)

    def test_render_selection_block_title_content_separate(self):
        """Selection block cũng tách được title_style và content_style."""
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="teaching_methods",
            name="Phương thức giảng dạy",
            block_type="selection",
            xml_template='<w:p><w:r><w:t>Phương thức: </w:t></w:r><w:r><w:t>{{teaching_methods}}</w:t></w:r></w:p>',
            style_config={
                "title_style": {"bold": True},
                "content_style": {"italic": True},
            },
        )
        renderer._render_block(doc, block, {"teaching_methods": "Trực tiếp"}, {})
        p = doc.paragraphs[0]
        xml = p._p.xml
        self.assertIn("<w:b", xml)
        self.assertIn("<w:i", xml)

    def test_apply_style_to_xml_only_title_run(self):
        """XML chỉ có 1 run không placeholder → coi là title run."""
        renderer = ShellDocxRenderer()
        xml_input = '<w:p><w:r><w:t>Static Label Only</w:t></w:r></w:p>'
        output = renderer._apply_style_to_xml(
            xml_snippet=xml_input,
            title_style={"bold": True},
            content_style={},
            fallback_style={},
        )
        self.assertIn("<w:b", output)

    def test_render_reference_block_title_content_separate(self):
        """Reference block áp dụng độc lập title_style cho Tiêu đề và content_style cho Nội dung."""
        renderer = ShellDocxRenderer()
        doc = Document()
        block = TemplateBlock(
            code="lecturer_info",
            name="2. Lecturer Information",
            block_type="reference",
            style_config={
                "title_style": {"bold": True, "font_size_pt": 16, "italic": False},
                "content_style": {"italic": True, "font_size_pt": 12, "bold": False},
            },
        )
        block_layout = {
            "named_styles": {
                "SYLLABUS_HEADING_2": {"font_name": "Arial", "font_size_pt": 14},
                "SYLLABUS_BODY": {"font_name": "Times New Roman", "font_size_pt": 10},
            }
        }
        sub_sections_map = {
            "lecturer_info": {
                "type": "reference",
                "code": "lecturer_info",
                "reference_data": {
                    "first_name": "Nam",
                    "last_name": "Nguyen",
                    "email": "nam@example.com",
                    "room": "A101",
                    "faculty": "CNTT",
                },
            }
        }
        renderer._render_block(doc, block, {}, block_layout, sub_sections_map)
        self.assertGreater(len(doc.paragraphs), 1)
        title_p = doc.paragraphs[0]
        title_xml = title_p._p.xml
        self.assertIn("<w:b", title_xml)
        self.assertIn('<w:sz w:val="32"', title_xml)
        self.assertNotIn("<w:i", title_xml)

        for content_p in doc.paragraphs[1:]:
            content_xml = content_p._p.xml
            self.assertIn("<w:i", content_xml)
            self.assertIn('<w:sz w:val="24"', content_xml)
            self.assertNotIn("<w:b", content_xml)

    def test_format_paragraphs_accepts_content_style(self):
        """Hàm _format_paragraphs nhận trực tiếp content_style parameter."""
        doc = Document()
        p = doc.add_paragraph("Test content paragraph")
        ShellDocxRenderer._format_paragraphs([p], {"italic": True, "font_size_pt": 11}, {})
        xml = p._p.xml
        self.assertIn("<w:i", xml)
        self.assertIn('<w:sz w:val="22"', xml)


class TemplateBlockPreviewInlineTestCase(TestCase):
    """Bộ kiểm thử cho chức năng Preview Inline block (PreviewBuilder & API endpoint)."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='test_preview_admin',
            email='admin@test.com',
            password='test123_admin_password'
        )
        self.regular_user = User.objects.create_user(
            username='test_regular_user',
            email='user@test.com',
            password='test123_user_password',
            user_role='user'
        )
        self.template = TemplateSyllabus.objects.create(
            name='Test Template Preview',
            version='v1.0',
            block_layout={
                'named_styles': {
                    'SYLLABUS_HEADING_2': {'bold': True, 'font_size_pt': 14},
                    'SYLLABUS_BODY': {'font_size_pt': 12, 'alignment': 'JUSTIFY'},
                    'SYLLABUS_TABLE_HEADER': {'bold': True, 'alignment': 'CENTER'},
                    'SYLLABUS_TABLE_BODY': {'bold': False, 'alignment': 'LEFT'},
                }
            }
        )
        self.text_block = TemplateBlock.objects.create(
            template=self.template,
            code='test_text',
            name='Tên môn học tiếng Anh',
            block_type='text',
            xml_template='<w:p><w:r><w:t>Label: </w:t></w:r><w:r><w:t>{{english_title}}</w:t></w:r></w:p>',
            style_config={},
            position=1,
        )
        self.reference_block = TemplateBlock.objects.create(
            template=self.template,
            code='credit',
            name='1. Số tín chỉ',
            block_type='reference',
            xml_template='<w:p><w:r><w:t>Tiêu đề</w:t></w:r></w:p>',
            style_config={},
            position=2,
        )
        self.table_block = TemplateBlock.objects.create(
            template=self.template,
            code='test_table',
            name='Bảng mẫu',
            block_type='table',
            xml_template=(
                '<w:tbl>'
                '<w:tr><w:tc><w:tcPr><w:shd w:fill="D9D9D9"/></w:tcPr><w:p><w:r><w:t>Header Cell</w:t></w:r></w:p></w:tc></w:tr>'
                '<w:tr><w:tc><w:tcPr><w:shd w:fill="auto"/></w:tcPr><w:p><w:r><w:t>Body Cell</w:t></w:r></w:p></w:tc></w:tr>'
                '</w:tbl>'
            ),
            style_config={},
            position=3,
        )
        self.credit_block = TemplateBlock.objects.create(
            template=self.template,
            code='credit_block',
            name='Số tín chỉ',
            block_type='reference',
            xml_template='<w:p><w:r><w:t>Số tín chỉ</w:t></w:r></w:p>',
            config={'code': 'credit', 'table_code': 'credit', 'display_type': 'TABLE'},
            style_config={},
            position=4,
        )

    def test_build_preview_json_text_block(self):
        """Text block: JSON tách 2 runs với style khác nhau."""
        from handlers.preview_builder import PreviewBuilder

        result = PreviewBuilder.build(
            self.text_block,
            style_config={
                'title_style': {'bold': True, 'font_name': 'Arial'},
                'content_style': {'italic': True, 'font_name': 'Times New Roman'},
            },
        )
        self.assertEqual(result['block_type'], 'text')
        self.assertEqual(len(result['elements']), 1)
        para = result['elements'][0]
        self.assertEqual(para['type'], 'paragraph')
        self.assertEqual(len(para['runs']), 2)
        self.assertTrue(para['runs'][0]['bold'])
        self.assertFalse(para['runs'][0]['italic'])
        self.assertEqual(para['runs'][0]['font_name'], 'Arial')
        self.assertFalse(para['runs'][1]['bold'])
        self.assertTrue(para['runs'][1]['italic'])
        self.assertEqual(para['runs'][1]['font_name'], 'Times New Roman')

    def test_build_preview_json_reference_block(self):
        """Reference block: JSON có paragraph tiêu đề và table nội dung."""
        from handlers.preview_builder import PreviewBuilder

        result = PreviewBuilder.build(self.reference_block, style_config={})
        self.assertEqual(result['block_type'], 'reference')
        self.assertGreaterEqual(len(result['elements']), 2)
        self.assertEqual(result['elements'][0]['type'], 'paragraph')
        self.assertEqual(result['elements'][1]['type'], 'table')
        table = result['elements'][1]
        self.assertGreaterEqual(len(table['rows']), 2)
        self.assertTrue(table['rows'][0]['is_header'])
        self.assertFalse(table['rows'][1]['is_header'])
        body_cell = table['rows'][1]['cells'][0]
        self.assertFalse(body_cell['bold'])
        self.assertFalse(body_cell['italic'])

    def test_build_preview_json_table_block(self):
        """Table block: Verify table có rows + cells với bg_color đúng (header row #D9D9D9)."""
        from handlers.preview_builder import PreviewBuilder

        result = PreviewBuilder.build(self.table_block, style_config={})
        self.assertEqual(result['block_type'], 'table')
        self.assertEqual(len(result['elements']), 1)
        table = result['elements'][0]
        self.assertEqual(table['type'], 'table')
        self.assertEqual(len(table['rows']), 2)
        self.assertEqual(table['rows'][0]['cells'][0]['bg_color'], '#D9D9D9')
        self.assertIsNone(table['rows'][1]['cells'][0]['bg_color'])

    def test_preview_inline_api_endpoint(self):
        """Gọi API endpoint POST preview-inline với auth admin thành công HTTP 200."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.text_block.id}/preview-inline/"
        payload = {
            "style_config": {
                "title_style": {"bold": True},
                "content_style": {"italic": True},
            }
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["block_code"], "test_text")
        self.assertEqual(res.data["block_type"], "text")
        self.assertIn("elements", res.data)
        self.assertEqual(len(res.data["elements"]), 1)

    def test_preview_inline_api_fallback_when_no_syllabus(self):
        """Mock DB không có Syllabus -> fallback lấy DEFAULT_PREVIEW_CONTEXT."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.text_block.id}/preview-inline/"
        with patch("syllabuses.models.Syllabus.objects.first", return_value=None):
            res = self.client.post(url, {}, format="json")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res.data["block_code"], "test_text")
            para = res.data["elements"][0]
            runs_text = "".join(r["text"] for r in para["runs"])
            self.assertIn("Data Structures and Algorithms", runs_text)

    def test_preview_inline_api_auth_required(self):
        """Gọi API không auth -> 401. Gọi với user thường -> 403."""
        url = f"/templates/{self.template.id}/blocks/{self.text_block.id}/preview-inline/"
        res_unauth = self.client.post(url, {}, format="json")
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.regular_user)
        res_user = self.client.post(url, {}, format="json")
        self.assertEqual(res_user.status_code, status.HTTP_403_FORBIDDEN)

    def test_preview_inline_with_draft_custom_columns(self):
        """Body gửi custom_columns -> verify response có table 5 cột, cột 5 = 'Số buổi' / '15'."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/preview-inline/"
        payload = {
            "custom_columns": [
                {
                    "column_key": "custom_credit_001",
                    "column_label": "Số buổi",
                    "column_type": "int",
                    "default_value": "15",
                }
            ]
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tables = [el for el in res.data.get("elements", []) if el.get("type") == "table"]
        self.assertEqual(len(tables), 1)
        table = tables[0]
        self.assertEqual(len(table["rows"][0]["cells"]), 5)
        self.assertEqual(table["rows"][0]["cells"][4]["text"], "Số buổi")
        self.assertEqual(len(table["rows"][1]["cells"]), 5)
        self.assertEqual(table["rows"][1]["cells"][4]["text"], "15")

    def test_preview_inline_fallback_db_custom_columns(self):
        """Tạo CustomColumn trong DB -> body không gửi custom_columns -> verify fallback DB bảng có 5 cột."""
        CustomColumn.objects.create(
            template=self.template,
            table_code="credit",
            column_key="custom_credit_001",
            column_label="Số buổi",
            default_value="20",
            is_active=True,
        )
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/preview-inline/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tables = [el for el in res.data.get("elements", []) if el.get("type") == "table"]
        self.assertEqual(len(tables), 1)
        table = tables[0]
        self.assertEqual(len(table["rows"][0]["cells"]), 5)
        self.assertEqual(table["rows"][0]["cells"][4]["text"], "Số buổi")
        self.assertEqual(table["rows"][1]["cells"][4]["text"], "20")

    def test_preview_inline_no_custom_columns(self):
        """DB không có custom column, body không gửi -> verify bảng giữ 4 cột core."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/preview-inline/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tables = [el for el in res.data.get("elements", []) if el.get("type") == "table"]
        self.assertEqual(len(tables), 1)
        table = tables[0]
        self.assertEqual(len(table["rows"][0]["cells"]), 4)

    def test_batch_save_success(self):
        """Batch save style_config + config + new_custom_columns thành công."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/batch-save/"
        payload = {
            "style_config": {"title_style": {"bold": True}},
            "config": {"code": "credit", "table_code": "credit", "display_type": "TABLE"},
            "new_custom_columns": [
                {
                    "column_label": "Học vị",
                    "column_type": "text",
                    "default_value": "Tiến sĩ",
                }
            ],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("block", res.data)
        self.assertIn("created_custom_columns", res.data)
        self.assertEqual(len(res.data["created_custom_columns"]), 1)
        created_col = res.data["created_custom_columns"][0]
        self.assertEqual(created_col["column_label"], "Học vị")
        self.assertEqual(created_col["default_value"], "Tiến sĩ")

        # Verify DB persist
        col_db = CustomColumn.objects.filter(
            template=self.template, table_code="credit", column_label="Học vị", is_active=True
        ).first()
        self.assertIsNotNone(col_db)
        self.assertEqual(col_db.default_value, "Tiến sĩ")

    def test_batch_save_limit_exceeded_atomic_rollback(self):
        """Gửi vượt quá 10 custom columns -> 400 Bad Request và rollback atomic."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/batch-save/"
        payload = {
            "style_config": {"title_style": {"italic": True}},
            "new_custom_columns": [
                {"column_label": f"Col {i}", "column_type": "text"} for i in range(11)
            ],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Vượt quá giới hạn 10 cột", res.data["error"])

        # Verify DB rollback: không có column nào được tạo
        self.assertEqual(
            CustomColumn.objects.filter(template=self.template, table_code="credit").count(), 0
        )

    def test_batch_save_wrong_template_returns_404(self):
        """Block không thuộc template_id trên URL -> 404 Not Found."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/9999/blocks/{self.credit_block.id}/batch-save/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_batch_save_with_level_nested(self):
        """Batch save custom column với level='clos' lưu đúng vào DB."""
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/batch-save/"
        payload = {
            "style_config": {},
            "config": {"code": "course_learning_outcomes", "table_code": "course_learning_outcomes"},
            "new_custom_columns": [
                {
                    "column_label": "Độ khó",
                    "column_type": "text",
                    "level": "clos",
                }
            ],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        created_col = res.data["created_custom_columns"][0]
        self.assertEqual(created_col["level"], "clos")
        col_db = CustomColumn.objects.get(id=created_col["id"])
        self.assertEqual(col_db.level, "clos")

    def test_batch_save_with_updated_custom_columns(self):
        """Batch save cập nhật cột đã lưu: đổi label, level, default_value mà không đổi column_key."""
        self.client.force_authenticate(user=self.admin_user)
        col = CustomColumn.objects.create(
            template=self.template,
            table_code="course_learning_outcomes",
            column_key="custom_clo_edit_001",
            column_label="Ghi chú CO",
            column_type="text",
            level="root",
            position=1,
            is_active=True,
        )
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/batch-save/"
        payload = {
            "style_config": {},
            "config": {"code": "course_learning_outcomes", "table_code": "course_learning_outcomes"},
            "updated_custom_columns": [
                {
                    "id": col.id,
                    "column_label": "Ghi chú CLO",
                    "column_type": "text",
                    "default_value": "Updated",
                    "level": "clos",
                }
            ],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data.get("updated_custom_columns", [])), 1)
        up_col = res.data["updated_custom_columns"][0]
        self.assertEqual(up_col["column_label"], "Ghi chú CLO")
        self.assertEqual(up_col["level"], "clos")
        self.assertEqual(up_col["column_key"], "custom_clo_edit_001")

        col.refresh_from_db()
        self.assertEqual(col.column_label, "Ghi chú CLO")
        self.assertEqual(col.level, "clos")
        self.assertEqual(col.default_value, "Updated")
        self.assertEqual(col.column_key, "custom_clo_edit_001")


class MainSectionStyleTestCase(TestCase):
    """Kiểm thử cấu hình style cho Main Section (Endpoint & Renderer)."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin_ms_test',
            email='admin_ms@test.com',
            password='admin_ms_password'
        )
        self.template = TemplateSyllabus.objects.create(
            name='Test Template MainSection',
            version='v1.0',
            block_layout={'named_styles': {'SYLLABUS_HEADING_1': {'bold': True, 'font_size_pt': 14}}}
        )
        self.main_sec = TemplateMainSection.objects.create(
            template=self.template,
            name='Thông tin chung',
            code='GENERAL_INFO',
            position=1
        )

    def test_update_main_section_style_success(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/templates/{self.template.id}/main-sections/{self.main_sec.id}/style/"
        payload = {
            "style_config": {
                "font_size_pt": 20,
                "italic": True,
                "bold": True,
                "space_before_pt": 15,
                "space_after_pt": 10
            }
        }
        res = self.client.patch(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("status"), "ok")
        self.assertEqual(res.data.get("style_config", {}).get("font_size_pt"), 20)

        self.template.refresh_from_db()
        saved = self.template.block_layout.get("main_sections_style", {}).get(str(self.main_sec.id))
        self.assertIsNotNone(saved)
        self.assertEqual(saved.get("font_size_pt"), 20)
        self.assertTrue(saved.get("italic"))

    def test_update_main_section_style_invalid_data(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/templates/{self.template.id}/main-sections/{self.main_sec.id}/style/"
        res = self.client.patch(url, {"style_config": "not-a-dict"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_render_main_section_header_with_custom_style(self):
        from handlers.shell_renderer import ShellDocxRenderer, W_NS
        from docx import Document

        renderer = ShellDocxRenderer()
        doc = Document()
        block_layout = {
            "named_styles": {"SYLLABUS_HEADING_1": {"bold": True, "font_size_pt": 14}},
            "main_sections_style": {
                str(self.main_sec.id): {
                    "font_size_pt": 20,
                    "italic": True,
                    "space_before_pt": 18,
                    "space_after_pt": 12
                }
            }
        }
        renderer._render_main_section_header(doc, self.main_sec, block_layout)

        p = doc.paragraphs[0]
        self.assertIn("Thông tin chung", p.text)
        pPr = p._p.find(f"{{{W_NS}}}pPr")
        self.assertIsNotNone(pPr)
        spacing = pPr.find(f"{{{W_NS}}}spacing")
        self.assertIsNotNone(spacing)
        self.assertEqual(spacing.get(f"{{{W_NS}}}before"), "360")  # 18 * 20
        self.assertEqual(spacing.get(f"{{{W_NS}}}after"), "240")   # 12 * 20

        # Check run size and italic
        r = p._p.find(f".//{{{W_NS}}}r")
        self.assertIsNotNone(r)
        rPr = r.find(f"{{{W_NS}}}rPr")
        self.assertIsNotNone(rPr)
        sz = rPr.find(f"{{{W_NS}}}sz")
        self.assertIsNotNone(sz)
        self.assertEqual(sz.get(f"{{{W_NS}}}val"), "40")  # 20 * 2
        i_tag = rPr.find(f"{{{W_NS}}}i")
        self.assertIsNotNone(i_tag)


class RunColorTestCase(TestCase):
    """Bộ kiểm thử cho tính năng Text Color Picker theo Nghị định 30/2020."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin_color_test',
            email='admin_color@test.com',
            password='admin_color_password',
            user_role=User.UserRole.ADMIN
        )
        self.template = TemplateSyllabus.objects.create(
            name='Test Template Color',
            version='v1.0',
            block_layout={'named_styles': {'SYLLABUS_HEADING_1': {'bold': True, 'font_size_pt': 14}}}
        )
        self.main_sec = TemplateMainSection.objects.create(
            template=self.template,
            name='Thông tin chung',
            code='GENERAL_INFO',
            position=1
        )

    def test_apply_run_style_with_color(self):
        r = etree.Element(f"{{{W_NS}}}r")
        ShellDocxRenderer._apply_run_style(r, {"color": "#C00000"})
        rPr = r.find(f"{{{W_NS}}}rPr")
        self.assertIsNotNone(rPr)
        color_el = rPr.find(f"{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "C00000")

    def test_apply_run_style_explicit_black(self):
        r = etree.Element(f"{{{W_NS}}}r")
        # Apply black -> tag must be explicitly written as 000000 to override Heading1 blue style
        ShellDocxRenderer._apply_run_style(r, {"color": "#000000"})
        color_el = r.find(f".//{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "000000")

    def test_apply_run_style_none_or_auto_removes_tag(self):
        r = etree.Element(f"{{{W_NS}}}r")
        ShellDocxRenderer._apply_run_style(r, {"color": "#C00000"})
        self.assertIsNotNone(r.find(f".//{{{W_NS}}}color"))

        # Apply None -> tag is removed
        ShellDocxRenderer._apply_run_style(r, {"color": None})
        self.assertIsNone(r.find(f".//{{{W_NS}}}color"))

        # Re-add color then apply AUTO -> tag is removed
        ShellDocxRenderer._apply_run_style(r, {"color": "#C00000"})
        ShellDocxRenderer._apply_run_style(r, {"color": "AUTO"})
        self.assertIsNone(r.find(f".//{{{W_NS}}}color"))

    def test_serialize_run_extracts_color(self):
        r = etree.Element(f"{{{W_NS}}}r")
        rPr = etree.SubElement(r, f"{{{W_NS}}}rPr")
        color_el = etree.SubElement(rPr, f"{{{W_NS}}}color")
        color_el.set(f"{{{W_NS}}}val", "C00000")
        t = etree.SubElement(r, f"{{{W_NS}}}t")
        t.text = "Văn bản màu đỏ"

        serialized = PreviewBuilder._serialize_run(r)
        self.assertEqual(serialized.get("color"), "#C00000")
        self.assertEqual(serialized.get("text"), "Văn bản màu đỏ")

    def test_main_section_with_color(self):
        layout = {
            "main_sections_style": {
                str(self.main_sec.id): {
                    "color": "#1F4E79",
                    "bold": True
                }
            }
        }
        doc = Document()
        renderer = ShellDocxRenderer()
        renderer._render_main_section_header(doc, self.main_sec, layout)

        p = doc.paragraphs[0]
        color_el = p._p.find(f".//{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "1F4E79")

    def test_reset_color_persistence_and_render(self):
        self.client.force_authenticate(user=self.admin)
        url = f"/templates/{self.template.id}/main-sections/{self.main_sec.id}/style/"

        # 1. Set color #C00000
        res1 = self.client.patch(url, {"style_config": {"color": "#C00000"}}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.template.refresh_from_db()
        self.assertEqual(
            self.template.block_layout["main_sections_style"][str(self.main_sec.id)].get("color"),
            "#C00000"
        )

        # 2. Reset color to null/empty
        res2 = self.client.patch(url, {"style_config": {"color": None}}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.template.refresh_from_db()
        saved_style = self.template.block_layout["main_sections_style"][str(self.main_sec.id)]
        self.assertIsNone(saved_style.get("color"))

        # 3. Render DOCX -> verify <w:color> is absent
        doc = Document()
        renderer = ShellDocxRenderer()
        renderer._render_main_section_header(doc, self.main_sec, self.template.block_layout)
        p = doc.paragraphs[0]
        color_el = p._p.find(f".//{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "000000")

    def test_main_section_default_color_is_black(self):
        from docx import Document
        from handlers.shell_renderer import ShellDocxRenderer, W_NS
        doc = Document()
        renderer = ShellDocxRenderer()
        renderer._render_main_section_header(doc, self.main_sec, {})
        p = doc.paragraphs[0]
        color_el = p._p.find(f".//{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "000000")


class HeaderFooterRendererTestCase(TestCase):
    def test_render_header_with_logo(self):
        import os
        import tempfile
        from PIL import Image
        from handlers.header_footer_renderer import HeaderFooterRenderer

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name
        try:
            img = Image.new("RGB", (20, 20), color="blue")
            img.save(tmp_path)
            doc = Document()
            renderer = HeaderFooterRenderer()
            renderer.render_header(doc, {"logo_url": tmp_path, "logo_width_pt": 60})
            drawing = doc.paragraphs[0]._p.find(f".//{{{W_NS}}}drawing")
            self.assertIsNotNone(drawing)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_render_main_line_with_full_style(self):
        from handlers.header_footer_renderer import HeaderFooterRenderer

        doc = Document()
        renderer = HeaderFooterRenderer()
        cfg = {
            "main_lines": [
                {
                    "text": "TRƯỜNG ĐẠI HỌC MỞ TP.HCM",
                    "style": {
                        "font_name": "Arial",
                        "font_size_pt": 15,
                        "bold": True,
                        "color": "#C00000",
                        "alignment": "LEFT",
                    },
                }
            ]
        }
        renderer.render_header(doc, cfg)
        target_p = next(
            p for p in doc.paragraphs if "TRƯỜNG ĐẠI HỌC MỞ TP.HCM" in p.text
        )
        color_el = target_p._p.find(f".//{{{W_NS}}}color")
        sz_el = target_p._p.find(f".//{{{W_NS}}}sz")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "C00000")
        self.assertIsNotNone(sz_el)
        self.assertEqual(sz_el.get(f"{{{W_NS}}}val"), "30")

    def test_backward_compat_old_schema(self):
        from handlers.header_footer_renderer import HeaderFooterRenderer

        doc = Document()
        renderer = HeaderFooterRenderer()
        cfg = {
            "main_lines": [
                {
                    "text": "BỘ GIÁO DỤC VÀ ĐÀO TẠO",
                    "style": {"bold": True, "font_size": 12},
                }
            ]
        }
        renderer.render_header(doc, cfg)
        target_p = next(
            p for p in doc.paragraphs if "BỘ GIÁO DỤC VÀ ĐÀO TẠO" in p.text
        )
        self.assertTrue(target_p.runs[0].bold)
        sz_el = target_p._p.find(f".//{{{W_NS}}}sz")
        self.assertEqual(sz_el.get(f"{{{W_NS}}}val"), "24")

    def test_render_date_line_object_schema(self):
        from handlers.header_footer_renderer import HeaderFooterRenderer

        doc = Document()
        renderer = HeaderFooterRenderer()
        cfg = {
            "date_line": {
                "text": "TP.HCM, 2026",
                "style": {
                    "italic": False,
                    "font_size_pt": 14,
                    "alignment": "CENTER",
                    "color": "#002060",
                },
            }
        }
        renderer.render_footer(doc, cfg)
        target_p = next(p for p in doc.paragraphs if "TP.HCM, 2026" in p.text)
        color_el = target_p._p.find(f".//{{{W_NS}}}color")
        self.assertFalse(target_p.runs[0].italic)
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "002060")

    def test_render_signature_table_with_style(self):
        from handlers.header_footer_renderer import HeaderFooterRenderer

        doc = Document()
        renderer = HeaderFooterRenderer()
        cfg = {
            "signature_table": {
                "columns": [
                    {
                        "name": "TS. Trương Hoàng Vinh",
                        "name_style": {"color": "#C00000", "bold": True},
                    }
                ]
            }
        }
        renderer.render_footer(doc, cfg)
        tbl = doc.tables[0]
        cell = tbl.rows[0].cells[0]
        p_name = next(p for p in cell.paragraphs if "Trương Hoàng Vinh" in p.text)
        color_el = p_name._p.find(f".//{{{W_NS}}}color")
        self.assertIsNotNone(color_el)
        self.assertEqual(color_el.get(f"{{{W_NS}}}val"), "C00000")


class TemplateLogoUploadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.specialist = User.objects.create_user(
            username="specialist_logo",
            password="Password123@",
            user_role="specialist",
        )
        self.client.force_authenticate(user=self.specialist)
        self.template = TemplateSyllabus.objects.create(
            name="Template Logo Test",
            version="1.0",
            block_layout={"header_footer": {"header": {}}},
        )
        self.url = f"/templates/{self.template.id}/upload-logo/"
        self.delete_url = f"/templates/{self.template.id}/delete-logo/"

    def test_upload_logo_success(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00"
            b"\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        file = SimpleUploadedFile("test_logo.png", png_bytes, content_type="image/png")
        res = self.client.post(self.url, {"logo": file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("logo_url", res.data)
        self.assertTrue(res.data["logo_url"].startswith("/media/templates/logos/"))

        self.template.refresh_from_db()
        saved_url = self.template.block_layout["header_footer"]["header"]["logo_url"]
        self.assertEqual(saved_url, res.data["logo_url"])

    def test_upload_logo_invalid_extension(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        file = SimpleUploadedFile(
            "malicious.exe", b"binarycontent", content_type="application/octet-stream"
        )
        res = self.client.post(self.url, {"logo": file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Định dạng không hỗ trợ", res.data.get("error", ""))

    def test_upload_logo_too_large(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        large_bytes = b"0" * (5 * 1024 * 1024 + 1024)
        file = SimpleUploadedFile("big.png", large_bytes, content_type="image/png")
        res = self.client.post(self.url, {"logo": file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("File quá lớn", res.data.get("error", ""))

    def test_upload_logo_no_file(self):
        res = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Thiếu file logo", res.data.get("error", ""))

    def test_delete_logo(self):
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage

        rel_path = f"templates/logos/test_del_{self.template.id}.png"
        default_storage.save(rel_path, ContentFile(b"testdata"))
        logo_url = f"/media/{rel_path}"

        self.template.block_layout = {
            "header_footer": {"header": {"logo_url": logo_url}}
        }
        self.template.save(update_fields=["block_layout"])

        res = self.client.delete(self.delete_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("status"), "ok")

        self.assertFalse(default_storage.exists(rel_path))
        self.template.refresh_from_db()
        self.assertIsNone(
            self.template.block_layout["header_footer"]["header"]["logo_url"]
        )


class BulkSpacingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.specialist = User.objects.create_user(
            username="specialist_bulk",
            password="Password123@",
            user_role="specialist",
        )
        self.client.force_authenticate(user=self.specialist)
        self.template = TemplateSyllabus.objects.create(
            name="Template Bulk Spacing Test",
            version="1.0",
            block_layout={},
        )
        self.url = f"/templates/{self.template.id}/bulk-spacing/"
        self.rollback_url = f"/templates/{self.template.id}/rollback-bulk-spacing/"

        self.ms1 = TemplateMainSection.objects.create(
            template=self.template,
            code="MS_001",
            position=1,
        )
        self.ms2 = TemplateMainSection.objects.create(
            template=self.template,
            code="MS_002",
            position=2,
        )
        self.sub1 = TemplateSubSection.objects.create(
            main_section=self.ms1,
            code="SUB_001",
            type="text",
            position=1,
        )
        self.sub2 = TemplateSubSection.objects.create(
            main_section=self.ms2,
            code="SUB_002",
            type="table",
            position=2,
        )

        self.block1 = TemplateBlock.objects.create(
            template=self.template,
            code="SUB_001",
            name="Block 1",
            block_type="text",
            xml_template="<w:p/>",
            style_config={"content_style": {"font_name": "Arial", "line_spacing": 1.0}},
            position=1,
        )
        self.block2 = TemplateBlock.objects.create(
            template=self.template,
            code="SUB_002",
            name="Block 2",
            block_type="table",
            xml_template="<w:tbl/>",
            style_config={"content_style": {"font_name": "Calibri"}},
            position=2,
        )

    def test_dry_run_returns_affected_no_db_change(self):
        payload = {
            "scope": "all",
            "spacing": {"line_spacing": 1.5, "space_after_pt": 6},
            "dry_run": True,
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get("dry_run"))
        self.assertEqual(res.data.get("updated_count"), 2)
        self.assertEqual(len(res.data.get("affected_blocks")), 2)

        self.block1.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 1.0)
        self.assertNotIn("space_after_pt", self.block1.style_config["content_style"])

    def test_apply_all_with_overwrite(self):
        payload = {
            "scope": "all",
            "spacing": {"line_spacing": 1.5, "space_before_pt": 3, "space_after_pt": 6},
            "overwrite": True,
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data.get("dry_run"))
        self.assertEqual(res.data.get("updated_count"), 2)
        self.assertTrue(res.data.get("can_rollback"))

        self.block1.refresh_from_db()
        self.block2.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 1.5)
        self.assertEqual(self.block1.style_config["content_style"]["space_before_pt"], 3)
        self.assertEqual(self.block2.style_config["content_style"]["line_spacing"], 1.5)

    def test_apply_without_overwrite(self):
        self.block1.style_config = {"content_style": {"line_spacing": 2.0}}
        self.block1.save(update_fields=["style_config"])

        payload = {
            "scope": "all",
            "spacing": {"line_spacing": 1.15, "space_after_pt": 8},
            "overwrite": False,
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.block1.refresh_from_db()
        self.block2.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 2.0)
        self.assertEqual(self.block1.style_config["content_style"]["space_after_pt"], 8)
        self.assertEqual(self.block2.style_config["content_style"]["line_spacing"], 1.15)

    def test_scope_main_section(self):
        payload = {
            "scope": "main_section",
            "scope_value": self.ms1.id,
            "spacing": {"line_spacing": 1.5},
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("updated_count"), 1)

        self.block1.refresh_from_db()
        self.block2.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 1.5)
        self.assertNotIn("line_spacing", self.block2.style_config.get("content_style", {}))

    def test_scope_block_type(self):
        payload = {
            "scope": "block_type",
            "scope_value": "text",
            "spacing": {"space_after_pt": 12},
        }
        res = self.client.post(self.url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("updated_count"), 1)

        self.block1.refresh_from_db()
        self.block2.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["space_after_pt"], 12)
        self.assertNotIn("space_after_pt", self.block2.style_config.get("content_style", {}))

    def test_rollback_restores_snapshot(self):
        apply_payload = {
            "scope": "all",
            "spacing": {"line_spacing": 1.5},
            "overwrite": True,
        }
        self.client.post(self.url, apply_payload, format="json")
        self.block1.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 1.5)

        res = self.client.post(self.rollback_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("restored_count"), 2)

        self.block1.refresh_from_db()
        self.assertEqual(self.block1.style_config["content_style"]["line_spacing"], 1.0)
        self.template.refresh_from_db()
        self.assertNotIn("bulk_spacing_backup", self.template.block_layout)

    def test_rollback_no_snapshot(self):
        res = self.client.post(self.rollback_url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class CLOPLOMatrixSubRendererTestCase(TestCase):
    def test_render_matrix_complete_structure(self):
        from docx import Document
        from handlers.renderers.complex.clo_plo_matrix_renderer import CLOPLOMatrixSubRenderer
        from handlers.preview_builder import PreviewBuilder

        doc = Document()
        renderer = CLOPLOMatrixSubRenderer()
        sub_section = {
            "type": "reference",
            "code": "course_learning_outcomes",
            "reference_data": [
                {
                    "clos": [
                        {
                            "content": "CLO 1 description",
                            "plos": [{"plo_id": 4, "rating": 4}],
                        },
                        {
                            "content": "CLO 2 description",
                            "plos": [{"plo_id": 5, "rating": 5}],
                        },
                    ]
                }
            ],
        }
        renderer.render(doc, sub_section, {})

        has_title = any(
            "ma trận tích hợp giữa chuẩn đầu ra của môn học và chuẩn đầu ra của chương trình đào tạo" in p.text.lower()
            for p in doc.paragraphs
        )
        self.assertTrue(has_title)
        self.assertEqual(len(doc.tables), 2)
        matrix_tbl, legend_tbl = doc.tables[0], doc.tables[1]

        header_texts = [c.text.strip() for c in matrix_tbl.rows[0].cells]
        self.assertEqual(header_texts[0], "CLOs")
        self.assertIn("PLO.4", header_texts)
        self.assertIn("PLO.5", header_texts)

        self.assertEqual(matrix_tbl.rows[1].cells[0].text.strip(), "1")
        self.assertEqual(matrix_tbl.rows[2].cells[0].text.strip(), "2")

        self.assertEqual(legend_tbl.rows[0].cells[0].text.strip(), "1: Không đáp ứng")
        self.assertEqual(legend_tbl.rows[0].cells[1].text.strip(), "4: Đáp ứng nhiều")

        from docx.enum.table import WD_TABLE_ALIGNMENT

        elements = PreviewBuilder._serialize_body(doc._body._element)
        tbl_elements = [el for el in elements if el["type"] == "table"]
        self.assertEqual(len(tbl_elements), 2)
        self.assertFalse(tbl_elements[0].get("is_legend", False))
        self.assertTrue(tbl_elements[0].get("is_matrix", False))
        self.assertEqual(tbl_elements[0].get("alignment"), "CENTER")
        self.assertTrue(tbl_elements[1].get("is_legend", False))
        self.assertTrue(tbl_elements[1].get("borderless", False))
        self.assertFalse(tbl_elements[1].get("is_matrix", False))
        self.assertIsNotNone(matrix_tbl.rows[0].cells[0].width)
        self.assertEqual(matrix_tbl.alignment, WD_TABLE_ALIGNMENT.CENTER)
        self.assertEqual(legend_tbl.alignment, WD_TABLE_ALIGNMENT.CENTER)
        self.assertEqual(tbl_elements[1].get("alignment"), "CENTER")


class AssessmentSubRendererTestCase(TestCase):
    def test_render_assessment_structure_and_omit_number_row(self):
        from docx import Document
        from handlers.renderers.complex.assessment_renderer import AssessmentSubRenderer
        from handlers.preview_builder import PreviewBuilder

        doc = Document()
        renderer = AssessmentSubRenderer()
        sub_section = {
            "type": "reference",
            "code": "assessment_method",
            "reference_data": [
                {
                    "type_assessment": {"id": 1, "name": "Đánh giá quá trình/Formative assessment"},
                    "assessment_methods": [
                        {
                            "name": "A.1.1",
                            "time": "",
                            "course_learning_outcomes": [],
                            "weight": None,
                        }
                    ],
                },
                {
                    "type_assessment": {"id": 2, "name": "Đánh giá giữa kỳ/Mid-term assessment"},
                    "assessment_methods": [
                        {
                            "name": "Bài tập lớn và vấn đáp",
                            "time": "Nhận đề tài tuần thứ 3...",
                            "course_learning_outcomes": [{"id": 3, "position": 3}, {"id": 4, "position": 4}],
                            "weight": 40,
                        }
                    ],
                },
            ],
        }
        renderer.render(doc, sub_section, {})

        self.assertEqual(len(doc.tables), 1)
        tbl = doc.tables[0]
        headers = [c.text.strip().replace("\n", " ") for c in tbl.rows[0].cells]
        self.assertIn("Thành phần đánh giá/Type of assessment", headers[0])
        self.assertIn("Bài đánh giá", headers[1])
        self.assertIn("Thời điểm", headers[2])
        self.assertIn("CĐR môn học/CLOs", headers[3])
        self.assertIn("Tỷ lệ %", headers[4])

        row_1_col_0 = tbl.rows[1].cells[0].text.strip()
        self.assertNotEqual(row_1_col_0, "(1)")
        self.assertIn("A1. Đánh giá quá trình", row_1_col_0)

        row_2_col_1 = tbl.rows[2].cells[1].text.strip()
        self.assertEqual(row_2_col_1, "Tổng cộng")

        row_3_col_0 = tbl.rows[3].cells[0].text.strip()
        self.assertIn("A2. Đánh giá giữa kỳ", row_3_col_0)
        row_3_col_1 = tbl.rows[3].cells[1].text.strip()
        self.assertIn("A.2.1. Bài tập lớn và vấn đáp", row_3_col_1)
        row_3_col_4 = tbl.rows[3].cells[4].text.strip()
        self.assertEqual(row_3_col_4, "40%")

        row_4_col_1 = tbl.rows[4].cells[1].text.strip()
        self.assertEqual(row_4_col_1, "Tổng cộng")
        row_4_col_4 = tbl.rows[4].cells[4].text.strip()
        self.assertEqual(row_4_col_4, "40%")

        elements = PreviewBuilder._serialize_body(doc._body._element)
        tbl_elements = [el for el in elements if el["type"] == "table"]
        self.assertEqual(len(tbl_elements), 1)
        ser_tbl = tbl_elements[0]
        self.assertEqual(ser_tbl["rows"][1]["cells"][0]["rowspan"], 2)
        self.assertEqual(ser_tbl["rows"][3]["cells"][0]["rowspan"], 2)


class TextSubRendererTestCase(TestCase):
    """Bộ kiểm thử cho TextSubRenderer generic."""

    def setUp(self):
        from handlers.renderers.simple.text_renderer import TextSubRenderer
        self.renderer = TextSubRenderer()

    def test_can_render_validates_type_and_code(self):
        """Kiểm tra can_render với type=text cho cả mục mặc định lẫn custom."""
        self.assertTrue(self.renderer.can_render({"type": "text", "code": "custom_001"}))
        self.assertTrue(self.renderer.can_render({"type": "text", "code": "subject_name_vi"}))
        self.assertTrue(self.renderer.can_render({"type": "text", "name": "Chính sách mới"}))
        self.assertFalse(self.renderer.can_render({"type": "table"}))
        self.assertFalse(self.renderer.can_render("not_a_dict"))

    def test_render_updates_existing_paragraph_with_colon(self):
        """Kiểm tra cập nhật paragraph có sẵn dấu colon."""
        doc = Document()
        p = doc.add_paragraph("Tên môn học tiếng Việt: [Chưa có]")
        sub_section = {
            "type": "text",
            "code": "subject_name_vi",
            "name": "Tên môn học tiếng Việt",
            "content": "Kiến trúc phần mềm",
        }
        self.renderer.render(doc, sub_section, {"dummy": True})
        self.assertEqual(p.text, "Tên môn học tiếng Việt: Kiến trúc phần mềm")

    def test_render_updates_existing_paragraph_with_placeholder(self):
        """Kiểm tra cập nhật paragraph có chứa placeholder {{code}}."""
        doc = Document()
        p = doc.add_paragraph("Môn học: {{custom_code}}")
        sub_section = {
            "type": "text",
            "code": "custom_code",
            "content": "An toàn thông tin",
        }
        self.renderer.render(doc, sub_section, {"dummy": True})
        self.assertEqual(p.text, "Môn học: An toàn thông tin")

    def test_render_appends_new_paragraph_for_custom_section(self):
        """Kiểm tra tự động thêm paragraph mới theo chuẩn format cho tiểu mục tùy chỉnh."""
        doc = Document()
        sub_section = {
            "type": "text",
            "code": "policy_note",
            "name": "Chính sách học phần",
            "position": 5,
            "content": "Đi học đầy đủ 80%",
        }
        self.renderer.render(doc, sub_section, {"dummy": True})
        self.assertEqual(len(doc.paragraphs), 1)
        p = doc.paragraphs[0]
        self.assertEqual(p.text, "5. Chính sách học phần: Đi học đầy đủ 80%")
        self.assertTrue(p.runs[0].bold)
        self.assertEqual(p.runs[0].text, "5. Chính sách học phần: ")
        self.assertEqual(p.runs[1].text, "Đi học đầy đủ 80%")

    def test_render_exits_early_when_content_or_doc_empty(self):
        """Kiểm tra guard clause thoát sớm khi dữ liệu rỗng."""
        doc = Document()
        self.renderer.render(doc, {"type": "text", "content": ""}, {"dummy": True})
        self.assertEqual(len(doc.paragraphs), 0)


class TemplateBlockSyncServiceTestCase(TestCase):
    """Bộ kiểm thử cho service đồng bộ TemplateSubSection sang TemplateBlock."""

    def setUp(self):
        self.template = TemplateSyllabus.objects.create(name="Template Test Sync", version="v1.0")
        self.main_sec = TemplateMainSection.objects.create(
            template=self.template, name="Phần I", code="MAIN_1", position=1
        )

    def test_sync_creates_blocks_for_custom_subsections(self):
        """Kiểm tra khi thêm tiểu mục custom, service tự động tạo TemplateBlock tương ứng."""
        from services.template_block_sync_service import TemplateBlockSyncService

        sub1 = TemplateSubSection.objects.create(
            main_section=self.main_sec,
            name="Quy định học phần",
            code="CUSTOM_TEXT_001",
            type="text",
            position=1,
        )
        blocks = TemplateBlockSyncService.sync_blocks_for_template(self.template)
        self.assertEqual(len(blocks), 1)
        block = blocks[0]
        self.assertEqual(block.name, "Quy định học phần")
        self.assertEqual(block.block_type, "text")
        self.assertEqual(block.config.get("code"), "CUSTOM_TEXT_001")
        self.assertTrue(block.is_active)
        self.assertIn("CUSTOM_TEXT_001", block.xml_template)

    def test_sync_updates_and_soft_deletes_orphans(self):
        """Kiểm tra cập nhật tên block và soft-delete khi subsection bị xóa."""
        from services.template_block_sync_service import TemplateBlockSyncService

        sub1 = TemplateSubSection.objects.create(
            main_section=self.main_sec,
            name="Tên cũ",
            code="CUSTOM_TEXT_002",
            type="text",
            position=1,
        )
        TemplateBlockSyncService.sync_blocks_for_template(self.template)

        sub1.name = "Tên mới cập nhật"
        sub1.save()
        blocks = TemplateBlockSyncService.sync_blocks_for_template(self.template)
        self.assertEqual(blocks[0].name, "Tên mới cập nhật")

        sub1.delete()
        active_blocks = TemplateBlockSyncService.sync_blocks_for_template(self.template)
        self.assertEqual(len(active_blocks), 0)
        orphaned_block = TemplateBlock.objects.filter(template=self.template, config__code="CUSTOM_TEXT_002").first()
        self.assertIsNotNone(orphaned_block)
        self.assertFalse(orphaned_block.is_active)

    def test_flow_builder_to_style_editor_sync_and_save(self):
        """Kiểm tra toàn bộ luồng: thêm mục ở builder -> block xuất hiện ở style editor -> lưu format thành công."""
        from syllabuses.serializer import TemplateSyllabusSerializer
        from rest_framework.test import APIClient

        payload = {
            "name": self.template.name,
            "version": self.template.version,
            "main_sections": [
                {
                    "id": self.main_sec.id,
                    "name": self.main_sec.name,
                    "code": self.main_sec.code,
                    "position": self.main_sec.position,
                    "sub_sections": [
                        {
                            "name": "Chính sách nộp bài trễ",
                            "code": "CUSTOM_TEXT_POLICY",
                            "type": "text",
                            "position": 1,
                        }
                    ],
                }
            ],
        }
        serializer = TemplateSyllabusSerializer(instance=self.template, data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        block = TemplateBlock.objects.filter(template=self.template, config__code="CUSTOM_TEXT_POLICY").first()
        self.assertIsNotNone(block)
        self.assertEqual(block.name, "Chính sách nộp bài trễ")
        self.assertEqual(block.block_type, "text")

        client = APIClient()
        user = User.objects.create_user(
            username="specialist_test_sync", password="PassWord123!", user_role=User.UserRole.SPECIALIST
        )
        client.force_authenticate(user=user)

        batch_save_url = f"/templates/{self.template.id}/blocks/{block.id}/batch-save/"
        batch_payload = {
            "style_config": {
                "font_name": "Arial",
                "font_size_pt": 12,
                "bold": True,
            }
        }
        response = client.post(batch_save_url, batch_payload, format="json")
        self.assertEqual(response.status_code, 200)

        block.refresh_from_db()
        self.assertEqual(block.style_config.get("font_name"), "Arial")
        self.assertTrue(block.style_config.get("bold"))

    def test_sync_preserves_table_schema_and_selection_attribute_group(self):
        """Kiểm tra sync bảo toàn table_schema và attribute_group_id trong block config."""
        from services.template_block_sync_service import TemplateBlockSyncService
        from syllabuses.models import TemplateTableSubSection, TemplateSelectionSubSection

        tbl_sub = TemplateTableSubSection.objects.create(
            main_section=self.main_sec,
            name="Bảng điểm chi tiết",
            code="CUSTOM_TBL_01",
            type="table",
            position=2,
            table_schema={"columns": [{"id": "c1", "headerName": "Cột A", "field": "c1"}], "rows": []},
        )
        sel_sub = TemplateSelectionSubSection.objects.create(
            main_section=self.main_sec,
            name="Hình thức thi",
            code="CUSTOM_SEL_01",
            type="selection",
            position=3,
            attribute_group_id=42,
        )

        blocks = TemplateBlockSyncService.sync_blocks_for_template(self.template)
        tbl_block = next((b for b in blocks if b.code == "CUSTOM_TBL_01"), None)
        sel_block = next((b for b in blocks if b.code == "CUSTOM_SEL_01"), None)

        self.assertIsNotNone(tbl_block)
        self.assertEqual(tbl_block.block_type, "table")
        self.assertIn("columns", tbl_block.config.get("table_schema", {}))

        self.assertIsNotNone(sel_block)
        self.assertEqual(sel_block.block_type, "selection")
        self.assertEqual(sel_block.config.get("attribute_group_id"), 42)


class SelectionSubRendererTestCase(TestCase):
    """Bộ kiểm thử cho SelectionSubRenderer dynamic."""

    def setUp(self):
        from handlers.renderers.simple.selection_renderer import SelectionSubRenderer
        self.renderer = SelectionSubRenderer()

    def test_can_render_validates_type(self):
        self.assertTrue(self.renderer.can_render({"type": "selection", "code": "custom_sel"}))
        self.assertTrue(self.renderer.can_render({"type": "selection", "code": "teaching_methods"}))
        self.assertFalse(self.renderer.can_render({"type": "text"}))

    def test_render_updates_existing_paragraph_for_custom_selection(self):
        doc = Document()
        p = doc.add_paragraph("Ngôn ngữ giảng dạy: [Mặc định]")
        sub_section = {
            "type": "selection",
            "name": "Ngôn ngữ giảng dạy",
            "code": "language",
            "selected_values": [{"name_value": "Tiếng Anh"}, {"name_value": "Tiếng Việt"}],
        }
        self.renderer.render(doc, sub_section, {"dummy": True})
        self.assertEqual(p.text, "Ngôn ngữ giảng dạy: Tiếng Anh, Tiếng Việt")

    def test_render_appends_new_paragraph_for_custom_selection(self):
        doc = Document()
        sub_section = {
            "type": "selection",
            "name": "Hình thức đánh giá",
            "code": "custom_exam_type",
            "position": 4,
            "selected_values": [{"name_value": "Trắc nghiệm"}],
        }
        self.renderer.render(doc, sub_section, {"dummy": True})
        self.assertEqual(len(doc.paragraphs), 1)
        p = doc.paragraphs[0]
        self.assertEqual(p.text, "4. Hình thức đánh giá: Trắc nghiệm")
        self.assertTrue(p.runs[0].bold)


class TableSubRendererTestCase(TestCase):
    """Bộ kiểm thử cho TableSubRenderer dynamic."""

    def setUp(self):
        from handlers.renderers.simple.table_renderer import TableSubRenderer
        self.renderer = TableSubRenderer()

    def test_can_render_validates_type(self):
        self.assertTrue(self.renderer.can_render({"type": "table", "code": "custom_table"}))
        self.assertFalse(self.renderer.can_render({"type": "text"}))

    def test_render_creates_table_from_schema(self):
        doc = Document()
        sub_section = {
            "type": "table",
            "name": "Bảng phân bổ thời gian",
            "position": 3,
            "table_schema": {
                "columns": [
                    {"id": "col1", "headerName": "Tuần", "field": "col1"},
                    {"id": "col2", "headerName": "Chủ đề", "field": "col2"},
                ],
                "rows": [
                    {"col1": "Tuần 1", "col2": "Giới thiệu chung"},
                    {"col1": "Tuần 2", "col2": "Cơ sở dữ liệu"},
                ],
            },
        }
        self.renderer.render(doc, sub_section, {"dummy": True})

        # Kiểm tra tiêu đề bảng
        self.assertEqual(len(doc.paragraphs), 1)
        self.assertEqual(doc.paragraphs[0].text, "3. Bảng phân bổ thời gian")
        self.assertTrue(doc.paragraphs[0].runs[0].bold)

        # Kiểm tra bảng được tạo
        self.assertEqual(len(doc.tables), 1)
        tbl = doc.tables[0]
        self.assertEqual(len(tbl.rows), 3)  # 1 header + 2 data rows
        self.assertEqual(len(tbl.columns), 2)
        self.assertEqual(tbl.rows[0].cells[0].text, "Tuần")
        self.assertEqual(tbl.rows[0].cells[1].text, "Chủ đề")
        self.assertEqual(tbl.rows[1].cells[0].text, "Tuần 1")
        self.assertEqual(tbl.rows[1].cells[1].text, "Giới thiệu chung")


class MergedTableCellAlignmentTestCase(TestCase):
    """Kiểm tra bảo toàn định dạng căn lề của ô gộp dọc khi format bảng DOCX."""

    def test_merged_cell_alignment_not_overwritten_by_continuation_rows(self):
        from handlers.docx_renderer.style_manager import StyleManager
        doc = Document()
        table = doc.add_table(rows=4, cols=2)
        table.rows[0].cells[0].text = "Header 1"
        table.rows[0].cells[1].text = "Header 2"
        table.rows[1].cells[0].text = "CO1"
        table.rows[1].cells[1].text = "CLO1.1"
        table.rows[2].cells[0].text = "CO1"
        table.rows[2].cells[1].text = "CLO1.2"
        table.rows[3].cells[0].text = "CO2"
        table.rows[3].cells[1].text = "CLO2.1"

        table.cell(1, 0).merge(table.cell(2, 0))

        header_style = {"alignment": "CENTER"}
        body_style = {"alignment": "JUSTIFY"}
        cell_alignments = {"1,0": "CENTER"}

        StyleManager._apply_styles_to_table_cells(
            table, header_style, body_style, {}, ["co", "clo"], False, cell_alignments
        )

        p1 = table.rows[1].cells[0].paragraphs[0]._p
        jc1 = p1.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}jc")
        valign1 = table.rows[1].cells[0]._tc.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tcPr/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}vAlign")
        self.assertIsNotNone(jc1)
        self.assertEqual(jc1.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val"), "center")
        self.assertIsNotNone(valign1)
        self.assertEqual(valign1.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val"), "center")

        p3 = table.rows[3].cells[0].paragraphs[0]._p
        jc3 = p3.find("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}jc")
        self.assertIsNotNone(jc3)
        self.assertEqual(jc3.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val"), "both")


class CLOPLOMatrixFormattingTestCase(TestCase):
    """Kiểm tra định dạng căn giữa toàn bộ ô và độ rộng bảng ma trận CLO-PLO."""

    def test_matrix_table_cells_centered_and_widths_preserved(self):
        from handlers.docx_renderer.style_manager import StyleManager
        from docx import Document
        from docx.enum.table import WD_TABLE_ALIGNMENT

        doc = Document()
        table = doc.add_table(rows=3, cols=3)
        table.rows[0].cells[0].text = "CLOs"
        table.rows[0].cells[1].text = "PLO.1"
        table.rows[0].cells[2].text = "PLO.2"
        table.rows[1].cells[0].text = "1"
        table.rows[1].cells[1].text = "3"
        table.rows[1].cells[2].text = "5"
        table.rows[2].cells[0].text = "2"
        table.rows[2].cells[1].text = "2"
        table.rows[2].cells[2].text = "1"

        header_style = {"alignment": "CENTER"}
        body_style = {"alignment": "JUSTIFY"}

        self.assertTrue(StyleManager._is_matrix_table(table))
        StyleManager._format_matrix_table(table, header_style, body_style)

        self.assertEqual(table.alignment, WD_TABLE_ALIGNMENT.CENTER)
        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        for r in table.rows:
            for c in r.cells:
                p_jc = c.paragraphs[0]._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc") if c.paragraphs else None
                self.assertIsNotNone(p_jc)
                self.assertEqual(p_jc.attrib.get(f"{{{w_ns}}}val"), "center")

    def test_matrix_title_centered_and_legend_formatted(self):
        from docx import Document
        from docx.enum.table import WD_TABLE_ALIGNMENT
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from handlers.renderers.complex.clo_plo_matrix_renderer import CLOPLOMatrixSubRenderer
        from handlers.docx_renderer.style_manager import StyleManager

        doc = Document()
        title_p = CLOPLOMatrixSubRenderer._ensure_matrix_title(doc)
        self.assertEqual(title_p.alignment, WD_ALIGN_PARAGRAPH.CENTER)

        legend_tbl = CLOPLOMatrixSubRenderer._ensure_matrix_legend(doc)
        self.assertEqual(legend_tbl.alignment, WD_TABLE_ALIGNMENT.CENTER)
        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        tblW = legend_tbl._tbl.tblPr.find(f"{{{w_ns}}}tblW")
        self.assertIsNotNone(tblW)
        self.assertEqual(tblW.attrib.get(f"{{{w_ns}}}w"), "5670")

        for row in legend_tbl.rows:
            for cell in row.cells:
                tcW = cell._tc.get_or_add_tcPr().find(f"{{{w_ns}}}tcW")
                self.assertIsNotNone(tcW)
                self.assertEqual(tcW.attrib.get(f"{{{w_ns}}}w"), "2835")

        p_style = {"alignment": "JUSTIFY"}
        StyleManager._format_paragraphs([title_p], p_style, {})
        p_jc = title_p._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc")
        self.assertIsNotNone(p_jc)
        self.assertEqual(p_jc.attrib.get(f"{{{w_ns}}}val"), "center")

    def test_preview_builder_serializes_centered_title_and_legend(self):
        from docx import Document
        from handlers.renderers.complex.clo_plo_matrix_renderer import CLOPLOMatrixSubRenderer
        from handlers.preview_builder import PreviewBuilder

        doc = Document()
        CLOPLOMatrixSubRenderer._ensure_matrix_title(doc)
        CLOPLOMatrixSubRenderer._ensure_matrix_legend(doc)

        elements = PreviewBuilder._serialize_body(doc._body._body)
        title_el = next((el for el in elements if el.get("type") == "paragraph" and "ma trận tích hợp" in "".join(r["text"] for r in el.get("runs", [])).lower()), None)
        self.assertIsNotNone(title_el)
        self.assertEqual(title_el.get("alignment"), "CENTER")

        legend_el = next((el for el in elements if el.get("type") == "table" and el.get("is_legend")), None)
        self.assertIsNotNone(legend_el)
        self.assertTrue(legend_el.get("borderless"))
        self.assertEqual(legend_el.get("alignment"), "CENTER")


class ScheduleMultiTableAlignmentTestCase(TestCase):
    """Kiểm tra 1 cấu hình cell_alignments dùng chung cho tất cả bảng kế hoạch giảng dạy."""

    def _create_mock_schedule_table(self, doc, num_sessions: int):
        total_rows = 4 + num_sessions + 1
        table = doc.add_table(rows=total_rows, cols=11)
        table.rows[3].cells[0].text = "(1)"
        for s in range(num_sessions):
            table.rows[4 + s].cells[0].text = str(s + 1)
            table.rows[4 + s].cells[2].text = "CLO1"
            table.rows[4 + s].cells[4].text = "10"
        table.rows[-1].cells[0].text = "Tổng cộng"
        table.rows[-1].cells[4].text = "100"
        return table

    def test_schedule_cell_alignments_shared_across_multiple_tables(self):
        from docx import Document
        from handlers.docx_renderer.style_manager import StyleManager

        doc = Document()
        table1 = self._create_mock_schedule_table(doc, num_sessions=1)
        table2 = self._create_mock_schedule_table(doc, num_sessions=3)

        block = TemplateBlock(code="teaching_schedule", name="Kế hoạch giảng dạy chi tiết", block_type="reference")
        block.config = {
            "code": "teaching_schedule",
            "cell_alignments": {
                "0,0": "CENTER",
                "3,2": "CENTER",
                "4,2": "CENTER",
                "-1,4": "RIGHT",
            },
        }

        StyleManager._format_tables([table1, table2], block, block_layout=None)

        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        for t in [table1, table2]:
            p00 = t.rows[0].cells[0].paragraphs[0]._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc")
            self.assertIsNotNone(p00)
            self.assertEqual(p00.attrib.get(f"{{{w_ns}}}val"), "center")

            p32 = t.rows[3].cells[2].paragraphs[0]._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc")
            self.assertIsNotNone(p32)
            self.assertEqual(p32.attrib.get(f"{{{w_ns}}}val"), "center")

            plast = t.rows[-1].cells[4].paragraphs[0]._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc")
            self.assertIsNotNone(plast)
            self.assertEqual(plast.attrib.get(f"{{{w_ns}}}val"), "right")

        for r_idx in [4, 5, 6]:
            p_data = table2.rows[r_idx].cells[2].paragraphs[0]._p.find(f"{{{w_ns}}}pPr/{{{w_ns}}}jc")
            self.assertIsNotNone(p_data)
            self.assertEqual(p_data.attrib.get(f"{{{w_ns}}}val"), "center")


class LecturerDisplayTypeTextTestCase(TestCase):
    """Kiểm thử chuyển đổi hiển thị Bảng (TABLE) và Văn bản (TEXT) cho lecturer_info."""

    def test_lecturer_info_display_type_table(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_008", name="Phụ trách môn học", block_type="reference")
        block.config = {"code": "lecturer_info", "display_type": "TABLE"}
        sub_map = {
            "lecturer_info": {
                "type": "reference",
                "code": "lecturer_info",
                "reference_data": {
                    "first_name": "Nam",
                    "last_name": "Nguyễn",
                    "email": "nam@ou.edu.vn",
                    "room": "P.101",
                    "faculty": "CNTT",
                },
            }
        }
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=sub_map)
        self.assertEqual(len(doc.tables), 1)
        self.assertEqual(len(doc.tables[0].rows), 4)

    def test_lecturer_info_display_type_text(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_008", name="Phụ trách môn học", block_type="reference")
        block.config = {"code": "lecturer_info", "display_type": "TEXT"}
        sub_map = {
            "lecturer_info": {
                "type": "reference",
                "code": "lecturer_info",
                "reference_data": {
                    "first_name": "Nam",
                    "last_name": "Nguyễn",
                    "email": "nam@ou.edu.vn",
                    "room": "P.101",
                    "faculty": "CNTT",
                },
            }
        }
        custom_cols = [
            {"column_label": "Học vị", "column_key": "custom_lecturer_info_001", "default_value": "Tiến sĩ"}
        ]
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=sub_map, custom_columns=custom_cols)
        self.assertEqual(len(doc.tables), 0)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        self.assertIn("Phụ trách môn học", paras[0])
        self.assertIn("• Khoa/Bộ môn: CNTT", paras[1])
        self.assertIn("• Giảng viên: Nguyễn Nam", paras[2])
        self.assertIn("• Email: nam@ou.edu.vn", paras[3])
        self.assertIn("• Phòng: P.101", paras[4])
        self.assertIn("• Học vị: Tiến sĩ", paras[5])


class CreditDisplayTypeStrategyTestCase(TestCase):
    """Kiểm thử Strategy Pattern cho mục Số tín chỉ (Credit): TABLE, TEXT (INLINE), TEXT (BULLET)."""

    def setUp(self):
        self.sub_map = {
            "credit": {
                "type": "reference",
                "code": "credit",
                "reference_data": {
                    "number_theory": 2,
                    "number_practice": 1,
                    "hour_self_study": 30,
                },
            }
        }

    def test_credit_display_type_table_keeps_table(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_CREDIT", name="Số tín chỉ", block_type="reference")
        block.config = {"code": "credit", "display_type": "TABLE"}
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=self.sub_map)
        self.assertEqual(len(doc.tables), 1)

    def test_credit_display_type_text_inline(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_CREDIT", name="Số tín chỉ", block_type="reference")
        block.config = {"code": "credit", "display_type": "TEXT", "text_format": "INLINE"}
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=self.sub_map)
        self.assertEqual(len(doc.tables), 0)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        self.assertIn("Số tín chỉ", paras[0])
        self.assertIn("Tổng số: 3 tín chỉ (Lý thuyết: 2, Thực hành: 1, Số giờ tự học: 30 giờ)", paras[1])

    def test_credit_display_type_text_inline_with_custom_columns(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_CREDIT", name="Số tín chỉ", block_type="reference")
        block.config = {"code": "credit", "display_type": "TEXT", "text_format": "INLINE"}
        custom_cols = [
            {"column_label": "Ghi chú", "column_key": "custom_credit_001", "default_value": "Môn bắt buộc"}
        ]
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=self.sub_map, custom_columns=custom_cols)
        self.assertEqual(len(doc.tables), 0)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        self.assertIn("Ghi chú: Môn bắt buộc", paras[1])

    def test_credit_display_type_text_bullet(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_CREDIT", name="Số tín chỉ", block_type="reference")
        block.config = {"code": "credit", "display_type": "TEXT", "text_format": "BULLET"}
        custom_cols = [
            {"column_label": "Ghi chú", "column_key": "custom_credit_001", "default_value": "Môn tự chọn"}
        ]
        BlockProcessor._render_block(doc, block, {}, {}, sub_sections_map=self.sub_map, custom_columns=custom_cols)
        self.assertEqual(len(doc.tables), 0)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        self.assertIn("Số tín chỉ", paras[0])
        self.assertIn("• Tổng số: 3 tín chỉ", paras[1])
        self.assertIn("• Lý thuyết: 2 tín chỉ", paras[2])
        self.assertIn("• Thực hành: 1 tín chỉ", paras[3])
        self.assertIn("• Số giờ tự học: 30 giờ", paras[4])
        self.assertIn("• Ghi chú: Môn tự chọn", paras[5])

    def test_credit_text_with_label_overrides(self):
        from docx import Document
        from handlers.docx_renderer.block_processor import BlockProcessor

        doc = Document()
        block = TemplateBlock(code="BLOCK_CREDIT", name="Số tín chỉ", block_type="reference")
        block.config = {"code": "credit", "display_type": "TEXT", "text_format": "INLINE"}
        block_layout = {
            "label_overrides": {
                "credit": {
                    "credit_total": "Tổng tín chỉ",
                    "number_theory": "Lý thuyết chuẩn",
                }
            }
        }
        BlockProcessor._render_block(doc, block, {}, block_layout, sub_sections_map=self.sub_map)
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        self.assertIn("Tổng tín chỉ: 3 tín chỉ (Lý thuyết chuẩn: 2, Thực hành: 1, Số giờ tự học: 30 giờ)", paras[1])


class TableManagerLabelOverridesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username="test_lo_admin",
            email="lo_admin@test.com",
            password="test_password"
        )
        self.template = TemplateSyllabus.objects.create(
            name="Template Label Overrides Test",
            version="v1.0",
            block_layout={
                "label_overrides": {
                    "credit": {
                        "number_theory": "Lý thuyết (Chuẩn)",
                    }
                }
            }
        )
        self.credit_block = TemplateBlock.objects.create(
            template=self.template,
            code="credit_block",
            name="Số tín chỉ",
            block_type="reference",
            config={"code": "credit", "table_code": "credit"},
            position=1,
        )

    def test_apply_grid_label_overrides(self):
        from docx import Document
        from handlers.docx_renderer.table_manager import TableManager

        doc = Document()
        table = doc.add_table(rows=2, cols=4)
        headers = ["Tổng số/Total", "Lý thuyết/Theory", "Thực hành/Practice", "Số giờ tự học/Self-study"]
        for idx, h in enumerate(headers):
            table.rows[0].cells[idx].text = h

        label_overrides = {
            "credit": {
                "number_theory": "Lý thuyết (Tiết chuẩn)",
                "hour_self_study": "Thời gian tự nghiên cứu",
            }
        }
        TableManager._apply_label_overrides_to_table(table, "credit", label_overrides)
        self.assertEqual(table.rows[0].cells[1].text, "Lý thuyết (Tiết chuẩn)")
        self.assertEqual(table.rows[0].cells[3].text, "Thời gian tự nghiên cứu")
        self.assertEqual(table.rows[0].cells[0].text, "Tổng số/Total")

    def test_apply_kv_label_overrides(self):
        from docx import Document
        from handlers.docx_renderer.table_manager import TableManager

        doc = Document()
        table = doc.add_table(rows=0, cols=2)
        rows_data = [
            ("Khoa/Bộ môn", "Khoa CNTT"),
            ("Giảng viên", "TS. Nguyễn Nam"),
            ("Email", "nam@ou.edu.vn"),
            ("Phòng", "P.501"),
        ]
        for lbl, val in rows_data:
            r = table.add_row()
            r.cells[0].text = lbl
            r.cells[1].text = val

        label_overrides = {
            "lecturer_info": {
                "faculty": "Đơn vị đào tạo",
                "email": "Hòm thư điện tử",
            }
        }
        TableManager._apply_label_overrides_to_table(table, "lecturer_info", label_overrides)
        self.assertEqual(table.rows[0].cells[0].text, "Đơn vị đào tạo")
        self.assertEqual(table.rows[1].cells[0].text, "Giảng viên")
        self.assertEqual(table.rows[2].cells[0].text, "Hòm thư điện tử")

    def test_batch_save_with_label_overrides(self):
        self.client.force_authenticate(user=self.admin_user)
        url = f"/templates/{self.template.id}/blocks/{self.credit_block.id}/batch-save/"
        payload = {
            "style_config": {"title_style": {"bold": True}},
            "config": {"code": "credit", "table_code": "credit"},
            "label_overrides": {
                "number_theory": "Lý thuyết (Tiết chuẩn)",
                "number_practice": "Thực hành (Tiết chuẩn)",
            },
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.template.refresh_from_db()
        lo = self.template.block_layout.get("label_overrides", {}).get("credit", {})
        self.assertEqual(lo.get("number_theory"), "Lý thuyết (Tiết chuẩn)")
        self.assertEqual(lo.get("number_practice"), "Thực hành (Tiết chuẩn)")
        self.assertIn("block_layout", res.data)

    def test_syllabus_detail_serializer_label_overrides(self):
        from syllabuses.models import Syllabus, Subject, Credit, Faculty, Lecturer
        from syllabuses.serializer import SyllabusDetailSerializer

        faculty = Faculty.objects.create(name="Khoa CNTT Test")
        lecturer = Lecturer.objects.create(user=self.admin_user, faculty=faculty)
        credit = Credit.objects.create(number_theory=2, number_practice=1, hour_self_study=60)
        subject = Subject.objects.create(name="CS101", code="CS101", credit=credit)
        syllabus = Syllabus.objects.create(
            name="Syllabus CS101",
            subject=subject,
            faculty=faculty,
            lecturer=lecturer,
            template=self.template,
        )
        serializer = SyllabusDetailSerializer(syllabus)
        self.assertIn("label_overrides", serializer.data)
        self.assertEqual(
            serializer.data["label_overrides"].get("credit", {}).get("number_theory"),
            "Lý thuyết (Chuẩn)",
        )

    def test_template_clone_full_data_preservation(self):
        from syllabuses.models import CustomColumn, TemplateMainSection, TemplateTextSubSection
        from services.template_block_sync_service import TemplateBlockSyncService

        col = CustomColumn.objects.create(
            template=self.template,
            table_code="credit",
            column_key="custom_credit_001",
            column_label="Ghi chú test",
            column_type="text",
            is_active=True,
        )
        main_sec = TemplateMainSection.objects.create(
            template=self.template,
            name="Phần 1",
            code="SECTION_1",
            position=1,
        )
        sub_sec = TemplateTextSubSection.objects.create(
            main_section=main_sec,
            name="Mô tả",
            code="TEXT_01",
            type="text",
            position=1,
            display_mode="input",
        )
        TemplateBlockSyncService.sync_blocks_for_template(self.template)

        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post(
            f"/templates/{self.template.id}/clone/",
            {"new_name": "Cloned Test Template", "new_version": "v9.9"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)

        cloned_tpl = TemplateSyllabus.objects.get(id=res.data["id"])
        self.assertEqual(cloned_tpl.parent_id, self.template.id)
        self.assertEqual(
            cloned_tpl.custom_columns.filter(is_active=True).count(),
            self.template.custom_columns.filter(is_active=True).count(),
        )
        self.assertEqual(
            cloned_tpl.blocks.filter(is_active=True).count(),
            self.template.blocks.filter(is_active=True).count(),
        )
        self.assertEqual(cloned_tpl.block_layout, self.template.block_layout)












class DigitalSignatureTestCase(TestCase):
    def setUp(self):
        self.faculty = Faculty.objects.create(name="Khoa Công nghệ Thông tin")
        self.user_gv = User.objects.create_user(
            username="gv_test", password="password", first_name="Thành", last_name="Dương Hữu"
        )
        self.lecturer_gv = Lecturer.objects.create(
            user=self.user_gv, faculty=self.faculty, faculty_role=Lecturer.FacultyRole.LECTURER
        )
        self.user_dean = User.objects.create_user(
            username="dean_test", password="password", first_name="Vinh", last_name="Trương Hoàng"
        )
        self.lecturer_dean = Lecturer.objects.create(
            user=self.user_dean, faculty=self.faculty, faculty_role=Lecturer.FacultyRole.VICE_DEAN
        )
        self.credit = Credit.objects.create(number_theory=3, number_practice=0, hour_self_study=90)
        self.subject = Subject.objects.create(code="IT101", name="Nhập môn lập trình", credit=self.credit)
        self.template = TemplateSyllabus.objects.create(name="Template CNTT", version="v1.0")
        self.syllabus = Syllabus.objects.create(
            name="Đề cương NMLT", subject=self.subject, faculty=self.faculty,
            lecturer=self.lecturer_gv, template=self.template, status="draft"
        )

    def test_faculty_role_and_is_leader(self):
        self.assertFalse(self.lecturer_gv.is_leader)
        self.assertTrue(self.lecturer_dean.is_leader)

    def test_permission_can_sign(self):
        from services.signature_service import SignatureService
        allowed, _ = SignatureService.can_sign(self.user_gv, self.syllabus, "lecturer")
        self.assertTrue(allowed)

        allowed, _ = SignatureService.can_sign(self.user_dean, self.syllabus, "lecturer")
        self.assertFalse(allowed)

        allowed, _ = SignatureService.can_sign(self.user_dean, self.syllabus, "faculty_dean")
        self.assertTrue(allowed)

        allowed, _ = SignatureService.can_sign(self.user_gv, self.syllabus, "faculty_dean")
        self.assertFalse(allowed)

    def test_sign_syllabus_workflow(self):
        from services.signature_service import SignatureService
        sample_b64 = (
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )

        sig, err = SignatureService.sign_syllabus(
            self.user_gv, self.syllabus, "lecturer", image_raw=sample_b64
        )
        self.assertIsNotNone(sig)
        self.assertEqual(sig.signer_name, "Dương Hữu Thành")
        self.assertEqual(sig.signer_title, "GIẢNG VIÊN BIÊN SOẠN")
        self.syllabus.refresh_from_db()
        self.assertEqual(self.syllabus.status, Syllabus.Status.SUBMITTED)

        sig_dean, err = SignatureService.sign_syllabus(
            self.user_dean, self.syllabus, "faculty_dean", image_raw=sample_b64
        )
        self.assertIsNotNone(sig_dean)
        self.assertEqual(sig_dean.signer_name, "Trương Hoàng Vinh")
        self.assertEqual(sig_dean.signer_title, "PHÓ TRƯỞNG KHOA CÔNG NGHỆ THÔNG TIN")
        self.syllabus.refresh_from_db()
        self.assertEqual(self.syllabus.status, Syllabus.Status.APPROVED)

    def test_render_docx_with_signature(self):
        from services.signature_service import SignatureService
        sample_b64 = (
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        )
        SignatureService.sign_syllabus(self.user_gv, self.syllabus, "lecturer", image_raw=sample_b64)

        from handlers.header_footer_renderer import HeaderFooterRenderer
        from docx import Document
        doc = Document()
        renderer = HeaderFooterRenderer()
        renderer.render_footer(doc, config={}, syllabus=self.syllabus)
        self.assertEqual(len(doc.tables), 1)
        tbl = doc.tables[0]
        self.assertTrue(len(tbl.rows[0].cells) >= 2)

    def test_api_sign_and_get_signatures(self):
        client = APIClient()
        client.force_authenticate(user=self.user_gv)
        sample_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

        res = client.post(f"/syllabuses/{self.syllabus.id}/sign/", {
            "role": "lecturer",
            "signature_image": sample_b64
        }, format="json")
        self.assertEqual(res.status_code, 200)

        res_list = client.get(f"/syllabuses/{self.syllabus.id}/signatures/")
        self.assertEqual(res_list.status_code, 200)
        self.assertEqual(len(res_list.data), 1)

        # Dean signs
        client.force_authenticate(user=self.user_dean)
        res_dean = client.post(f"/syllabuses/{self.syllabus.id}/sign/", {
            "role": "faculty_dean",
            "signature_image": sample_b64
        }, format="json")
        self.assertEqual(res_dean.status_code, 200)

        res_detail = client.get(f"/syllabuses/{self.syllabus.id}/")
        self.assertEqual(res_detail.status_code, 200)
        self.assertEqual(len(res_detail.data["signatures"]), 2)
        self.assertEqual(res_detail.data["status"], Syllabus.Status.APPROVED)

    def test_api_user_signature(self):
        client = APIClient()
        client.force_authenticate(user=self.user_gv)
        sample_b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

        res_post = client.post("/users/signature/", {
            "signature_image": sample_b64
        }, format="json")
        self.assertEqual(res_post.status_code, 200)
        self.assertIsNotNone(res_post.data.get("signature_url"))

        res_get = client.get("/users/signature/")
        self.assertEqual(res_get.status_code, 200)
        self.assertIsNotNone(res_get.data.get("signature_url"))
        self.assertEqual(res_get.data.get("faculty_role"), "lecturer")

    def test_syllabus_simple_serializer_approval_sync(self):
        from syllabuses.serializer import SyllabusSimpleSerializer
        self.syllabus.status = "Approved"
        self.syllabus.approved_by = self.user_dean
        self.syllabus.save()
        data = SyllabusSimpleSerializer(self.syllabus).data
        self.assertEqual(data["status"], "Approved")
        self.assertTrue(data["is_approved"])
        self.assertEqual(data["approved_by_name"], "Trương Hoàng Vinh")

    def test_unapprove_syllabus_api(self):
        client = APIClient()
        self.syllabus.status = "Approved"
        self.syllabus.approved_by = self.user_dean
        self.syllabus.save()

        # Non-leader cannot unapprove
        client.force_authenticate(user=self.user_gv)
        res_fail = client.post(f"/syllabuses/{self.syllabus.id}/unapprove/")
        self.assertEqual(res_fail.status_code, 403)

        # Faculty leader can unapprove
        client.force_authenticate(user=self.user_dean)
        res_ok = client.post(f"/syllabuses/{self.syllabus.id}/unapprove/")
        self.assertEqual(res_ok.status_code, 200)
        self.syllabus.refresh_from_db()
        self.assertEqual(self.syllabus.status, Syllabus.Status.DRAFT)
        self.assertIsNone(self.syllabus.approved_by)
        self.assertFalse(self.syllabus.is_approved)

    def test_update_faculty_role_via_serializer(self):
        from syllabuses.serializer import UserDetailSerializer
        serializer = UserDetailSerializer(self.user_gv, data={"faculty_role": "dean"}, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.lecturer_gv.refresh_from_db()
        self.assertEqual(self.lecturer_gv.faculty_role, Lecturer.FacultyRole.DEAN)
        self.assertTrue(self.lecturer_gv.is_leader)

    def test_export_docx_signature_and_names_when_approved(self):
        import io
        from PIL import Image
        from docx import Document
        from django.core.files.uploadedfile import SimpleUploadedFile
        from handlers.header_footer_renderer import HeaderFooterRenderer

        img = Image.new("RGB", (10, 10), color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_content = buf.getvalue()

        self.lecturer_gv.signature_image = SimpleUploadedFile("sig_gv.png", png_content, content_type="image/png")
        self.lecturer_gv.save()
        self.lecturer_dean.signature_image = SimpleUploadedFile("sig_dean.png", png_content, content_type="image/png")
        self.lecturer_dean.save()

        self.syllabus.status = "Approved"
        self.syllabus.approved_by = self.user_dean
        self.syllabus.save()

        cfg = {
            "footer": {
                "signature_table": {
                    "columns": [
                        {"name": "Dummy Specialist 1", "title_lines": [{"text": "OLD TITLE 1"}]},
                        {"name": "Dummy Specialist 2", "title_lines": [{"text": "OLD TITLE 2"}]}
                    ]
                }
            }
        }

        doc = Document()
        hfr = HeaderFooterRenderer()
        hfr.render_footer(doc, cfg, syllabus=self.syllabus)

        sig_tbl = doc.tables[-1]
        cell_leader = sig_tbl.rows[0].cells[0]
        cell_lec = sig_tbl.rows[0].cells[1]

        # Leader cell must have Trương Hoàng Vinh, PHÓ TRƯỞNG KHOA CÔNG NGHỆ THÔNG TIN, and a picture
        self.assertIn("Trương Hoàng Vinh", cell_leader.text)
        self.assertNotIn("Dummy Specialist 1", cell_leader.text)
        self.assertIn("PHÓ TRƯỞNG KHOA CÔNG NGHỆ THÔNG TIN", cell_leader.text)
        leader_pics = [r for p in cell_leader.paragraphs for r in p.runs if r._r.xpath('.//a:blip/@r:embed')]
        self.assertTrue(len(leader_pics) >= 1)

        # Lecturer cell must have Dương Hữu Thành and a picture
        self.assertIn("Dương Hữu Thành", cell_lec.text)
        self.assertNotIn("Dummy Specialist 2", cell_lec.text)
        lec_pics = [r for p in cell_lec.paragraphs for r in p.runs if r._r.xpath('.//a:blip/@r:embed')]
        self.assertTrue(len(lec_pics) >= 1)

    def test_export_docx_signature_unapproved_does_not_include_leader_signature(self):
        import io
        from PIL import Image
        from docx import Document
        from django.core.files.uploadedfile import SimpleUploadedFile
        from handlers.header_footer_renderer import HeaderFooterRenderer

        img = Image.new("RGB", (10, 10), color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_content = buf.getvalue()

        self.lecturer_dean.signature_image = SimpleUploadedFile("sig_dean.png", png_content, content_type="image/png")
        self.lecturer_dean.save()

        self.syllabus.status = "Draft"
        self.syllabus.approved_by = None
        self.syllabus.save()

        doc = Document()
        hfr = HeaderFooterRenderer()
        hfr.render_footer(doc, {}, syllabus=self.syllabus)

        sig_tbl = doc.tables[-1]
        cell_leader = sig_tbl.rows[0].cells[0]
        leader_pics = [r for p in cell_leader.paragraphs for r in p.runs if r._r.xpath('.//a:blip/@r:embed')]
        self.assertEqual(len(leader_pics), 0)

    def test_export_docx_api_endpoint(self):
        client = APIClient()
        # 1. Unapproved -> 400
        self.syllabus.status = "Draft"
        self.syllabus.approved_by = None
        self.syllabus.save()

        res_unapproved = client.get(f"/export-syllabus/{self.syllabus.id}/")
        self.assertEqual(res_unapproved.status_code, 400)

        # 2. Approved -> 200
        self.syllabus.status = "Approved"
        self.syllabus.approved_by = self.user_dean
        self.syllabus.save()

        res_approved = client.get(f"/export-syllabus/{self.syllabus.id}/")
        self.assertEqual(res_approved.status_code, 200)
        self.assertEqual(
            res_approved["Content-Type"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    def test_anti_self_approval_br04(self):
        from services.signature_service import SignatureService
        # Assign lecturer of syllabus to dean
        self.syllabus.lecturer = self.lecturer_dean
        self.syllabus.save()

        # Dean cannot sign as dean for their own syllabus
        allowed, err = SignatureService.can_sign(self.user_dean, self.syllabus, "faculty_dean")
        self.assertFalse(allowed)
        self.assertIn("BR-04", err)

        client = APIClient()
        client.force_authenticate(user=self.user_dean)
        res = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res.status_code, 400)
        self.assertIn("BR-04", res.data.get("error", ""))

    def test_approve_requires_prerequisites(self):
        from syllabuses.models import TeachingSession, Assessment, Method, ScheduleGroup, TypeAssessment, SyllabusSignature
        client = APIClient()
        client.force_authenticate(user=self.user_dean)

        # Ensure syllabus is authored by lecturer_gv
        self.syllabus.lecturer = self.lecturer_gv
        self.syllabus.save()

        # 1. No teaching session & no assessment -> 400
        res = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Kế hoạch giảng dạy", res.data.get("error", ""))

        # Create teaching session
        sg, _ = ScheduleGroup.objects.get_or_create(name="Lý thuyết")
        TeachingSession.objects.create(
            syllabus=self.syllabus,
            schedule_group=sg,
            session_no=1,
            content="Nội dung buổi 1"
        )

        # Still missing Assessment -> 400
        res2 = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Phương pháp đánh giá", res2.data.get("error", ""))

        # Create assessment without method (weight = 0) -> 400
        ta, _ = TypeAssessment.objects.get_or_create(name="Đánh giá quá trình")
        assessment = Assessment.objects.create(
            syllabus=self.syllabus,
            type_assessment=ta
        )
        res3 = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res3.status_code, 400)
        self.assertIn("BR-02", res3.data.get("error", ""))

        # Create method with weight 100
        Method.objects.create(
            assessment=assessment,
            name="Thi cuối kỳ",
            weight=100
        )

        # Still missing Lecturer Signature -> 400
        res4 = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res4.status_code, 400)
        self.assertIn("chưa ký số", res4.data.get("error", ""))

        # Add Lecturer Signature
        SyllabusSignature.objects.create(
            syllabus=self.syllabus,
            signer=self.user_gv,
            signer_name=self.user_gv.get_full_name(),
            role=SyllabusSignature.SignatureRole.LECTURER,
            is_active=True
        )

        # Now approve succeeds -> 200
        res5 = client.post(f"/syllabuses/{self.syllabus.id}/approve/")
        self.assertEqual(res5.status_code, 200)
        self.syllabus.refresh_from_db()
        self.assertEqual(self.syllabus.status, Syllabus.Status.APPROVED)

    def test_bulk_update_deadlines_duration_minimum(self):
        client = APIClient()
        # Admin or specialist is needed
        admin_user = User.objects.create_superuser(
            username="admin_test_dl",
            password="AdminPassword123!",
            email="admin_dl@ou.edu.vn"
        )
        client.force_authenticate(user=admin_user)

        # < 3 days -> 400
        res_fail = client.patch("/syllabuses/bulk-update-deadlines/", {
            "ids": [self.syllabus.id],
            "start_date": "2026-11-10T08:00:00",
            "end_date": "2026-11-11T08:00:00"
        }, format="json")
        self.assertEqual(res_fail.status_code, 400)
        self.assertIn("BR-03", res_fail.data.get("err_msg", ""))

        # >= 3 days -> 200
        res_ok = client.patch("/syllabuses/bulk-update-deadlines/", {
            "ids": [self.syllabus.id],
            "start_date": "2026-11-10T08:00:00",
            "end_date": "2026-11-14T08:00:00"
        }, format="json")
        self.assertEqual(res_ok.status_code, 200)

    def test_assessment_negative_weight_validation(self):
        from syllabuses.serializer import SyllabusDetailSerializer
        from rest_framework.exceptions import ValidationError

        serializer = SyllabusDetailSerializer()
        invalid_ref_data = [
            {
                "type_assessment": {"id": 1},
                "assessment_methods": [
                    {"name": "A", "weight": -10},
                    {"name": "B", "weight": 110}
                ]
            }
        ]
        with self.assertRaises(ValidationError) as ctx:
            serializer._update_assessment(self.syllabus, invalid_ref_data)
        self.assertIn("từ 0% đến 100%", str(ctx.exception))

    def test_teaching_schedule_duplicate_sessions(self):
        from syllabuses.serializer import SyllabusDetailSerializer
        from rest_framework.exceptions import ValidationError

        serializer = SyllabusDetailSerializer()
        invalid_sessions = [
            {
                "schedule_group": {"id": 1},
                "teaching_sessions": [
                    {"session_no": 1, "content": "B1"},
                    {"session_no": 1, "content": "B1 trùng"}
                ]
            }
        ]
        with self.assertRaises(ValidationError) as ctx:
            serializer._update_teaching_schedule(self.syllabus, invalid_sessions)
        self.assertIn("bị trùng lặp", str(ctx.exception))

    def test_change_password_api(self):
        client = APIClient()
        client.force_authenticate(user=self.user_gv)

        # 1. Wrong old password -> 400
        res1 = client.post("/users/change-password/", {
            "old_password": "WrongPassword123!",
            "new_password": "NewValidPassword123!"
        }, format="json")
        self.assertEqual(res1.status_code, 400)
        self.assertIn("không chính xác", res1.data.get("error", ""))

        # 2. Same password -> 400
        res2 = client.post("/users/change-password/", {
            "old_password": "password",
            "new_password": "password"
        }, format="json")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("trùng", res2.data.get("error", ""))

        # 3. Success -> 200
        res3 = client.post("/users/change-password/", {
            "old_password": "password",
            "new_password": "NewStrongPass123!"
        }, format="json")
        self.assertEqual(res3.status_code, 200)

        # Verify password changed
        self.user_gv.refresh_from_db()
        self.assertTrue(self.user_gv.check_password("NewStrongPass123!"))

    def test_role_elevation_prevented(self):
        from syllabuses.serializer import UserDetailSerializer
        from rest_framework.exceptions import ValidationError
        from unittest.mock import MagicMock

        # Non-admin request context
        mock_request = MagicMock()
        mock_request.user = self.user_gv

        serializer = UserDetailSerializer(
            instance=self.user_gv,
            data={"user_role": "admin"},
            partial=True,
            context={"request": mock_request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("user_role", serializer.errors)

    def test_duplicate_subject_in_training_program(self):
        from syllabuses.serializer import SyllabusSerializer
        from syllabuses.models import Major, TrainingProgram

        major, _ = Major.objects.get_or_create(
            code="CNTT",
            defaults={"name": "Công nghệ thông tin", "faculty": self.faculty}
        )
        tp, _ = TrainingProgram.objects.get_or_create(
            name="CTĐT CNTT 2026",
            academic_year=2026,
            defaults={"major": major}
        )
        self.syllabus.training_programs.add(tp)

        # Try to create another syllabus with same subject and training program
        serializer = SyllabusSerializer(data={
            "name": "Đề cương trùng môn",
            "subject_obj": self.subject.id,
            "training_program_obj": tp.id,
            "template_obj": self.template.id,
            "faculty_obj": self.faculty.id,
            "lecturer_obj": self.lecturer_gv.user.id
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("đã có đề cương", str(serializer.errors))

    def test_major_code_validation(self):
        from syllabuses.serializer import MajorSerializer
        serializer = MajorSerializer(data={
            "name": "Chuyên ngành Test",
            "code": "invalid code!",
            "faculty": {"id": self.faculty.id, "name": self.faculty.name}
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("code", serializer.errors)

    def test_training_program_academic_year_validation(self):
        from syllabuses.serializer import TrainingProgramSerializer
        from syllabuses.models import Major
        major, _ = Major.objects.get_or_create(
            code="CNTT",
            defaults={"name": "Công nghệ thông tin", "faculty": self.faculty}
        )
        serializer = TrainingProgramSerializer(data={
            "name": "CTĐT Sai Năm",
            "academic_year": 1999,
            "major": {
                "id": major.id,
                "name": major.name,
                "code": major.code,
                "faculty": {"id": self.faculty.id, "name": self.faculty.name}
            }
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("academic_year", serializer.errors)

    def test_teaching_session_empty_content_rejected(self):
        from syllabuses.serializer import SyllabusDetailSerializer
        from syllabuses.models import ScheduleGroup
        from rest_framework.exceptions import ValidationError

        sg, _ = ScheduleGroup.objects.get_or_create(name="Lý thuyết")
        serializer = SyllabusDetailSerializer(instance=self.syllabus)

        invalid_data = [{
            "schedule_group": {"id": sg.id},
            "teaching_sessions": [{
                "session_no": 1,
                "content": "   ",
                "offline_hours": 3
            }]
        }]
        with self.assertRaises(ValidationError) as ctx:
            serializer._update_teaching_schedule(self.syllabus, invalid_data)
        self.assertIn("không được để trống", str(ctx.exception))

    def test_upload_docx_security_validation(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        client = APIClient()
        admin_user = User.objects.create_superuser(
            username="admin_docx_test",
            email="admin_docx@test.com",
            password="password"
        )
        client.force_authenticate(user=admin_user)

        # 1. Bad zip file
        bad_file = SimpleUploadedFile("test.docx", b"not a zip file", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        res = client.post(f"/templates/{self.template.id}/upload-docx/", {"file": bad_file}, format="multipart")
        self.assertEqual(res.status_code, 400)
        self.assertIn("không phải là file DOCX hợp lệ", res.data.get("error", ""))

        # 2. Non-docx file extension
        txt_file = SimpleUploadedFile("test.txt", b"plain text", content_type="text/plain")
        res2 = client.post(f"/templates/{self.template.id}/upload-docx/", {"file": txt_file}, format="multipart")
        self.assertEqual(res2.status_code, 400)
        self.assertIn(".docx", res2.data.get("error", ""))
