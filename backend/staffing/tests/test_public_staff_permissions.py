from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from scheduling.models import Event
from staffing.models import Staff


class PublicStaffPermissionTests(APITestCase):

    def setUp(self):
        self.event = Event.objects.create(
            name="Event 1",
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=2),
            timezone="Europe/Berlin",
            pin_hash=make_password("000000"),
        )
        self.staff_1 = Staff.objects.create(firstname="Alice", lastname="Smith")
        self.staff_2 = Staff.objects.create(firstname="Bob", lastname="Jones")

    def _unlock(self, pin="000000"):
        response = self.client.post(
            f"/api/v1/public/events/{self.event.public_id}/unlock",
            data={"pin": pin},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies["public_event_token"] = (
            response.cookies["public_event_token"].value
        )

    def test_staff_list_denied_without_token(self):
        response = self.client.get(
            f"/api/v1/public/events/{self.event.public_id}/staff/",
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_staff_list_allowed_with_valid_token(self):
        self._unlock()

        response = self.client.get(
            f"/api/v1/public/events/{self.event.public_id}/staff/",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(len(response.data), 2)

    def test_staff_list_returns_minimal_fields_only(self):
        self._unlock()

        response = self.client.get(
            f"/api/v1/public/events/{self.event.public_id}/staff/",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        staff_entry = response.data[0]
        self.assertIn("public_id", staff_entry)
        self.assertIn("firstname", staff_entry)
        self.assertIn("lastname", staff_entry)
        self.assertNotIn("id", staff_entry)
        self.assertNotIn("positions", staff_entry)

    def test_staff_list_denied_with_wrong_event_token(self):
        other_event = Event.objects.create(
            name="Event 2",
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=2, hours=2),
            timezone="Europe/Berlin",
            pin_hash=make_password("999999"),
        )
        # unlock other event
        response = self.client.post(
            f"/api/v1/public/events/{other_event.public_id}/unlock",
            data={"pin": "999999"},
            format="json",
        )
        self.client.cookies["public_event_token"] = (
            response.cookies["public_event_token"].value
        )

        response = self.client.get(
            f"/api/v1/public/events/{self.event.public_id}/staff/",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
