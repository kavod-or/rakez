from availability.models import Unavailability
from rest_framework import serializers


class PublicUnavailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Unavailability
        fields = ("id", "start", "end")
        read_only_fields = ("id",)
