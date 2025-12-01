from django.db import models
from django.conf import settings


class Producto(models.Model):
    CATEGORIAS = [
        ('ropa', 'Ropa'),
        ('accesorios', 'Accesorios'),
        ('equipamiento', 'Equipamiento'),
        ('otro', 'Otro'),
    ]
    NIVELES_ACCESO = [('publico', 'Público'), ('exclusivo', 'Exclusivo')]

    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    nivel_acceso = models.CharField(max_length=20, choices=NIVELES_ACCESO, default='publico')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    en_oferta = models.BooleanField(default=False)
    stock = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5)
    tiene_variantes = models.BooleanField(default=False)
    imagen_principal = models.ImageField(upload_to='productos/', null=True, blank=True)
    imagen_2 = models.ImageField(upload_to='productos/', null=True, blank=True)
    imagen_3 = models.ImageField(upload_to='productos/', null=True, blank=True)
    activo = models.BooleanField(default=True)
    destacado = models.BooleanField(default=False)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-destacado', 'nombre']

    def __str__(self):
        return self.nombre

    @property
    def precio_actual(self):
        return self.precio_oferta if self.en_oferta and self.precio_oferta else self.precio


class VarianteProducto(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='variantes')
    nombre = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    precio_adicional = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.producto.nombre} - {self.nombre}"


class Carrito(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carrito')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrito de {self.usuario.email}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def cantidad_items(self):
        return sum(item.cantidad for item in self.items.all())


class ItemCarrito(models.Model):
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    variante = models.ForeignKey(VarianteProducto, on_delete=models.CASCADE, null=True, blank=True)
    cantidad = models.IntegerField(default=1)

    class Meta:
        unique_together = ['carrito', 'producto', 'variante']

    @property
    def subtotal(self):
        precio_base = self.producto.precio_actual
        precio_variante = self.variante.precio_adicional if self.variante else 0
        return (precio_base + precio_variante) * self.cantidad

    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"


class Pedido(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('preparando', 'Preparando'),
        ('listo', 'Listo para Entregar'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    METODOS_PAGO = [('transferencia', 'Transferencia'), ('efectivo', 'Efectivo'), ('tarjeta', 'Tarjeta')]
    METODOS_ENTREGA = [('retiro', 'Retiro en Club'), ('envio', 'Envío a Domicilio')]

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pedidos')
    comprador_nombre = models.CharField(max_length=255, blank=True)
    comprador_email = models.EmailField(blank=True)
    comprador_telefono = models.CharField(max_length=50, blank=True)
    comprador_nivel_acceso = models.CharField(max_length=20, blank=True)
    numero_pedido = models.CharField(max_length=50, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    costo_envio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO)
    comprobante_pago = models.FileField(upload_to='comprobantes/pedidos/', null=True, blank=True)
    pagado = models.BooleanField(default=False)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    metodo_entrega = models.CharField(max_length=20, choices=METODOS_ENTREGA)
    direccion_entrega = models.TextField(blank=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    notas_cliente = models.TextField(blank=True)
    notas_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido {self.numero_pedido} - {self.usuario.email}"

    def save(self, *args, **kwargs):
        """
        Asegura que los campos de comprador se completen automáticamente
        con los datos actuales del usuario al crear o cuando falten.
        """
        if self.usuario:
            self.comprador_nombre = self.comprador_nombre or getattr(self.usuario, "name", "") or ""
            self.comprador_email = self.comprador_email or getattr(self.usuario, "email", "") or ""
            self.comprador_telefono = self.comprador_telefono or getattr(self.usuario, "phone", "") or ""
            self.comprador_nivel_acceso = self.comprador_nivel_acceso or getattr(self.usuario, "role", "") or ""
        super().save(*args, **kwargs)


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto_nombre = models.CharField(max_length=255)
    variante_nombre = models.CharField(max_length=100, blank=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.cantidad}x {self.producto_nombre}"


class WebpayPedidoTransaction(models.Model):
    ESTADOS = [
        ('iniciada', 'Iniciada'),
        ('confirmada', 'Confirmada'),
        ('rechazada', 'Rechazada'),
    ]
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='webpay_transacciones')
    token = models.CharField(max_length=255, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='iniciada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Webpay Pedido {self.pedido_id} - {self.estado}"
