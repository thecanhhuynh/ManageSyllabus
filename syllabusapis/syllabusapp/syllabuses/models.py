from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# =============================================================================
# BASE MODEL
# =============================================================================
class BaseModel(models.Model):
    name = models.CharField(max_length=100)
    created_date = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True

    def __str__(self):
        return self.name

# =============================================================================
# MODELS CHÍNH & PHỤ TRỢ
# =============================================================================
class AttributeGroup(BaseModel):
    pass

class AttributeValue(models.Model):
    name_value = models.CharField(max_length=50)
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE, related_name='attribute_values')

class Faculty(BaseModel):
    name = models.CharField(max_length=100, unique=True)

class Lecturer(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    email = models.CharField(max_length=100, null=True, blank=True)
    room = models.CharField(max_length=200, null=True, blank=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='lecturers')

class Major(BaseModel):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=50, unique=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='majors')

class TrainingProgram(BaseModel):
    name = models.CharField(max_length=150)
    academic_year = models.IntegerField()
    major = models.ForeignKey(Major, on_delete=models.CASCADE, related_name='training_programs')
    syllabuses = models.ManyToManyField('Syllabus', through='TrainingProgramSyllabus', related_name='training_programs')

class Credit(models.Model):
    numberTheory = models.IntegerField()
    numberPractice = models.IntegerField()
    hourSelfStudy = models.IntegerField()

    def get_total_credit(self):
        return self.numberTheory + self.numberPractice

    def __str__(self):
        return f"TC: {self.get_total_credit()} (LT: {self.numberTheory} - TH: {self.numberPractice})"

class Subject(models.Model):
    id = models.CharField(max_length=10, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    credit = models.OneToOneField(Credit, on_delete=models.CASCADE, related_name='subject')

    def __str__(self):
        return self.name

class TypeRequirement(BaseModel):
    name = models.CharField(max_length=30, unique=True)

class RequirementSubject(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='required_by_relation')
    require_subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='required_relation')
    type_requirement = models.ForeignKey(TypeRequirement, on_delete=models.CASCADE, related_name='requirement_subjects')

class ProgrammeLearningOutcome(models.Model):
    description = models.TextField()

class CourseObjective(models.Model):
    content = models.TextField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='course_objectives')
    programme_learning_outcomes = models.ManyToManyField(ProgrammeLearningOutcome, through='CourseObjectiveProgrammeLearningOutcome', related_name='course_objectives')

class CourseLearningOutcome(models.Model):
    content = models.TextField()
    course_objective = models.ForeignKey(CourseObjective, on_delete=models.CASCADE, related_name='course_learning_outcomes')
    plos = models.ManyToManyField(ProgrammeLearningOutcome, through='CloPloAssociation', related_name='clos')

class CloPloAssociation(models.Model):
    clo = models.ForeignKey(CourseLearningOutcome, on_delete=models.CASCADE, related_name='plo_association')
    plo = models.ForeignKey(ProgrammeLearningOutcome, on_delete=models.CASCADE, related_name='clo_association')
    rating = models.IntegerField()

class TemplateSyllabus(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    structure = models.JSONField()

class Syllabus(BaseModel):
    name = models.CharField(max_length=100, unique=True, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    created_date = models.DateTimeField(default=timezone.now)
    structure_file = models.CharField(max_length=100, default="syllabus_2025.json")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='syllabuses')
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='syllabuses')
    lecturer = models.ForeignKey(Lecturer, on_delete=models.CASCADE, related_name='syllabuses')
    template = models.ForeignKey(TemplateSyllabus, on_delete=models.CASCADE, related_name='syllabuses')
    start_date_edition = models.DateTimeField(default=timezone.now)
    end_date_edition = models.DateTimeField(default=timezone.now)
    learning_materials_rel = models.ManyToManyField('LearningMaterial', through='SyllabusLearningMaterial', related_name='syllabuses_rel')

class TypeLearningMaterial(BaseModel):
    name = models.CharField(max_length=100, unique=True)

class LearningMaterial(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    type_material = models.ForeignKey(TypeLearningMaterial, on_delete=models.CASCADE, related_name='learning_materials')

# =============================================================================
# CÁC MODEL BÀI ĐÁNH GIÁ...
# =============================================================================
class TypeAssessment(BaseModel):
    def __str__(self):
        return self.name

class Assessment(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='assessments')
    type_assessment = models.ForeignKey(TypeAssessment, on_delete=models.CASCADE, related_name='assessments')

class Method(BaseModel):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='assessment_methods')
    time = models.TextField(null=True, blank=True)
    weight = models.IntegerField(null=True, blank=True)
    course_learning_outcomes = models.ManyToManyField(CourseLearningOutcome, through='MethodCourseLearningOutcome', related_name='methods')

