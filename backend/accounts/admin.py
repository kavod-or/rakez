from django.contrib import admin
from .models import GlobalRole, EventRole, ServiceRole

# Register your models here.
admin.site.register(GlobalRole)
admin.site.register(EventRole)
admin.site.register(ServiceRole)
