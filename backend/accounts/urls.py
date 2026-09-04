from django.urls import path

from .views import csrf_view, login_view, logout_view, me_view, user_detail_view, user_role_detail_view, \
    user_roles_view, users_view

urlpatterns = [
    path("csrf/", csrf_view, name="auth-csrf"),
    path("login/", login_view, name="auth-login"),
    path("logout/", logout_view, name="auth-logout"),
    path("me/", me_view, name="auth-me"),
    path("users/", users_view, name="auth-users"),
    path("users/<int:user_id>/", user_detail_view, name="auth-user-detail"),
    path("users/<int:user_id>/roles/", user_roles_view, name="auth-user-roles"),
    path("users/<int:user_id>/roles/<str:scope>/<int:role_id>/", user_role_detail_view, name="auth-user-role-detail"),
]
