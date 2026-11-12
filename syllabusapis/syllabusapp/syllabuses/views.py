import copy
import json
import logging
import os
import time

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from oauth2_provider.views import TokenView

logger = logging.getLogger(__name__)
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

from django.db.models import Q
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

from handlers.docx_cleaner import DocxCleanerService
from handlers.renderer import SyllabusDocxRenderer
from handlers.block_style_renderer import BlockStyleDocxRenderer
from handlers.shell_renderer import ShellDocxRenderer
from services.notify_service import NotifyService
from services.user_service import UserService
from syllabusapp.settings import ONLYOFFICE_JWT_SECRET
from syllabuses import perms
from syllabuses.filters import (
    FacultyFilter,
    LearningMaterialsFilter,
    LecturerFilter,
    MajorFilter,
    ProgrammeLearningOutcomeFilter,
    SubjectFilter,
    SyllabusFilter,
    TemplateFilter,
    TrainingProgramFilter,
    UserFilter,
)
from syllabuses.models import User, Syllabus, Faculty, Subject, AttributeGroup, AttributeValue, TypeRequirement, \
    ProgrammeLearningOutcome, LearningMaterial, TypeLearningMaterial, TypeAssessment, CourseLearningOutcome, Assessment, \
    ScheduleGroup, Major, TrainingProgram, Lecturer, TemplateSyllabus, TemplateSubSection, TemplateMainSection, \
    TemplateTableSubSection, TemplateSelectionSubSection, TemplateTextSubSection, \
    TemplateBlock, CustomColumn, CustomColumnValue, generate_custom_column_key
from syllabuses.paginators import UserPaginator, SyllabusPagination, FacultyPagination, SubjectsPagination, \
    LearningMaterialsPagination, MajorPagination, TrainingPagination, ProgrammeLearningOutcomePagination, \
    LecturerPagination, TemplatePagination
from syllabuses.serializer import UserSerializer, UserDetailSerializer, SyllabusSerializer, FacultySerializer, \
    SubjectSerializer, SyllabusDetailSerializer, AttributeGroupListSerializer, TypeRequirementSerializer, \
    ProgrammeLearningOutcomeSerializer, LearningMaterialSerializer, TypeAssessmentSerializer, ScheduleGroupSerializer, \
    MajorSerializer, TrainingProgramSerializer, SyllabusSimpleSerializer, LecturerBasicSerializer, \
    TemplateSyllabusSerializer, TemplateSyllabusBasicSerializer, \
    TemplateBlockSerializer, CustomColumnSerializer, CustomColumnValueSerializer
from syllabuses.strategies import SUB_SECTION_STRATEGIES, DefaultStrategy

