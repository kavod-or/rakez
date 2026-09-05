from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import EventRole, GlobalRole
from scheduling.models import Event


class EventPinDisplayTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="user", email="user@example.com", password="password"
        )
        self.event_manager = user_model.objects.create_user(
            username="event-manager", email="manager@example.com", password="password"
        )
        self.global_manager = user_model.objects.create_user(
            username="global-manager", email="global@example.com", password="password"
        )
        self.event = Event.objects.create(
            name="Event",
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=2),
            timezone="Europe/Berlin",
            pin_hash=make_password("123456"),
            pin_display="123456",
        )
        EventRole.objects.create(
            user=self.event_manager,
            event=self.event,
            role=EventRole.Role.EVENT_MANAGER,
        )
        GlobalRole.objects.create(
            user=self.global_manager,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        )

    def test_event_pin_is_hidden_from_regular_users(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/v1/events/")

        self.assertIsNone(response.data[0]["display_pin"])

    def test_event_pin_is_visible_to_event_manager(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.get("/api/v1/events/")

        self.assertEqual(response.data[0]["display_pin"], "123456")

    def test_event_pin_is_visible_to_global_manager(self):
        self.client.force_authenticate(user=self.global_manager)

        response = self.client.get("/api/v1/events/")

        self.assertEqual(response.data[0]["display_pin"], "123456")
