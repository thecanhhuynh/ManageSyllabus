"""
handlers/data_mapper.py

Class và hàm chuyên trách ánh xạ, làm phẳng (flatten) dữ liệu từ Syllabus JSON / ORM
sang Dictionary context cho docxtpl và BlockStyleDocxRenderer.
Tuân thủ nghiêm ngặt nguyên tắc Clean Code & Guard Clauses.
"""

def _extract_text_sub(sub: dict, context: dict) -> None:
    """Trích xuất SubSection dạng Text."""
    if sub.get("type") != "text":
        return

    code = (sub.get("code") or "").strip().lower()
    content = sub.get("content") or ""
    context[code.upper()] = content

    if code == "subject_name_vi":
        context["TEN_MON_HOC"] = content
        context["SUBJECT_NAME_VI"] = content
        context["TEN_MON_HOC_VI"] = content
        return

    if code == "english_title":
        context["TEN_TIENG_ANH"] = content
        context["ENGLISH_TITLE"] = content
        context["COURSE_TITLE_EN"] = content
        return

    if code == "subject_code":
        context["MA_MON_HOC"] = content
        context["SUBJECT_CODE"] = content
        context["COURSE_CODE"] = content
        return

    if code == "course_detail":
        context["MO_TA_MON_HOC"] = content
        context["COURSE_DETAIL"] = content
        context["COURSE_DESCRIPTION"] = content

def _extract_selection_sub(sub: dict, context: dict) -> None:
    """Trích xuất SubSection dạng Selection."""
    if sub.get("type") != "selection":
        return

    code = (sub.get("code") or "").strip().lower()
    selected = sub.get("selected_values") or []
    names = [s.get("name_value", "").strip() for s in selected if s.get("name_value")]
    text_val = ", ".join(names)

    context[code.upper()] = text_val
    context[f"{code.upper()}_LIST"] = names

    if code == "teaching_methods":
        context["PHUONG_THUC_GIANG_DAY"] = text_val
        return

    if code == "language":
        context["NGON_NGU_GIANG_DAY"] = text_val
        return

    if code == "knowledge_components":
        context["THANH_PHAN_KIEN_THUC"] = text_val

def _extract_credit_sub(ref_data, context: dict) -> None:
    """Trích xuất thông tin Tín chỉ."""
    if not isinstance(ref_data, dict):
        return

    th = int(ref_data.get("number_theory") or 0)
    pr = int(ref_data.get("number_practice") or 0)
    self_h = int(ref_data.get("hour_self_study") or 0)
    total = th + pr

    context["SO_TIN_CHI"] = str(total)
    context["CREDITS"] = str(total)
    context["CREDIT_TOTAL"] = str(total)
    context["CREDIT_THEORY"] = str(th)
    context["CREDIT_PRACTICE"] = str(pr)
    context["CREDIT_SELF_STUDY"] = str(self_h)
    context["CREDIT_SUMMARY"] = (
        f"• Số tín chỉ: {total} (Lý thuyết: {th}, Thực hành: {pr}, Tự học: {self_h} giờ)"
    )

def _extract_lecturer_sub(ref_data, context: dict) -> None:
    """Trích xuất thông tin Giảng viên và Phụ trách môn học."""
    if not isinstance(ref_data, dict):
        return

    first = (ref_data.get("first_name") or "").strip()
    last = (ref_data.get("last_name") or "").strip()
    full_name = f"{last} {first}".strip() or first
    email = (ref_data.get("email") or "").strip()
    room = (ref_data.get("room") or "").strip()
    faculty = (ref_data.get("faculty") or "").strip()

    context["GIANG_VIEN"] = full_name
    context["LECTURER_NAME"] = full_name
    context["EMAIL"] = email
    context["LECTURER_EMAIL"] = email
    context["PHONG_LAM_VIEC"] = room
    context["LECTURER_ROOM"] = room
    context["KHOA_BO_MON"] = faculty
    context["FACULTY"] = faculty

def _extract_requirement_sub(ref_data, context: dict) -> None:
    """Trích xuất môn học điều kiện."""
    if not isinstance(ref_data, list):
        return

    req_list = []
    for item in ref_data:
        req_type = item.get("requirement_type")
        type_name = req_type.get("name", "") if isinstance(req_type, dict) else ""
        req_list.append({
            "subject_name": item.get("subject_name", ""),
            "subject_code": item.get("subject_code", ""),
            "type": type_name,
        })

    context["MON_HOC_DIEU_KIEN"] = req_list
    context["REQUIREMENTS"] = req_list

