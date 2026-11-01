"""
handlers/block_style_validator.py

Kiểm định và cung cấp schema mặc định cho cấu hình Block-based Template Styler (block_layout).
Hỗ trợ kiểm tra Named Styles, Căn lề dòng tiêu đề, Định dạng khối (Table vs Text) và Kiểu ký hiệu (Symbol Style).
Tuân thủ Clean Code: Guard Clauses, Early Return, hàm ngắn <= 30 dòng.
"""

from typing import Optional

LEGACY_REQUIRED_STYLE_KEYS = {
    "SYLLABUS_MAIN_HEADING",
    "SYLLABUS_SUB_HEADING",
    "SYLLABUS_LIST_ITEM",
    "SYLLABUS_BODY",
    "SYLLABUS_SECTION_LABEL",
    "SYLLABUS_TABLE_HEADER",
    "SYLLABUS_TABLE_BODY",
}

HEADER_LINE_STYLE_KEYS = {
    "SYLLABUS_HEADER_LINE_1",
    "SYLLABUS_HEADER_LINE_2",
    "SYLLABUS_TITLE",
}

VALID_ALIGNMENTS = {"LEFT", "CENTER", "RIGHT", "JUSTIFY"}
VALID_DISPLAY_TYPES = {"TABLE", "TEXT"}
VALID_SYMBOL_STYLES = {"CHECKBOX", "RADIO"}

def get_default_block_layout() -> dict:
    """Trả về block_layout mặc định theo schema V2.1 chuẩn."""
    return {
        "schema_version": "2.1",
        "named_styles": {
            "SYLLABUS_HEADER_LINE_1": {
                "word_style_id": "HeaderLine1",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": True,
                "italic": False,
                "alignment": "CENTER",
            },
            "SYLLABUS_HEADER_LINE_2": {
                "word_style_id": "HeaderLine2",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": True,
                "italic": False,
                "alignment": "CENTER",
            },
            "SYLLABUS_TITLE": {
                "word_style_id": "Title",
                "font_name": "Times New Roman",
                "font_size_pt": 16,
                "bold": True,
                "italic": False,
                "alignment": "CENTER",
            },
            "SYLLABUS_MAIN_HEADING": {
                "word_style_id": "Heading2",
                "font_name": "Times New Roman",
                "font_size_pt": 14,
                "bold": True,
                "italic": False,
                "alignment": "CENTER",
                "space_before_pt": 6,
                "space_after_pt": 6,
            },
            "SYLLABUS_SUB_HEADING": {
                "word_style_id": "01",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": True,
                "italic": False,
                "alignment": "JUSTIFY",
            },
            "SYLLABUS_LIST_ITEM": {
                "word_style_id": "0text1",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": False,
                "italic": False,
                "alignment": "JUSTIFY",
                "line_spacing": 2.0,
            },
            "SYLLABUS_BODY": {
                "word_style_id": "Normal",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": False,
                "italic": False,
                "alignment": "JUSTIFY",
            },
            "SYLLABUS_SECTION_LABEL": {
                "word_style_id": "0bang",
                "font_name": "Times New Roman",
                "font_size_pt": 13,
                "bold": True,
                "italic": False,
                "alignment": "LEFT",
            },
            "SYLLABUS_TABLE_HEADER": {
                "word_style_id": "TableParagraph",
                "font_name": "Times New Roman",
                "font_size_pt": 11,
                "bold": True,
                "alignment": "CENTER",
            },
            "SYLLABUS_TABLE_BODY": {
                "word_style_id": "TableParagraph",
                "font_name": "Times New Roman",
                "font_size_pt": 11,
                "bold": False,
                "alignment": "LEFT",
            },
        },
        "table_structures": {
            "SYLLABUS_TABLE_HEADER": {
                "font_name": "Times New Roman",
                "font_size_pt": 12,
                "bold": True,
                "alignment": "CENTER",
                "cell_fill_hex": "D9D9D9",
                "border_color": "000000",
            },
            "SYLLABUS_TABLE_BODY": {
                "font_name": "Times New Roman",
                "font_size_pt": 12,
                "bold": False,
                "alignment": "LEFT",
                "cell_fill_hex": None,
                "border_color": "000000",
            },
        },
        "section_display_types": {
            "ADMINISTRATION_OF_COURSE": "TABLE",
            "CREDITS": "TABLE",
        },
        "symbol_style": "CHECKBOX",
    }

def _validate_named_styles(named_styles: dict) -> Optional[str]:
    """Kiểm tra từng style config trong named_styles."""
    if not isinstance(named_styles, dict):
        return "block_layout.named_styles phải là JSON object."

    for key, config in named_styles.items():
        if not isinstance(config, dict):
            return f"named_styles.{key} phải là JSON object."
        if not config.get("word_style_id"):
            return f"named_styles.{key}.word_style_id là bắt buộc."
        alignment = config.get("alignment")
        if alignment and alignment.upper() not in VALID_ALIGNMENTS:
            return f"named_styles.{key}.alignment không hợp lệ: {alignment}"

    return None

def _validate_section_display_types(display_types: dict) -> Optional[str]:
    """Kiểm tra tính hợp lệ của section_display_types (TABLE hoặc TEXT)."""
    if not isinstance(display_types, dict):
        return "block_layout.section_display_types phải là JSON object."

    for sec_key, disp_type in display_types.items():
        if str(disp_type).upper() not in VALID_DISPLAY_TYPES:
            return f"section_display_types.{sec_key} chỉ nhận 'TABLE' hoặc 'TEXT'."

    return None

def _validate_symbol_style(symbol_style: str) -> Optional[str]:
    """Kiểm tra tính hợp lệ của symbol_style (CHECKBOX hoặc RADIO)."""
    if str(symbol_style).upper() not in VALID_SYMBOL_STYLES:
        return "symbol_style chỉ nhận 'CHECKBOX' hoặc 'RADIO'."
    return None

def validate_block_layout(block_layout) -> Optional[str]:
    """
    Validate toàn diện block_layout trước khi lưu hoặc publish.
    Sử dụng Guard Clauses, trả về chuỗi thông báo lỗi nếu không hợp lệ, None nếu đạt.
    """
    if not isinstance(block_layout, dict):
        return "block_layout phải là JSON object."

    named_styles = block_layout.get("named_styles")
    style_err = _validate_named_styles(named_styles)
    if style_err:
        return style_err

    has_legacy = LEGACY_REQUIRED_STYLE_KEYS.issubset(set(named_styles.keys()))
    has_headers = HEADER_LINE_STYLE_KEYS.issubset(set(named_styles.keys()))
    if not has_legacy and not has_headers:
        missing = sorted(LEGACY_REQUIRED_STYLE_KEYS - set(named_styles.keys()))
        return f"Thiếu các style key bắt buộc: {', '.join(missing)}"

    disp_types = block_layout.get("section_display_types")
    if disp_types is not None:
        disp_err = _validate_section_display_types(disp_types)
        if disp_err:
            return disp_err

    symbol_style = block_layout.get("symbol_style")
    if symbol_style is not None:
        sym_err = _validate_symbol_style(symbol_style)
        if sym_err:
            return sym_err

    return None
