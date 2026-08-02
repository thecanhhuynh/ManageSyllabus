from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from syllabuses.models import User, Lecturer, Faculty, Syllabus, Subject, SubSection, MainSection, TextSubSection, \
    SelectionSubSection, AttributeGroup, AttributeValue, ReferenceSubSection, Credit, RequirementSubject, \
    ProgrammeLearningOutcome, CourseObjective, CourseLearningOutcome, LearningMaterial, TypeRequirement, \
    TypeLearningMaterial, SyllabusLearningMaterial, CloPloAssociation, TypeAssessment, Assessment, Method, \
    ScheduleGroup, TeachingSession, Major, TrainingProgram, TemplateSubSection, TemplateSyllabus, TemplateMainSection, \
    TableSubSection, TemplateSelectionSubSection, TemplateTableSubSection, TemplateTextSubSection


class FacultySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Faculty
        fields = ['id', 'name']
        extra_kwargs = {
            'name': {'validators': []}
        }


class LecturerSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer()

    class Meta:
        model = Lecturer
        fields = ['room', 'faculty']


class LecturerBasicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    faculty_name = serializers.CharField(source='faculty.name', read_only=True, default="Chưa có khoa")

    class Meta:
        model = Lecturer
        fields = ['id', 'first_name', 'last_name', 'room', 'faculty_name']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'password', 'avatar', 'email', 'user_role']
        extra_kwargs = {
            'password': {
                'write_only': True,
            }
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data['password'])
        user.user_role = User.UserRole.USER
        user.save()

        Lecturer.objects.create(user=user)
        return user


class UserDetailSerializer(UserSerializer):
    lecturer = LecturerSerializer(source='lecturer_profile', read_only=True)

    room = serializers.CharField(write_only=True, required=False)
    faculty = serializers.CharField(write_only=True, required=False)

    class Meta(UserSerializer.Meta):
        fields = [f for f in UserSerializer.Meta.fields if f != 'password'] + ['lecturer', 'room', 'faculty']

    def update(self, instance, validated_data):
        room = validated_data.pop('room', None)
        faculty_id = validated_data.pop('faculty', None)
        instance = super().update(instance, validated_data)
        if hasattr(instance, 'lecturer_profile'):
            if room is not None:
                instance.lecturer_profile.room = room
            if faculty_id is not None:
                faculty_obj = Faculty.objects.filter(id=faculty_id).first()
                if faculty_obj:
                    instance.lecturer_profile.faculty = faculty_obj
            instance.lecturer_profile.save()
        return instance


class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['id', 'number_theory', 'number_practice', 'hour_self_study']


class SubjectSerializer(serializers.ModelSerializer):
    credit = CreditSerializer(required=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'credit']

    def create(self, validated_data):
        print("DEBUG VALIDATED DATA:", validated_data)
        credit_data = validated_data.pop('credit')
        credit_instance = Credit.objects.create(**credit_data)

        subject = Subject.objects.create(credit=credit_instance, **validated_data)
        return subject

    def update(self, instance, validated_data):
        print("DEBUG VALIDATED DATA:", validated_data)
        credit_data = validated_data.pop('credit', None)

        instance.code = validated_data.get('code', instance.code)
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        if credit_data and instance.credit:
            credit_instance = instance.credit
            credit_instance.number_theory = credit_data.get('number_theory', credit_instance.number_theory)
            credit_instance.number_practice = credit_data.get('number_practice', credit_instance.number_practice)
            credit_instance.hour_self_study = credit_data.get('hour_self_study', credit_instance.hour_self_study)
            credit_instance.save()

        return instance

    def delete(self, instance, validated_data):
        pass


class SyllabusSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    lecturer = LecturerBasicSerializer(read_only=True)

    class Meta:
        model = Syllabus
        fields = ['id', 'name', 'status', 'subject', 'lecturer', 'created_date']


class AttributeGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeGroup
        fields = ['id']


class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_group = AttributeGroupSerializer(read_only=True)

    class Meta:
        model = AttributeValue
        fields = ['id', 'name_value', 'attribute_group']


class SimpleAttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ['id', 'name_value']


class AttributeGroupListSerializer(serializers.ModelSerializer):
    attribute_values = SimpleAttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = AttributeGroup
        fields = ['id', 'name', 'attribute_values']


class TextSubSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextSubSection
        fields = ['id', 'name', 'position', 'type', 'code', 'content', 'display_mode', 'place_holder']


class SelectionSubSectionSerializer(serializers.ModelSerializer):
    selected_values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = SelectionSubSection
        fields = ['id', 'name', 'position', 'type', 'code', 'selected_values']


class ReferenceSubSectionSerializer(serializers.ModelSerializer):
    reference_data = serializers.SerializerMethodField()

    class Meta:
        model = ReferenceSubSection
        fields = ['id', 'name', 'position', 'type', 'code', 'reference_code', 'reference_data']

    def get_reference_data(self, obj):
        syllabus = obj.main_section.syllabus
        code = obj.code

        strategy_map = {
            'credit': (CreditSerializer, getattr(syllabus.subject, 'credit', None), False),
            'lecturer_info': (LecturerInfoSerializer, getattr(syllabus, 'lecturer', None), False),
            'requirement_subject': (RequirementSubjectSerializer, syllabus.subject.required_by_relation.all(), True),

            'objective_outcomes': (CourseObjectiveSerializer, syllabus.course_objectives.all(), True),
            'course_learning_outcomes': (COwithCLOSerializer, syllabus.course_objectives.all(), True),

            'learning_material': (SyllabusLearningMaterialSerializer, syllabus.syllabuslearningmaterial_set.all(),
                                  True),
            'assessment_method': (AssessmentSerializer, syllabus.assessments.all(), True),
            'teaching_schedule': (TeachingSessionSerializer, syllabus.teaching_sessions.all(), True)
        }

        strategy = strategy_map.get(code)
        if strategy:
            serializer_class, data_source, is_many = strategy
            if data_source is not None:
                return serializer_class(data_source, many=is_many, context=self.context).data

        return None

class TableSubSectionSerializer(serializers.ModelSerializer):

    class Meta:
        model = TableSubSection
        fields = ['id', 'name', 'position', 'type', 'code', 'data']



class SubSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubSection
        fields = ['id', 'name', 'position', 'type', 'code']

    def to_representation(self, instance):
        strategy_map = {
            'text': (TextSubSectionSerializer, 'textsubsection'),
            'selection': (SelectionSubSectionSerializer, 'selectionsubsection'),
            'reference': (ReferenceSubSectionSerializer, 'referencesubsection'),
            'table': (TableSubSectionSerializer, 'tablesubsection'),
        }

        strategy = strategy_map.get(instance.type)
        if strategy:
            serializer_class, child_relation_name = strategy
            try:
                child_instance = getattr(instance, child_relation_name)
                print(f" [SUB SERIALIZER - SUCCESS] SubID={instance.id} (type='{instance.type}') -> Gọi {serializer_class.__name__}")

                return serializer_class(child_instance).data
            except AttributeError as e:
                print(f" [SUB SERIALIZER - FAILED] SubID={instance.id} có type='{instance.type}' nhưng không có quan hệ '{child_relation_name}'! Lỗi: {e}")
                pass

        return super().to_representation(instance)


class SectionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    sub_sections = SubSectionSerializer(many=True, required=False)

    class Meta:
        model = MainSection
        fields = ['id', 'name', 'code', 'position', 'sub_sections']


