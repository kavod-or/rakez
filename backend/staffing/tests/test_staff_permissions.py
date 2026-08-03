from rest_framework import status
import json

from staffing.models import Staff

from .base_setup import StaffingPermissionsBase


class StaffPermissionTests(StaffingPermissionsBase):
    base_url = "/api/v1/staff/"

    def _get_staff_by_id(self, staff_id):
        try:
            return Staff.objects.get(pk=staff_id)
        except:
            return None

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

    def _assert_deleted(self, response):
        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT,
            response.data
        )

    def _authenticate_as(self, user):
        self.client.force_authenticate(user)

    def test_anonymous_user_cannot_list_staff(self):
        response = self.client.get(self.base_url)

        self._assert_denied(response)

    def test_authenticated_user_can_list_staff(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_user_can_lifecycle_staff(self):
        self._authenticate_as(self.authenticated_user)

        response_create = self.client.post(
            self.base_url,
            data={
                "firstname": "authenticated-post",
                "lastname": "test"
            },
            format="json"
        )

        self._assert_created(response_create)

        staff_id = json.loads(response_create.content)['id']
        staff_object = self._get_staff_by_id(staff_id)

        self.assertIsInstance(staff_object, Staff)

        response_update = self.client.patch(
            f'{self.base_url}{staff_id}/',
            data={
                'firstname': "authenticated-updated"
            },
            format="json"
        )

        self._assert_updated(response_update)
        staff_object.refresh_from_db()
        self.assertEqual(staff_object.firstname, "authenticated-updated")

        response_delete = self.client.delete(
            f'{self.base_url}{staff_id}/'
        )

        self._assert_deleted(response_delete)
