from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class CustomRole(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Rol Personalizado"
        verbose_name_plural = "Roles Personalizados"

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("public", "Público"),
        ("apoderado", "Apoderado"),
        ("entrenador", "Entrenador"),
        ("admin", "Administrador"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="public")

    rut = models.CharField(max_length=20, blank=True)
    direccion = models.TextField(blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    ocupacion = models.CharField(max_length=100, blank=True)
    emergency_contact = models.CharField(max_length=255, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)

    custom_role = models.ForeignKey(CustomRole, on_delete=models.SET_NULL, null=True, blank=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.name} ({self.email})"


class PasswordReset(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=10)
    used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reset de contraseña"
        verbose_name_plural = "Resets de contraseña"

    def is_valid(self):
        return (not self.used) and timezone.now() < self.expires_at

    def __str__(self):
        return f"Reset {self.email} - {self.code}"


class CertificacionEntrenador(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    ]
    entrenador = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='certificaciones')
    nombre = models.CharField(max_length=255)
    institucion = models.CharField(max_length=255)
    fecha_obtencion = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    archivo = models.FileField(upload_to='certificaciones/', null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    comentario_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Certificación de Entrenador"
        verbose_name_plural = "Certificaciones de Entrenador"

    def __str__(self):
        return f"{self.nombre} - {self.entrenador.name if self.entrenador else ''}"
