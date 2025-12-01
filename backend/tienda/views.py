import uuid
from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.conf import settings
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.options import WebpayOptions
from .models import Producto, VarianteProducto, Carrito, ItemCarrito, Pedido, ItemPedido, WebpayPedidoTransaction
from .serializers import (
    ProductoSerializer, VarianteProductoSerializer, CarritoSerializer, CarritoItemSerializer,
    PedidoSerializer
)


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_apoderado(user):
    return getattr(user, 'role', None) == 'apoderado'


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(nivel_acceso=tipo)

        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and (
            getattr(user, 'role', None) == 'admin' or user.is_staff or user.is_superuser
        ):
            return qs
        role = getattr(user, 'role', None) if user and user.is_authenticated else 'public'
        qs = qs.filter(activo=True)
        if role == 'apoderado':
            return qs
        # Público o no autenticado solo ve productos públicos
        qs = qs.filter(nivel_acceso='publico')
        return qs


class CarritoViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_carrito(self, user):
        carrito, _ = Carrito.objects.get_or_create(usuario=user)
        return carrito

    def list(self, request):
        carrito = self._get_carrito(request.user)
        serializer = CarritoSerializer(carrito)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='agregar')
    def agregar(self, request):
        carrito = self._get_carrito(request.user)
        serializer = CarritoItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        producto = serializer.validated_data['producto']
        variante = serializer.validated_data.get('variante')
        cantidad = serializer.validated_data.get('cantidad', 1)
        stock_disponible = variante.stock if variante else producto.stock
        try:
            cantidad_int = int(cantidad)
        except Exception:
            cantidad_int = 1
        item, created = ItemCarrito.objects.get_or_create(
            carrito=carrito, producto=producto, variante=variante,
            defaults={'cantidad': cantidad_int}
        )
        if not created:
            nueva_cantidad = item.cantidad + cantidad_int
            if nueva_cantidad > stock_disponible:
                return Response(
                    {'detail': f'Stock insuficiente. Disponible: {stock_disponible}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            item.cantidad = nueva_cantidad
            item.save(update_fields=['cantidad'])
        else:
            if cantidad_int > stock_disponible:
                item.delete()
                return Response(
                    {'detail': f'Stock insuficiente. Disponible: {stock_disponible}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(CarritoSerializer(carrito).data)

    @action(detail=False, methods=['patch'], url_path='actualizar/(?P<item_id>[^/.]+)')
    def actualizar(self, request, item_id=None):
        carrito = self._get_carrito(request.user)
        try:
            item = carrito.items.get(pk=item_id)
        except ItemCarrito.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        cantidad = int(request.data.get('cantidad', item.cantidad))
        stock_disponible = item.variante.stock if item.variante else item.producto.stock
        if cantidad > stock_disponible:
            return Response(
                {'detail': f'Stock insuficiente. Disponible: {stock_disponible}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        item.cantidad = cantidad
        item.save(update_fields=['cantidad'])
        return Response(CarritoSerializer(carrito).data)

    @action(detail=False, methods=['delete'], url_path='eliminar/(?P<item_id>[^/.]+)')
    def eliminar(self, request, item_id=None):
        carrito = self._get_carrito(request.user)
        carrito.items.filter(pk=item_id).delete()
        return Response(CarritoSerializer(carrito).data)


class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Pedido.objects.filter(usuario=user)
        if is_admin(user):
            qs = Pedido.objects.all()
        return qs

    def create(self, request, *args, **kwargs):
        user = request.user
        carrito, _ = Carrito.objects.get_or_create(usuario=user)
        if not carrito.items.exists():
            return Response({'detail': 'Carrito vac�o'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Validar stock antes de confirmar el pedido
            for item in carrito.items.select_related('producto', 'variante'):
                stock_disp = item.variante.stock if item.variante else item.producto.stock
                if item.cantidad > stock_disp:
                    return Response(
                        {'detail': f'Stock insuficiente para {item.producto.nombre}. Disponible: {stock_disp}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            subtotal = sum([item.subtotal for item in carrito.items.all()])
            costo_envio = Decimal(request.data.get('costo_envio', 0))
            total = subtotal + costo_envio
            numero_pedido = str(uuid.uuid4())[:8]
            comprador_nombre = getattr(user, 'name', '') or ''
            comprador_email = getattr(user, 'email', '') or ''
            comprador_telefono = getattr(user, 'phone', '') or ''
            comprador_nivel = getattr(user, 'role', '') or ''
            pedido = Pedido.objects.create(
                usuario=user,
                comprador_nombre=comprador_nombre,
                comprador_email=comprador_email,
                comprador_telefono=comprador_telefono,
                comprador_nivel_acceso=comprador_nivel,
                numero_pedido=numero_pedido,
                estado='pendiente',
                subtotal=subtotal,
                costo_envio=costo_envio,
                total=total,
                metodo_pago=request.data.get('metodo_pago', 'transferencia'),
                metodo_entrega=request.data.get('metodo_entrega', 'retiro'),
                direccion_entrega=request.data.get('direccion_entrega', ''),
                notas_cliente=request.data.get('notas_cliente', ''),
            )
            for item in carrito.items.select_related('producto', 'variante'):
                ItemPedido.objects.create(
                    pedido=pedido,
                    producto_nombre=item.producto.nombre,
                    variante_nombre=item.variante.nombre if item.variante else '',
                    cantidad=item.cantidad,
                    precio_unitario=item.producto.precio_actual,
                    subtotal=item.subtotal,
                )
                # Descontar stock del producto o variante
                if item.variante:
                    item.variante.stock = max(0, item.variante.stock - item.cantidad)
                    item.variante.save(update_fields=['stock'])
                else:
                    item.producto.stock = max(0, item.producto.stock - item.cantidad)
                    item.producto.save(update_fields=['stock'])
            carrito.items.all().delete()
        serializer = self.get_serializer(pedido)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='webpay/init')
    def webpay_init(self, request, pk=None):
        pedido = self.get_object()
        if pedido.pagado:
            return Response({'detail': 'Pedido ya pagado'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount_val = float(pedido.total)
        except Exception:
            return Response({'detail': 'Monto inv�lido'}, status=status.HTTP_400_BAD_REQUEST)
        buy_order = f"pedido-{pedido.id}"
        session_id = str(request.user.id)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            frontend_return = getattr(settings, 'FRONTEND_WEBPAY_RETURN_URL', None) or getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            return_url = f"{frontend_return.rstrip('/')}/tienda-webpay-retorno"
            tx = Transaction(options)
            response = tx.create(buy_order, session_id, amount_val, return_url)
            token = response.get('token')
            url = response.get('url')
            if not token or not url:
                return Response({'detail': 'No se pudo iniciar transacci�n (sin token/url)'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            WebpayPedidoTransaction.objects.create(pedido=pedido, token=token, estado='iniciada')
            return Response({'url': url, 'token': token})
        except Exception as ex:
            return Response({'detail': f'Error al iniciar Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WebpayPedidoConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token') or request.data.get('token_ws')
        if not token:
            return Response({'detail': 'token requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            options = WebpayOptions(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, "TEST")
            tx = Transaction(options)
            resp = tx.commit(token)
        except Exception as ex:
            return Response({'detail': f'Error al confirmar con Webpay: {ex}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            tx_model = WebpayPedidoTransaction.objects.select_related('pedido').get(token=token)
        except WebpayPedidoTransaction.DoesNotExist:
            return Response({'detail': 'Transacci�n no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        response_code = None
        if isinstance(resp, dict):
            response_code = resp.get('response_code')
        elif hasattr(resp, 'response_code'):
            response_code = getattr(resp, 'response_code')

        if response_code in [0, None]:
            tx_model.estado = 'confirmada'
            pedido = tx_model.pedido
            pedido.pagado = True
            pedido.estado = 'pagado'
            pedido.fecha_pago = pedido.fecha_pago or pedido.updated_at
            pedido.metodo_pago = 'webpay'
            pedido.save(update_fields=['pagado', 'estado', 'fecha_pago', 'metodo_pago'])
            tx_model.save(update_fields=['estado'])
            return Response({'status': 'ok', 'pedido': PedidoSerializer(pedido).data})

        tx_model.estado = 'rechazada'
        tx_model.save(update_fields=['estado'])
        return Response({'status': 'error', 'detail': 'Pago rechazado', 'response_code': response_code, 'response': resp}, status=status.HTTP_400_BAD_REQUEST)
