from rest_framework import viewsets

from .models import Shift, ShiftPosition, ShiftAssignment, Event
from .serializers import ShiftSerializer, ShiftPositionSerializer, ShiftAssignmentSerializer, EventSerializer
from .permissions import IsServiceManagerOrReadOnly, IsEventManagerOrReadOnly


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
