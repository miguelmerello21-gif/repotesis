from django.contrib import admin
from .models import Egreso


@admin.register(Egreso)
class EgresoAdmin(admin.ModelAdmin):
    list_display = ('concepto', 'categoria', 'monto', 'fecha', 'responsable', 'metodo_pago', 'proveedor', 'created_at')
    list_filter = ('categoria', 'metodo_pago', 'fecha', 'created_at')
    search_fields = ('concepto', 'responsable', 'proveedor')
