from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Staff, Position, Service
from .permissions import (
    StaffingPermission,
    StaffPermission,
    ServicePermission)
from .serializers import (
    StaffSerializer,
    PositionSerializer,
    AssignPositionSerializer,
    ServiceSerializer
)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [ServicePermission]


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [StaffingPermission]


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [StaffPermission]

    @action(detail=True, methods=['post'], url_path=r"assign-position")
    def assign_position(self, request, pk=None):
        staff = self.get_object()

        serializer = AssignPositionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        position_id = serializer.validated_data['position_id']

        position = get_object_or_404(Position, pk=position_id)

        already_assigned = staff.positions.filter(pk=position.pk).exists()

        staff.positions.add(position)

        return Response(
            data={
                "staff": staff.pk,
                "position": position.pk,
            },
            status=status.HTTP_200_OK if already_assigned else status.HTTP_201_CREATED
        )

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"remove-position/(?P<position_id>\d+)"
    )
    def remove_position(self, request, pk=None, position_id=None):
        staff = self.get_object()
        position = get_object_or_404(Position, pk=position_id)
        staff.positions.remove(position)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