def _extract_objectives_sub(ref_data, context: dict) -> None:
    """Trích xuất mục tiêu môn học và PLOs."""
    if not isinstance(ref_data, list):
        return

    obj_list = []
    for idx, item in enumerate(ref_data, start=1):
        content = (item.get("content") or "").strip()
        plos = item.get("programme_learning_outcomes") or []
        plo_names = [p.get("name", "") for p in plos if p.get("name")]
        obj_list.append({
            "co": f"CO{idx}",
            "content": content,
            "plos": ", ".join(plo_names),
        })

    context["MUC_TIEU_MON_HOC"] = obj_list
    context["COURSE_OBJECTIVES"] = obj_list

def _extract_clos_sub(ref_data, context: dict) -> None:
    """Trích xuất chuẩn đầu ra CLO."""
    if not isinstance(ref_data, list):
        return

    clo_list = []
    clo_counter = 1
    for group in ref_data:
        for c in (group.get("clos") or []):
            content = (c.get("content") or "").strip()
            plos = c.get("plos") or []
            clo_list.append({
                "clo": f"CLO{clo_counter}",
                "content": content,
                "plos": plos,
            })
            clo_counter += 1

    context["CHUAN_DAU_RA"] = clo_list
    context["CLOS"] = clo_list

def _extract_materials_sub(ref_data, context: dict) -> None:
    """Trích xuất danh mục học liệu."""
    if not isinstance(ref_data, list):
        return

    mat_list = []
    for item in ref_data:
        type_mat = item.get("type_material")
        type_name = type_mat.get("name", "") if isinstance(type_mat, dict) else ""
        mat_list.append({
            "name": (item.get("name") or "").strip(),
            "type": type_name,
        })

    context["HOC_LIEU"] = mat_list
    context["LEARNING_MATERIALS"] = mat_list

def _extract_assessments_sub(ref_data, context: dict) -> None:
    """Trích xuất phương pháp đánh giá môn học."""
    if not isinstance(ref_data, list):
        return

    ass_list = []
    for group in ref_data:
        type_ass = group.get("type_assessment")
        type_name = type_ass.get("name", "") if isinstance(type_ass, dict) else ""
        for m in (group.get("assessment_methods") or []):
            weight = f"{m.get('weight')}%" if m.get('weight') is not None else ""
            ass_list.append({
                "type": type_name,
                "method": m.get("name", ""),
                "time": m.get("time", ""),
                "weight": weight,
            })

    context["DANH_GIA_MON_HOC"] = ass_list
    context["ASSESSMENTS"] = ass_list

def _format_schedule_clos(clos) -> str:
    """Format danh sách CĐR môn học."""
    if not clos:
        return ""
    parts = []
    for idx, c in enumerate(clos):
        if isinstance(c, dict):
            val = c.get("position") or c.get("name") or c.get("id") or (idx + 1)
            parts.append(str(val))
        elif isinstance(c, (int, str)):
            parts.append(str(c))
    return "\n".join(parts)

def _format_schedule_assessments(assessments) -> str:
    """Format danh sách bài đánh giá."""
    if not assessments:
        return ""
    parts = []
    for a in assessments:
        if isinstance(a, dict):
            name = a.get("name") or a.get("code") or (f"A{a.get('id')}" if a.get("id") else "")
            if name:
                parts.append(name.strip())
        elif isinstance(a, str):
            parts.append(a.strip())
    return "\n".join(parts)

def _format_schedule_materials(materials) -> str:
    """Format danh sách tài liệu tham khảo dạng [1][2]."""
    if not materials:
        return ""
    parts = []
    for idx, m in enumerate(materials):
        if isinstance(m, dict):
            name = m.get("order") or m.get("position") or (idx + 1)
            parts.append(f"[{name}]")
        elif isinstance(m, (int, str)):
            s = str(m).strip()
            parts.append(s if s.startswith("[") else f"[{s}]")
    return "".join(parts)

