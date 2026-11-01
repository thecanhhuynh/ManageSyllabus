"""
handlers/renderers/complex/schedule_renderer.py

Sub-Renderer xử lý Kế hoạch giảng dạy chi tiết theo ca học (Tables 9, 10, 11).
Phân biệt chính xác: "Lớp buổi sáng", "Lớp buổi tối", "Thực hành".
Hỗ trợ đầy đủ bảng 11 cột với header phân cấp và tính tổng số giờ.
"""

import docx.text.paragraph
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.shared import Pt
from lxml import etree
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class ScheduleSubRenderer(BaseSubRenderer):
    """Điền kế hoạch giảng dạy vào bảng tương ứng theo nhóm lịch học."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code in {"teaching_schedule", "teaching_sessions"}

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            return

        flat_items = self._flatten_items(ref_data)
        grouped = self._group_by_schedule(flat_items)
        tables_map = self._map_schedule_tables(doc)

        for group_key, items in grouped.items():
            if not items:
                continue
            target_table = tables_map.get(group_key)
            if not target_table:
                target_table = self._create_schedule_table(doc, group_key)
            self._populate_schedule_table(target_table, items)
            self._apply_column_widths(target_table)

    @classmethod
    def _flatten_items(cls, items: list) -> list:
        flat = []
        for item in items:
            if not isinstance(item, dict):
                continue
            sessions = item.get("teaching_sessions")
            if isinstance(sessions, list):
                group_obj = item.get("schedule_group")
                for s in sessions:
                    if not isinstance(s, dict):
                        continue
                    copy_s = dict(s)
                    if group_obj and "schedule_group" not in copy_s:
                        copy_s["schedule_group"] = group_obj
                    flat.append(copy_s)
                continue
            flat.append(item)
        return flat

    @staticmethod
    def _group_by_schedule(items: list) -> dict:
        grouped = {"morning": [], "evening": [], "practice": []}
        for item in items:
            g_obj = item.get("schedule_group") or {}
            g_name = g_obj.get("name", "").lower() if isinstance(g_obj, dict) else ""
            if "thực hành" in g_name or "practice" in g_name:
                grouped["practice"].append(item)
            elif "chiều" in g_name or "tối" in g_name or "evening" in g_name:
                grouped["evening"].append(item)
            else:
                grouped["morning"].append(item)
        return grouped

    @staticmethod
    def _map_schedule_tables(doc: Document) -> dict:
        mapping = {}
        for table in doc.tables:
            prev = table._element.getprevious()
            if prev is None or not prev.tag.endswith("p"):
                continue
            p_text = docx.text.paragraph.Paragraph(prev, doc).text.strip().lower()
            if "thực hành" in p_text:
                mapping["practice"] = table
            elif "buổi tối" in p_text or "buổi chiều" in p_text:
                mapping["evening"] = table
            elif "buổi sáng" in p_text:
                mapping["morning"] = table
        return mapping

    @staticmethod
    def _detect_header_count(table) -> int:
        for idx, row in enumerate(table.rows):
            cell_0_text = row.cells[0].text.strip() if row.cells else ""
            if cell_0_text == "(1)" or "(1)" in cell_0_text:
                return idx + 1
        return 1

    @staticmethod
    def _format_number(val) -> str:
        if val is None or val == 0:
            return ""
        try:
            num = float(val)
            if num <= 0:
                return ""
            return str(int(num)) if num.is_integer() else str(num)
        except (ValueError, TypeError):
            return ""

    @staticmethod
    def _format_clos_text(clos) -> str:
        if not clos:
            return ""
        if isinstance(clos, str):
            return clos
        parts = []
        for idx, c in enumerate(clos):
            if isinstance(c, dict):
                pos = c.get("position") or c.get("name") or c.get("id") or (idx + 1)
                parts.append(str(pos))
            elif isinstance(c, (int, str)):
                parts.append(str(c))
        return "\n".join(parts)

    @staticmethod
    def _format_assessments_text(assessments) -> str:
        if not assessments:
            return ""
        if isinstance(assessments, str):
            return assessments
        parts = []
        for a in assessments:
            if isinstance(a, dict):
                name = a.get("name") or a.get("code") or (f"A{a.get('id')}" if a.get("id") else "")
                if name:
                    parts.append(name.strip())
            elif isinstance(a, str):
                parts.append(a.strip())
        return "\n".join(parts)

    @staticmethod
    def _format_materials_text(materials) -> str:
        if not materials:
            return ""
        if isinstance(materials, str):
            return materials
        parts = []
        for idx, m in enumerate(materials):
            if isinstance(m, dict):
                name = m.get("order") or m.get("position") or (idx + 1)
                parts.append(f"[{name}]")
            elif isinstance(m, (int, str)):
                s = str(m).strip()
                parts.append(s if s.startswith("[") else f"[{s}]")
        return "".join(parts)

    @classmethod
    def _fill_session_row(cls, row, item: dict) -> None:
        session_no = item.get("session_no", 1)
        content = (item.get("content") or "").strip()
        clo_str = cls._format_clos_text(item.get("course_learning_outcomes"))

        if len(row.cells) > 0:
            row.cells[0].text = str(session_no)
        if len(row.cells) > 1:
            row.cells[1].text = content
        if len(row.cells) > 2:
            row.cells[2].text = clo_str
        if len(row.cells) > 10:
            row.cells[3].text = (item.get("self_study_activity") or "").strip()
            row.cells[4].text = cls._format_number(item.get("self_study_hours"))
            row.cells[5].text = (item.get("offline_activity") or "").strip()
            row.cells[6].text = cls._format_number(item.get("offline_hours"))
            row.cells[7].text = (item.get("online_activity") or "").strip()
            row.cells[8].text = cls._format_number(item.get("online_hours"))
            row.cells[9].text = cls._format_assessments_text(item.get("assessments"))
            row.cells[10].text = cls._format_materials_text(item.get("learning_materials"))

        cls._align_session_cells(row)

    @staticmethod
    def _align_session_cells(row) -> None:
        alignments = {
            0: WD_ALIGN_PARAGRAPH.CENTER, 1: WD_ALIGN_PARAGRAPH.LEFT,
            2: WD_ALIGN_PARAGRAPH.CENTER, 3: WD_ALIGN_PARAGRAPH.LEFT,
            4: WD_ALIGN_PARAGRAPH.CENTER, 5: WD_ALIGN_PARAGRAPH.LEFT,
            6: WD_ALIGN_PARAGRAPH.CENTER, 7: WD_ALIGN_PARAGRAPH.LEFT,
            8: WD_ALIGN_PARAGRAPH.CENTER, 9: WD_ALIGN_PARAGRAPH.CENTER,
            10: WD_ALIGN_PARAGRAPH.CENTER,
        }
        for ci, cell in enumerate(row.cells):
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            align = alignments.get(ci, WD_ALIGN_PARAGRAPH.LEFT)
            for p in cell.paragraphs:
                p.alignment = align
                for run in p.runs:
                    run.font.size = Pt(9.5)

    @classmethod
    def _populate_schedule_table(cls, table, items: list) -> None:
        if not items:
            return

        header_count = cls._detect_header_count(table)
        total_tr = None
        if len(table.rows) > header_count:
            last_cell = table.rows[-1].cells[0].text.strip().lower()
            if "tổng cộng" in last_cell or "total" in last_cell:
                total_tr = table.rows[-1]._tr
                total_tr.getparent().remove(total_tr)

        while len(table.rows) > header_count:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        total_self = 0.0
        total_offline = 0.0
        total_online = 0.0

        for item in items:
            row = table.add_row()
            cls._fill_session_row(row, item)
            total_self += float(item.get("self_study_hours") or 0)
            total_offline += float(item.get("offline_hours") or 0)
            total_online += float(item.get("online_hours") or 0)

        if total_tr is not None:
            table._tbl.append(total_tr)
            cls._update_total_row(table.rows[-1], total_self, total_offline, total_online)

    @classmethod
    def _update_total_row(cls, row, total_self: float, total_offline: float, total_online: float) -> None:
        if len(row.cells) > 4 and total_self > 0:
            row.cells[4].text = cls._format_number(total_self)
        if len(row.cells) > 6 and total_offline > 0:
            row.cells[6].text = cls._format_number(total_offline)
        if len(row.cells) > 8 and total_online > 0:
            row.cells[8].text = cls._format_number(total_online)
        for cell in row.cells:
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    run.bold = True

    @classmethod
    def _create_schedule_table(cls, doc: Document, group_key: str):
        titles = {
            "morning": "Lớp buổi sáng",
            "evening": "Lớp buổi tối",
            "practice": "Thực hành",
        }
        p = doc.add_paragraph()
        p.add_run(titles.get(group_key, "Lớp buổi sáng")).bold = True

        table = doc.add_table(rows=5, cols=11)
        table.style = "Table Grid"
        cls._setup_header_rows(table)
        cls._setup_initial_total_row(table)
        cls._apply_column_widths(table)
        return table

    @classmethod
    def _setup_initial_total_row(cls, table) -> None:
        row_idx = 4
        table.cell(row_idx, 0).merge(table.cell(row_idx, 2))
        table.cell(row_idx, 0).text = "Tổng cộng/Total"
        table.cell(row_idx, 3).text = "x"
        table.cell(row_idx, 5).text = "x"
        table.cell(row_idx, 7).text = "x"
        table.cell(row_idx, 9).text = "x"
        table.cell(row_idx, 10).text = "x"
        for cell in table.rows[row_idx].cells:
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    run.bold = True

    @classmethod
    def _setup_header_rows(cls, table) -> None:
        cls._merge_header_cells(table)
        cls._set_header_texts(table)
        cls._style_header_cells(table)

    @staticmethod
    def _merge_header_cells(table) -> None:
        table.cell(0, 0).merge(table.cell(2, 0))
        table.cell(0, 1).merge(table.cell(2, 1))
        table.cell(0, 2).merge(table.cell(2, 2))
        table.cell(0, 9).merge(table.cell(2, 9))
        table.cell(0, 10).merge(table.cell(2, 10))
        table.cell(0, 3).merge(table.cell(0, 8))
        table.cell(1, 3).merge(table.cell(1, 4))
        table.cell(1, 5).merge(table.cell(1, 6))
        table.cell(1, 7).merge(table.cell(1, 8))

    @staticmethod
    def _set_header_texts(table) -> None:
        table.cell(0, 0).text = "Tuần/buổi học\nWeek\nSection"
        table.cell(0, 1).text = "Nội dung\nContent"
        table.cell(0, 2).text = "CĐR môn học\nCLOs"
        table.cell(0, 3).text = "Hoạt động dạy và học/Teaching and learning"
        table.cell(0, 9).text = "Bài đánh giá\nStudent assessment"
        table.cell(0, 10).text = "Tài liệu chính và tài liệu tham khảo\nTextbooks and materials"
        table.cell(1, 3).text = "Tự học/Self-study"
        table.cell(1, 5).text = "Trực tiếp/FTF\nLý thuyết/Theory"
        table.cell(1, 7).text = "Trực tuyến (nếu có)/Online (if any)\nLý thuyết/Theory"
        table.cell(2, 3).text = "Hoạt động\nActivity"
        table.cell(2, 4).text = "Số giờ\nPeriods"
        table.cell(2, 5).text = "Hoạt động\nActivity"
        table.cell(2, 6).text = "Số giờ\nPeriods"
        table.cell(2, 7).text = "Hoạt động\nActivity"
        table.cell(2, 8).text = "Số giờ\nPeriods"
        r3_nums = ["(1)", "(2)", "(3)", "(4)", "", "(5)", "", "(6)", "", "(7)", "(8)"]
        for c, num in enumerate(r3_nums):
            table.cell(3, c).text = num

    @staticmethod
    def _style_header_cells(table) -> None:
        for r in range(4):
            for cell in table.rows[r].cells:
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    for run in p.runs:
                        run.font.size = Pt(9.5)
                        if r < 3:
                            run.bold = True
                        else:
                            run.italic = True

    @classmethod
    def _apply_column_widths(cls, table) -> None:
        if not getattr(table, "columns", None) or len(table.columns) != 11:
            return
        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        col_twips = [850, 2600, 900, 1800, 650, 2000, 650, 1800, 650, 1300, 1300]
        tblGrid = table._tbl.find(f"{{{w_ns}}}tblGrid")
        if tblGrid is None:
            tblGrid = etree.Element(f"{{{w_ns}}}tblGrid")
            table._tbl.insert(0, tblGrid)
        tblGrid.clear()
        for w in col_twips:
            gc = etree.SubElement(tblGrid, f"{{{w_ns}}}gridCol")
            gc.set(f"{{{w_ns}}}w", str(w))

        tblPr = table._tbl.tblPr
        tblW = tblPr.find(f"{{{w_ns}}}tblW")
        if tblW is None:
            tblW = etree.SubElement(tblPr, f"{{{w_ns}}}tblW")
        tblW.set(f"{{{w_ns}}}w", str(sum(col_twips)))
        tblW.set(f"{{{w_ns}}}type", "dxa")

        for row in table.rows:
            if len(row.cells) == 11 and len(set(row.cells)) == 11:
                for idx, cell in enumerate(row.cells):
                    tcPr = cell._element.get_or_add_tcPr()
                    tcW = tcPr.find(f"{{{w_ns}}}tcW")
                    if tcW is None:
                        tcW = etree.SubElement(tcPr, f"{{{w_ns}}}tcW")
                    tcW.set(f"{{{w_ns}}}w", str(col_twips[idx]))
                    tcW.set(f"{{{w_ns}}}type", "dxa")
