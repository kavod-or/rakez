from django.core.validators import RegexValidator
from rest_framework import serializers
from .models import Staff, Position, Service


class ServiceSerializer(serializers.ModelSerializer):
    color = serializers.CharField(
        max_length=7,
        min_length=7,
        trim_whitespace=True,
        required=False,
        default="#3D7A6C",
        validators=[
            RegexValidator(
                regex=r"^#[0-9A-Fa-f]{6}$",
                message="Color must be a six-digit hexadecimal value such as #44A78F.",
            )
        ],
    )

    class Meta:
        model = Service
        fields = "__all__"

    def validate_color(self, value):
        return value.upper()


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
