
import os
import sys
import django

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "syllabusapp.settings")
django.setup()

from syllabuses.models import TemplateBlock, TemplateSubSection, TemplateSyllabus

REFERENCE_CLASS_MAP = {
    "credit": "CreditSubRenderer",
    "lecturer_info": "LecturerSubRenderer",
    "requirement_subject": "RequirementSubRenderer",
    "objective_outcomes": "ObjectiveSubRenderer",
    "objectives_and_outcomes": "ObjectiveSubRenderer",
    "course_learning_outcomes": "CLOSubRenderer",
    "clo_plo_matrix": "CLOPLOMatrixSubRenderer",
    "learning_material": "MaterialSubRenderer",
    "assessment_method": "AssessmentSubRenderer",
    "teaching_schedule": "ScheduleSubRenderer",
}


def _build_default_xml(sub_type: str, code: str, name: str) -> str:
    """Tạo XML template snippet mặc định theo loại block."""
    if sub_type == "reference":
        return f'<w:p><w:r><w:t>{{{{REF:{code}}}}}</w:t></w:r></w:p>'
    if sub_type in ("text", "selection"):
        return (
            f'<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{name}: </w:t></w:r>'
            f'<w:r><w:t>{{{{{code}}}}}</w:t></w:r></w:p>'
        )
    return f'<w:p><w:r><w:t>{{{{{code}}}}}</w:t></w:r></w:p>'


def _resolve_block_type(sub_type: str) -> str:
    valid_types = {"text", "selection", "table", "reference"}
    normalized = (sub_type or "").strip().lower()
    if normalized in valid_types:
        return normalized
    return "text"


def import_blocks_for_template(template_id: int | None = None) -> int:
    """Import các SubSection hiện có thành TemplateBlock cho TemplateSyllabus."""
    template = _get_target_template(template_id)
    if not template:
        print("Không tìm thấy template mục tiêu.")
        return 0

    sub_sections = TemplateSubSection.objects.filter(
        main_section__template=template
    ).order_by("main_section__position", "position")

    created_count = 0
    for idx, sub in enumerate(sub_sections, start=1):
        _create_or_update_block(template, sub, idx)
        created_count += 1

    return created_count


def _get_target_template(template_id: int | None):
    if template_id:
        return TemplateSyllabus.objects.filter(id=template_id).first()
    return TemplateSyllabus.objects.first()


def _create_or_update_block(template: TemplateSyllabus, sub: TemplateSubSection, idx: int) -> None:
    code = f"BLOCK_{idx:03d}"
    block_type = _resolve_block_type(sub.type)
    ref_class = REFERENCE_CLASS_MAP.get(sub.code) if block_type == "reference" else None
    xml_tpl = _build_default_xml(block_type, sub.code, sub.name)

    TemplateBlock.objects.update_or_create(
        template=template,
        code=code,
        defaults={
            "name": sub.name,
            "block_type": block_type,
            "xml_template": xml_tpl,
            "style_config": {},
            "reference_class": ref_class,
            "config": {"code": sub.code, "table_code": sub.code},
            "position": idx,
            "is_active": True,
        },
    )


def main():
    target_id = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else None
    count = import_blocks_for_template(target_id)
    print(f"Đã import thành công {count} TemplateBlocks.")


if __name__ == "__main__":
    main()
