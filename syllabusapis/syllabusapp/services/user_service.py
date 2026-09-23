import logging
from typing import Any, Dict, Tuple
from django.db import transaction
from rest_framework import status
from syllabuses.models import User
from syllabuses.serializer import UserSerializer

logger = logging.getLogger(__name__)


class UserService:
    """Service xử lý các nghiệp vụ liên quan đến User."""

    @classmethod
    def register_user(cls, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Đăng ký người dùng mới và tạo Lecturer đi kèm trong transaction.
        Sử dụng Guard Clauses (Early Return) để xử lý điều kiện.
        """
        if not data:
            return {"error": "Dữ liệu đăng ký không được để trống."}, status.HTTP_400_BAD_REQUEST

        username = (data.get("username") or "").strip()
        if not username:
            return {"error": "Tên đăng nhập không được để trống."}, status.HTTP_400_BAD_REQUEST

        if User.objects.filter(username=username).exists():
            return {"error": "Tên đăng nhập đã tồn tại trong hệ thống."}, status.HTTP_409_CONFLICT

        email = (data.get("email") or "").strip()
        if email and User.objects.filter(email=email).exists():
            return {"error": "Email đã được sử dụng."}, status.HTTP_409_CONFLICT

        serializer = UserSerializer(data=data)
        if not serializer.is_valid():
            return {"error": serializer.errors}, status.HTTP_400_BAD_REQUEST

        try:
            with transaction.atomic():
                serializer.save()
                return serializer.data, status.HTTP_201_CREATED
        except Exception as exc:
            logger.error("Lỗi khi đăng ký người dùng: %s", exc, exc_info=True)
            return {
                "error": "Đăng ký người dùng thất bại. Dữ liệu đã được hoàn tác."
            }, status.HTTP_400_BAD_REQUEST
