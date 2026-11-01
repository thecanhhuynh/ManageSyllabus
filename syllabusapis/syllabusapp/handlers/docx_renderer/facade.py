"""Facade ShellDocxRenderer cho DOCX rendering."""
import copy
import io
import os
import logging
from docx import Document

from handlers.header_footer_renderer import HeaderFooterRenderer
from syllabuses.models import Syllabus, TemplateBlock, TemplateSyllabus, CustomColumn

from .xml_helpers import (
    W_NS,
    _append_xml_to_body,
    _apply_style_to_xml,
)
from .block_processor import BlockProcessor

logger = logging.getLogger(__name__)


def _to_roman(n: int) -> str:
    if n <= 0:
        return str(n)
    val_map = (
        (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
        (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
        (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")
    )
    result = []
    for val, numeral in val_map:
        while n >= val:
            result.append(numeral)
            n -= val
    return "".join(result)


class ShellDocxRenderer:
    """Renderer lắp ráp các TemplateBlock vào file Shell DOCX theo Spec V3."""

    def __init__(self):
        self.header_footer_renderer = HeaderFooterRenderer()

    def render(
        self,
        template: TemplateSyllabus,
        syllabus: Syllabus | None = None,
        data_context: dict | None = None,
        block_layout_override: dict | None = None,
    ) -> io.BytesIO:
        """Thực hiện 6 bước render file DOCX từ shell và blocks."""
        doc = self._load_shell_doc(template)
        block_layout = block_layout_override or (template.block_layout or {})
        data_ctx = dict(data_context or {})

        if not data_ctx and syllabus:
            try:
                from handlers.data_mapper import SyllabusDataMapper
                data_ctx = SyllabusDataMapper(syllabus).build()
            except Exception:
                data_ctx = {}

        demo_defaults = {
            "english_title": "Object-Oriented Design & Programming",
            "subject_name_vi": "Thiết kế và Lập trình Hướng đối tượng",
            "subject_code": "ITEC1311",
            "teaching_methods": "Trực tiếp kết hợp Trực tuyến",
            "language": "Tiếng Việt / English",
            "knowledge_components": "Cơ sở ngành",
            "course_detail": "Học phần cung cấp kiến thức nền tảng về thiết kế và lập trình hướng đối tượng.",
        }
        for k, v in demo_defaults.items():
            if k not in data_ctx and k.upper() not in data_ctx:
                data_ctx[k] = v

        self._clean_body_preserve_sect_pr(doc)

        hf_config = block_layout.get("header_footer") if isinstance(block_layout, dict) else None
        header_cfg = hf_config.get("header") if hf_config else None
        footer_cfg = hf_config.get("footer") if hf_config else None

        self.header_footer_renderer.render_header(doc, header_cfg)

        sub_sections_map = self._extract_sub_sections(syllabus)
        if not sub_sections_map and isinstance(data_ctx.get("sub_sections_map"), dict):
            sub_sections_map = data_ctx.get("sub_sections_map")

        self._render_all_blocks(
            doc, template, data_ctx, block_layout, sub_sections_map, syllabus
        )

        self.header_footer_renderer.render_footer(doc, footer_cfg)

        output_buffer = io.BytesIO()
        doc.save(output_buffer)
        output_buffer.seek(0)

        if block_layout and block_layout.get("named_styles"):
            try:
                from handlers.styles_xml_injector import StylesXmlInjector
                return StylesXmlInjector.inject(output_buffer.getvalue(), block_layout)
            except Exception:
                pass

        return output_buffer

    @staticmethod
    def _load_template_custom_columns(template: TemplateSyllabus) -> dict[str, list[dict]]:
        """Load all custom columns của template, group theo table_code."""
        if not template:
            return {}
        cols = CustomColumn.objects.filter(
            template=template,
            is_active=True,
        ).order_by("table_code", "position", "id").values(
            "table_code", "column_key", "column_label",
            "column_type", "default_value", "level",
        )
        grouped = {}
        for col in cols:
            grouped.setdefault(col["table_code"], []).append(dict(col))
        return grouped

    def _render_all_blocks(
        self,
        doc: Document,
        template: TemplateSyllabus,
        data_ctx: dict,
        block_layout: dict,
        sub_sections_map: dict,
        syllabus: Syllabus | None,
    ) -> None:
        main_sections = template.main_sections.all().order_by("position")
        blocks = TemplateBlock.objects.filter(template=template, is_active=True)
        block_by_code = {b.config.get("code") or b.code: b for b in blocks}
        block_by_name = {b.name: b for b in blocks}
        custom_cols = self._load_template_custom_columns(template)
        draft_styles = (block_layout or {}).get("block_styles", {}) if isinstance(block_layout, dict) else {}
        draft_configs = (block_layout or {}).get("block_configs", {}) if isinstance(block_layout, dict) else {}

        if not main_sections.exists():
            for block in blocks.order_by("position"):
                self._render_styled_block(
                    doc, block, data_ctx, block_layout, sub_sections_map,
                    custom_cols, syllabus, draft_styles, block.position,
                    draft_configs=draft_configs,
                )
            return

        for ms in main_sections:
            self._render_main_section_header(doc, ms, block_layout)
            for sub in ms.sub_sections.all().order_by("position"):
                block = block_by_code.get(sub.code) or block_by_name.get(sub.name)
                if not block or not block.is_active:
                    continue
                self._render_styled_block(
                    doc, block, data_ctx, block_layout, sub_sections_map,
                    custom_cols, syllabus, draft_styles, sub.position,
                    draft_configs=draft_configs,
                )

    def _render_styled_block(
        self,
        doc: Document,
        block: TemplateBlock,
        data_ctx: dict,
        block_layout: dict,
        sub_sections_map: dict,
        custom_cols: dict,
        syllabus: Syllabus | None,
        draft_styles: dict,
        sub_pos: int | None,
        draft_configs: dict | None = None,
    ) -> None:
        temp_block = copy.copy(block)
        draft = draft_styles.get(block.code)
        temp_block.style_config = draft if draft else (block.style_config or {})
        cfg = block.config or {}
        draft_cfg = (draft_configs or {}).get(block.code) or (draft_configs or {}).get(cfg.get("code"))
        if draft_cfg:
            temp_block.config = {**cfg, **draft_cfg}
        t_code = (temp_block.config or {}).get("table_code") or (temp_block.config or {}).get("code") or temp_block.code.lower()
        BlockProcessor._render_block(
            doc, temp_block, data_ctx, block_layout, sub_sections_map,
            custom_columns=custom_cols.get(t_code, []),
            table_code=t_code, syllabus=syllabus,
            sub_position=sub_pos,
        )

    def _render_main_section_header(
        self, doc: Document, main_section, block_layout: dict | None = None
    ) -> None:
        pos = getattr(main_section, "position", 1) or 1
        roman = _to_roman(pos)
        ms_name = (main_section.name or "").strip()
        header_text = ms_name if ms_name.startswith(f"{roman}.") else f"{roman}. {ms_name}"

        b_layout = block_layout if isinstance(block_layout, dict) else {}
        main_styles = b_layout.get("main_sections_style", {})
        custom_style = main_styles.get(str(main_section.id)) or main_styles.get(main_section.id) or {}
        fallback = b_layout.get("named_styles", {}).get("SYLLABUS_HEADING_1") or {}
        effective = {**fallback, **custom_style}
        if "bold" not in effective:
            effective["bold"] = True

        xml_header = (
            f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>'
            f'<w:r><w:t>{header_text}</w:t></w:r></w:p>'
        )
        xml_header = _apply_style_to_xml(
            xml_snippet=xml_header, title_style=effective, content_style=effective, fallback_style={}
        )
        _append_xml_to_body(doc, xml_header)

    def _extract_sub_sections(self, syllabus: Syllabus | None) -> dict:
        if not syllabus:
            return {}
        try:
            from syllabuses.serializer import SyllabusDetailSerializer
            s_data = SyllabusDetailSerializer(syllabus).data
            return {
                sub.get("code"): sub
                for m in s_data.get("main_sections", [])
                for sub in m.get("sub_sections", [])
                if isinstance(sub, dict) and sub.get("code")
            }
        except Exception:
            return {}

    def _load_shell_doc(self, template: TemplateSyllabus) -> Document:
        """Load document từ shell path của template hoặc fallback."""
        shell_path = self._resolve_shell_path(template)
        if shell_path and os.path.exists(shell_path):
            return Document(shell_path)
        return Document()

    def _resolve_shell_path(self, template: TemplateSyllabus) -> str | None:
        if template.file and os.path.exists(template.file.path):
            return template.file.path

        if template.file_clean and os.path.exists(template.file_clean.path):
            base_dir = os.path.dirname(template.file_clean.path)
            candidate = os.path.abspath(os.path.join(base_dir, "..", "shell", "shell.docx"))
            if os.path.exists(candidate):
                return candidate

        return None

    def _clean_body_preserve_sect_pr(self, doc: Document) -> None:
        """Xóa toàn bộ nội dung body nhưng bảo toàn thẻ sectPr ở cuối."""
        body = doc._body._element
        sect_pr = body.find(f"{{{W_NS}}}sectPr")
        for child in list(body):
            if child != sect_pr:
                body.remove(child)
