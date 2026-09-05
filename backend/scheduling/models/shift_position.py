from django.db import models
from django.db.models import Max
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

from .shift import Shift


class ShiftPosition(models.Model):
    shift = models.ForeignKey(
        Shift,
        on_delete=models.CASCADE,
        related_name='positions'
    )

    position = models.ForeignKey(
        'staffing.Position',
        on_delete=models.CASCADE,
        related_name='shifts'
    )

    amount = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['shift', 'sort_order', 'position']
        constraints = [
            models.UniqueConstraint(
                fields=['shift', 'position'],
                name='unique_scheduling_shift_position'
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=1),
                name='scheduling_shift_position_amount_gte_1'
            )
        ]

    def clean(self):
        super().clean()

        if not self.shift_id or not self.position_id:
            return

        if self.shift.service_id != self.position.service_id:
            raise ValidationError({
                "position": "Position must belong to the same service as the shift."
            })

    def save(self, *args, **kwargs):
        if self._state.adding and self.sort_order == 0 and self.shift_id:
            last_order = ShiftPosition.objects.filter(shift_id=self.shift_id).aggregate(
                max_order=Max('sort_order')
            )['max_order']
            self.sort_order = (last_order or 0) + 1
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.shift} - {self.position} ({self.amount})"
