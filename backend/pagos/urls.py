from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PeriodoMatriculaViewSet, MatriculaViewSet, ConfiguracionMensualidadViewSet,
    MensualidadViewSet, PagoManualView, DeudaView, ReportesFinancierosView,
    WebpayInitView, WebpayConfirmView, WebpayReturnView,
    PagoOnlineViewSet, PagoOnlineObligacionViewSet, PaymentCardViewSet,
    WebpayPagoOnlineInitView, WebpayPagoOnlineConfirmView
)

router = DefaultRouter()
router.register(r'pagos/periodos-matricula', PeriodoMatriculaViewSet, basename='periodos-matricula')
router.register(r'pagos/matriculas', MatriculaViewSet, basename='matriculas')
router.register(r'pagos/mensualidades', MensualidadViewSet, basename='mensualidades')
router.register(r'pagos/deudas', DeudaView, basename='deudas')
router.register(r'pagos/reportes', ReportesFinancierosView, basename='reportes-financieros')
router.register(r'pagos/online', PagoOnlineViewSet, basename='pagos-online')
# Nota: usamos un prefijo distinto para evitar colisión con el detail de pagos/online/<id>/
router.register(r'pagos/online-obligaciones', PagoOnlineObligacionViewSet, basename='pagos-online-obligaciones')
router.register(r'pagos/tarjetas', PaymentCardViewSet, basename='pagos-tarjetas')
urlpatterns = [
    path('', include(router.urls)),
    path('pagos/configuracion-mensualidades/', ConfiguracionMensualidadViewSet.as_view({'get': 'list', 'patch': 'partial_update'}), name='configuracion-mensualidades'),
    path('pagos/pago-manual/', PagoManualView.as_view({'post': 'create'}), name='pago-manual'),
    path('pagos/webpay/init/', WebpayInitView.as_view(), name='webpay-init'),
    path('pagos/webpay/confirmar/', WebpayConfirmView.as_view(), name='webpay-confirm'),
    path('pagos/webpay/retorno/', WebpayReturnView.as_view(), name='webpay-retorno'),
    path('pagos/online/webpay/init/', WebpayPagoOnlineInitView.as_view(), name='pagos-online-webpay-init'),
    path('pagos/online/webpay/confirmar/', WebpayPagoOnlineConfirmView.as_view(), name='pagos-online-webpay-confirm'),
]
