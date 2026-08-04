from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event
from .public_permissions import HasPublicEventAccess
from .public_serializers import PublicEventSerializer
from .public_tokens import issue_public_event_token


class UnlockSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=6, max_length=6)


class PublicEventUnlockView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, event_public_id):
        event = get_object_or_404(Event, public_id=event_public_id)

        serializer = UnlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not event.pin_hash or not check_password(serializer.validated_data["pin"], event.pin_hash):
            return Response({"detail": "Invalid PIN."}, status=status.HTTP_403_FORBIDDEN)

        token = issue_public_event_token(event.public_id)
        return Response({"token": token}, status=status.HTTP_200_OK)


class PublicEventDetailView(RetrieveAPIView):
    permission_classes = [HasPublicEventAccess]
    serializer_class = PublicEventSerializer
    lookup_field = "public_id"
    lookup_url_kwarg = "event_public_id"
    queryset = Event.objects.all()
