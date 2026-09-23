from rest_framework import permissions


class IsSpecialist(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'user_role', None) == 'specialist'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'user_role', None) == 'admin' or request.user.is_superuser