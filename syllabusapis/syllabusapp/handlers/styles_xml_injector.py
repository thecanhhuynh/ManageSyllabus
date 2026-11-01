"""
handlers/styles_xml_injector.py

StylesXmlInjector — Inject Named Style configurations vào word/styles.xml.

Đây là Bước 2 trong pipeline BlockStyleDocxRenderer (V2):
  Input:  DOCX bytes (đã qua DocxCleanerService)
          + block_layout dict từ DB (schema V2)
  Output: BytesIO của DOCX với word/styles.xml đã được cập nhật

Nguyên lý:
  Thay vì ghi đè Direct Formatting trong document.xml,
  module này chỉ chỉnh sửa ĐỊNH NGHĨA STYLE trong word/styles.xml.
  Khi render, tất cả đoạn văn dùng style đó sẽ tự động nhận
  font/size/alignment mới — không cần đụng đến document.xml.

Lưu ý về styleId:
  File template_master_final.docx dùng string styleId (e.g. "ListParagraph",
  "Normal", "Heading1") theo chuẩn ODF/OOXML. Module này lookup theo
  `word_style_id` (string) trong block_layout, khớp trực tiếp với
  thuộc tính w:styleId trong styles.xml.

  Bảng mapping thực tế (từ phân tích file):
    SYLLABUS_MAIN_HEADING  → word_style_id = "Heading2"        (sz=16, bold, center)
    SYLLABUS_SUB_HEADING   → word_style_id = "01"              (sz=13, bold, justify)
    SYLLABUS_LIST_ITEM     → word_style_id = "0text1"          (sz=13, normal, justify)
    SYLLABUS_BODY          → word_style_id = "Normal"          (sz=12, normal)
    SYLLABUS_SECTION_LABEL → word_style_id = "0bang"           (sz=13, bold)
    SYLLABUS_TABLE_HEADER  → word_style_id = "TableParagraph"  (sz=11, handled by Strategy B)
    SYLLABUS_TABLE_BODY    → word_style_id = "TableParagraph"  (sz=11, handled by Strategy B)
"""

import io
import zipfile

from lxml import etree

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

ALIGNMENT_MAP: dict = {
    'LEFT':    'left',
    'CENTER':  'center',
    'RIGHT':   'right',
    'JUSTIFY': 'both',
}

def _wtag(name: str) -> str:
    """Tạo qualified tag name theo namespace Word."""
    return f'{{{W_NS}}}{name}'

