"""
handlers/docx_cleaner.py

DocxCleanerService — Chiến lược A: Làm sạch Direct Formatting khỏi file DOCX mẫu.

Mục đích:
    Khi Specialist upload file DOCX mẫu (template_master_final.docx),
    service này loại bỏ các Direct Formatting thẩm mỹ thuần túy (font size,
    language tag, line spacing, alignment) ra khỏi document.xml.

    Sau khi clean, file DOCX sẽ phụ thuộc hoàn toàn vào Named Styles trong
    styles.xml — cho phép BlockStyleDocxRenderer thay đổi style một lần và
    áp dụng toàn bộ tài liệu.

WHITELIST — Tuyệt đối KHÔNG strip (có ý nghĩa nghiệp vụ hoặc cấu trúc):
    w:b          → In đậm có chủ đích (inline emphasis)
    w:i          → In nghiêng có chủ đích
    w:color      → Màu chữ (mã hóa nhóm PLO: 00B0F0, 0066FF, FF0000...)
    w:highlight  → Highlight (nếu có)
    w:u          → Gạch chân
    w:strike     → Gạch ngang
    w:numPr      → Numbering (cấu trúc danh sách I, II, a, b...)
    w:ind        → Indentation (thụt lề cho list levels)
    w:gridSpan   → H-Merge (gộp ô ngang)
    w:vMerge     → V-Merge (gộp ô dọc)
    w:tcPr       → Table cell properties (width, border)
    w:tblPr      → Table properties (alignment, width)
    w:trPr       → Table row properties (height)

CHỈ STRIP (thẩm mỹ thuần túy, thay bằng Named Style):
    rPr:
        w:sz     → Font size (sẽ do Named Style quyết định)
        w:szCs   → Font size complex script
        w:lang   → Language tag thừa (nl-NL, vi-VN artifacts)
    pPr:
        w:spacing → Line spacing (sẽ do Named Style quyết định)
        w:jc      → Text alignment (sẽ do Named Style quyết định)
"""

import io
import zipfile
from dataclasses import dataclass

from lxml import etree

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def _wtag(name: str) -> str:
    """Tạo qualified tag name theo namespace Word."""
    return f'{{{W_NS}}}{name}'

_STRIP_FROM_RPR: frozenset = frozenset([
    _wtag('sz'),
    _wtag('szCs'),
    _wtag('lang'),
])

_STRIP_FROM_PPR: frozenset = frozenset([
    _wtag('spacing'),
    _wtag('jc'),
])

@dataclass
class CleanReport:
    """Báo cáo chi tiết sau khi làm sạch một file DOCX."""
    sz_stripped: int = 0
    sz_cs_stripped: int = 0
    lang_stripped: int = 0
    spacing_stripped: int = 0
    jc_stripped: int = 0
    empty_rpr_removed: int = 0

    @property
    def total_stripped(self) -> int:
        return (
            self.sz_stripped + self.sz_cs_stripped + self.lang_stripped
            + self.spacing_stripped + self.jc_stripped
        )

    def summary(self) -> str:
        return (
            f"Tổng số thuộc tính đã xóa: {self.total_stripped} | "
            f"sz={self.sz_stripped}, szCs={self.sz_cs_stripped}, "
            f"lang={self.lang_stripped}, spacing={self.spacing_stripped}, "
            f"jc={self.jc_stripped}, empty_rPr_removed={self.empty_rpr_removed}"
        )

