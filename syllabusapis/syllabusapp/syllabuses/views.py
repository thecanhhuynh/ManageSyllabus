from django.shortcuts import render
from django.views import generic
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, generics, parsers, permissions, mixins
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from syllabuses import perms
from syllabuses.filters import SyllabusFilter, SubjectFilter, LearningMaterialsFilter
from syllabuses.models import User, Syllabus, Faculty, Subject, AttributeGroup, TypeRequirement, \
    ProgrammeLearningOutcome, LearningMaterial, TypeLearningMaterial, TypeAssessment, CourseLearningOutcome, Assessment, \
    ScheduleGroup, Major, TrainingProgram
from syllabuses.paginators import UserPaginator, SyllabusPagination, FacultyPagination, SubjectsPagination, \
    LearningMaterialsPagination, MajorPagination, TrainingPagination
from syllabuses.serializer import UserSerializer, UserDetailSerializer, SyllabusSerializer, FacultySerializer, \
    SubjectSerializer, SyllabusDetailSerializer, AttributeGroupListSerializer, TypeRequirementSerializer, \
    ProgrammeLearningOutcomeSerializer, LearningMaterialSerializer, TypeAssessmentSerializer, ScheduleGroupSerializer, \
    MajorSerializer, TrainingProgramSerializer, SyllabusSimpleSerializer


class UserView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = User.objects.filter(is_active=True)
    paginator_class = UserPaginator
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'current_user':
            return UserDetailSerializer
        return UserSerializer
    def get_permissions(self):
        if self.action in ['list', 'create', 'partial_update', 'destroy']:
            return [perms.IsAdmin()]
        if self.action == 'current_user':
            return [permissions.IsAuthenticated()]
        return []

    @action(detail=False, methods=['get', 'patch'], url_path='current-user',
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            serializer = self.get_serializer(u, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(u)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SyllabusView(viewsets.ModelViewSet):
    queryset = Syllabus.objects.all().order_by("-created_date")
    pagination_class = SyllabusPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = SyllabusFilter
    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return SyllabusDetailSerializer
        return SyllabusSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [perms.IsSpecialist()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset

        user = self.request.user
        if user.is_superuser:
            return query
        return query.filter(lecturer__user=user)

    @action(detail=True, methods=['get'], url_path='clos')
    def get_clos(self, request, pk=None):
        syllabus = self.get_object()
        clos = CourseLearningOutcome.objects.filter(course_objective__subject=syllabus.subject)

        data = [{
            "id": clo.id,
            "name": f"CLO{clo.course_objective.position}.{clo.position}" if hasattr(clo,
                                                                                    'position') else f"CLO {clo.id}",
            "content": clo.content
        } for clo in clos]

        return Response(data)

    @action(detail=True, methods=['get'], url_path='assessments')
    def get_assessments(self, request, pk=None):
        syllabus = self.get_object()
        assessments = Assessment.objects.filter(syllabus=syllabus).select_related('type_assessment')
        data = [{
            "id": assessment.id,
            "name": assessment.type_assessment.name
        } for assessment in assessments]

        return Response(data)

    @action(detail=True, methods=['get'], url_path='learning-materials')
    def get_learning_materials(self, request, pk=None):
        syllabus = self.get_object()
        learning_materials = LearningMaterial.objects.filter(syllabuses_rel=syllabus)
        data = [{
            "id": learning_material.id,
            "name": learning_material.name
        }for learning_material in learning_materials]
        return Response(data)

class FacultyView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    pagination_class = FacultyPagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'destroy']:
            return [perms.IsAdmin()]
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        return []

class SubjectView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    pagination_class = SubjectsPagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'destroy']:
            return [perms.IsAdmin()]
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        return []
    filter_backends = [DjangoFilterBackend]
    filterset_class = SubjectFilter

class MajorView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = Major.objects.all()
    serializer_class = MajorSerializer
    pagination_class = MajorPagination
    http_method_names = ['get', 'post', 'patch', 'delete']
    permission_classes = [perms.IsAdmin]

    def create(self, request, *args, **kwargs):
        print("===== REQUEST DATA =====")
        print(request.data)

        serializer = self.get_serializer(data=request.data)

        print("===== INITIAL DATA =====")
        print(serializer.initial_data)

        if serializer.is_valid():
            print("===== VALIDATED DATA =====")
            print(serializer.validated_data)

            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        print("===== ERRORS =====")
        print(serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        print("===== REQUEST DATA =====")
        print(request.data)

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.get("partial", False)
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        print("===== ERRORS =====")
        print(serializer.errors)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TrainingProgramView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
    pagination_class = TrainingPagination
    http_method_names = ['get', 'post', 'patch', 'delete']
    permission_classes = [perms.IsAdmin]

    @action(detail=True, methods=['get'], url_path="syllabuses")
    def get_program_syllabuses(self, request, pk=None):
        program = self.get_object()
        syllabuses = Syllabus.objects.filter(trainingprogramsyllabus__training_program=program)
        page = self.paginate_queryset(syllabuses)
        if page is not None:
            serializer = SyllabusSimpleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SyllabusSimpleSerializer(syllabuses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class AttributeGroupView(viewsets.ViewSet, generics.ListAPIView):
    queryset = AttributeGroup.objects.all()
    serializer_class = AttributeGroupListSerializer

class TypeRequirementView(viewsets.ViewSet, generics.ListAPIView):
    queryset = TypeRequirement.objects.all()
    serializer_class = TypeRequirementSerializer

class ProgrammeLearningOutcomeView(viewsets.ViewSet, generics.ListAPIView):
    queryset = ProgrammeLearningOutcome.objects.all()
    serializer_class = ProgrammeLearningOutcomeSerializer

class LearningMaterialsView(viewsets.ViewSet, generics.ListAPIView):
    queryset = LearningMaterial.objects.all()
    serializer_class = LearningMaterialSerializer
    pagination_class = LearningMaterialsPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = LearningMaterialsFilter

class TypeLearningMaterialsView(viewsets.ViewSet, generics.ListAPIView):
    queryset = TypeLearningMaterial.objects.all()
    serializer_class = TypeRequirementSerializer

class TypeAssessmentView(viewsets.ViewSet, generics.ListAPIView):
    queryset = TypeAssessment.objects.all()
    serializer_class = TypeAssessmentSerializer

class ScheduleView(viewsets.ViewSet, generics.ListAPIView):
    queryset = ScheduleGroup.objects.all()
    serializer_class = ScheduleGroupSerializer



