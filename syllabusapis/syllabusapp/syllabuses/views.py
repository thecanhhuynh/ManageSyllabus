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
    ProgrammeLearningOutcome, LearningMaterial, TypeLearningMaterial
from syllabuses.paginators import UserPaginator, SyllabusPagination, FacultyPagination, SubjectsPagination, \
    LearningMaterialsPagination
from syllabuses.serializer import UserSerializer, UserDetailSerializer, SyllabusSerializer, FacultySerializer, \
    SubjectSerializer, SyllabusDetailSerializer, AttributeGroupListSerializer, TypeRequirementSerializer, \
    ProgrammeLearningOutcomeSerializer, LearningMaterialSerializer


class UserView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               viewsets.GenericViewSet):
    queryset = User.objects.filter(is_active=True)
    paginator_class = UserPaginator
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    http_method_names = ['get', 'post', 'patch']

    def get_serializer_class(self):
        if self.action == 'current_user':
            return UserDetailSerializer
        return UserSerializer
    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAdminUser()]
        elif self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

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

class FacultyView(viewsets.ViewSet, generics.ListAPIView):
    queryset = Faculty.objects.all().order_by("-created_date")
    serializer_class = FacultySerializer
    pagination_class = FacultyPagination

class SubjectView(viewsets.ViewSet, generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    pagination_class = SubjectsPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = SubjectFilter


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


