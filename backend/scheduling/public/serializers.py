from scheduling.models import Event
from rest_framework import serializers

from scheduling.serializers import FullCleanModelSerializer


class PublicEventSerializer(FullCleanModelSerializer):
    class Meta:
        model = Event
        fields = ("public_id", "name", "start", "end", "timezone")


class UnlockSerializer(serializers.Serializer):
    pin = serializers.CharField(min_length=6, max_length=6)


class UnlockResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
