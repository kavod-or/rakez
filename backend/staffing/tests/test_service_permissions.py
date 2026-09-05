from rest_framework import status
import json

from staffing.models import Service

from .base_setup import StaffingPermissionsBase


class ServicePermissionTests(StaffingPermissionsBase):
    base_url = "/api/v1/services/"

    def _get_service_by_id(self, service_id):
        try:
            return Service.objects.get(pk=service_id)
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

    def test_anonymous_user_cannot_list_service(self):
        response = self.client.get(self.base_url)

        self._assert_denied(response)

    def test_authenticated_user_can_list_services(self):
        self._authenticate_as(self.authenticated_user)

        response = self.client.get(self.base_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_service_manager_cannot_create_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.post(
            self.base_url,
            data={
                "name": "banana-bread",
            },
            format="json"
        )

        self._assert_denied(response)

    def test_service_manager_cannot_delete_service(self):
        self._authenticate_as(self.service_manager)

        response = self.client.delete(
            f'{self.base_url}{self.service_1.pk}/'
        )

        self._assert_denied(response)

    def test_global_manager_can_lifecycle_service(self):
        self._authenticate_as(self.global_manager)

        response_create = self.client.post(
            self.base_url,
            data={
                "name": "test-service",
            },
            format="json"
        )

        self._assert_created(response_create)

        service_id = json.loads(response_create.content)['id']
        service_object = self._get_service_by_id(service_id)

        self.assertIsInstance(service_object, Service)

        response_update = self.client.patch(
            f'{self.base_url}{service_id}/',
            data={
                'name': "updated-test-service"
            },
            format="json"
        )

        self._assert_updated(response_update)
        service_object.refresh_from_db()
        self.assertEqual(service_object.name, "updated-test-service")

        response_delete = self.client.delete(
            f'{self.base_url}{service_id}/'
        )

        self._assert_deleted(response_delete)

    def test_global_manager_can_set_service_color(self):
        self._authenticate_as(self.global_manager)

        response_create = self.client.post(
            self.base_url,
            data={
                "name": "colored-service",
                "color": "#12abEF",
            },
            format="json"
        )

        self._assert_created(response_create)
        self.assertEqual(response_create.data["color"], "#12ABEF")

        service_id = response_create.data["id"]
        response_update = self.client.patch(
            f'{self.base_url}{service_id}/',
            data={"color": "#abcdef"},
            format="json"
        )

        self._assert_updated(response_update)
        self.assertEqual(response_update.data["color"], "#ABCDEF")

    def test_service_color_must_be_six_digit_hex(self):
        self._authenticate_as(self.global_manager)

        response = self.client.post(
            self.base_url,
            data={"name": "invalid-color-service", "color": "blue"},
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("color", response.data)
