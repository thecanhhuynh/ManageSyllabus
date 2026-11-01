"""Block processor cho DOCX rendering."""
import json
import re
from xml.sax.saxutils import escape
from docx import Document
from docx.enum.section import WD_SECTION, WD_ORIENT
from docx.shared import Inches, Mm
from handlers.renderers.renderer_factory import SubRendererFactory
from syllabuses.models import Syllabus, TemplateBlock, CustomColumn

from .xml_helpers import (
    _append_xml_to_body,
    _apply_style_to_xml,
    _extract_styles,
    _prepend_position_to_xml,
)
from .style_manager import StyleManager
from .table_manager import TableManager
from .lecturer_manager import LecturerManager


class BlockProcessor:
    """Xử lý render từng block (text, selection, reference) vào document."""

    @staticmethod
    def _fallback_block_custom_columns(block: TemplateBlock, table_code: str) -> list[dict]:
        if not block or not block.template_id or not table_code:
            return []
        return list(
            CustomColumn.objects.filter(
                template_id=block.template_id,
                table_code=table_code,
                is_active=True,
            ).order_by("position", "id").values(
                "column_key", "column_label", "column_type", "default_value", "level"
            )
        )

    @staticmethod
    def _format_sub_heading_text(name: str, position: int | None) -> str:
        """Prepend số thứ tự vào tên sub-section nếu chưa có."""
        if not position or not name:
            return name or ""
        if re.match(r"^\d+[\.\)\-]\s+", name):
            return name
        return f"{position}. {name}"

    @staticmethod
    def _substitute_variables(text: str, data: dict) -> str:
        if not text:
            return ""
        result = text
        if data:
            for key, value in data.items():
                if isinstance(value, (str, int, float)):
                    val_str = escape(str(value))
                    result = result.replace(f"{{{{{key}}}}}", val_str)
                    result = result.replace(f"{{{{{key.lower()}}}}}", val_str)
                    result = result.replace(f"{{{{{key.upper()}}}}}", val_str)
        result = re.sub(r"\{\{[^}]+\}\}", "", result)
        return result

    @staticmethod
    def _apply_label_overrides(text: str, label_overrides: dict) -> str:
        if not text or not label_overrides:
            return text
        result = text
        for group_dict in label_overrides.values():
            if not isinstance(group_dict, dict):
                continue
            for key, label in group_dict.items():
                result = result.replace(f"{{{{LABEL:{key}}}}}", str(label))
        return result



    @classmethod
    def _render_block(
        cls,
        doc: Document,
        block: TemplateBlock,
        data_context: dict,
        block_layout: dict,
        sub_sections_map: dict | None = None,
        custom_columns: list[dict] | None = None,
        object_ids: list[str] | None = None,
        target_table_index: int = 0,
        table_code: str | None = None,
        syllabus: Syllabus | None = None,
        sub_position: int | None = None,
    ) -> None:
        """Xử lý nội dung của một block và chèn vào body."""
        cfg = block.config or {}
        resolved_code = table_code or cfg.get("table_code") or cfg.get("code") or block.code.lower()
        effective_cols = custom_columns if custom_columns is not None else cls._fallback_block_custom_columns(block, resolved_code)

        if block.block_type == "reference":
            cls._render_reference_block(
                doc,
                block,
                data_context,
                sub_sections_map or {},
                block_layout,
                custom_columns=effective_cols,
                object_ids=object_ids,
                target_table_index=target_table_index,
                table_code=resolved_code,
                syllabus=syllabus,
                sub_position=sub_position,
            )
            return

        if block.block_type == "table":
            cls._render_table_block(
                doc,
                block,
                data_context,
                sub_sections_map or {},
                block_layout,
                custom_columns=effective_cols,
                object_ids=object_ids,
                target_table_index=target_table_index,
                table_code=resolved_code,
                syllabus=syllabus,
                sub_position=sub_position,
            )
            return

        xml_tpl = block.xml_template or ""
        if not xml_tpl.strip():
            return

        label_overrides = block_layout.get("label_overrides", {})
        xml_rendered = cls._apply_label_overrides(xml_tpl, label_overrides)

        named_styles = block_layout.get("named_styles", {}) if isinstance(block_layout, dict) else {}
        fallback_style = named_styles.get("SYLLABUS_BODY") or named_styles.get("Normal") or {}
        title_style, content_style = _extract_styles(block.style_config)

        xml_rendered = _apply_style_to_xml(
            xml_snippet=xml_rendered,
            title_style=title_style,
            content_style=content_style,
            fallback_style=fallback_style,
        )

        xml_rendered = cls._substitute_variables(xml_rendered, data_context)
        if sub_position and block.block_type in ("text", "selection"):
            xml_rendered = _prepend_position_to_xml(xml_rendered, sub_position)
        _append_xml_to_body(doc, xml_rendered)

    @classmethod
    def _render_reference_block(
        cls,
        doc: Document,
        block: TemplateBlock,
        data_context: dict,
        sub_sections_map: dict,
        block_layout: dict | None = None,
        custom_columns: list[dict] | None = None,
        object_ids: list[str] | None = None,
        target_table_index: int = 0,
        table_code: str | None = None,
        syllabus: Syllabus | None = None,
        sub_position: int | None = None,
    ) -> None:
        code = (block.config or {}).get("code") or block.code
        resolved_table_code = table_code or (block.config or {}).get("table_code") or code
        sub_section = sub_sections_map.get(code)
        if not sub_section:
            ref_data = data_context.get(code)
            sub_section = {"type": "reference", "code": code, "reference_data": ref_data}

        named_styles = (block_layout or {}).get("named_styles", {})
        title_style, content_style = _extract_styles(block.style_config)

        if content_style:
            if content_style.get("space_before_pt") is not None:
                title_style["space_before_pt"] = content_style["space_before_pt"]
            if content_style.get("space_after_pt") is not None:
                title_style["space_after_pt"] = content_style["space_after_pt"]
            if content_style.get("line_spacing") is not None:
                title_style["line_spacing"] = content_style["line_spacing"]

        is_schedule = code in {"teaching_schedule", "teaching_sessions"}
        if is_schedule:
            cls._add_landscape_section(doc)

        heading_text = cls._format_sub_heading_text(block.name, sub_position)
        StyleManager._render_heading(doc, heading_text, named_styles, title_style)

        paras_before, tables_before = len(doc.paragraphs), len(doc.tables)
        for renderer in SubRendererFactory.get_renderers(sub_section):
            renderer.render(doc, sub_section, data_context)

        new_paras = doc.paragraphs[paras_before:]
        new_tables = doc.tables[tables_before:]

        label_overrides = (block_layout or {}).get("label_overrides", {})
        if code == "lecturer_info":
            new_paras, new_tables = LecturerManager.render(
                doc, block, sub_section, new_paras, new_tables,
                custom_columns=custom_columns, syllabus=syllabus,
                label_overrides=label_overrides,
            )
        if custom_columns and new_tables:
            TableManager._apply_custom_columns(
                new_tables, custom_columns, block, syllabus,
                object_ids, target_table_index, resolved_table_code,
            )
        target_tables = new_tables
        if not target_tables and code == "credit" and target_table_index < len(doc.tables):
            target_tables = [doc.tables[target_table_index]]

        if label_overrides and target_tables:
            for tbl in target_tables:
                TableManager._apply_label_overrides_to_table(tbl, resolved_table_code, label_overrides)
            
        StyleManager._format_paragraphs(new_paras, content_style, named_styles)
        StyleManager._format_tables(target_tables, block, block_layout, content_style, custom_columns=custom_columns)

        if is_schedule:
            cls._restore_portrait_section(doc)

    @staticmethod
    def _add_landscape_section(doc: Document) -> None:
        sec = doc.add_section(WD_SECTION.NEW_PAGE)
        sec.orientation = WD_ORIENT.LANDSCAPE
        sec.page_width = Mm(297)
        sec.page_height = Mm(210)
        sec.left_margin = Mm(20)
        sec.right_margin = Mm(20)
        sec.top_margin = Mm(20)
        sec.bottom_margin = Mm(20)

    @staticmethod
    def _restore_portrait_section(doc: Document) -> None:
        sec = doc.add_section(WD_SECTION.NEW_PAGE)
        sec.orientation = WD_ORIENT.PORTRAIT
        sec.page_width = Mm(210)
        sec.page_height = Mm(297)
        sec.left_margin = Mm(25)
        sec.right_margin = Mm(20)
        sec.top_margin = Mm(20)
        sec.bottom_margin = Mm(20)

    @classmethod
    def _render_table_block(
        cls,
        doc: Document,
        block: TemplateBlock,
        data_context: dict,
        sub_sections_map: dict,
        block_layout: dict | None = None,
        custom_columns: list[dict] | None = None,
        object_ids: list[str] | None = None,
        target_table_index: int = 0,
        table_code: str | None = None,
        syllabus: Syllabus | None = None,
        sub_position: int | None = None,
    ) -> None:
        code = (block.config or {}).get("code") or block.code
        resolved_table_code = table_code or (block.config or {}).get("table_code") or code
        schema = cls._resolve_table_schema(block, resolved_table_code, sub_sections_map, syllabus)
        if not schema:
            if block.xml_template and "<w:tbl" in block.xml_template:
                _append_xml_to_body(doc, block.xml_template)
            return

        named_styles = (block_layout or {}).get("named_styles", {})
        title_style, content_style = _extract_styles(block.style_config)

        if content_style:
            if content_style.get("space_before_pt") is not None and "space_before_pt" not in title_style:
                title_style["space_before_pt"] = content_style["space_before_pt"]
            if content_style.get("space_after_pt") is not None and "space_after_pt" not in title_style:
                title_style["space_after_pt"] = content_style["space_after_pt"]
            if content_style.get("line_spacing") is not None and "line_spacing" not in title_style:
                title_style["line_spacing"] = content_style["line_spacing"]

        heading_text = cls._format_sub_heading_text(block.name, sub_position)
        StyleManager._render_heading(doc, heading_text, named_styles, title_style)

        table = cls._create_dynamic_table(doc, schema, data_context)
        if not table:
            return

        if custom_columns:
            TableManager._apply_custom_columns(
                [table], custom_columns, block, syllabus,
                object_ids, 0, resolved_table_code,
            )

        label_overrides = (block_layout or {}).get("label_overrides", {})
        if label_overrides and table:
            TableManager._apply_label_overrides_to_table(table, resolved_table_code, label_overrides)

        StyleManager._format_tables([table], block, block_layout, content_style, custom_columns=custom_columns)

    @classmethod
    def _resolve_table_schema(
        cls,
        block: TemplateBlock,
        table_code: str,
        sub_sections_map: dict,
        syllabus: Syllabus | None = None,
    ) -> dict | None:
        sub = sub_sections_map.get(table_code)
        if sub and sub.get("table_schema"):
            return sub.get("table_schema")

        if syllabus:
            from syllabuses.models import TableSubSection
            tbl_sub = TableSubSection.objects.filter(
                main_section__syllabus=syllabus,
                code=table_code,
            ).first()
            if tbl_sub and tbl_sub.data:
                return tbl_sub.data if isinstance(tbl_sub.data, dict) else json.loads(tbl_sub.data)

        from syllabuses.models import TemplateTableSubSection
        tpl_sub = TemplateTableSubSection.objects.filter(
            main_section__template_id=block.template_id,
            code=table_code,
        ).first()
        if tpl_sub and tpl_sub.table_schema:
            return tpl_sub.table_schema

        return (block.config or {}).get("table_schema")

    @classmethod
    def _create_dynamic_table(cls, doc: Document, schema: dict, data_context: dict):
        columns = schema.get("columns", [])
        if not columns:
            return None

        rows = schema.get("rows", [])
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
