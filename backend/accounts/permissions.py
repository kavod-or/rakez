from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import GlobalRole


class IsGlobalManager(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and GlobalRole.objects.filter(
                user=user,
                role=GlobalRole.Role.GLOBAL_MANAGER,
            ).exists()
        )
