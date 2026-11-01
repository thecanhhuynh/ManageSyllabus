"""
handlers/block_style_renderer.py — Pipeline điều phối render DOCX:
Inject styles, apply formatting/italic/bold, display types, radio symbols, sub-renderers, table shading.
"""

import io
import jinja2
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docxtpl import DocxTemplate

from handlers.data_mapper import SyllabusDataMapper
from handlers.renderers import SubRendererFactory
from handlers.styles_xml_injector import StylesXmlInjector
from handlers.table_renderer import render_dynamic_tables

ALIGN_MAP = {"LEFT": WD_ALIGN_PARAGRAPH.LEFT, "CENTER": WD_ALIGN_PARAGRAPH.CENTER, "RIGHT": WD_ALIGN_PARAGRAPH.RIGHT, "JUSTIFY": WD_ALIGN_PARAGRAPH.JUSTIFY}


class BlockStyleDocxRenderer:
    """Renderer điều phối xử lý theo mô hình Sub-Renderer Pattern."""

    def __init__(self, template_bytes: bytes, block_layout: dict = None):
        if not template_bytes:
            raise ValueError("Template bytes không được rỗng.")
        self.template_bytes = template_bytes
        self.block_layout = block_layout or {}

    def _apply_custom_transforms(self, docx_bytes_io: io.BytesIO, ctx: dict = None) -> io.BytesIO:
        doc = Document(docx_bytes_io)
        self._apply_header_alignments(doc)
        self._apply_display_types(doc, ctx or {})
        self._replace_symbols(doc)
        out = io.BytesIO()
        doc.save(out)
        out.seek(0)
        return out

    def render(self, syllabus=None, syllabus_json: dict = None) -> io.BytesIO:
        if not syllabus and not syllabus_json:
            raise ValueError("Syllabus không được rỗng.")

        raw_json = self._resolve_raw_json(syllabus, syllabus_json)
        data_ctx = SyllabusDataMapper(raw_json).build()

        doc = Document(self._inject_named_styles())
        self._apply_header_alignments(doc)
        self._apply_display_types(doc, data_ctx)
        self._replace_symbols(doc)
        self._delegate_to_sub_renderers(doc, raw_json, data_ctx)

        render_dynamic_tables(doc, data_ctx)
        doc = self._render_scalars(doc, data_ctx)
        self._apply_table_overrides(doc)

        out_buf = io.BytesIO()
        doc.save(out_buf)
        out_buf.seek(0)
        return out_buf

    @staticmethod
    def _resolve_raw_json(syllabus, syllabus_json: dict = None) -> dict:
        if syllabus_json is not None:
            return syllabus_json
        if isinstance(syllabus, dict):
            return syllabus
        from syllabuses.serializer import SyllabusDetailSerializer
        return SyllabusDetailSerializer(syllabus).data

    def _inject_named_styles(self) -> io.BytesIO:
        named_styles = self.block_layout.get("named_styles")
        if not named_styles:
            return io.BytesIO(self.template_bytes)
        return StylesXmlInjector.inject(self.template_bytes, self.block_layout)

    @staticmethod
    def _format_runs(p, cfg: dict) -> None:
        if not cfg:
            return
        if cfg.get("alignment"):
            p.alignment = ALIGN_MAP.get(cfg["alignment"].upper(), p.alignment)
        italic, bold = cfg.get("italic"), cfg.get("bold")
        fn, fs = cfg.get("font_name"), cfg.get("font_size_pt")
        for r in p.runs:
            if italic is not None:
                r.font.italic = bool(italic)
            if bold is not None:
                r.font.bold = bool(bold)
            if fn:
                r.font.name = fn
            if fs:
                r.font.size = Pt(float(fs))

    def _apply_header_alignments(self, doc: Document) -> None:
        named_styles = self.block_layout.get("named_styles", {})
        if not named_styles:
            return
        l1, l2 = named_styles.get("SYLLABUS_HEADER_LINE_1", {}), named_styles.get("SYLLABUS_HEADER_LINE_2", {})
        title, h1 = named_styles.get("SYLLABUS_TITLE", {}), named_styles.get("SYLLABUS_HEADING_1", {})
        body = named_styles.get("SYLLABUS_BODY", {})

        for p in doc.paragraphs:
            t = p.text.strip().upper()
            if not t:
                continue
            if "BỘ GIÁO DỤC" in t or "MINISTRY OF EDUCATION" in t:
                self._format_runs(p, l1)
            elif "TRƯỜNG ĐẠI HỌC" in t or "OPEN UNIVERSITY" in t:
                self._format_runs(p, l2)
            elif "ĐỀ CƯƠNG" in t or "COURSE SPECIFICATION" in t:
                self._format_runs(p, title)
            elif t.startswith(("I.", "II.", "III.", "IV.", "V.", "VI.", "VII.", "VIII.", "IX.", "X.")):
                self._format_runs(p, h1)
            elif body.get("italic") is not None:
                for r in p.runs:
                    r.font.italic = bool(body["italic"])

    def _apply_display_types(self, doc: Document, ctx: dict) -> None:
        display_types = self.block_layout.get("section_display_types", {})
        if display_types and str(display_types.get("CREDITS", "TABLE")).upper() == "TEXT":
            self._convert_credits_to_text(doc, ctx)

    @staticmethod
    def _convert_credits_to_text(doc: Document, ctx: dict) -> None:
        for table in doc.tables:
            first_row = " ".join(c.text.strip() for c in table.rows[0].cells).lower() if table.rows else ""
            if "tổng số" not in first_row and "total" not in first_row:
                continue
            if len(table.rows) < 2:
                continue
            tot, th, pr, st = ctx.get("CREDIT_TOTAL", "3"), ctx.get("CREDIT_THEORY", "2"), ctx.get("CREDIT_PRACTICE", "1"), ctx.get("CREDIT_SELF_STUDY", "90")
            new_p = doc.add_paragraph(f"• Số tín chỉ: {tot} (Lý thuyết: {th}, Thực hành: {pr}, Tự học: {st} giờ)")
            table._element.addprevious(new_p._element)
            table._element.getparent().remove(table._element)
            break

    def _replace_symbols(self, doc: Document) -> None:
        if str(self.block_layout.get("symbol_style", "CHECKBOX")).upper() != "RADIO":
            return

        for p in doc.paragraphs:
            self._replace_runs_symbol(p)
        for t in doc.tables:
            for r in t.rows:
                for c in r.cells:
                    for p in c.paragraphs:
                        self._replace_runs_symbol(p)

    @staticmethod
    def _replace_runs_symbol(p) -> None:
        for run in p.runs:
            if "☐" in run.text or "☑" in run.text:
                run.text = run.text.replace("☐", "◯").replace("☑", "◉")

    @staticmethod
    def _delegate_to_sub_renderers(doc: Document, raw_json: dict, data_ctx: dict) -> None:
        for main_sec in raw_json.get("main_sections") or []:
            for sub in main_sec.get("sub_sections", []):
                for r in SubRendererFactory.get_renderers(sub):
                    r.render(doc, sub, data_ctx)

    @staticmethod
    def _render_scalars(doc: Document, data_context: dict) -> Document:
        buf = io.BytesIO()
        doc.save(buf)
        buf.seek(0)
        tpl = DocxTemplate(buf)
        env = jinja2.Environment(variable_start_string="[[", variable_end_string="]]", autoescape=False)
        try:
            tpl.render(data_context, jinja_env=env)
        except Exception:
            pass
        out = io.BytesIO()
        tpl.save(out)
        out.seek(0)
        return Document(out)

    def _apply_table_overrides(self, doc: Document) -> None:
        cfg = self.block_layout.get("table_structures", {}).get("SYLLABUS_TABLE_HEADER", {})
        fill_hex, th_i, th_b = cfg.get("cell_fill_hex"), cfg.get("italic"), cfg.get("bold")
        shd_xml = f'<w:shd {nsdecls("w")} w:fill="{fill_hex.replace("#", "").upper()}"/>' if fill_hex else None

        for table in doc.tables:
            if not table.rows:
                continue
            for cell in table.rows[0].cells:
                if shd_xml:
                    tcPr = cell._tc.get_or_add_tcPr()
                    for old in tcPr.findall(f'{{{nsdecls("w").split("=")[1].strip(chr(34))}}}shd'):
                        tcPr.remove(old)
                    tcPr.append(parse_xml(shd_xml))
                if th_i is not None or th_b is not None:
                    for cp in cell.paragraphs:
                        for cr in cp.runs:
                            if th_i is not None: cr.font.italic = bool(th_i)
                            if th_b is not None: cr.font.bold = bool(th_b)
