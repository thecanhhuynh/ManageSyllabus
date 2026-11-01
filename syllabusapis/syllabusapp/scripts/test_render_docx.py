import os
import sys
import django

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syllabusapp.settings")
django.setup()

from handlers.shell_renderer import ShellDocxRenderer
from syllabuses.models import Syllabus, TemplateSyllabus


def run_test():
    template = TemplateSyllabus.objects.first()
    if not template:
        print("Lỗi: Không tìm thấy TemplateSyllabus nào trong DB.")
        return

    syllabus = Syllabus.objects.first()
    subject_name = syllabus.subject.name if syllabus and syllabus.subject else "Mẫu Thiết Kế Hướng Đối Tượng"
    subject_code = syllabus.subject.code if syllabus and syllabus.subject else "ITEC1311"

    data_context = {
        "subject_name_vi": subject_name,
        "subject_code": subject_code,
        "english_title": "Object-Oriented Design Patterns",
        "course_detail": "Môn học này trang bị kiến thức phân tích thiết kế phần mềm...",
    }

    block_layout_override = {
        "header_footer": {
            "header": {
                "sections": [
                    {
                        "lines": [
                            {"text": "BỘ GIÁO DỤC VÀ ĐÀO TẠO", "style": {"align": "CENTER", "bold": False}},
                            {"text": "TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH", "style": {"align": "CENTER", "bold": True}},
                        ]
                    }
                ]
            },
            "footer": {
                "date_line": {
                    "text": "TP. Hồ Chí Minh, ngày 15 tháng 09 năm 2026",
                    "style": {"align": "RIGHT", "italic": True},
                },
                "signature_table": {
                    "columns": [
                        {
                            "title_lines": [{"text": "PHỤ TRÁCH KHOA CNTT", "bold": True}],
                            "subtitle": "(Ký và ghi rõ họ tên)",
                            "name": "TS. Trương Hoàng Vinh",
                        },
                        {
                            "title_lines": [{"text": "GIẢNG VIÊN BIÊN SOẠN", "bold": True}],
                            "subtitle": "(Ký và ghi rõ họ tên)",
                            "name": "ThS. Dương Hữu Thành",
                        },
                    ]
                },
            },
        }
    }

    renderer = ShellDocxRenderer()
    buffer = renderer.render(
        template,
        syllabus=syllabus,
        data_context=data_context,
        block_layout_override=block_layout_override,
    )

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "media"))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "test_syllabus_v3.docx")
    counter = 1
    while True:
        try:
            with open(out_path, "wb") as f:
                f.write(buffer.getvalue())
            break
        except PermissionError:
            out_path = os.path.join(out_dir, f"test_syllabus_v3_{counter}.docx")
            counter += 1

    print("=" * 60)
    print("✅ TEST RENDER THÀNH CÔNG!")
    print(f"📄 File kết quả: {out_path}")
    print(f"📦 Dung lượng: {os.path.getsize(out_path)} bytes")
    print("=" * 60)


if __name__ == "__main__":
    run_test()
