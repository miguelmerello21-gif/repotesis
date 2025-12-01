from rest_framework import serializers
from .models import Egreso


class EgresoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Egreso
        fields = ['id', 'concepto', 'categoria', 'monto', 'fecha', 'responsable', 'descripcion', 'comprobante', 'metodo_pago', 'proveedor', 'created_at']
        read_only_fields = ['created_at']
