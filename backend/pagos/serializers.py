from rest_framework import serializers
from django.contrib.auth import get_user_model
from atletas.serializers import AtletaSerializer
from atletas.models import Atleta
from .models import (
    PeriodoMatricula, Matricula, ConfiguracionMensualidad, Mensualidad, PagoManual, WebpayTransaction,
    PagoOnline, PagoOnlineObligacion, WebpayPagoOnlineTransaction, PaymentCard
)

User = get_user_model()


class PeriodoMatriculaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoMatricula
        fields = '__all__'


class MatriculaSerializer(serializers.ModelSerializer):
    atleta = serializers.PrimaryKeyRelatedField(queryset=Atleta.objects.all())
    periodo = serializers.PrimaryKeyRelatedField(queryset=PeriodoMatricula.objects.all())
    apoderado = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Matricula
        fields = [
            'id', 'atleta', 'periodo', 'apoderado', 'monto_original', 'descuento_aplicado',
            'monto_total', 'monto_pagado', 'estado_pago', 'metodo_pago', 'comprobante', 'fecha_pago',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['apoderado'] = self.context['request'].user
        return super().create(validated_data)


class ConfiguracionMensualidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionMensualidad
        fields = '__all__'


class MensualidadSerializer(serializers.ModelSerializer):
    atleta = serializers.PrimaryKeyRelatedField(queryset=Atleta.objects.all())
    apoderado = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Mensualidad
        fields = [
            'id', 'atleta', 'apoderado', 'mes', 'anio', 'monto_base', 'descuento', 'recargo', 'monto_total',
            'estado', 'fecha_vencimiento', 'fecha_pago', 'metodo_pago', 'comprobante', 'notas', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['apoderado'] = self.context['request'].user
        return super().create(validated_data)


class PagoManualSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoManual
        fields = '__all__'
        read_only_fields = ['registrado_por', 'created_at']

    def create(self, validated_data):
        validated_data['registrado_por'] = self.context['request'].user
        return super().create(validated_data)


class WebpayTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebpayTransaction
        fields = ['id', 'matricula', 'token', 'estado', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PagoOnlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoOnline
        fields = ['id', 'titulo', 'descripcion', 'monto', 'activo', 'fecha_vencimiento', 'tipo', 'created_at']
        read_only_fields = ['created_at']


class PagoOnlineObligacionSerializer(serializers.ModelSerializer):
    pago_titulo = serializers.CharField(source='pago.titulo', read_only=True)
    pago_fecha_vencimiento = serializers.DateField(source='pago.fecha_vencimiento', read_only=True)
    atleta_nombre = serializers.CharField(source='atleta.nombre_completo', read_only=True)
    apoderado_email = serializers.EmailField(source='apoderado.email', read_only=True)

    class Meta:
        model = PagoOnlineObligacion
        fields = [
            'id', 'pago', 'pago_titulo', 'pago_fecha_vencimiento', 'apoderado', 'apoderado_email',
            'atleta', 'atleta_nombre', 'monto', 'estado', 'metodo_pago', 'comprobante',
            'fecha_pago', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'apoderado', 'estado', 'monto', 'pago', 'atleta']


class WebpayPagoOnlineTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebpayPagoOnlineTransaction
        fields = ['id', 'obligacion', 'token', 'estado', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PaymentCardSerializer(serializers.ModelSerializer):
    is_default = serializers.BooleanField(required=False)
    autopay_enabled = serializers.BooleanField(required=False)

    class Meta:
        model = PaymentCard
        fields = ['id', 'alias', 'brand', 'last4', 'token', 'is_default', 'autopay_enabled', 'created_at']
        read_only_fields = ['created_at']
