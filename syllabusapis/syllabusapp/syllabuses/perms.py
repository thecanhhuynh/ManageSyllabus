from rest_framework import permissions


class IsSpecialist(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and request.user.user_role == 'specialist')

class IsAdmin(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and request.user.user_role == 'admin')