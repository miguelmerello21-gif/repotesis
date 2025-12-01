from django.db import models


class Egreso(models.Model):
    CATEGORIAS = [
        ('arriendo', 'Arriendo'),
        ('materiales', 'Materiales'),
        ('uniformes', 'Uniformes'),
        ('servicios', 'Servicios'),
        ('personal', 'Personal'),
        ('otros', 'Otros'),
    ]
    concepto = models.CharField(max_length=255)
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateField()
    responsable = models.CharField(max_length=255, blank=True)
    descripcion = models.TextField(blank=True)
    comprobante = models.FileField(upload_to='egresos/comprobantes/', null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, default='efectivo')
    proveedor = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.concepto} - ${self.monto}"