class StylesXmlInjector:
    """
    Cập nhật định nghĩa Named Styles trong word/styles.xml của DOCX.

    Chỉ xử lý phần `named_styles` của block_layout.
    Phần `table_structures` được xử lý bởi Strategy B (runtime override
    trong BlockStyleDocxRenderer).

    Sử dụng:
        out_buffer = StylesXmlInjector.inject(docx_bytes, block_layout)
    """

    @classmethod
    def inject(cls, docx_bytes: bytes, block_layout: dict) -> io.BytesIO:
        """
        Inject named_styles config vào styles.xml của DOCX.

        Args:
            docx_bytes:   Bytes của file DOCX (thường đã qua DocxCleanerService).
            block_layout: Dict theo schema block_layout V2.

        Returns:
            BytesIO của DOCX với styles.xml đã cập nhật.

        Raises:
            ValueError:         Nếu DOCX không có word/styles.xml.
            zipfile.BadZipFile: Nếu file bị hỏng.
        """
        named_styles = block_layout.get('named_styles', {})
        if not named_styles:
            return _wrap_bytes(docx_bytes)

        file_map = cls._read_zip_contents(docx_bytes)
        cls._validate_styles_present(file_map)

        styles_root = etree.fromstring(file_map['word/styles.xml'])
        style_id_map = cls._build_style_id_map(styles_root)

        for style_key, style_config in named_styles.items():
            style_el = cls._resolve_style_element(style_config, style_id_map)
            if style_el is None:
                continue
            cls._apply_style_config(style_el, style_config)

        file_map['word/styles.xml'] = etree.tostring(
            styles_root,
            xml_declaration=True,
            encoding='UTF-8',
            standalone=True,
        )
        return cls._write_zip_contents(file_map)

    @staticmethod
    def _read_zip_contents(docx_bytes: bytes) -> dict:
        """Đọc toàn bộ nội dung DOCX (ZIP) vào dictionary."""
        with zipfile.ZipFile(io.BytesIO(docx_bytes), 'r') as z:
            return {name: z.read(name) for name in z.namelist()}

    @staticmethod
    def _validate_styles_present(file_map: dict) -> None:
        """Kiểm tra file có word/styles.xml không."""
        if 'word/styles.xml' not in file_map:
            raise ValueError(
                "File không hợp lệ: Không tìm thấy word/styles.xml"
            )

    @staticmethod
    def _write_zip_contents(file_map: dict) -> io.BytesIO:
        """Ghi dictionary nội dung trở lại thành file ZIP (DOCX)."""
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
            for name, content in file_map.items():
                z.writestr(name, content)
        output.seek(0)
        return output

    @staticmethod
    def _build_style_id_map(styles_root) -> dict:
        """Build dict: styleId (str) → <w:style> element."""
        result = {}
        for style_el in styles_root.findall(_wtag('style')):
            style_id = style_el.get(_wtag('styleId'))
            if style_id:
                result[style_id] = style_el
        return result

    @staticmethod
    def _resolve_style_element(style_config: dict, style_id_map: dict):
        """Tìm <w:style> element từ word_style_id trong config. None nếu không tìm thấy."""
        word_style_id = style_config.get('word_style_id')
        if not word_style_id:
            return None
        return style_id_map.get(str(word_style_id))

    @classmethod
    def _apply_style_config(cls, style_el, style_config: dict) -> None:
        """Áp dụng toàn bộ style_config lên một <w:style> element."""
        pPr = cls._get_or_create_child(style_el, 'pPr')
        rPr = cls._get_or_create_child(style_el, 'rPr')
        cls._apply_pPr_config(pPr, style_config)
        cls._apply_rPr_config(rPr, style_config)

    @staticmethod
    def _get_or_create_child(parent, tag_name: str):
        """Lấy hoặc tạo mới một child element theo tag name."""
        child = parent.find(_wtag(tag_name))
        if child is not None:
            return child
        return etree.SubElement(parent, _wtag(tag_name))

    @classmethod
    def _apply_pPr_config(cls, pPr, style_config: dict) -> None:
        """Cập nhật <w:pPr>: alignment và line/paragraph spacing."""
        alignment = style_config.get('alignment')
        if alignment:
            cls._set_alignment(pPr, alignment)

        has_spacing = any(
            style_config.get(k) is not None
            for k in ('space_before_pt', 'space_after_pt', 'line_spacing')
        )
        if has_spacing:
            cls._set_spacing(
                pPr,
                style_config.get('space_before_pt'),
                style_config.get('space_after_pt'),
                style_config.get('line_spacing'),
            )

    @classmethod
    def _apply_rPr_config(cls, rPr, style_config: dict) -> None:
        """Cập nhật <w:rPr>: font, size, bold, italic."""
        font_name = style_config.get('font_name')
        font_size_pt = style_config.get('font_size_pt')

        if font_name:
            cls._set_font(rPr, font_name)
        if font_size_pt is not None:
            cls._set_font_size(rPr, float(font_size_pt))

        cls._set_boolean_element(rPr, 'b', style_config.get('bold', False))
        cls._set_boolean_element(rPr, 'i', style_config.get('italic', False))

    @staticmethod
    def _set_alignment(pPr, alignment: str) -> None:
        """Set hoặc replace <w:jc> trong pPr."""
        jc = pPr.find(_wtag('jc'))
        if jc is not None:
            pPr.remove(jc)
        word_val = ALIGNMENT_MAP.get(alignment.upper(), 'left')
        new_jc = etree.SubElement(pPr, _wtag('jc'))
        new_jc.set(_wtag('val'), word_val)

    @staticmethod
    def _set_spacing(pPr, before_pt, after_pt, line_spacing) -> None:
        """
        Set hoặc replace <w:spacing> trong pPr.
        Đơn vị đầu vào: pt → chuyển sang twips (1pt = 20 twips).
        line_spacing: hệ số (2.0 = double) → line = hệ_số * 240 lineRule=auto.
        """
        spacing = pPr.find(_wtag('spacing'))
        if spacing is not None:
            pPr.remove(spacing)
        new_spacing = etree.SubElement(pPr, _wtag('spacing'))
        if before_pt is not None:
            new_spacing.set(_wtag('before'), str(int(before_pt * 20)))
        if after_pt is not None:
            new_spacing.set(_wtag('after'), str(int(after_pt * 20)))
        if line_spacing is not None:
            new_spacing.set(_wtag('line'), str(int(line_spacing * 240)))
            new_spacing.set(_wtag('lineRule'), 'auto')

    @staticmethod
    def _set_font(rPr, font_name: str) -> None:
        """Set hoặc replace <w:rFonts> trong rPr (ascii, hAnsi, cs)."""
        rFonts = rPr.find(_wtag('rFonts'))
        if rFonts is not None:
            rPr.remove(rFonts)
        new_rFonts = etree.SubElement(rPr, _wtag('rFonts'))
        new_rFonts.set(_wtag('ascii'), font_name)
        new_rFonts.set(_wtag('hAnsi'), font_name)
        new_rFonts.set(_wtag('cs'), font_name)

    @staticmethod
    def _set_font_size(rPr, font_size_pt: float) -> None:
        """
        Set hoặc replace <w:sz> và <w:szCs> trong rPr.
        Đơn vị: pt → half-points (1pt = 2 half-points).
        Ví dụ: 13pt → val="26".
        """
        for tag_name in ('sz', 'szCs'):
            el = rPr.find(_wtag(tag_name))
            if el is not None:
                rPr.remove(el)
        half_points = str(int(font_size_pt * 2))
        sz = etree.SubElement(rPr, _wtag('sz'))
        sz.set(_wtag('val'), half_points)
        szCs = etree.SubElement(rPr, _wtag('szCs'))
        szCs.set(_wtag('val'), half_points)

    @staticmethod
    def _set_boolean_element(rPr, tag_name: str, enabled: bool) -> None:
        """
        Thêm hoặc xóa một element boolean (w:b, w:i).
        Nếu enabled=True → thêm tag nếu chưa có.
        Nếu enabled=False → xóa tag nếu đang có.
        """
        existing = rPr.find(_wtag(tag_name))
        if existing is not None:
            rPr.remove(existing)
        if not enabled:
            return
        etree.SubElement(rPr, _wtag(tag_name))

def _wrap_bytes(raw: bytes) -> io.BytesIO:
    """Bọc bytes vào BytesIO và seek về đầu."""
    buf = io.BytesIO(raw)
    buf.seek(0)
    return buf
