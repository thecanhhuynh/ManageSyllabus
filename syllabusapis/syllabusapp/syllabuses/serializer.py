from rest_framework import serializers

from syllabuses.models import User, Lecturer, Faculty, Syllabus, Subject, SubSection, MainSection, TextSubSection, \
    SelectionSubSection, AttributeGroup, AttributeValue, ReferenceSubSection, Credit, RequirementSubject, \
    ProgrammeLearningOutcome, CourseObjective, CourseLearningOutcome, LearningMaterial, TypeRequirement


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name']


class LecturerSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer()

    class Meta:
        model = Lecturer
        fields = ['room', 'faculty']


class LecturerBasicSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')

    class Meta:
        model = Lecturer
        fields = ['id', 'first_name', 'last_name']


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
        faculty_name = validated_data.pop('faculty', None)
        instance = super().update(instance, validated_data)

        if hasattr(instance, 'lecturer_profile'):
            if room is not None:
                instance.lecturer_profile.room = room
            if faculty_name is not None:
                faculty_obj, _ = Faculty.objects.get_or_create(name=faculty_name)
                instance.lecturer_profile.faculty = faculty_obj
                instance.lecturer_profile.save()
            instance.lecturer_profile.save()
        return instance


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


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
        fields = ['id', 'position', 'type', 'code', 'reference_code', 'reference_data']

    def get_reference_data(self, obj):
        syllabus = obj.main_section.syllabus
        code = obj.code

        strategy_map = {
            'credit': (CreditSerializer, syllabus.subject.credit, False),
            'lecturer_info': (LecturerInfoSerializer, syllabus.lecturer, False),
            'requirement_subject': (RequirementSubjectSerializer, syllabus.subject.required_by_relation.all(), True),
            'objective_outcomes': (CourseObjectiveSerializer, syllabus.subject.course_objectives.all(), True),
            'course_learning_outcomes': (COwithCLOSerializer, syllabus.subject.course_objectives.all(), True),
            'learning_material': (LearningMaterialSerializer, syllabus.learning_materials_rel.all(), True),
        }

        strategy = strategy_map.get(code)
        if strategy:
            serializer_class, data_source, is_many = strategy
            if data_source is not None:
                return serializer_class(data_source, many=is_many).data

        return None


class SubSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubSection
        fields = ['id', 'name', 'position', 'type', 'code']

    def to_representation(self, instance):
        strategy_map = {
            'text': (TextSubSectionSerializer, 'textsubsection'),
            'selection': (SelectionSubSectionSerializer, 'selectionsubsection'),
            'reference': (ReferenceSubSectionSerializer, 'referencesubsection'),
        }

        strategy = strategy_map.get(instance.type)
        if strategy:
            serializer_class, child_relation_name = strategy
            try:
                child_instance = getattr(instance, child_relation_name)
                return serializer_class(child_instance).data
            except AttributeError:
                pass

        return super().to_representation(instance)


class SectionSerializer(serializers.ModelSerializer):
    sub_sections = SubSectionSerializer(many=True, read_only=True)

    class Meta:
        model = MainSection
        fields = ['id', 'name', 'code', 'position', 'sub_sections']


class SyllabusDetailSerializer(serializers.ModelSerializer):
    main_sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Syllabus
        fields = ['id', 'name', 'status', 'main_sections']


class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['id', 'number_theory', 'number_practice', 'hour_self_study']


class LecturerInfoSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    faculty = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Lecturer
        fields = ['first_name', 'last_name', 'email', 'room', 'faculty']


class RequirementSubjectSerializer(serializers.ModelSerializer):
    subject_id = serializers.CharField(source='require_subject.id', read_only=True)
    subject_name = serializers.CharField(source='require_subject.name', read_only=True)
    requirement_type = serializers.CharField(source='type_requirement.name', read_only=True)

    class Meta:
        model = RequirementSubject
        fields = ['subject_id', 'subject_name', 'requirement_type']


class ProgrammeLearningOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgrammeLearningOutcome
        fields = ['id', 'name', 'description']

class CourseObjectiveSerializer(serializers.ModelSerializer):
    programme_learning_outcomes = ProgrammeLearningOutcomeSerializer(many=True, read_only=True)
    class Meta:
        model = CourseObjective
        fields = ['id', 'content', 'programme_learning_outcomes']

class CourseLearningOutcomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseLearningOutcome
        fields = ['id', 'content', 'position']

class COwithCLOSerializer(serializers.ModelSerializer):
    clos = CourseLearningOutcomeSerializer(source='course_learning_outcomes', many=True, read_only=True)

    class Meta:
        model = CourseObjective
        fields = ['id', 'position', 'clos']

class LearningMaterialSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='type_material.name', read_only=True)

    class Meta:
        model = LearningMaterial
        fields = ['id', 'name', 'type_name']


class TypeRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeRequirement
        fields = ['id', 'name']