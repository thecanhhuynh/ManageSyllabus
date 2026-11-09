"""Style manager cho DOCX rendering."""
from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from .xml_helpers import _apply_paragraph_style, _apply_run_style, _extract_styles
from .table_manager import TableManager


class StyleManager:
    """Quản lý áp dụng styles cho headings, paragraphs, cells và tables."""

    @staticmethod
    def _render_heading(doc: Document, text: str, named_styles: dict, title_style: dict) -> None:
        fallback = named_styles.get("SYLLABUS_HEADING_2") or {}
        effective = dict(fallback)
        effective.update({k: v for k, v in title_style.items() if v is not None})
        if "bold" not in effective:
            effective["bold"] = True

        if "space_before_pt" not in effective or effective["space_before_pt"] is None:
            effective["space_before_pt"] = 2
        if "space_after_pt" not in effective or effective["space_after_pt"] is None:
            effective["space_after_pt"] = 2

        p = doc.add_paragraph()
        run = p.add_run(text)
        _apply_paragraph_style(p._p, effective)
        _apply_run_style(run._r, effective)

    @classmethod
    def _format_paragraphs(cls, paragraphs: list, content_style: dict | None, named_styles: dict) -> None:
        if not paragraphs:
            return
        fallback = named_styles.get("SYLLABUS_BODY") or {}
        effective = dict(fallback)
        for k, v in (content_style or {}).items():
            if v is not None:
                effective[k] = v
                
        for p in paragraphs:
            if not p.text.strip():
                empty_style = dict(effective)
                empty_style["space_before_pt"] = 0
                empty_style["line_spacing"] = 1.0
                _apply_paragraph_style(p._p, empty_style)
            else:
                p_style = dict(effective)
                if "ma trận tích hợp" in p.text.lower():
                    p_style["alignment"] = "CENTER"
                _apply_paragraph_style(p._p, p_style)
                
            for r in p.runs:
                run_style = dict(effective)
                if r.bold and (content_style or {}).get("bold") is None:
                    run_style["bold"] = True
                _apply_run_style(r._r, run_style)

    @staticmethod
    def _get_effective_cell_style(base_style: dict, col_style: dict | None) -> dict:
        if not col_style:
            return base_style
        effective = dict(base_style)
        for k, v in col_style.items():
            if k == "align" and "alignment" not in col_style:
                effective["alignment"] = str(v).lower()
            elif v is not None:
                effective[k] = v
        return effective

    @staticmethod
    def _format_cell(cell, style: dict) -> None:
        if not cell or not style:
            return
            
        cell_style = dict(style)
        
        cell_style["space_before_pt"] = 0
        cell_style["space_after_pt"] = 0
        
        if not cell_style.get("line_spacing"):
            cell_style["line_spacing"] = 1.15

        align = str(cell_style.get("alignment") or "").lower()
        v_align = str(cell_style.get("vertical_alignment") or "").lower()
        if v_align == "top":
            cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
        elif v_align == "bottom":
            cell.vertical_alignment = WD_ALIGN_VERTICAL.BOTTOM
        elif v_align == "center" or align == "center":
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

        for para in cell.paragraphs:
            _apply_paragraph_style(para._p, cell_style)
            for run in para.runs:
                _apply_run_style(run._r, cell_style)

    @staticmethod
    def _is_matrix_table(table) -> bool:
        if not getattr(table, "rows", None) or not table.rows:
            return False
        cells = [c.text.strip().lower() for c in table.rows[0].cells]
        return len(cells) > 1 and "clos" in cells[0] and any("plo" in c for c in cells[1:])

    @classmethod
    def _format_matrix_table(cls, table, header_style: dict, body_style: dict) -> None:
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for row_idx, row in enumerate(table.rows):
            is_header = row_idx == 0
            base = header_style if is_header else body_style
            for col_idx, cell in enumerate(row.cells):
                effective = cls._get_effective_cell_style(base, None)
                effective = dict(effective, alignment="CENTER", vertical_alignment="center")
                if is_header or col_idx == 0:
                    effective = dict(effective, bold=True)
                cls._format_cell(cell, effective)
        from handlers.renderers.complex.clo_plo_matrix_renderer import CLOPLOMatrixSubRenderer
        CLOPLOMatrixSubRenderer._apply_column_widths(table)

    @classmethod
    def _format_single_table(
        cls,
        table,
        block,
        block_layout: dict | None,
        content_style: dict | None = None,
        custom_columns: list[dict] | None = None,
    ) -> None:
        if not table or not getattr(table, "rows", None):
            return

        if table.rows and "không đáp ứng" in (table.rows[0].cells[0].text or "").lower():
            from handlers.renderers.complex.clo_plo_matrix_renderer import CLOPLOMatrixSubRenderer
            CLOPLOMatrixSubRenderer._format_legend_table(table)
            return

        if content_style is None:
            _, content_style = _extract_styles(block.style_config)

        named_styles = (block_layout or {}).get("named_styles", {})
        header_style = dict(content_style)
        header_style.update({k: v for k, v in named_styles.get("SYLLABUS_TABLE_HEADER", {}).items() if v is not None})
        
        body_style = dict(named_styles.get("SYLLABUS_TABLE_BODY", {}))
        body_style.update({k: v for k, v in content_style.items() if v is not None})

        if cls._is_matrix_table(table):
            cls._format_matrix_table(table, header_style, body_style)
            return

        code = (block.config or {}).get("code") or block.code
        col_styles = {**(block_layout or {}).get("column_styles", {}).get(code, {}), **(block.config or {}).get("column_styles", {})}
        cell_alignments = (block.config or {}).get("cell_alignments", {})
        col_keys = TableManager._resolve_column_keys(table, code, custom_columns=custom_columns)
        is_kv = TableManager._is_key_value_table(table)

        cls._apply_styles_to_table_cells(
            table, header_style, body_style, col_styles, col_keys, is_kv, cell_alignments, table_code=code
        )

        formula = (block.config or {}).get("column_widths_formula")
        if formula:
            TableManager._apply_column_width(table, formula=formula, table_code=code)

    @classmethod
    def _format_cell_at(
        cls, cell, base: dict, col_style: dict | None, align: str | None, is_header: bool, is_kv_key: bool
    ) -> None:
        effective = cls._get_effective_cell_style(base, col_style)
        if align:
            effective = dict(effective, alignment=str(align).upper())
        if is_header:
            effective = dict(effective, vertical_alignment="center")
        if is_kv_key:
            effective = dict(effective, bold=True)
        cls._format_cell(cell, effective)

    @staticmethod
    def _detect_schedule_header_count(table) -> int:
        for idx, row in enumerate(table.rows):
            text = row.cells[0].text.strip() if row.cells else ""
            if "(1)" in text:
                return idx + 1
        return 4

    @classmethod
    def _resolve_cell_align(
        cls,
        aligns: dict,
        r: int,
        c: int,
        last_r: int,
        is_sched: bool,
        header_cnt: int,
    ) -> str | None:
        if not aligns:
            return None
        direct = aligns.get(f"{r},{c}")
        if direct:
            return direct
        if r == last_r:
            return aligns.get(f"-1,{c}")
        if not (is_sched and header_cnt <= r < last_r):
            return None
        for i in range(header_cnt, last_r + 1):
            val = aligns.get(f"{i},{c}")
            if val:
                return val
        return None

    @classmethod
    def _apply_styles_to_table_cells(
        cls,
        table,
        header_style: dict,
        body_style: dict,
        col_styles: dict,
        col_keys: list,
        is_kv: bool,
        cell_alignments: dict,
        table_code: str = "",
    ) -> None:
        formatted_tcs = set()
        last_row_idx = len(table.rows) - 1
        is_sched = table_code in {"teaching_schedule", "teaching_sessions"}
        header_cnt = cls._detect_schedule_header_count(table) if is_sched else 1

        for row_idx, row in enumerate(table.rows):
            is_header = (row_idx < header_cnt) if is_sched else (row_idx == 0 and not is_kv)
            base = header_style if is_header else body_style
            for col_idx, cell in enumerate(row.cells):
                if cell._tc in formatted_tcs:
                    continue
                formatted_tcs.add(cell._tc)
                col_key = col_keys[col_idx] if col_idx < len(col_keys) else str(col_idx)
                col_style = col_styles.get(col_key) or col_styles.get(str(col_idx))
                align = cls._resolve_cell_align(
                    cell_alignments, row_idx, col_idx, last_row_idx, is_sched, header_cnt
                )
                cls._format_cell_at(
                    cell, base, col_style, align, is_header, is_kv and col_idx == 0
                )

    @classmethod
    def _format_tables(
        cls,
        tables: list,
        block,
        block_layout: dict | None,
        content_style: dict | None = None,
        custom_columns: list[dict] | None = None,
    ) -> None:
        if not tables:
            return
        if content_style is None:
            _, content_style = _extract_styles(block.style_config)
        for table in tables:
            cls._format_single_table(table, block, block_layout, content_style, custom_columns=custom_columns)
