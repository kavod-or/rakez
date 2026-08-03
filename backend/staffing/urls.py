from rest_framework.routers import DefaultRouter

from .views import StaffViewSet, PositionViewSet, ServiceViewSet

router = DefaultRouter()

router.register(r'positions', PositionViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'services', ServiceViewSet)

urlpatterns = router.urls
