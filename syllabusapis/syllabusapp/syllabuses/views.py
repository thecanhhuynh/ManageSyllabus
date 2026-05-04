from django.shortcuts import render
from django.views import generic
from rest_framework import viewsets, status, generics, parsers, permissions
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from syllabuses.models import User
from syllabuses.paginators import UserPaginator
from syllabuses.serializer import UserSerializer


class UserView(viewsets.ViewSet, generics.CreateAPIView, generics.ListAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    paginator_class = UserPaginator
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get', 'patch'], url_path='current-user', permission_classes=[permissions.IsAuthenticated])
    def current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name', 'email']:
                    setattr(u, k, v)
            u.save()
        return Response(UserSerializer(u).data, status=status.HTTP_200_OK)


