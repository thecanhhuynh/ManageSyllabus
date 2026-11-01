"""
handlers/renderers/renderer_factory.py

Factory cung cấp Sub-Renderer phù hợp cho từng SubSection.
"""

from handlers.renderers.simple import (
    TextSubRenderer,
    SelectionSubRenderer,
    CreditSubRenderer,
    LecturerSubRenderer,
    TableSubRenderer,
)
from handlers.renderers.complex import (
    RequirementSubRenderer,
    ObjectiveSubRenderer,
    CLOSubRenderer,
    CLOPLOMatrixSubRenderer,
    MaterialSubRenderer,
    AssessmentSubRenderer,
    ScheduleSubRenderer,
)


class SubRendererFactory:
    """Factory đăng ký và cung cấp các Sub-Renderer theo cấu hình SubSection."""

    _RENDERERS = [
        TextSubRenderer(),
        SelectionSubRenderer(),
        CreditSubRenderer(),
        LecturerSubRenderer(),
        TableSubRenderer(),
        RequirementSubRenderer(),
        ObjectiveSubRenderer(),
        CLOSubRenderer(),
        CLOPLOMatrixSubRenderer(),
        MaterialSubRenderer(),
        AssessmentSubRenderer(),
        ScheduleSubRenderer(),
    ]

    @classmethod
    def get_renderers(cls, sub_section: dict) -> list:
        """Trả về danh sách các Sub-Renderer có thể xử lý sub_section này."""
        if not isinstance(sub_section, dict):
            return []
        return [r for r in cls._RENDERERS if r.can_render(sub_section)]
