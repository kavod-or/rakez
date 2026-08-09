from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import EventRole, GlobalRole
from scheduling.models import Event


class EventPermissionTests(APITestCase):
    def setUp(self):
        user = get_user_model()

        self.unauthenticated_user = user.objects.create_user(
            username='unauthenticated',
            email='unauthenticated@example.com',
            password='password',
        )

        self.authenticated_user = user.objects.create_user(
            username='authenticated',
            email='authenticated@example.com',
            password='password',
        )

        self.superuser = user.objects.create_superuser(
            username="admin",
            password="testpass123",
        )

        self.global_manager = user.objects.create_user(
            username='global_manager',
            email='global_manager@example.com',
            password='password',
        )

        self.event_manager = user.objects.create(
            username='event_manager',
            email='event_manager@example.com',
            password='password',
        )

        self.event_1 = Event.objects.create(
            name="Event 1",
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=2),
            timezone="Europe/Berlin",
            description="First event",
            pin_hash=make_password("000000"),
        )
        self.event_2 = Event.objects.create(
            name="Event 2",
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=2, hours=2),
            timezone="Europe/Berlin",
            description="Second event",
            pin_hash=make_password("000000"),
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

    def test_anonymous_user_cannot_list_events(self):
        response = self.client.get("/api/v1/events/")

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_authenticated_user_can_list_events(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.get("/api/v1/events/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_update_event(self):
        self.client.force_authenticate(user=self.authenticated_user)

        response = self.client.patch(
            f"/api/v1/events/{self.event_1.pk}/",
            data={
                "name": "Changed by normal user",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_event_manager_can_update_assigned_event(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.patch(
            f"/api/v1/events/{self.event_1.pk}/",
            data={
                "name": "Changed by event manager",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.event_1.refresh_from_db()
        self.assertEqual(self.event_1.name, "Changed by event manager")

    def test_event_manager_cannot_update_unassigned_event(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.patch(
            f"/api/v1/events/{self.event_2.pk}/",
            data={
                "name": "Changed illegally",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_event_manager_cannot_create_event(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.post(
            "/api/v1/events/",
            data={
                "name": "New event",
                "start": (timezone.now() + timedelta(days=3)).isoformat(),
                "end": (timezone.now() + timedelta(days=3, hours=2)).isoformat(),
                "timezone": "Europe/Berlin",
                "description": "Created by event manager",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_global_manager_can_create_event(self):
        self.client.force_authenticate(user=self.global_manager)

        response = self.client.post(
            "/api/v1/events/",
            data={
                "name": "New event",
                "start": (timezone.now() + timedelta(days=3)).isoformat(),
                "end": (timezone.now() + timedelta(days=3, hours=2)).isoformat(),
                "timezone": "Europe/Berlin",
                "description": "Created by global manager",
                "pin": "000000"
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_global_manager_can_update_any_event(self):
        self.client.force_authenticate(user=self.global_manager)

        response = self.client.patch(
            f"/api/v1/events/{self.event_2.pk}/",
            data={
                "name": "Changed by global manager",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_can_update_any_event(self):
        self.client.force_authenticate(user=self.superuser)

        response = self.client.patch(
            f"/api/v1/events/{self.event_2.pk}/",
            data={
                "name": "Changed by superuser",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_manager_cannot_delete_unassigned_event(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.delete(
            f"/api/v1/events/{self.event_2.pk}/",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_event_manager_cannot_delete_assigned_event(self):
        self.client.force_authenticate(user=self.event_manager)

        response = self.client.delete(
            f"/api/v1/events/{self.event_1.pk}/",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
