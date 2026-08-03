from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


# Authenticated users can read and write staff
class StaffPermission(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user

        if self._is_authenticated(user):
            return True

        return False

    def _is_authenticated(self, user):
        return bool(user and user.is_authenticated)
