import os
import sys
import django
from docx import Document

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syllabusapp.settings")
django.setup()

from syllabuses.models import TemplateSyllabus

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def create_shell(source_path: str, output_path: str) -> str:
    """Tạo file shell.docx từ source DOCX, chỉ giữ sectPr và các style."""
    if not source_path or not os.path.exists(source_path):
        raise FileNotFoundError(f"Source file không tồn tại: {source_path}")

    doc = Document(source_path)
    _clean_body_preserve_sect_pr(doc)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    return output_path


def _clean_body_preserve_sect_pr(doc: Document) -> None:
    """Xóa tất cả các phần tử trong body ngoại trừ sectPr."""
    body = doc._body._element
    sect_pr = body.find(f"{{{W_NS}}}sectPr")

    for child in list(body):
        if child != sect_pr:
            body.remove(child)

    empty_p = doc.add_paragraph()
    if sect_pr is not None:
        sect_pr.addprevious(empty_p._p)


def main():
    template = TemplateSyllabus.objects.first()
    if not template:
        print("Không tìm thấy TemplateSyllabus nào.")
        return

    source = template.file_clean.path if template.file_clean else template.file.path
    out_dir = os.path.join(os.path.dirname(source), "..", "shell")
    out_path = os.path.abspath(os.path.join(out_dir, "shell.docx"))

    created_path = create_shell(source, out_path)
    print(f"Shell DOCX đã tạo thành công tại: {created_path}")


if __name__ == "__main__":
    main()
