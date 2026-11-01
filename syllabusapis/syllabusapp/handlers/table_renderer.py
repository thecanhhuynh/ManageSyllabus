import re
import html
from lxml import etree

def render_dynamic_tables(doc, context_data):
    """
    Tìm các bảng có chứa [[ROW.xxx]], clone row dựa trên data từ context_data.
    Lý do dùng lxml string replace: Xử lý triệt để việc thẻ bị Word ngắt thành nhiều thẻ run (<w:r>)
    mà không làm mất định dạng font chữ/căn lề gốc.
    """
    for table in doc.tables:
        loop_row_idx = -1
        loop_keys = []
        table_key = None

        for idx, row in enumerate(table.rows):
            row_text = " ".join(cell.text for cell in row.cells)
            keys = re.findall(r'\[\[\s*ROW\.(\w+)\s*\]\]', row_text)

            if keys:
                loop_row_idx = idx
                loop_keys = keys
                for k, v_list in context_data.items():
                    if isinstance(v_list, list) and len(v_list) > 0:
                        if keys[0] in v_list[0]:
                            table_key = k
                            break
                break

        if loop_row_idx != -1 and table_key and table_key in context_data:
            loop_row = table.rows[loop_row_idx]
            parent = loop_row._tr.getparent()
            data_list = context_data[table_key]

            for item_data in data_list:
                row_xml_str = etree.tostring(loop_row._tr, encoding='unicode')

                for key in loop_keys:
                    search_str = f"[[ROW.{key}]]"
                    val_escaped = html.escape(str(item_data.get(key, "")))
                    row_xml_str = row_xml_str.replace(search_str, val_escaped)

                new_tr = etree.fromstring(row_xml_str.encode('utf-8'))

                parent.insert(parent.index(loop_row._tr), new_tr)

            parent.remove(loop_row._tr)