from django.db import models
from django.conf import settings
from atletas.models import Atleta


class PeriodoMatricula(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
        ('programado', 'Programado'),
    ]
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateField()
    fecha_termino = models.DateField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_hermanos = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programado')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - {self.get_estado_display()}"


class Matricula(models.Model):
    ESTADOS_PAGO = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('parcial', 'Pago Parcial'),
        ('vencido', 'Vencido'),
    ]
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='matriculas')
    periodo = models.ForeignKey(PeriodoMatricula, on_delete=models.CASCADE, related_name='matriculas')
    apoderado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matriculas')

    monto_original = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    estado_pago = models.CharField(max_length=20, choices=ESTADOS_PAGO, default='pendiente')
    metodo_pago = models.CharField(max_length=50, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/matriculas/', null=True, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Matrícula {self.atleta.nombre_completo} - {self.periodo.nombre}"


class ConfiguracionMensualidad(models.Model):
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    dia_vencimiento = models.IntegerField(default=5)
    recargo_por_atraso = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento_hermanos = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración de Mensualidad'
        verbose_name_plural = 'Configuraciones de Mensualidad'

    def __str__(self):
        return f"Config mensualidad #{self.id}"


class Mensualidad(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('vencido', 'Vencido'),
        ('condonado', 'Condonado'),
    ]
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='mensualidades')
    apoderado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mensualidades')
    mes = models.IntegerField()
    anio = models.IntegerField()
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    recargo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_vencimiento = models.DateField()
    fecha_pago = models.DateTimeField(null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/mensualidades/', null=True, blank=True)
    notas = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['atleta', 'mes', 'anio']
        ordering = ['-anio', '-mes']

    def __str__(self):
        return f"Mensualidad {self.mes}/{self.anio} - {self.atleta.nombre_completo}"


class PagoManual(models.Model):
    TIPOS = [
        ('matricula', 'Matrícula'),
        ('mensualidad', 'Mensualidad'),
        ('otro', 'Otro'),
    ]
    apoderado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pagos_manuales')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    concepto = models.CharField(max_length=255)
    metodo_pago = models.CharField(max_length=50)
    comprobante = models.FileField(upload_to='comprobantes/manuales/', null=True, blank=True)
    matricula = models.ForeignKey(Matricula, on_delete=models.SET_NULL, null=True, blank=True)
    mensualidad = models.ForeignKey(Mensualidad, on_delete=models.SET_NULL, null=True, blank=True)
    registrado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='pagos_registrados')
    notas = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago Manual - {self.apoderado.name} - ${self.monto}"


class WebpayTransaction(models.Model):
    ESTADOS = [
        ('iniciada', 'Iniciada'),
        ('confirmada', 'Confirmada'),
        ('rechazada', 'Rechazada'),
    ]
    matricula = models.ForeignKey(Matricula, on_delete=models.CASCADE, related_name='webpay_transacciones')
    token = models.CharField(max_length=255, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='iniciada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Webpay {self.matricula_id} - {self.estado}"


class PagoOnline(models.Model):
    TIPOS = [
        ('mensualidad', 'Mensualidad'),
        ('competencia', 'Competencia'),
        ('musica', 'Musica'),
        ('otro', 'Otro'),
    ]
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='otro')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.titulo


class PagoOnlineObligacion(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('vencido', 'Vencido'),
    ]
    pago = models.ForeignKey(PagoOnline, on_delete=models.CASCADE, related_name='obligaciones')
    apoderado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pagos_online')
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='pagos_online')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    metodo_pago = models.CharField(max_length=50, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/pagos_online/', null=True, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['pago', 'apoderado', 'atleta']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.pago.titulo} - {self.atleta.nombre_completo} ({self.estado})"


class WebpayPagoOnlineTransaction(models.Model):
    ESTADOS = [
        ('iniciada', 'Iniciada'),
        ('confirmada', 'Confirmada'),
        ('rechazada', 'Rechazada'),
    ]
    obligacion = models.ForeignKey(PagoOnlineObligacion, on_delete=models.CASCADE, related_name='webpay_transacciones')
    token = models.CharField(max_length=255, unique=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='iniciada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Webpay PagoOnline {self.obligacion_id} - {self.estado}"


class PaymentCard(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_cards')
    alias = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=50, blank=True)
    last4 = models.CharField(max_length=4, blank=True)
    token = models.CharField(max_length=255)
    is_default = models.BooleanField(default=True)
    autopay_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.brand} ****{self.last4} ({'auto' if self.autopay_enabled else 'manual'})"
