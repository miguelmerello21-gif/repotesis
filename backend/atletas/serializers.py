from rest_framework import serializers
from django.contrib.auth import get_user_model
from equipos.models import Equipo
from .models import Atleta, CertificacionAtleta

User = get_user_model()


class ApoderadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'phone']


class EquipoLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipo
        fields = ['id', 'nombre', 'division', 'categoria', 'nivel']


class CertificacionAtletaSerializer(serializers.ModelSerializer):
    archivo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CertificacionAtleta
        fields = [
            'id',
            'tipo',
            'nombre',
            'archivo',
            'archivo_url',
            'fecha_emision',
            'fecha_vencimiento',
            'notas',
            'estado',
            'comentario_admin',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def get_archivo_url(self, obj):
        request = self.context.get('request')
        if obj.archivo and hasattr(obj.archivo, 'url'):
            url = obj.archivo.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None


class AtletaSerializer(serializers.ModelSerializer):
    apoderado = ApoderadoSerializer(read_only=True)
    apoderado_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='apoderado',
        write_only=True,
        required=False,
        allow_null=True,
    )
    equipo = EquipoLiteSerializer(read_only=True)
    equipo_id = serializers.PrimaryKeyRelatedField(queryset=Equipo.objects.all(), source='equipo', write_only=True, required=False, allow_null=True)
    equipo_nombre = serializers.CharField(source='equipo.nombre', read_only=True)
    entrenadores_equipo = serializers.SerializerMethodField()

    class Meta:
        model = Atleta
        fields = [
            'id', 'apoderado', 'apoderado_id', 'equipo', 'equipo_id', 'nombres', 'apellidos', 'rut', 'fecha_nacimiento', 'genero',
            'division', 'categoria', 'nivel', 'telefono_contacto', 'email_contacto', 'direccion',
            'contacto_emergencia', 'telefono_emergencia', 'alergias', 'condiciones_medicas', 'medicamentos',
            'restricciones_fisicas', 'activo', 'fecha_ingreso', 'fecha_retiro', 'motivo_retiro', 'notas',
            'asistencia', 'historial_deportivo', 'created_at', 'updated_at',
            'equipo_nombre', 'entrenadores_equipo'
        ]
        read_only_fields = ['fecha_ingreso', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context.get('request')
        # Solo admin puede forzar un apoderado distinto; el resto se fuerza al usuario autenticado
        apoderado = validated_data.get('apoderado')
        if not getattr(request.user, 'role', '') == 'admin':
            apoderado = request.user
        validated_data['apoderado'] = apoderado or request.user
        return super().create(validated_data)

    def get_entrenadores_equipo(self, obj):
        if obj.equipo and hasattr(obj.equipo, 'entrenadores'):
            return [ent.name or ent.email for ent in obj.equipo.entrenadores.all()]
        return []


class FichaAtletaSerializer(AtletaSerializer):
    certificaciones = CertificacionAtletaSerializer(many=True, read_only=True)

    class Meta(AtletaSerializer.Meta):
        fields = AtletaSerializer.Meta.fields + ['certificaciones']
