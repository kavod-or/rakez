from scheduling import serializers

from .models import Event


class PublicEventSerializer(serializers.FullCleanModelSerializer):
    class Meta:
        model = Event
        fields = ("public_id", "name", "start", "end", "timezone")
