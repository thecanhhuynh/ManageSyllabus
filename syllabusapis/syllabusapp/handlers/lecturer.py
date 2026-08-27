import io

from docx import Document
from docxtpl import DocxTemplate


def render_ref_lecturer_info(sub, ref_data, composer):
    tpl = DocxTemplate("templates/exports/snipper_lecturer_info.docx")
    context = sub.copy()
    context.update({
        "faculty_name": ref_data.get("faculty"),
        "lecturer_name": ref_data.get("last_name") + " " + ref_data.get("first_name"),
        "lecturer_email": ref_data.get("email"),
        "lecturer_room": ref_data.get("room"),
    })
    tpl.render(context)
    stream = io.BytesIO()
    tpl.save(stream)
    stream.seek(0)

    composer.append(Document(stream))