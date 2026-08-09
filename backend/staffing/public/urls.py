from django.urls import path
from .views import PublicEventStaffListView

urlpatterns = [
    path("events/<uuid:event_public_id>/staff/", PublicEventStaffListView.as_view())
]
