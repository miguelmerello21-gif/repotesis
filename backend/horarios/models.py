from django.db import models
from django.conf import settings
from equipos.models import Equipo
from atletas.models import Atleta


class Horario(models.Model):
    DIAS_SEMANA = [
        (0, 'Domingo'), (1, 'Lunes'), (2, 'Martes'), (3, 'Miercoles'), (4, 'Jueves'), (5, 'Viernes'), (6, 'Sabado')
    ]
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='horarios')
    entrenador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='horarios')
    fecha = models.DateField(null=True, blank=True)
    dia_semana = models.IntegerField(choices=DIAS_SEMANA)
    hora_inicio = models.TimeField()
    hora_termino = models.TimeField()
    lugar = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default='#FCD34D')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['fecha', 'dia_semana', 'hora_inicio']

    def __str__(self):
        fecha_txt = self.fecha.isoformat() if self.fecha else self.get_dia_semana_display()
        return f"{self.equipo.nombre} - {fecha_txt} {self.hora_inicio}-{self.hora_termino}"


class Asistencia(models.Model):
    METODOS = [('manual', 'Manual'), ('qr', 'QR')]
    horario = models.ForeignKey(Horario, on_delete=models.CASCADE, related_name='asistencias')
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField()
    presente = models.BooleanField()
    metodo = models.CharField(max_length=20, choices=METODOS, default='manual')
    hora_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ['horario', 'atleta', 'fecha']
        ordering = ['-fecha']

    def __str__(self):
        estado = 'Presente' if self.presente else 'Ausente'
        return f"{self.atleta.nombre_completo} - {self.fecha} - {estado}"
