from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatosLandingViewSet, FotoCarruselViewSet, EventoLandingViewSet, EntrenadoresLandingViewSet, EstadisticasLandingViewSet

router = DefaultRouter()
router.register(r'landing/datos', DatosLandingViewSet, basename='landing-datos')
router.register(r'landing/carrusel', FotoCarruselViewSet, basename='landing-carrusel')
router.register(r'landing/eventos', EventoLandingViewSet, basename='landing-eventos')
router.register(r'landing/entrenadores', EntrenadoresLandingViewSet, basename='landing-entrenadores')
router.register(r'landing/estadisticas', EstadisticasLandingViewSet, basename='landing-estadisticas')

urlpatterns = [
    path('', include(router.urls)),
]
