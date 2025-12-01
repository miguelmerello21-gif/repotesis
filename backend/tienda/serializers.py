from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Producto, VarianteProducto, Carrito, ItemCarrito, Pedido, ItemPedido

User = get_user_model()


class VarianteProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VarianteProducto
        fields = ['id', 'nombre', 'stock', 'precio_adicional']


class ProductoSerializer(serializers.ModelSerializer):
    variantes = VarianteProductoSerializer(many=True, read_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Producto
        fields = [
            'id',
            'nombre',
            'descripcion',
            'categoria',
            'nivel_acceso',
            'precio',
            'precio_oferta',
            'en_oferta',
            'stock',
            'stock_minimo',
            'tiene_variantes',
            'imagen_principal',
            'imagen_2',
            'imagen_3',
            'activo',
            'destacado',
            'slug',
            'variantes',
        ]

    def _slug_unico(self, base_slug: str, instance=None) -> str:
        """
        Genera un slug único evitando colisiones con otros productos.
        Excluye el propio objeto en caso de update.
        """
        slug_candidate = base_slug
        counter = 1
        qs = Producto.objects.all()
        if instance is not None:
            qs = qs.exclude(pk=instance.pk)
        while qs.filter(slug=slug_candidate).exists():
            slug_candidate = f"{base_slug}-{counter}"
            counter += 1
        return slug_candidate

    def create(self, validated_data):
        if not validated_data.get('slug'):
            base_slug = slugify(validated_data.get('nombre', 'producto'))
            validated_data['slug'] = self._slug_unico(base_slug)
        else:
            validated_data['slug'] = self._slug_unico(validated_data['slug'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Solo recalculamos slug si llega uno nuevo o cambia el nombre
        if 'slug' in validated_data and validated_data.get('slug'):
            validated_data['slug'] = self._slug_unico(slugify(validated_data['slug']), instance=instance)
        elif 'nombre' in validated_data and validated_data.get('nombre'):
            validated_data['slug'] = self._slug_unico(slugify(validated_data['nombre']), instance=instance)
        return super().update(instance, validated_data)


class CarritoItemSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(source='producto', queryset=Producto.objects.all(), write_only=True)
    variante_id = serializers.PrimaryKeyRelatedField(
        source='variante',
        queryset=VarianteProducto.objects.all(),
        write_only=True,
        allow_null=True,
        required=False,
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemCarrito
        fields = ['id', 'producto', 'producto_id', 'variante_id', 'cantidad', 'subtotal']


class CarritoSerializer(serializers.ModelSerializer):
    items = CarritoItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cantidad_items = serializers.IntegerField(read_only=True)

    class Meta:
        model = Carrito
        fields = ['id', 'usuario', 'items', 'total', 'cantidad_items']
        read_only_fields = ['usuario', 'items', 'total', 'cantidad_items']


class PedidoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPedido
        fields = ['id', 'producto_nombre', 'variante_nombre', 'cantidad', 'precio_unitario', 'subtotal']


class PedidoSerializer(serializers.ModelSerializer):
    items = PedidoItemSerializer(many=True, read_only=True)
    usuario = serializers.PrimaryKeyRelatedField(read_only=True)
    usuario_email = serializers.EmailField(source="usuario.email", read_only=True)
    usuario_nombre = serializers.CharField(source="usuario.name", read_only=True)
    usuario_telefono = serializers.CharField(source="usuario.phone", read_only=True)
    usuario_nivel_acceso = serializers.CharField(source="usuario.role", read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id',
            'numero_pedido',
            'estado',
            'subtotal',
            'costo_envio',
            'total',
            'metodo_pago',
            'comprobante_pago',
            'pagado',
            'fecha_pago',
            'metodo_entrega',
            'direccion_entrega',
            'fecha_entrega',
            'notas_cliente',
            'notas_admin',
            'created_at',
            'usuario',
            'usuario_email',
            'usuario_nombre',
            'usuario_telefono',
            'usuario_nivel_acceso',
            'comprador_nombre',
            'comprador_email',
            'comprador_telefono',
            'comprador_nivel_acceso',
            'items',
        ]
        read_only_fields = [
            'numero_pedido',
            'subtotal',
            'total',
            'pagado',
            'fecha_pago',
            'created_at',
            'items',
            'usuario',
            'usuario_email',
            'usuario_nombre',
            'usuario_telefono',
            'usuario_nivel_acceso',
            'comprador_nombre',
            'comprador_email',
            'comprador_telefono',
            'comprador_nivel_acceso',
        ]
