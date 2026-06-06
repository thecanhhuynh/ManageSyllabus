from django.shortcuts import render
from django.views import generic
from rest_framework import viewsets, status, generics, parsers, permissions, mixins
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from syllabuses.models import User
from syllabuses.paginators import UserPaginator
from syllabuses.serializer import UserSerializer, UserDetailSerializer


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
