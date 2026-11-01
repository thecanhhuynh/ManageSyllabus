from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class AssessmentSubRenderer(BaseSubRenderer):
    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code in {"assessment_method", "assessment_methods"}

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        table = self._find_assessment_table(doc)
        if not table:
            table = self._create_table(doc)

        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            return

        self._render_items(table, ref_data)
        self._apply_column_widths(table)

    @staticmethod
    def _create_table(doc: Document):
        table = doc.add_table(rows=1, cols=5)
        table.style = "Table Grid"
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        headers = [
            "Thành phần đánh giá/Type of assessment",
            "Bài đánh giá\nAssessment methods",
            "Thời điểm\nAssessment time",
            "CĐR môn học/CLOs",
            "Tỷ lệ %\nWeight %",
        ]
        for idx, h in enumerate(headers):
            cell = table.rows[0].cells[idx]
            cell.text = h
            if cell.paragraphs:
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    r.bold = True
                    r.font.name = "Times New Roman"
        return table

    @staticmethod
    def _find_assessment_table(doc: Document):
        for table in doc.tables:
            if not table.rows:
                continue
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower()
            if "thành phần đánh giá" in first_row and "bài đánh giá" in first_row:
                return table
        return None

    @classmethod
    def _render_items(cls, table, ref_data: list) -> None:
        while len(table.rows) > 1:
            tr = table.rows[-1]._tr
            tr.getparent().remove(tr)

        groups = cls._normalize_groups(ref_data)
        for g_idx, group in enumerate(groups, start=1):
            cls._render_group(table, g_idx, group)

    @classmethod
    def _render_group(cls, table, g_idx: int, group: dict) -> None:
        type_obj = group.get("type_assessment") or {}
        raw_type_name = type_obj.get("name", "") if isinstance(type_obj, dict) else str(type_obj)
        group_label = cls._format_group_name(g_idx, raw_type_name)
        methods = group.get("assessment_methods") or group.get("methods") or []
        if not methods:
            methods = [{"name": "", "time": "", "course_learning_outcomes": [], "weight": None}]

        start_row = len(table.rows)
        group_weight = 0.0

        for m_idx, m in enumerate(methods, start=1):
            row = table.add_row()
            weight_val = cls._extract_weight(m.get("weight"))
            if weight_val is not None:
                group_weight += weight_val
            cls._fill_method_row(row, g_idx, m_idx, group_label, m)

        cls._add_summary_row(table, group_weight)
        end_row = len(table.rows) - 1
        cls._merge_group_cells(table, start_row, end_row, group_label)

    @staticmethod
    def _extract_weight(raw_weight) -> float | None:
        if raw_weight is None or raw_weight == "":
            return None
        clean_str = str(raw_weight).replace("%", "").strip()
        try:
            return float(clean_str)
        except ValueError:
            return None

    @classmethod
    def _fill_method_row(cls, row, g_idx: int, m_idx: int, group_label: str, method: dict) -> None:
        m_name = cls._format_method_name(g_idx, m_idx, method.get("name", ""))
        clo_str = cls._format_clos(method)
        w_val = cls._extract_weight(method.get("weight"))
        w_str = f"{int(w_val) if w_val.is_integer() else w_val}%" if w_val is not None else ""

        cls._set_cell(row.cells[0], group_label, WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[1], m_name, WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[2], method.get("time") or "", WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[3], clo_str, WD_ALIGN_PARAGRAPH.CENTER)
        cls._set_cell(row.cells[4], w_str, WD_ALIGN_PARAGRAPH.CENTER)

    @classmethod
    def _add_summary_row(cls, table, group_weight: float) -> None:
        row = table.add_row()
        w_str = f"{int(group_weight) if group_weight.is_integer() else group_weight}%" if group_weight > 0 else ""
        cls._set_cell(row.cells[0], "", WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[1], "Tổng cộng", WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[2], "", WD_ALIGN_PARAGRAPH.LEFT)
        cls._set_cell(row.cells[3], "", WD_ALIGN_PARAGRAPH.CENTER)
        cls._set_cell(row.cells[4], w_str, WD_ALIGN_PARAGRAPH.CENTER)

    @classmethod
    def _merge_group_cells(cls, table, start_row: int, end_row: int, group_label: str) -> None:
        if start_row >= end_row:
            return
        start_cell = table.cell(start_row, 0)
        end_cell = table.cell(end_row, 0)
        for r in range(start_row + 1, end_row + 1):
            table.cell(r, 0).text = ""
        start_cell.merge(end_cell)
        start_cell.text = group_label
        start_cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        if start_cell.paragraphs:
            start_cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in start_cell.paragraphs[0].runs:
                r.font.name = "Times New Roman"

    @classmethod
    def _apply_column_widths(cls, table) -> None:
        widths = [Cm(3.9), Cm(4.0), Cm(3.5), Cm(3.0), Cm(1.6)]
        for row in table.rows:
            for idx, w in enumerate(widths):
                if idx < len(row.cells):
                    row.cells[idx].width = w
        for idx, w in enumerate(widths):
            if idx < len(table.columns):
                table.columns[idx].width = w

    @classmethod
    def _normalize_groups(cls, ref_data: list) -> list:
        if not ref_data or not isinstance(ref_data, list):
            return []
        if isinstance(ref_data[0], dict) and ("type_assessment" in ref_data[0] or "assessment_methods" in ref_data[0]):
            return ref_data
        grouped = {}
        for item in ref_data:
            if not isinstance(item, dict):
                continue
            type_name = item.get("type_name") or item.get("type") or "Đánh giá"
            if type_name not in grouped:
                grouped[type_name] = []
            grouped[type_name].append({
                "name": item.get("method_name") or item.get("method") or item.get("name") or "",
                "time": item.get("time") or "",
                "clo": item.get("clo") or "",
                "weight": item.get("weight"),
                "course_learning_outcomes": item.get("course_learning_outcomes") or [],
            })
        return [
            {
                "type_assessment": {"name": t_name},
                "assessment_methods": methods,
            }
            for t_name, methods in grouped.items()
        ]

    @staticmethod
    def _format_group_name(g_idx: int, raw_name: str) -> str:
        name = (raw_name or "").strip()
        prefix = f"A{g_idx}."
        if not name:
            return f"A{g_idx}. Đánh giá"
        if name.startswith(prefix):
            return name
        return f"{prefix} {name}"

    @staticmethod
    def _format_method_name(g_idx: int, m_idx: int, raw_name: str) -> str:
        name = (raw_name or "").strip()
        prefix = f"A.{g_idx}.{m_idx}"
        if not name:
            return prefix
        if name.startswith(prefix):
            return name
        if name.startswith("A."):
            return name
        return f"{prefix}. {name}"

    @staticmethod
    def _format_clos(method: dict) -> str:
        clos = method.get("course_learning_outcomes") or []
        if clos:
            return ", ".join(f"CLO{c.get('position', idx + 1)}" for idx, c in enumerate(clos))
        return str(method.get("clo") or "")

    @staticmethod
    def _set_cell(cell, text: str, align=WD_ALIGN_PARAGRAPH.LEFT) -> None:
        cell.text = text
        if not cell.paragraphs:
            return
        p = cell.paragraphs[0]
        p.alignment = align
        for r in p.runs:
            r.font.name = "Times New Roman"
