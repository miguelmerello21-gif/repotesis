from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, CarritoViewSet, PedidoViewSet, WebpayPedidoConfirmView

router = DefaultRouter()
router.register(r'tienda/productos', ProductoViewSet, basename='tienda-productos')
router.register(r'tienda/pedidos', PedidoViewSet, basename='tienda-pedidos')

urlpatterns = [
    path('', include(router.urls)),
    path('tienda/carrito/', CarritoViewSet.as_view({'get': 'list'}), name='carrito'),
    path('tienda/carrito/agregar/', CarritoViewSet.as_view({'post': 'agregar'}), name='carrito-agregar'),
    path('tienda/carrito/actualizar/<int:item_id>/', CarritoViewSet.as_view({'patch': 'actualizar'}), name='carrito-actualizar'),
    path('tienda/carrito/eliminar/<int:item_id>/', CarritoViewSet.as_view({'delete': 'eliminar'}), name='carrito-eliminar'),
    path('tienda/pedidos/webpay/confirmar/', WebpayPedidoConfirmView.as_view(), name='tienda-webpay-confirmar'),
]
