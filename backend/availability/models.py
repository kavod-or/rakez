from django.core.exceptions import ValidationError
from django.db import models
from datetime import timedelta

from staffing.models import Staff
from scheduling.models import Event

VALID_SLOT_START_HOURS = [6, 9, 12, 15, 18, 21]
VALID_SLOT_END_HOURS = [9, 12, 15, 18, 21, 0]
SLOT_DURATION = timedelta(hours=3)


# Create your models here.
class Unavailability(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="unavailability"
    )

    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="unavailability"
    )
    start = models.DateTimeField()
    end = models.DateTimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "staff", "start", "end"],
                name="unique_unavailable_slot"
            )
        ]
        ordering = ["start"]

    def clean(self) -> None:
        if self.start >= self.end:
            raise ValidationError("Slot end must be after slot start")
        
        if (
                self.start.minute != 0
                or self.start.second != 0
                or self.start.microsecond != 0
                or self.end.minute != 0
                or self.end.second != 0
                or self.end.microsecond != 0
        ):
            raise ValidationError("Unavailable slots must start and end on full hours.")

        if self.start < self.event.start or self.end > self.event.end:
            raise ValidationError(
                "The unavailable slot must be inside the event."
            )

        if self.start.hour not in VALID_SLOT_START_HOURS:
            raise ValidationError("Unavailable slot start must be on a valid slot boundary.")

        if self.end.hour not in VALID_SLOT_END_HOURS:
            raise ValidationError("Unavailable slot end must be on a valid slot boundary.")

        if self.end - self.start != SLOT_DURATION:
            raise ValidationError("Unavailable slots must be exactly 3 hours long.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
