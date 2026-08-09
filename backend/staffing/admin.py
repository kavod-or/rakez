from django import forms
from django.contrib import admin
from .models import Staff, Position, StaffPosition, Service

# Register your models here.
# admin.site.register(Staff)
admin.site.register(Position)
admin.site.register(StaffPosition)
admin.site.register(Service)


class StaffAdminForm(forms.ModelForm):
    class Meta:
        model = Staff
        fields = "__all__"


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    form = StaffAdminForm
    readonly_fields = ("public_id_display",)

    @admin.display(description="Public id")
    def public_id_display(self, obj):
        if not obj or not obj.pk:
            return "-"
        return obj.public_id
