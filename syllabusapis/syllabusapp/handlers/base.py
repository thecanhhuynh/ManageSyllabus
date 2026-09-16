import math
from rest_framework.utils import json

from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_TAB_ALIGNMENT, WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Cm, RGBColor

from syllabuses.models import AttributeValue, TypeRequirement, TypeLearningMaterial
from syllabuses.serializer import ReferenceSubSectionSerializer


def set_table_borders(table):
    tbl = table._tbl
    tblPr = tbl.tblPr
    tblBorders = tblPr.first_child_found_in("w:tblBorders")
    if tblBorders is None:
        tblBorders = OxmlElement('w:tblBorders')
        tblPr.append(tblBorders)
    borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    for border_name in borders:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), '000000')
        tblBorders.append(border)


class BaseSubSectionRenderer:
    def __init__(self, doc):
        self.doc = doc

    def render(self, sub_sec, index):
        if sub_sec.name:
            p = self.doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(f"{index}.\t{sub_sec.name}: ")
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
        self.render_content(sub_sec, parent_paragraph=p if sub_sec.name else None)

    def render_content(self, sub_sec, parent_paragraph=None):
        raise NotImplementedError("Class con phải triển khai hàm này")

    def _format_run(self, run, font_name='Times New Roman', font_size=13, italic=False, bold=False):
        run.font.name = font_name
        run.font.size = Pt(font_size)
        if italic: run.font.italic = True
        if bold: run.font.bold = True
        return run

    def _write_cell(self, cell, text="", h_align=WD_ALIGN_PARAGRAPH.LEFT, v_align=WD_CELL_VERTICAL_ALIGNMENT.CENTER,
                    font_size=13):
        cell.vertical_alignment = v_align
        p = cell.paragraphs[0]
        p.alignment = h_align
        if text:
            self._format_run(p.add_run(text), font_size=font_size)
        return p

    def _create_table(self, rows, cols, widths=None, indent_twips='709', full_width=False):
        table = self.doc.add_table(rows=rows, cols=cols)
        set_table_borders(table)

        tbl_pr = table._element.xpath('w:tblPr')
        if tbl_pr:
            tbl_pr_element = tbl_pr[0]

            tblInd = OxmlElement('w:tblInd')
            tblInd.set(qn('w:w'), indent_twips)
            tblInd.set(qn('w:type'), 'dxa')
            tbl_pr_element.append(tblInd)

            if widths:
                table.autofit = False
                table.allow_autofit = False
                tblLayout = OxmlElement('w:tblLayout')
                tblLayout.set(qn('w:type'), 'fixed')
                tbl_pr_element.append(tblLayout)

            if full_width:
                tbl_w = tbl_pr_element.xpath('w:tblW')
                tbl_w_node = tbl_w[0] if tbl_w else OxmlElement('w:tblW')
                tbl_w_node.set(qn('w:w'), '5000')
                tbl_w_node.set(qn('w:type'), 'pct')
                if not tbl_w: tbl_pr_element.append(tbl_w_node)

        if widths:
            for i, width in enumerate(widths):
                table.columns[i].width = width
            for row in table.rows:
                for i, cell in enumerate(row.cells):
                    cell.width = widths[i]
        return table

    def _format_hours(self, hours):
        h = float(hours or 0)
        return str(int(h) if h.is_integer() else h) if h else ""

    def _set_page_orientation(self, orient, margin_cm):
        section = self.doc.add_section(WD_SECTION.NEW_PAGE)
        section.orientation = orient
        section.page_width, section.page_height = section.page_height, section.page_width
        section.left_margin = section.right_margin = Cm(margin_cm)
        if orient == WD_ORIENT.LANDSCAPE:
            section.top_margin = section.bottom_margin = Cm(1.5)


class TextRenderer(BaseSubSectionRenderer):
    def render_content(self, sub_sec, parent_paragraph=None):
        text_sub = sub_sec.textsubsection
        if not text_sub.content:
            return

        lines = text_sub.content.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            if i == 0 and parent_paragraph is not None:
                run = parent_paragraph.add_run(line)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(13)
            else:
                p = self.doc.add_paragraph(line, style='Normal')
                p.paragraph_format.left_indent = Cm(2)


