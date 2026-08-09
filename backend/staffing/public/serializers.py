from staffing.models import Staff
from rest_framework import serializers


class PublicStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ("public_id", "firstname", "lastname")
