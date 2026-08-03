from django.conf import settings
from django.db import models


class GlobalRole(models.Model):
    class Role(models.TextChoices):
        GLOBAL_MANAGER = "global_manager", "Global Manager"  # Global Admin in rakez
        VIEWER = "viewer", "Viewer"  # Global Viewer

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=100, choices=Role.choices, default=Role.VIEWER)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user"], name="unique_global_role")
        ]

    def __str__(self):
        return f"{self.user} - {self.role}"


class EventRole(models.Model):
    class Role(models.TextChoices):
        EVENT_MANAGER = "event_manager", "Event Manager"
        VIEWER = "viewer", "Viewer"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey("scheduling.Event", on_delete=models.CASCADE)
    role = models.CharField(max_length=100, choices=Role.choices, default=Role.VIEWER)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "event"], name="unique_event_role")
        ]

    def __str__(self):
        return f"{self.user} - {self.role} - {self.event}"


class ServiceRole(models.Model):
    class Role(models.TextChoices):
        SERVICE_MANAGER = "service_manager", "Service Manager"  # Admin in a Service
        VIEWER = "viewer", "Viewer"  # The Default

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    service = models.ForeignKey("staffing.Service", on_delete=models.CASCADE)
    role = models.CharField(max_length=100, choices=Role.choices, default=Role.VIEWER)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "service"], name="unique_service_role")
        ]

    def __str__(self):
        return f"{self.user} - {self.role} - {self.service}"
