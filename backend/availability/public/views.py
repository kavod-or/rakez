from django.db import transaction
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from availability.models import Unavailability
from availability.public.serializers import PublicUnavailabilitySerializer
from common.public_event_permissions import HasPublicEventAccess
from scheduling.models import Event
from staffing.models import Staff


@method_decorator(csrf_protect, name="dispatch")
class PublicStaffUnavailabilityView(APIView):
    permission_classes = [HasPublicEventAccess]

    @extend_schema(
        responses=PublicUnavailabilitySerializer(many=True),
    )
    def get(self, request, **kwargs):
        event, staff = self._get_event_and_staff()
        slots = Unavailability.objects.filter(event=event, staff=staff)
        return Response(PublicUnavailabilitySerializer(slots, many=True).data)

    def _get_event_and_staff(self):
        event = get_object_or_404(Event, public_id=self.kwargs["event_public_id"])
        staff = get_object_or_404(Staff, public_id=self.kwargs["staff_public_id"])
        return event, staff

    @extend_schema(
        request=PublicUnavailabilitySerializer(many=True),
        responses=PublicUnavailabilitySerializer(many=True),
    )
    def put(self, request, **kwargs):
        event, staff = self._get_event_and_staff()

        serializer = PublicUnavailabilitySerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        instances = [
            Unavailability(event=event, staff=staff, **slot)
            for slot in serializer.validated_data
        ]

        # Run model-level validation before saving
        errors = []
        for instance in instances:
            try:
                instance.full_clean()
            except ValidationError as e:
                errors.append(e.message_dict if hasattr(e, "message_dict") else e.messages)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            Unavailability.objects.filter(event=event, staff=staff).delete()
            Unavailability.objects.bulk_create(instances)

        slots = Unavailability.objects.filter(event=event, staff=staff)
        return Response(
            PublicUnavailabilitySerializer(slots, many=True).data,
            status=status.HTTP_200_OK,
        )
