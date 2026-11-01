"""
handlers/renderers/simple/lecturer_renderer.py

Sub-Renderer xử lý thông tin Giảng viên và Phụ trách môn học (Lecturer Info).
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class LecturerSubRenderer(BaseSubRenderer):
    """Điền thông tin Giảng viên phụ trách, Email, Phòng làm việc, Khoa/Bộ môn."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        if sub_section.get("type") != "reference":
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code == "lecturer_info"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        if not sub_section:
            return

        ref_data = sub_section.get("reference_data")
        if not isinstance(ref_data, dict):
            return

        first = (ref_data.get("first_name") or "").strip()
        last = (ref_data.get("last_name") or "").strip()
        full_name = f"{last} {first}".strip() or first
        email = (ref_data.get("email") or "").strip()
        room = (ref_data.get("room") or "").strip()
        faculty = (ref_data.get("faculty") or "").strip()

        rendered = self._render_paragraphs(doc, full_name, email, room, faculty)
        if not rendered:
            rendered = self._render_table(doc, full_name, email, room, faculty)
        if not rendered:
            self._create_paragraphs(doc, full_name, email, room, faculty)

    @staticmethod
    def _render_paragraphs(doc: Document, lecturer: str, email: str, room: str, faculty: str) -> bool:
        updated = False
        for p in doc.paragraphs[:35]:
            t = p.text.strip().lower()
            if not t:
                continue
            if faculty and ("khoa/bộ môn" in t or "faculty" in t):
                p.text = f"{p.text.split(':', 1)[0]}: {faculty}"
                updated = True
            elif lecturer and ("giảng viên" in t or "academics" in t):
                p.text = f"{p.text.split(':', 1)[0]}: {lecturer}"
                updated = True
            elif email and ("địa chỉ email" in t or "email" in t):
                p.text = f"{p.text.split(':', 1)[0]}: {email}"
                updated = True
            elif room and ("phòng làm việc" in t or "room" in t):
                p.text = f"{p.text.split(':', 1)[0]}: {room}"
                updated = True
        return updated

    @staticmethod
    def _render_table(doc: Document, lecturer: str, email: str, room: str, faculty: str) -> bool:
        for table in doc.tables:
            text = " ".join(c.text for row in table.rows for c in row.cells).lower()
            if "khoa/bộ môn" not in text and "faculty" not in text:
                continue

            for row in table.rows:
                if len(row.cells) < 2:
                    continue
                c0 = row.cells[0].text.lower()
                if faculty and ("khoa/bộ môn" in c0 or "faculty" in c0):
                    row.cells[1].text = str(faculty)
                elif lecturer and ("giảng viên" in c0 or "academics" in c0):
                    row.cells[1].text = str(lecturer)
                elif email and ("email" in c0 or "địa chỉ email" in c0):
                    row.cells[1].text = str(email)
                elif room and ("phòng làm việc" in c0 or "room" in c0):
                    row.cells[1].text = str(room)
            return True
        return False

    @staticmethod
    def _create_paragraphs(doc: Document, lecturer: str, email: str, room: str, faculty: str) -> None:
        items = [
            ("Khoa/Bộ môn/Faculty/Division", faculty),
            ("Giảng viên/Academics", lecturer),
            ("Địa chỉ email liên hệ/Email", email),
            ("Phòng làm việc/Room", room),
        ]
        for label, val in items:
            p = doc.add_paragraph()
            p.add_run(f"• {label}: ").bold = True
            p.add_run(val)