class SyllabusDetailSerializer(serializers.ModelSerializer):
    main_sections = SectionSerializer(many=True, required=False)

    class Meta:
        model = Syllabus
        fields = ['id', 'name', 'status', 'main_sections', 'start_date_edition',
                  'end_date_edition']

    def update(self, instance, validated_data):
        validated_data.pop('main_sections', None)
        instance = super().update(instance, validated_data)

        main_sections_data = self.initial_data.get('main_sections', [])

        for main_data in main_sections_data:
            main_id = main_data.get('id')
            if not main_id: continue

            main_instance = MainSection.objects.filter(id=main_id, syllabus=instance).first()
            if not main_instance: continue

            for sub_data in main_data.get('sub_sections', []):
                sub_id = sub_data.get('id')
                if not sub_id: continue

                sub_instance = SubSection.objects.filter(id=sub_id, main_section=main_instance).first()
                if not sub_instance: continue

                if sub_instance.type == 'text' and hasattr(sub_instance, 'textsubsection'):
                    if 'content' in sub_data:
                        sub_instance.textsubsection.content = sub_data['content']
                        sub_instance.textsubsection.save()

                elif sub_instance.type == 'selection' and hasattr(sub_instance, 'selectionsubsection'):
                    if 'selected_values' in sub_data:
                        val_ids = [item['id'] if isinstance(item, dict) else item for item in
                                   sub_data['selected_values']]
                        sub_instance.selectionsubsection.selected_values.set(val_ids)

                elif sub_instance.type == 'reference' and hasattr(sub_instance, 'referencesubsection'):
                    ref_data = sub_data.get('reference_data')
                    if ref_data is not None:
                        ref_code = sub_instance.referencesubsection.reference_code
                        print(f"--- DEBUG: ref_code là '{ref_code}' ---")

                        strategy_map = {
                            'credit': self._update_credit,
                            'requirement_subject': self._update_requirement_subjects,
                            'objectives_and_outcomes': self._update_objective_outcomes,
                            'course_learning_outcomes': self._update_course_learning_outcomes,
                            'learning_material': self._update_learning_material,
                            'assessment_method': self._update_assessment,
                            'teaching_schedule': self._update_teaching_schedule
                        }

                        update_func = strategy_map.get(ref_code)
                        if update_func:
                            print("--- DEBUG: Đã gọi được hàm update ---")
                            update_func(instance, ref_data)
                        else:
                            print("--- DEBUG: KHÔNG TÌM THẤY HÀM MATCH VỚI ref_code ---")

        return instance

    def _update_credit(self, instance, ref_data):
        id_credit = ref_data.get('id')
        if id_credit:
            Credit.objects.filter(id=id_credit).update(
                number_theory=ref_data.get('number_theory'),
                number_practice=ref_data.get('number_practice'),
                hour_self_study=ref_data.get('hour_self_study')
            )

    def _update_requirement_subjects(self, instance, ref_data):
        main_subject = instance.subject
        if not main_subject:
            return

        ids_subject = []
        seen_ids = set()
        duplicate_ids = set()

        for item in ref_data:
            subj_id = item.get('subject_id')
            if subj_id:
                ids_subject.append(subj_id)
                if subj_id in seen_ids:
                    duplicate_ids.add(str(subj_id))
                seen_ids.add(subj_id)

        if duplicate_ids:
            raise ValidationError({
                "err_msg": f"Danh sách có chứa môn học bị trùng lặp: {', '.join(duplicate_ids)}."
            })
        main_subject.required_by_relation.exclude(require_subject_id__in=ids_subject).delete()

        for subject in ref_data:
            subject_id = subject.get('subject_id')

            if not subject_id:
                continue

            if str(subject_id) == str(main_subject.id):
                raise ValidationError({
                    "err_msg": f"Môn học điều kiện không được trùng với môn học chính ({main_subject.name})."
                })

            req_type_data = subject.get('requirement_type')
            type_req_obj = None

            if req_type_data and isinstance(req_type_data, dict):
                req_type_id = req_type_data.get('id')
                if req_type_id:
                    type_req_obj = TypeRequirement.objects.filter(id=req_type_id).first()

            if not type_req_obj:
                raise ValidationError({
                    "err_msg": f"Vui lòng chọn Loại môn điều kiện cho môn {subject_id}."
                })

            RequirementSubject.objects.update_or_create(
                subject=main_subject,
                require_subject_id=subject_id,
                type_requirement=type_req_obj
            )

    def _update_objective_outcomes(self, instance, ref_data):
        subject = instance.subject
        if not subject:
            return

        incoming_ids = [item.get('id') for item in ref_data if item.get('id')]
        subject.course_objectives.exclude(id__in=incoming_ids).delete()

        for index, item in enumerate(ref_data, start=1):
            item_id = item.get('id')
            content = item.get('content')
            if not content:
                raise ValidationError({
                    "err_msg": "Thiếu nội dung mục tiêu."
                })
            plos = item.get('programme_learning_outcomes')
            if not plos:
                raise ValidationError({
                    "err_msg": "Không được bỏ trống PLO."
                })
            if item_id:
                co_obj = subject.course_objectives.filter(id=item_id).first()
                if not co_obj:
                    raise ValidationError({"err_msg": f"Không tìm thấy Mục tiêu (ID: {item_id})."})
                co_obj.content = content
                co_obj.position = index
                co_obj.save()
            else:
                co_obj = subject.course_objectives.create(content=content, position=index)

            plo_ids = []
            for plo in plos:
                plo_val = plo.get('id') if isinstance(plo, dict) else plo
                if plo_val:
                    plo_ids.append(int(plo_val))

            co_obj.programme_learning_outcomes.set(plo_ids)

    def _update_course_learning_outcomes(self, instance, ref_data):
        from syllabuses.models import CloPloAssociation, ProgrammeLearningOutcome

        for co_item in ref_data:
            if not co_item or not isinstance(co_item, dict):
                continue

            co_id = co_item.get('id')
            if not co_id:
                continue

            co = CourseObjective.objects.filter(id=co_id).first()
            if not co:
                raise ValidationError({
                    "err_msg": f"Mục tiêu môn học (CO) mang ID {co_id} không tồn tại."
                })

            clos_data = co_item.get('clos', [])
            incoming_clo_ids = [
                clo.get('id') for clo in clos_data
                if isinstance(clo, dict) and clo.get('id') and str(clo.get('id')).strip()
            ]

            CourseLearningOutcome.objects.filter(course_objective=co).exclude(id__in=incoming_clo_ids).delete()

            for index, clo_item in enumerate(clos_data, start=1):
                if not isinstance(clo_item, dict):
                    continue

                clo_id = clo_item.get('id')
                content = clo_item.get('content')
                plos_data = clo_item.get('plos', [])

                if not content:
                    raise ValidationError({
                        "err_msg": f"Vui lòng nhập nội dung cho CLO (thuộc CO{co_id})."
                    })

                if clo_id and str(clo_id).strip():
                    clo_obj = CourseLearningOutcome.objects.filter(id=clo_id, course_objective=co).first()
                    if not clo_obj:
                        raise ValidationError({
                            "err_msg": f"Không tìm thấy Chuẩn đầu ra (ID: {clo_id})."
                        })
                    clo_obj.content = content
                    clo_obj.position = index
                    clo_obj.save()
                else:
                    clo_obj = CourseLearningOutcome.objects.create(
                        course_objective=co,
                        content=content,
                        position=index
                    )

                incoming_plo_ids = [
                    plo.get('plo_id') for plo in plos_data
                    if isinstance(plo, dict) and plo.get('plo_id')
                ]

                CloPloAssociation.objects.filter(clo=clo_obj).exclude(plo_id__in=incoming_plo_ids).delete()

                for plo_item in plos_data:
                    plo_id = plo_item.get('plo_id')
                    rating = plo_item.get('rating')

                    if not plo_id or not rating:
                        continue

                    plo_obj = ProgrammeLearningOutcome.objects.filter(id=plo_id).first()
                    if not plo_obj:
                        raise ValidationError({
                            "err_msg": f"Không tìm thấy PLO (ID: {plo_id})."
                        })

                    CloPloAssociation.objects.update_or_create(
                        clo=clo_obj,
                        plo=plo_obj,
                        defaults={'rating': rating}
                    )

    def _update_learning_material(self, instance, ref_data):

        seen_identifiers = set()
        duplicate_names = set()

        incoming_material_ids = []

        for item in ref_data:
            if not isinstance(item, dict):
                continue

            mat_id = item.get('id')
            mat_name = item.get('name')

            if not mat_name:
                continue

            identifier = str(mat_id).strip() if (mat_id and str(mat_id).strip()) else mat_name.strip().lower()

            if identifier in seen_identifiers:
                duplicate_names.add(mat_name)
            seen_identifiers.add(identifier)

            if mat_id and str(mat_id).strip():
                incoming_material_ids.append(mat_id)

        if duplicate_names:
            raise ValidationError({
                "err_msg": f"Danh sách có chứa tài liệu bị trùng lặp: {', '.join(duplicate_names)}."
            })

        SyllabusLearningMaterial.objects.filter(syllabus=instance).exclude(
            learning_material_id__in=incoming_material_ids).delete()

        for item in ref_data:
            if not isinstance(item, dict): continue

            mat_id = item.get('id')
            mat_name = item.get('name')
            type_mat_data = item.get('type_material')

            if not mat_name:
                raise ValidationError({"learning_material": "Tên tài liệu không được để trống."})
            if not type_mat_data or not isinstance(type_mat_data, dict) or not type_mat_data.get('id'):
                raise ValidationError({"learning_material": f"Vui lòng chọn Loại tài liệu cho '{mat_name}'."})

            type_mat_id = type_mat_data.get('id')
            type_mat_obj = TypeLearningMaterial.objects.filter(id=type_mat_id).first()
            if not type_mat_obj:
                raise ValidationError({"learning_material": f"Không tìm thấy Phân loại tài liệu (ID: {type_mat_id})."})

            if mat_id:
                material_obj = LearningMaterial.objects.filter(id=mat_id).first()
                if not material_obj:
                    raise ValidationError({"learning_material": f"Không tìm thấy tài liệu ID: {mat_id}."})

                # material_obj.name = mat_name
                # material_obj.save()
            else:
                material_obj, _ = LearningMaterial.objects.get_or_create(name=mat_name)

            SyllabusLearningMaterial.objects.update_or_create(
                syllabus=instance,
                learning_material=material_obj,
                defaults={
                    'type_material': type_mat_obj
                }
            )

    def _update_assessment(self, instance, ref_data):
        total_weight = 0
        has_method = False

        for item in ref_data:
            for method in item.get('assessment_methods', []):
                has_method = True
                total_weight += int(method.get('weight', 0))

        if has_method and total_weight != 100:
            raise serializers.ValidationError({
                "err_msg": f"Tổng trọng số đánh giá phải đúng 100%. Hiện tại hệ thống ghi nhận {total_weight}%."
            })

        incoming_assessment_ids = []

        for item in ref_data:
            type_assessment_id = item.get('type_assessment', {}).get('id')
            if not type_assessment_id:
                continue

            assessment, created = Assessment.objects.get_or_create(
                syllabus=instance,
                type_assessment_id=type_assessment_id
            )
            incoming_assessment_ids.append(assessment.id)

            methods_data = item.get('assessment_methods', [])
            incoming_method_ids = [m.get('id') for m in methods_data if m.get('id')]

            assessment.assessment_methods.exclude(id__in=incoming_method_ids).delete()

            for method_data in methods_data:
                method_id = method_data.get('id')
                clo_list = method_data.get('course_learning_outcomes', [])

                clo_ids = [c['id'] if isinstance(c, dict) else c for c in clo_list]

                if method_id:
                    method = Method.objects.get(id=method_id, assessment=assessment)
                    method.name = method_data.get('name', method.name)
                    method.time = method_data.get('time', method.time)
                    method.weight = method_data.get('weight', method.weight)
                    method.save()
                else:
                    method = Method.objects.create(
                        assessment=assessment,
                        name=method_data.get('name', ''),
                        time=method_data.get('time', ''),
                        weight=method_data.get('weight', 0)
                    )

                method.course_learning_outcomes.set(clo_ids)

    def _update_teaching_schedule(self, instance, ref_data):

        incoming_session_ids = []

        for group_data in ref_data:
            schedule_group_id = group_data.get('schedule_group', {}).get('id')
            if not schedule_group_id:
                continue

            sessions_data = group_data.get('teaching_sessions', [])

            for session_item in sessions_data:
                session_id = session_item.get('id')

                clo_ids = [c['id'] if isinstance(c, dict) else c for c in
                           session_item.get('course_learning_outcomes', [])]
                assessment_ids = [a['id'] if isinstance(a, dict) else a for a in session_item.get('assessments', [])]
                material_ids = [m['id'] if isinstance(m, dict) else m for m in
                                session_item.get('learning_materials', [])]
                session = TeachingSession.objects.filter(id=session_id,
                                                         syllabus=instance).first() if session_id else None
                if session:
                    session = TeachingSession.objects.get(id=session_id, syllabus=instance)
                    session.schedule_group_id = schedule_group_id
                    session.session_no = session_item.get('session_no', session.session_no)
                    session.content = session_item.get('content', session.content)
                    session.offline_activity = session_item.get('offline_activity', '')
                    session.offline_hours = float(session_item.get('offline_hours') or 0)
                    session.online_activity = session_item.get('online_activity', '')
                    session.online_hours = float(session_item.get('online_hours') or 0)
                    session.self_study_activity = session_item.get('self_study_activity', '')
                    session.self_study_hours = float(session_item.get('self_study_hours') or 0)
                    session.save()
                else:
                    session = TeachingSession.objects.create(
                        syllabus=instance,
                        schedule_group_id=schedule_group_id,
                        session_no=session_item.get('session_no', 1),
                        content=session_item.get('content', ''),
                        offline_activity=session_item.get('offline_activity', ''),
                        offline_hours=float(session_item.get('offline_hours') or 0),
                        online_activity=session_item.get('online_activity', ''),
                        online_hours=float(session_item.get('online_hours') or 0),
                        self_study_activity=session_item.get('self_study_activity', ''),
                        self_study_hours=float(session_item.get('self_study_hours') or 0),
                    )

                incoming_session_ids.append(session.id)

                session.course_learning_outcomes.set(clo_ids)
                session.assessments.set(assessment_ids)
                session.learning_materials.set(material_ids)

        TeachingSession.objects.filter(syllabus=instance).exclude(id__in=incoming_session_ids).delete()


class LecturerInfoSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    faculty = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Lecturer
        fields = ['first_name', 'last_name', 'email', 'room', 'faculty']


class TypeRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeRequirement
        fields = ['id', 'name']


class RequirementSubjectSerializer(serializers.ModelSerializer):
    subject_id = serializers.CharField(source='require_subject.id', read_only=True)
    subject_name = serializers.CharField(source='require_subject.name', read_only=True)
    requirement_type = TypeRequirementSerializer(source='type_requirement', read_only=True)
    subject_code = serializers.CharField(source='require_subject.code', read_only=True)

    class Meta:
        model = RequirementSubject
        fields = ['subject_id', 'subject_name', 'requirement_type', 'subject_code']


class ProgrammeLearningOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgrammeLearningOutcome
        fields = ['id', 'name', 'description']


class CourseObjectiveSerializer(serializers.ModelSerializer):
    programme_learning_outcomes = ProgrammeLearningOutcomeSerializer(many=True, read_only=True)

    class Meta:
        model = CourseObjective
        fields = ['id', 'content', 'programme_learning_outcomes']


class CloPloAssociationSerializer(serializers.ModelSerializer):
    plo_id = serializers.IntegerField(source='plo.id', read_only=True)

    class Meta:
        model = CloPloAssociation
        fields = ['plo_id', 'rating']


