from typing import Any
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import Unavailability


class UnavailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Unavailability
        fields = "__all__"

    def validate(self, attrs: Any) -> Any:
        attrs = super().validate(attrs)

        instance = self.instance or self.Meta.model()

        for field, value in attrs.items():
            setattr(instance, field, value)

        try:
            instance.full_clean()
        except DjangoValidationError as exc:
            if hasattr(exc, "message_dict"):
                raise serializers.ValidationError(exc.message_dict)
            raise serializers.ValidationError(exc.message)

        return attrs
