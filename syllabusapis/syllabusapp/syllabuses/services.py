# File: syllabuses/services.py

from syllabuses.models import (
    Syllabus, MainSection, SubSection, TextSubSection,
    SelectionSubSection, TableSubSection,
    TemplateMainSection, TemplateSubSection
)

# ==============================================================================
# STRATEGY PATTERN CHO ĐỒNG BỘ SUBSECTION
# ==============================================================================
class SubSectionSyncStrategy:
    """Base Strategy xử lý khởi tạo và cập nhật SubSection mặc định"""
    def create(self, main_sec, tpl_sub):
        return SubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position, requires_update=True
        )

    def update(self, sub_sec, tpl_sub):
        sub_sec.name = tpl_sub.name
        sub_sec.position = tpl_sub.position
        sub_sec.save()
        return sub_sec

class TextSyncStrategy(SubSectionSyncStrategy):
    def create(self, main_sec, tpl_sub):
        display_mode = tpl_sub.templatetextsubsection.display_mode if hasattr(tpl_sub, 'templatetextsubsection') else ''
        place_holder = tpl_sub.templatetextsubsection.place_holder if hasattr(tpl_sub, 'templatetextsubsection') else ''
        return TextSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            display_mode=display_mode, place_holder=place_holder, requires_update=True
        )

class SelectionSyncStrategy(SubSectionSyncStrategy):
    def create(self, main_sec, tpl_sub):
        attr_group_id = tpl_sub.templateselectionsubsection.attribute_group_id if hasattr(tpl_sub, 'templateselectionsubsection') else None
        return SelectionSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position, attribute_group_id=attr_group_id, requires_update=True
        )

    def update(self, sub_sec, tpl_sub):
        super().update(sub_sec, tpl_sub)
        if hasattr(sub_sec, 'selectionsubsection'):
            attr_group_id = tpl_sub.templateselectionsubsection.attribute_group_id if hasattr(tpl_sub, 'templateselectionsubsection') else None
            sub_sec.selectionsubsection.attribute_group_id = attr_group_id
            sub_sec.selectionsubsection.save()
        return sub_sec

class TableSyncStrategy(SubSectionSyncStrategy):
    def create(self, main_sec, tpl_sub):
        table_cols = []
        if hasattr(tpl_sub, 'templatetablesubsection') and tpl_sub.templatetablesubsection.table_schema:
            table_cols = tpl_sub.templatetablesubsection.table_schema.get("columns", [])
        return TableSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            data={"columns": table_cols, "rows": []}, requires_update=True
        )

SYNC_STRATEGIES = {
    'text': TextSyncStrategy(),
    'selection': SelectionSyncStrategy(),
    'table': TableSyncStrategy(),
}


# ==============================================================================
# SERVICE ĐỒNG BỘ CHÍNH
# ==============================================================================
class TemplateSyncService:
    @classmethod
    def sync(cls, template_instance):
        print(f"--- Bắt đầu đồng bộ Template ID: {template_instance.id} ---")
        syllabuses = Syllabus.objects.filter(template=template_instance)
        current_main_sections = TemplateMainSection.objects.filter(template=template_instance)

        for syllabus in syllabuses:
            print(f"-> Đang xử lý Syllabus ID: {syllabus.id}")
            valid_main_codes = []

            for tpl_main in current_main_sections:
                valid_main_codes.append(tpl_main.code)
                main_sec, _ = MainSection.objects.update_or_create(
                    syllabus=syllabus, code=tpl_main.code,
                    defaults={'name': tpl_main.name, 'position': tpl_main.position}
                )

                valid_sub_codes = []
                current_sub_sections = TemplateSubSection.objects.filter(main_section=tpl_main)

                for tpl_sub in current_sub_sections:
                    valid_sub_codes.append(tpl_sub.code)
                    sub_sec = SubSection.objects.filter(main_section=main_sec, code=tpl_sub.code).first()

                    strategy = SYNC_STRATEGIES.get(tpl_sub.type, SubSectionSyncStrategy())

                    if not sub_sec:
                        strategy.create(main_sec, tpl_sub)
                    else:
                        strategy.update(sub_sec, tpl_sub)

                SubSection.objects.filter(main_section=main_sec).exclude(code__in=valid_sub_codes).delete()

            MainSection.objects.filter(syllabus=syllabus).exclude(code__in=valid_main_codes).delete()

        print("--- Hoàn tất đồng bộ ---")