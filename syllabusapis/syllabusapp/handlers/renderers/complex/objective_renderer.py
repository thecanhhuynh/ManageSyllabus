"""
handlers/renderers/complex/objective_renderer.py

Sub-Renderer xử lý bảng Mục tiêu môn học (Table 2: Course Objectives).
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class ObjectiveSubRenderer(BaseSubRenderer):
    """Điền danh sách Mục tiêu môn học CO1, CO2... kèm PLOs vào Table 2."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code in {"objective_outcomes", "objectives_and_outcomes"}

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        table = self._find_objectives_table(doc)
        if not table:
            table = self._create_table(doc)

        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            return

        self._render_items(table, ref_data)

    @staticmethod
    def _create_table(doc: Document):
        table = doc.add_table(rows=1, cols=3)
        table.style = "Table Grid"
        headers = ["Mục tiêu/Objective", "Mô tả/Content", "CĐR CTĐT (PLO)"]
        for idx, h in enumerate(headers):
            cell = table.rows[0].cells[idx]
            cell.text = h
            if cell.paragraphs and cell.paragraphs[0].runs:
                cell.paragraphs[0].runs[0].bold = True
        return table

    @staticmethod
    def _find_objectives_table(doc: Document):
        for table in doc.tables:
            if not table.rows:
                continue
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower()
            if "mục tiêu môn học" in first_row and "plo" in first_row:
                return table
        return None

    @staticmethod
    def _render_items(table, items: list) -> None:
        while len(table.rows) > 1:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        for idx, item in enumerate(items, start=1):
            row = table.add_row()
            content = (item.get("content") or "").strip()
            plos = item.get("programme_learning_outcomes") or []
            plo_names = [p.get("name", "") for p in plos if isinstance(p, dict) and p.get("name")]

            row.cells[0].text = f"CO{idx}"
            row.cells[1].text = content
            row.cells[2].text = " ".join(plo_names)