class DocxCleanerService:
    """
    Service làm sạch Direct Formatting khỏi file DOCX mẫu.

    Chỉ xóa các thuộc tính thẩm mỹ thuần túy được định nghĩa trong
    _STRIP_FROM_RPR và _STRIP_FROM_PPR.

    Sử dụng:
        output_buffer, report = DocxCleanerService.clean(raw_file_bytes)
        print(report.summary())
    """

    @classmethod
    def clean(cls, file_bytes: bytes) -> tuple:
        """
        Nhận bytes của file DOCX, trả về DOCX đã làm sạch và báo cáo.

        Args:
            file_bytes: Nội dung file DOCX dạng bytes.

        Returns:
            (BytesIO, CleanReport): File DOCX đã clean và báo cáo chi tiết.

        Raises:
            ValueError: Nếu file không phải DOCX hợp lệ.
            zipfile.BadZipFile: Nếu file bị hỏng.
        """
        file_map = cls._read_zip_contents(file_bytes)
        cls._validate_docx_structure(file_map)

        report = CleanReport()
        file_map['word/document.xml'] = cls._clean_document_xml(
            file_map['word/document.xml'], report
        )

        return cls._write_zip_contents(file_map), report

    @staticmethod
    def _read_zip_contents(file_bytes: bytes) -> dict:
        """Đọc toàn bộ nội dung DOCX (ZIP) vào dictionary."""
        buffer = io.BytesIO(file_bytes)
        with zipfile.ZipFile(buffer, 'r') as z:
            return {name: z.read(name) for name in z.namelist()}

    @staticmethod
    def _validate_docx_structure(file_map: dict) -> None:
        """Kiểm tra file có cấu trúc DOCX hợp lệ không."""
        if 'word/document.xml' not in file_map:
            raise ValueError(
                "File không hợp lệ: Không tìm thấy word/document.xml"
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

    @classmethod
    def _clean_document_xml(cls, xml_bytes: bytes, report: CleanReport) -> bytes:
        """Parse XML, strip direct formatting, serialize lại."""
        root = etree.fromstring(xml_bytes)
        cls._process_all_paragraph_props(root, report)
        cls._process_all_run_props(root, report)
        return etree.tostring(
            root,
            xml_declaration=True,
            encoding='UTF-8',
            standalone=True
        )

    @classmethod
    def _process_all_paragraph_props(cls, root, report: CleanReport) -> None:
        """Duyệt tất cả w:pPr trong document và strip các tag thẩm mỹ."""
        for pPr in root.iter(_wtag('pPr')):
            cls._strip_pPr_elements(pPr, report)

    @classmethod
    def _strip_pPr_elements(cls, pPr, report: CleanReport) -> None:
        """Strip các tag thẩm mỹ khỏi một w:pPr cụ thể."""
        for qualified_tag in _STRIP_FROM_PPR:
            el = pPr.find(qualified_tag)
            if el is None:
                continue
            pPr.remove(el)
            _increment_ppr_counter(report, qualified_tag)

    @classmethod
    def _process_all_run_props(cls, root, report: CleanReport) -> None:
        """Duyệt tất cả w:rPr, strip các tag thẩm mỹ, dọn rPr rỗng."""
        all_rpr = list(root.iter(_wtag('rPr')))
        for rPr in all_rpr:
            cls._strip_rPr_elements(rPr, report)
            cls._remove_if_empty(rPr, report)

    @classmethod
    def _strip_rPr_elements(cls, rPr, report: CleanReport) -> None:
        """Strip các tag thẩm mỹ khỏi một w:rPr cụ thể."""
        for qualified_tag in _STRIP_FROM_RPR:
            el = rPr.find(qualified_tag)
            if el is None:
                continue
            rPr.remove(el)
            _increment_rpr_counter(report, qualified_tag)

    @staticmethod
    def _remove_if_empty(rPr, report: CleanReport) -> None:
        """Xóa w:rPr nếu rỗng hoàn toàn sau khi strip."""
        if len(rPr) > 0:
            return
        parent = rPr.getparent()
        if parent is None:
            return
        parent.remove(rPr)
        report.empty_rpr_removed += 1

def _increment_ppr_counter(report: CleanReport, tag: str) -> None:
    """Cập nhật counter pPr tương ứng trong report."""
    if tag == _wtag('spacing'):
        report.spacing_stripped += 1
    elif tag == _wtag('jc'):
        report.jc_stripped += 1

def _increment_rpr_counter(report: CleanReport, tag: str) -> None:
    """Cập nhật counter rPr tương ứng trong report."""
    if tag == _wtag('sz'):
        report.sz_stripped += 1
    elif tag == _wtag('szCs'):
        report.sz_cs_stripped += 1
    elif tag == _wtag('lang'):
        report.lang_stripped += 1
