from rest_framework import serializers

from syllabuses.models import TemplateSelectionSubSection, TemplateTableSubSection, TemplateTextSubSection, \
    TemplateSubSection


class SubSectionStrategy:
    """Base Strategy cung cấp hàm tiện ích dùng chung"""
    def _update_base_fields(self, sub_sec, sub_data):
        for attr, value in sub_data.items():
            setattr(sub_sec, attr, value)
        sub_sec.save()
        return sub_sec

    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        pass

    def clone(self, old_sub, new_main):
        pass


class DefaultStrategy(SubSectionStrategy):
    """Chiến lược mặc định cho các SubSection cơ bản (không có bảng con)"""

    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        if sub_id and sub_id in existing_subs:
            return self._update_base_fields(existing_subs[sub_id], sub_data)
        return TemplateSubSection.objects.create(main_section=main_sec, **sub_data)

    def clone(self, old_sub, new_main):
        return TemplateSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position
        )


class TextStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        display_mode = sub_data.pop('display_mode', None)
        place_holder = sub_data.pop('place_holder', None)

        if sub_id and sub_id in existing_subs:
            sub_sec = existing_subs[sub_id]
            if hasattr(sub_sec, 'templatetextsubsection'):
                sub_sec.templatetextsubsection.display_mode = display_mode
                sub_sec.templatetextsubsection.place_holder = place_holder
                sub_sec.templatetextsubsection.save()
            return self._update_base_fields(sub_sec, sub_data)

        return TemplateTextSubSection.objects.create(
            main_section=main_sec,
            display_mode=display_mode,
            place_holder=place_holder,
            **sub_data
        )

    def clone(self, old_sub, new_main):
        return TemplateTextSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            display_mode=getattr(old_sub.templatetextsubsection, 'display_mode', ''),
            place_holder=getattr(old_sub.templatetextsubsection, 'place_holder', '')
        )


class TableStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        table_schema = sub_data.pop('table_schema', None)

        if sub_id and sub_id in existing_subs:
            sub_sec = existing_subs[sub_id]
            if hasattr(sub_sec, 'templatetablesubsection'):
                sub_sec.templatetablesubsection.table_schema = table_schema
                sub_sec.templatetablesubsection.save()
            return self._update_base_fields(sub_sec, sub_data)

        return TemplateTableSubSection.objects.create(
            main_section=main_sec,
            table_schema=table_schema,
            **sub_data
        )

    def clone(self, old_sub, new_main):
        return TemplateTableSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            table_schema=getattr(old_sub.templatetablesubsection, 'table_schema', None)
        )


class SelectionStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        attribute_group_id = sub_data.pop('attribute_group_id', None)

        if sub_id and sub_id in existing_subs:
            sub_sec = existing_subs[sub_id]
            if hasattr(sub_sec, 'templateselectionsubsection'):
                sub_sec.templateselectionsubsection.attribute_group_id = attribute_group_id
                sub_sec.templateselectionsubsection.save()
            return self._update_base_fields(sub_sec, sub_data)

        if not attribute_group_id:
            raise serializers.ValidationError({
                "err_msg": f"Mục '{sub_data.get('name')}' bắt buộc chọn Nhóm Thuộc Tính."
            })

        return TemplateSelectionSubSection.objects.create(
            main_section=main_sec,
            attribute_group_id=attribute_group_id,
            **sub_data
        )

    def clone(self, old_sub, new_main):
        return TemplateSelectionSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            attribute_group_id=getattr(old_sub.templateselectionsubsection, 'attribute_group_id', None)
        )


SUB_SECTION_STRATEGIES = {
    'text': TextStrategy(),
    'table': TableStrategy(),
    'selection': SelectionStrategy(),
}