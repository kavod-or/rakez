from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import GlobalRole, EventRole, ServiceRole
from .serializers import LoginRequestSerializer, LoginResponseSerializer, LogoutResponseSerializer, \
    LogoutRequestSerializer


# Create your views here.

@extend_schema(responses=OpenApiResponse(description="CSRF cookie set."))
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({"detail": "CSRF cookie set."})


@extend_schema(request=LoginRequestSerializer, responses=LoginResponseSerializer)
@extend_schema(responses=OpenApiResponse(description="Login"))
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(
        request=request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {"detail": "Invalid username or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user)

    return Response(
        {
            "detail": "Logged in.",
            "user": {
                "id": user.id,
            },
        }
    )


@extend_schema(request=LogoutRequestSerializer, responses=LogoutResponseSerializer)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out"})


@extend_schema(responses=OpenApiResponse(description="Me"))
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    # collect global roles
    global_qs = GlobalRole.objects.filter(user=user).values_list("role", flat=True)

    # collect event roles with related event info
    event_qs = EventRole.objects.filter(user=user).select_related("event")

    # collect service roles with related service info
    service_qs = ServiceRole.objects.filter(user=user).select_related("service")

    roles = []

    for gr in GlobalRole.objects.filter(user=user):
        roles.append({
            "role": gr.role,
            "label": gr.get_role_display(),
            "scope": "global",
        })

    for er in event_qs:
        roles.append({
            "role": er.role,
            "label": er.get_role_display(),
            "scope": "event",
            "target": {"id": str(er.event.public_id), "name": er.event.name},
        })

    for sr in service_qs:
        roles.append({
            "role": sr.role,
            "label": sr.get_role_display(),
            "scope": "service",
            "target": {"id": sr.service.id, "name": sr.service.name},
        })

    return Response(
        {
            "id": user.id,
            "username": user.get_username(),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "roles": roles,
        }
    )
