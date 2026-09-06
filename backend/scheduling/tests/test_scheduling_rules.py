from datetime import timedelta
from django.test import SimpleTestCase
from rest_framework import status

from scheduling.models import Shift, ShiftAssignment, ShiftPosition
from staffing.models import Position, StaffPosition
from scheduling.rules.base import SchedulingContext, SchedulingRule, Violation
from scheduling.rules.registry import rule_engine
from scheduling.tests.base_setup import SchedulingPermissionsBase
from scheduling.rules.engine import RuleEngine
from scheduling.rules.rule_shift_assignment import (
    ShiftAssignmentQualification,
)


class SchedulingRuleTests(SchedulingPermissionsBase):
    def test_identical_shift_is_blocked(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_2,
            start=self.shift_1.start,
            end=self.shift_1.end,
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_2,
            amount=1,
        )

        context = SchedulingContext(
            staff=self.staff_1,
            shift_position=shift_position,
        )

        result = rule_engine.check(context)

        self.assertFalse(result.allowed)
        self.assertEqual(len(result.violations), 1)
        self.assertEqual(
            result.violations[0].code,
            "OVERLAPPING_SHIFT_ASSIGNMENT",
        )
        self.assertEqual(
            result.violations[0].context["conflicting_assignment_id"],
            self.shift_assignment_1.pk,
        )

    def test_existing_assignment_does_not_conflict_with_itself(self):
        context = SchedulingContext(
            staff=self.staff_1,
            shift_position=self.shift_position_1,
            assignment_id=self.shift_assignment_1.pk,
        )

        result = rule_engine.check(context)

        self.assertTrue(result.allowed)
        self.assertEqual(result.violations, [])

    def test_overlap_across_services_is_blocked(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_2,
            start=self.shift_1.start + timedelta(minutes=15),
            end=self.shift_1.end,
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_2,
            amount=1,
        )

        result = rule_engine.check(
            SchedulingContext(
                staff=self.staff_1,
                shift_position=shift_position,
            )
        )

        self.assertFalse(result.allowed)
        self.assertEqual(len(result.violations), 1)
        self.assertEqual(
            result.violations[0].context["conflicting_assignment_id"],
            self.shift_assignment_1.pk,
        )

    def test_adjacent_shift_is_allowed(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_1,
            start=self.shift_1.end,
            end=self.shift_1.end + timedelta(minutes=30),
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_1,
            amount=1,
        )

        result = rule_engine.check(
            SchedulingContext(
                staff=self.staff_1,
                shift_position=shift_position,
            )
        )

        self.assertTrue(result.allowed)
        self.assertEqual(result.violations, [])

    def test_missing_qualification_returns_info_and_allows_assignment(self):
        self.staff_1.positions.remove(self.position_1)

        engine = RuleEngine([ShiftAssignmentQualification()])
        result = engine.check(
            SchedulingContext(
                staff=self.staff_1,
                shift_position=self.shift_position_1,
            )
        )

        self.assertTrue(result.allowed)
        self.assertEqual(len(result.violations), 1)
        self.assertEqual(
            result.violations[0].code,
            "STAFF_NOT_QUALIFIED",
        )
        self.assertEqual(result.violations[0].severity, "info")
        self.assertEqual(
            result.violations[0].context,
            {
                "staff_id": self.staff_1.pk,
                "position_id": self.position_1.pk,
            },
        )

    def test_qualified_staff_receives_no_qualification_info(self):
        engine = RuleEngine([ShiftAssignmentQualification()])
        result = engine.check(
            SchedulingContext(
                staff=self.staff_1,
                shift_position=self.shift_position_1,
            )
        )

        self.assertTrue(result.allowed)
        self.assertEqual(result.violations, [])

    def test_multiple_positions_in_same_shift_returns_warning(self):
        position = Position.objects.create(
            service=self.service_1,
            name="Additional position",
        )
        shift_position = ShiftPosition.objects.create(
            shift=self.shift_1,
            position=position,
            amount=1,
        )
        StaffPosition.objects.create(
            staff=self.staff_1,
            position=position,
        )

        result = rule_engine.check(
            SchedulingContext(
                staff=self.staff_1,
                shift_position=shift_position,
            )
        )

        self.assertTrue(result.allowed)
        self.assertEqual(len(result.violations), 1)

        violation = result.violations[0]
        self.assertEqual(
            violation.code,
            "MULTIPLE_POSITIONS_IN_SHIFT",
        )
        self.assertEqual(violation.severity, "warning")
        self.assertEqual(
            violation.context,
            {
                "shift_id": self.shift_1.pk,
                "conflicting_assignment_ids": [
                    self.shift_assignment_1.pk,
                ],
            },
        )


