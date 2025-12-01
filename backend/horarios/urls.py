from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import HorarioViewSet, AsistenciaPorAtletaViewSet, AsistenciaViewSet

router = DefaultRouter()
router.register(r'horarios', HorarioViewSet, basename='horarios')
router.register(r'asistencias', AsistenciaViewSet, basename='asistencias')

urlpatterns = [
    path('', include(router.urls)),
    path('atletas/<int:atleta_pk>/asistencias/', AsistenciaPorAtletaViewSet.as_view({'get': 'list'}), name='asistencias-atleta'),
]