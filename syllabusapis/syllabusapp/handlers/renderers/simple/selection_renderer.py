"""handlers/renderers/simple/selection_renderer.py

Sub-Renderer generic xử lý các tiểu mục dạng ô chọn (Selection Sub-Sections).
Hỗ trợ cả trường mặc định lẫn các danh mục tùy biến thêm mới 100% dynamic.
"""

import re
from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class SelectionSubRenderer(BaseSubRenderer):
    """Render các tiểu mục selection vào tài liệu DOCX."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        return sub_section.get("type") == "selection"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        if not doc or not sub_section or not context:
            return

        val_str = self._extract_display_value(sub_section)
        if not val_str:
            return

        code = (sub_section.get("code") or "").strip().lower()
        if code == "teaching_methods" and self._try_render_teaching_checkboxes(doc, sub_section):
            return

        if self._update_existing_paragraph(doc, sub_section, val_str):
            return

        self._append_new_paragraph(doc, sub_section, val_str)

    @staticmethod
    def _extract_display_value(sub_section: dict) -> str:
        selected = sub_section.get("selected_values") or []
        names = [
            s.get("name_value", "").strip()
            for s in selected
            if isinstance(s, dict) and s.get("name_value")
        ]
        if names:
            return ", ".join(names)
        return (sub_section.get("content") or "").strip()

    @staticmethod
    def _try_render_teaching_checkboxes(doc: Document, sub_section: dict) -> bool:
        selected = sub_section.get("selected_values") or []
        names = [
            s.get("name_value", "").strip()
            for s in selected
            if isinstance(s, dict) and s.get("name_value")
        ]
        is_ftf = any("trực tiếp" in n.lower() or "face-to-face" in n.lower() for n in names)
        is_online = any("trực tuyến" in n.lower() or "online" in n.lower() for n in names)
        is_blended = any("kết hợp" in n.lower() or "blended" in n.lower() for n in names)

        for idx, p in enumerate(doc.paragraphs[:30]):
            t = p.text
            if "Phương thức giảng dạy" not in t and "Mode of delivery" not in t:
                continue
            if idx + 1 < len(doc.paragraphs):
                m_ftf = "x" if is_ftf else "☐"
                m_on = "x" if is_online else "☐"
                m_bl = "x" if is_blended else "☐"
                doc.paragraphs[idx + 1].text = (
                    f"{m_ftf}\tTrực tiếp/FTF\t        {m_on}\tTrực tuyến/Online\t{m_bl}\tKết hợp/Blended"
                )
                return True
        return False

    @staticmethod
    def _get_match_targets(sub_section: dict) -> list[str]:
        name = (sub_section.get("name") or "").strip()
        code = (sub_section.get("code") or "").strip()
        targets = []
        if name:
            targets.append(name)
        if code:
            targets.extend([f"{{{{{code}}}}}", f"{{{{{code.lower()}}}}}", f"{{{{{code.upper()}}}}}" ])
        return targets

    @staticmethod
    def _matches_paragraph(p_text: str, targets: list[str]) -> bool:
        clean_text = p_text.strip().lower()
        for target in targets:
            if target.lower() in clean_text:
                return True
        return False

    @staticmethod
    def _apply_content_to_paragraph(p, sub_section: dict, content: str) -> None:
        code = (sub_section.get("code") or "").strip()
        if code:
            for ph in (f"{{{{{code}}}}}", f"{{{{{code.lower()}}}}}", f"{{{{{code.upper()}}}}}"):
                if ph in p.text:
                    p.text = p.text.replace(ph, content)
                    return

        leading_ws = p.text[: len(p.text) - len(p.text.lstrip())]
        if ":" in p.text:
            prefix = p.text.split(":", 1)[0].strip() + ": "
            p.text = f"{leading_ws}{prefix}{content}"
            return

        p.text = f"{leading_ws}{p.text.strip()}: {content}"

    def _update_existing_paragraph(
        self, doc: Document, sub_section: dict, content: str
    ) -> bool:
        targets = self._get_match_targets(sub_section)
        if not targets:
            return False

        for p in doc.paragraphs:
            if not self._matches_paragraph(p.text, targets):
                continue
            self._apply_content_to_paragraph(p, sub_section, content)
            return True

        return False

    @staticmethod
    def _append_new_paragraph(doc: Document, sub_section: dict, content: str) -> None:
        name = (sub_section.get("name") or "").strip()
        position = sub_section.get("position")

        label = name
        if position and not re.match(r"^\d+[\.\)\-]\s+", name):
            label = f"{position}. {name}"

        p = doc.add_paragraph()
        if label:
            suffix = " " if label.endswith(":") else ": "
            run_title = p.add_run(f"{label}{suffix}")
            run_title.bold = True
        p.add_run(content)
