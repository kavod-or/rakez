from scheduling.models import ShiftAssignment

from .base import (
    SchedulingContext,
    SchedulingRule,
    Violation,
    RULE_SEVERITY_ERROR,
    RULE_SEVERITY_WARNING,
    RULE_SEVERITY_INFO,
)


class ShiftAssignmentOverlap(SchedulingRule):
    code = "OVERLAPPING_SHIFT_ASSIGNMENT"

    def check(self, context: SchedulingContext) -> list[Violation]:
        shift = context.shift_position.shift

        conflicts = ShiftAssignment.objects.filter(
            staff_id=context.staff.pk,
            shift_position__shift__event_id=shift.event_id,
            shift_position__shift__start__lt=shift.end,
            shift_position__shift__end__gt=shift.start
        )

        # Ignore assignments in the same shift. This is handled as a warning
        conflicts = conflicts.exclude(
            shift_position__shift_id=shift.pk,
        )

        if context.assignment_id is not None:
            conflicts = conflicts.exclude(pk=context.assignment_id)

        return [
            Violation(
                code=self.code,
                severity=RULE_SEVERITY_ERROR,
                message="Staff member has an overlapping shift.",
                context={"conflicting_assignment_id": assignment_id},
                overridable=False,
            )
            for assignment_id in conflicts.values_list("pk", flat=True)
        ]


class ShiftAssignmentQualification(SchedulingRule):
    code = "STAFF_NOT_QUALIFIED"

    def check(self, context: SchedulingContext) -> list[Violation]:
        position_id = context.shift_position.position_id

        if context.staff.positions.filter(pk=position_id).exists():
            return []

        return [
            Violation(
                code=self.code,
                severity=RULE_SEVERITY_INFO,
                message="Staff member is not qualified for this position.",
                context={
                    "staff_id": context.staff.pk,
                    "position_id": position_id,
                },
                overridable=False,
            )
        ]


class ShiftAssignmentMultiplePositions(SchedulingRule):
    code = "MULTIPLE_POSITIONS_IN_SHIFT"

    def check(self, context: SchedulingContext) -> list[Violation]:
        assignments = ShiftAssignment.objects.filter(
            staff_id=context.staff.pk,
            shift_position__shift_id=context.shift_position.shift_id,
        ).exclude(
            shift_position_id=context.shift_position.pk,
        )

        if context.assignment_id is not None:
            assignments = assignments.exclude(
                pk=context.assignment_id,
            )

        assignment_ids = list(
            assignments.order_by("pk").values_list("pk", flat=True)
        )

        if not assignment_ids:
            return []

        return [
            Violation(
                code=self.code,
                severity=RULE_SEVERITY_WARNING,
                message=(
                    "Staff member is already assigned to another "
                    "position in this shift."
                ),
                context={
                    "shift_id": context.shift_position.shift_id,
                    "conflicting_assignment_ids": assignment_ids,
                },
                overridable=False,
            )
        ]
