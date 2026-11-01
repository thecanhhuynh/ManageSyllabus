"""handlers/renderers/simple/text_renderer.py

Sub-Renderer generic xử lý các tiểu mục kiểu văn bản (Text Sub-Sections).
Hỗ trợ cả trường mặc định và các tiểu mục tùy chỉnh thêm mới 100% dynamic.
"""

import re
from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class TextSubRenderer(BaseSubRenderer):
    """Render các trường văn bản theo format chung vào tài liệu DOCX."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        return sub_section.get("type") == "text"

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        if not doc or not sub_section or not context:
            return

        content = (sub_section.get("content") or "").strip()
        if not content:
            return

        if self._update_existing_paragraph(doc, sub_section, content):
            return

        self._append_new_paragraph(doc, sub_section, content)

    @staticmethod
    def _get_match_targets(sub_section: dict) -> list[str]:
        name = (sub_section.get("name") or "").strip()
        code = (sub_section.get("code") or "").strip()
        targets = []
        if name:
            targets.append(name)
        if code:
            targets.extend([f"{{{{{code}}}}}", f"{{{{{code.lower()}}}}}", f"{{{{{code.upper()}}}}}"])
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
