# scheduling/tests/base.py
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import EventRole, GlobalRole, ServiceRole
from scheduling.models import Event, Shift, ShiftAssignment, ShiftPosition
from staffing.models import Service, Staff, Position


class SchedulingPermissionsBase(APITestCase):
    def setUp(self):
        user = get_user_model()

        self.authenticated_user = user.objects.create_user(
            username="authenticated",
            email="authenticated@example.com",
            password="password",
        )

        self.superuser = user.objects.create_superuser(
            username="admin",
            password="testpass123",
        )

        self.global_manager = user.objects.create_user(
            username="global_manager",
            email="global_manager@example.com",
            password="password",
        )

        self.event_manager = user.objects.create_user(
            username="event_manager",
            email="event_manager@example.com",
            password="password",
        )

        self.service_manager = user.objects.create_user(
            username="service_manager",
            email="service_manager@example.com",
            password="password",
        )

        self.event_1 = Event.objects.create(
            name="Event 1",
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=2),
            timezone="Europe/Berlin",
            description="First event",
        )

        self.event_2 = Event.objects.create(
            name="Event 2",
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=2, hours=2),
            timezone="Europe/Berlin",
            description="Second event",
        )

        EventRole.objects.create(
            user=self.event_manager,
            event=self.event_1,
            role=EventRole.Role.EVENT_MANAGER,
        )

        GlobalRole.objects.create(
            user=self.global_manager,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        )

        self.service_1 = Service.objects.create(name="Service 1")
        self.service_2 = Service.objects.create(name="Service 2")

        ServiceRole.objects.create(
            user=self.service_manager,
            service=self.service_1,
            role=ServiceRole.Role.SERVICE_MANAGER,
        )

        self.shift_1 = Shift.objects.create(
            event=self.event_1,
            service=self.service_1,
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=1),
        )

        self.shift_2 = Shift.objects.create(
            event=self.event_2,
            service=self.service_2,
            start=timezone.now() + timedelta(days=1, hours=2),
            end=timezone.now() + timedelta(days=1, hours=3),
        )

        self.position_1 = Position.objects.create(
            service=self.service_1,
            name="Position 1",
        )

        self.position_2 = Position.objects.create(
            service=self.service_2,
            name="Position 2",
        )

        self.shift_position_1 = ShiftPosition.objects.create(
            shift=self.shift_1,
            position=self.position_1,
            amount=1,
        )

        self.shift_position_2 = ShiftPosition.objects.create(
            shift=self.shift_2,
            position=self.position_2,
            amount=1,
        )

        self.staff_1 = Staff.objects.create(
            firstname="First",
            lastname="Staff",
        )

        self.staff_2 = Staff.objects.create(
            firstname="Second",
            lastname="Staff",
        )

        self.shift_assignment_1 = ShiftAssignment.objects.create(
            shift_position=self.shift_position_1,
            staff=self.staff_1,
        )

        self.shift_assignment_2 = ShiftAssignment.objects.create(
            shift_position=self.shift_position_2,
            staff=self.staff_2,
        )
