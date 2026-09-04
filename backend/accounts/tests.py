from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import GlobalRole


class UserManagementTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="member", password="password")
        self.global_manager = User.objects.create_user(
            username="global_manager",
            password="password",
        )
        self.superuser = User.objects.create_superuser(
            username="superuser",
            password="password",
        )
        GlobalRole.objects.create(
            user=self.global_manager,
            role=GlobalRole.Role.GLOBAL_MANAGER,
        )

    def test_authenticated_user_cannot_create_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/v1/auth/users/",
            {"username": "new_user", "password": "password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_global_manager_can_create_user(self):
        self.client.force_authenticate(user=self.global_manager)

        response = self.client.post(
            "/api/v1/auth/users/",
            {
                "username": "new_user",
                "password": "password",
                "first_name": "New",
                "last_name": "User",
                "email": "new@example.com",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "new_user")
        created_user = get_user_model().objects.get(username="new_user")
        self.assertTrue(created_user.check_password("password"))

    def test_authenticated_user_cannot_update_user(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            f"/api/v1/auth/users/{self.global_manager.pk}/",
            {"first_name": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_without_global_manager_role_cannot_create_user(self):
        self.client.force_authenticate(user=self.superuser)

        response = self.client.post(
            "/api/v1/auth/users/",
            {"username": "new_user", "password": "password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_global_manager_can_update_user(self):
        self.client.force_authenticate(user=self.global_manager)

        response = self.client.patch(
            f"/api/v1/auth/users/{self.user.pk}/",
            {
                "username": "changed_username",
                "first_name": "Updated",
                "password": "new-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Updated")
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "member")
        self.assertTrue(self.user.check_password("new-password"))

    def test_user_can_update_own_details_and_password_via_me(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/v1/auth/me/",
            {
                "first_name": "SelfFirst",
                "last_name": "SelfLast",
                "email": "self@example.com",
                "password": "self-new-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "SelfFirst")
        self.assertEqual(response.data["last_name"], "SelfLast")
        self.assertEqual(response.data["email"], "self@example.com")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "SelfFirst")
        self.assertEqual(self.user.last_name, "SelfLast")
        self.assertEqual(self.user.email, "self@example.com")
        self.assertTrue(self.user.check_password("self-new-password"))

    def test_user_cannot_update_username_or_roles_via_me(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/v1/auth/me/",
            {
                "username": "hacked_username",
                "roles": [{"scope": "global", "role": "global_manager"}],
                "is_staff": True,
                "is_superuser": True,
                "first_name": "SafeUpdate",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "member")
        self.assertEqual(response.data["first_name"], "SafeUpdate")
        self.user.refresh_from_db()
        self.assertEqual(self.user.username, "member")
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)
        self.assertFalse(
            GlobalRole.objects.filter(user=self.user, role=GlobalRole.Role.GLOBAL_MANAGER).exists()
        )
