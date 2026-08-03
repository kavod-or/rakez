from rest_framework.permissions import BasePermission, SAFE_METHODS

from accounts.models import GlobalRole, EventRole, ServiceRole
from .models import Shift, ShiftPosition


class IsServiceManagerOrReadOnly(BasePermission):
    # Allows read-only access to authenticated users.
    # Allows write access to global managers, event managers for the linked event,
    # or service managers for the linked service.

    def has_permission(self, request, view):
        user = request.user

        if not self._is_authenticated(user):
            return False

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        if view.action == "create":
            return self._has_create_permission(user, request, view)

        return self._is_event_manager(user) or self._is_service_manager(user)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        event = self._get_event(obj)
        service = self._get_service(obj)

        return (
                self._is_event_manager_for_event(user, event)
                or self._is_service_manager_for_service(user, service)
        )

    def _has_create_permission(self, user, request, view):
        if view.basename == "shift":
            event_id = request.data.get("event")
            service_id = request.data.get("service")

            return (
                    self._is_event_manager_for_event_id(user, event_id)
                    or self._is_service_manager_for_service_id(user, service_id)
            )

        if view.basename == "shiftposition":
            shift_id = request.data.get("shift")
            shift = Shift.objects.filter(pk=shift_id).first()

            if not shift:
                return False

            return (
                    self._is_event_manager_for_event(user, shift.event)
                    or self._is_service_manager_for_service(user, shift.service)
            )

        if view.basename == "shiftassignment":
            shift_position_id = request.data.get("shift_position")
            shift_position = ShiftPosition.objects.select_related(
                "shift__event",
                "shift__service",
            ).filter(pk=shift_position_id).first()

            if not shift_position:
                return False

            shift = shift_position.shift

            return (
                    self._is_event_manager_for_event(user, shift.event)
                    or self._is_service_manager_for_service(user, shift.service)
            )

        return False

    def _get_event(self, obj):
        if hasattr(obj, "event"):
            return obj.event

        if hasattr(obj, "shift"):
            return obj.shift.event

        if hasattr(obj, "shift_position"):
            return obj.shift_position.shift.event

        return None

    def _get_service(self, obj):
        if hasattr(obj, "service"):
            return obj.service

        if hasattr(obj, "shift"):
            return obj.shift.service

        if hasattr(obj, "shift_position"):
            return obj.shift_position.shift.service

        return None

    def _is_authenticated(self, user):
        return bool(user and user.is_authenticated)

    def _is_safe_method(self, request):
        return request.method in SAFE_METHODS

    def _is_global_manager(self, user):
        return GlobalRole.objects.filter(
            user=user,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        ).exists()

    def _is_event_manager(self, user):
        return EventRole.objects.filter(
            user=user,
            role=EventRole.Role.EVENT_MANAGER,
        ).exists()

    def _is_event_manager_for_event(self, user, event):
        if not event:
            return False

        return self._is_event_manager_for_event_id(user, event.pk)

    def _is_event_manager_for_event_id(self, user, event_id):
        if not event_id:
            return False

        return EventRole.objects.filter(
            user=user,
            event_id=event_id,
            role=EventRole.Role.EVENT_MANAGER,
        ).exists()

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


class IsEventManagerOrReadOnly(BasePermission):
    # Allows read-only access to authenticated users.
    # Allows write access to global managers or event managers assigned to that specific event.
    EVENT_MANAGER_ACTIONS = {"update", "partial_update"}

    def has_permission(self, request, view):
        user = request.user

        if not self._is_authenticated(user):
            return False

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        if view.action in self.EVENT_MANAGER_ACTIONS:
            # Object-level permission will verify access to the specific event.
            return self._is_event_manager(user)

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if self._is_safe_method(request) or user.is_superuser or self._is_global_manager(user):
            return True

        return self._is_event_manager_for_event(user, obj)

    def _is_authenticated(self, user):
        return bool(user and user.is_authenticated)

    def _is_safe_method(self, request):
        return request.method in SAFE_METHODS

    def _is_global_manager(self, user):
        return GlobalRole.objects.filter(
            user=user,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        ).exists()

    def _is_event_manager(self, user):
        return EventRole.objects.filter(
            user=user,
            role=EventRole.Role.EVENT_MANAGER,
        ).exists()

    def _is_event_manager_for_event(self, user, event):
        return EventRole.objects.filter(
            user=user,
            event=event,
            role=EventRole.Role.EVENT_MANAGER,
        ).exists()
