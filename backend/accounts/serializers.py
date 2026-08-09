from rest_framework import serializers


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
