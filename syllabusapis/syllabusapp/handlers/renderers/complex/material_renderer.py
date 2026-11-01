"""
handlers/renderers/complex/material_renderer.py

Sub-Renderer xử lý mục Học liệu (Textbooks & Learning Materials).
"""

from docx import Document
from handlers.renderers.base_sub_renderer import BaseSubRenderer


class MaterialSubRenderer(BaseSubRenderer):
    """Điền danh mục Sách giáo trình và Sách tham khảo vào phần Học liệu."""

    def can_render(self, sub_section: dict) -> bool:
        if not isinstance(sub_section, dict):
            return False
        code = (sub_section.get("code") or "").strip().lower()
        return code in {"learning_material", "learning_materials"}

    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        ref_data = sub_section.get("reference_data")
        if not ref_data or not isinstance(ref_data, list):
            return

        textbooks, refs = self._categorize_materials(ref_data)
        if not self._update_textbooks(doc, textbooks) and textbooks:
            self._create_section(doc, "Giáo trình / Textbooks", textbooks)

        if not self._update_references(doc, refs) and refs:
            self._create_section(doc, "Tài liệu tham khảo / Other Materials", refs)

    @staticmethod
    def _categorize_materials(items: list) -> tuple:
        textbooks, refs = [], []
        for it in items:
            name = (it.get("name") or "").strip()
            type_obj = it.get("type_material") or {}
            type_name = type_obj.get("name", "").lower() if isinstance(type_obj, dict) else ""
            if "giáo trình" in type_name or "textbook" in type_name:
                textbooks.append(name)
            else:
                refs.append(name)
        return textbooks, refs

    @staticmethod
    def _update_textbooks(doc: Document, items: list) -> bool:
        if not items:
            return True
        for idx, p in enumerate(doc.paragraphs):
            t = p.text.strip().lower()
            if "giáo trình" not in t and "textbooks" not in t:
                continue
            if idx + 1 < len(doc.paragraphs):
                lines = [f"[{i}]. {name}" for i, name in enumerate(items, start=1)]
                doc.paragraphs[idx + 1].text = "\n".join(lines)
            return True
        return False

    @staticmethod
    def _update_references(doc: Document, items: list) -> bool:
        if not items:
            return True
        for idx, p in enumerate(doc.paragraphs):
            t = p.text.strip().lower()
            if "tài liệu tham khảo" not in t and "other materials" not in t:
                continue
            if idx + 1 < len(doc.paragraphs):
                lines = [f"[{i}]. {name}" for i, name in enumerate(items, start=1)]
                doc.paragraphs[idx + 1].text = "\n".join(lines)
            return True
        return False

    @staticmethod
    def _create_section(doc: Document, title: str, items: list) -> None:
        p = doc.add_paragraph()
        p.add_run(f"• {title}:").bold = True
        for i, name in enumerate(items, start=1):
            doc.add_paragraph(f"[{i}]. {name}")
