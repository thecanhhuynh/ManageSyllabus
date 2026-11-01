import re
from lxml import etree
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from syllabuses.models import Syllabus, CustomColumnValue

PRINTABLE_TABLE_WIDTH = Inches(6.5)
PRINTABLE_LANDSCAPE_TABLE_WIDTH = Inches(10.15)
SCHEDULE_BASE_WEIGHTS = [850, 2600, 900, 1800, 650, 2000, 650, 1800, 650, 1300, 1300]
NESTED_TABLES = {"course_learning_outcomes", "assessment_method"}
APPEND_ALL_TABLES = {"teaching_schedule"}


class TableManager:
    """Quản lý cấu trúc, merge và custom columns cho table."""

    PRINTABLE_TABLE_WIDTH = PRINTABLE_TABLE_WIDTH
    PRINTABLE_LANDSCAPE_TABLE_WIDTH = PRINTABLE_LANDSCAPE_TABLE_WIDTH
    SCHEDULE_BASE_WEIGHTS = SCHEDULE_BASE_WEIGHTS

    @classmethod
    def _apply_custom_columns(
        cls,
        tables: list,
        custom_columns: list[dict],
        block,
        syllabus: Syllabus | None,
        object_ids: list[str] | None,
        target_table_index: int,
        table_code: str,
    ) -> None:
        if table_code in APPEND_ALL_TABLES:
            for tbl in tables:
                cls._append_custom_columns_to_tables(
                    [tbl], custom_columns, template_id=block.template_id,
                    syllabus=syllabus, object_ids=object_ids, target_table_index=0,
                    table_code=table_code,
                )
            return

        cls._append_custom_columns_to_tables(
            tables, custom_columns, template_id=block.template_id,
            syllabus=syllabus, object_ids=object_ids,
            target_table_index=target_table_index, table_code=table_code,
        )

    @classmethod
    def _append_custom_columns_to_tables(
        cls,
        tables: list,
        custom_columns: list[dict] | None,
        template_id: int | None = None,
        syllabus: Syllabus | None = None,
        object_ids: list[str] | None = None,
        target_table_index: int = 0,
        table_code: str | None = None,
    ) -> None:
        if not tables or not custom_columns or target_table_index >= len(tables):
            return
        table = tables[target_table_index]
        if not getattr(table, "rows", None) or len(table.rows) == 0:
            return

        if cls._is_key_value_table(table):
            cls._append_key_value_rows(table, custom_columns)
            return

        if table_code in APPEND_ALL_TABLES:
            cls._append_schedule_custom_columns(table, custom_columns, syllabus, object_ids)
            cls._apply_column_width(table, table_code=table_code)
            return

        for col in custom_columns:
            table.add_column(Inches(1.0))
            header_cell = table.rows[0].cells[-1]
            header_cell.text = col.get("column_label", "")
            for row_idx, row in enumerate(table.rows[1:], start=1):
                obj_id = object_ids[row_idx - 1] if object_ids and row_idx <= len(object_ids) else str(row_idx)
                row.cells[-1].text = cls._resolve_custom_value(col, syllabus, obj_id)

        if table_code in NESTED_TABLES:
            cls._merge_nested_custom_columns(table, custom_columns)
    @classmethod
    def _append_schedule_custom_columns(
        cls,
        table,
        custom_columns: list[dict],
        syllabus: Syllabus | None,
        object_ids: list[str] | None,
    ) -> None:
        if not getattr(table, "rows", None) or len(table.rows) < 4:
            return
        header_count = cls._detect_schedule_header_count(table)
        has_total = cls._has_schedule_total_row(table)
        data_end_idx = len(table.rows) - 1 if has_total else len(table.rows)

        for col in custom_columns:
            table.add_column(Inches(1.0))
            col_idx = len(table.columns) - 1
            if header_count >= 2:
                top_cell = table.cell(0, col_idx)
                bottom_hdr = table.cell(header_count - 2, col_idx)
                top_cell.merge(bottom_hdr)
                top_cell.text = col.get("column_label", "")
                table.cell(header_count - 1, col_idx).text = f"({col_idx + 1})"
            else:
                table.rows[0].cells[col_idx].text = col.get("column_label", "")

            for row_idx in range(header_count, data_end_idx):
                data_offset = row_idx - header_count
                obj_id = object_ids[data_offset] if object_ids and data_offset < len(object_ids) else str(data_offset + 1)
                val_text = cls._resolve_custom_value(col, syllabus, obj_id)
                table.rows[row_idx].cells[col_idx].text = val_text

            if has_total:
                table.rows[-1].cells[col_idx].text = "x"

        cls._style_schedule_custom_cells(table, header_count, has_total)

    @staticmethod
    def _style_schedule_custom_cells(table, header_count: int, has_total: bool) -> None:
        if not table.rows:
            return
        data_end_idx = len(table.rows) - 1 if has_total else len(table.rows)
        for row_idx, row in enumerate(table.rows):
            cell = row.cells[-1]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    if row_idx < header_count - 1:
                        run.bold = True
                    elif row_idx == header_count - 1:
                        run.italic = True
                    elif row_idx < data_end_idx:
                        p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    @staticmethod
    def _detect_schedule_header_count(table) -> int:
        for idx, row in enumerate(table.rows):
            cell_0_text = row.cells[0].text.strip() if row.cells else ""
            if "(1)" in cell_0_text:
                return idx + 1
        return 4 if len(table.rows) >= 4 else 1

    @staticmethod
    def _has_schedule_total_row(table) -> bool:
        if len(table.rows) < 2:
            return False
        last_text = table.rows[-1].cells[0].text.strip().lower()
        return "tổng cộng" in last_text or "total" in last_text

    @classmethod
    def _merge_nested_custom_columns(cls, table, custom_columns: list[dict]) -> None:
        if not custom_columns or not table or not table.rows:
            return
        num_core_cols = len(table.rows[0].cells) - len(custom_columns)
        groups = cls._detect_groups_in_column0(table)
        if not groups:
            return
        for col_idx, col in enumerate(custom_columns):
            if col.get("level") != "root":
                continue
            target_col = num_core_cols + col_idx
            cls._merge_column_by_groups(table, target_col, groups)

    @staticmethod
    def _detect_groups_in_column0(table) -> list[tuple[int, int]]:
        if not table.rows or len(table.rows) < 2:
            return []
        groups = []
        current_start = 1
        for r in range(2, len(table.rows)):
            is_same = (table.cell(r, 0)._tc == table.cell(r - 1, 0)._tc) or (not table.cell(r, 0).text.strip())
            if is_same:
                continue
            groups.append((current_start, r - 1))
            current_start = r
        groups.append((current_start, len(table.rows) - 1))
        return groups

    @staticmethod
    def _merge_column_by_groups(table, col_idx: int, groups: list[tuple[int, int]]) -> None:
        for start_row, end_row in groups:
            if end_row <= start_row:
                continue
            start_cell = table.cell(start_row, col_idx)
            end_cell = table.cell(end_row, col_idx)
            for r in range(start_row + 1, end_row + 1):
                table.cell(r, col_idx).text = ""
            start_cell.merge(end_cell)
            while len(start_cell.paragraphs) > 1 and not start_cell.paragraphs[-1].text.strip():
                p_el = start_cell.paragraphs[-1]._p
                p_el.getparent().remove(p_el)

    @staticmethod
    def _resolve_column_keys(table, code: str, custom_columns: list[dict] | None = None) -> list[str]:
        """Resolve danh sách column_key cho table."""
        if not table or not table.rows:
            return []
        credit_cols = ["credit_total", "number_theory", "number_practice", "hour_self_study"]
        keys = []
        for idx in range(len(table.rows[0].cells)):
            if code == "credit" and idx < len(credit_cols):
                keys.append(credit_cols[idx])
            else:
                custom_idx = idx - len(credit_cols) if code == "credit" else idx
                if custom_columns and 0 <= custom_idx < len(custom_columns):
                    keys.append(custom_columns[custom_idx].get("column_key") or str(idx))
                else:
                    keys.append(str(idx))
        return keys

    @staticmethod
    def _resolve_custom_value(col: dict, syllabus: Syllabus | None, object_id: str) -> str:
        fallback = col.get("default_value", "") or "-"
        if not syllabus:
            return str(fallback)
        col_key = col.get("column_key")
        if not col_key:
            return str(fallback)
        val_obj = CustomColumnValue.objects.filter(
            column__column_key=col_key,
            object_id=str(object_id),
        ).first()
        if not val_obj:
            return str(fallback)
        return str(val_obj.value or fallback)

    @classmethod
    def _apply_column_width(cls, table, formula: str | None = None, table_code: str | None = None) -> None:
        if not getattr(table, "columns", None) or len(table.columns) == 0:
            return
        col_count = len(table.columns)
        weights = None
        if formula and isinstance(formula, str):
            tokens = re.findall(r"\d+(?:\.\d+)?", formula)
            parsed = [float(t) for t in tokens if float(t) > 0]
            if len(parsed) == col_count and sum(parsed) > 0:
                weights = parsed

        is_schedule = table_code in APPEND_ALL_TABLES or col_count >= 11
        printable_width = cls.PRINTABLE_LANDSCAPE_TABLE_WIDTH if is_schedule else cls.PRINTABLE_TABLE_WIDTH

        if not weights:
            if is_schedule:
                base = list(cls.SCHEDULE_BASE_WEIGHTS)
                if col_count > len(base):
                    base.extend([1200] * (col_count - len(base)))
                weights = base[:col_count]
            else:
                col_width = int(printable_width / col_count)
                col_widths = [col_width] * col_count

        if weights:
            total_w = sum(weights)
            col_widths = [int(printable_width * (w / total_w)) for w in weights]

        table.autofit = False
        cls._apply_widths_to_cells(table, col_widths)

    @staticmethod
    def _apply_widths_to_cells(table, col_widths: list) -> None:
        w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
        for idx, col in enumerate(table.columns):
            if idx < len(col_widths):
                col.width = col_widths[idx]
        for row in table.rows:
            for idx, cell in enumerate(row.cells):
                if idx < len(col_widths):
                    cell.width = col_widths[idx]
                    tcPr = cell._element.get_or_add_tcPr()
                    tcW = tcPr.find(f"{{{w_ns}}}tcW")
                    if tcW is None:
                        tcW = etree.SubElement(tcPr, f"{{{w_ns}}}tcW")
                    dxa_val = int(int(col_widths[idx]) / 635)
                    tcW.set(f"{{{w_ns}}}w", str(dxa_val))
                    tcW.set(f"{{{w_ns}}}type", "dxa")

    COLUMN_KEY_PATTERNS = {
        "credit": {
            "credit_total": ["tổng", "total"],
            "number_theory": ["lý thuyết", "theory"],
            "number_practice": ["thực hành", "practice"],
            "hour_self_study": ["tự học", "self"],
        },
        "requirement_subject": {
            "col_index": ["stt", "no."],
            "col_name": ["môn học điều kiện", "requirements"],
            "col_code": ["mã môn", "code"],
            "col_type": ["loại", "type"],
        },
        "objectives_and_outcomes": {
            "col_index": ["stt", "no."],
            "col_content": ["mục tiêu", "objective"],
            "col_plo": ["plo"],
        },
        "course_learning_outcomes": {
            "col_co": ["co", "mục tiêu"],
            "col_clo": ["clo", "cđr môn học"],
            "col_content": ["nội dung", "content"],
            "col_plo": ["plo"],
        },
        "learning_material": {
            "col_index": ["stt", "no."],
            "col_name": ["tên tài liệu", "title"],
            "col_author": ["tác giả", "author"],
            "col_type": ["loại", "type"],
        },
        "assessment_method": {
            "col_index": ["stt", "no."],
            "col_type": ["thành phần đánh giá", "loại đánh giá", "type"],
            "col_method": ["bài đánh giá", "hình thức", "method"],
            "col_time": ["thời điểm", "time"],
            "col_clo": ["cđr môn học", "clo"],
            "col_weight": ["tỷ lệ", "tỉ lệ", "weight", "%"],
        },
        "teaching_schedule": {
            "col_session": ["buổi", "session"],
            "col_content": ["nội dung", "content"],
            "col_offline": ["offline"],
            "col_online": ["online"],
            "col_self": ["tự học", "self"],
            "col_clo": ["clo"],
            "col_material": ["học liệu", "material"],
        },
    }

    TABLE_COLUMN_KEY_MAP = {
        "credit": {
            "credit_total": 0,
            "number_theory": 1,
            "number_practice": 2,
            "hour_self_study": 3,
        },
        "requirement_subject": {
            "col_index": 0,
            "col_name": 1,
            "col_code": 2,
            "col_type": 3,
        },
        "objectives_and_outcomes": {
            "col_index": 0,
            "col_content": 1,
            "col_plo": 2,
        },
        "course_learning_outcomes": {
            "col_co": 0,
            "col_clo": 1,
            "col_content": 2,
            "col_plo": 3,
        },
        "learning_material": {
            "col_index": 0,
            "col_name": 1,
            "col_author": 2,
            "col_type": 3,
        },
        "assessment_method": {
            "col_type": 0,
            "col_method": 1,
            "col_time": 2,
            "col_clo": 3,
            "col_weight": 4,
        },
        "teaching_schedule": {
            "col_session": 0,
            "col_content": 1,
            "col_offline": 2,
            "col_online": 3,
            "col_self": 4,
            "col_clo": 5,
            "col_material": 6,
        },
    }

    KV_KEY_PATTERNS = {
        "lecturer_info": {
            "faculty": ["khoa", "bộ môn", "faculty"],
            "lecturer": ["giảng viên", "academics", "lecturer"],
            "email": ["email"],
            "room": ["phòng", "room"],
        }
    }

    @classmethod
    def _apply_label_overrides_to_table(cls, table, table_code: str, label_overrides: dict) -> None:
        if not table or not getattr(table, "rows", None) or not table.rows:
            return
        if not label_overrides or not isinstance(label_overrides, dict):
            return
        if cls._is_key_value_table(table):
            cls._apply_kv_label_overrides(table, table_code, label_overrides)
            return
        cls._apply_grid_label_overrides(table, table_code, label_overrides)

    @classmethod
    def _apply_grid_label_overrides(cls, table, table_code: str, label_overrides: dict) -> None:
        overrides = (label_overrides or {}).get(table_code, {})
        if not overrides or not table.rows:
            return
        header_row = table.rows[0]
        col_patterns = cls.COLUMN_KEY_PATTERNS.get(table_code, {})
        key_map = cls.TABLE_COLUMN_KEY_MAP.get(table_code, {})
        for col_idx, cell in enumerate(header_row.cells):
            key = cls._match_header_key(cell.text, col_patterns) or cls._get_key_by_index(key_map, col_idx)
            if not key or key not in overrides:
                continue
            cls._update_cell_text(cell, str(overrides[key]))

    @classmethod
    def _apply_kv_label_overrides(cls, table, table_code: str, label_overrides: dict) -> None:
        overrides = (label_overrides or {}).get(table_code, {})
        patterns = cls.KV_KEY_PATTERNS.get(table_code, {})
        if not overrides or not patterns:
            return
        for row in table.rows:
            if not row.cells:
                continue
            cell_label = row.cells[0]
            matched_key = cls._match_header_key(cell_label.text, patterns)
            if not matched_key or matched_key not in overrides:
                continue
            cls._update_cell_text(cell_label, str(overrides[matched_key]))

    @staticmethod
    def _match_header_key(text: str, patterns: dict) -> str | None:
        text_lower = (text or "").strip().lower()
        if not text_lower:
            return None
        for key, keywords in patterns.items():
            if any(kw in text_lower for kw in keywords):
                return key
        return None

    @staticmethod
    def _get_key_by_index(key_map: dict, index: int) -> str | None:
        if not key_map:
            return None
        for k, idx in key_map.items():
            if idx == index:
                return k
        return None

    @staticmethod
    def _update_cell_text(cell, new_text: str) -> None:
        if not cell.paragraphs:
            cell.text = new_text
            return
        p = cell.paragraphs[0]
        if not p.runs:
            p.text = new_text
            return
        p.runs[0].text = new_text
        for r in p.runs[1:]:
            r.text = ""

    @staticmethod
    def _is_key_value_table(table) -> bool:
        """Bảng key-value: 2 cột, mỗi row là [label, value]."""
        if not getattr(table, "rows", None) or len(table.rows) == 0:
            return False
        return len(table.rows[0].cells) == 2 and len(table.rows) >= 2

    @staticmethod
    def _append_key_value_rows(table, custom_columns: list[dict]) -> None:
        col_widths = (Inches(2.275), Inches(4.225))
        for col in custom_columns:
            new_row = table.add_row()
            new_row.cells[0].text = col.get("column_label", "")
            new_row.cells[1].text = col.get("default_value", "") or "-"
            new_row.cells[0].width = col_widths[0]
            new_row.cells[1].width = col_widths[1]
