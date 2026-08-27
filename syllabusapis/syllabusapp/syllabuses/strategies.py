from rest_framework import serializers

from syllabuses.models import TemplateSelectionSubSection, TemplateTableSubSection, TemplateTextSubSection, \
    TemplateSubSection, SubSection, TextSubSection, TableSubSection, SelectionSubSection, ReferenceSubSection


class SubSectionStrategy:
    """Base Strategy cung cấp hàm tiện ích dùng chung"""

    def _get_base_data(self, sub_data):
        allowed_keys = ['name', 'code', 'position', 'type']
        return {k: sub_data[k] for k in allowed_keys if k in sub_data}

    def _update_base_fields(self, sub_sec, sub_data):
        for attr, value in sub_data.items():
            setattr(sub_sec, attr, value)
        sub_sec.save()
        return sub_sec

    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        pass

    def clone(self, old_sub, new_main):
        pass

    def update_syllabus(self, sub_instance, sub_data, syllabus_instance, serializer_instance):
        pass

    def init_syllabus_sub_section(self, tpl_sub, main_sec):
        return SubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position
        )


class DefaultStrategy(SubSectionStrategy):
    """Chiến lược mặc định cho các SubSection cơ bản (không có bảng con)"""

    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        base_data = self._get_base_data(sub_data)
        if sub_id and sub_id in existing_subs:
            return self._update_base_fields(existing_subs[sub_id], sub_data)
        return TemplateSubSection.objects.create(main_section=main_sec, **base_data)

    def clone(self, old_sub, new_main):
        return TemplateSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position
        )


class TextStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        display_mode = sub_data.pop('display_mode', None)
        place_holder = sub_data.pop('place_holder', None)
        base_data = self._get_base_data(sub_data)
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
            **base_data
        )

    def update_syllabus(self, sub_instance, sub_data, syllabus_instance, serializer_instance):
        if hasattr(sub_instance, 'textsubsection') and 'content' in sub_data:
            sub_instance.textsubsection.content = sub_data['content']
            sub_instance.textsubsection.requires_update = False
            sub_instance.textsubsection.save()

    def clone(self, old_sub, new_main):
        display_mode = ''
        place_holder = ''
        if hasattr(old_sub, 'templatetextsubsection'):
            display_mode = old_sub.templatetextsubsection.display_mode
            place_holder = old_sub.templatetextsubsection.place_holder

        return TemplateTextSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            display_mode=display_mode,
            place_holder=place_holder
        )

    def init_syllabus_sub_section(self, tpl_sub, main_sec):
        display_mode = tpl_sub.templatetextsubsection.display_mode if hasattr(tpl_sub, 'templatetextsubsection') else ''
        place_holder = tpl_sub.templatetextsubsection.place_holder if hasattr(tpl_sub, 'templatetextsubsection') else ''
        return TextSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            display_mode=display_mode, place_holder=place_holder
        )



class TableStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        table_schema = sub_data.pop('table_schema', None)
        base_data = self._get_base_data(sub_data)
        if sub_id and sub_id in existing_subs:
            sub_sec = existing_subs[sub_id]
            if hasattr(sub_sec, 'templatetablesubsection'):
                sub_sec.templatetablesubsection.table_schema = table_schema
                sub_sec.templatetablesubsection.save()
            return self._update_base_fields(sub_sec, sub_data)

        return TemplateTableSubSection.objects.create(
            main_section=main_sec,
            table_schema=table_schema,
            **base_data
        )

    def update_syllabus(self, sub_instance, sub_data, syllabus_instance, serializer_instance):
        if hasattr(sub_instance, 'tablesubsection') and 'table_schema' in sub_data:
            sub_instance.tablesubsection.data = sub_data['table_schema']
            sub_instance.tablesubsection.requires_update = False
            sub_instance.tablesubsection.save()

    def clone(self, old_sub, new_main):
        table_schema = None
        if hasattr(old_sub, 'templatetablesubsection'):
            table_schema = old_sub.templatetablesubsection.table_schema

        return TemplateTableSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            table_schema=table_schema
        )

    def init_syllabus_sub_section(self, tpl_sub, main_sec):
        table_cols = []
        if hasattr(tpl_sub, 'templatetablesubsection') and tpl_sub.templatetablesubsection.table_schema:
            table_cols = tpl_sub.templatetablesubsection.table_schema.get("columns", [])
        return TableSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            data={"columns": table_cols, "rows": []}
        )


class SelectionStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        attribute_group_id = sub_data.pop('attribute_group_id', None)
        base_data = self._get_base_data(sub_data)

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
            **base_data
        )

    def clone(self, old_sub, new_main):
        attribute_group_id = None
        if hasattr(old_sub, 'templateselectionsubsection'):
            attribute_group_id = old_sub.templateselectionsubsection.attribute_group_id

        return TemplateSelectionSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position,
            attribute_group_id=attribute_group_id
        )

    def update_syllabus(self, sub_instance, sub_data, syllabus_instance, serializer_instance):
        if hasattr(sub_instance, 'selectionsubsection') and 'selected_values' in sub_data:
            val_ids = [item['id'] if isinstance(item, dict) else item for item in sub_data['selected_values']]
            sub_instance.selectionsubsection.requires_update = False
            sub_instance.selectionsubsection.selected_values.set(val_ids)
            sub_instance.selectionsubsection.save()

    def init_syllabus_sub_section(self, tpl_sub, main_sec):
        attr_group_id = tpl_sub.templateselectionsubsection.attribute_group_id if hasattr(tpl_sub,
                                                                                          'templateselectionsubsection') else None
        return SelectionSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            attribute_group_id=attr_group_id
        )


class ReferenceStrategy(SubSectionStrategy):
    def upsert_template(self, main_sec, sub_data, existing_subs, sub_id):
        base_data = self._get_base_data(sub_data)

        if sub_id and sub_id in existing_subs:
            return self._update_base_fields(existing_subs[sub_id], sub_data)
        return TemplateSubSection.objects.create(main_section=main_sec, **base_data)

    def clone(self, old_sub, new_main):
        return TemplateSubSection.objects.create(
            name=old_sub.name, main_section=new_main, type=old_sub.type,
            code=old_sub.code, position=old_sub.position
        )

    def update_syllabus(self, sub_instance, sub_data, syllabus_instance, serializer_instance):
        if hasattr(sub_instance, 'referencesubsection'):
            ref_data = sub_data.get('reference_data')
            if ref_data is not None:
                ref_code = sub_instance.referencesubsection.reference_code

                strategy_map = {
                    'credit': serializer_instance._update_credit,
                    'requirement_subject': serializer_instance._update_requirement_subjects,
                    'objectives_and_outcomes': serializer_instance._update_objective_outcomes,
                    'course_learning_outcomes': serializer_instance._update_course_learning_outcomes,
                    'learning_material': serializer_instance._update_learning_material,
                    'assessment_method': serializer_instance._update_assessment,
                    'teaching_schedule': serializer_instance._update_teaching_schedule
                }

                update_func = strategy_map.get(ref_code)
                if update_func:
                    update_func(syllabus_instance, ref_data)

    def init_syllabus_sub_section(self, tpl_sub, main_sec):
        ref_code = tpl_sub.templatereferencesubsection.reference_code if hasattr(tpl_sub,
                                                                                 'templatereferencesubsection') else ''
        return ReferenceSubSection.objects.create(
            main_section=main_sec, code=tpl_sub.code, type=tpl_sub.type,
            name=tpl_sub.name, position=tpl_sub.position,
            reference_code=ref_code
        )


SUB_SECTION_STRATEGIES = {
    'text': TextStrategy(),
    'table': TableStrategy(),
    'selection': SelectionStrategy(),
    'reference': ReferenceStrategy(),
}