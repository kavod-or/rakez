from rest_framework import status

from scheduling.tests.base_setup import SchedulingPermissionsBase
from staffing.models import Position


class ShiftPositionPermissionTests(SchedulingPermissionsBase):
    base_url = "/api/v1/shift-positions/"

    def _shift_position_url(self, shift_position):
        return f"{self.base_url}{shift_position.id}/"

    def _valid_shift_position_payload(self, shift, position):
        return {
            "shift": shift.id,
            "position": position.id,
            "amount": 1,
        }

    def _new_position_for_service(self, service, name):
        return Position.objects.create(
            service=service,
            name=name,
        )

    def _authenticate_as(self, user):
        self.client.force_authenticate(user)

    def _assert_denied(self, response):
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_anonymous_user_cannot_list_shift_positions(self):
        response = self.client.get(self.base_url)

        self._assert_denied(response)

    def test_authenticated_user_can_list_shift_positions(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_create_shift_position(self):
        self._authenticate_as(self.authenticated_user)
        position = self._new_position_for_service(self.service_1, "Normal User Position")

        response = self.client.post(
            self.base_url,
            self._valid_shift_position_payload(
                shift=self.shift_1,
                position=position,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_event_manager_can_create_shift_position_for_managed_event(self):
        self._authenticate_as(self.event_manager)
        position = self._new_position_for_service(self.service_1, "Managed Event Position")

        response = self.client.post(
            self.base_url,
            self._valid_shift_position_payload(
                shift=self.shift_1,
                position=position,
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_event_manager_cannot_create_shift_position_for_unmanaged_event(self):
        self._authenticate_as(self.event_manager)
        position = self._new_position_for_service(self.service_2, "Unmanaged Event Position")

        response = self.client.post(
            self.base_url,
            self._valid_shift_position_payload(
                shift=self.shift_2,
                position=position,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_service_manager_can_create_shift_position_for_managed_service(self):
        self._authenticate_as(self.service_manager)
        position = self._new_position_for_service(self.service_1, "Managed Service Position")

        response = self.client.post(
            self.base_url,
            self._valid_shift_position_payload(
                shift=self.shift_1,
                position=position,
            ),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_service_manager_cannot_create_shift_position_for_unmanaged_service(self):
        self._authenticate_as(self.service_manager)
        position = self._new_position_for_service(self.service_2, "Unmanaged Service Position")

        response = self.client.post(
            self.base_url,
            self._valid_shift_position_payload(
                shift=self.shift_2,
                position=position,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_event_manager_can_update_shift_position_for_managed_event(self):
        self._authenticate_as(self.event_manager)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_1),
            {"amount": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_event_manager_cannot_update_shift_position_for_unmanaged_event(self):
        self._authenticate_as(self.event_manager)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_2),
            {"amount": 2},
            format="json",
        )

        self._assert_denied(response)

    def test_service_manager_can_update_shift_position_for_managed_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_1),
            {"amount": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_service_manager_cannot_update_shift_position_for_unmanaged_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_2),
            {"amount": 2},
            format="json",
        )

        self._assert_denied(response)

    def test_superuser_can_update_any_shift_position(self):
        self._authenticate_as(self.superuser)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_2),
            {"amount": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_global_manager_can_update_any_shift_position(self):
        self._authenticate_as(self.global_manager)

        response = self.client.patch(
            self._shift_position_url(self.shift_position_2),
            {"amount": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
