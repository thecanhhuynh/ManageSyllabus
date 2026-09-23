---
trigger: always_on
---

# QUY TẮC PHÁT TRIỂN DỰ ÁN MANAGESYLLABUS

## 1. NGUYÊN TẮC CLEAN CODE (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT)
- **Tuyệt đối KHÔNG viết if-else lồng nhau (Nested If-Else).** Sử dụng kỹ thuật **Guard Clauses (Early Return)** để xử lý điều kiện và thoát hàm sớm.
  - *Sai:* `if (a) { if (b) { if (c) { doSomething(); } } }`
  - *Đúng:* `if (!a) return; if (!b) return; if (!c) return; doSomething();`
- **Hàm ngắn gọn:** Mỗi hàm/method không nên dài quá 30 dòng. Nếu dài hơn, hãy tách nhỏ thành các hàm phụ.
- **Đặt tên rõ nghĩa:** Tên biến, hàm, class phải thể hiện đúng mục đích. Không dùng tên viết tắt vô nghĩa (ví dụ: `a`, `b`, `temp`, `data1`).
- **DRY (Don't Repeat Yourself):** Nếu một đoạn logic lặp lại từ 2 lần trở lên, phải tách ra thành hàm dùng chung.
- **Nguyên tắc một trách nhiệm (SRP):** Mỗi hàm/class chỉ nên đảm nhận một nhiệm vụ duy nhất.

## 2. KIẾN TRÚC TỔNG THỂ
- Dự án là hệ thống đa dịch vụ (Monorepo) bao gồm: Django (Python), Spring Boot (Java), ReactJS (Frontend).
- **Tuyệt đối không** thay đổi cấu trúc thư mục gốc của từng service nếu không có yêu cầu rõ ràng.
- Mọi cấu hình chung (database, redis, ports) phải được tham chiếu từ file `docker-compose.yml`.

## 3. BACKEND - DJANGO (PYTHON)
- Tuân thủ nghiêm ngặt **PEP 8**. Sử dụng `black` (dòng tối đa 88 ký tự) và `isort` để format code.
- **Tách biệt logic:** Không viết logic nghiệp vụ phức tạp trong `views.py`. Hãy đưa vào `services.py` hoặc `serializers.py`.
- **Bảo mật:** Tuyệt đối không lưu mật khẩu dạng plain text. Luôn dùng `User.objects.create_user()` hoặc `set_password()`.
- **Tối ưu ORM:** Sử dụng `select_related` và `prefetch_related` để tránh lỗi N+1 query khi truy vấn dữ liệu liên quan.

## 4. BACKEND - SPRING BOOT (JAVA)
- Tuân thủ cấu trúc package tiêu chuẩn: `controller`, `service`, `repository`, `entity`, `dto`.
- Sử dụng `@Transactional` cho các phương thức service có thao tác ghi dữ liệu (Create/Update/Delete).
- Luôn viết JavaDoc cho các public method.
- Sử dụng DTO (Data Transfer Object) để nhận và trả dữ liệu qua API, không trả về Entity trực tiếp.

## 5. FRONTEND - REACTJS
- Sử dụng **Functional Components** và **Hooks**. Tuyệt đối không dùng Class Components.
- Tên component và file phải theo chuẩn **PascalCase** (ví dụ: `UserRegistrationForm.jsx`).
- **Tách biệt logic gọi API:** Đưa vào thư mục `services/` hoặc `api/`, không gọi trực tiếp trong component. Sử dụng `axios` với interceptor để xử lý lỗi tập trung.
- Quản lý state rõ ràng, tránh lạm dụng `useEffect` gây re-render không cần thiết.

## 6. CƠ SỞ DỮ LIỆU & HẠ TẦNG
- **MySQL:** Tất cả thay đổi schema phải thực hiện qua migration (Django Migrations hoặc Flyway/Liquibase). Không sửa trực tiếp trong MySQL Workbench.
- **Redis:** Chỉ dùng cho caching và message broker. Không lưu dữ liệu vĩnh viễn.
- **Docker:** Mọi service mới phải được thêm vào `docker-compose.yml` và có thể chạy độc lập.

## 7. QUY TẮC SỬ DỤNG PACKAGE MANAGER
- Dự án Frontend (ReactJS) sử dụng **Yarn** làm trình quản lý gói chính thức.
- **Tuyệt đối KHÔNG sử dụng `npm`** cho bất kỳ tác vụ nào (cài đặt, chạy server, build).
- Các lệnh bắt buộc phải dùng:
  - Cài đặt thư viện: `yarn add <tên_thư_viện>` (hoặc `yarn add -D` cho dev dependencies).
  - Chạy dev server: `yarn start`.
  - Build production: `yarn build`.
- Nếu phát hiện file `package-lock.json` trong thư mục frontend, hãy cảnh báo tôi ngay lập tức.

## 8. QUY TẮC ĐẶT TÊN & CẤU TRÚC URL (DJANGO VS SPRING BOOT)

### 8.1. Đối với Django (Backend Python)
- **Tuyệt đối KHÔNG dùng tiền tố `/api/` trong URL.**
  - *Sai:* `/api/admin/users/`
  - *Đúng:* `/admin/users/`
- **Tuyệt đối KHÔNG dùng chữ "api" trong tên file hoặc tên class.**
  - *Sai:* `api_views.py`, `UserApiView`, `api_serializers.py`
  - *Đúng:* `views.py` (hoặc `user_views.py`), `UserView`, `serializers.py`
- **Tái sử dụng View theo chức năng:** Chức năng nào thì dùng View đó. Nếu đã có `UserView`, hãy kế thừa hoặc bổ sung logic vào chính View đó. Không tạo ra View mới trùng lặp chức năng.

### 8.2. Đối với Spring Boot (Backend Java)
- **BẮT BUỘC sử dụng tiền tố `/api/` trong URL.**
  - *Đúng:* `/api/admin/users/`
- **Tuân thủ cấu trúc package tiêu chuẩn**, không dùng chữ "api" trong tên class (ví dụ: dùng `UserController`, không dùng `UserApiController`).

## 9. QUY TẮC ĐÁNH GIÁ TÁC ĐỘNG (IMPACT ANALYSIS) KHI THÊM TÍNH NĂNG MỚI

Trước khi viết bất kỳ dòng code mới nào hoặc sửa đổi code hiện có, Agent **BẮT BUỘC** phải thực hiện bước Đánh giá tác động (Impact Analysis) và báo cáo lại trong phần Kế hoạch (Plan).

Cụ thể, Agent phải trả lời được các câu hỏi sau:
1. **Tìm kiếm sự phụ thuộc (Dependency Search):** Class, hàm, hoặc component mà tôi sắp sửa đổi đang được sử dụng ở những đâu khác trong dự án? (Ví dụ: Nếu sửa `UserSerializer`, phải tìm xem có bao nhiêu View, API, hoặc Service đang gọi nó).
2. **Ảnh hưởng đến Database (Schema Impact):** Việc thay đổi Model có làm ảnh hưởng đến các bảng dữ liệu liên quan, các khóa ngoại (Foreign Key), hoặc các logic truy vấn hiện có không? Có cần viết migration mới không?
3. **Ảnh hưởng đến Hợp đồng API (API Contract):** Việc thay đổi request/response có làm hỏng Frontend (ReactJS) hoặc các service khác (Spring Boot) đang gọi API này không?
4. **Ảnh hưởng đến UI/UX (Frontend Impact):** Component React này có được tái sử dụng ở nhiều màn hình khác nhau không? Nếu sửa props, có làm vỡ giao diện ở màn hình khác không?
5. **Đề xuất giải pháp:** Nếu phát hiện code xung quanh bị ảnh hưởng, hãy liệt kê danh sách các file cần sửa đổi kèm theo lý do, và đợi tôi xác nhận trước khi thực thi.

## 10. QUY TẮC LÀM VIỆC VỚI AI AGENT
- **Plan trước, Code sau:** Với mọi tác vụ phức tạp, hãy đưa ra kế hoạch từng bước (Plan) và đợi tôi xác nhận (Approve) trước khi viết code.
- **Không tự ý sửa file ngoài phạm vi:** Nếu cần thay đổi file khác, phải hỏi ý kiến tôi trước.
- **Viết Unit Test:** Mọi logic nghiệp vụ mới đều phải đi kèm với unit test tương ứng.
- **Giải thích code:** Khi đề xuất code mới, hãy giải thích ngắn gọn lý do tại sao chọn giải pháp đó.