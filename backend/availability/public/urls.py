from django.urls import path
from availability.public.views import PublicStaffUnavailabilityView

urlpatterns = [
    path(
        "events/<uuid:event_public_id>/availability/<uuid:staff_public_id>/",
        PublicStaffUnavailabilityView.as_view(),
        name="public-staff-unavailability",
    ),
]
