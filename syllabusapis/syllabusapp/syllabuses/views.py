import json
import logging
import os
import time
import urllib
from datetime import datetime
import io

import jwt
import redis
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.http import HttpResponse, StreamingHttpResponse, JsonResponse
from django.utils import timezone

from django.db.models.functions import Length
from django.shortcuts import render, get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from docx import Document
from docxcompose.composer import Composer
from docxtpl import DocxTemplate
from rest_framework import viewsets, status, generics, parsers, permissions, mixins, filters
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

# from handlers import get_strategy_map
from handlers.renderer import SyllabusDocxRenderer, MasterTemplateRenderer
from services.user_service import UserService
from syllabusapp.settings import ONLYOFFICE_JWT_SECRET
from syllabuses import perms
from syllabuses.filters import SyllabusFilter, SubjectFilter, LearningMaterialsFilter, UserFilter, LecturerFilter
from syllabuses.models import User, Syllabus, Faculty, Subject, AttributeGroup, TypeRequirement, \
    ProgrammeLearningOutcome, LearningMaterial, TypeLearningMaterial, TypeAssessment, CourseLearningOutcome, Assessment, \
    ScheduleGroup, Major, TrainingProgram, Lecturer, TemplateSyllabus, TemplateSubSection, TemplateMainSection, \
    TemplateTableSubSection, TemplateSelectionSubSection, TemplateTextSubSection
from syllabuses.paginators import UserPaginator, SyllabusPagination, FacultyPagination, SubjectsPagination, \
    LearningMaterialsPagination, MajorPagination, TrainingPagination, ProgrammeLearningOutcomePagination, \
    LecturerPagination, TemplatePagination
from syllabuses.serializer import UserSerializer, UserDetailSerializer, SyllabusSerializer, FacultySerializer, \
    SubjectSerializer, SyllabusDetailSerializer, AttributeGroupListSerializer, TypeRequirementSerializer, \
    ProgrammeLearningOutcomeSerializer, LearningMaterialSerializer, TypeAssessmentSerializer, ScheduleGroupSerializer, \
    MajorSerializer, TrainingProgramSerializer, SyllabusSimpleSerializer, LecturerBasicSerializer, \
    TemplateSyllabusSerializer, TemplateSyllabusBasicSerializer
from syllabuses.strategies import SUB_SECTION_STRATEGIES, DefaultStrategy


