from rest_framework import serializers
from .models import Equipo
from django.contrib.auth import get_user_model

User = get_user_model()


class EntrenadorLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']


class EquipoSerializer(serializers.ModelSerializer):
    entrenadores = EntrenadorLiteSerializer(many=True, read_only=True)

    class Meta:
        model = Equipo
        fields = [
            'id', 'nombre', 'descripcion', 'division', 'categoria', 'nivel',
            'capacidad_minima', 'capacidad_maxima', 'cupos_disponibles',
            'activo', 'color', 'logo', 'entrenadores', 'created_at', 'updated_at'
        ]
        read_only_fields = ['cupos_disponibles', 'created_at', 'updated_at']


class EquipoWriteSerializer(serializers.ModelSerializer):
    entrenadores_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.filter(role='entrenador'), write_only=True, required=False
    )

    class Meta:
        model = Equipo
        fields = [
            'id', 'nombre', 'descripcion', 'division', 'categoria', 'nivel',
            'capacidad_minima', 'capacidad_maxima', 'cupos_disponibles',
            'activo', 'color', 'logo', 'entrenadores_ids'
        ]

    def create(self, validated_data):
        entrenadores = validated_data.pop('entrenadores_ids', [])
        equipo = super().create(validated_data)
        if entrenadores:
            equipo.entrenadores.set(entrenadores)
        return equipo

    def update(self, instance, validated_data):
        entrenadores = validated_data.pop('entrenadores_ids', None)
        equipo = super().update(instance, validated_data)
        if entrenadores is not None:
            equipo.entrenadores.set(entrenadores)
        return equipo
