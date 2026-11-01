"""
handlers/renderers/complex/requirement_renderer.py

Sub-Renderer xử lý bảng Môn học điều kiện (Table 1: Requirements).
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class RequirementSubRenderer(BaseSubRenderer):
    """Điền danh sách môn tiên quyết, học trước, song hành vào Table 1."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code == "requirement_subject"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        table = self._find_requirements_table(doc)
        if not table:
            table = self._create_table(doc)

        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            self._render_empty(table)
            return

        self._render_items(table, ref_data)

    @staticmethod
    def _create_table(doc: Document):
        table = doc.add_table(rows=1, cols=3)
        table.style = "Table Grid"
        headers = ["STT/No.", "Môn học điều kiện/Requirements", "Mã môn học/Code"]
        for idx, h in enumerate(headers):
            cell = table.rows[0].cells[idx]
            cell.text = h
            if cell.paragraphs and cell.paragraphs[0].runs:
                cell.paragraphs[0].runs[0].bold = True
        return table

    @staticmethod
    def _find_requirements_table(doc: Document):
        for table in doc.tables:
            if not table.rows:
                continue
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower()
            if "môn học điều kiện" in first_row or "requirements" in first_row:
                return table
        return None

    @staticmethod
    def _render_empty(table) -> None:
        while len(table.rows) > 2:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)
        if len(table.rows) == 1:
            table.add_row()
        if len(table.rows) >= 2:
            table.rows[1].cells[0].text = "1."
            table.rows[1].cells[1].text = "Không có"
            table.rows[1].cells[2].text = ""

    @staticmethod
    def _render_items(table, items: list) -> None:
        while len(table.rows) > 1:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        for idx, item in enumerate(items, start=1):
            row = table.add_row()
            name = item.get("subject_name", "")
            code = item.get("subject_code", "")
            req_type_obj = item.get("requirement_type") or {}
            type_name = req_type_obj.get("name", "") if isinstance(req_type_obj, dict) else ""

            type_display = f"{type_name}\n" if type_name else ""
            row.cells[0].text = f"{idx}."
            row.cells[1].text = f"{type_display}{name}".strip()
            row.cells[2].text = str(code)
