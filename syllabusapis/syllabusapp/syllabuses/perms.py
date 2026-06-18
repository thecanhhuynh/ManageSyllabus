from rest_framework import permissions


class IsSpecialist(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return request.user.user_role == 'SPECIALIST'