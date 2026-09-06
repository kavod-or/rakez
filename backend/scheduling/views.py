from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Shift, ShiftPosition, ShiftAssignment, Event
from .serializers import ShiftSerializer, ShiftPositionSerializer, ShiftAssignmentSerializer, EventSerializer
from .permissions import IsServiceManagerOrReadOnly, IsEventManagerOrReadOnly
from .rules.base import SchedulingContext
from .rules.registry import rule_engine
from .serializers import (
    AssignmentValidationInputSerializer,
    AssignmentValidationResultSerializer,
)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsEventManagerOrReadOnly]


class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsServiceManagerOrReadOnly]


class ShiftPositionViewSet(viewsets.ModelViewSet):
    queryset = ShiftPosition.objects.all()
    serializer_class = ShiftPositionSerializer
    permission_classes = [IsServiceManagerOrReadOnly]


class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer
    permission_classes = [IsServiceManagerOrReadOnly]

    @action(
        detail=False,
        methods=["post"],
        url_path="validate-assignment",
        serializer_class=AssignmentValidationInputSerializer,
    )
    def validate_assignment(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        staff = serializer.validated_data["staff"]
        shift_position = serializer.validated_data["shift_position"]

        self.check_object_permissions(request, shift_position)

        result = rule_engine.check(
            SchedulingContext(
                staff=staff,
                shift_position=shift_position,
            )
        )

        response_serializer = AssignmentValidationResultSerializer(
            instance=result,
        )
        return Response(response_serializer.data)
