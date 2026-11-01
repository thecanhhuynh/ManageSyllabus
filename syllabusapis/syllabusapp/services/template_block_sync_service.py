"""services/template_block_sync_service.py

Service đồng bộ hóa giữa TemplateSubSection và TemplateBlock.
Đảm bảo mọi tiểu mục (mặc định hoặc tự custom) luôn có TemplateBlock tương ứng.
Tuân thủ Clean Code: SRP, Guard Clauses, hàm <= 30 dòng, Soft Delete.
"""

from xml.sax.saxutils import escape
from django.db import transaction
from django.db.models import Q
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


class TemplateBlockSyncService:
    """Đồng bộ hóa tự động từ TemplateSubSection sang TemplateBlock."""

    @classmethod
    def sync_blocks_for_template(cls, template: TemplateSyllabus) -> list[TemplateBlock]:
        if not template or not getattr(template, "id", None):
            return []

        sub_sections = list(
            TemplateSubSection.objects.filter(
                main_section__template=template
            ).order_by("main_section__position", "position", "id")
        )

        with transaction.atomic():
            existing_blocks = list(TemplateBlock.objects.filter(template=template))
            block_map = cls._index_existing_blocks(existing_blocks)
            active_block_ids = []

            for idx, sub in enumerate(sub_sections, start=1):
                block = cls._sync_single_subsection(template, sub, idx, block_map)
                active_block_ids.append(block.id)

            cls._soft_delete_orphans(existing_blocks, active_block_ids)

        return list(TemplateBlock.objects.filter(template=template, is_active=True).order_by("position"))

    @staticmethod
    def _index_existing_blocks(existing_blocks: list[TemplateBlock]) -> dict[str, TemplateBlock]:
        indexed = {}
        for b in existing_blocks:
            cfg_code = (b.config or {}).get("code")
            if cfg_code:
                indexed[cfg_code] = b
            if b.code:
                indexed[b.code] = b
            if b.name:
                indexed[b.name] = b
        return indexed

    @classmethod
    def _sync_single_subsection(
        cls,
        template: TemplateSyllabus,
        sub: TemplateSubSection,
        position: int,
        block_map: dict[str, TemplateBlock],
    ) -> TemplateBlock:
        block = block_map.get(sub.code) or block_map.get(sub.name)
        if block:
            return cls._update_existing_block(block, sub, position)

        return cls._create_new_block(template, sub, position)

    @staticmethod
    def _build_config(sub: TemplateSubSection) -> dict:
        cfg = {"code": sub.code, "table_code": sub.code}
        if hasattr(sub, "templatetablesubsection") and sub.templatetablesubsection.table_schema:
            cfg["table_schema"] = sub.templatetablesubsection.table_schema
        if hasattr(sub, "templateselectionsubsection") and sub.templateselectionsubsection.attribute_group_id:
            cfg["attribute_group_id"] = sub.templateselectionsubsection.attribute_group_id
        return cfg

    @classmethod
    def _update_existing_block(
        cls, block: TemplateBlock, sub: TemplateSubSection, position: int
    ) -> TemplateBlock:
        cfg = block.config or {}
        new_cfg = cls._build_config(sub)
        cfg_updated = False
        for k, v in new_cfg.items():
            if cfg.get(k) != v:
                cfg[k] = v
                cfg_updated = True

        block.name = sub.name
        block.position = position
        block.is_active = True
        update_fields = ["name", "position", "is_active"]
        if cfg_updated:
            block.config = cfg
            update_fields.append("config")

        block.save(update_fields=update_fields)
        return block

    @classmethod
    def _create_new_block(
        cls, template: TemplateSyllabus, sub: TemplateSubSection, position: int
    ) -> TemplateBlock:
        block_type = cls._resolve_block_type(sub.type)
        ref_class = REFERENCE_CLASS_MAP.get(sub.code) if block_type == "reference" else None
        xml_tpl = cls._build_default_xml(block_type, sub.code, sub.name)
        code = sub.code if sub.code else f"BLOCK_{template.id}_{position:03d}"
        config = cls._build_config(sub)

        return TemplateBlock.objects.create(
            template=template,
            code=code,
            name=sub.name,
            block_type=block_type,
            xml_template=xml_tpl,
            style_config={},
            reference_class=ref_class,
            config=config,
            position=position,
            is_active=True,
        )

    @staticmethod
    def _resolve_block_type(sub_type: str | None) -> str:
        valid_types = {"text", "selection", "table", "reference"}
        normalized = (sub_type or "").strip().lower()
        if normalized in valid_types:
            return normalized
        return "text"

    @staticmethod
    def _build_default_xml(sub_type: str, code: str, name: str) -> str:
        safe_name = escape(name or code or "")
        safe_code = code or "field"
        if sub_type == "reference":
            return f'<w:p><w:r><w:t>{{{{REF:{safe_code}}}}}</w:t></w:r></w:p>'
        if sub_type == "table":
            return f'<w:p><w:r><w:t>{{{{TABLE:{safe_code}}}}}</w:t></w:r></w:p>'
        return (
            f'<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>{safe_name}: </w:t></w:r>'
            f'<w:r><w:t>{{{{{safe_code}}}}}</w:t></w:r></w:p>'
        )

    @staticmethod
    def _soft_delete_orphans(
        existing_blocks: list[TemplateBlock], active_block_ids: list[int]
    ) -> None:
        active_ids_set = set(active_block_ids)
        for b in existing_blocks:
            if b.id in active_ids_set or not b.is_active:
                continue
            b.is_active = False
            b.save(update_fields=["is_active"])
