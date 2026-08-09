from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password

from scheduling.models import Shift, ShiftPosition, ShiftAssignment, Event

# Register your models here.
admin.site.register(Shift)
admin.site.register(ShiftPosition)
admin.site.register(ShiftAssignment)


class EventAdminForm(forms.ModelForm):
    pin = forms.CharField(
        required=False,
        min_length=6,
        max_length=6,
        widget=forms.PasswordInput(render_value=False),
        help_text="Set or rotate 6-digit PIN",
    )

    class Meta:
        model = Event
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        pin = cleaned.get("pin")
        if not self.instance.pk and not pin:  # require only on create
            self.add_error("pin", "PIN is required when creating an event.")
        return cleaned

    def save(self, commit=True):
        obj = super().save(commit=False)
        pin = self.cleaned_data.get("pin")
        if pin:
            obj.pin_hash = make_password(pin)
        if commit:
            obj.save()
            self.save_m2m()
        return obj


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    form = EventAdminForm
    readonly_fields = ("pin_hash", "public_id_display")

    @admin.display(description="Public id")
    def public_id_display(self, obj):
        if not obj or not obj.pk:
            return "-"
        return obj.public_id
