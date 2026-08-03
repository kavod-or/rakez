from django.contrib import admin

from scheduling.models import Shift, ShiftPosition, ShiftAssignment, Event

# Register your models here.
admin.site.register(Event)
admin.site.register(Shift)
admin.site.register(ShiftPosition)
admin.site.register(ShiftAssignment)
