from rest_framework.routers import DefaultRouter
from .views import RankingViewSet, LogroAtletaViewSet, EvaluacionAtletaViewSet

router = DefaultRouter()
router.register(r'ranking', RankingViewSet, basename='ranking')
router.register(r'logros', LogroAtletaViewSet, basename='logros')
router.register(r'evaluaciones', EvaluacionAtletaViewSet, basename='evaluaciones')

urlpatterns = router.urls
