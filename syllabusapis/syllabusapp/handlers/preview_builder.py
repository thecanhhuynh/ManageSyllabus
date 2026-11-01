import copy
from docx import Document
from lxml import etree

from handlers.docx_renderer.block_processor import BlockProcessor
from handlers.docx_renderer.facade import ShellDocxRenderer
from handlers.docx_renderer.xml_helpers import W_NS
from syllabuses.models import Syllabus, TemplateBlock

DEFAULT_PREVIEW_CONTEXT = {
    "english_title": "Data Structures and Algorithms",
    "subject_name_vi": "Cấu trúc dữ liệu và giải thuật",
    "subject_code": "IT201",
    "teaching_methods": "Trực tiếp kết hợp trực tuyến",
    "language": "Tiếng Việt / Vietnamese",
    "knowledge_components": "Kiến thức cơ sở ngành",
    "course_detail": "Môn học cung cấp kiến thức nền tảng về tổ chức dữ liệu, thuật toán sắp xếp, tìm kiếm và phân tích độ phức tạp thời gian/không gian.",
    "credit": {
        "credit_total": 3,
        "number_theory": 2,
        "number_practice": 1,
        "hour_self_study": 60,
    },
    "lecturer_info": {
        "faculty": "Khoa Công nghệ thông tin",
        "last_name": "Nguyễn Văn",
        "first_name": "Nam",
        "email": "nam.nv@ou.edu.vn",
        "room": "Phòng 501, Cơ sở 1",
    },
    "requirement_subject": [
        {"stt": 1, "name": "Nhập môn lập trình", "code": "IT101", "type": "Tiên quyết"},
        {"stt": 2, "name": "Toán rời rạc", "code": "MATH102", "type": "Học trước"},
    ],
    "objective_outcomes": [
        {"objective": "CO1", "content": "Hiểu và áp dụng các cấu trúc dữ liệu tuyến tính và phi tuyến tính", "plo": "PLO1, PLO2"},
        {"objective": "CO2", "content": "Thiết kế và đánh giá độ phức tạp thuật toán hiệu quả", "plo": "PLO3"},
    ],
    "course_learning_outcomes": [
        {"co": "CO1", "clo": "CLO1.1", "content": "Cài đặt thành thạo danh sách liên kết, ngăn xếp, hàng đợi"},
        {"co": "CO1", "clo": "CLO1.2", "content": "Ứng dụng cây nhị phân tìm kiếm và bảng băm vào bài toán thực tế"},
        {"co": "CO2", "clo": "CLO2.1", "content": "Phân tích độ phức tạp thời gian Big-O của các thuật toán sắp xếp"},
    ],
    "learning_material": [
        {
            "name": "Giáo trình Cấu trúc dữ liệu & Giải thuật - ĐH Mở TP.HCM (2023)",
            "type_material": {"name": "Giáo trình"},
        },
        {
            "name": "Introduction to Algorithms, 4th Edition - Cormen et al. (2022)",
            "type_material": {"name": "Tài liệu tham khảo"},
        },
    ],
    "assessment_method": [
        {
            "type_assessment": {"id": 1, "name": "Đánh giá quá trình/Formative assessment"},
            "assessment_methods": [
                {
                    "name": "A.1.1",
                    "time": "",
                    "course_learning_outcomes": [],
                    "weight": None,
                }
            ],
        },
        {
            "type_assessment": {"id": 2, "name": "Đánh giá giữa kỳ/Mid-term assessment"},
            "assessment_methods": [
                {
                    "name": "Bài tập lớn và vấn đáp",
                    "time": "Nhận đề tài tuần thứ 3 môn học và chấm vấn đáp 2 tuần thực hành cuối.",
                    "course_learning_outcomes": [
                        {"id": 3, "position": 3},
                        {"id": 4, "position": 4},
                        {"id": 5, "position": 5},
                        {"id": 6, "position": 6},
                    ],
                    "weight": 40,
                }
            ],
        },
        {
            "type_assessment": {"id": 3, "name": "Đánh giá cuối kỳ/End-of-course assessment"},
            "assessment_methods": [
                {
                    "name": "Thi lý thuyết",
                    "time": "Sau khi kết thúc môn học và theo lịch thi của phòng khảo thí.",
                    "course_learning_outcomes": [
                        {"id": 1, "position": 1},
                        {"id": 2, "position": 2},
                        {"id": 3, "position": 3},
                        {"id": 4, "position": 4},
                    ],
                    "weight": 60,
                }
            ],
        },
    ],
    "teaching_schedule": [
        {
            "session_no": 1,
            "content": "Chương 1. Tổng quan mẫu thiết kế\n1.1. Tổng quan\n1.2. Các loại mẫu thiết kế của GoF\n1.3. Cấu trúc mẫu thiết kế\n1.4. Các nguyên lý thiết kế",
            "course_learning_outcomes": [{"id": 1, "position": 1}, {"id": 2, "position": 2}],
            "self_study_activity": "Xem bài giảng, đúc kết các kiến thức trọng tâm, tìm hiểu các kiến thức liên quan.\n+Trên hệ thống LMS: trả lời các câu hỏi trắc nghiệm lý thuyết, tham gia diễn đàn.",
            "self_study_hours": 11,
            "offline_activity": "Giảng viên:\n+ Giới thiệu đề cương chi tiết.\n+ Thuyết giảng\n+ Đặt câu hỏi, bài tập.\nSinh viên:\n+ Nghe giảng, giải bài tập, ghi chú.",
            "offline_hours": 0,
            "online_activity": "",
            "online_hours": 0,
            "assessments": [{"name": "A2.1"}, {"name": "A3.1"}],
            "learning_materials": [{"name": "1"}, {"name": "2"}],
            "schedule_group": {"name": "Lớp buổi sáng"},
        },
        {
            "session_no": 2,
            "content": "Chương 2. Các mẫu kiến tạo (creational patterns)\n2.1. Tổng quan\n2.2. Mẫu Singleton\n2.3. Mẫu Factory Method\n2.4. Mẫu Abstract Method",
            "course_learning_outcomes": [{"id": 1, "position": 1}, {"id": 2, "position": 2}, {"id": 3, "position": 3}],
            "self_study_activity": "Xem bài giảng, đúc kết các kiến thức trọng tâm.\n+Trên hệ thống LMS: trả lời trắc nghiệm.",
            "self_study_hours": 11,
            "offline_activity": "Giảng viên:\n+ Thuyết giảng\n+ Hướng dẫn demo.\nSinh viên:\n+ Thực hành theo mẫu.",
            "offline_hours": 0,
            "online_activity": "",
            "online_hours": 0,
            "assessments": [{"name": "A2.1"}, {"name": "A3.1"}],
            "learning_materials": [{"name": "1"}, {"name": "2"}],
            "schedule_group": {"name": "Lớp buổi sáng"},
        },
    ],
}


