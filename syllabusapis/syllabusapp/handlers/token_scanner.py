import re
from docx import Document


def scan_tokens(docx_path):
    """
    Quét toàn bộ file docx để tìm các thẻ [[TAG]] đã sử dụng.
    Trả về một tuple: (set_các_scalar_tags, set_các_bảng_chứa_row)
    """
    doc = Document(docx_path)
    used_scalars = set()
    used_table_keys = set()

    # Regex tìm [[SUBJECT_CODE]]
    scalar_pattern = re.compile(r'\[\[\s*([A-Z_][A-Z0-9_]*)\s*\]\]')
    # Regex tìm [[ROW.week]]
    row_pattern = re.compile(r'\[\[\s*ROW\.(\w+)\s*\]\]')

    def extract_from_text(text):
        if not text: return
        for m in scalar_pattern.findall(text):
            used_scalars.add(m)
        for m in row_pattern.findall(text):
            used_table_keys.add(m)

    # 1. Quét trong các đoạn văn bản (Paragraphs)
    for para in doc.paragraphs:
        extract_from_text(para.text)

    # 2. Quét sâu vào trong các ô của Bảng (Tables)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    extract_from_text(para.text)

    return list(used_scalars), list(used_table_keys)