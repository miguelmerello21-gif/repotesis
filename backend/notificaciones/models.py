from django.db import models
from django.conf import settings


class Notificacion(models.Model):
    TIPOS = [
        ('general', 'General'),
        ('pago', 'Pago'),
        ('horario', 'Horario'),
        ('evento', 'Evento'),
        ('urgente', 'Urgente'),
    ]
    PRIORIDADES = [('baja', 'Baja'), ('media', 'Media'), ('alta', 'Alta')]

    tipo = models.CharField(max_length=20, choices=TIPOS)
    titulo = models.CharField(max_length=255)
    mensaje = models.TextField()
    prioridad = models.CharField(max_length=20, choices=PRIORIDADES, default='media')

    destinatarios = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='notificaciones_recibidas')
    canales = models.JSONField(default=list, blank=True)

    estado = models.CharField(max_length=20, choices=[('borrador', 'Borrador'), ('enviada', 'Enviada'), ('programada', 'Programada')], default='borrador')
    leida_por = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='notificaciones_leidas', blank=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='notificaciones_creadas')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titulo} ({self.tipo})"
