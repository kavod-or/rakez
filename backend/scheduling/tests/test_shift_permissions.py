from rest_framework import status

from scheduling.tests.base_setup import SchedulingPermissionsBase


class ShiftPermissionTests(SchedulingPermissionsBase):
    base_url = "/api/v1/shifts/"

    def _shift_url(self, shift):
        return f"{self.base_url}{shift.id}/"

    def _valid_shift_payload(self, event, service):
        return {
            "event": event.id,
            "service": service.id,
            "start": "2023-01-01T00:00:00Z",
            "end": "2023-01-01T01:00:00Z",
        }

    def _authenticate_as(self, user):
        self.client.force_authenticate(user)

    def _assert_denied(self, response):
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_anonymous_user_cannot_list_shifts(self):
        response = self.client.get(self.base_url)

        self._assert_denied(response)

    def test_authenticated_user_can_list_shifts(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_create_shift(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.post(
            self.base_url,
            self._valid_shift_payload(event=self.event_1, service=self.service_1),
            format="json",
        )

        self._assert_denied(response)

    def test_event_manager_can_update_shift_for_managed_event(self):
        self._authenticate_as(self.event_manager)

        response = self.client.patch(
            self._shift_url(self.shift_1),
            {"start": self.shift_1.start.isoformat()},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_manager_cannot_update_shift_for_unmanaged_event(self):
        self._authenticate_as(self.event_manager)

        response = self.client.patch(
            self._shift_url(self.shift_2),
            {"start": self.shift_2.start.isoformat()},
            format="json",
        )

        self._assert_denied(response)

    def test_service_manager_can_update_shift_for_managed_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.patch(
            self._shift_url(self.shift_1),
            {"start": self.shift_1.start.isoformat()},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_service_manager_cannot_update_shift_for_unmanaged_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.patch(
            self._shift_url(self.shift_2),
            {"start": self.shift_2.start.isoformat()},
            format="json",
        )

        self._assert_denied(response)
