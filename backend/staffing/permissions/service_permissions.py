from typing import Any

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.request import Request
from rest_framework.views import APIView

from accounts.models import GlobalRole


# Authenticated users read-only
# Only superuser and global managers can write
class ServicePermission(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user

        if not self._is_authenticated(user):
            return False

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        return False

    def _is_authenticated(self, user):
        return bool(user and user.is_authenticated)

    def _is_safe_method(self, request):
        return request.method in SAFE_METHODS

    def _is_global_manager(self, user):
        return GlobalRole.objects.filter(
            user=user,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        ).exists()
