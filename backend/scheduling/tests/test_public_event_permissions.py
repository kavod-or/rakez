import uuid
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core import signing
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from scheduling.models import Event
from scheduling.public.tokens import TOKEN_SALT, issue_public_event_token


class PublicEventPermissionTest(APITestCase):

    def setUp(self) -> None:
        self.event_1 = Event.objects.create(
            name="Event 1",
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=1, hours=2),
            timezone="Europe/Berlin",
            description="First event",
            pin_hash=make_password("000000"),
        )
        self.event_1_id = self.event_1.public_id
        self.event_2 = Event.objects.create(
            name="Event 2",
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=2, hours=2),
            timezone="Europe/Berlin",
            description="Second event",
            pin_hash=make_password("123456"),
        )
        self.event_2_id = self.event_2.public_id

    def test_unlock_succeeds_with_correct_pin(self):
        response = self.client.post(
            f"/api/v1/public/events/{self.event_1_id}/unlock",
            data={"pin": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn("public_event_token", response.cookies)
        self.assertEqual(response.cookies["public_event_token"].get('path'),
                         f"/api/v1/public/events/{self.event_1_id}/")

    def test_unlock_fails_with_wrong_pin(self):
        response = self.client.post(
            f"/api/v1/public/events/{self.event_1_id}/unlock",
            data={"pin": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("public_event_token", response.cookies)

    def test_unlock_fails_for_unknown_event_id(self):
        unknown_event_id = uuid.uuid4()

        response = self.client.post(
            f"/api/v1/public/events/{unknown_event_id}/unlock",
            data={"pin": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
        self.assertNotIn("public_event_token", response.cookies)

    def test_public_event_detail_denied_without_token(self):
        response = self.client.get(
            f"/api/v1/public/events/{self.event_1_id}/",
            format="json",
        )

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            response.data,
        )

    def test_public_event_detail_denied_with_malformed_token(self):
        self.client.cookies["public_event_token"] = "not-a-valid-token"
        response = self.client.get(
            f"/api/v1/public/events/{self.event_1_id}/",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_event_detail_allowed_with_valid_token(self):
        unlock_response = self.client.post(
            f"/api/v1/public/events/{self.event_1_id}/unlock",
            data={"pin": "000000"},
            format="json",
        )
        self.assertEqual(unlock_response.status_code, status.HTTP_200_OK)

        token = unlock_response.cookies['public_event_token'].value

        self.client.cookies['public_event_token'] = token
        response = self.client.get(
            f"/api/v1/public/events/{self.event_1_id}/",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(str(response.data["public_id"]), str(self.event_1_id))

    def test_token_for_event_a_cannot_access_event_b(self):
        unlock_response = self.client.post(
            f"/api/v1/public/events/{self.event_1_id}/unlock",
            data={"pin": "000000"},
            format="json",
        )
        self.assertEqual(unlock_response.status_code, status.HTTP_200_OK, unlock_response.data)

        token = unlock_response.cookies['public_event_token'].value
        self.client.cookies['public_event_token'] = token

        response = self.client.get(
            f"/api/v1/public/events/{self.event_2_id}/",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_public_event_detail_denied_with_wrong_scope_token(self):
        wrong_scope_token = signing.dumps(
            {
                "scope": "some_other_scope",
                "event_public_id": str(self.event_1_id),
            },
            salt=TOKEN_SALT,
        )

        self.client.cookies['public_event_token'] = wrong_scope_token

        response = self.client.get(
            f"/api/v1/public/events/{self.event_1_id}/",
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_public_event_detail_denied_with_expired_token(self):
        token = issue_public_event_token(self.event_1_id)

        self.client.cookies['public_event_token'] = token

        with patch("scheduling.public.tokens.TOKEN_MAX_AGE_SECONDS", 0):
            response = self.client.get(
                f"/api/v1/public/events/{self.event_1_id}/",
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_public_event_detail_does_not_expose_pin_hash(self):
        unlock_response = self.client.post(
            f"/api/v1/public/events/{self.event_1_id}/unlock",
            data={"pin": "000000"},
            format="json",
        )
        self.assertEqual(unlock_response.status_code, status.HTTP_200_OK, unlock_response.data)

        token = unlock_response.cookies['public_event_token'].value
        self.client.cookies['public_event_token'] = token

        response = self.client.get(
            f"/api/v1/public/events/{self.event_1_id}/",
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        self.assertNotIn("pin_hash", response.data)
        self.assertNotIn("pin", response.data)