logger = logging.getLogger(__name__)

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
        if self.action in ['current_user', 'user_signature', 'change_password']:
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

    @action(detail=False, methods=['get', 'post', 'delete'], url_path='signature',
            permission_classes=[permissions.IsAuthenticated])
    def user_signature(self, request):
        lecturer = getattr(request.user, 'lecturer_profile', None)
        if not lecturer:
            lecturer, _ = Lecturer.objects.get_or_create(user=request.user)

        if request.method == 'GET':
            sig_url = self._build_absolute_sig_url(request, lecturer)
            return Response({'signature_url': sig_url, 'faculty_role': lecturer.faculty_role})

        if request.method == 'DELETE':
            if lecturer.signature_image:
                lecturer.signature_image.delete(save=False)
                lecturer.signature_image = None
                lecturer.save(update_fields=['signature_image'])
            return Response({'signature_url': None}, status=status.HTTP_200_OK)

        image_data = request.data.get('signature_image') or request.FILES.get('signature_image')
        from services.signature_service import SignatureService
        resolved = SignatureService.process_signature_image(image_data)
        if not resolved:
            return Response({'error': 'Dữ liệu chữ ký không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        if lecturer.signature_image:
            lecturer.signature_image.delete(save=False)
        lecturer.signature_image = resolved
        lecturer.save(update_fields=['signature_image'])
        sig_url = self._build_absolute_sig_url(request, lecturer)
        return Response({'signature_url': sig_url}, status=status.HTTP_200_OK)

    def _build_absolute_sig_url(self, request, lecturer) -> str | None:
        if not lecturer or not lecturer.signature_image:
            return None
        try:
            return request.build_absolute_uri(lecturer.signature_image.url)
        except Exception:
            return lecturer.signature_image.url

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

    @action(detail=False, methods=['post'], url_path='change-password',
            permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {"error": "Vui lòng cung cấp mật khẩu cũ và mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not user.check_password(old_password):
            return Response(
                {"error": "Mật khẩu hiện tại không chính xác."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if old_password == new_password:
            return Response(
                {"error": "Mật khẩu mới không được trùng với mật khẩu hiện tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=user)
        except Exception as e:
            msg = list(e.messages)[0] if hasattr(e, 'messages') and e.messages else str(e)
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)



class LecturerView(viewsets.ReadOnlyModelViewSet):
    queryset = Lecturer.objects.select_related('user', 'faculty').filter(user__is_active=True)
    serializer_class = LecturerBasicSerializer
    pagination_class = LecturerPagination
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = LecturerFilter

class SyllabusView(viewsets.ModelViewSet):
    queryset = Syllabus.objects.select_related(
        'subject', 'faculty', 'lecturer__user', 'approved_by'
    ).prefetch_related('training_programs').all().order_by("-created_date")
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
        if self.action == 'bulk_update_deadlines':
            return [(perms.IsAdmin | perms.IsSpecialist)()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset
        user = self.request.user
        if not user.is_authenticated:
            return query.none()
        if user.is_superuser or getattr(user, 'user_role', None) in ['admin', 'specialist']:
            return query
        lecturer = getattr(user, 'lecturer_profile', None)
        if lecturer and lecturer.is_leader and lecturer.faculty_id:
            return query.filter(Q(lecturer__user=user) | Q(faculty_id=lecturer.faculty_id))
        return query.filter(lecturer__user=user)

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance and instance.is_approved:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"err_msg": "Đề cương đã được phê duyệt. Vui lòng liên hệ Lãnh đạo Khoa hủy duyệt trước khi chỉnh sửa."}
            )

        start_dt = serializer.validated_data.get('start_date_edition')
        end_dt = serializer.validated_data.get('end_date_edition')
        if start_dt and end_dt and (end_dt - start_dt).total_seconds() < 3 * 86400:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {"err_msg": "Thời hạn kết thúc phải cách thời gian bắt đầu tối thiểu 3 ngày theo quy định BR-03."}
            )

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
            return Response({'err_msg': 'Thiếu ngày kết thúc.'}, status=status.HTTP_400_BAD_REQUEST)
        if str(start_date) >= str(end_date):
            return Response({'err_msg': 'Ngày kết thúc phải sau ngày bắt đầu.'}, status=status.HTTP_400_BAD_REQUEST)

        from datetime import datetime
        try:
            s_dt = datetime.fromisoformat(str(start_date).replace('Z', '+00:00'))
            e_dt = datetime.fromisoformat(str(end_date).replace('Z', '+00:00'))
            if (e_dt - s_dt).total_seconds() < 3 * 86400:
                return Response(
                    {"err_msg": "Thời hạn kết thúc phải cách thời gian bắt đầu tối thiểu 3 ngày theo quy định BR-03."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            pass

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

    @action(detail=True, methods=['get', 'post', 'put'], url_path='custom-values')
    def custom_values(self, request, pk=None):
        syllabus = self.get_object()
        template = getattr(syllabus, 'template', None)
        if not template:
            return Response([])

        if request.method == 'GET':
            qs = CustomColumnValue.objects.filter(column__template=template)
            table_code = request.query_params.get('table_code')
            object_id = request.query_params.get('object_id')
            if table_code:
                qs = qs.filter(column__table_code=table_code)
            if object_id:
                qs = qs.filter(object_id=str(object_id))
            return Response(CustomColumnValueSerializer(qs, many=True).data)

        items = request.data.get('values')
        if items is None and isinstance(request.data, list):
            items = request.data
        elif items is None and isinstance(request.data, dict):
            items = [request.data]

        saved = []
        for item in (items or []):
            col_id = item.get('column') or item.get('column_id')
            col_key = item.get('column_key')
            obj_id = item.get('object_id')
            val = item.get('value', '')

            col = None
            if col_id:
                col = CustomColumn.objects.filter(id=col_id, template=template).first()
            elif col_key:
                col = CustomColumn.objects.filter(column_key=col_key, template=template).first()

            if col and obj_id:
                obj, _ = CustomColumnValue.objects.update_or_create(
                    column=col,
                    object_id=str(obj_id),
                    defaults={'value': str(val)},
                )
                saved.append(obj)

        return Response({
            'message': f'Đã lưu {len(saved)} giá trị tùy biến.',
            'values': CustomColumnValueSerializer(saved, many=True).data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='signatures',
            permission_classes=[permissions.IsAuthenticated])
    def get_signatures(self, request, pk=None):
        syllabus = self.get_object()
        from syllabuses.serializer import SyllabusSignatureSerializer
        sigs = syllabus.signatures.filter(is_active=True).order_by('signed_at')
        return Response(SyllabusSignatureSerializer(sigs, many=True).data)

    @action(detail=True, methods=['get'], url_path='validation-status',
            permission_classes=[permissions.IsAuthenticated])
    def validation_status(self, request, pk=None):
        syllabus = self.get_object()
        from services.signature_service import SignatureService
        is_complete, missing_items = SignatureService.validate_syllabus_completeness(syllabus)
        return Response({
            "is_complete": is_complete,
            "missing_items": missing_items,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='sign',
            permission_classes=[permissions.IsAuthenticated])
    def sign_syllabus(self, request, pk=None):
        syllabus = self.get_object()
        role = request.data.get('role')
        image_data = request.data.get('signature_image') or request.FILES.get('signature_image')
        title = request.data.get('title')

        from services.signature_service import SignatureService
        sig, err = SignatureService.sign_syllabus(
            user=request.user,
            syllabus=syllabus,
            role=role,
            image_raw=image_data,
            title=title,
        )
        if not sig:
            return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

        from syllabuses.serializer import SyllabusSignatureSerializer
        return Response(SyllabusSignatureSerializer(sig).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='approve',
            permission_classes=[permissions.IsAuthenticated])
    def approve_syllabus(self, request, pk=None):
        syllabus = self.get_object()
        if not self._can_approve_syllabus(request.user, syllabus):
            return Response(
                {"error": "Chỉ Lãnh đạo Khoa phụ trách hoặc Quản trị viên mới có quyền phê duyệt đề cương."},
                status=status.HTTP_403_FORBIDDEN
            )

        is_admin = request.user.is_superuser or getattr(request.user, 'user_role', None) in ['admin', 'specialist']
        if not is_admin and syllabus.lecturer and syllabus.lecturer.user_id == request.user.id:
            return Response(
                {"error": "Bạn là giảng viên biên soạn đề cương này nên không thể tự phê duyệt theo quy định BR-04. Vui lòng chuyển cho Lãnh đạo khác của Khoa phê duyệt."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from syllabuses.models import TeachingSession, Assessment, Method, SyllabusSignature
        if not TeachingSession.objects.filter(syllabus=syllabus).exists():
            return Response(
                {"error": "Đề cương chưa có Kế hoạch giảng dạy. Không thể phê duyệt."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not Assessment.objects.filter(syllabus=syllabus).exists():
            return Response(
                {"error": "Đề cương chưa có Phương pháp đánh giá. Không thể phê duyệt."},
                status=status.HTTP_400_BAD_REQUEST
            )

        methods = Method.objects.filter(assessment__syllabus=syllabus)
        total_weight = sum(m.weight for m in methods if m.weight is not None)
        if not methods.exists() or total_weight != 100:
            return Response(
                {"error": f"Tổng trọng số các phương pháp đánh giá phải bằng đúng 100% theo quy định BR-02 (hiện tại: {total_weight}%). Không thể phê duyệt."},
                status=status.HTTP_400_BAD_REQUEST
            )

        has_lec_sig = SyllabusSignature.objects.filter(
            syllabus=syllabus,
            role=SyllabusSignature.SignatureRole.LECTURER,
            is_active=True
        ).exists()
        if not has_lec_sig:
            return Response(
                {"error": "Giảng viên biên soạn chưa ký số xác nhận đề cương. Vui lòng yêu cầu giảng viên ký số trước khi phê duyệt."},
                status=status.HTTP_400_BAD_REQUEST
            )

        syllabus.status = Syllabus.Status.APPROVED
        syllabus.approved_by = request.user
        syllabus.approved_date = timezone.now()
        syllabus.save(update_fields=['status', 'approved_by', 'approved_date'])
        return Response({
            "message": "Phê duyệt đề cương thành công.",
            "status": syllabus.status,
            "approved_by": request.user.get_full_name() or request.user.username,
            "approved_date": syllabus.approved_date.strftime("%d/%m/%Y %H:%M")
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unapprove',
            permission_classes=[permissions.IsAuthenticated])
    def unapprove_syllabus(self, request, pk=None):
        syllabus = self.get_object()
        if not self._can_approve_syllabus(request.user, syllabus):
            return Response(
                {"error": "Chỉ Lãnh đạo Khoa phụ trách hoặc Quản trị viên mới có quyền hủy phê duyệt đề cương."},
                status=status.HTTP_403_FORBIDDEN
            )
        reason = str(request.data.get('reason') or '').strip()
        syllabus.status = Syllabus.Status.DRAFT
        syllabus.approved_by = None
        syllabus.approved_date = None
        syllabus.save(update_fields=['status', 'approved_by', 'approved_date'])

        from syllabuses.models import SyllabusSignature
        SyllabusSignature.objects.filter(
            syllabus=syllabus,
            role=SyllabusSignature.SignatureRole.FACULTY_DEAN
        ).update(
            status=SyllabusSignature.SignatureStatus.REJECTED,
            comments=reason if reason else "Lãnh đạo Khoa yêu cầu chỉnh sửa lại nội dung."
        )

        return Response({
            "message": "Đã hủy phê duyệt, đề cương đã chuyển về trạng thái Bản nháp.",
            "status": syllabus.status,
            "reason": reason
        }, status=status.HTTP_200_OK)

    def _can_approve_syllabus(self, user, syllabus) -> bool:
        if user.is_superuser or getattr(user, 'user_role', None) in ['admin', 'specialist']:
            return True
        lecturer = getattr(user, 'lecturer_profile', None)
        if not lecturer or not lecturer.is_leader:
            return False
        if not syllabus.faculty_id or lecturer.faculty_id != syllabus.faculty_id:
            return False
        return True


from handlers.block_style_validator import (
    get_default_block_layout as _default_block_layout,
    validate_block_layout as _validate_block_layout,
)

class TemplateSyllabusView(viewsets.ModelViewSet):
    queryset = TemplateSyllabus.objects.prefetch_related('main_sections__sub_sections').all()
    permission_classes = [perms.IsSpecialist | perms.IsAdmin]
    pagination_class = TemplatePagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = TemplateFilter

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return TemplateSyllabusSerializer
        return TemplateSyllabusBasicSerializer

    def get_permissions(self):
        if self.action == 'custom_columns' and self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [(perms.IsSpecialist | perms.IsAdmin)()]

    def _clone_template_files(self, old_template, new_template):
        if old_template.file and old_template.file.name:
            try:
                old_template.file.open('rb')
                content = old_template.file.read()
                filename = os.path.basename(old_template.file.name)
                new_template.file.save(filename, ContentFile(content), save=False)
            except Exception:
                pass
            finally:
                try:
                    old_template.file.close()
                except Exception:
                    pass

        if not (old_template.file_clean and old_template.file_clean.name):
            return
        try:
            old_template.file_clean.open('rb')
            clean_content = old_template.file_clean.read()
            clean_filename = os.path.basename(old_template.file_clean.name)
            new_template.file_clean.save(clean_filename, ContentFile(clean_content), save=False)
        except Exception:
            pass
        finally:
            try:
                old_template.file_clean.close()
            except Exception:
                pass

    def _clone_custom_columns(self, old_template, new_template):
        for col in old_template.custom_columns.filter(is_active=True):
            CustomColumn.objects.create(
                template=new_template,
                table_code=col.table_code,
                level=col.level,
                column_key=col.column_key,
                column_label=col.column_label,
                column_type=col.column_type,
                default_value=col.default_value,
                position=col.position,
                is_active=True,
            )

    def _clone_template_blocks(self, old_template, new_template):
        from services.template_block_sync_service import TemplateBlockSyncService
        TemplateBlockSyncService.sync_blocks_for_template(new_template)
        old_blocks = {b.code: b for b in old_template.blocks.all()}
        for new_b in new_template.blocks.all():
            old_b = old_blocks.get(new_b.code)
            if not old_b:
                continue
            new_b.xml_template = old_b.xml_template
            new_b.style_config = copy.deepcopy(old_b.style_config or {})
            new_b.reference_class = old_b.reference_class
            new_b.position = old_b.position
            new_b.is_active = old_b.is_active
            new_b.save()

    def _clone_sections(self, old_template, new_template):
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

    @action(detail=True, methods=['post'], url_path='clone')
    @transaction.atomic
    def clone_template(self, request, pk=None):
        old_template = self.get_object()
        new_name = request.data.get("new_name", old_template.name)
        new_version = request.data.get("new_version", f"{old_template.version}_copy")

        if TemplateSyllabus.objects.filter(name=new_name, version=new_version).exists():
            return Response(
                {"err_msg": "Template với tên và phiên bản này đã tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_template = TemplateSyllabus.objects.create(
            name=new_name,
            version=new_version,
            is_active=False,
            parent_id=old_template.id,
            block_layout=copy.deepcopy(old_template.block_layout or {})
        )
        self._clone_template_files(old_template, new_template)
        new_template.save()

        self._clone_sections(old_template, new_template)
        self._clone_custom_columns(old_template, new_template)
        self._clone_template_blocks(old_template, new_template)

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
                download_token = body.get('token')
                headers = {}
                if download_token:
                    headers["Authorization"] = f"Bearer {download_token}"
                elif self.ONLYOFFICE_JWT_SECRET:
                    gen_token = jwt.encode({"payload": {}}, self.ONLYOFFICE_JWT_SECRET, algorithm="HS256")
                    headers["Authorization"] = f"Bearer {gen_token}"

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
        registry = MasterTemplateRenderer.get_all_available_tags(template_id=pk)
        return Response(registry, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='upload-docx',
            parser_classes=[parsers.MultiPartParser])
    def upload_docx(self, request, pk=None):
        """
        Upload file DOCX gốc mới. Hệ thống tự động chạy DocxCleanerService
        (Chiến lược A) và lưu kết quả vào `file_clean`.

        Body (multipart): file=<DOCX file>
        """
        template = self.get_object()
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {'error': 'Vui lòng gửi kèm file DOCX.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not uploaded_file.name.endswith('.docx'):
            return Response(
                {'error': 'Chỉ chấp nhận file định dạng .docx'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if uploaded_file.size > 20 * 1024 * 1024:
            return Response(
                {'error': 'Dung lượng file vượt quá giới hạn tối đa cho phép (20MB).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_bytes = uploaded_file.read()

        import zipfile
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                if 'word/document.xml' not in zf.namelist():
                    return Response(
                        {'error': 'File DOCX không đúng cấu trúc OpenXML (thiếu word/document.xml).'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except zipfile.BadZipFile:
            return Response(
                {'error': 'Tệp tải lên không phải là file DOCX hợp lệ hoặc cấu trúc file zip bị hỏng.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        cleaned_buffer, report = DocxCleanerService.clean(file_bytes)

        template.file.save(uploaded_file.name, ContentFile(file_bytes), save=False)
        template.file_clean.save(
            uploaded_file.name,
            ContentFile(cleaned_buffer.read()),
            save=False
        )
        template.save()

        return Response({
            'message': 'Upload và làm sạch thành công.',
            'clean_report': report.summary(),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'patch'], url_path='style-config')
    def style_config(self, request, pk=None):
        """
        GET:   Trả về block_layout hiện tại (hoặc default nếu chưa có).
        PATCH: Cập nhật block_layout draft, chưa publish (chưa gửi SSE).
        """
        template = self.get_object()

        if request.method == 'GET':
            return self._get_style_config(template)
        return self._patch_style_config(request, template)

    @staticmethod
    def _get_style_config(template):
        """Trả về block_layout hiện tại hoặc schema default nếu chưa có."""
        layout = template.block_layout or _default_block_layout()
        return Response({
            'template_name': template.name,
            'block_layout': layout,
            'layout_published_at': template.layout_published_at,
        }, status=status.HTTP_200_OK)

    @staticmethod
    def _patch_style_config(request, template):
        """Lưu draft block_layout mà không publish (không gửi SSE)."""
        block_layout = request.data.get('block_layout')
        if not isinstance(block_layout, dict):
            return Response(
                {'error': 'block_layout phải là JSON object.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        template.block_layout = block_layout
        template.save(update_fields=['block_layout'])
        return Response({'message': 'Lưu draft thành công.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='publish-style')
    def publish_style(self, request, pk=None):
        """
        Lưu block_layout chính thức vào DB + gửi SSE cho Lecturer.

        Body (JSON): { "block_layout": { ... } }
        """
        template = self.get_object()
        block_layout = request.data.get('block_layout')

        error = _validate_block_layout(block_layout)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        template.block_layout = block_layout
        template.layout_published_at = timezone.now()
        template.is_active = True
        template.save(update_fields=['block_layout', 'layout_published_at', 'is_active'])

        NotifyService.notify_template_updated(
            template.id, template.name,
            label_overrides=(template.block_layout or {}).get('label_overrides', {})
        )

        return Response({
            'message': 'Publish thành công. Lecturer đã được thông báo.',
            'layout_published_at': template.layout_published_at,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'], url_path='blocks')
    def blocks(self, request, pk=None):
        template = self.get_object()
        if request.method == 'GET':
            from services.template_block_sync_service import TemplateBlockSyncService
            items = TemplateBlockSyncService.sync_blocks_for_template(template)
            return Response(TemplateBlockSerializer(items, many=True).data)

        incoming = request.data
        if 'blocks' in incoming and isinstance(incoming['blocks'], list):
            for item in incoming['blocks']:
                b_id = item.get('id')
                pos = item.get('position')
                if b_id and pos is not None:
                    TemplateBlock.objects.filter(id=b_id, template=template).update(position=pos)
            return Response({'message': 'Cập nhật thứ tự thành công.'})

        data = dict(incoming)
        data['template'] = template.id
        serializer = TemplateBlockSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(template=template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='custom-columns')
    def custom_columns(self, request, pk=None):
        template = self.get_object()
        if request.method == 'GET':
            qs = CustomColumn.objects.filter(template=template, is_active=True)
            table_code = request.query_params.get('table_code')
            if table_code:
                qs = qs.filter(table_code=table_code)
            return Response(CustomColumnSerializer(qs, many=True).data)

        table_code = request.data.get('table_code')
        if not table_code:
            return Response({'error': 'Thiếu table_code.'}, status=status.HTTP_400_BAD_REQUEST)

        current_count = CustomColumn.objects.filter(template=template, table_code=table_code, is_active=True).count()
        if current_count >= 10:
            return Response({'error': 'Mỗi bảng chỉ được tối đa 10 cột tùy biến.'}, status=status.HTTP_400_BAD_REQUEST)

        key = generate_custom_column_key(template.id, table_code)
        data = dict(request.data)
        data['template'] = template.id
        serializer = CustomColumnSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(template=template, column_key=key)
        NotifyService.notify_template_updated(
            template.id, template.name,
            label_overrides=(template.block_layout or {}).get('label_overrides', {})
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'patch'], url_path='header-footer')
    def header_footer(self, request, pk=None):
        template = self.get_object()
        block_layout = template.block_layout or {}
        if request.method == 'GET':
            return Response(block_layout.get('header_footer', {}))

        hf_data = request.data.get('header_footer', request.data)
        block_layout['header_footer'] = hf_data
        template.block_layout = block_layout
        template.save(update_fields=['block_layout'])
        return Response({'message': 'Cập nhật Header/Footer thành công.', 'header_footer': hf_data})

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-logo',
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def upload_logo(self, request, pk=None):
        template = self.get_object()
        logo_file = request.FILES.get('logo')
        if not logo_file:
            return Response({'error': 'Thiếu file logo.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(logo_file.name)[1].lower()
        if ext not in {'.png', '.jpg', '.jpeg', '.gif', '.webp'}:
            return Response({'error': f'Định dạng không hỗ trợ: {ext}.'}, status=status.HTTP_400_BAD_REQUEST)

        if logo_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File quá lớn (max 5MB).'}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"logo_{template.id}_{int(time.time())}{ext}"
        relative_path = os.path.join('templates', 'logos', filename)
        saved_path = default_storage.save(relative_path, logo_file)
        logo_url = f"/media/{saved_path.replace(os.sep, '/')}"

        self._update_template_logo(template, logo_url)
        return Response({'logo_url': logo_url}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='delete-logo')
    def delete_logo(self, request, pk=None):
        template = self.get_object()
        hf = (template.block_layout or {}).get('header_footer', {})
        logo_url = hf.get('header', {}).get('logo_url') or hf.get('logo_url')
        if not logo_url:
            return Response({'error': 'Không có logo để xóa.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            rel = logo_url.lstrip('/')
            if rel.startswith('media/'):
                rel = rel[6:]
            if default_storage.exists(rel):
                default_storage.delete(rel)
        except Exception:
            logger.exception("Failed to delete logo file")

        self._update_template_logo(template, None)
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

    @staticmethod
    def _update_template_logo(template, logo_url):
        layout = dict(template.block_layout or {})
        hf = dict(layout.get('header_footer') or {})
        header = dict(hf.get('header') or {})
        header['logo_url'] = logo_url
        hf['header'] = header
        layout['header_footer'] = hf
        template.block_layout = layout
        template.save(update_fields=['block_layout'])

    @action(detail=True, methods=['post'], url_path='bulk-spacing')
    def bulk_spacing(self, request, pk=None):
        template = self.get_object()
        scope = request.data.get("scope", "all")
        scope_value = request.data.get("scope_value")
        spacing = request.data.get("spacing") or {}
        overwrite = bool(request.data.get("overwrite", True))
        dry_run = bool(request.data.get("dry_run", False))

        allowed_keys = {"line_spacing", "space_before_pt", "space_after_pt"}
        if not spacing or not set(spacing.keys()).issubset(allowed_keys):
            return Response(
                {"error": "spacing không hợp lệ."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocks = list(self._get_blocks_for_bulk(template, scope, scope_value))
        affected = [
            {"id": b.id, "code": b.code, "name": b.name, "block_type": b.block_type}
            for b in blocks
        ]

        if dry_run:
            return Response({
                "dry_run": True,
                "updated_count": len(blocks),
                "affected_blocks": affected,
            })

        updated_count = self._apply_bulk_spacing(template, blocks, spacing, overwrite)
        return Response({
            "dry_run": False,
            "updated_count": updated_count,
            "affected_blocks": affected,
            "can_rollback": updated_count > 0,
        })

    @action(detail=True, methods=['post'], url_path='rollback-bulk-spacing')
    def rollback_bulk_spacing(self, request, pk=None):
        template = self.get_object()
        layout = dict(template.block_layout or {})
        snapshot = layout.get("bulk_spacing_backup")
        if not snapshot:
            return Response(
                {"error": "Không có snapshot để hoàn tác."},
                status=status.HTTP_404_NOT_FOUND,
            )

        restored = 0
        with transaction.atomic():
            for block_id_str, style_config in snapshot.items():
                try:
                    block = TemplateBlock.objects.get(
                        id=int(block_id_str),
                        template=template,
                    )
                except TemplateBlock.DoesNotExist:
                    continue
                block.style_config = style_config
                block.save(update_fields=["style_config"])
                restored += 1

            del layout["bulk_spacing_backup"]
            template.block_layout = layout
            template.save(update_fields=["block_layout"])

        return Response({"status": "ok", "restored_count": restored})

    @staticmethod
    def _get_blocks_for_bulk(template, scope, scope_value):
        qs = TemplateBlock.objects.filter(template=template, is_active=True)
        if scope == "main_section" and scope_value:
            try:
                ms = TemplateMainSection.objects.get(id=scope_value, template=template)
            except TemplateMainSection.DoesNotExist:
                return qs.none()
            sub_codes = list(ms.sub_sections.values_list("code", flat=True))
            return qs.filter(
                Q(code__in=sub_codes)
                | Q(config__code__in=sub_codes)
                | Q(config__table_code__in=sub_codes)
            )

        if scope == "block_type" and scope_value:
            return qs.filter(block_type=scope_value)

        return qs

    @staticmethod
    def _apply_bulk_spacing(template, blocks, spacing, overwrite):
        if not blocks:
            return 0

        snapshot = {str(b.id): dict(b.style_config or {}) for b in blocks}
        layout = dict(template.block_layout or {})
        layout["bulk_spacing_backup"] = snapshot

        draft_styles = layout.get("block_styles", {})
        for b in blocks:
            if b.code in draft_styles:
                del draft_styles[b.code]
        layout["block_styles"] = draft_styles
        
        template.block_layout = layout
        template.save(update_fields=["block_layout"])

        updated = 0
        with transaction.atomic():
            for block in blocks:
                cfg = dict(block.style_config or {})
                content_style = dict(cfg.get("content_style") or {})
                title_style = dict(cfg.get("title_style") or {})
                for key, val in spacing.items():
                    if overwrite or content_style.get(key) is None:
                        content_style[key] = val
                    if overwrite or title_style.get(key) is None:
                        title_style[key] = val
                cfg["content_style"] = content_style
                cfg["title_style"] = title_style
                block.style_config = cfg
                block.save(update_fields=["style_config"])
                updated += 1

        return updated

    @action(detail=True, methods=['post'], url_path='preview')
    def preview_template(self, request, pk=None):
        """API Render Template thành bản Preview DOCX."""
        template = self.get_object()
        syllabus_id = request.data.get('syllabus_id')
        syllabus = None
        if syllabus_id:
            syllabus = Syllabus.objects.filter(id=syllabus_id).first()
        if not syllabus:
            syllabus = Syllabus.objects.filter(template=template).first() or Syllabus.objects.first()

        block_layout = dict(request.data.get('block_layout') or template.block_layout or {})
        if 'header_footer' in request.data:
            block_layout['header_footer'] = request.data['header_footer']

        try:
            renderer = ShellDocxRenderer()
            rendered_io = renderer.render(
                template=template,
                syllabus=syllabus,
                block_layout_override=block_layout,
            )

            temp_filename = f"previews/preview_{template.id}_{int(time.time())}.docx"
            saved_path = default_storage.save(temp_filename, ContentFile(rendered_io.read()))
            file_url = request.build_absolute_uri(default_storage.url(saved_path))

            return Response({
                "preview_url": file_url,
                "document": {
                    "url": file_url,
                    "title": f"Bản xem trước - {template.name}.docx",
                },
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Lỗi render preview: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'], url_path=r'main-sections/(?P<ms_id>[^/.]+)/style')
    def update_main_section_style(self, request, pk=None, ms_id=None):
        template = self.get_object()
        ms = get_object_or_404(TemplateMainSection, id=ms_id, template=template)

        style_config = request.data.get("style_config")
        if style_config is not None and not isinstance(style_config, dict):
            return Response({"error": "style_config phải là dict."}, status=status.HTTP_400_BAD_REQUEST)

        layout = dict(template.block_layout or {})
        main_styles = dict(layout.get("main_sections_style", {}))
        main_styles[str(ms.id)] = style_config or {}
        layout["main_sections_style"] = main_styles
        template.block_layout = layout
        template.save(update_fields=["block_layout"])

        return Response({"status": "ok", "style_config": main_styles[str(ms.id)]}, status=status.HTTP_200_OK)


class TemplateBlockView(viewsets.ModelViewSet):
    queryset = TemplateBlock.objects.all()
    serializer_class = TemplateBlockSerializer
    permission_classes = [perms.IsSpecialist | perms.IsAdmin]

    def get_queryset(self):
        qs = TemplateBlock.objects.filter(is_active=True)
        template_id = self.request.query_params.get('template_id') or self.request.query_params.get('template')
        if template_id:
            try:
                from services.template_block_sync_service import TemplateBlockSyncService
                from syllabuses.models import TemplateSyllabus
                template = TemplateSyllabus.objects.filter(id=template_id).first()
                if template:
                    TemplateBlockSyncService.sync_blocks_for_template(template)
            except Exception:
                pass
            qs = qs.filter(template_id=template_id)
        return qs.order_by('position')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @staticmethod
    def _fallback_custom_columns_from_db(block):
        cfg = block.config or {}
        table_code = cfg.get("table_code") or cfg.get("code")
        if not table_code:
            return []
        return list(
            CustomColumn.objects.filter(
                template_id=block.template_id,
                table_code=table_code,
                is_active=True,
            ).order_by("position", "id").values(
                "column_key", "column_label", "column_type", "default_value", "level"
            )
        )

    @action(detail=True, methods=['post'], url_path='preview-inline')
    def preview_inline(self, request, pk=None, template_id=None):
        block = self.get_object()
        if template_id and str(block.template_id) != str(template_id):
            return Response({"error": "Block không thuộc template được chỉ định."}, status=status.HTTP_404_NOT_FOUND)

        style_config = request.data.get("style_config")
        if style_config is not None and not isinstance(style_config, dict):
            return Response({"error": "style_config phải là một dictionary."}, status=status.HTTP_400_BAD_REQUEST)

        custom_columns = request.data.get("custom_columns")
        if custom_columns is None:
            custom_columns = self._fallback_custom_columns_from_db(block)

        object_ids = request.data.get("object_ids")
        with_context = bool(request.data.get("with_context", False))

        block_config = request.data.get("config")

        try:
            from handlers.preview_builder import PreviewBuilder
            syllabus = Syllabus.objects.first()
            data = PreviewBuilder.build(
                block,
                style_config=style_config,
                syllabus=syllabus,
                custom_columns=custom_columns,
                object_ids=object_ids,
                with_context=with_context,
                block_config=block_config,
            )
            return Response(data, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Preview inline failed for block %s", block.id)
            return Response({"error": "Không thể tạo bản xem trước."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    def _create_batch_custom_columns(template_id, table_code, existing_count, new_cols):
        created = []
        for idx, col_data in enumerate(new_cols):
            col_key = generate_custom_column_key(template_id, table_code)
            col = CustomColumn.objects.create(
                template_id=template_id,
                table_code=table_code,
                column_key=col_key,
                column_label=col_data.get("column_label", ""),
                column_type=col_data.get("column_type", "text"),
                default_value=col_data.get("default_value", ""),
                level=col_data.get("level", "root"),
                position=existing_count + idx + 1,
                is_active=True,
            )
            created.append({
                "id": col.id,
                "column_key": col.column_key,
                "column_label": col.column_label,
                "column_type": col.column_type,
                "default_value": col.default_value,
                "level": col.level,
                "table_code": col.table_code,
            })
        return created

    @staticmethod
    def _update_batch_custom_columns(template_id, updated_cols):
        updated_result = []
        for col_data in updated_cols:
            col_id = col_data.get("id")
            if not col_id:
                continue
            updated_rows = CustomColumn.objects.filter(
                id=col_id,
                template_id=template_id,
            ).update(
                column_label=col_data.get("column_label"),
                column_type=col_data.get("column_type"),
                default_value=col_data.get("default_value"),
                level=col_data.get("level", "root"),
            )
            if updated_rows <= 0:
                continue
            col = CustomColumn.objects.get(id=col_id)
            updated_result.append({
                "id": col.id,
                "column_key": col.column_key,
                "column_label": col.column_label,
                "column_type": col.column_type,
                "default_value": col.default_value,
                "level": col.level,
                "table_code": col.table_code,
            })
        return updated_result

    @action(detail=True, methods=['post'], url_path='batch-save')
    def batch_save(self, request, pk=None, template_id=None):
        block = self.get_object()
        if template_id and str(block.template_id) != str(template_id):
            return Response({"error": "Block không thuộc template."}, status=status.HTTP_404_NOT_FOUND)

        style_config = request.data.get("style_config")
        config = request.data.get("config")
        label_overrides = request.data.get("label_overrides")
        new_cols = request.data.get("new_custom_columns") or []
        updated_cols = request.data.get("updated_custom_columns") or []

        cfg = config if config is not None else (block.config or {})
        table_code = cfg.get("table_code") or cfg.get("code") or block.code.lower()
        existing_count = CustomColumn.objects.filter(
            template_id=block.template_id, table_code=table_code, is_active=True
        ).count()

        if existing_count + len(new_cols) > 10:
            return Response({"error": "Vượt quá giới hạn 10 cột tùy biến cho mỗi bảng."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                if style_config is not None:
                    block.style_config = style_config
                if config is not None:
                    block.config = config
                block.save()

                if label_overrides is not None:
                    tpl = block.template
                    layout = dict(tpl.block_layout or {})
                    all_overrides = dict(layout.get("label_overrides") or {})
                    all_overrides[table_code] = label_overrides
                    layout["label_overrides"] = all_overrides
                    tpl.block_layout = layout
                    tpl.save(update_fields=["block_layout"])

                updated = self._update_batch_custom_columns(block.template_id, updated_cols)
                created = self._create_batch_custom_columns(block.template_id, table_code, existing_count, new_cols)

            if label_overrides is not None or created or updated:
                NotifyService.notify_template_updated(
                    block.template_id,
                    block.template.name,
                    label_overrides=(block.template.block_layout or {}).get("label_overrides", {})
                )

            return Response({
                "block": TemplateBlockSerializer(block).data,
                "block_layout": block.template.block_layout,
                "created_custom_columns": created,
                "updated_custom_columns": updated,
            }, status=status.HTTP_200_OK)
        except Exception:
            logger.exception("Batch save failed for block %s", block.id)
            return Response({"error": "Không thể lưu."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomColumnView(viewsets.ModelViewSet):
    queryset = CustomColumn.objects.all()
    serializer_class = CustomColumnSerializer
    permission_classes = [perms.IsSpecialist | perms.IsAdmin]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [(perms.IsSpecialist | perms.IsAdmin)()]

    def get_queryset(self):
        qs = CustomColumn.objects.filter(is_active=True)
        template_id = self.request.query_params.get('template_id')
        table_code = self.request.query_params.get('table_code')
        if template_id:
            qs = qs.filter(template_id=template_id)
        if table_code:
            qs = qs.filter(table_code=table_code)
        return qs.order_by('table_code', 'position')

    def perform_destroy(self, instance):
        template = instance.template
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        if template:
            NotifyService.notify_template_updated(
                template.id, template.name,
                label_overrides=(template.block_layout or {}).get('label_overrides', {})
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        template = instance.template
        if template:
            NotifyService.notify_template_updated(
                template.id, template.name,
                label_overrides=(template.block_layout or {}).get('label_overrides', {})
            )

class FacultyView(mixins.ListModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin,
               viewsets.GenericViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    pagination_class = FacultyPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = FacultyFilter
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
    filter_backends = [DjangoFilterBackend]
    filterset_class = MajorFilter
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
    filter_backends = [DjangoFilterBackend]
    filterset_class = TrainingProgramFilter
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
        syllabuses = syllabuses.order_by('-created_date', '-id')
        page = self.paginate_queryset(syllabuses)
        if page is not None:
            serializer = SyllabusSimpleSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SyllabusSimpleSerializer(syllabuses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class AttributeGroupView(viewsets.ModelViewSet):
    queryset = AttributeGroup.objects.prefetch_related('attribute_values').all().order_by('id')
    serializer_class = AttributeGroupListSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [(perms.IsAdmin | perms.IsSpecialist)()]

    def create(self, request, *args, **kwargs):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Tên nhóm danh mục không được để trống.'}, status=status.HTTP_400_BAD_REQUEST)
        if AttributeGroup.objects.filter(name__iexact=name).exists():
            return Response({'error': f'Nhóm danh mục "{name}" đã tồn tại.'}, status=status.HTTP_400_BAD_REQUEST)

        group = AttributeGroup.objects.create(name=name)
        values = request.data.get('values', [])
        if isinstance(values, list):
            for v in values:
                val_text = str(v).strip()
                if val_text:
                    AttributeValue.objects.create(attribute_group=group, name_value=val_text)

        serializer = AttributeGroupListSerializer(group)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='values')
    def add_value(self, request, pk=None):
        group = self.get_object()
        val_name = str(request.data.get('name_value') or request.data.get('name') or '').strip()
        if not val_name:
            return Response({'error': 'Tên giá trị không được để trống.'}, status=status.HTTP_400_BAD_REQUEST)
        if AttributeValue.objects.filter(attribute_group=group, name_value__iexact=val_name).exists():
            return Response({'error': f'Giá trị "{val_name}" đã tồn tại trong nhóm.'}, status=status.HTTP_400_BAD_REQUEST)

        val = AttributeValue.objects.create(attribute_group=group, name_value=val_name)
        from syllabuses.serializer import SimpleAttributeValueSerializer
        return Response(SimpleAttributeValueSerializer(val).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'delete'], url_path=r'values/(?P<val_id>\d+)')
    def manage_value(self, request, pk=None, val_id=None):
        group = self.get_object()
        val = AttributeValue.objects.filter(attribute_group=group, id=val_id).first()
        if not val:
            return Response({'error': 'Giá trị không tồn tại trong nhóm này.'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'DELETE':
            val.delete()
            return Response({'message': 'Đã xóa giá trị thành công.'}, status=status.HTTP_200_OK)

        new_name = str(request.data.get('name_value') or request.data.get('name') or '').strip()
        if not new_name:
            return Response({'error': 'Tên giá trị không được để trống.'}, status=status.HTTP_400_BAD_REQUEST)
        val.name_value = new_name
        val.save(update_fields=['name_value'])
        from syllabuses.serializer import SimpleAttributeValueSerializer
        return Response(SimpleAttributeValueSerializer(val).data, status=status.HTTP_200_OK)

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
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProgrammeLearningOutcomeFilter
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
        syllabus = Syllabus.objects.filter(id=syllabus_id).first()
        if not syllabus:
            return HttpResponse("Không tìm thấy đề cương.", status=404)

        if not syllabus.is_approved:
            return HttpResponse(
                "Đề cương chưa được Lãnh đạo Khoa phê duyệt. Không thể xuất file ban hành chính thức.",
                status=400,
                content_type="text/plain; charset=utf-8"
            )

        try:
            buffer = self._render_docx(syllabus)
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename="DeCuong_ChiTiet_{syllabus_id}.docx"'
            return response
        except Exception as e:
            return HttpResponse(f"Đã xảy ra lỗi xuất file: {str(e)}", status=500)

    @staticmethod
    def _render_docx(syllabus):
        template = getattr(syllabus, 'template', None)
        if template and template.blocks.filter(is_active=True).exists():
            renderer = ShellDocxRenderer()
            return renderer.render(template=template, syllabus=syllabus)

        target_file = getattr(template, 'file_clean', None) or getattr(template, 'file', None)
        if target_file:
            with target_file.open('rb') as f:
                template_bytes = f.read()
            layout = template.block_layout or _default_block_layout()
            renderer = BlockStyleDocxRenderer(template_bytes, layout)
            from syllabuses.serializer import SyllabusDetailSerializer
            syllabus_json = SyllabusDetailSerializer(syllabus).data
            return renderer.render(syllabus, syllabus_json=syllabus_json)

        renderer = SyllabusDocxRenderer(syllabus_id=syllabus.id)
        return renderer.render()

def sse_sync_stream(request):
    def event_stream():
        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        pubsub = r.pubsub()
        pubsub.subscribe('syllabus_sync_channel', 'template_style_channel')

        for message in pubsub.listen():
            if message['type'] == 'message':
                yield f"data: {message['data'].decode('utf-8')}\n\n"

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        result, status_code = UserService.register_user(request.data)
        return Response(result, status=status_code)
@method_decorator(csrf_exempt, name='dispatch')
class CustomOauth2TokenView(TokenView):
    def post(self, request, *args, **kwargs):
        grand_type = request.POST.get('grand_type')

        if grand_type == "password":
            username = request.POST.get('username', '')
            password = request.POST.get('password', '')

            clean_username = username.strip() if username else ""
            if not clean_username:
                return JsonResponse({
                    "error": "invalid_request",
                    "error_description": "Tên đăng nhập không được để trống hoặc chỉ chứa khoảng trắng."
                }, status=400)

            if len(clean_username) < 3:
                return JsonResponse({
                    "error": "invalid_request",
                    "error_description": "Tên đăng nhập phải có ít nhất 3 ký tự."
                }, status=400)

            if not password:
                return JsonResponse({
                    "error": "invalid_request",
                    "error_description": "Mật khẩu không được để trống."
                }, status=400)


            request.POST._mutable = True
            request.POST['username'] = clean_username
            request.POST._mutable = False

        return super().post(request, *args, **kwargs)