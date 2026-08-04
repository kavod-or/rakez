import uuid
from django.db import models

from .position import Position


class Staff(models.Model):
    firstname = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    public_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
    )

    positions = models.ManyToManyField(
        Position,
        through="StaffPosition",
        related_name="staff_members",
    )

    class Meta:
        ordering = ["lastname", "firstname"]

    def __str__(self):
        return f"{self.firstname} {self.lastname}"
