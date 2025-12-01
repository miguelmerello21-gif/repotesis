from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notificacion

User = get_user_model()


class NotificacionSerializer(serializers.ModelSerializer):
    destinatarios_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, required=False)
    no_leidas = serializers.SerializerMethodField()

    class Meta:
        model = Notificacion
        fields = [
            'id', 'tipo', 'titulo', 'mensaje', 'prioridad', 'destinatarios', 'destinatarios_ids', 'canales',
            'estado', 'fecha_envio', 'creado_por', 'created_at', 'no_leidas'
        ]
        read_only_fields = ['destinatarios', 'creado_por', 'created_at', 'no_leidas']

    def get_no_leidas(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return not obj.leida_por.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        destinatarios_ids = validated_data.pop('destinatarios_ids', [])
        # `creado_por` lo inyecta la vista via serializer.save(creado_por=request.user)
        noti = Notificacion.objects.create(**validated_data)
        if destinatarios_ids:
            noti.destinatarios.set(destinatarios_ids)
        return noti
