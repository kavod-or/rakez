from django.contrib.auth import authenticate, get_user_model, login, logout
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import GlobalRole, EventRole, ServiceRole
from .permissions import IsGlobalManager, IsGlobalManagerOrReadOnly
from .serializers import LoginRequestSerializer, LoginResponseSerializer, LogoutResponseSerializer, \
    LogoutRequestSerializer, RoleCreateSerializer, UserCreateSerializer, UserUpdateSerializer
from scheduling.models import Event
from staffing.models import Service


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


@extend_schema(
    request=UserUpdateSerializer,
    responses=OpenApiResponse(description="Me"),
)
@api_view(["GET", "PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    if request.method in ["PATCH", "PUT"]:
        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data.pop("password", None)
        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        if password:
            user.set_password(password)
        user.save()

    return Response(_user_payload(user))


def _serialize_global_role(role: GlobalRole) -> dict:
    return {
        "id": role.id,
        "role": role.role,
        "label": role.get_role_display(),
        "scope": "global",
    }


def _serialize_event_role(role: EventRole) -> dict:
    return {
        "id": role.id,
        "role": role.role,
        "label": role.get_role_display(),
        "scope": "event",
        "target": {"id": str(role.event.public_id), "name": role.event.name},
    }


def _serialize_service_role(role: ServiceRole) -> dict:
    return {
        "id": role.id,
        "role": role.role,
        "label": role.get_role_display(),
        "scope": "service",
        "target": {"id": role.service.id, "name": role.service.name},
    }


def _get_user_roles(user) -> list[dict]:
    global_roles = GlobalRole.objects.filter(user=user)
    event_roles = EventRole.objects.filter(user=user).select_related("event")
    service_roles = ServiceRole.objects.filter(user=user).select_related("service")

    return [
        *[_serialize_global_role(r) for r in global_roles],
        *[_serialize_event_role(r) for r in event_roles],
        *[_serialize_service_role(r) for r in service_roles],
    ]


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.get_username(),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "roles": _get_user_roles(user),
    }


@extend_schema(
    request=UserCreateSerializer,
    responses={200: OpenApiResponse(description="Users"), 201: OpenApiResponse(description="User created")},
)
@api_view(["GET", "POST"])
@permission_classes([IsGlobalManagerOrReadOnly])
def users_view(request):
    User = get_user_model()

    if request.method == "POST":
        serializer = UserCreateSerializer(
            data=request.data,
            context={"user_model": User},
        )
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(**serializer.validated_data)
        return Response(_user_payload(user), status=status.HTTP_201_CREATED)

    return Response(
        [_user_payload(user) for user in User.objects.all().order_by("first_name", "last_name", "username")])


@extend_schema(
    request=UserUpdateSerializer,
    responses=OpenApiResponse(description="User updated"),
)
@api_view(["PATCH"])
@permission_classes([IsGlobalManager])
def user_detail_view(request, user_id):
    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)
    serializer = UserUpdateSerializer(
        user,
        data=request.data,
        partial=True,
    )
    serializer.is_valid(raise_exception=True)

    password = serializer.validated_data.pop("password", None)
    for field, value in serializer.validated_data.items():
        setattr(user, field, value)
    if password is not None:
        user.set_password(password)
    user.save()

    return Response(_user_payload(user))


@extend_schema(
    request=RoleCreateSerializer,
    responses={201: OpenApiResponse(description="Role added")},
)
@api_view(["POST"])
@permission_classes([IsGlobalManager])
def user_roles_view(request, user_id):
    

    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)

    serializer = RoleCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    scope = serializer.validated_data["scope"]
    role = serializer.validated_data["role"]
    target_id = serializer.validated_data.get("target_id")

    if scope == "global":
        if role not in GlobalRole.Role.values:
            return Response({"detail": "Invalid global role."}, status=status.HTTP_400_BAD_REQUEST)
        GlobalRole.objects.update_or_create(user=user, defaults={"role": role})
    elif scope == "event":
        if role not in EventRole.Role.values:
            return Response({"detail": "Invalid event role."}, status=status.HTTP_400_BAD_REQUEST)
        event = get_object_or_404(Event, public_id=target_id)
        EventRole.objects.update_or_create(user=user, event=event, defaults={"role": role})
    else:
        if role not in ServiceRole.Role.values:
            return Response({"detail": "Invalid service role."}, status=status.HTTP_400_BAD_REQUEST)
        service = get_object_or_404(Service, pk=target_id)
        ServiceRole.objects.update_or_create(user=user, service=service, defaults={"role": role})

    return Response(_user_payload(user), status=status.HTTP_201_CREATED)


@extend_schema(responses=OpenApiResponse(description="Role removed"))
@api_view(["DELETE"])
@permission_classes([IsGlobalManager])
def user_role_detail_view(request, user_id, scope, role_id):
    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)

    if scope == "global":
        role_obj = get_object_or_404(GlobalRole, pk=role_id, user=user)
    elif scope == "event":
        role_obj = get_object_or_404(EventRole, pk=role_id, user=user)
    elif scope == "service":
        role_obj = get_object_or_404(ServiceRole, pk=role_id, user=user)
    else:
        return Response({"detail": "Invalid role scope."}, status=status.HTTP_400_BAD_REQUEST)

    role_obj.delete()

    return Response(_user_payload(user))
