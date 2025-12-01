from rest_framework.permissions import BasePermission


class IsRoleAdmin(BasePermission):
    """
    Permite acceso a usuarios staff o con role='admin'.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or getattr(user, "role", None) == "admin"))
