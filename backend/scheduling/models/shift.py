from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


class Shift(models.Model):
    service = models.ForeignKey(
        'staffing.Service',
        on_delete=models.CASCADE,
        related_name='shifts'
    )
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='shifts'
    )

    start = models.DateTimeField()
    end = models.DateTimeField()

    class Meta:
        ordering = ['start']
        constraints = [
            models.UniqueConstraint(
                fields=['service', 'event', 'start', 'end'],
                name='unique_shift_for_service_event_time'
            )
        ]

    def apply_event_timezone(self):
        if not self.event_id:
            return
        try:
            event_timezone = ZoneInfo(self.event.timezone)
        except ZoneInfoNotFoundError:
            raise ValidationError({
                "event": "Event has an invalid timezone."
            })
        if self.start:
            self.start = timezone.make_aware(self.start, event_timezone)
        if self.end:
            self.end = timezone.make_aware(self.end, event_timezone)

    def clean(self):
        errors = {}

        if self.start and self.end and self.start >= self.end:
            errors['start'] = 'Start time must be before end time.'

        if self.event and self.start and self.end:
            if self.event.start and self.start < self.event.start:
                errors["start"] = "Shift start cannot be before event start."

            if self.event.end and self.end > self.event.end:
                errors["end"] = "Shift end cannot be after event end."

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.service} - {self.event} ({self.start} to {self.end})"
