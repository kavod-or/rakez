from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import Shift, ShiftPosition, ShiftAssignment, Event


class FullCleanModelSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)

        instance = self.instance or self.Meta.model()
        for field, value in attrs.items():
            setattr(instance, field, value)

        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict)

            raise serializers.ValidationError(exc.messages)

        return attrs


class ShiftSerializer(FullCleanModelSerializer):
    class Meta:
        model = Shift
        fields = "__all__"


class ShiftPositionSerializer(FullCleanModelSerializer):
    class Meta:
        model = ShiftPosition
        fields = "__all__"


class ShiftAssignmentSerializer(FullCleanModelSerializer):
    is_qualified = serializers.SerializerMethodField(read_only=True)
    warnings = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ShiftAssignment
        fields = "__all__"

    def create(self, validated_data):
        with transaction.atomic():
            shift_position = ShiftPosition.objects.select_for_update().get(
                pk=validated_data["shift_position"].pk
            )

            return ShiftAssignment.objects.create(
                shift_position=shift_position,
                staff=validated_data["staff"]
            )

    def get_is_qualified(self, obj):
        return obj.staff.positions.filter(
            pk=obj.shift_position.position_id
        ).exists()

    def get_warnings(self, obj):
        overlapping_assignments = obj.get_overlapping_different_service_assignments()

        warnings = []

        for assignment in overlapping_assignments:
            shift = assignment.shift_position.shift
            warnings.append(
                f"Staff is already planned for an overlapping shift "
                f"in service '{shift.service}' from {shift.start} to {shift.end}."
            )

        return warnings


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"

    def validate(self, attrs):
        start = attrs.get("start", getattr(self.instance, "start", None))
        end = attrs.get("end", getattr(self.instance, "end", None))
        event_timezone = attrs.get(
            "timezone",
            getattr(self.instance, "timezone", settings.TIME_ZONE)
        )

        errors = {}

        try:
            tz = ZoneInfo(event_timezone)
        except ZoneInfoNotFoundError:
            errors["timezone"] = "Event has an invalid timezone."
            tz = None

        if tz:
            if start:
                if timezone.is_naive(start):
                    start = timezone.make_aware(start, tz)
                else:
                    start = start.astimezone(tz)
                attrs["start"] = start

            if end:
                if timezone.is_naive(end):
                    end = timezone.make_aware(end, tz)
                else:
                    end = end.astimezone(tz)
                attrs["end"] = end

            attrs.setdefault("timezone", event_timezone)

        if start and end and end <= start:
            errors["end"] = "Event end must be after event start."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
