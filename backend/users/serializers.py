from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomRole, CertificacionEntrenador

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    fechaNacimiento = serializers.DateField(source="fecha_nacimiento", allow_null=True, required=False)
    emergencyContact = serializers.CharField(source="emergency_contact", allow_blank=True, required=False)
    emergencyPhone = serializers.CharField(source="emergency_phone", allow_blank=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    customRole = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "role",
            "phone",
            "rut",
            "direccion",
            "fechaNacimiento",
            "ocupacion",
            "emergencyContact",
            "emergencyPhone",
            "createdAt",
            "customRole",
        ]
        read_only_fields = ["email", "role"]

    def get_customRole(self, obj):
        return obj.custom_role.name if obj.custom_role else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    fechaNacimiento = serializers.DateField(source="fecha_nacimiento", allow_null=True, required=False)
    emergencyContact = serializers.CharField(source="emergency_contact", allow_blank=True, required=False)
    emergencyPhone = serializers.CharField(source="emergency_phone", allow_blank=True, required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "name",
            "password",
            "phone",
            "rut",
            "direccion",
            "fechaNacimiento",
            "ocupacion",
            "emergencyContact",
            "emergencyPhone",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.setdefault("role", "public")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class CertificacionEntrenadorSerializer(serializers.ModelSerializer):
    entrenador_nombre = serializers.CharField(source="entrenador.name", read_only=True)
    entrenador_email = serializers.EmailField(source="entrenador.email", read_only=True)
    archivo_url = serializers.SerializerMethodField()

    class Meta:
        model = CertificacionEntrenador
        fields = [
            "id",
            "entrenador",
            "entrenador_nombre",
            "entrenador_email",
            "nombre",
            "institucion",
            "fecha_obtencion",
            "fecha_vencimiento",
            "descripcion",
            "archivo",
            "archivo_url",
            "estado",
            "comentario_admin",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_archivo_url(self, obj):
        request = self.context.get("request")
        if obj.archivo and hasattr(obj.archivo, "url"):
            return request.build_absolute_uri(obj.archivo.url) if request else obj.archivo.url
        return None
