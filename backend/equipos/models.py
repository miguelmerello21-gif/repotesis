from django.db import models
from django.conf import settings


class Equipo(models.Model):
    division = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    nivel = models.IntegerField()

    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True)

    entrenadores = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='equipos_asignados', blank=True)

    capacidad_minima = models.IntegerField(default=5)
    capacidad_maxima = models.IntegerField(default=35)
    cupos_disponibles = models.IntegerField(default=35)

    activo = models.BooleanField(default=True)
    color = models.CharField(max_length=7, default='#FCD34D')
    logo = models.ImageField(upload_to='equipos/logos/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nivel', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.division} - {self.categoria} - Nivel {self.nivel})"

    @property
    def cantidad_atletas(self):
        return self.atletas.filter(activo=True).count() if hasattr(self, 'atletas') else 0

    def actualizar_cupos(self):
        self.cupos_disponibles = self.capacidad_maxima - self.cantidad_atletas
        self.save(update_fields=['cupos_disponibles'])