class FixedRule(SchedulingRule):
    code = "TEST_RULE"

    def __init__(self, severity):
        self.severity = severity

    def check(self, context):
        return [
            Violation(
                code=self.code,
                severity=self.severity,
                message="Test violation",
            )
        ]


class RuleEngineTests(SimpleTestCase):
    def test_only_errors_block(self):
        for severity, expected_allowed in [
            ("error", False),
            ("warning", True),
            ("info", True),
        ]:
            with self.subTest(severity=severity):
                engine = RuleEngine([FixedRule(severity)])

                result = engine.check(context=None)

                self.assertEqual(result.allowed, expected_allowed)
                self.assertEqual(len(result.violations), 1)

    def test_collects_violations_after_an_error(self):
        engine = RuleEngine([
            FixedRule("error"),
            FixedRule("warning"),
            FixedRule("info"),
        ])

        result = engine.check(context=None)

        self.assertFalse(result.allowed)
        self.assertEqual(
            [violation.severity for violation in result.violations],
            ["error", "warning", "info"],
        )

    def test_no_rules_allows_assignment(self):
        result = RuleEngine([]).check(context=None)

        self.assertTrue(result.allowed)
        self.assertEqual(result.violations, [])


class SchedulingRuleAPITests(SchedulingPermissionsBase):
    def test_distinct_shifts_with_identical_times_are_blocked(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_2,
            start=self.shift_1.start + timedelta(minutes=15),
            end=self.shift_1.end,
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_2,
            amount=1,
        )

        self.client.force_authenticate(user=self.superuser)
        count_before = ShiftAssignment.objects.count()

        response = self.client.post(
            "/api/v1/shift-assignments/",
            {
                "staff": self.staff_1.pk,
                "shift_position": shift_position.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn("staff", response.data)
        self.assertIn(
            "Staff member has an overlapping shift.",
            [str(message) for message in response.data["staff"]],
        )
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before,
        )

    def test_validation_returns_overlap_without_creating_assignment(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_2,
            start=self.shift_1.start,
            end=self.shift_1.end,
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_2,
            amount=1,
        )
        self.client.force_authenticate(user=self.superuser)
        count_before = ShiftAssignment.objects.count()

        response = self.client.post(
            "/api/v1/shift-assignments/validate-assignment/",
            {
                "staff": self.staff_1.pk,
                "shift_position": shift_position.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.assertIs(response.data["allowed"], False)
        self.assertEqual(len(response.data["violations"]), 1)

        violation = response.data["violations"][0]
        self.assertEqual(
            violation["code"],
            "OVERLAPPING_SHIFT_ASSIGNMENT",
        )
        self.assertEqual(violation["severity"], "error")
        self.assertIs(violation["overridable"], False)
        self.assertEqual(
            violation["context"]["conflicting_assignment_id"],
            self.shift_assignment_1.pk,
        )
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before,
        )

    def test_validation_rejects_manager_of_another_service(self):
        self.client.force_authenticate(user=self.service_manager)

        response = self.client.post(
            "/api/v1/shift-assignments/validate-assignment/",
            {
                "staff": self.staff_1.pk,
                "shift_position": self.shift_position_2.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            response.data,
        )

    def test_validation_allows_assignment_without_creating_it(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_1,
            start=self.shift_1.end,
            end=self.shift_1.end + timedelta(minutes=30),
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_1,
            amount=1,
        )

        self.client.force_authenticate(user=self.service_manager)
        count_before = ShiftAssignment.objects.count()

        response = self.client.post(
            "/api/v1/shift-assignments/validate-assignment/",
            {
                "staff": self.staff_1.pk,
                "shift_position": shift_position.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.assertIs(response.data["allowed"], True)
        self.assertEqual(response.data["violations"], [])
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before,
        )

    def test_update_to_overlapping_assignment_is_rejected(self):
        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_2,
            start=self.shift_1.start + timedelta(minutes=15),
            end=self.shift_1.end,
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_2,
            amount=1,
        )
        assignment = ShiftAssignment.objects.create(
            staff=self.staff_2,
            shift_position=shift_position,
        )

        self.client.force_authenticate(user=self.superuser)

        response = self.client.patch(
            f"/api/v1/shift-assignments/{assignment.pk}/",
            {"staff": self.staff_1.pk},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
            response.data,
        )
        self.assertIn("staff", response.data)
        self.assertIn(
            "Staff member has an overlapping shift.",
            [str(message) for message in response.data["staff"]],
        )

        assignment.refresh_from_db()

        self.assertEqual(assignment.staff_id, self.staff_2.pk)
        self.assertEqual(
            assignment.shift_position_id,
            shift_position.pk,
        )

    def test_validation_returns_info_for_unqualified_staff(self):
        self.staff_2.positions.remove(self.position_1)

        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_1,
            start=self.shift_1.end,
            end=self.shift_1.end + timedelta(minutes=30),
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_1,
            amount=1,
        )

        self.client.force_authenticate(user=self.service_manager)
        count_before = ShiftAssignment.objects.count()

        response = self.client.post(
            "/api/v1/shift-assignments/validate-assignment/",
            {
                "staff": self.staff_2.pk,
                "shift_position": shift_position.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )
        self.assertIs(response.data["allowed"], True)
        self.assertEqual(len(response.data["violations"]), 1)

        violation = response.data["violations"][0]
        self.assertEqual(violation["code"], "STAFF_NOT_QUALIFIED")
        self.assertEqual(violation["severity"], "info")
        self.assertEqual(
            violation["context"],
            {
                "staff_id": self.staff_2.pk,
                "position_id": self.position_1.pk,
            },
        )
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before,
        )

    def test_create_assignment_without_qualification_is_allowed(self):
        self.staff_2.positions.remove(self.position_1)

        shift = Shift.objects.create(
            event=self.event_1,
            service=self.service_1,
            start=self.shift_1.end,
            end=self.shift_1.end + timedelta(minutes=30),
        )
        shift_position = ShiftPosition.objects.create(
            shift=shift,
            position=self.position_1,
            amount=1,
        )

        self.client.force_authenticate(user=self.service_manager)

        response = self.client.post(
            "/api/v1/shift-assignments/",
            {
                "staff": self.staff_2.pk,
                "shift_position": shift_position.pk,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertIs(response.data["is_qualified"], False)
        self.assertTrue(
            ShiftAssignment.objects.filter(
                staff=self.staff_2,
                shift_position=shift_position,
            ).exists()
        )

    def test_multiple_positions_warning_does_not_block_creation(self):
        position = Position.objects.create(
            service=self.service_1,
            name="Additional position",
        )
        shift_position = ShiftPosition.objects.create(
            shift=self.shift_1,
            position=position,
            amount=1,
        )
        StaffPosition.objects.create(
            staff=self.staff_1,
            position=position,
        )

        self.client.force_authenticate(user=self.service_manager)
        payload = {
            "staff": self.staff_1.pk,
            "shift_position": shift_position.pk,
        }
        count_before = ShiftAssignment.objects.count()

        validation = self.client.post(
            "/api/v1/shift-assignments/validate-assignment/",
            payload,
            format="json",
        )

        self.assertEqual(
            validation.status_code,
            status.HTTP_200_OK,
            validation.data,
        )
        self.assertIs(validation.data["allowed"], True)
        self.assertEqual(len(validation.data["violations"]), 1)
        self.assertEqual(
            validation.data["violations"][0]["code"],
            "MULTIPLE_POSITIONS_IN_SHIFT",
        )
        self.assertEqual(
            validation.data["violations"][0]["severity"],
            "warning",
        )
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before,
        )

        response = self.client.post(
            "/api/v1/shift-assignments/",
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )
        self.assertTrue(
            ShiftAssignment.objects.filter(
                staff=self.staff_1,
                shift_position=shift_position,
            ).exists()
        )
        self.assertEqual(
            ShiftAssignment.objects.count(),
            count_before + 1,
        )
