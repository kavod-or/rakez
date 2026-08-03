from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import GlobalRole, EventRole, ServiceRole


class StaffingPermission(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not self._is_authenticated(user):
            return False

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        if view.action == "create":
            return self._has_create_permission(user, request, view)

        # Handle object-based permissions
        return self._is_service_manager(user)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        service = self._get_service(obj)

        return self._is_service_manager_for_service(user, service)

    def _has_create_permission(self, user, request, view):
        # Only Superuser and Global Manager can create services
        if view.basename == "service":
            return False

        # Any authenticated user can create staff
        if view.basename == "staff":
            return True

        if view.basename == "position":
            service_id = request.data.get("service")
            return self._is_service_manager_for_service_id(user, service_id)

        # ToDo: Implement check for staff position

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

    def _get_service(self, obj):
        if hasattr(obj, "service"):
            return obj.service

        return None

    def _is_service_manager(self, user):
        return ServiceRole.objects.filter(
            user=user,
            role=ServiceRole.Role.SERVICE_MANAGER,
        ).exists()

    def _is_service_manager_for_service(self, user, service):
        if not service:
            return False

        return self._is_service_manager_for_service_id(user, service.pk)

    def _is_service_manager_for_service_id(self, user, service_id):
        if not service_id:
            return False

        return ServiceRole.objects.filter(
            user=user,
            service_id=service_id,
            role=ServiceRole.Role.SERVICE_MANAGER,
        ).exists()
