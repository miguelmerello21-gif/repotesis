from rest_framework.routers import DefaultRouter
from .views import AtletaViewSet, CertificacionAtletaViewSet

router = DefaultRouter()
router.register(r'atletas', AtletaViewSet, basename='atletas')
router.register(r'certificaciones', CertificacionAtletaViewSet, basename='certificaciones-atleta')

urlpatterns = router.urls
