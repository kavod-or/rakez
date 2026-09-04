from rest_framework import serializers


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_username(self, value):
        User = self.context["user_model"]
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value


class UserUpdateSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False, required=False, allow_blank=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)


class RoleCreateSerializer(serializers.Serializer):
    scope = serializers.ChoiceField(choices=["global", "event", "service"])
    role = serializers.CharField()
    target_id = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        scope = attrs["scope"]

        if scope in ("event", "service") and not attrs.get("target_id"):
            raise serializers.ValidationError({"target_id": "This field is required for the selected scope."})

        return attrs


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class LoginResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    user = serializers.DictField()


class LogoutRequestSerializer(serializers.Serializer):
    detail = serializers.CharField()


class LogoutResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
