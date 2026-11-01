"""
handlers/renderers/complex/clo_renderer.py

Sub-Renderer xử lý bảng Chuẩn đầu ra môn học (Table 3: CLOs).
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class CLOSubRenderer(BaseSubRenderer):
    """Điền danh sách CLO1, CLO2... kèm mô tả vào Table 3."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code == "course_learning_outcomes"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        table = self._find_clos_table(doc)
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
        headers = ["Mục tiêu (CO)", "CĐR môn học (CLO)", "Nội dung/Content"]
        for idx, h in enumerate(headers):
            cell = table.rows[0].cells[idx]
            cell.text = h
            if cell.paragraphs and cell.paragraphs[0].runs:
                cell.paragraphs[0].runs[0].bold = True
        return table

    @staticmethod
    def _find_clos_table(doc: Document):
        for table in doc.tables:
            if not table.rows:
                continue
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower()
            if "cđr môn học" in first_row or "cđr môn học (clo)" in first_row:
                return table
        return None

    @classmethod
    def _render_items(cls, table, groups: list) -> None:
        while len(table.rows) > 1:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        clo_counter = 1
        for co_idx, group in enumerate(groups, start=1):
            clos = group.get("clos") or []
            for c in clos:
                row = table.add_row()
                content = (c.get("content") or "").strip()
                row.cells[0].text = f"CO{co_idx}"
                row.cells[1].text = f"CLO{clo_counter}"
                row.cells[2].text = content
                clo_counter += 1

        cls._merge_co_column(table, groups)

    @staticmethod
    def _merge_co_column(table, groups: list) -> None:
        row_idx = 1
        for group in groups:
            num_clos = len(group.get("clos") or [])
            if num_clos <= 1:
                row_idx += num_clos
                continue
            start_cell = table.cell(row_idx, 0)
            end_cell = table.cell(row_idx + num_clos - 1, 0)
            for r in range(row_idx + 1, row_idx + num_clos):
                table.cell(r, 0).text = ""
            start_cell.merge(end_cell)
            while len(start_cell.paragraphs) > 1 and not start_cell.paragraphs[-1].text.strip():
                p_el = start_cell.paragraphs[-1]._p
                p_el.getparent().remove(p_el)
            row_idx += num_clos
