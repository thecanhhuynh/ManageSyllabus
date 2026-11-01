"""
handlers/renderers/base_sub_renderer.py

Lớp cơ sở trừu tượng cho tất cả các Sub-Renderer theo mô hình Sub-Renderer Pattern.
Tuân thủ Clean Code: SRP, Guard Clauses, file <= 150 dòng.
"""

from abc import ABC, abstractmethod
from docx import Document


class BaseSubRenderer(ABC):
    """Abstract base class cho tất cả các Sub-Renderer phụ trách từng khối tiểu mục."""

    @abstractmethod
    def can_render(self, sub_section: dict) -> bool:
        """Kiểm tra xem renderer này có quyền và khả năng render sub_section hay không."""
        pass

    @abstractmethod
    def render(self, doc: Document, sub_section: dict, context: dict) -> None:
        """Thực thi render dữ liệu của sub_section vào file DOCX."""
        pass
