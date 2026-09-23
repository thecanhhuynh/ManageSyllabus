# handlers/dynamic_discovery.py
from docx import Document
import time


def discover_dynamic_tables(docx_path):
    """
    Quét file word, tự động nhận diện các bảng động.
    Trả về list dict chứa metadata để lưu vào model TemplateField.
    """
    doc = Document(docx_path)
    discovered = []

    for idx, table in enumerate(doc.tables):
        if len(table.rows) > 0:
            # Lấy text của toàn bộ dòng đầu tiên (Header)
            header_text = " ".join(cell.text for cell in table.rows[0].cells)

            # Nếu header không chứa tag, đây là một bảng tĩnh do user vẽ -> Chuyển thành Dynamic Table
            if "[[" not in header_text and "]]" not in header_text:
                schema = []
                for i, cell in enumerate(table.rows[0].cells):
                    label = cell.text.strip().replace("\n", " ")
                    if label:
                        # Sinh key ngẫu nhiên dạng c_12345_0
                        schema.append({"key": f"c_{idx}_{i}", "label": label})

                if schema:
                    # Tạo tag duy nhất cho bảng
                    tag = f"CUSTOM_TABLE_{int(time.time())}_{idx}"
                    discovered.append({"tag": tag, "schema": schema})

    return discovered