class PreviewBuilder:
    """Build structured JSON preview cho 1 block in-memory."""

    @classmethod
    def build(
        cls,
        block: TemplateBlock,
        style_config: dict | None = None,
        syllabus: Syllabus | None = None,
        custom_columns: list[dict] | None = None,
        object_ids: list[str] | None = None,
        sub_position: int | None = None,
        with_context: bool = False,
        block_config: dict | None = None,
    ) -> dict:
        if not block:
            return {
                "block_code": "",
                "block_name": "",
                "block_type": "text",
                "elements": [],
                "context": {"prev": None, "next": None},
            }

        if sub_position is None and block.template_id:
            sub_position = cls._resolve_sub_position(block)

        temp_block = cls._clone_block_with_style(block, style_config, block_config)
        data_context, sub_sections_map = cls._build_data_context(syllabus)
        block_layout = dict(getattr(temp_block.template, "block_layout", {}) or {})
        if block_config and block_config.get("label_overrides"):
            tbl_code = (temp_block.config or {}).get("table_code") or (temp_block.config or {}).get("code") or temp_block.code.lower()
            overrides = dict(block_layout.get("label_overrides") or {})
            overrides[tbl_code] = block_config.get("label_overrides")
            block_layout["label_overrides"] = overrides

        doc = Document()
        BlockProcessor._render_block(
            doc,
            temp_block,
            data_context,
            block_layout,
            sub_sections_map,
            custom_columns=custom_columns,
            object_ids=object_ids,
            syllabus=syllabus,
            sub_position=sub_position,
        )

        elements = cls._serialize_body(doc._body._element)
        context_data = cls._resolve_context_blocks(block) if with_context else {"prev": None, "next": None}
        return {
            "block_code": temp_block.code,
            "code": (temp_block.config or {}).get("code") or temp_block.code,
            "block_name": temp_block.name,
            "block_type": temp_block.block_type,
            "elements": elements,
            "context": context_data,
        }

    @staticmethod
    def _resolve_context_blocks(block: TemplateBlock) -> dict:
        """Lookup prev/next sub-section trong cùng main_section."""
        if not block or not block.template_id:
            return {"prev": None, "next": None}

        from syllabuses.models import TemplateSubSection
        code = (block.config or {}).get("code") or block.code
        current_sub = TemplateSubSection.objects.filter(
            main_section__template_id=block.template_id,
            code=code,
        ).first()
        if not current_sub:
            current_sub = TemplateSubSection.objects.filter(
                main_section__template_id=block.template_id,
                name=block.name,
            ).first()

        if not current_sub:
            return {"prev": None, "next": None}

        ms = current_sub.main_section
        pos = current_sub.position
        prev_sub = TemplateSubSection.objects.filter(
            main_section=ms,
            position=pos - 1,
        ).first()
        next_sub = TemplateSubSection.objects.filter(
            main_section=ms,
            position=pos + 1,
        ).first()

        return {
            "prev": {"name": prev_sub.name, "position": prev_sub.position} if prev_sub else None,
            "next": {"name": next_sub.name, "position": next_sub.position} if next_sub else None,
        }

    @staticmethod
    def _resolve_sub_position(block: TemplateBlock) -> int | None:
        if not block or not block.template_id:
            return None
        from syllabuses.models import TemplateSubSection
        code = (block.config or {}).get("code") or block.code
        sub = TemplateSubSection.objects.filter(
            main_section__template_id=block.template_id,
            code=code,
        ).first()
        if not sub:
            sub = TemplateSubSection.objects.filter(
                main_section__template_id=block.template_id,
                name=block.name,
            ).first()
        return sub.position if sub else block.position

    @staticmethod
    def _clone_block_with_style(
        block: TemplateBlock,
        style_config: dict | None,
        block_config: dict | None = None,
    ) -> TemplateBlock:
        temp = copy.copy(block)
        if style_config is not None:
            temp.style_config = style_config
        if block_config is not None:
            temp.config = {**(temp.config or {}), **block_config}
        return temp

    @classmethod
    def _build_data_context(cls, syllabus: Syllabus | None) -> tuple[dict, dict]:
        if not syllabus:
            syllabus = Syllabus.objects.first()

        data_ctx = {}
        sub_sections_map = {}
        if syllabus:
            try:
                from handlers.data_mapper import SyllabusDataMapper
                data_ctx = SyllabusDataMapper(syllabus).build()
            except Exception:
                data_ctx = {}
            renderer = ShellDocxRenderer()
            sub_sections_map = renderer._extract_sub_sections(syllabus)

        merged_context = {**copy.deepcopy(DEFAULT_PREVIEW_CONTEXT), **data_ctx}
        return merged_context, sub_sections_map

    @classmethod
    def _serialize_body(cls, body_elem: etree._Element) -> list[dict]:
        elements = []
        for child in body_elem:
            tag = etree.QName(child.tag).localname
            if tag == "p":
                elements.append(cls._serialize_paragraph(child))
            elif tag == "tbl":
                elements.append(cls._serialize_table(child))
        return elements

    @classmethod
    def _serialize_paragraph(cls, p_elem: etree._Element) -> dict:
        pPr = p_elem.find(f"{{{W_NS}}}pPr")
        alignment = cls._extract_alignment(pPr)
        line_spacing, space_before, space_after = cls._extract_spacing(pPr)

        runs = [cls._serialize_run(r) for r in p_elem.findall(f"{{{W_NS}}}r")]
        full_text = "".join(r.get("text", "") for r in runs)
        if "ma trận tích hợp" in full_text.lower():
            alignment = "CENTER"
        return {
            "type": "paragraph",
            "alignment": alignment,
            "line_spacing": line_spacing,
            "space_before_pt": space_before,
            "space_after_pt": space_after,
            "runs": runs,
        }

    @staticmethod
    def _extract_alignment(pPr: etree._Element | None) -> str:
        if pPr is None:
            return "LEFT"
        jc = pPr.find(f"{{{W_NS}}}jc")
        if jc is None:
            return "LEFT"
        val = jc.get(f"{{{W_NS}}}val", "").lower()
        if val in {"both", "justify"}:
            return "JUSTIFY"
        if val == "center":
            return "CENTER"
        if val == "right":
            return "RIGHT"
        return "LEFT"

    @staticmethod
    def _extract_spacing(pPr: etree._Element | None) -> tuple[float, float, float]:
        """Extract spacing từ pPr. Fallback theo Word Normal mặc định (1.0, 0, 0)."""
        if pPr is None:
            return 1.0, 0.0, 0.0
        spacing = pPr.find(f"{{{W_NS}}}spacing")
        if spacing is None:
            return 1.0, 0.0, 0.0

        line_val = spacing.get(f"{{{W_NS}}}line")
        before_val = spacing.get(f"{{{W_NS}}}before")
        after_val = spacing.get(f"{{{W_NS}}}after")

        line = round(int(line_val) / 240, 2) if line_val and line_val.isdigit() else 1.0
        before = round(int(before_val) / 20, 1) if before_val and before_val.isdigit() else 0.0
        after = round(int(after_val) / 20, 1) if after_val and after_val.isdigit() else 0.0
        return line, before, after

    @classmethod
    def _serialize_run(cls, r_elem: etree._Element) -> dict:
        parts = []
        for child in r_elem:
            local = etree.QName(child.tag).localname
            if local == "t":
                parts.append(child.text or "")
            elif local == "br":
                parts.append("\n")
        text = "".join(parts) if parts else "".join(t.text or "" for t in r_elem.findall(f"{{{W_NS}}}t"))
        rPr = r_elem.find(f"{{{W_NS}}}rPr")
        if rPr is None:
            return {
                "text": text, "font_name": None, "font_size_pt": None,
                "bold": False, "italic": False, "underline": False, "color": None,
            }

        font_name = cls._extract_font(rPr)
        sz_el = rPr.find(f"{{{W_NS}}}sz")
        font_size_pt = int(sz_el.get(f"{{{W_NS}}}val")) / 2 if sz_el is not None and sz_el.get(f"{{{W_NS}}}val", "").isdigit() else None

        bold = rPr.find(f"{{{W_NS}}}b") is not None and rPr.find(f"{{{W_NS}}}b").get(f"{{{W_NS}}}val") not in {"0", "false"}
        italic = rPr.find(f"{{{W_NS}}}i") is not None and rPr.find(f"{{{W_NS}}}i").get(f"{{{W_NS}}}val") not in {"0", "false"}
        underline = rPr.find(f"{{{W_NS}}}u") is not None and rPr.find(f"{{{W_NS}}}u").get(f"{{{W_NS}}}val") not in {"none", "0"}

        color_el = rPr.find(f"{{{W_NS}}}color")
        color = None
        if color_el is not None:
            val = color_el.get(f"{{{W_NS}}}val")
            if val and val.lower() != "auto":
                color = f"#{val}"

        return {
            "text": text,
            "font_name": font_name,
            "font_size_pt": font_size_pt,
            "bold": bold,
            "italic": italic,
            "underline": underline,
            "color": color,
        }

    @staticmethod
    def _extract_font(rPr: etree._Element) -> str | None:
        rFonts = rPr.find(f"{{{W_NS}}}rFonts")
        if rFonts is None:
            return None
        return rFonts.get(f"{{{W_NS}}}ascii") or rFonts.get(f"{{{W_NS}}}hAnsi") or rFonts.get(f"{{{W_NS}}}cs")

    @classmethod
    def _serialize_table(cls, tbl_elem: etree._Element) -> dict:
        rows = []
        for idx, tr in enumerate(tbl_elem.findall(f"{{{W_NS}}}tr")):
            is_header = idx == 0 or tr.find(f".//{{{W_NS}}}tblHeader") is not None
            cells = [cls._serialize_cell(tc, is_header) for tc in tr.findall(f"{{{W_NS}}}tc")]
            rows.append({"is_header": is_header, "cells": cells})
        cls._compute_rowspans(rows)
        first_cell_text = rows[0]["cells"][0].get("text", "") if rows and rows[0]["cells"] else ""
        is_legend = "không đáp ứng" in first_cell_text.lower()
        is_matrix = bool(
            rows
            and rows[0]["cells"]
            and "clos" in first_cell_text.strip().lower()
            and any("plo" in c.get("text", "").lower() for c in rows[0]["cells"][1:])
        )
        jc_el = tbl_elem.find(f".//{{{W_NS}}}tblPr/{{{W_NS}}}jc")
        tbl_alignment = "CENTER" if (is_matrix or is_legend) else (jc_el.get(f"{{{W_NS}}}val", "LEFT").upper() if jc_el is not None else "LEFT")
        return {
            "type": "table",
            "rows": rows,
            "borderless": is_legend,
            "is_legend": is_legend,
            "is_matrix": is_matrix,
            "alignment": tbl_alignment,
        }

    @staticmethod
    def _compute_rowspans(rows: list[dict]) -> None:
        if not rows:
            return
        for r in rows:
            col_pos = 0
            for cell in r["cells"]:
                cell["_grid_col"] = col_pos
                col_pos += cell.get("colspan", 1)
        for i, row in enumerate(rows):
            for cell in row["cells"]:
                if cell.get("v_merge_continue"):
                    continue
                start_c = cell["_grid_col"]
                span = 1
                for next_row in rows[i + 1:]:
                    match = next((c for c in next_row["cells"] if c.get("_grid_col") == start_c), None)
                    if not match or not match.get("v_merge_continue"):
                        break
                    span += 1
                cell["rowspan"] = span
        for r in rows:
            for cell in r["cells"]:
                cell.pop("_grid_col", None)

    @classmethod
    def _serialize_cell(cls, tc_elem: etree._Element, is_header: bool) -> dict:
        paragraphs = [cls._serialize_paragraph(p) for p in tc_elem.findall(f"{{{W_NS}}}p")]
        text = "\n".join(
            "".join(r["text"] for r in p["runs"])
            for p in paragraphs
        ).strip()

        first_run = paragraphs[0]["runs"][0] if paragraphs and paragraphs[0]["runs"] else {}
        alignment = paragraphs[0]["alignment"] if paragraphs else "LEFT"

        shd = tc_elem.find(f".//{{{W_NS}}}shd")
        fill = shd.get(f"{{{W_NS}}}fill") if shd is not None else None
        bg_color = f"#{fill}" if fill and fill.lower() not in {"auto", "none", "ffffff"} else None

        nested_tbl = tc_elem.find(f"{{{W_NS}}}tbl")
        nested_table = cls._serialize_table(nested_tbl) if nested_tbl is not None else None

        tcPr = tc_elem.find(f"{{{W_NS}}}tcPr")
        v_merge_continue = False
        colspan = 1
        if tcPr is not None:
            vmerge = tcPr.find(f"{{{W_NS}}}vMerge")
            if vmerge is not None and vmerge.get(f"{{{W_NS}}}val", "continue") != "restart":
                v_merge_continue = True
            grid_span = tcPr.find(f"{{{W_NS}}}gridSpan")
            if grid_span is not None:
                span_val = grid_span.get(f"{{{W_NS}}}val", "")
                if span_val.isdigit():
                    colspan = int(span_val)

        first_para = paragraphs[0] if paragraphs else {}
        return {
            "text": text,
            "paragraphs": paragraphs,
            "bold": first_run.get("bold", is_header),
            "italic": first_run.get("italic", False),
            "alignment": alignment,
            "font_name": first_run.get("font_name"),
            "font_size_pt": first_run.get("font_size_pt"),
            "color": first_run.get("color"),
            "bg_color": bg_color,
            "nested_table": nested_table,
            "rowspan": 1,
            "colspan": colspan,
            "v_merge_continue": v_merge_continue,
            "line_spacing": first_para.get("line_spacing"),
            "space_before_pt": first_para.get("space_before_pt"),
            "space_after_pt": first_para.get("space_after_pt"),
        }
