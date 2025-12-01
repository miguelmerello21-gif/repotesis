from django.contrib import admin
from .models import Producto, VarianteProducto, Carrito, ItemCarrito, Pedido, ItemPedido


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "categoria",
        "nivel_acceso",
        "precio",
        "stock",
        "stock_minimo",
        "activo",
    )
    list_filter = ("categoria", "nivel_acceso", "activo", "destacado")
    search_fields = ("nombre", "descripcion", "slug")
    prepopulated_fields = {"slug": ("nombre",)}

admin.site.register(VarianteProducto)
admin.site.register(Carrito)
admin.site.register(ItemCarrito)


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = (
        "numero_pedido",
        "usuario",
        "comprador_nombre",
        "comprador_email",
        "estado",
        "total",
        "pagado",
        "created_at",
    )
    readonly_fields = (
        "usuario",
        "comprador_nombre",
        "comprador_email",
        "comprador_telefono",
        "comprador_nivel_acceso",
        "numero_pedido",
        "subtotal",
        "costo_envio",
        "total",
        "pagado",
        "fecha_pago",
        "created_at",
        "updated_at",
    )
    fields = (
        "usuario",
        "comprador_nombre",
        "comprador_email",
        "comprador_telefono",
        "comprador_nivel_acceso",
        "numero_pedido",
        "estado",
        "subtotal",
        "costo_envio",
        "total",
        "metodo_pago",
        "comprobante_pago",
        "pagado",
        "fecha_pago",
        "metodo_entrega",
        "direccion_entrega",
        "fecha_entrega",
        "notas_cliente",
        "notas_admin",
        "created_at",
        "updated_at",
    )


admin.site.register(ItemPedido)
