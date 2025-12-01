from decimal import Decimal
from rest_framework import serializers
from .models import Horario, Asistencia
from equipos.models import Equipo
from atletas.models import Atleta


class HorarioSerializer(serializers.ModelSerializer):
    equipo_nombre = serializers.CharField(source='equipo.nombre', read_only=True)
    entrenador_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Horario
        fields = [
            'id',
            'equipo',
            'equipo_nombre',
            'entrenador',
            'entrenador_nombre',
            'fecha',
            'dia_semana',
            'hora_inicio',
            'hora_termino',
            'lugar',
            'color',
            'activo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_entrenador_nombre(self, obj):
        ent = obj.entrenador
        if not ent:
            return None
        return getattr(ent, 'name', None) or getattr(ent, 'email', None) or f"Entrenador {ent.id}"


class AsistenciaSerializer(serializers.ModelSerializer):
    atleta_nombre = serializers.CharField(source='atleta.nombre_completo', read_only=True)

    class Meta:
        model = Asistencia
        fields = ['id', 'horario', 'atleta', 'atleta_nombre', 'fecha', 'presente', 'metodo', 'hora_registro']
        read_only_fields = ['hora_registro']

    def validate(self, attrs):
        horario = attrs.get('horario') or self.instance.horario if self.instance else None
        if horario is None and self.context.get('horario'):
            horario = self.context.get('horario')
        atleta = attrs.get('atleta') or self.instance.atleta
        fecha = attrs.get('fecha') or self.instance.fecha
        if Asistencia.objects.filter(horario=horario, atleta=atleta, fecha=fecha).exclude(pk=getattr(self.instance, 'pk', None)).exists():
            raise serializers.ValidationError('Asistencia duplicada para este atleta y fecha')
        return attrs

    def create(self, validated_data):
        asistencia = super().create(validated_data)
        if asistencia.presente:
            try:
                atleta = asistencia.atleta
                incremento = Decimal('3.0')
                nuevo_valor = (Decimal(atleta.asistencia or 0) + incremento).quantize(Decimal('0.01'))
                if nuevo_valor > Decimal('100'):
                    nuevo_valor = Decimal('100')
                atleta.asistencia = nuevo_valor
                atleta.save(update_fields=['asistencia'])
            except Exception:
                pass  # No interrumpir el flujo si falla la actualización
        return asistencia
