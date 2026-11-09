import io
import os

import jinja2
from django.conf import settings
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm, Inches
from docxtpl import DocxTemplate

from handlers.base import TextRenderer, TableRenderer, SelectionRenderer, ReferenceRenderer, set_table_borders
from handlers.data_mapper import SyllabusDataMapper
from handlers.table_renderer import render_dynamic_tables
from syllabuses.models import Syllabus

def int_to_roman(num):
    val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
    syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
    roman_num = ''
    i = 0
    while num > 0:
        for _ in range(num // val[i]):
            roman_num += syb[i]
            num -= val[i]
        i += 1
    return roman_num

class SyllabusDocxRenderer:
    def __init__(self, syllabus_id):
        self.syllabus = Syllabus.objects.prefetch_related(
            'main_sections__sub_sections'
        ).get(id=syllabus_id)
        template_path = os.path.join(
            settings.BASE_DIR,
            'templates', 'exports', 'styles_blank.docx'
        )
        self.doc = Document(template_path) if os.path.exists(template_path) else Document()

        if 'Normal' in self.doc.styles:
            style = self.doc.styles['Normal']
            style.font.name = 'Times New Roman'
            style.font.size = Pt(13)

        self.renderers = {
            'text': TextRenderer(self.doc),
            'table': TableRenderer(self.doc),
            'reference': ReferenceRenderer(self.doc),
            'selection': SelectionRenderer(self.doc)
        }

    def _render_document_header(self):

        table = self.doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.RIGHT
        table.autofit = False
        table.columns[0].width = Cm(4.5)
        table.cell(0, 0).width = Cm(4.5)
        set_table_borders(table)

        p_phuluc = table.cell(0, 0).paragraphs[0]
        p_phuluc.alignment = WD_ALIGN_PARAGRAPH.CENTER

        run_phuluc = p_phuluc.add_run("Phụ lục 7-Appendix 7")
        run_phuluc.font.name = 'Times New Roman'
        run_phuluc.font.italic = True
        run_phuluc.font.bold = True
        run_phuluc.font.size = Pt(12)

        self.doc.add_paragraph()

        p_school = self.doc.add_paragraph()
        p_school.alignment = WD_ALIGN_PARAGRAPH.CENTER

        run_bo = p_school.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO\nMINISTRY OF EDUCATION AND TRAINING\n")
        run_bo.font.name = 'Times New Roman'
        run_bo.font.size = Pt(13)

        run_truong = p_school.add_run("TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH\nHO CHI MINH CITY OPEN UNIVERSITY\n")
        run_truong.font.name = 'Times New Roman'
        run_truong.font.bold = True
        run_truong.font.size = Pt(13)

        run_line = p_school.add_run("______________________________")
        run_line.font.name = 'Times New Roman'
        run_line.font.bold = True

        self.doc.add_paragraph()

        p_title = self.doc.add_paragraph()
        p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER

        run_title_vi = p_title.add_run("ĐỀ CƯƠNG MÔN HỌC\n")
        run_title_vi.font.name = 'Times New Roman'
        run_title_vi.font.bold = True
        run_title_vi.font.size = Pt(16)

        run_title_en = p_title.add_run("COURSE SPECIFICATION\n")
        run_title_en.font.name = 'Times New Roman'
        run_title_en.font.bold = True
        run_title_en.font.size = Pt(14)

    @staticmethod
    def _format_user_name(user, default: str) -> str:
        if not user:
            return default
        last = (getattr(user, "last_name", "") or "").strip()
        first = (getattr(user, "first_name", "") or "").strip()
        name = f"{last} {first}".strip()
        return name or (getattr(user, "username", "") or default)

    @staticmethod
    def _insert_sig_or_spaces(paragraph, cell, sig_path: str | None):
        if sig_path and os.path.exists(sig_path):
            p_img = cell.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.add_run().add_picture(sig_path, height=Pt(40))
            return
        paragraph.add_run("\n\n\n\n\n")

    def _render_document_footer(self):
        self.doc.add_paragraph()
        d_text = "Thành phố Hồ Chí Minh, ngày ... tháng ... năm 202..."
        appr_date = getattr(self.syllabus, "approved_date", None)
        if appr_date:
            d_text = f"Thành phố Hồ Chí Minh, ngày {appr_date.day:02d} tháng {appr_date.month:02d} năm {appr_date.year}"

        p_date = self.doc.add_paragraph()
        p_date.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run_date = p_date.add_run(d_text)
        run_date.font.name = 'Times New Roman'
        run_date.font.italic = True
        run_date.font.size = Pt(13)

        table = self.doc.add_table(rows=1, cols=2)
        self._render_footer_cells(table)

    def _render_footer_cells(self, table):
        from syllabuses.models import Lecturer
        leader = None
        if self.syllabus.approved_by and hasattr(self.syllabus.approved_by, 'lecturer_profile'):
            leader = self.syllabus.approved_by.lecturer_profile
        elif self.syllabus.faculty:
            leader = Lecturer.objects.filter(
                faculty=self.syllabus.faculty,
                faculty_role__in=['dean', 'vice_dean']
            ).first()

        fac_name = getattr(self.syllabus.faculty, 'name', 'Công nghệ Thông tin') if self.syllabus.faculty else 'Công nghệ Thông tin'
        clean_fac = fac_name[5:].strip() if fac_name.lower().startswith('khoa ') else fac_name.strip()
        role = getattr(leader, 'faculty_role', 'dean')
        is_dean = role == 'dean'

        left_title = f"TRƯỞNG KHOA {clean_fac.upper()}\nDEAN\n" if is_dean else f"PHÓ TRƯỞNG KHOA {clean_fac.upper()}\nDEPUTY DEAN\n"
        leader_user = getattr(leader, 'user', None) or getattr(self.syllabus, 'approved_by', None)
        left_name = self._format_user_name(leader_user, "TS. Trương Hoàng Vinh")
        leader_sig = leader.signature_image.path if (leader and getattr(leader, 'signature_image', None) and self.syllabus.is_approved) else None

        lec = getattr(self.syllabus, 'lecturer', None)
        lec_user = getattr(lec, 'user', None) if lec else None
        right_name = self._format_user_name(lec_user, "ThS. Dương Hữu Thành")
        lec_sig = lec.signature_image.path if (lec and getattr(lec, 'signature_image', None)) else None

        self._populate_legacy_cell(table.cell(0, 0), left_title, left_name, leader_sig)
        self._populate_legacy_cell(table.cell(0, 1), "GIẢNG VIÊN BIÊN SOẠN\nACADEMIC\n", right_name, lec_sig)

    def _populate_legacy_cell(self, cell, title, name, sig_path):
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_title = p.add_run(title)
        r_title.font.name = 'Times New Roman'
        r_title.font.bold = True
        r_title.font.size = Pt(13)

        r_note = p.add_run("(Ký và ghi rõ họ tên-Signed with fullname)\n")
        r_note.font.name = 'Times New Roman'
        r_note.font.italic = True
        r_note.font.size = Pt(13)

        self._insert_sig_or_spaces(p, cell, sig_path)

        p_name = cell.add_paragraph() if sig_path and os.path.exists(sig_path) else p
        r_name = p_name.add_run(name)
        r_name.font.name = 'Times New Roman'
        r_name.font.bold = True
        r_name.font.size = Pt(13)
        if p_name != p:
            p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER

    def render(self):
        self._render_document_header()

        for main_idx, main_sec in enumerate(self.syllabus.main_sections.all(), start=1):
            roman_index = int_to_roman(main_idx)
            sec_para = self.doc.add_paragraph()
            sec_para.paragraph_format.space_before = Pt(12)
            sec_para.paragraph_format.space_after = Pt(6)
            sec_run = sec_para.add_run(f"{roman_index}.\t{main_sec.name}")
            sec_run.font.name = 'Times New Roman'
            sec_run.font.bold = True
            sec_run.font.size = Pt(13)

            for sub_idx, sub_sec in enumerate(main_sec.sub_sections.all(), start=1):
                renderer = self.renderers.get(sub_sec.type)
                if renderer:
                    renderer.render(sub_sec, index=sub_idx)
        self._render_document_footer()
        buffer = io.BytesIO()
        self.doc.save(buffer)
        buffer.seek(0)
        return buffer

class MasterTemplateRenderer:
    def __init__(self, template_path: str):
        if not os.path.exists(template_path):
            raise FileNotFoundError(
                f"Không tìm thấy file template tại: {template_path}"
            )

        self.template_path = template_path
    @classmethod
    def get_all_available_tags(cls, template_id=None) -> dict:
        """
        Lấy danh mục thẻ từ Database để trả về cho giao diện React (Sidebar).
        """
        return {"SCALAR": [], "TABLE_FIXED": [], "TABLE_DYNAMIC": []}

    def render(self, syllabus) -> io.BytesIO:
        """
        Pipeline render hoàn chỉnh (Không dùng SDT).
        """
        mapper = SyllabusDataMapper(syllabus)
        data_context = mapper.build()

        doc = Document(self.template_path)

        render_dynamic_tables(doc, data_context)

        temp_buffer = io.BytesIO()
        doc.save(temp_buffer)
        temp_buffer.seek(0)

        tpl = DocxTemplate(temp_buffer)

        custom_jinja_env = jinja2.Environment(
            variable_start_string='[[',
            variable_end_string=']]'
        )

        tpl.render(data_context, jinja_env=custom_jinja_env)

        final_buffer = io.BytesIO()
        tpl.save(final_buffer)
        final_buffer.seek(0)

        return final_buffer
