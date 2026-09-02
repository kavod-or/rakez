from django.urls import path

from .views import csrf_view, login_view, logout_view, me_view, users_view

urlpatterns = [
    path("csrf/", csrf_view, name="auth-csrf"),
    path("login/", login_view, name="auth-login"),
    path("logout/", logout_view, name="auth-logout"),
    path("me/", me_view, name="auth-me"),
    path("users/", users_view, name="auth-users"),
]