class UserView(mixins.ListModelMixin,
               mixins.RetrieveModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = User.objects.all()
    pagination_class = UserPaginator
    parser_classes = [parsers.MultiPartParser, parsers.JSONParser]
    filter_backends = [DjangoFilterBackend]
    filterset_class = UserFilter
    http_method_names = ['get', 'post', 'patch', 'put', 'delete']

    def get_queryset(self):
        base_query = User.objects.select_related(
            'lecturer_profile', 'lecturer_profile__faculty'
        ).order_by('-id')

        user = self.request.user
        if not user or not user.is_authenticated:
            return base_query.filter(is_active=True)

        if getattr(user, 'user_role', None) == 'admin' or user.is_superuser:
            return base_query

        return base_query.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'create':
            return UserSerializer
        return UserDetailSerializer

    def get_permissions(self):
        if self.action == 'current_user':
            return [permissions.IsAuthenticated()]
        return [perms.IsAdmin()]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logging.getLogger(__name__).error(
                "Lỗi validation UserView (User ID: %s): %s | Payload: %s",
                instance.id, serializer.errors, request.data
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response(
                {"error": "Admin không thể tự vô hiệu hóa tài khoản của chính mình."},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.is_active = False
        instance.active = False
        instance.save(update_fields=['is_active', 'active'])
        return Response(
            {"message": "Vô hiệu hóa tài khoản thành công."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='activate', permission_classes=[perms.IsAdmin])
    def activate(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.active = True
        instance.save(update_fields=['is_active', 'active'])
        return Response(
            {"message": "Kích hoạt tài khoản thành công."},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get', 'patch'], url_path='current-user',
            permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method == 'PATCH':
            serializer = self.get_serializer(u, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(u)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LecturerView(viewsets.ReadOnlyModelViewSet):
    queryset = Lecturer.objects.select_related('user', 'faculty').filter(user__is_active=True)
    serializer_class = LecturerBasicSerializer
    pagination_class = LecturerPagination
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LecturerFilter


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
            return [perms.IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset

        user = self.request.user
        if user.is_superuser:
            return query
        return query.filter(lecturer__user=user)

    def perform_update(self, serializer):
        user = self.request.user
        time_str = timezone.localtime().strftime('%H:%M %d/%m/%Y')

        edit_msg = f"{user.last_name} {user.first_name} đã chỉnh sửa lúc {time_str}"

        serializer.save(edit_date=edit_msg)

    @action(detail=False, methods=['patch'], url_path='bulk-update-deadlines')
    def bulk_update_deadlines(self, request):
        ids = request.data.get('ids', [])
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        if not ids:
            return Response({"err_msg": "Thiếu dữ liệu."}, status=status.HTTP_400_BAD_REQUEST)
        if not start_date:
            return Response({"err_msg": "Thiếu ngày bắt đầu."}, status=status.HTTP_400_BAD_REQUEST)
        if not end_date:
            return Response({'err_msg': 'Thiếu ngày kết thúc'}, status=status.HTTP_400_BAD_REQUEST)
        user = self.request.user
        time_str = timezone.localtime().strftime('%H:%M %d/%m/%Y')

        msg = f"{user.last_name} {user.first_name} đã phân công deadline lúc {time_str}"
        Syllabus.objects.filter(id__in=ids).update(start_date_edition=start_date, end_date_edition=end_date,
                                                   edit_date=msg)
        return Response({"msg": f"Đã cập nhật {len(ids)} đề cương."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='clos')
    def get_clos(self, request, pk=None):
        syllabus = self.get_object()
        clos = CourseLearningOutcome.objects.filter(course_objective__syllabus=syllabus)

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


class TemplateSyllabusView(viewsets.ModelViewSet):
    queryset = TemplateSyllabus.objects.prefetch_related('main_sections__sub_sections').all()
    permission_classes = [perms.IsSpecialist | perms.IsAdmin]
    pagination_class = TemplatePagination

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return TemplateSyllabusSerializer
        return TemplateSyllabusBasicSerializer

    @action(detail=True, methods=['post'], url_path='clone')
    @transaction.atomic
    def clone_template(self, request, pk=None):
        old_template = self.get_object()
        new_name = request.data.get("new_name", old_template.name)
        new_version = request.data.get(
            "new_version",
            f"{old_template.version}_copy"
        )

        if TemplateSyllabus.objects.filter(
                name=new_name,
                version=new_version
        ).exists():
            return Response(
                {"err_msg": "Template với tên và phiên bản này đã tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_template = TemplateSyllabus.objects.create(
            name=new_name,
            version=new_version,
            is_active=False,
            parent_id=old_template.id
        )

        for old_main in old_template.main_sections.all():
            new_main = TemplateMainSection.objects.create(
                name=old_main.name,
                template=new_template,
                code=old_main.code,
                position=old_main.position
            )
            for old_sub in old_main.sub_sections.all():
                strategy = SUB_SECTION_STRATEGIES.get(old_sub.type, DefaultStrategy())
                strategy.clone(old_sub, new_main)
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    ONLYOFFICE_JWT_SECRET = getattr(settings, 'ONLYOFFICE_JWT_SECRET', 'my_super_secret_jwt_key_syllabus_2026')

    @action(methods=['get'], detail=True, url_path='onlyoffice-config')
    def onlyoffice_config(self, request, pk=None):
        template = self.get_object()
        if not template.file:
            return Response({"error": "Template chưa có file docx"}, status=status.HTTP_400_BAD_REQUEST)

        docker_host = "http://host.docker.internal:8000"
        file_url = f"{docker_host}{template.file.url}"

        base_callback_path = request.build_absolute_uri(request.path).replace('onlyoffice-config/',
                                                                              'onlyoffice-callback/')
        callback_url = base_callback_path.replace(request.get_host(), "host.docker.internal:8000")

        doc_key = f"template_{template.id}_{int(template.updated_at.timestamp())}"

        config = {
            "document": {
                "fileType": "docx",
                "key": doc_key,
                "title": f"{template.name}.docx",
                "url": file_url,
                "permissions": {
                    "download": True,
                    "edit": True,
                    "print": True,
                    "review": False,
                    "chat": False,
                    "fillForms": True
                }
            },
            "documentType": "word",
            "editorConfig": {
                "mode": "edit",
                "lang": "vi",
                "callbackUrl": callback_url,
                "user": {
                    "id": str(request.user.id) if request.user.is_authenticated else "specialist_1",
                    "name": request.user.username if request.user.is_authenticated else "Specialist"
                },
                "customization": {
                    "autosave": True,
                    "forcesave": True,
                    "comments": False,
                    "plugins": True
                },
                "plugins": {
                    "autostart": [
                        "asc.{D4E8B0E1-5B3F-4A9A-90D1-2B4C5F7A9D10}"
                    ]
                    # Đã gỡ bỏ pluginsData vì plugin đã nằm sẵn trong thư mục hệ thống sdkjs-plugins
                }
            }
        }

        token = jwt.encode(config, self.ONLYOFFICE_JWT_SECRET, algorithm="HS256")
        config["token"] = token

        return Response(config)
    @action(
        methods=['post'],
        detail=True,
        url_path='onlyoffice-callback',
        authentication_classes=[],
        permission_classes=[AllowAny]
    )
    def onlyoffice_callback(self, request, pk=None):
        template = self.get_object()
        try:
            body = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({"error": 0})

        status_code = body.get('status')
        if status_code in [2, 6]:
            download_url = body.get('url')
            if download_url:
                # Nếu URL trả về từ container là localhost, thay sang host.docker.internal hoặc port 8082
                download_token = body.get('token')
                headers = {}
                if download_token:
                    headers["Authorization"] = f"Bearer {download_token}"
                elif self.ONLYOFFICE_JWT_SECRET:
                    gen_token = jwt.encode({"payload": {}}, self.ONLYOFFICE_JWT_SECRET, algorithm="HS256")
                    headers["Authorization"] = f"Bearer {gen_token}"

                # Tải file mới từ ONLYOFFICE với header Authorization
                try:
                    resp = requests.get(download_url, headers=headers, stream=True, timeout=15)
                    if resp.status_code == 200:
                        with open(template.file.path, 'wb') as f:
                            for chunk in resp.iter_content(chunk_size=8192):
                                f.write(chunk)
                        template.updated_at = timezone.now()
                        template.save()
                except Exception as e:
                    print(f"Lỗi tải file callback: {e}")

        return JsonResponse({"error": 0})

    @action(detail=True, methods=['get'], url_path='control-fields')
    def get_control_fields(self, request, pk=None):
        """
        API trả về danh sách các token (thẻ) khả dụng để React render lên Sidebar.
        """
        # Gọi thẳng classmethod từ MasterTemplateRenderer
        registry = MasterTemplateRenderer.get_all_available_tags(template_id=pk)
        return Response(registry, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='preview')
    def preview_template(self, request, pk=None):
        """
        API Render Template thành bản Preview (Chỉ đọc).
        Không làm ảnh hưởng file gốc.
        """
        template = self.get_object()

        if not template.file:
            return Response({"error": "Template chưa có file docx"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Xác định Syllabus dùng để lấy dữ liệu test
        syllabus_id = request.data.get('syllabus_id')
        if syllabus_id:
            syllabus = Syllabus.objects.filter(id=syllabus_id).first()
        else:
            # Nếu không truyền, lấy đại 1 syllabus bất kỳ trong DB để test
            syllabus = Syllabus.objects.first()

        if not syllabus:
            return Response({"error": "Không có dữ liệu Syllabus nào trong hệ thống để preview."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # 2. Render In-Memory
            renderer = MasterTemplateRenderer(template.file.path)
            rendered_io = renderer.render(syllabus)

            # 3. Lưu thành file tạm (Temp file) vào thư mục media/previews/
            temp_filename = f"previews/preview_{template.id}_{int(time.time())}.docx"
            saved_path = default_storage.save(temp_filename, ContentFile(rendered_io.read()))

            # Lấy URL truy cập file tạm
            file_url = request.build_absolute_uri(default_storage.url(saved_path))
            # Nếu chạy Docker network internal, cần map lại domain như cũ
            docker_host = getattr(settings, 'ONLYOFFICE_DOC_URL_HOST', "http://host.docker.internal:8000")
            file_url = file_url.replace(request.get_host(), docker_host.replace("http://", ""))

            # 4. Sinh Config ONLYOFFICE (Chế độ CHỈ ĐỌC - VIEW)
            doc_key = f"preview_{template.id}_{int(time.time())}"

            config = {
                "document": {
                    "fileType": "docx",
                    "key": doc_key,
                    "title": f"Bản xem trước - {template.name}.docx",
                    "url": file_url,
                    "permissions": {
                        "download": True,
                        "edit": False,  # KHÓA CHỈNH SỬA
                        "print": True,
                        "review": False,
                        "chat": False,
                        "fillForms": False
                    }
                },
                "documentType": "word",
                "editorConfig": {
                    "mode": "view",  # CHẾ ĐỘ CHỈ ĐỌC
                    "lang": "vi",
                    "user": {
                        "id": str(request.user.id) if request.user.is_authenticated else "specialist_preview",
                        "name": request.user.username if request.user.is_authenticated else "Preview User"
                    },
                    "customization": {
                        "autosave": False,
                        "forcesave": False,
                        "comments": False,
                        "plugins": False  # Tắt plugins vì không cần thiết lúc xem trước
                    }
                }
            }

            # Bọc JWT nếu ONLYOFFICE yêu cầu
            onlyoffice_secret = getattr(settings, 'ONLYOFFICE_JWT_SECRET', 'my_super_secret_jwt_key_syllabus_2026')
            if onlyoffice_secret and onlyoffice_secret != 'my_super_secret_jwt_key_syllabus_2026':
                token = jwt.encode(config, onlyoffice_secret, algorithm="HS256")
                config["token"] = token

            return Response(config, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Lỗi render preview: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=kwargs.get("partial", False)
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
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
    permission_classes = [permissions.IsAuthenticated]


    @action(detail=True, methods=['get'], url_path="syllabuses")
    def get_program_syllabuses(self, request, pk=None):
        user = self.request.user
        program = self.get_object()
        syllabuses = Syllabus.objects.filter(trainingprogramsyllabus__training_program=program)
        if not user.is_superuser:
            syllabuses = syllabuses.filter(
                lecturer__user=user
            )
        q = self.request.query_params.get('q')
        if q:
            syllabuses = syllabuses.filter(name__icontains=q)
        page = self.paginate_queryset(syllabuses)
        if page is not None:
            serializer = SyllabusSimpleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SyllabusSimpleSerializer(syllabuses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AttributeGroupView(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = AttributeGroup.objects.all()
    serializer_class = AttributeGroupListSerializer

class TypeRequirementView(viewsets.ViewSet, generics.ListAPIView):
    queryset = TypeRequirement.objects.all()
    serializer_class = TypeRequirementSerializer

class ProgrammeLearningOutcomeView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = ProgrammeLearningOutcome.objects.all()
    serializer_class = ProgrammeLearningOutcomeSerializer
    pagination_class = ProgrammeLearningOutcomePagination
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'destroy']:
            return [perms.IsAdmin()]
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        return []

    def get_queryset(self):
        return ProgrammeLearningOutcome.objects.annotate(
            name_len=Length('name')
        ).order_by('name_len', 'name')


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



class ExportSyllabusDocxView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, syllabus_id):
        try:
            renderer = SyllabusDocxRenderer(syllabus_id=syllabus_id)
            buffer = renderer.render()

            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="DeCuong_ChiTiet_{syllabus_id}.docx"'
            return response

        except Exception as e:
            return HttpResponse(f"Đã xảy ra lỗi xuất file: {str(e)}", status=500)


def sse_sync_stream(request):
    def event_stream():
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        pubsub = r.pubsub()
        pubsub.subscribe('syllabus_sync_channel')

        for message in pubsub.listen():
            if message['type'] == 'message':
                yield f"data: {message['data'].decode('utf-8')}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


class RegisterView(APIView):
    """API endpoint xử lý đăng ký người dùng mới."""
    permission_classes = [AllowAny]

    def post(self, request):
        result, status_code = UserService.register_user(request.data)
        return Response(result, status=status_code)

