from django.urls import path
from scheduling.public.views import PublicEventUnlockView, PublicEventDetailView

urlpatterns = [
    path("events/<uuid:event_public_id>/unlock", PublicEventUnlockView.as_view(), name="public-event-unlock"),
    path("events/<uuid:event_public_id>/", PublicEventDetailView.as_view(), name="public-event-detail"),
]