# =============================================================================
# CÁC MODEL TIỂU MỤC (Kế thừa đa hình trong Django)
# =============================================================================
class MainSection(BaseModel):
    code = models.CharField(max_length=50)
    position = models.IntegerField(default=1)
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='main_sections')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['code', 'syllabus'], name='uq_code_per_syllabus')
        ]
        ordering = ['position']

class SubSection(BaseModel):
    position = models.IntegerField(default=1)
    type = models.CharField(max_length=50)
    code = models.CharField(max_length=50)
    main_section = models.ForeignKey(MainSection, on_delete=models.CASCADE, related_name='sub_sections')

    class Meta:
        ordering = ['position']

class TextSubSection(SubSection):
    content = models.TextField(null=True, blank=True)
    display_mode = models.CharField(max_length=50, default="input")
    place_holder = models.CharField(max_length=100, null=True, blank=True)

class SelectionSubSection(SubSection):
    attribute_group = models.ForeignKey(AttributeGroup, on_delete=models.CASCADE, related_name='selection_sub_sections')
    selected_values = models.ManyToManyField(AttributeValue, through='SubSectionAttributeValue')

class ReferenceSubSection(SubSection):
    reference_code = models.CharField(max_length=50)

class TableSubSection(SubSection):
    data = models.JSONField()

# =============================================================================
# CÁC MODEL KẾ HOẠCH GIẢNG DẠY
# =============================================================================
class ScheduleGroup(BaseModel):
    pass

class TeachingSession(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE, related_name='teaching_sessions')
    schedule_group = models.ForeignKey(ScheduleGroup, on_delete=models.CASCADE, related_name='teaching_sessions')
    session_no = models.IntegerField()
    content = models.TextField()

    offline_activity = models.TextField(null=True, blank=True)
    offline_hours = models.FloatField(default=0)

    online_activity = models.TextField(null=True, blank=True)
    online_hours = models.FloatField(default=0)

    self_study_activity = models.TextField(null=True, blank=True)
    self_study_hours = models.FloatField(default=0)

    course_learning_outcomes = models.ManyToManyField(CourseLearningOutcome, through='TeachingSessionCourseLearningOutcome')
    assessments = models.ManyToManyField(Assessment, through='TeachingSessionAssessment')
    learning_materials = models.ManyToManyField(LearningMaterial, through='TeachingSessionLearningMaterial')

    class Meta:
        ordering = ['session_no']

# =============================================================================
# BẢNG TRUNG GIAN (ASSOCIATION MODELS)
# =============================================================================
class SyllabusLearningMaterial(models.Model):
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE)
    learning_material = models.ForeignKey(LearningMaterial, on_delete=models.CASCADE)

class SubSectionAttributeValue(models.Model):
    subsection = models.ForeignKey(SelectionSubSection, on_delete=models.CASCADE)
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)

class CourseObjectiveProgrammeLearningOutcome(models.Model):
    course_objective = models.ForeignKey(CourseObjective, on_delete=models.CASCADE)
    programme_learning_outcome = models.ForeignKey(ProgrammeLearningOutcome, on_delete=models.CASCADE)

class TrainingProgramSyllabus(models.Model):
    training_program = models.ForeignKey(TrainingProgram, on_delete=models.CASCADE)
    syllabus = models.ForeignKey(Syllabus, on_delete=models.CASCADE)

class MethodCourseLearningOutcome(models.Model):
    method = models.ForeignKey(Method, on_delete=models.CASCADE)
    clo = models.ForeignKey(CourseLearningOutcome, on_delete=models.CASCADE)

class TeachingSessionCourseLearningOutcome(models.Model):
    teaching_session = models.ForeignKey(TeachingSession, on_delete=models.CASCADE)
    clo = models.ForeignKey(CourseLearningOutcome, on_delete=models.CASCADE)

class TeachingSessionAssessment(models.Model):
    teaching_session = models.ForeignKey(TeachingSession, on_delete=models.CASCADE)
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)

class TeachingSessionLearningMaterial(models.Model):
    teaching_session = models.ForeignKey(TeachingSession, on_delete=models.CASCADE)
    learning_material = models.ForeignKey(LearningMaterial, on_delete=models.CASCADE)

# =============================================================================
# USER & ROLE
# =============================================================================


# Sử dụng AbstractBaseUser
class User(AbstractUser):
    class UserRole(models.TextChoices):
        ADMIN = 'admin'
        USER = 'user'
        SPECIALIST = 'specialist'
    active = models.BooleanField(default=True)
    joined_date = models.DateTimeField(default=timezone.now)
    avatar = CloudinaryField('image', null=True)
    user_role = models.CharField(choices=UserRole.choices,max_length=20, default=UserRole.USER)
    lecturer = models.OneToOneField(Lecturer, on_delete=models.SET_NULL, null=True, blank=True, related_name='user')

