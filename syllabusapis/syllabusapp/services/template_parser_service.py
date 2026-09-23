import os
from docx import Document
from syllabuses.models import TemplateSyllabus


class TemplateParserService:
    """Tự động phân tích file DOCX và đăng ký các thẻ Content Control (w:sdt) vào Database."""

    @classmethod
    def extract_and_register_fields(cls, template_instance: TemplateSyllabus):
        if not template_instance.file or not os.path.exists(template_instance.file.path):
            return 0

        doc = Document(template_instance.file.path)
        # Sử dụng local-name() để khớp trực tiếp thẻ sdt mà không cần tham số namespaces
        sdts = doc._element.xpath('.//*[local-name()="sdt"]')

        detected_fields = []
        seen_tags = set()

        for sdt in sdts:
            tag_nodes = sdt.xpath('.//*[local-name()="sdtPr"]/*[local-name()="tag"]/@*[local-name()="val"]')
            if not tag_nodes:
                continue

            tag_val = str(tag_nodes[0]).strip().upper()
            if tag_val in seen_tags:
                continue
            seen_tags.add(tag_val)

            # Kiểm tra xem bên trong có chứa bảng (tbl) hay không
            is_table = bool(sdt.xpath('.//*[local-name()="tbl"]'))
            field_type = 'TABLE' if is_table else 'PLAIN_TEXT'

            # Lấy alias làm mô tả hiển thị nếu có
            alias_nodes = sdt.xpath('.//*[local-name()="sdtPr"]/*[local-name()="alias"]/@*[local-name()="val"]')
            description = str(alias_nodes[0]) if alias_nodes else tag_val


        return len(detected_fields)