class CourseLearningOutcomeSerializer(serializers.ModelSerializer):
    plos = CloPloAssociationSerializer(source='plo_association', many=True, read_only=True)

    class Meta:
        model = CourseLearningOutcome
        fields = ['id', 'content', 'position', 'plos']


class COwithCLOSerializer(serializers.ModelSerializer):
    clos = CourseLearningOutcomeSerializer(source='course_learning_outcomes', many=True, read_only=True)

    class Meta:
        model = CourseObjective
        fields = ['id', 'position', 'clos']


class TypeLearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeLearningMaterial
        fields = ['id', 'name']


class LearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ['id', 'name']


class SyllabusLearningMaterialSerializer(serializers.ModelSerializer):
    type_material = TypeLearningMaterialSerializer(read_only=True)
    id = serializers.IntegerField(source='learning_material.id', read_only=True)
    name = serializers.CharField(source='learning_material.name', read_only=True)

    class Meta:
        model = SyllabusLearningMaterial
        fields = ['id', 'name', 'type_material']


class TypeAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeAssessment
        fields = ['id', 'name']


class MethodAssessmentSerializer(serializers.ModelSerializer):
    course_learning_outcomes = CourseLearningOutcomeSerializer(many=True, read_only=True)

    class Meta:
        model = Method
        fields = ['id', 'name', 'time', 'weight', 'course_learning_outcomes']


