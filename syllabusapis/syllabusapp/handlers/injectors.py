from abc import ABC, abstractmethod
from docx.oxml import OxmlElement
from docx.table import Table


class BaseControlInjector(ABC):
    @abstractmethod
    def inject(self, sdt_elem, value, doc):
        """Bơm dữ liệu value vào khối w:sdt của Word Document."""
        pass


class PlainTextInjector(BaseControlInjector):
    """Xử lý bơm dữ liệu chuỗi vào thẻ w:sdt (PLAIN_TEXT)."""

    def inject(self, sdt_elem, value, doc):
        val_str = str(value) if value is not None else ""

        content = sdt_elem.xpath('.//*[local-name()="sdtContent"]')
        if not content:
            return

        text_nodes = content[0].xpath('.//*[local-name()="t"]')

        if text_nodes:
            text_nodes[0].text = val_str

            for node in text_nodes[1:]:
                node.text = ""
        else:
            p_nodes = content[0].xpath('.//*[local-name()="p"]')
            if not p_nodes:
                return

            r = OxmlElement('w:r')
            t = OxmlElement('w:t')
            t.text = val_str
            r.append(t)
            p_nodes[0].append(r)


class TableInjector(BaseControlInjector):
    """Xử lý bơm danh sách hàng vào bảng dữ liệu mẫu bên trong thẻ w:sdt (TABLE)."""

    def inject(self, sdt_elem, rows_data, doc):
        if not rows_data:
            return

        tbl_nodes = sdt_elem.xpath('.//*[local-name()="tbl"]')
        if not tbl_nodes:
            return

        table = Table(tbl_nodes[0], doc)

        # Giữ lại hàng tiêu đề (index 0), xóa toàn bộ hàng dữ liệu mẫu từ index 1 trở đi
        while len(table.rows) > 1:
            tr = table.rows[1]._tr
            tr.getparent().remove(tr)

        # Bơm từng hàng dữ liệu mới
        for row in rows_data:
            new_tr = table.add_row()
            cells_val = list(row.values()) if isinstance(row, dict) else list(row)
            for col_idx, val in enumerate(cells_val):
                if col_idx < len(new_tr.cells):
                    new_tr.cells[col_idx].text = str(val) if val is not None else ""