"""Credit rendering strategies and manager."""
from abc import ABC, abstractmethod
from docx import Document
from syllabuses.models import Syllabus, TemplateBlock
from .table_manager import TableManager


class CreditRenderStrategy(ABC):
    """Abstract base strategy cho việc render thông tin tín chỉ."""

    @abstractmethod
    def render(
        self,
        doc: Document,
        sub_section: dict,
        new_paras: list,
        new_tables: list,
        custom_columns: list[dict] | None = None,
        syllabus: Syllabus | None = None,
        label_overrides: dict | None = None,
    ) -> tuple[list, list]:
        pass

    @staticmethod
    def _clear_previous_elements(new_paras: list, new_tables: list) -> None:
        for t in new_tables:
            t._element.getparent().remove(t._element)
        for p in new_paras:
            p._element.getparent().remove(p._element)

    @staticmethod
    def _extract_credit_data(sub_section: dict, label_overrides: dict | None = None) -> dict:
        ref_data = sub_section.get("reference_data") or {}
        th = int(ref_data.get("number_theory") or 0)
        pr = int(ref_data.get("number_practice") or 0)
        st = int(ref_data.get("hour_self_study") or 0)
        tot = th + pr

        cr_labels = (label_overrides or {}).get("credit", {})
        lbl_tot = cr_labels.get("credit_total") or "Tổng số"
        lbl_th = cr_labels.get("number_theory") or "Lý thuyết"
        lbl_pr = cr_labels.get("number_practice") or "Thực hành"
        lbl_st = cr_labels.get("hour_self_study") or "Số giờ tự học"

        return {
            "total": tot,
            "theory": th,
            "practice": pr,
            "self_study": st,
            "lbl_total": lbl_tot,
            "lbl_theory": lbl_th,
            "lbl_practice": lbl_pr,
            "lbl_self_study": lbl_st,
            "id": ref_data.get("id"),
        }

    @staticmethod
    def _extract_custom_items(
        custom_columns: list[dict] | None,
        syllabus: Syllabus | None,
        credit_id: str | None,
    ) -> list[tuple[str, str]]:
        if not custom_columns:
            return []
        items = []
        target_id = str(credit_id or 1)
        for col in custom_columns:
            lbl = col.get("column_label") or col.get("column_key") or "Tùy biến"
            val = TableManager._resolve_custom_value(col, syllabus, target_id)
            if val:
                items.append((lbl, str(val)))
        return items


class CreditTableStrategy(CreditRenderStrategy):
    """Chiến lược render thông tin tín chỉ dạng Bảng (TABLE)."""

    def render(
        self,
        doc: Document,
        sub_section: dict,
        new_paras: list,
        new_tables: list,
        custom_columns: list[dict] | None = None,
        syllabus: Syllabus | None = None,
        label_overrides: dict | None = None,
    ) -> tuple[list, list]:
        return new_paras, new_tables


class CreditInlineTextStrategy(CreditRenderStrategy):
    """Chiến lược Mẫu 1: Dòng văn bản câu tóm tắt học thuật (INLINE)."""

    def render(
        self,
        doc: Document,
        sub_section: dict,
        new_paras: list,
        new_tables: list,
        custom_columns: list[dict] | None = None,
        syllabus: Syllabus | None = None,
        label_overrides: dict | None = None,
    ) -> tuple[list, list]:
        self._clear_previous_elements(new_paras, new_tables)
        data = self._extract_credit_data(sub_section, label_overrides)
        custom_items = self._extract_custom_items(custom_columns, syllabus, data["id"])

        custom_text = ""
        if custom_items:
            custom_text = ", " + ", ".join(f"{lbl}: {val}" for lbl, val in custom_items)

        p = doc.add_paragraph()
        p.add_run("• ")
        r_tot = p.add_run(f"{data['lbl_total']}: ")
        r_tot.bold = True
        p.add_run(f"{data['total']} tín chỉ ")

        details = (
            f"({data['lbl_theory']}: {data['theory']}, "
            f"{data['lbl_practice']}: {data['practice']}, "
            f"{data['lbl_self_study']}: {data['self_study']} giờ{custom_text})"
        )
        p.add_run(details)
        return [p], []


class CreditBulletTextStrategy(CreditRenderStrategy):
    """Chiến lược Mẫu 2: Danh sách gạch đầu dòng (BULLET)."""

    def render(
        self,
        doc: Document,
        sub_section: dict,
        new_paras: list,
        new_tables: list,
        custom_columns: list[dict] | None = None,
        syllabus: Syllabus | None = None,
        label_overrides: dict | None = None,
    ) -> tuple[list, list]:
        self._clear_previous_elements(new_paras, new_tables)
        data = self._extract_credit_data(sub_section, label_overrides)
        custom_items = self._extract_custom_items(custom_columns, syllabus, data["id"])

        items = [
            (data["lbl_total"], f"{data['total']} tín chỉ"),
            (data["lbl_theory"], f"{data['theory']} tín chỉ"),
            (data["lbl_practice"], f"{data['practice']} tín chỉ"),
            (data["lbl_self_study"], f"{data['self_study']} giờ"),
        ]
        items.extend(custom_items)

        created_paras = []
        for label, val in items:
            p = doc.add_paragraph()
            p.add_run("• ")
            r_label = p.add_run(f"{label}: ")
            r_label.bold = True
            p.add_run(str(val))
            created_paras.append(p)
        return created_paras, []


class CreditManager:
    """Bộ điều phối render thông tin số tín chỉ áp dụng Strategy Pattern."""

    _STRATEGIES: dict[str, CreditRenderStrategy] = {
        "TABLE": CreditTableStrategy(),
        "TEXT_INLINE": CreditInlineTextStrategy(),
        "TEXT_BULLET": CreditBulletTextStrategy(),
        "TEXT": CreditInlineTextStrategy(),
    }

    @classmethod
    def render(
        cls,
        doc: Document,
        block: TemplateBlock,
        sub_section: dict,
        new_paras: list,
        new_tables: list,
        custom_columns: list[dict] | None = None,
        syllabus: Syllabus | None = None,
        label_overrides: dict | None = None,
    ) -> tuple[list, list]:
        cfg = block.config or {}
        disp_type = str(cfg.get("display_type", "TABLE")).upper()
        if disp_type == "TABLE":
            strategy = cls._STRATEGIES["TABLE"]
        else:
            fmt = str(cfg.get("text_format", "INLINE")).upper()
            strategy_key = f"TEXT_{fmt}"
            strategy = cls._STRATEGIES.get(strategy_key, cls._STRATEGIES["TEXT"])

        return strategy.render(
            doc,
            sub_section,
            new_paras,
            new_tables,
            custom_columns=custom_columns,
            syllabus=syllabus,
            label_overrides=label_overrides,
        )

