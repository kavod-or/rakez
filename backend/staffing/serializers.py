from rest_framework import serializers
from .models import Staff, Position, Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"


class StaffSerializer(serializers.ModelSerializer):
    positions = PositionSerializer(many=True, read_only=True)

    class Meta:
        model = Staff
        fields = "__all__"


class AssignPositionSerializer(serializers.Serializer):
    position_id = serializers.IntegerField()
