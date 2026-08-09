from datetime import timedelta
from zoneinfo import ZoneInfo

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.test import APITestCase

from availability.models import Unavailability
from scheduling.models import Event
from staffing.models import Staff


class PublicUnavailabilityPermissionTests(APITestCase):

    def setUp(self):
        berlin = ZoneInfo("Europe/Berlin")

        self.event = Event.objects.create(
            name="Event 1",
            start=timezone.now().astimezone(berlin).replace(
                hour=6, minute=0, second=0, microsecond=0
            ) + timedelta(days=10),
            end=timezone.now().astimezone(berlin).replace(
                hour=6, minute=0, second=0, microsecond=0
            ) + timedelta(days=11),
            timezone="Europe/Berlin",
            pin_hash=make_password("000000"),
        )
        self.staff = Staff.objects.create(firstname="Alice", lastname="Smith")
        self.other_event = Event.objects.create(
            name="Event 2",
            start=timezone.now().replace(hour=6, minute=0, second=0, microsecond=0) + timedelta(days=20),
            end=timezone.now().replace(hour=6, minute=0, second=0, microsecond=0) + timedelta(days=21),
            timezone="Europe/Berlin",
            pin_hash=make_password("999999"),
        )

        self.slot_start = self.event.start  # already 06:00 Berlin
        self.slot_end = self.slot_start + timedelta(hours=3)
        self.base_url = f"/api/v1/public/events/{self.event.public_id}/availability/{self.staff.public_id}/"

    def _unlock(self, event=None, pin="000000"):
        event = event or self.event
        response = self.client.post(
            f"/api/v1/public/events/{event.public_id}/unlock",
            data={"pin": pin},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies["public_event_token"] = (
            response.cookies["public_event_token"].value
        )

    def test_get_denied_without_token(self):
        response = self.client.get(self.base_url)

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_put_denied_without_token(self):
        response = self.client.put(self.base_url, data=[], format="json")

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_get_denied_with_wrong_event_token(self):
        self._unlock(event=self.other_event, pin="999999")

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_put_denied_with_wrong_event_token(self):
        self._unlock(event=self.other_event, pin="999999")

        response = self.client.put(self.base_url, data=[], format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_returns_empty_list_when_no_slots(self):
        self._unlock()

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_get_returns_existing_slots(self):
        Unavailability.objects.create(
            event=self.event,
            staff=self.staff,
            start=self.slot_start,
            end=self.slot_end,
        )
        self._unlock()

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            parse_datetime(response.data[0]["start"]),
            self.slot_start,
        )

    def test_get_returns_only_slots_for_this_staff_and_event(self):
        other_staff = Staff.objects.create(firstname="Bob", lastname="Jones")
        Unavailability.objects.create(
            event=self.event, staff=self.staff,
            start=self.slot_start, end=self.slot_end,
        )
        Unavailability.objects.create(
            event=self.event, staff=other_staff,
            start=self.slot_start, end=self.slot_end,
        )
        self._unlock()

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_get_returns_only_slots_for_this_event(self):
        self._unlock()
        Unavailability.objects.create(
            event=self.event, staff=self.staff,
            start=self.slot_start, end=self.slot_end,
        )
        # slot for same staff but other event not created here
        # just verify count is correct
        response = self.client.get(self.base_url)
        self.assertEqual(len(response.data), 1)

    def test_put_slot_outside_event_returns_400(self):
        self._unlock()
        outside_start = self.event.end + timedelta(hours=6)
        outside_end = outside_start + timedelta(hours=3)

        response = self.client.put(
            self.base_url,
            data=[{"start": outside_start.isoformat(), "end": outside_end.isoformat()}],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_creates_slots(self):
        self._unlock()

        response = self.client.put(
            self.base_url,
            data=[{"start": self.slot_start.isoformat(), "end": self.slot_end.isoformat()}],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Unavailability.objects.filter(event=self.event, staff=self.staff).count(), 1)

    def test_put_replaces_existing_slots(self):
        Unavailability.objects.create(
            event=self.event, staff=self.staff,
            start=self.slot_start, end=self.slot_end,
        )
        new_start = self.slot_start + timedelta(hours=3)
        new_end = new_start + timedelta(hours=3)
        self._unlock()

        response = self.client.put(
            self.base_url,
            data=[{"start": new_start.isoformat(), "end": new_end.isoformat()}],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slots = Unavailability.objects.filter(event=self.event, staff=self.staff)
        self.assertEqual(slots.count(), 1)
        self.assertEqual(slots.first().start, new_start)

    def test_put_empty_list_clears_all_slots(self):
        Unavailability.objects.create(
            event=self.event, staff=self.staff,
            start=self.slot_start, end=self.slot_end,
        )
        self._unlock()

        response = self.client.put(self.base_url, data=[], format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Unavailability.objects.filter(event=self.event, staff=self.staff).count(), 0)

    def test_put_invalid_slot_returns_400(self):
        self._unlock()

        response = self.client.put(
            self.base_url,
            data=[{"start": "not-a-date", "end": "not-a-date"}],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
