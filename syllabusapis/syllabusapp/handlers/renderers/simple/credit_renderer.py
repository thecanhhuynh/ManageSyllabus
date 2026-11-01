"""
handlers/renderers/simple/credit_renderer.py

Sub-Renderer xử lý tiểu mục Số tín chỉ (Credit Sub-Section):
Điền số liệu Tổng tín chỉ, Lý thuyết, Thực hành, Giờ tự học vào Table 0.
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class CreditSubRenderer(BaseSubRenderer):
    """Render số tín chỉ vào bảng Table 0 hoặc đoạn văn bản."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        if sub_section.get("type") != "reference":
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code == "credit"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        if not sub_section:
            return

        ref_data = sub_section.get("reference_data")
        if not isinstance(ref_data, dict):
            return

        th = int(ref_data.get("number_theory") or 0)
        pr = int(ref_data.get("number_practice") or 0)
        st = int(ref_data.get("hour_self_study") or 0)
        tot = th + pr

        self._populate_table(doc, str(tot), str(th), str(pr), str(st))

    def _populate_table(self, doc: Document, tot: str, th: str, pr: str, st: str) -> None:
        vals = [tot, th, pr, st]
        for table in doc.tables:
            if len(table.rows) < 2:
                continue
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower()
            if "tổng số" in first_row or "total" in first_row:
                self._fill_row(table.rows[1], vals)
                return

        table = self._create_table(doc)
        self._fill_row(table.rows[1], vals)

    @staticmethod
    def _create_table(doc: Document):
        table = doc.add_table(rows=2, cols=4)
        table.style = "Table Grid"
        headers = ["Tổng số/Total", "Lý thuyết/Theory", "Thực hành/Practice", "Số giờ tự học/Self-study"]
        for idx, h in enumerate(headers):
            cell = table.rows[0].cells[idx]
            cell.text = h
            if cell.paragraphs and cell.paragraphs[0].runs:
                cell.paragraphs[0].runs[0].bold = True
        return table

    @staticmethod
    def _fill_row(row, vals: list) -> None:
        for idx, val in enumerate(vals):
            if idx < len(row.cells):
                row.cells[idx].text = str(val)
