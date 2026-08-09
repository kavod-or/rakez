from rest_framework.generics import ListAPIView
from common.public_event_permissions import HasPublicEventAccess
from staffing.models import Staff
from .serializers import PublicStaffSerializer


class PublicEventStaffListView(ListAPIView):
    permission_classes = [HasPublicEventAccess]
    serializer_class = PublicStaffSerializer
    queryset = Staff.objects.all()
