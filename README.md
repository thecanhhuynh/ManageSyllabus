# ManageSyllabus

Hệ thống quản lý đề cương môn học (Monorepo: Django · Spring Boot · ReactJS).

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| Quản lý đề cương | CRUD syllabus, phân quyền theo khoa/giảng viên |
| Xuất DOCX | Render đề cương ra file Word từ template mẫu |
| **Template Style Editor** | Chỉnh định dạng từng block trong template (font, spacing, label) qua giao diện kéo thả |
| **Bulk Spacing** | Áp dụng `space_before`/`space_after`/`line_spacing` đồng loạt cho nhiều block, có rollback 1 bước |

## Stack

- **Backend Django** — `syllabusapis/` — API REST, render DOCX
- **Backend Spring Boot** — `syllabusapp/` — nghiệp vụ bổ sung
- **Frontend React** — `manage-syllabus-app/` — SPA
- **DB** MySQL · **Cache/Broker** Redis · **Infra** Docker Compose

## Khởi động nhanh

```bash
docker compose up -d
# Frontend
cd manage-syllabus-app && yarn start
```

Xem chi tiết luồng dữ liệu Template → DOCX tại [`docs/DOCX_TEMPLATE_EDITING_FLOW.md`](docs/DOCX_TEMPLATE_EDITING_FLOW.md).