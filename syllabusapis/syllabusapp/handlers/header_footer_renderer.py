import os
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Inches, Pt

ALIGNMENT_MAP = {
    "LEFT": WD_ALIGN_PARAGRAPH.LEFT,
    "CENTER": WD_ALIGN_PARAGRAPH.CENTER,
    "RIGHT": WD_ALIGN_PARAGRAPH.RIGHT,
    "JUSTIFY": WD_ALIGN_PARAGRAPH.JUSTIFY,
}

DEFAULT_HEADER_LINES = [
    ("BỘ GIÁO DỤC VÀ ĐÀO TẠO", False, 12),
    ("MINISTRY OF EDUCATION AND TRAINING", False, 11),
    ("TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH", True, 12),
    ("HO CHI MINH CITY OPEN UNIVERSITY", True, 12),
]

DEFAULT_TITLE_LINES = [
    ("ĐỀ CƯƠNG MÔN HỌC", True, 14),
    ("COURSE SPECIFICATION", True, 13),
]


class HeaderFooterRenderer:
    """Renderer tạo khối Header và Footer trong body file DOCX chuẩn mẫu HCMOU."""

    def render_header(self, doc: Document, config: dict | None = None) -> None:
        cfg = (
            config.get("header")
            if isinstance(config, dict) and "header" in config
            else (config or {})
        )
        self._render_logo(doc, cfg)
        self._render_appendix_box(doc, cfg)
        self._render_main_header_lines(doc, cfg)
        self._render_divider_line(doc)
        self._render_title_lines(doc, cfg)

    def render_footer(self, doc: Document, config: dict | None = None, syllabus=None) -> None:
        cfg = (
            config.get("footer")
            if isinstance(config, dict) and "footer" in config
            else (config or {})
        )
        self._render_date_line(doc, cfg, syllabus=syllabus)
        self._render_signature_table(doc, cfg, syllabus=syllabus)

    @staticmethod
    def _apply_run_color(run, color: str | None) -> None:
        rPr = run._element.get_or_add_rPr()
        color_el = rPr.find(qn("w:color"))
        if not color or str(color).upper() in ("AUTO", "NONE"):
            if color_el is not None:
                rPr.remove(color_el)
            return
        hex_val = str(color).lstrip("#").upper()
        if color_el is None:
            color_el = OxmlElement("w:color")
            rPr.append(color_el)
        color_el.set(qn("w:val"), hex_val)

    @staticmethod
    def _apply_line_style(
        paragraph, style: dict | None, default_style: dict | None = None
    ) -> None:
        """Apply style cho paragraph và run dựa trên schema mới kết hợp fallback cũ."""
        merged = {**(default_style or {}), **(style or {})}
        font_size = (
            merged.get("font_size_pt")
            or merged.get("font_size")
            or default_style.get("font_size_pt", 12)
            if default_style
            else 12
        )
        font_name = merged.get("font_name") or "Times New Roman"
        alignment = str(merged.get("alignment") or "CENTER").upper()

        pf = paragraph.paragraph_format
        pf.alignment = ALIGNMENT_MAP.get(alignment, WD_ALIGN_PARAGRAPH.CENTER)

        space_before = merged.get("space_before_pt")
        space_after = merged.get("space_after_pt")
        if space_before is not None:
            pf.space_before = Pt(float(space_before))
        if space_after is not None:
            pf.space_after = Pt(float(space_after))

        for run in paragraph.runs:
            run.font.name = font_name
            run.font.size = Pt(float(font_size))
            run.bold = bool(merged.get("bold", False))
            run.italic = bool(merged.get("italic", False))
            run.underline = bool(merged.get("underline", False))
            HeaderFooterRenderer._apply_run_color(run, merged.get("color"))

    @staticmethod
    def _resolve_logo_path(logo_url: str) -> str | None:
        if not logo_url:
            return None
        if os.path.isabs(logo_url) and os.path.exists(logo_url):
            return logo_url
        try:
            from django.conf import settings

            relative = logo_url.lstrip("/")
            if relative.startswith("media/"):
                relative = relative[6:]
            candidate = os.path.join(settings.MEDIA_ROOT, relative)
            if os.path.exists(candidate):
                return candidate
        except Exception:
            return None
        return None

    @staticmethod
    def _render_logo(doc: Document, header_config: dict) -> None:
        logo_url = header_config.get("logo_url")
        if not logo_url:
            return

        abs_path = HeaderFooterRenderer._resolve_logo_path(logo_url)
        if not abs_path or not os.path.exists(abs_path):
            return

        logo_width_pt = header_config.get("logo_width_pt", 80)
        logo_align = (header_config.get("logo_alignment") or "LEFT").upper()

        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.alignment = ALIGNMENT_MAP.get(logo_align, WD_ALIGN_PARAGRAPH.LEFT)
        pf.space_before = Pt(0)
        pf.space_after = Pt(4)
        run = p.add_run()
        run.add_picture(abs_path, width=Pt(float(logo_width_pt)))

    def _render_appendix_box(self, doc: Document, config: dict) -> None:
        tbl = doc.add_table(rows=1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.RIGHT
        tbl.autofit = False

        r0 = tbl.rows[0]
        r0.cells[0].width = Inches(4.3)
        r0.cells[1].width = Inches(2.2)

        tc_pr0 = r0.cells[0]._tc.get_or_add_tcPr()
        tc_pr0.append(
            parse_xml(
                f'<w:tcBorders {nsdecls("w")}><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>'
            )
        )

        appendix_style = config.get("appendix_style") or {}
        border_val = appendix_style.get("border", "single")
        if border_val == "solid":
            border_val = "single"

        tc_pr1 = r0.cells[1]._tc.get_or_add_tcPr()
        tc_pr1.append(
            parse_xml(
                f'<w:tcBorders {nsdecls("w")}><w:top w:val="{border_val}" w:sz="6" w:space="0" w:color="000000"/><w:left w:val="{border_val}" w:sz="6" w:space="0" w:color="000000"/><w:bottom w:val="{border_val}" w:sz="6" w:space="0" w:color="000000"/><w:right w:val="{border_val}" w:sz="6" w:space="0" w:color="000000"/></w:tcBorders>'
            )
        )

        p = r0.cells[1].paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)

        appendix_text = self._get_appendix_text(config)
        p.add_run(appendix_text)
        default_style = {
            "font_name": "Times New Roman",
            "font_size_pt": 12,
            "bold": True,
            "italic": True,
            "alignment": "CENTER",
        }
        self._apply_line_style(p, appendix_style, default_style)

    def _get_appendix_text(self, config: dict) -> str:
        if config.get("appendix_text"):
            return config["appendix_text"]
        for sec in config.get("sections", []):
            if sec.get("type") == "appendix":
                lines = sec.get("lines", [])
                if lines and lines[0].get("text"):
                    return lines[0]["text"]
        return "Phụ lục 7-Appendix 7"

    def _render_main_header_lines(self, doc: Document, config: dict) -> None:
        lines = self._get_main_lines_from_config(config)
        if not lines:
            lines = [
                {"text": t, "style": {"bold": b, "font_size_pt": s}}
                for t, b, s in DEFAULT_HEADER_LINES
            ]

        for item in lines:
            text = item.get("text", "")
            if not text.strip():
                continue
            p = doc.add_paragraph()
            p.add_run(text)
            default_style = {
                "font_name": "Times New Roman",
                "font_size_pt": 12,
                "alignment": "CENTER",
                "space_before_pt": 0,
                "space_after_pt": 2,
            }
            self._apply_line_style(p, item.get("style"), default_style)

    def _get_main_lines_from_config(self, config: dict) -> list[dict]:
        direct_lines = config.get("main_lines") or config.get("lines")
        if isinstance(direct_lines, list) and direct_lines:
            result = []
            for item in direct_lines:
                if isinstance(item, dict):
                    text = item.get("text", "")
                    style = item.get("style") or {
                        "bold": item.get("bold", False),
                        "font_size_pt": item.get("font_size_pt")
                        or item.get("font_size", 12),
                    }
                    if text:
                        result.append({"text": text, "style": style})
                elif isinstance(item, (list, tuple)) and len(item) >= 3:
                    result.append(
                        {
                            "text": item[0],
                            "style": {"bold": item[1], "font_size_pt": item[2]},
                        }
                    )
            if result:
                return result

        result = self._extract_lines_from_sections(config)
        if result:
            return result

        return self._extract_legacy_lines(config)

    def _extract_lines_from_sections(self, config: dict) -> list[dict]:
        result = []
        for sec in config.get("sections", []):
            if sec.get("type") != "main":
                continue
            for line in sec.get("lines", []):
                text = line.get("text", "")
                if text in ("ĐỀ CƯƠNG MÔN HỌC", "COURSE SPECIFICATION"):
                    continue
                result.append({"text": text, "style": line.get("style", {})})
        return result

    def _extract_legacy_lines(self, config: dict) -> list[dict]:
        line1 = config.get("line1")
        line2 = config.get("line2")
        res = []
        if line1:
            res.append({"text": line1, "style": {"bold": False, "font_size_pt": 12}})
        if line2:
            res.append({"text": line2, "style": {"bold": True, "font_size_pt": 12}})
        return res

    def _render_divider_line(self, doc: Document) -> None:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run("______________________________")
        run.font.name = "Times New Roman"
        run.font.size = Pt(10)
        run.bold = True

    def _render_title_lines(self, doc: Document, config: dict) -> None:
        title_cfg = config.get("title_lines")
        lines = []
        if isinstance(title_cfg, list) and title_cfg:
            for item in title_cfg:
                if isinstance(item, dict):
                    text = item.get("text", "")
                    style = item.get("style") or {
                        "bold": item.get("bold", True),
                        "font_size_pt": item.get("font_size_pt")
                        or item.get("font_size", 14),
                    }
                    if text:
                        lines.append({"text": text, "style": style})
                elif str(item).strip():
                    lines.append(
                        {
                            "text": str(item),
                            "style": {"bold": True, "font_size_pt": 14},
                        }
                    )
        elif config.get("title"):
            lines.append(
                {"text": config["title"], "style": {"bold": True, "font_size_pt": 14}}
            )

        if not lines:
            lines = [
                {"text": t, "style": {"bold": b, "font_size_pt": s}}
                for t, b, s in DEFAULT_TITLE_LINES
            ]

        for item in lines:
            text = item.get("text", "")
            if not text.strip():
                continue
            p = doc.add_paragraph()
            p.add_run(text)
            default_style = {
                "font_name": "Times New Roman",
                "font_size_pt": 14,
                "bold": True,
                "alignment": "CENTER",
                "space_before_pt": 0,
                "space_after_pt": 4,
            }
            self._apply_line_style(p, item.get("style"), default_style)

    def _render_date_line(self, doc: Document, config: dict, syllabus=None) -> None:
        date_text = "Thành phố Hồ Chí Minh, ngày ... tháng ... năm 202..."
        if syllabus and getattr(syllabus, "approved_date", None):
            d = syllabus.approved_date
            date_text = f"Thành phố Hồ Chí Minh, ngày {d.day:02d}  tháng  {d.month:02d}   năm {d.year}"
        date_cfg = config.get("date_line") or config.get("date_location")
        style = {}
        if isinstance(date_cfg, dict):
            date_text = date_cfg.get("text") or date_text
            style = date_cfg.get("style") or {}
        elif isinstance(date_cfg, str) and date_cfg:
            date_text = date_cfg

        p = doc.add_paragraph()
        p.add_run(date_text)
        default_style = {
            "font_name": "Times New Roman",
            "font_size_pt": 13,
            "italic": True,
            "alignment": "RIGHT",
            "space_before_pt": 24,
            "space_after_pt": 6,
        }
        self._apply_line_style(p, style, default_style)

    def _render_signature_table(self, doc: Document, config: dict, syllabus=None) -> None:
        sig_cfg = config.get("signature_table", {})
        columns = (
            sig_cfg.get("columns", []) if isinstance(sig_cfg, dict) else []
        )
        col_count = max(2, len(columns))

        tbl = doc.add_table(rows=1, cols=col_count)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        col_width = Inches(6.5 / col_count)
        cells = tbl.rows[0].cells

        for i in range(col_count):
            cells[i].width = col_width
            col_data = columns[i] if i < len(columns) else {}
            cell_info = self._get_signature_cell_info(i, col_data, syllabus)
            self._populate_sig_cell(cells[i], col_data, **cell_info)

    @staticmethod
    def _get_user_display_name(user) -> str:
        if not user:
            return ""
        last = (getattr(user, "last_name", "") or "").strip()
        first = (getattr(user, "first_name", "") or "").strip()
        full = f"{last} {first}".strip()
        return full or (getattr(user, "username", "") or "").strip()

    def _get_signature_cell_info(self, index: int, col_data: dict, syllabus) -> dict:
        if index == 0:
            return self._get_faculty_leader_sig_info(col_data, syllabus)
        return self._get_lecturer_sig_info(col_data, syllabus)

    def _get_faculty_leader_sig_info(self, col_data: dict, syllabus) -> dict:
        fac_name = getattr(syllabus.faculty, "name", "Công nghệ Thông tin") if syllabus and syllabus.faculty else "Công nghệ Thông tin"
        clean_fac = fac_name[5:].strip() if fac_name.lower().startswith("khoa ") else fac_name.strip()

        leader = self._resolve_faculty_leader(syllabus)
        role = getattr(leader, "faculty_role", "dean")
        if role == "dean":
            def_t1, def_t2 = f"TRƯỞNG KHOA {clean_fac.upper()}", "DEAN"
        elif role == "vice_dean":
            def_t1, def_t2 = f"PHÓ TRƯỞNG KHOA {clean_fac.upper()}", "DEPUTY DEAN"
        elif role == "head_of_dept":
            def_t1, def_t2 = "TRƯỞNG BỘ MÔN", "HEAD OF DEPARTMENT"
        else:
            def_t1, def_t2 = f"PHỤ TRÁCH KHOA {clean_fac.upper()}", "DEPUTY DEAN"

        user = getattr(leader, "user", None) or getattr(syllabus, "approved_by", None)
        user_name = self._get_user_display_name(user)
        def_name = user_name if user_name else "TS. Trương Hoàng Vinh"
        sig_img_path = self._get_sig_img_path(leader, check_approved=True, syllabus=syllabus)

        return {
            "def_t1": def_t1,
            "def_t2": def_t2,
            "def_sub": "(Ký và ghi rõ họ tên-Signed with fullname)",
            "def_name": def_name,
            "sig_img_path": sig_img_path,
            "has_syllabus": bool(syllabus),
        }

    def _get_lecturer_sig_info(self, col_data: dict, syllabus) -> dict:
        lecturer = getattr(syllabus, "lecturer", None) if syllabus else None
        user = getattr(lecturer, "user", None) if lecturer else None
        user_name = self._get_user_display_name(user)
        def_name = user_name if user_name else "ThS. Dương Hữu Thành"
        sig_img_path = self._get_sig_img_path(lecturer, check_approved=False, syllabus=syllabus)

        return {
            "def_t1": "GIẢNG VIÊN BIÊN SOẠN",
            "def_t2": "ACADEMIC",
            "def_sub": "(Ký và ghi rõ họ tên-Signed with fullname)",
            "def_name": def_name,
            "sig_img_path": sig_img_path,
            "has_syllabus": bool(syllabus),
        }

    def _resolve_faculty_leader(self, syllabus):
        if not syllabus:
            return None
        if syllabus.approved_by and hasattr(syllabus.approved_by, "lecturer_profile"):
            return syllabus.approved_by.lecturer_profile
        if not syllabus.faculty:
            return None
        from syllabuses.models import Lecturer
        return Lecturer.objects.filter(
            faculty=syllabus.faculty,
            faculty_role__in=["dean", "vice_dean"]
        ).first()

    def _get_sig_img_path(self, lecturer, check_approved: bool, syllabus=None) -> str | None:
        if check_approved and syllabus and not syllabus.is_approved:
            return None
        if not lecturer or not getattr(lecturer, "signature_image", None):
            return None
        try:
            p = lecturer.signature_image.path
            return p if os.path.exists(p) else None
        except Exception:
            return None

    def _populate_sig_cell(
        self,
        cell,
        col_data: dict,
        def_t1: str,
        def_t2: str,
        def_sub: str,
        def_name: str,
        sig_img_path: str | None = None,
        has_syllabus: bool = False,
    ) -> None:
        dashed_border = (
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="dashed" w:sz="4" w:space="0" w:color="AAAAAA"/>'
            f'<w:left w:val="dashed" w:sz="4" w:space="0" w:color="AAAAAA"/>'
            f'<w:bottom w:val="dashed" w:sz="4" w:space="0" w:color="AAAAAA"/>'
            f'<w:right w:val="dashed" w:sz="4" w:space="0" w:color="AAAAAA"/>'
            f"</w:tcBorders>"
        )
        tc_pr = cell._tc.get_or_add_tcPr()
        tc_pr.append(parse_xml(dashed_border))

        (t1, s1), (t2, s2) = self._extract_titles_with_styles(
            col_data, def_t1, def_t2, override_text=has_syllabus
        )
        subtitle = col_data.get("subtitle") or def_sub
        sub_style = col_data.get("subtitle_style") or {}
        name = def_name if has_syllabus else (col_data.get("name") or def_name)
        name_style = col_data.get("name_style") or {}

        p1 = cell.paragraphs[0]
        p1.add_run(f"{t1}\n{t2}" if not s2 else t1)
        self._apply_line_style(
            p1, s1, {"alignment": "CENTER", "bold": True, "font_size_pt": 12}
        )

        if s2 and t2:
            p2 = cell.add_paragraph()
            p2.add_run(t2)
            self._apply_line_style(
                p2,
                s2,
                {"alignment": "CENTER", "bold": True, "font_size_pt": 11},
            )

        p_sub = cell.add_paragraph()
        p_sub.add_run(subtitle)
        self._apply_line_style(
            p_sub,
            sub_style,
            {"alignment": "CENTER", "italic": True, "font_size_pt": 11},
        )

        if sig_img_path:
            p_img = cell.add_paragraph()
            p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.add_run().add_picture(sig_img_path, height=Pt(40))
        else:
            for _ in range(4):
                cell.add_paragraph()

        p_name = cell.add_paragraph()
        p_name.add_run(name)
        self._apply_line_style(
            p_name,
            name_style,
            {"alignment": "CENTER", "bold": True, "font_size_pt": 12},
        )

    def _extract_titles_with_styles(
        self, col_data: dict, def1: str, def2: str, override_text: bool = False
    ) -> tuple[tuple[str, dict], tuple[str, dict]]:
        title_lines = col_data.get("title_lines", [])
        t1, s1 = def1, {}
        t2, s2 = def2, {}
        if len(title_lines) > 0:
            item = title_lines[0]
            cfg_text = item.get("text", def1) if isinstance(item, dict) else str(item)
            t1 = def1 if (override_text and def1) else cfg_text
            s1 = item.get("style", {}) if isinstance(item, dict) else {}
        if len(title_lines) > 1:
            item = title_lines[1]
            cfg_text = item.get("text", def2) if isinstance(item, dict) else str(item)
            t2 = def2 if (override_text and def2) else cfg_text
            s2 = item.get("style", {}) if isinstance(item, dict) else {}
        return (t1, s1), (t2, s2)

    def _extract_titles(
        self, col_data: dict, def1: str, def2: str
    ) -> tuple[str, str]:
        (t1, _), (t2, _) = self._extract_titles_with_styles(
            col_data, def1, def2
        )
        return t1, t2
