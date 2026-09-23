from abc import ABC, abstractmethod
from syllabuses.models import (
    TextSubSection,
    SelectionSubSection,
    TableSubSection,
    ReferenceSubSection,
)


class BaseSubSectionExtractor(ABC):
    @abstractmethod
    def extract(self, subsection, syllabus):
        pass


class TextSubSectionExtractor(BaseSubSectionExtractor):
    def extract(self, subsection, syllabus):
        text_sub = TextSubSection.objects.filter(id=subsection.id).first()
        return text_sub.content if text_sub and text_sub.content else ""


class SelectionSubSectionExtractor(BaseSubSectionExtractor):
    def extract(self, subsection, syllabus):
        sel_sub = SelectionSubSection.objects.filter(id=subsection.id).first()
        if not sel_sub:
            return ""
        values = sel_sub.selected_values.values_list('name_value', flat=True)
        return ", ".join(values) if values else ""


class TableSubSectionExtractor(BaseSubSectionExtractor):
    def extract(self, subsection, syllabus):
        tbl_sub = TableSubSection.objects.filter(id=subsection.id).first()
        if not tbl_sub or not tbl_sub.data:
            return []
        raw_data = tbl_sub.data
        if isinstance(raw_data, list):
            return raw_data
        if isinstance(raw_data, dict) and "rows" in raw_data:
            return raw_data["rows"]
        return []



class BaseReferenceStrategy(ABC):
    @abstractmethod
    def extract(self, syllabus):
        pass


class TeachingScheduleReferenceStrategy(BaseReferenceStrategy):
    def extract(self, syllabus):
        sessions = syllabus.teaching_sessions.all().prefetch_related(
            'course_learning_outcomes'
        ).order_by('session_no')
        rows = []
        for s in sessions:
            clos = ", ".join([f"CLO {c.position}" for c in s.course_learning_outcomes.all() if hasattr(c, 'position')])
            rows.append([
                f"Tuần {s.session_no}",
                s.content or "",
                clos,
                f"{int(s.self_study_hours) if s.self_study_hours.is_integer() else s.self_study_hours}",
                f"{int(s.offline_hours) if s.offline_hours.is_integer() else s.offline_hours}",
                f"{int(s.online_hours) if s.online_hours.is_integer() else s.online_hours}",
            ])
        return rows


class AssessmentReferenceStrategy(BaseReferenceStrategy):
    def extract(self, syllabus):
        rows = []
        for ass in syllabus.assessments.all().prefetch_related('assessment_methods'):
            for m in ass.assessment_methods.all():
                rows.append([
                    str(ass.type_assessment.name),
                    m.name,
                    f"{m.weight}%" if m.weight else "",
                    m.time or ""
                ])
        return rows


class LearningMaterialReferenceStrategy(BaseReferenceStrategy):
    def extract(self, syllabus):
        return ", ".join(syllabus.learning_materials_rel.values_list('name', flat=True))


class DefaultReferenceStrategy(BaseReferenceStrategy):
    def extract(self, syllabus):
        return ""



class ReferenceSubSectionExtractor(BaseSubSectionExtractor):
    STRATEGIES = {
        'TEACHING_SCHEDULE': TeachingScheduleReferenceStrategy(),
        'SCHEDULE': TeachingScheduleReferenceStrategy(),
        'TEACHING_SESSION': TeachingScheduleReferenceStrategy(),
        'ASSESSMENT': AssessmentReferenceStrategy(),
        'EVALUATION': AssessmentReferenceStrategy(),
        'LEARNING_MATERIAL': LearningMaterialReferenceStrategy(),
        'MATERIAL': LearningMaterialReferenceStrategy(),
    }
    DEFAULT_STRATEGY = DefaultReferenceStrategy()

    def extract(self, subsection, syllabus):
        ref_sub = ReferenceSubSection.objects.filter(id=subsection.id).first()
        if not ref_sub or not ref_sub.reference_code:
            return ""

        ref_code = ref_sub.reference_code.strip().upper()
        strategy = self.STRATEGIES.get(ref_code, self.DEFAULT_STRATEGY)
        return strategy.extract(syllabus)



class SubSectionExtractorFactory:
    EXTRACTORS = {
        'text': TextSubSectionExtractor(),
        'selection': SelectionSubSectionExtractor(),
        'table': TableSubSectionExtractor(),
        'reference': ReferenceSubSectionExtractor(),
    }

    @classmethod
    def get_extractor(cls, sub_type: str) -> BaseSubSectionExtractor:
        return cls.EXTRACTORS.get(str(sub_type).lower(), TextSubSectionExtractor())