class AssessmentSerializer(serializers.ModelSerializer):
    type_assessment = TypeAssessmentSerializer(read_only=True)
    assessment_methods = MethodAssessmentSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'type_assessment', 'assessment_methods']


class ScheduleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleGroup
        fields = ['id', 'name']


class SlimCLOSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseLearningOutcome
        fields = ['id']


class SlimAssessmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='type_assessment.name', read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'name']


class SlimLearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ['id', 'name']


class TeachingSessionSerializer(serializers.ModelSerializer):
    schedule_group = ScheduleGroupSerializer(read_only=True)
    course_learning_outcomes = SlimCLOSerializer(many=True, read_only=True)
    assessments = SlimAssessmentSerializer(many=True, read_only=True)
    learning_materials = SlimLearningMaterialSerializer(many=True, read_only=True)

    class Meta:
        model = TeachingSession
        fields = ['id', 'session_no', 'content', 'offline_activity', 'offline_hours', 'online_activity', 'online_hours',
                  'self_study_activity', 'self_study_hours', 'course_learning_outcomes', 'assessments',
                  'learning_materials', 'schedule_group']


class MajorSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    faculty = FacultySerializer(required=True)

    class Meta:
        model = Major
        fields = ['id', 'name', 'code', 'faculty']
        extra_kwargs = {
            'code': {'validators': []},
            'name': {'validators': []}
        }

    def update(self, instance, validated_data):
        faculty_data = validated_data.pop('faculty', None)

        instance.name = validated_data.get('name', instance.name)
        instance.code = validated_data.get('code', instance.code)

        if faculty_data:
            faculty_id = faculty_data.get('id')
            try:
                faculty_instance = Faculty.objects.get(id=faculty_id)
                instance.faculty = faculty_instance
            except Faculty.DoesNotExist:
                raise serializers.ValidationError({"err_msg": "Khoa không tồn tại"})

        instance.save()
        return instance

    def create(self, validated_data):
        faculty_data = validated_data.pop('faculty', None)

        faculty_id = faculty_data.get('id')

        try:
            faculty_instance = Faculty.objects.get(id=faculty_id)
        except Faculty.DoesNotExist:
            raise serializers.ValidationError({"err_msg": "Khoa không tồn tại."})

        return Major.objects.create(faculty=faculty_instance, **validated_data)


class SyllabusSimpleSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    lecturer_id = serializers.IntegerField()
    lecturer_name = serializers.SerializerMethodField()

    class Meta:
        model = Syllabus
        fields = ['id', 'name', 'subject_name', 'lecturer_id', 'lecturer_name', 'created_date', 'start_date_edition',
                  'end_date_edition',
                  'edit_date']

    def get_lecturer_name(self, obj):
        if obj.lecturer and obj.lecturer.user:
            return f"{obj.lecturer.user.last_name} {obj.lecturer.user.first_name}"
        return "N/A"

    def get_lecturer_id(self, obj):
        if obj.lecturer and obj.lecturer.user:
            return obj.lecturer.user.id
        return "N/A"


class TrainingProgramSerializer(serializers.ModelSerializer):
    major = MajorSerializer(required=True)
    inherit_from_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = TrainingProgram
        fields = ['id', 'name', 'academic_year', 'major', 'inherit_from_id']

    def update(self, instance, validated_data):
        major_data = validated_data.pop('major', None)
        inherit_from_id = validated_data.pop('inherit_from_id', None)

        instance.name = validated_data.get('name', instance.name)
        instance.academic_year = validated_data.get('academic_year', instance.academic_year)

        if major_data:
            try:
                major_instance = Major.objects.get(id=major_data['id'])
                instance.major = major_instance
            except Major.DoesNotExist:
                raise serializers.ValidationError({"err_msg": "Chuyên ngành không tồn tại."})

        instance.save()

        if inherit_from_id:
            try:
                old_program = TrainingProgram.objects.get(id=inherit_from_id)
                old_syllabuses = old_program.syllabuses.all()
                instance.syllabuses.set(old_syllabuses)
            except TrainingProgram.DoesNotExist:
                pass

        return instance

    def create(self, validated_data):
        major_data = validated_data.pop('major')
        inherit_from_id = validated_data.pop('inherit_from_id')

        try:
            major_instance = Major.objects.get(id=major_data['id'])
        except Major.DoesNotExist:
            raise serializers.ValidationError({"err_msg": "Chuyên ngành không tồn tại."})
        program = TrainingProgram.objects.create(major=major_instance, **validated_data)
        if inherit_from_id:
            try:
                old_program = TrainingProgram.objects.get(id=inherit_from_id)
                old_syllabuses = old_program.syllabuses.all()
                program.syllabuses.set(old_syllabuses)
            except TrainingProgram.DoesNotExist:
                pass

        return program


class TemplateSubSectionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    display_mode = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    place_holder = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    table_schema = serializers.JSONField(required=False, allow_null=True)
    attribute_group_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = TemplateSubSection
        fields = ['id', 'name', 'type', 'code', 'position', 'display_mode', 'place_holder', 'table_schema',
                  'attribute_group_id']

    def to_representation(self, instance):
        ret = {
            'id': instance.id,
            'name': instance.name,
            'type': instance.type,
            'code': instance.code,
            'position': instance.position,
        }

        if hasattr(instance, 'templatetextsubsection'):
            ret['display_mode'] = instance.templatetextsubsection.display_mode
            ret['place_holder'] = instance.templatetextsubsection.place_holder

        elif hasattr(instance, 'templatetablesubsection'):
            ret['table_schema'] = instance.templatetablesubsection.table_schema

        elif hasattr(instance, 'templateselectionsubsection'):
            ret['attribute_group_id'] = instance.templateselectionsubsection.attribute_group_id

        return ret


class TemplateMainSectionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    sub_sections = TemplateSubSectionSerializer(many=True)

    class Meta:
        model = TemplateMainSection
        fields = ['id', 'name','code', 'position', 'sub_sections']


class TemplateSyllabusSerializer(serializers.ModelSerializer):
    main_sections = TemplateMainSectionSerializer(many=True)

    class Meta:
        model = TemplateSyllabus
        fields = ['id', 'name', 'version', 'is_active', 'main_sections']

    def create(self, validated_data):
        main_sections_data = validated_data.pop('main_sections', [])

        template = TemplateSyllabus.objects.create(**validated_data)

        for main_data in main_sections_data:
            sub_sections_data = main_data.pop('sub_sections', [])
            main_section = TemplateMainSection.objects.create(template=template, **main_data)

            for sub_data in sub_sections_data:
                TemplateSubSection.objects.create(main_section=main_section, **sub_data)

        return template

    def update(self, instance, validated_data):
        print(validated_data)
        main_sections_data = validated_data.pop('main_sections', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if main_sections_data is not None:
            existing_main_sections = {section.id: section for section in instance.main_sections.all()}
            for section_data in main_sections_data:
                section_id = section_data.pop('id', None)
                sub_section_list = section_data.pop('sub_sections', [])
                if section_id and section_id in existing_main_sections:
                    main_section = existing_main_sections.pop(section_id)
                    for attr, value in section_data.items():
                        setattr(main_section, attr, value)
                    main_section.save()
                else:
                    main_section = TemplateMainSection.objects.create(template=instance, **section_data)

                existing_sub_sections = {section.id: section for section in main_section.sub_sections.all()}
                for sub_section in sub_section_list:
                    sub_section_id = sub_section.pop('id', None)
                    sub_type = sub_section.get('type')

                    display_mode = sub_section.pop('display_mode', None)
                    place_holder = sub_section.pop('place_holder', None)
                    table_schema = sub_section.pop('table_schema', None)
                    attribute_group_id = sub_section.pop('attribute_group_id', None)

                    if isinstance(sub_section_id, str):
                        if sub_section_id.startswith('CUSTOM_'):
                            sub_section_id = None
                        elif sub_section_id.isdigit():
                            sub_section_id = int(sub_section_id)

                    if sub_section_id and sub_section_id in existing_sub_sections:
                        sub_instance = existing_sub_sections.pop(sub_section_id)
                        if hasattr(sub_instance, 'templatetextsubsection'):
                            child_instance = sub_instance.templatetextsubsection
                            child_instance.display_mode = display_mode
                            child_instance.place_holder = place_holder
                        elif hasattr(sub_instance, 'templatetablesubsection'):
                            child_instance = sub_instance.templatetablesubsection
                            child_instance.table_schema = table_schema
                        elif hasattr(sub_instance, 'templateselectionsubsection'):
                            child_instance = sub_instance.templateselectionsubsection
                            child_instance.attribute_group_id = attribute_group_id
                        else:
                            child_instance = sub_instance

                        for attr, value in sub_section.items():
                            setattr(child_instance, attr, value)
                        child_instance.save()
                    else:
                        if sub_type == 'text':
                            TemplateTextSubSection.objects.create(main_section=main_section, display_mode=display_mode,
                                                                  place_holder=place_holder, **sub_section)
                        elif sub_type == 'table':
                            TemplateTableSubSection.objects.create(main_section=main_section, table_schema=table_schema,
                                                                   **sub_section)
                        elif sub_type == 'selection':
                            TemplateSelectionSubSection.objects.create(main_section=main_section,
                                                                       attribute_group_id=attribute_group_id,
                                                                       **sub_section)
                        else:
                            TemplateSubSection.objects.create(main_section=main_section, **sub_section)

                for old_sub_section in existing_sub_sections.values():
                    old_sub_section.delete()

            for old_section in existing_main_sections.values():
                old_section.delete()
        return instance
