from django.db import models

from .staff import Staff
from .position import Position


class StaffPosition(models.Model):
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="position_assignments",
    )

    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        related_name="staff_assignments",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "position"],
                name="unique_staff_position",
            )
        ]

    def __str__(self):
        return f"{self.staff} - {self.position}"