class TableRenderer(BaseSubSectionRenderer):
    def render_content(self, sub_sec, parent_paragraph=None):
        table_sub = sub_sec.tablesubsection
        try:
            table_schema = table_sub.data if isinstance(table_sub.data, dict) else json.loads(table_sub.data)
        except (TypeError, ValueError):
            return

        columns = table_schema.get("columns", [])
        rows = table_schema.get("rows", [])

        if not columns:
            return

        word_table = self.doc.add_table(rows=len(rows) + 1, cols=len(columns))
        set_table_borders(word_table)

        header_cells = word_table.rows[0].cells
        for c_idx, col in enumerate(columns):
            header_cells[c_idx].text = str(col.get("headerName", ""))
            for paragraph in header_cells[c_idx].paragraphs:
                for run in paragraph.runs:
                    run.font.bold = True

        for r_idx, row_data in enumerate(rows):
            word_row_cells = word_table.rows[r_idx + 1].cells
            for c_idx, col in enumerate(columns):
                cell_value = row_data.get(col.get("field", ""), "")
                word_row_cells[c_idx].text = str(cell_value) if cell_value is not None else ""


class SelectionRenderer(BaseSubSectionRenderer):
    def render_content(self, sub_sec, parent_paragraph=None):
        selection_sub = sub_sec.selectionsubsection
        all_options = AttributeValue.objects.filter(attribute_group_id=selection_sub.attribute_group_id).order_by('id')

        if not all_options.exists():
            return

        selected_names = [val.name_value for val in selection_sub.selected_values.all()]
        options_list = list(all_options)
        num_options = len(options_list)
        num_cols = 3 if num_options <= 3 else 2
        rows = [options_list[i:i + num_cols] for i in range(0, num_options, num_cols)]

        for r_idx, row in enumerate(rows):
            p = self.doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(1.25)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(8.5), WD_TAB_ALIGNMENT.LEFT)
            if num_cols == 3:
                p.paragraph_format.tab_stops.add_tab_stop(Cm(14.0), WD_TAB_ALIGNMENT.LEFT)
            p.paragraph_format.space_after = Pt(6) if r_idx == len(rows) - 1 else Pt(0)

            for c_idx, option in enumerate(row):
                checkbox_char = "x   " if option.name_value in selected_names else "☐   "
                prefix = "\t" if c_idx > 0 else ""
                run = p.add_run(f"{prefix}{checkbox_char}{option.name_value}")
                run.font.name = 'Times New Roman'
                run.font.size = Pt(13)


