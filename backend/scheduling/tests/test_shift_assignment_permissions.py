from rest_framework import status

from scheduling.tests.base_setup import SchedulingPermissionsBase
from staffing.models import Staff


class ShiftAssignmentPermissionTests(SchedulingPermissionsBase):
    base_url = "/api/v1/shift-assignments/"

    def _shift_assignment_url(self, shift_assignment):
        return f"{self.base_url}{shift_assignment.id}/"

    def _valid_shift_assignment_payload(self, shift_position, staff):
        return {
            "shift_position": shift_position.id,
            "staff": staff.id,
        }

    def _new_staff(self, firstname):
        return Staff.objects.create(
            firstname=firstname,
            lastname="Permission Test",
        )

    def _make_shift_position_assignable(self, shift_position):
        shift_position.amount = 2
        shift_position.save()
        return shift_position

    def _authenticate_as(self, user):
        self.client.force_authenticate(user)

    def _assert_denied(self, response):
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def _assert_created(self, response):
        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

    def _assert_updated(self, response):
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            response.data,
        )

    def test_anonymous_user_cannot_list_shift_assignments(self):
        response = self.client.get(self.base_url)

        self._assert_denied(response)

    def test_authenticated_user_can_list_shift_assignments(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_create_shift_assignment(self):
        self._authenticate_as(self.authenticated_user)
        shift_position = self._make_shift_position_assignable(self.shift_position_1)
        staff = self._new_staff("Normal")

        response = self.client.post(
            self.base_url,
            self._valid_shift_assignment_payload(
                shift_position=shift_position,
                staff=staff,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_event_manager_can_create_shift_assignment_for_managed_event(self):
        self._authenticate_as(self.event_manager)
        shift_position = self._make_shift_position_assignable(self.shift_position_1)
        staff = self._new_staff("Event Managed")

        response = self.client.post(
            self.base_url,
            self._valid_shift_assignment_payload(
                shift_position=shift_position,
                staff=staff,
            ),
            format="json",
        )

        self._assert_created(response)

    def test_event_manager_cannot_create_shift_assignment_for_unmanaged_event(self):
        self._authenticate_as(self.event_manager)
        shift_position = self._make_shift_position_assignable(self.shift_position_2)
        staff = self._new_staff("Event Unmanaged")

        response = self.client.post(
            self.base_url,
            self._valid_shift_assignment_payload(
                shift_position=shift_position,
                staff=staff,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_service_manager_can_create_shift_assignment_for_managed_service(self):
        self._authenticate_as(self.service_manager)
        shift_position = self._make_shift_position_assignable(self.shift_position_1)
        staff = self._new_staff("Service Managed")

        response = self.client.post(
            self.base_url,
            self._valid_shift_assignment_payload(
                shift_position=shift_position,
                staff=staff,
            ),
            format="json",
        )

        self._assert_created(response)

    def test_service_manager_cannot_create_shift_assignment_for_unmanaged_service(self):
        self._authenticate_as(self.service_manager)
        shift_position = self._make_shift_position_assignable(self.shift_position_2)
        staff = self._new_staff("Service Unmanaged")

        response = self.client.post(
            self.base_url,
            self._valid_shift_assignment_payload(
                shift_position=shift_position,
                staff=staff,
            ),
            format="json",
        )

        self._assert_denied(response)

    def test_event_manager_can_update_shift_assignment_for_managed_event(self):
        self._authenticate_as(self.event_manager)
        staff = self._new_staff("Event Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_1),
            {"staff": staff.id},
            format="json",
        )

        self._assert_updated(response)

    def test_event_manager_cannot_update_shift_assignment_for_unmanaged_event(self):
        self._authenticate_as(self.event_manager)
        staff = self._new_staff("Event Denied Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_2),
            {"staff": staff.id},
            format="json",
        )

        self._assert_denied(response)

    def test_service_manager_can_update_shift_assignment_for_managed_service(self):
        self._authenticate_as(self.service_manager)
        staff = self._new_staff("Service Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_1),
            {"staff": staff.id},
            format="json",
        )

        self._assert_updated(response)

    def test_service_manager_cannot_update_shift_assignment_for_unmanaged_service(self):
        self._authenticate_as(self.service_manager)
        staff = self._new_staff("Service Denied Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_2),
            {"staff": staff.id},
            format="json",
        )

        self._assert_denied(response)

    def test_superuser_can_update_any_shift_assignment(self):
        self._authenticate_as(self.superuser)
        staff = self._new_staff("Superuser Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_2),
            {"staff": staff.id},
            format="json",
        )

        self._assert_updated(response)

    def test_global_manager_can_update_any_shift_assignment(self):
        self._authenticate_as(self.global_manager)
        staff = self._new_staff("Global Manager Update")

        response = self.client.patch(
            self._shift_assignment_url(self.shift_assignment_2),
            {"staff": staff.id},
            format="json",
        )

        self._assert_updated(response)
