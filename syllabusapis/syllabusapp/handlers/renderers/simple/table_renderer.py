"""handlers/renderers/simple/table_renderer.py

Sub-Renderer generic xử lý các tiểu mục dạng bảng (Table Sub-Sections).
Dựng bảng dữ liệu động từ schema được thiết kế qua TableSchemaBuilder.
Tuân thủ Clean Code: SRP, Guard Clauses, hàm <= 30 dòng.
"""

import re
from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class TableSubRenderer(BaseSubRenderer):
    """Render các tiểu mục dạng bảng (Table) vào tài liệu DOCX."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        return sub_section.get("type") == "table"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        if not doc or not sub_section:
            return

        schema = self._resolve_schema(sub_section, context)
        if not schema or not isinstance(schema, dict):
            return

        columns = schema.get("columns", [])
        if not columns:
            return

        self._render_heading(doc, sub_section)
        self._create_table_element(doc, schema)

    @staticmethod
    def _resolve_schema(sub_section: dict, context: dict) -> dict | None:
        schema = sub_section.get("table_schema")
        if isinstance(schema, dict) and schema.get("columns"):
            return schema

        data = sub_section.get("data")
        if isinstance(data, dict) and data.get("columns"):
            return data

        code = sub_section.get("code")
        if code and isinstance(context, dict):
            ctx_data = context.get(code)
            if isinstance(ctx_data, dict) and ctx_data.get("columns"):
                return ctx_data

        return None

    @staticmethod
    def _render_heading(doc: Document, sub_section: dict) -> None:
        name = (sub_section.get("name") or "").strip()
        position = sub_section.get("position")
        if not name:
            return

        label = name
        if position and not re.match(r"^\d+[\.\)\-]\s+", name):
            label = f"{position}. {name}"

        p = doc.add_paragraph()
        run = p.add_run(label)
        run.bold = True

    @staticmethod
    def _create_table_element(doc: Document, schema: dict):
        raw_columns = list(schema.get("columns", []))
        first_col_header = schema.get("firstColumnHeader")
        rows = schema.get("rows", [])

        columns = []
        if first_col_header or any("rowTitle" in r for r in rows if isinstance(r, dict)):
            columns.append({"field": "rowTitle", "headerName": first_col_header or "Tiêu đề hàng"})
        columns.extend(raw_columns)

        if not columns:
            return None

        if not rows:
            rows = [{col.get("field") or col.get("id"): "" for col in columns}]

        table = doc.add_table(rows=len(rows) + 1, cols=len(columns))
        table.style = "Table Grid"

        for c_idx, col in enumerate(columns):
            h_text = str(col.get("headerName") or col.get("name") or col.get("field") or f"Cột {c_idx + 1}")
            cell = table.rows[0].cells[c_idx]
            cell.text = h_text
            for p in cell.paragraphs:
                for r in p.runs:
                    r.font.bold = True

        for r_idx, row_data in enumerate(rows):
            row_cells = table.rows[r_idx + 1].cells
            for c_idx, col in enumerate(columns):
                f_name = col.get("field") or col.get("id") or f"c_{c_idx + 1}"
                val = row_data.get(f_name, "")
                row_cells[c_idx].text = str(val) if val is not None else ""

        return table
