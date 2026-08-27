from .base import render_text, render_selection, render_table
from .academic import (
    render_ref_credit,
    render_ref_subject_requirements,
    render_ref_objectives,
    render_ref_course_learning_outcomes,
    render_ref_learning_material
)
from .assessment import render_ref_student_assessment
from .schedule import render_ref_teaching_schedule
from .lecturer import render_ref_lecturer_info


def get_strategy_map():
    def handle_reference(sub, composer):
        ref_code = sub.get("reference_code")
        ref_data = sub.get("reference_data") or {}

        REF_STRATEGIES = {
            "credit": render_ref_credit,
            "director": render_ref_lecturer_info,
            "requirement_subject": render_ref_subject_requirements,
            "objectives_and_outcomes": render_ref_objectives,
            "course_learning_outcomes": render_ref_course_learning_outcomes,
            "learning_material": render_ref_learning_material,
            "assessment_method": render_ref_student_assessment,
            "teaching_schedule": render_ref_teaching_schedule
        }

        handler = REF_STRATEGIES.get(ref_code)
        if handler:
            handler(sub, ref_data, composer)

    return {
        "text": render_text,
        "selection": render_selection,
        "table": render_table,
        "reference": handle_reference
    }