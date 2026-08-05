from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Event
from .public_permissions import HasPublicEventAccess
from .public_serializers import PublicEventSerializer, UnlockSerializer, UnlockResponseSerializer
from .public_tokens import issue_public_event_token


class PublicEventUnlockView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=UnlockSerializer,
        responses={
            200: UnlockResponseSerializer,
            403: OpenApiResponse(description="Invalid PIN"),
            404: OpenApiResponse(description="Event not found"),
        },
    )
    def post(self, request, event_public_id):
        event = get_object_or_404(Event, public_id=event_public_id)

        serializer = UnlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not event.pin_hash or not check_password(serializer.validated_data["pin"], event.pin_hash):
            return Response({"detail": "Invalid PIN."}, status=status.HTTP_403_FORBIDDEN)

        token = issue_public_event_token(event.public_id)
        response = Response(status=status.HTTP_200_OK)
        response.set_cookie(
            key='public_event_token',
            value=token,
            max_age=settings.PUBLIC_EVENT_TOKEN_MAX_AGE_SECONDS,
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="Lax",
            path=f"/api/v1/public/events/{event.public_id}/",
        )
        return response


class PublicEventDetailView(RetrieveAPIView):
    permission_classes = [HasPublicEventAccess]
    serializer_class = PublicEventSerializer
    lookup_field = "public_id"
    lookup_url_kwarg = "event_public_id"
    queryset = Event.objects.all()
