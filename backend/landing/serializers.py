from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DatosLanding, FotoCarrusel, EventoLanding

User = get_user_model()


class FotoCarruselSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoCarrusel
        fields = ['id', 'imagen', 'titulo', 'descripcion', 'orden', 'activa']


class EventoLandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventoLanding
        fields = ['id', 'fecha', 'nombre', 'descripcion', 'visible']


class DatosLandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatosLanding
        fields = [
            'titulo_principal',
            'subtitulo',
            'descripcion_hero',
            'imagen_hero',
            'titulo_about',
            'descripcion_about',
            'mision',
            'vision',
            'membresias',
            'proximos_eventos',
            'carousel_imagenes',
            'total_atletas',
            'total_entrenadores',
            'total_competencias',
            'anos_experiencia',
            'horario_lunes_viernes',
            'horario_sabado',
            'horario_domingo',
            'instagram_url',
            'facebook_url',
            'youtube_url',
            'tiktok_url',
            'email_contacto',
            'telefono_contacto',
            'direccion',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
