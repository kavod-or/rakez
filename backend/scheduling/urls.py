from rest_framework.routers import DefaultRouter

from .views import ShiftViewSet, ShiftPositionViewSet, ShiftAssignmentViewSet, EventViewSet

router = DefaultRouter()

router.register(r'events', EventViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'shift-positions', ShiftPositionViewSet)
router.register(r'shift-assignments', ShiftAssignmentViewSet)

urlpatterns = router.urls
