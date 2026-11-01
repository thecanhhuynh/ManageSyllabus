import re
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt
from lxml import etree
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class CLOPLOMatrixSubRenderer(BaseSubRenderer):
    """Điền ma trận đối sánh mức độ đóng góp của CLOs vào các PLOs (Table 4)."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code == "course_learning_outcomes"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            return

        self._ensure_matrix_title(doc)
        table = self._find_matrix_table(doc)
        if not table:
            table = self._create_matrix_table(doc, ref_data)

        self._render_matrix(table, ref_data)
        self._ensure_matrix_legend(doc)

    @staticmethod
    def _ensure_matrix_title(doc: Document):
        title_text = "Ma trận tích hợp giữa chuẩn đầu ra của môn học và chuẩn đầu ra của chương trình đào tạo"
        for p in doc.paragraphs:
            if "ma trận tích hợp" in p.text.lower():
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                return p
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(title_text)
        run.font.name = "Times New Roman"
        return p

    @classmethod
    def _create_matrix_table(cls, doc: Document, groups: list):
        plo_ids = set()
        for g in groups:
            for c in (g.get("clos") or []):
                for p in (c.get("plos") or []):
                    if p.get("plo_id") is not None:
                        plo_ids.add(p["plo_id"])
        sorted_plos = sorted(list(plo_ids)) or [1, 2, 3]
        table = doc.add_table(rows=1, cols=len(sorted_plos) + 1)
        table.style = "Table Grid"
        table.autofit = False
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cls._format_header_cell(table.rows[0].cells[0], "CLOs")
        for idx, plo_id in enumerate(sorted_plos, start=1):
            cls._format_header_cell(table.rows[0].cells[idx], f"PLO.{plo_id}")
        cls._apply_column_widths(table)
        return table

    @staticmethod
    def _format_header_cell(cell, text: str) -> None:
        cell.text = text
        if not cell.paragraphs:
            return
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True
            r.font.name = "Times New Roman"

    @staticmethod
    def _find_matrix_table(doc: Document):
        for table in doc.tables:
            if not table.rows:
                continue
            cells_text = [c.text.strip().lower() for c in table.rows[0].cells]
            if len(cells_text) > 2 and "clos" in cells_text[0] and any("plo" in c for c in cells_text[1:]):
                return table
        return None

    def _render_matrix(self, table, groups: list) -> None:
        plo_col_map = self._extract_plo_columns(table.rows[0].cells)
        while len(table.rows) > 1:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        clo_counter = 1
        for group in groups:
            for c in (group.get("clos") or []):
                row = table.add_row()
                self._format_clo_cell(row.cells[0], str(clo_counter))
                self._fill_plo_ratings(row, c.get("plos") or [], plo_col_map)
                clo_counter += 1
        self._apply_column_widths(table)

    @classmethod
    def _apply_column_widths(cls, table) -> None:
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        clo_col_width = Cm(1.6)
        plo_col_width = Cm(1.7)
        for row in table.rows:
            if not row.cells:
                continue
            row.cells[0].width = clo_col_width
            for cell in row.cells[1:]:
                cell.width = plo_col_width
        for idx, col in enumerate(table.columns):
            col.width = clo_col_width if idx == 0 else plo_col_width

    @staticmethod
    def _format_clo_cell(cell, text: str) -> None:
        cell.text = text
        if not cell.paragraphs:
            return
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.bold = True
            r.font.name = "Times New Roman"

    @staticmethod
    def _extract_plo_columns(header_cells) -> dict:
        mapping = {}
        for col_idx, cell in enumerate(header_cells[1:], start=1):
            nums = re.findall(r'\d+', cell.text)
            if nums:
                mapping[int(nums[0])] = col_idx
        return mapping

    @staticmethod
    def _fill_plo_ratings(row, plos: list, plo_col_map: dict) -> None:
        for col_idx in range(1, len(row.cells)):
            if row.cells[col_idx].paragraphs:
                row.cells[col_idx].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

        for p in plos:
            plo_id = p.get("plo_id")
            rating = p.get("rating")
            if plo_id in plo_col_map and rating is not None:
                col_idx = plo_col_map[plo_id]
                if col_idx < len(row.cells):
                    cell = row.cells[col_idx]
                    cell.text = str(rating)
                    if cell.paragraphs:
                        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
                        for r in cell.paragraphs[0].runs:
                            r.font.name = "Times New Roman"

    @classmethod
    def _ensure_matrix_legend(cls, doc: Document):
        for t in doc.tables:
            if t.rows and "không đáp ứng" in t.rows[0].cells[0].text.lower():
                cls._format_legend_table(t)
                return t
        legend_items = [
            ("1: Không đáp ứng", "4: Đáp ứng nhiều"),
            ("2: Ít đáp ứng", "5: Đáp ứng rất nhiều"),
            ("3: Đáp ứng trung bình", ""),
        ]
        tbl = doc.add_table(rows=len(legend_items), cols=2)
        tbl.style = "Normal Table"
        for r_idx, (c1, c2) in enumerate(legend_items):
            row = tbl.rows[r_idx]
            cls._format_legend_cell(row.cells[0], c1)
            cls._format_legend_cell(row.cells[1], c2)
        cls._format_legend_table(tbl)
        return tbl

    @classmethod
    def _format_legend_table(cls, tbl) -> None:
        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        col_width = Cm(5.0)
        for row in tbl.rows:
            for cell in row.cells:
                cell.width = col_width
                tcPr = cell._element.get_or_add_tcPr()
                tcW = tcPr.find(f"{{{w_ns}}}tcW")
                if tcW is None:
                    tcW = etree.SubElement(tcPr, f"{{{w_ns}}}tcW")
                tcW.set(f"{{{w_ns}}}w", "2835")
                tcW.set(f"{{{w_ns}}}type", "dxa")
        tblPr = tbl._tbl.find(f"{{{w_ns}}}tblPr")
        if tblPr is not None:
            tblW = tblPr.find(f"{{{w_ns}}}tblW")
            if tblW is None:
                tblW = etree.SubElement(tblPr, f"{{{w_ns}}}tblW")
            tblW.set(f"{{{w_ns}}}w", "5670")
            tblW.set(f"{{{w_ns}}}type", "dxa")

    @staticmethod
    def _format_legend_cell(cell, text: str) -> None:
        cell.text = text
        if not text.strip():
            return
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.italic = True
                r.font.name = "Times New Roman"