class ReferenceRenderer(BaseSubSectionRenderer):
    def render_content(self, sub_sec, parent_paragraph=None):
        try:
            ref_sub = sub_sec.referencesubsection
        except AttributeError:
            return

        serializer = ReferenceSubSectionSerializer(ref_sub)
        data = serializer.data.get('reference_data')

        if not data:
            return

        handlers = {
            'credit': self._render_credit,
            'director': self._render_lecturer,
            'requirement_subject': self._render_requirement_subject,
            'learning_material': self._render_learning_material,
            'objectives_and_outcomes': self._render_objective_outcomes,
            'course_learning_outcomes': self._render_course_learning_outcomes,
            'assessment_method': self._render_assessment_method,
            'teaching_schedule': self._render_teaching_schedule
        }
        handler = handlers.get(ref_sub.reference_code)
        if handler:
            handler(data, parent_paragraph)

    def _render_credit(self, data, parent_paragraph):
        data['total_credit'] = (data.get('number_theory') or 0) + (data.get('number_practice') or 0)
        ordered_keys = ['total_credit', 'number_theory', 'number_practice', 'hour_self_study']
        labels_map = {
            'total_credit': 'Tổng số/Total', 'number_theory': 'Lý thuyết/Theory',
            'number_practice': 'Thực hành/Practice', 'hour_self_study': 'Số giờ tự học/Self-study'
        }
        keys_to_render = [k for k in ordered_keys if k in data and data[k] is not None]
        keys_to_render.extend([k for k in data.keys() if k not in ordered_keys and k != 'id'])
        if not keys_to_render: return

        headers = [labels_map.get(k, k.replace('_', ' ').title()) for k in keys_to_render]
        values = [str(data[k]) for k in keys_to_render]

        table = self._create_table(rows=2, cols=len(headers))
        for c_idx in range(len(headers)):
            self._write_cell(table.cell(0, c_idx), headers[c_idx], WD_ALIGN_PARAGRAPH.CENTER)
            self._write_cell(table.cell(1, c_idx), values[c_idx], WD_ALIGN_PARAGRAPH.CENTER)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def _render_lecturer(self, data, parent_paragraph):
        if 'first_name' in data and 'last_name' in data:
            data['full_name'] = f"{data['first_name']} {data['last_name']}"
        ordered_keys = ['faculty', 'full_name', 'email', 'room']
        labels_map = {
            'faculty': 'Khoa/Bộ môn/Faculty/Division', 'full_name': 'Giảng viên/Academics',
            'email': 'Địa chỉ email liên hệ/Email', 'room': 'Phòng làm việc/Room'
        }
        keys_to_render = [k for k in ordered_keys if k in data and data[k]]
        keys_to_render.extend(
            [k for k in data.keys() if k not in ordered_keys and k not in ['first_name', 'last_name', 'id']])

        for i, key in enumerate(keys_to_render):
            p = self.doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(1)
            p.paragraph_format.tab_stops.add_tab_stop(Cm(0.75), WD_TAB_ALIGNMENT.LEFT)
            label = labels_map.get(key, key.replace('_', ' ').title())
            self._format_run(p.add_run(f"{chr(97 + i)}.\t{label}: {data[key]}"))
            if i == len(keys_to_render) - 1: p.paragraph_format.space_after = Pt(6)

    def _render_requirement_subject(self, data, parent_paragraph):
        all_req_types = list(TypeRequirement.objects.order_by('id').values_list('name', flat=True))
        table = self._create_table(rows=len(all_req_types) + 1, cols=3, widths=[Cm(2.0), Cm(8.0), Cm(3.0)])

        for c_idx, h_text in enumerate(["STT/No.", "Môn học điều kiện/ Requirements", "Mã môn học/Code"]):
            self._write_cell(table.cell(0, c_idx), h_text, WD_ALIGN_PARAGRAPH.CENTER)

        grouped = {}
        for item in (data if isinstance(data, list) else []):
            grouped.setdefault(item.get('requirement_type', {}).get('name', ''), []).append({
                'name': item.get('subject_name', ''), 'code': item.get('subject_code', '')
            })

        for r_idx, req_type in enumerate(all_req_types):
            cells = table.rows[r_idx + 1].cells
            self._write_cell(cells[0], f"{r_idx + 1}.", WD_ALIGN_PARAGRAPH.CENTER)
            p_name = self._write_cell(cells[1], f"{req_type}\n")
            p_code = self._write_cell(cells[2], h_align=WD_ALIGN_PARAGRAPH.CENTER)

            subjects = grouped.get(req_type, [])
            if not subjects:
                self._format_run(p_name.add_run("Không có"))
            else:
                for i, sub in enumerate(subjects):
                    self._format_run(p_name.add_run(sub['name']))
                    self._format_run(p_code.add_run(sub['code']))
                    if i < len(subjects) - 1:
                        p_name.add_run("\n")
                        p_code.add_run("\n")
        self.doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def _render_learning_material(self, data, parent_paragraph):
        data_list = data if isinstance(data, list) else []
        if not data_list: return
        all_mat_types = list(TypeLearningMaterial.objects.order_by('id').values_list('name', flat=True))
        grouped = {}
        for item in data_list:
            mat_str = item.get('name', '')
            extras = [str(item[k]) for k in item if k not in ['id', 'name', 'type_material'] and item[k]]
            if extras: mat_str += f" ({', '.join(extras)})"
            grouped.setdefault(item.get('type_material', {}).get('name', 'Khác'), []).append(mat_str)

        active_types = [t for t in all_mat_types if t in grouped] + [t for t in grouped if t not in all_mat_types]
        global_item_index = 1
        for i, mat_type in enumerate(active_types):
            p_group = self.doc.add_paragraph()
            p_group.paragraph_format.left_indent = Cm(1.25)
            p_group.paragraph_format.tab_stops.add_tab_stop(Cm(2.25), WD_TAB_ALIGNMENT.LEFT)
            self._format_run(p_group.add_run(f"{chr(97 + i)}.\t{mat_type}"), italic=True)

            for mat in grouped[mat_type]:
                p_mat = self.doc.add_paragraph()
                p_mat.paragraph_format.left_indent = Cm(1.25)
                self._format_run(p_mat.add_run(f"[{global_item_index}]. "))
                self._format_run(p_mat.add_run(mat))
                global_item_index += 1
            if i == len(active_types) - 1: p_mat.paragraph_format.space_after = Pt(6)

    def _render_objective_outcomes(self, data, parent_paragraph):
        data_list = data if isinstance(data, list) else []
        if not data_list: return
        table = self._create_table(rows=len(data_list) + 1, cols=3, widths=[Cm(3.0), Cm(8.5), Cm(3.5)])
        headers = ["Mục tiêu môn\nhọc/ Course\nobjectives", "Mô tả - Description",
                   "CĐR CTĐT phân bổ\ncho môn học - PLOs"]

        for c_idx, h_text in enumerate(headers):
            self._format_run(self._write_cell(table.cell(0, c_idx), "", WD_ALIGN_PARAGRAPH.CENTER).add_run(h_text),
                             bold=True)

        for r_idx, item in enumerate(data_list):
            cells = table.rows[r_idx + 1].cells
            self._write_cell(cells[0], f"CO{r_idx + 1}", WD_ALIGN_PARAGRAPH.CENTER)
            run_desc = self._write_cell(cells[1], "").add_run(item.get('content', ''))
            self._format_run(run_desc, italic=True).font.color.rgb = RGBColor(0, 112, 192)

            plos = item.get('programme_learning_outcomes', [])
            plo_names = [
                p.get('name', '').replace('PLO', 'PLO.') if 'PLO.' not in p.get('name', '') else p.get('name', '') for p
                in plos]
            run_plo = self._write_cell(cells[2], "", WD_ALIGN_PARAGRAPH.CENTER).add_run("\n".join(plo_names))
            self._format_run(run_plo, italic=True).font.color.rgb = RGBColor(0, 112, 192)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def _render_course_learning_outcomes(self, data, parent_paragraph):
        data_list = data if isinstance(data, list) else []
        if not data_list: return

        p_intro = self.doc.add_paragraph()
        p_intro.paragraph_format.left_indent = Cm(1.25)

        run_intro = p_intro.add_run("Học xong môn học này, người học có khả năng")
        run_intro.font.name = 'Times New Roman'
        run_intro.font.size = Pt(13)
        run_intro.font.color.rgb = RGBColor(255, 0, 0)
        run_intro.font.bold = True

        cos_with_clos = [co for co in data_list if co.get('clos')]
        total_clos = sum(len(co['clos']) for co in cos_with_clos)
        if total_clos == 0: return

        table1 = self._create_table(rows=total_clos + 1, cols=3, widths=[Cm(3.0), Cm(3.0), Cm(10.0)])
        for c_idx, h_text in enumerate(
                ["Mục tiêu môn\nhọc/Course\nobjectives", "CĐR môn học\n(CLO)", "Mô tả CĐR -Description"]):
            self._format_run(self._write_cell(table1.cell(0, c_idx), "", WD_ALIGN_PARAGRAPH.CENTER).add_run(h_text),
                             bold=True)

        current_row, global_clo_idx, matrix_data = 1, 1, []
        for co_idx, co in enumerate(cos_with_clos, start=1):
            start_row = current_row
            for clo in co['clos']:
                self._write_cell(table1.cell(current_row, 1), f"CLO{global_clo_idx}", WD_ALIGN_PARAGRAPH.CENTER)
                run_desc = self._write_cell(table1.cell(current_row, 2), "").add_run(clo.get('content', ''))
                self._format_run(run_desc, italic=True).font.color.rgb = RGBColor(0, 112, 192)
                matrix_data.append({'clo_num': global_clo_idx, 'plos': clo.get('plos', [])})
                global_clo_idx += 1
                current_row += 1

            if start_row < current_row - 1: table1.cell(start_row, 0).merge(table1.cell(current_row - 1, 0))
            self._write_cell(table1.cell(start_row, 0), f"CO{co_idx}", WD_ALIGN_PARAGRAPH.CENTER)

        p_matrix_intro = self.doc.add_paragraph()
        p_matrix_intro.paragraph_format.space_before = Pt(12)
        p_matrix_intro.paragraph_format.left_indent = Cm(1.25)
        self._format_run(p_matrix_intro.add_run(
            "Ma trận tích hợp giữa chuẩn đầu ra môn học và chuẩn đầu ra của chương trình đào tạo"))

        sorted_plos = sorted(list({p['plo_id'] for md in matrix_data for p in md['plos']}))
        t2_widths = [Cm(2.0)] + [Cm(14.0 / len(sorted_plos)) if sorted_plos else Cm(2.0)] * len(sorted_plos)
        table2 = self._create_table(rows=total_clos + 1, cols=len(sorted_plos) + 1, widths=t2_widths)

        self._format_run(self._write_cell(table2.cell(0, 0), "", WD_ALIGN_PARAGRAPH.CENTER).add_run("CLOs"), bold=True)
        for i, plo_id in enumerate(sorted_plos, start=1):
            self._format_run(
                self._write_cell(table2.cell(0, i), "", WD_ALIGN_PARAGRAPH.CENTER).add_run(f"PLO.{plo_id}"), bold=True)

        for r_idx, md in enumerate(matrix_data, start=1):
            self._format_run(
                self._write_cell(table2.cell(r_idx, 0), "", WD_ALIGN_PARAGRAPH.CENTER).add_run(str(md['clo_num'])),
                bold=True)
            plo_dict = {p['plo_id']: p['rating'] for p in md['plos']}
            for c_idx, plo_id in enumerate(sorted_plos, start=1):
                self._write_cell(table2.cell(r_idx, c_idx), str(plo_dict.get(plo_id, "")), WD_ALIGN_PARAGRAPH.CENTER)

        p_legend = self.doc.add_paragraph()
        p_legend.paragraph_format.left_indent = Cm(2.5)
        p_legend.paragraph_format.tab_stops.add_tab_stop(Cm(8.5), WD_TAB_ALIGNMENT.LEFT)
        self._format_run(p_legend.add_run(
            "1: Không đáp ứng\t4: Đáp ứng nhiều\n2: Ít đáp ứng\t5: Đáp ứng rất nhiều\n3: Đáp ứng trung bình"),
                         italic=True)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def _render_assessment_method(self, data, parent_paragraph):
        data_list = data if isinstance(data, list) else []
        if not data_list: return

        table = self._create_table(rows=2 + sum(len(g.get('assessment_methods', [])) + 1 for g in data_list), cols=5,
                                   widths=[Cm(3.5), Cm(5.0), Cm(3.0), Cm(3.0), Cm(1.5)])
        h0 = ["Thành phần đánh\ngiá/Type of\nassessment", "Bài đánh giá\nAssessment methods",
              "Thời điểm\nAssessment\ntime", "CĐR môn học/CLOs", "Tỷ lệ %\nWeight %"]
        for i, h in enumerate(h0):
            self._write_cell(table.cell(0, i), h, WD_ALIGN_PARAGRAPH.CENTER)
            self._write_cell(table.cell(1, i), f"({i + 1})", WD_ALIGN_PARAGRAPH.CENTER)

        r_idx = 2
        for g_idx, group in enumerate(data_list, start=1):
            methods, group_name = group.get('assessment_methods', []), group.get('type_assessment', {}).get('name', '')
            start_row, group_weight = r_idx, 0

            for m_idx, method in enumerate(methods, start=1):
                cells = table.rows[r_idx].cells
                self._write_cell(cells[0], f"A{g_idx}. {group_name}" if r_idx == start_row else "",
                                 WD_ALIGN_PARAGRAPH.CENTER)
                self._write_cell(cells[1], f"A.{g_idx}.{m_idx}. {method.get('name', '')}")
                self._write_cell(cells[2], method.get('time', ''), WD_ALIGN_PARAGRAPH.CENTER)
                clos = [f"CLO{c.get('position', c.get('id', ''))}" for c in method.get('course_learning_outcomes', [])]
                self._write_cell(cells[3], "\n".join(clos), WD_ALIGN_PARAGRAPH.CENTER)
                group_weight += method.get('weight', 0)
                self._write_cell(cells[4], f"{method.get('weight', 0)}%", WD_ALIGN_PARAGRAPH.CENTER)
                r_idx += 1

            cells = table.rows[r_idx].cells
            self._write_cell(cells[0], "")
            self._write_cell(cells[1], "Tổng cộng")
            self._write_cell(cells[2], "")
            self._write_cell(cells[3], "")
            self._write_cell(cells[4], f"{group_weight}%", WD_ALIGN_PARAGRAPH.CENTER)
            if start_row < r_idx: table.cell(start_row, 0).merge(table.cell(r_idx, 0))
            r_idx += 1
        self.doc.add_paragraph().paragraph_format.space_after = Pt(6)


    def _build_schedule_header(self, table):
        self._write_cell(table.cell(0, 0), "Tuần/buổi\nhọc\nWeek\nSection", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        self._write_cell(table.cell(0, 1), "Nội dung\nContent", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        self._write_cell(table.cell(0, 2), "CĐR\nmôn\nhọc\nCLOs", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        self._write_cell(table.cell(0, 3), "Hoạt động dạy và học/Teaching and learning", WD_ALIGN_PARAGRAPH.CENTER,
                         font_size=10)
        self._write_cell(table.cell(0, 9), "Bài đánh\ngiá\nStudent\nassessment", WD_ALIGN_PARAGRAPH.CENTER,
                         font_size=10)
        self._write_cell(table.cell(0, 10), "Tài liệu\nchính và tài\nliệu tham\nkhảo\nTextbooks\nand\nmaterials",
                         WD_ALIGN_PARAGRAPH.CENTER, font_size=10)

        table.cell(0, 3).merge(table.cell(0, 8))
        for c in [0, 1, 2, 9, 10]: table.cell(0, c).merge(table.cell(2, c))

        self._write_cell(table.cell(1, 3), "Tự học/Self-study", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        table.cell(1, 3).merge(table.cell(1, 4))
        self._write_cell(table.cell(1, 5), "Trực tiếp/FTF\nLý thuyết/Theory", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        table.cell(1, 5).merge(table.cell(1, 6))
        self._write_cell(table.cell(1, 7), "Trực tuyến (nếu\ncó)/Online (if any)\nLý thuyết/Theory",
                         WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        table.cell(1, 7).merge(table.cell(1, 8))

        for c in [3, 5, 7]: self._write_cell(table.cell(2, c), "Hoạt động\nActivity", WD_ALIGN_PARAGRAPH.CENTER,
                                             font_size=10)
        for c in [4, 6, 8]: self._write_cell(table.cell(2, c), "Số giờ\nPeriods", WD_ALIGN_PARAGRAPH.CENTER,
                                             font_size=10)

        for c, text in enumerate(["(1)", "(2)", "(3)", "(4)", "", "(5)", "", "(6)", "", "(7)", "(8)"]):
            if text: self._write_cell(table.cell(3, c), text, WD_ALIGN_PARAGRAPH.CENTER, font_size=10)

    def _build_schedule_footer(self, table, r_idx, sum_self, sum_offline, sum_online):
        cells = table.rows[r_idx].cells
        self._write_cell(cells[0], "Tổng cộng/Total", WD_ALIGN_PARAGRAPH.LEFT, font_size=10)
        table.cell(r_idx, 0).merge(table.cell(r_idx, 2))

        for c in [3, 5, 7, 9, 10]: self._write_cell(cells[c], "x", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        self._write_cell(cells[4], self._format_hours(sum_self) or "x", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        self._write_cell(cells[8], self._format_hours(sum_online) or "x", WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
        run_ftf = self._write_cell(cells[6], "", WD_ALIGN_PARAGRAPH.CENTER, font_size=10).add_run(
            self._format_hours(sum_offline) or "x")
        self._format_run(run_ftf, font_size=10).font.color.rgb = RGBColor(255, 0, 0)

    def _render_teaching_schedule(self, data, parent_paragraph):
        data_list = data if isinstance(data, list) else []
        if not data_list: return

        title_text = parent_paragraph.text if parent_paragraph else ""
        if parent_paragraph: parent_paragraph._element.getparent().remove(parent_paragraph._element)

        self._set_page_orientation(WD_ORIENT.LANDSCAPE, margin_cm=0.8)

        if title_text:
            p_title = self.doc.add_paragraph()
            p_title.paragraph_format.space_before = p_title.paragraph_format.space_after = Pt(6)
            self._format_run(p_title.add_run(title_text))

        grouped = {}
        for item in data_list: grouped.setdefault(item.get('schedule_group', {}).get('name', 'Chung'), []).append(item)

        for g_name, sessions in grouped.items():
            self._format_run(self.doc.add_paragraph().add_run(f"Lớp {g_name}" if "Lớp" not in g_name else g_name),
                             bold=True)

            widths = [Cm(w) for w in (1.8, 6.2, 1.5, 3.0, 1.5, 4.2, 1.5, 3.0, 1.5, 1.8, 2.1)]
            table = self._create_table(rows=5 + len(sessions), cols=11, widths=widths, indent_twips='0',
                                       full_width=True)

            self._build_schedule_header(table)

            r_idx = 4
            sum_self = sum_offline = sum_online = 0

            for session in sessions:
                cells = table.rows[r_idx].cells
                self._write_cell(cells[0], str(session.get('session_no', '')), WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
                self._write_cell(cells[1], session.get('content', '').strip(), WD_ALIGN_PARAGRAPH.LEFT, font_size=10)

                clos = [str(c.get('position', c.get('id', ''))) for c in session.get('course_learning_outcomes', [])]
                self._write_cell(cells[2], "\n".join(clos), WD_ALIGN_PARAGRAPH.CENTER, font_size=10)

                self._write_cell(cells[3], session.get('self_study_activity', '').strip(), WD_ALIGN_PARAGRAPH.LEFT,
                                 font_size=10)
                sum_self += float(session.get('self_study_hours') or 0)
                self._write_cell(cells[4], self._format_hours(session.get('self_study_hours')),
                                 WD_ALIGN_PARAGRAPH.CENTER, font_size=10)

                self._write_cell(cells[5], session.get('offline_activity', '').strip(), WD_ALIGN_PARAGRAPH.LEFT,
                                 font_size=10)
                sum_offline += float(session.get('offline_hours') or 0)
                self._write_cell(cells[6], self._format_hours(session.get('offline_hours')), WD_ALIGN_PARAGRAPH.CENTER,
                                 font_size=10)

                self._write_cell(cells[7], session.get('online_activity', '').strip(), WD_ALIGN_PARAGRAPH.LEFT,
                                 font_size=10)
                sum_online += float(session.get('online_hours') or 0)
                self._write_cell(cells[8], self._format_hours(session.get('online_hours')), WD_ALIGN_PARAGRAPH.CENTER,
                                 font_size=10)

                asmnts = [f"A{a.get('id', '')}.1" for a in session.get('assessments', [])]
                self._write_cell(cells[9], "\n".join(asmnts), WD_ALIGN_PARAGRAPH.CENTER, font_size=10)

                mats = [f"[{m.get('id', '')}]" for m in session.get('learning_materials', [])]
                self._write_cell(cells[10], "".join(mats), WD_ALIGN_PARAGRAPH.CENTER, font_size=10)
                r_idx += 1

            self._build_schedule_footer(table, r_idx, sum_self, sum_offline, sum_online)
            self.doc.add_paragraph().paragraph_format.space_after = Pt(6)

        self._set_page_orientation(WD_ORIENT.PORTRAIT, margin_cm=2.54)