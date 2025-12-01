from django.db import models
from django.conf import settings


class DatosLanding(models.Model):
    titulo_principal = models.CharField(max_length=255, default="Reign All Stars")
    subtitulo = models.CharField(max_length=255, default="La Colmena")
    descripcion_hero = models.TextField(blank=True)
    imagen_hero = models.ImageField(upload_to='landing/', null=True, blank=True)

    titulo_about = models.CharField(max_length=255, blank=True)
    descripcion_about = models.TextField(blank=True)
    mision = models.TextField(blank=True)
    vision = models.TextField(blank=True)

    # Bloques dinámicos que utiliza el frontend
    membresias = models.JSONField(default=list, blank=True)
    proximos_eventos = models.JSONField(default=list, blank=True)
    carousel_imagenes = models.JSONField(default=list, blank=True)

    total_atletas = models.IntegerField(default=0)
    total_entrenadores = models.IntegerField(default=0)
    total_competencias = models.IntegerField(default=0)
    anos_experiencia = models.IntegerField(default=0)

    horario_lunes_viernes = models.CharField(max_length=100, blank=True, default='')
    horario_sabado = models.CharField(max_length=100, blank=True, default='')
    horario_domingo = models.CharField(max_length=100, blank=True, default='')

    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)

    email_contacto = models.EmailField(blank=True)
    telefono_contacto = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        # Forzamos singleton para que siempre exista un registro único
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = 'Datos del Landing'
        verbose_name_plural = 'Datos del Landing'

    def __str__(self):
        return self.titulo_principal


class FotoCarrusel(models.Model):
    imagen = models.ImageField(upload_to='carrusel/')
    titulo = models.CharField(max_length=255, blank=True)
    descripcion = models.TextField(blank=True)
    orden = models.IntegerField(default=0)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['orden']

    def __str__(self):
        return self.titulo or f"Foto {self.id}"


class EventoLanding(models.Model):
    fecha = models.DateField()
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    visible = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
