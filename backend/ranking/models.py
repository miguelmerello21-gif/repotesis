from django.db import models
from django.conf import settings
from atletas.models import Atleta


class RankingAtleta(models.Model):
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='ranking')
    posicion = models.IntegerField()
    posicion_anterior = models.IntegerField(null=True, blank=True)
    puntos_totales = models.IntegerField(default=0)
    puntos_mes = models.IntegerField(default=0)
    entrenamientos_asistidos = models.IntegerField(default=0)
    entrenamientos_totales = models.IntegerField(default=0)
    porcentaje_asistencia = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    competencias_participadas = models.IntegerField(default=0)
    medallas_oro = models.IntegerField(default=0)
    medallas_plata = models.IntegerField(default=0)
    medallas_bronce = models.IntegerField(default=0)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['posicion']

    def __str__(self):
        return f"#{self.posicion} - {self.atleta.nombre_completo}"

    @property
    def tendencia(self):
        if not self.posicion_anterior:
            return 'nuevo'
        if self.posicion < self.posicion_anterior:
            return 'subiendo'
        elif self.posicion > self.posicion_anterior:
            return 'bajando'
        return 'igual'


class LogroAtleta(models.Model):
    TIPOS = [
        ('competencia', 'Competencia'),
        ('entrenamiento', 'Entrenamiento'),
        ('actitud', 'Actitud'),
        ('otro', 'Otro'),
    ]
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='logros')
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    puntos = models.PositiveIntegerField(default=0)
    tipo = models.CharField(max_length=30, choices=TIPOS, default='competencia')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.atleta.nombre_completo} - {self.titulo} ({self.puntos} pts)"


class EvaluacionAtleta(models.Model):
    CATEGORIAS = [
        ('tecnica', 'Tecnica'),
        ('actitud', 'Actitud'),
        ('esfuerzo', 'Esfuerzo'),
        ('liderazgo', 'Liderazgo'),
    ]
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='evaluaciones')
    evaluador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    categoria = models.CharField(max_length=30, choices=CATEGORIAS, default='tecnica')
    puntuacion = models.PositiveIntegerField(default=1)
    comentarios = models.TextField(blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.atleta.nombre_completo} - {self.categoria} ({self.puntuacion})"
