# File: syllabuses/services.py
import json

import redis

from syllabuses.models import (
    Syllabus, MainSection, SubSection, TextSubSection,
    SelectionSubSection, TableSubSection,
    TemplateMainSection, TemplateSubSection
)

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


redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

class TemplateSyncService:
    @classmethod
    def sync(cls, template_instance):
        print(f"--- Bắt đầu đồng bộ Template ID: {template_instance.id} ---")
        syllabuses = Syllabus.objects.filter(template=template_instance)
        tpl_mains = list(TemplateMainSection.objects.filter(template=template_instance))
        tpl_subs = list(TemplateSubSection.objects.filter(main_section__in=tpl_mains))

        for syllabus in syllabuses:
            syllabus.revision += 1
            syllabus.save(update_fields=['revision'])
            valid_main_codes = [m.code for m in tpl_mains]

            main_upsert_list = [
                MainSection(
                    syllabus=syllabus, code=tpl_main.code,
                    name=tpl_main.name, position=tpl_main.position
                ) for tpl_main in tpl_mains
            ]

            MainSection.objects.bulk_create(
                main_upsert_list,
                update_conflicts=True,
                update_fields=['name', 'position']
            )

            MainSection.objects.filter(syllabus=syllabus).exclude(code__in=valid_main_codes).delete()

            valid_sub_codes = [s.code for s in tpl_subs]
            existing_mains = {m.code: m for m in MainSection.objects.filter(syllabus=syllabus)}

            for tpl_sub in tpl_subs:
                target_main = existing_mains.get(tpl_sub.main_section.code)
                if not target_main:
                    continue

                sub_sec = SubSection.objects.filter(main_section=target_main, code=tpl_sub.code).first()
                strategy = SYNC_STRATEGIES.get(tpl_sub.type, SubSectionSyncStrategy())

                if not sub_sec:
                    strategy.create(target_main, tpl_sub)
                else:
                    strategy.update(sub_sec, tpl_sub)

            SubSection.objects.filter(main_section__in=existing_mains.values()).exclude(
                code__in=valid_sub_codes).delete()

        print("--- Hoàn tất đồng bộ ---")
        redis_client.publish('syllabus_sync_channel', json.dumps({
            'action': 'sync_completed',
            'template_id': template_instance.id
        }))