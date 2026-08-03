from django.db import models

from .service import Service


class Position(models.Model):
    name = models.CharField(max_length=120)

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="positions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "service"],
                name="unique_position_per_service",
            )
        ]

    def __str__(self):
        return f"{self.service}: {self.name}"
