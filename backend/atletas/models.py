from django.db import models
from django.conf import settings
from equipos.models import Equipo


class Atleta(models.Model):
    DIVISIONES = [
        ('Tiny', 'Tiny'), ('Mini', 'Mini'), ('Youth', 'Youth'), ('Junior', 'Junior'), ('Senior', 'Senior'), ('Open', 'Open')
    ]
    CATEGORIAS = [('recreativo', 'Recreativo'), ('novice', 'Novice'), ('prep', 'Prep'), ('elite', 'Elite')]

    apoderado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='atletas')
    equipo = models.ForeignKey(Equipo, on_delete=models.SET_NULL, null=True, blank=True, related_name='atletas')

    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    rut = models.CharField(max_length=12, unique=True)
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=20, blank=True)

    division = models.CharField(max_length=20)
    categoria = models.CharField(max_length=20)
    nivel = models.IntegerField()

    telefono_contacto = models.CharField(max_length=20, blank=True)
    email_contacto = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    contacto_emergencia = models.CharField(max_length=255, blank=True)
    telefono_emergencia = models.CharField(max_length=20, blank=True)

    alergias = models.TextField(blank=True)
    condiciones_medicas = models.TextField(blank=True)
    medicamentos = models.TextField(blank=True)
    restricciones_fisicas = models.TextField(blank=True)

    activo = models.BooleanField(default=True)
    fecha_ingreso = models.DateField(auto_now_add=True)
    fecha_retiro = models.DateField(null=True, blank=True)
    motivo_retiro = models.TextField(blank=True)

    notas = models.TextField(blank=True)
    asistencia = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    historial_deportivo = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})"

    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"


class CertificacionAtleta(models.Model):
    TIPOS = [
        ('medico', 'Médico'), ('escolar', 'Escolar'), ('nacimiento', 'Nacimiento'), ('otro', 'Otro')
    ]
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    ]
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='certificaciones')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    nombre = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='certificaciones/atletas/')
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    notas = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    comentario_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_emision']

    def __str__(self):
        return f"{self.atleta.nombre_completo} - {self.get_tipo_display()}"
