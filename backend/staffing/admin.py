from django.contrib import admin
from .models import Staff, Position, StaffPosition, Service

# Register your models here.
admin.site.register(Staff)
admin.site.register(Position)
admin.site.register(StaffPosition)
admin.site.register(Service)
