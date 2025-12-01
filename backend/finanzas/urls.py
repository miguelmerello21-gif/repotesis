from rest_framework.routers import DefaultRouter
from .views import EgresoViewSet

router = DefaultRouter()
router.register(r'egresos', EgresoViewSet, basename='egresos')

urlpatterns = router.urls