def _extract_schedule_sub(ref_data, context: dict) -> None:
    """Trích xuất kế hoạch giảng dạy từng tuần đầy đủ 11 cột."""
    if not isinstance(ref_data, list):
        return

    flat_items = []
    for item in ref_data:
        if not isinstance(item, dict):
            continue
        sessions = item.get("teaching_sessions")
        if isinstance(sessions, list):
            group_obj = item.get("schedule_group")
            for session in sessions:
                if isinstance(session, dict):
                    session_copy = dict(session)
                    if group_obj and "schedule_group" not in session_copy:
                        session_copy["schedule_group"] = group_obj
                    flat_items.append(session_copy)
            continue
        flat_items.append(item)

    sched_list = []
    for item in flat_items:
        session_no = item.get("session_no", 1)
        sched_list.append({
            "session": f"Buổi {session_no}",
            "session_no": session_no,
            "week": f"Tuần {session_no}",
            "content": (item.get("content") or "").strip(),
            "clos": _format_schedule_clos(item.get("course_learning_outcomes")),
            "self_study_activity": (item.get("self_study_activity") or "").strip(),
            "self_study_hours": item.get("self_study_hours", 0),
            "offline_activity": (item.get("offline_activity") or "").strip(),
            "offline_hours": item.get("offline_hours", 0),
            "online_activity": (item.get("online_activity") or "").strip(),
            "online_hours": item.get("online_hours", 0),
            "direct_hours": item.get("offline_hours", 0),
            "self_hours": item.get("self_study_hours", 0),
            "assessments": _format_schedule_assessments(item.get("assessments")),
            "materials": _format_schedule_materials(item.get("learning_materials")),
            "schedule_group": item.get("schedule_group"),
        })

    context["KE_HOACH_GIANG_DAY"] = sched_list
    context["TEACHING_SCHEDULE"] = sched_list

def _extract_reference_sub(sub: dict, context: dict) -> None:
    """Điều hướng trích xuất các SubSection dạng Reference."""
    if sub.get("type") != "reference":
        return

    code = (sub.get("code") or "").strip().lower()
    ref_data = sub.get("reference_data")
    if ref_data is None:
        return

    extractors = {
        "credit": _extract_credit_sub,
        "lecturer_info": _extract_lecturer_sub,
        "requirement_subject": _extract_requirement_sub,
        "objective_outcomes": _extract_objectives_sub,
        "course_learning_outcomes": _extract_clos_sub,
        "learning_material": _extract_materials_sub,
        "assessment_method": _extract_assessments_sub,
        "teaching_schedule": _extract_schedule_sub,
    }
    extractor = extractors.get(code)
    if extractor:
        extractor(ref_data, context)

def _extract_table_sub(sub: dict, context: dict) -> None:
    """Trích xuất SubSection dạng Table động."""
    if sub.get("type") != "table":
        return

    code = (sub.get("code") or "").strip().upper()
    schema = sub.get("table_schema") or {}
    rows = schema.get("rows") or []
    context[code] = rows

def _build_data_context(syllabus_json: dict) -> dict:
    """
    Làm phẳng (flatten) cấu trúc JSON phức tạp thành một dictionary đơn giản
    mà thư viện docxtpl và BlockStyleDocxRenderer có thể hiểu và áp dụng được.
    Tuân thủ Clean Code & Guard Clauses.
    """
    if not isinstance(syllabus_json, dict):
        return {}

    context = {}
    context["SYLLABUS_NAME"] = syllabus_json.get("name") or ""
    context["SYLLABUS_ID"] = str(syllabus_json.get("id") or "")
    context["STATUS"] = syllabus_json.get("status") or ""

    main_sections = syllabus_json.get("main_sections")
    if not isinstance(main_sections, list):
        return context

    for main_sec in main_sections:
        sub_sections = main_sec.get("sub_sections")
        if not isinstance(sub_sections, list):
            continue
        for sub in sub_sections:
            if not isinstance(sub, dict):
                continue
            _extract_text_sub(sub, context)
            _extract_selection_sub(sub, context)
            _extract_reference_sub(sub, context)
            _extract_table_sub(sub, context)

    return context

class SyllabusDataMapper:
    """
    Class chuyên trách ánh xạ dữ liệu từ Syllabus ORM / JSON sang Dictionary context.
    Hỗ trợ cả JSON Schema V2 và Django ORM Reflection.
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
        """Quét tự động toàn bộ thuộc tính và quan hệ (SCALAR_TOKENS)."""
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

    def build(self) -> dict:
        """Gom toàn bộ dữ liệu trả về 1 dictionary context phẳng duy nhất."""
        if isinstance(self.syllabus, dict):
            return _build_data_context(self.syllabus)

        context = {}
        context.update(self._extract_model_attributes(self.syllabus))

        try:
            from syllabuses.serializer import SyllabusDetailSerializer
            syllabus_json = SyllabusDetailSerializer(self.syllabus).data
            context.update(_build_data_context(syllabus_json))
        except Exception as e:
            pass

        return context