import base64
import os
import time
from django.core.files.base import ContentFile
from django.utils import timezone
from syllabuses.models import Lecturer, Syllabus, SyllabusSignature

ROLE_TITLE_MAP = {
    Lecturer.FacultyRole.DEAN: "TRƯỞNG KHOA",
    Lecturer.FacultyRole.VICE_DEAN: "PHÓ TRƯỞNG KHOA",
    Lecturer.FacultyRole.HEAD_OF_DEPT: "TRƯỞNG BỘ MÔN",
    Lecturer.FacultyRole.LECTURER: "GIẢNG VIÊN BIÊN SOẠN",
}


class SignatureService:
    @classmethod
    def decode_base64_image(cls, data_str: str, prefix: str = "sig") -> ContentFile | None:
        return cls.process_signature_image(data_str, prefix=prefix)

    @classmethod
    def process_signature_image(cls, raw_input, prefix: str = "sig") -> ContentFile | None:
        if not raw_input:
            return None
        import io
        from PIL import Image

        img_bytes = None
        if hasattr(raw_input, "read"):
            try:
                raw_input.seek(0)
                img_bytes = raw_input.read()
            except Exception:
                pass
        elif isinstance(raw_input, str) and raw_input.strip():
            data_str = raw_input
            if "base64," in data_str:
                data_str = data_str.split("base64,")[1]
            try:
                img_bytes = base64.b64decode(data_str)
            except Exception:
                return None

        if not img_bytes:
            return None

        try:
            im = Image.open(io.BytesIO(img_bytes))
            im_rgba = cls._ensure_transparent_background(im)
            im_cropped = cls._crop_signature_padding(im_rgba)

            buffer = io.BytesIO()
            im_cropped.save(buffer, format="PNG", optimize=True)
            filename = f"{prefix}_{int(time.time())}.png"
            return ContentFile(buffer.getvalue(), name=filename)
        except Exception:
            filename = f"{prefix}_{int(time.time())}.png"
            return ContentFile(img_bytes, name=filename)

    @staticmethod
    def _ensure_transparent_background(im) -> "Image":
        rgba = im.convert("RGBA")
        extrema = rgba.getextrema()
        if len(extrema) == 4 and extrema[3][0] < 200:
            return rgba

        datas = rgba.getdata()
        new_data = []
        for r, g, b, a in datas:
            min_c = min(r, g, b)
            max_c = max(r, g, b)
            is_neutral_light = min_c > 165 and (max_c - min_c) < 35
            if is_neutral_light:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
        rgba.putdata(new_data)
        return rgba

    @staticmethod
    def _crop_signature_padding(im, padding: int = 10) -> "Image":
        bbox = im.getbbox()
        if not bbox:
            return im
        w, h = im.size
        crop_box = (
            max(0, bbox[0] - padding),
            max(0, bbox[1] - padding),
            min(w, bbox[2] + padding),
            min(h, bbox[3] + padding),
        )
        return im.crop(crop_box)

    @classmethod
    def can_sign(cls, user, syllabus: Syllabus, role: str) -> tuple[bool, str]:
        if not user or not user.is_authenticated:
            return False, "Yêu cầu đăng nhập."
        if user.is_superuser:
            return True, ""
        lecturer = getattr(user, "lecturer_profile", None)
        if not lecturer:
            return False, "Tài khoản chưa được liên kết hồ sơ giảng viên."
        if role == SyllabusSignature.SignatureRole.LECTURER:
            return cls._can_sign_as_lecturer(lecturer, syllabus)
        if role == SyllabusSignature.SignatureRole.FACULTY_DEAN:
            return cls._can_sign_as_dean(lecturer, syllabus)
        return False, "Vai trò ký không hợp lệ."

    @classmethod
    def validate_syllabus_completeness(cls, syllabus: Syllabus) -> tuple[bool, list[str]]:
        missing = []
        missing.extend(cls._validate_reference_sections(syllabus))
        missing.extend(cls._validate_content_sections(syllabus))
        return len(missing) == 0, missing

    @classmethod
    def _validate_reference_sections(cls, syllabus: Syllabus) -> list[str]:
        from syllabuses.models import (
            Assessment,
            CourseLearningOutcome,
            CourseObjective,
            Credit,
            Method,
            TeachingSession,
        )

        missing = []
        if not TeachingSession.objects.filter(syllabus=syllabus).exists():
            missing.append("Kế hoạch giảng dạy (chưa có buổi học nào)")

        methods = Method.objects.filter(assessment__syllabus=syllabus)
        total_weight = sum(m.weight for m in methods if m.weight is not None)
        if not methods.exists() or total_weight != 100:
            missing.append(f"Phương pháp đánh giá (tổng trọng số = {total_weight}%, yêu cầu 100%)")

        if not CourseObjective.objects.filter(syllabus=syllabus).exists():
            missing.append("Mục tiêu môn học (CO)")
        if not CourseLearningOutcome.objects.filter(course_objective__syllabus=syllabus).exists():
            missing.append("Chuẩn đầu ra môn học (CLO)")

        credit = Credit.objects.filter(subject=syllabus.subject).first()
        if not credit or (credit.number_theory + credit.number_practice <= 0):
            missing.append("Số tín chỉ môn học")

        if not syllabus.learning_materials_rel.exists():
            missing.append("Tài liệu học tập / Giáo trình tham khảo")
        return missing

    @classmethod
    def _validate_content_sections(cls, syllabus: Syllabus) -> list[str]:
        from syllabuses.models import SelectionSubSection, TableSubSection, TextSubSection

        missing = []
        for ms in syllabus.main_sections.all():
            for sub in ms.sub_sections.all():
                item_err = cls._check_single_subsection(sub)
                if item_err:
                    missing.append(item_err)
        return missing

    @staticmethod
    def _check_single_subsection(sub) -> str | None:
        from syllabuses.models import SelectionSubSection, TableSubSection, TextSubSection

        label = sub.name or sub.code
        if sub.type == "text":
            t = getattr(sub, "textsubsection", None) or TextSubSection.objects.filter(id=sub.id).first()
            if not t or not t.content or not t.content.strip():
                return f"Mục văn bản: {label}"
        if sub.type == "selection":
            sel = getattr(sub, "selectionsubsection", None) or SelectionSubSection.objects.filter(id=sub.id).first()
            if not sel or not sel.selected_values.exists():
                return f"Mục lựa chọn: {label}"
        if sub.type == "table":
            tbl = getattr(sub, "tablesubsection", None) or TableSubSection.objects.filter(id=sub.id).first()
            rows = tbl.data.get("rows", []) if tbl and isinstance(tbl.data, dict) else []
            if not rows:
                return f"Bảng dữ liệu: {label}"
        return None

    @classmethod
    def _can_sign_as_lecturer(cls, lecturer: Lecturer, syllabus: Syllabus) -> tuple[bool, str]:
        if syllabus.lecturer_id != lecturer.id:
            return False, "Bạn không phải giảng viên phụ trách đề cương này."
        is_complete, missing_items = cls.validate_syllabus_completeness(syllabus)
        if not is_complete:
            missing_msg = "; ".join(missing_items)
            return False, f"Đề cương chưa thể gửi ký do còn mục chưa hoàn thành: {missing_msg}."
        return True, ""

    @staticmethod
    def _can_sign_as_dean(lecturer: Lecturer, syllabus: Syllabus) -> tuple[bool, str]:
        if syllabus.faculty_id != lecturer.faculty_id:
            return False, "Bạn không thuộc Khoa quản lý đề cương này."
        if not lecturer.is_leader:
            return False, "Tài khoản không có vai trò Lãnh đạo Khoa."
        if syllabus.lecturer_id == lecturer.id:
            return False, "Bạn là giảng viên biên soạn đề cương này nên không thể tự phê duyệt theo quy định BR-04."
        return True, ""

    @classmethod
    def sign_syllabus(
        cls, user, syllabus: Syllabus, role: str, image_raw=None, title: str | None = None
    ) -> tuple[SyllabusSignature | None, str]:
        allowed, err_msg = cls.can_sign(user, syllabus, role)
        if not allowed:
            return None, err_msg
        image_file = cls._resolve_signature_image(user, image_raw)
        if not image_file:
            return None, "Vui lòng cung cấp chữ ký hoặc cài đặt chữ ký cá nhân trước."

        lecturer = getattr(user, "lecturer_profile", None)
        signer_title = title or cls._resolve_signer_title(lecturer, role, syllabus)
        signer_name = cls._format_signer_name(user)

        sig, _ = SyllabusSignature.objects.update_or_create(
            syllabus=syllabus,
            role=role,
            defaults={
                "signer": user,
                "signer_name": signer_name,
                "signer_title": signer_title,
                "signature_image": image_file,
                "status": SyllabusSignature.SignatureStatus.SIGNED,
                "is_active": True,
            },
        )
        cls._advance_syllabus_status(syllabus, role, user)
        return sig, ""

    @classmethod
    def _resolve_signature_image(cls, user, image_raw):
        if hasattr(image_raw, "read"):
            return image_raw
        if isinstance(image_raw, str) and image_raw.strip():
            decoded = cls.decode_base64_image(image_raw)
            if decoded:
                return decoded
        lecturer = getattr(user, "lecturer_profile", None)
        if lecturer and lecturer.signature_image:
            return lecturer.signature_image
        return None

    @classmethod
    def _resolve_signer_title(cls, lecturer: Lecturer | None, role: str, syllabus: Syllabus) -> str:
        fac_name = syllabus.faculty.name.upper() if syllabus.faculty else ""
        clean_fac = fac_name[5:].strip() if fac_name.startswith("KHOA ") else fac_name.strip()
        if role == SyllabusSignature.SignatureRole.LECTURER:
            return "GIẢNG VIÊN BIÊN SOẠN"
        if not lecturer:
            return f"PHỤ TRÁCH KHOA {clean_fac}".strip()
        title_prefix = ROLE_TITLE_MAP.get(lecturer.faculty_role, "LÃNH ĐẠO KHOA")
        return f"{title_prefix} {clean_fac}".strip()

    @staticmethod
    def _format_signer_name(user) -> str:
        name = f"{user.last_name} {user.first_name}".strip()
        return name if name else user.username

    @staticmethod
    def _advance_syllabus_status(syllabus: Syllabus, role: str, user=None) -> None:
        if role == SyllabusSignature.SignatureRole.LECTURER and syllabus.status != Syllabus.Status.APPROVED:
            syllabus.status = Syllabus.Status.SUBMITTED
            syllabus.save(update_fields=["status"])
        elif role == SyllabusSignature.SignatureRole.FACULTY_DEAN:
            syllabus.status = Syllabus.Status.APPROVED
            if user:
                syllabus.approved_by = user
                syllabus.approved_date = timezone.now()
                syllabus.save(update_fields=["status", "approved_by", "approved_date"])
            else:
                syllabus.save(update_fields=["status"])
