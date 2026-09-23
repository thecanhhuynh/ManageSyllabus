
class SyllabusDataMapper:
    """
    Class chuyên trách ánh xạ dữ liệu từ Syllabus ORM sang Dictionary.
    Sử dụng cơ chế Reflection (tự động quét Model Fields & Relations)
    để không phải hardcode cấu hình mapping.
    """
    IGNORED_FIELDS = {
        "password",
        "session_auth_hash",
        "session_auth_fallback_hash",
        "constraints",
        "deferred_fields",
        "all_permissions",
        "group_permissions",
        "user_permissions",
    }

    def __init__(self, syllabus):
        self.syllabus = syllabus

    def _is_direct_relation(self, field) -> bool:
        return field.is_relation and (field.many_to_one or field.one_to_one)

    def _get_related_instance(self, instance, field):
        return getattr(instance, field.name, None)

    def _get_relation_fields(self, instance):
        return (
            field
            for field in instance._meta.fields
            if self._is_direct_relation(field)
        )

    def _extract_basic_fields(self, instance, prefix: str) -> dict:
        result = {}
        for field in instance._meta.fields:
            if field.name in self.IGNORED_FIELDS or field.is_relation:
                continue
            value = getattr(instance, field.name, None)
            if value is None:
                continue
            key = f"{prefix}{field.name.upper()}"
            result[key] = str(value)
        return result

    def _extract_instance_methods(self, instance, prefix: str) -> dict:
        result = {}
        model_methods = vars(type(instance))
        for attr_name, attr in model_methods.items():
            if not attr_name.startswith("get_"):
                continue
            if "auth_hash" in attr_name or "session_auth" in attr_name:
                continue
            if not callable(attr):
                continue
            method = getattr(instance, attr_name)
            value = self._call_method_safely(method)
            if value is None:
                continue
            key_suffix = attr_name.removeprefix("get_").upper()
            key = f"{prefix}{key_suffix}"
            result[key] = str(value)
        return result

    def _call_method_safely(self, method):
        try:
            return method()
        except TypeError:
            return None

    def _inspect_instance(self, instance, prefix: str) -> dict:
        if not instance:
            return {}
        result = {}
        result.update(self._extract_basic_fields(instance, prefix))
        result[prefix.rstrip("_")] = str(instance)
        result.update(self._extract_instance_methods(instance, prefix))
        return result

    def _extract_nested_relations(self, instance, parent_prefix: str) -> dict:
        result = {}
        for field in self._get_relation_fields(instance):
            related_instance = self._get_related_instance(instance, field)
            if not related_instance:
                continue
            prefix = f"{parent_prefix}{field.name.upper()}_"
            result.update(self._inspect_instance(related_instance, prefix))
        return result

    def _extract_model_attributes(self, syllabus) -> dict:
        """Quét tự động toàn bộ thuộc tính và quan hệ (SCALAR_TOKENS)"""
        props = {}
        props.update(self._inspect_instance(syllabus, "SYLLABUS_"))
        for field in self._get_relation_fields(syllabus):
            rel_instance = self._get_related_instance(syllabus, field)
            if not rel_instance:
                continue
            rel_prefix = f"{field.name.upper()}_"
            props.update(self._inspect_instance(rel_instance, rel_prefix))
            props.update(self._extract_nested_relations(rel_instance, rel_prefix))
        return props

    def _extract_all_subsection_data(self, syllabus) -> dict:
        """
        Lấy dữ liệu từ SubSection (Dynamic Tables & Custom Fields).
        Gọi lại logic Factory cũ của bạn nếu có.
        """
        data = {}
        # Giả định SubSectionExtractorFactory đã được khai báo ở đâu đó trong app
        try:
            from handlers.sub_section_factory import SubSectionExtractorFactory  # Sửa đường dẫn import cho đúng

            # SubSection query tương tự code cũ
            subsections = syllabus.main_sections.all().prefetch_related('sub_sections__main_section')

            for main_sec in subsections:
                for subsection in main_sec.sub_sections.all():
                    # Lấy key
                    key = (subsection.code or subsection.name).upper()

                    # Extract qua factory
                    extractor = SubSectionExtractorFactory.get_extractor(subsection.type)
                    value = extractor.extract(subsection, syllabus)

                    if value is not None and value != "":
                        data[key] = value
        except Exception as e:
            print(f"[Warning] Không thể load SubSection Data: {e}")

        return data

    def _get_fixed_tables_context(self) -> dict:
        """
        Xử lý riêng các Table dạng Fixed (do cấu trúc của bảng biểu thường phức tạp
        và yêu cầu mảng Dictionary chứa các key tương ứng với cột `[[ROW.key]]`).
        Ví dụ: TEACHING_SCHEDULE
        """
        context = {}
        if hasattr(self.syllabus, 'teaching_sessions'):
            context["TEACHING_SCHEDULE"] = [
                {
                    "week": f"Tuần {session.session_no}",
                    "content": session.content,
                    "clo": ", ".join(clo.content for clo in session.course_learning_outcomes.all()),
                    "self_hours": session.self_study_hours,
                    "direct_hours": session.offline_hours,
                    "online_hours": session.online_hours
                }
                for session in self.syllabus.teaching_sessions.all()
            ]
        return context

    def build(self):
        """Gom toàn bộ dữ liệu trả về 1 dictionary context duy nhất"""
        context = {}
        # 1. Tự động lấy Scalar Attributes bằng Reflection
        context.update(self._extract_model_attributes(self.syllabus))

        # 2. Lấy Dynamic SubSections
        context.update(self._extract_all_subsection_data(self.syllabus))

        # 3. Lấy Fixed Tables
        context.update(self._get_fixed_tables_context())

        return context