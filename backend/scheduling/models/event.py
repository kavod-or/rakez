from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.db import models
from django.conf import settings


# Create your models here.
class Event(models.Model):
    name = models.CharField(max_length=255)
    start = models.DateTimeField()
    end = models.DateTimeField()
    timezone = models.CharField(max_length=255, default=settings.TIME_ZONE)
    description = models.TextField(blank=True)

    def clean(self):
        super().clean()

        errors = {}

        if self.timezone:
            try:
                ZoneInfo(self.timezone)
            except ZoneInfoNotFoundError:
                errors["timezone"] = "Event has an invalid timezone."

        if self.start and self.end and self.end <= self.start:
            errors["end"] = "Event end must be after event start."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name
