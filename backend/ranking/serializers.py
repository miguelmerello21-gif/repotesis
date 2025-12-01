from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RankingAtleta, LogroAtleta, EvaluacionAtleta

User = get_user_model()


class RankingAtletaSerializer(serializers.ModelSerializer):
  atleta_nombre = serializers.CharField(source='atleta.nombre_completo', read_only=True)
  tendencia = serializers.CharField(read_only=True)
  equipo_nombre = serializers.CharField(source='atleta.equipo.nombre', read_only=True)

  class Meta:
      model = RankingAtleta
      fields = [
          'id', 'atleta', 'atleta_nombre', 'posicion', 'posicion_anterior', 'puntos_totales', 'puntos_mes',
          'entrenamientos_asistidos', 'entrenamientos_totales', 'porcentaje_asistencia', 'competencias_participadas',
          'medallas_oro', 'medallas_plata', 'medallas_bronce', 'ultima_actualizacion', 'tendencia', 'equipo_nombre'
      ]


class LogroAtletaSerializer(serializers.ModelSerializer):
  atleta_nombre = serializers.CharField(source='atleta.nombre_completo', read_only=True)

  class Meta:
      model = LogroAtleta
      fields = ['id', 'atleta', 'atleta_nombre', 'titulo', 'descripcion', 'puntos', 'tipo', 'fecha']
      read_only_fields = ['fecha']


class EvaluacionAtletaSerializer(serializers.ModelSerializer):
  atleta_nombre = serializers.CharField(source='atleta.nombre_completo', read_only=True)
  evaluador_nombre = serializers.CharField(source='evaluador.name', read_only=True)

  class Meta:
      model = EvaluacionAtleta
      fields = [
          'id', 'atleta', 'atleta_nombre', 'evaluador', 'evaluador_nombre',
          'categoria', 'puntuacion', 'comentarios', 'fecha'
      ]
      read_only_fields = ['evaluador', 'fecha']

  def create(self, validated_data):
      request = self.context.get('request')
      if request and request.user and request.user.is_authenticated:
          validated_data['evaluador'] = request.user
      return super().create(validated_data)
