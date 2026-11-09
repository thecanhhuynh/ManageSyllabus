"""Lecturer rendering strategies and manager."""
from abc import ABC, abstractmethod
from docx import Document
from docx.shared import Inches
from syllabuses.models import Syllabus, TemplateBlock
from .table_manager import TableManager


class LecturerRenderStrategy(ABC):
    """Abstract base strategy cho việc render thông tin giảng viên."""

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
    def _extract_lecturer_items(sub_section: dict, label_overrides: dict | None = None) -> list[tuple[str, str]]:
        ref_data = sub_section.get("reference_data") or {}
        first = (ref_data.get("first_name") or "").strip()
        last = (ref_data.get("last_name") or "").strip()
        lecturer = f"{last} {first}".strip() or first or "-"
        lec_labels = (label_overrides or {}).get("lecturer_info", {})
        return [
            (lec_labels.get("faculty") or "Khoa/Bộ môn", (ref_data.get("faculty") or "").strip() or "-"),
            (lec_labels.get("lecturer") or "Giảng viên", lecturer),
            (lec_labels.get("email") or "Email", (ref_data.get("email") or "").strip() or "-"),
            (lec_labels.get("room") or "Phòng", (ref_data.get("room") or "").strip() or "-"),
        ]

    @staticmethod
    def _clear_previous_elements(new_paras: list, new_tables: list) -> None:
        for t in new_tables:
            t._element.getparent().remove(t._element)
        for p in new_paras:
            p._element.getparent().remove(p._element)


class LecturerTableStrategy(LecturerRenderStrategy):
    """Chiến lược render thông tin giảng viên dạng Bảng 2 cột (TABLE)."""

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
        if new_tables:
            return new_paras, new_tables

        for p in new_paras:
            p._element.getparent().remove(p._element)

        table = doc.add_table(rows=0, cols=2)
        table.style = "Table Grid"
        table.autofit = False

        rows_data = self._extract_lecturer_items(sub_section, label_overrides)
        col_widths = (Inches(2.275), Inches(4.225))
        for label, val in rows_data:
            row = table.add_row()
            row.cells[0].text = label
            row.cells[1].text = val
            row.cells[0].width = col_widths[0]
            row.cells[1].width = col_widths[1]

        for idx, w in enumerate(col_widths):
            table.columns[idx].width = w
        return [], [table]


class LecturerTextStrategy(LecturerRenderStrategy):
    """Chiến lược render thông tin giảng viên dạng Văn bản bullet (TEXT)."""

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

        items = self._extract_lecturer_items(sub_section, label_overrides)
        ref_data = sub_section.get("reference_data") or {}
        if custom_columns:
            for col in custom_columns:
                lbl = col.get("column_label") or col.get("column_key") or "Tùy biến"
                val = TableManager._resolve_custom_value(
                    col, syllabus, str(ref_data.get("id") or 1)
                )
                items.append((lbl, val))

        created_paras = []
        for label, val in items:
            p = doc.add_paragraph()
            p.add_run("• ")
            r_label = p.add_run(f"{label}: ")
            r_label.bold = True
            p.add_run(str(val))
            created_paras.append(p)
        return created_paras, []


class LecturerManager:
    """Bộ điều phối render thông tin giảng viên áp dụng Strategy Pattern."""

    _STRATEGIES: dict[str, LecturerRenderStrategy] = {
        "TABLE": LecturerTableStrategy(),
        "TEXT": LecturerTextStrategy(),
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
        disp_type = cfg.get("display_type")
        if disp_type is None and new_paras and not new_tables:
            return new_paras, new_tables
        strategy = cls._STRATEGIES.get(str(disp_type or "TABLE").upper(), cls._STRATEGIES["TABLE"])
        return strategy.render(
            doc,
            sub_section,
            new_paras,
            new_tables,
            custom_columns=custom_columns,
            syllabus=syllabus,
            label_overrides=label_overrides,
        )
