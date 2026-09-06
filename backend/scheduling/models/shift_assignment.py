from django.db import models
from django.core.exceptions import ValidationError

from .shift_position import ShiftPosition


class ShiftAssignment(models.Model):
    shift_position = models.ForeignKey(
        ShiftPosition,
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    staff = models.ForeignKey(
        'staffing.Staff',
        on_delete=models.CASCADE,
        related_name='shift_assignments'
    )

    class Meta:
        ordering = ['shift_position', 'staff']
        constraints = [
            models.UniqueConstraint(
                fields=['shift_position', 'staff'],
                name='unique_scheduling_shift_assignment'
            )
        ]

    def get_overlapping_different_service_assignments(self):
        if not self.staff_id or not self.shift_position_id:
            return ShiftAssignment.objects.none()

        shift = self.shift_position.shift

        return ShiftAssignment.objects.filter(
            staff_id=self.staff_id,
            shift_position__shift__start__lt=shift.end,
            shift_position__shift__end__gt=shift.start,
        ).exclude(
            pk=self.pk
        ).exclude(
            shift_position__shift__service_id=shift.service_id
        ).select_related(
            "shift_position",
            "shift_position__shift",
            "shift_position__shift__service",
            "shift_position__position",
        )

    def clean(self):
        super().clean()

        if not self.shift_position_id:
            return

        errors = {}

        current_assignment_count = self.shift_position.assignments.exclude(
            pk=self.pk
        ).count()

        if current_assignment_count >= self.shift_position.amount:
            errors["shift_position"] = "This shift position is already fully assigned."

        if self.staff_id:
            from scheduling.rules.base import (
                RULE_SEVERITY_ERROR,
                SchedulingContext,
            )
            from scheduling.rules.registry import rule_engine
            
            result = rule_engine.check(
                SchedulingContext(
                    staff=self.staff,
                    shift_position=self.shift_position,
                    assignment_id=self.pk,
                )
            )

            if not result.allowed:
                errors["staff"] = [
                    violation.message
                    for violation in result.violations
                    if violation.severity == RULE_SEVERITY_ERROR
                ]

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.staff} assigned to {self.shift_position}"
