# 🎯 Especificación Completa del Backend - Reign All Stars

## 📋 Propósito de este Documento

Este documento está diseñado para ser analizado por **Codex/Claude** u otro AI assistant para generar automáticamente la estructura completa del backend en **Django REST Framework**.

---

## 🏗️ Arquitectura General

### Stack Tecnológico
- **Framework**: Django 4.2+
- **API**: Django REST Framework 3.14+
- **Autenticación**: Django SimpleJWT
- **Base de Datos**: PostgreSQL (recomendado) o MySQL
- **CORS**: django-cors-headers

### Aplicaciones Django Requeridas

```
backend/
├── config/              # Configuración principal del proyecto
├── users/               # Usuarios y autenticación
├── atletas/             # Atletas, equipos, certificaciones
├── pagos/               # Matrículas, mensualidades, deudas
├── tienda/              # Productos, carrito, pedidos
├── horarios/            # Horarios de entrenamiento, asistencia
├── notificaciones/      # Sistema de notificaciones
├── ranking/             # Ranking de atletas
└── landing/             # Gestión de contenido del landing
```

---

## 📊 Modelos de Datos Detallados

### 1. App: `users`

#### Modelo: `User` (AbstractUser customizado)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLES = [
        ('public', 'Público'),
        ('apoderado', 'Apoderado'),
        ('entrenador', 'Entrenador'),
        ('admin', 'Administrador'),
    ]
    
    username = None  # No usar username, solo email
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLES, default='public')
    
    # Campos adicionales para apoderados
    rut = models.CharField(max_length=12, blank=True)
    direccion = models.TextField(blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    ocupacion = models.CharField(max_length=100, blank=True)
    contacto_emergencia = models.CharField(max_length=255, blank=True)
    telefono_emergencia = models.CharField(max_length=20, blank=True)
    
    # Rol personalizado (para permisos granulares)
    custom_role = models.ForeignKey('CustomRole', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.email})"

class CustomRole(models.Model):
    """Roles personalizados con permisos específicos"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)  # Lista de permisos
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class PasswordReset(models.Model):
    """Códigos de recuperación de contraseña"""
    email = models.EmailField()
    code = models.CharField(max_length=10)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    def is_valid(self):
        from django.utils import timezone
        return not self.used and timezone.now() < self.expires_at
```

**Endpoints requeridos**:
- `POST /api/auth/login/` - Login con email + password (SimpleJWT)
- `POST /api/auth/register/` - Registro de nuevo usuario
- `POST /api/auth/logout/` - Invalidar refresh token
- `POST /api/auth/token/refresh/` - Refrescar access token
- `GET /api/auth/me/` - Obtener perfil del usuario actual
- `PATCH /api/auth/me/` - Actualizar perfil
- `POST /api/auth/password/reset/` - Solicitar reset
- `POST /api/auth/password/reset/confirm/` - Confirmar reset con código

---

### 2. App: `atletas`

#### Modelo: `Atleta`

```python
class Atleta(models.Model):
    # Relaciones
    apoderado = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='atletas')
    equipo = models.ForeignKey('Equipo', on_delete=models.SET_NULL, null=True, blank=True, related_name='atletas')
    
    # Datos personales
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    rut = models.CharField(max_length=12, unique=True)
    fecha_nacimiento = models.DateField()
    genero = models.CharField(max_length=20, choices=[('M', 'Masculino'), ('F', 'Femenino'), ('Otro', 'Otro')])
    
    # Categorización deportiva
    DIVISIONES = [
        ('Tiny', 'Tiny (hasta 6 años)'),
        ('Mini', 'Mini (5-9 años)'),
        ('Youth', 'Youth (6-11 años)'),
        ('Junior', 'Junior (9-15 años)'),
        ('Senior', 'Senior (12-19 años)'),
        ('Open', 'Open (15+ años)'),
    ]
    
    CATEGORIAS = [
        ('recreativo', 'Recreativo'),
        ('novice', 'Novice'),
        ('prep', 'Prep'),
        ('elite', 'Elite'),
    ]
    
    division = models.CharField(max_length=20, choices=DIVISIONES)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    nivel = models.IntegerField(choices=[(i, f'Nivel {i}') for i in range(1, 8)])
    
    # Contacto y salud
    telefono_contacto = models.CharField(max_length=20, blank=True)
    email_contacto = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    contacto_emergencia = models.CharField(max_length=255)
    telefono_emergencia = models.CharField(max_length=20)
    prevision = models.CharField(max_length=100, blank=True)
    
    # Información médica
    alergias = models.TextField(blank=True)
    condiciones_medicas = models.TextField(blank=True)
    medicamentos = models.TextField(blank=True)
    restricciones_fisicas = models.TextField(blank=True)
    
    # Estado
    activo = models.BooleanField(default=True)
    fecha_ingreso = models.DateField(auto_now_add=True)
    fecha_retiro = models.DateField(null=True, blank=True)
    motivo_retiro = models.TextField(blank=True)
    
    # Notas y observaciones
    notas = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['apellidos', 'nombres']
        verbose_name_plural = 'Atletas'
    
    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})"
    
    @property
    def nombre_completo(self):
        return f"{self.nombres} {self.apellidos}"
    
    @property
    def edad(self):
        from datetime import date
        today = date.today()
        return today.year - self.fecha_nacimiento.year - (
            (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
        )

#### Modelo: `Equipo`

```python
class Equipo(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True)
    
    # Categorización (debe coincidir con atletas)
    division = models.CharField(max_length=20, choices=Atleta.DIVISIONES)
    categoria = models.CharField(max_length=20, choices=Atleta.CATEGORIAS)
    nivel = models.IntegerField(choices=[(i, f'Nivel {i}') for i in range(1, 8)])
    
    # Entrenadores asignados
    entrenadores = models.ManyToManyField('users.User', related_name='equipos_asignados', limit_choices_to={'role': 'entrenador'})
    
    # Capacidad y cupos
    capacidad_minima = models.IntegerField(default=5)
    capacidad_maxima = models.IntegerField(default=35)
    cupos_disponibles = models.IntegerField(default=35)
    
    # Estado
    activo = models.BooleanField(default=True)
    
    # Metadata
    color = models.CharField(max_length=7, default='#FCD34D')  # Color hex para UI
    logo = models.ImageField(upload_to='equipos/logos/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nivel', 'nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.division} - {self.categoria} - Nivel {self.nivel})"
    
    @property
    def cantidad_atletas(self):
        return self.atletas.filter(activo=True).count()
    
    def actualizar_cupos(self):
        """Actualiza los cupos disponibles"""
        self.cupos_disponibles = self.capacidad_maxima - self.cantidad_atletas
        self.save()

#### Modelo: `CertificacionAtleta`

```python
class CertificacionAtleta(models.Model):
    """Certificados médicos, escolares, etc."""
    TIPOS = [
        ('medico', 'Certificado Médico'),
        ('escolar', 'Certificado de Alumno Regular'),
        ('nacimiento', 'Certificado de Nacimiento'),
        ('otro', 'Otro'),
    ]
    
    atleta = models.ForeignKey('Atleta', on_delete=models.CASCADE, related_name='certificaciones')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    nombre = models.CharField(max_length=255)
    archivo = models.FileField(upload_to='certificaciones/atletas/')
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    notas = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_emision']
    
    def __str__(self):
        return f"{self.atleta.nombre_completo} - {self.get_tipo_display()}"
```

**Endpoints requeridos**:
- `GET /api/atletas/` - Listar todos (admin/entrenador)
- `GET /api/atletas/mis-atletas/` - Atletas del apoderado actual
- `GET /api/atletas/{id}/` - Detalle de atleta
- `POST /api/atletas/` - Crear atleta (apoderado)
- `PATCH /api/atletas/{id}/` - Actualizar atleta
- `DELETE /api/atletas/{id}/` - Eliminar atleta (admin)
- `GET /api/atletas/{id}/ficha/` - Ficha completa con certificaciones
- `POST /api/atletas/{id}/certificaciones/` - Subir certificación
- `GET /api/equipos/` - Listar equipos
- `POST /api/equipos/` - Crear equipo (admin)
- `PATCH /api/equipos/{id}/` - Actualizar equipo (admin)
- `PATCH /api/equipos/{id}/asignar-atleta/` - Asignar atleta a equipo

---

### 3. App: `pagos`

#### Modelo: `PeriodoMatricula`

```python
class PeriodoMatricula(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('cerrado', 'Cerrado'),
        ('programado', 'Programado'),
    ]
    
    nombre = models.CharField(max_length=255)  # "Matrícula 2024", "Matrícula Verano 2024"
    descripcion = models.TextField(blank=True)
    
    # Fechas
    fecha_inicio = models.DateField()
    fecha_termino = models.DateField()
    
    # Montos
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_hermanos = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Porcentaje
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programado')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.nombre} - {self.get_estado_display()}"

#### Modelo: `Matricula`

```python
class Matricula(models.Model):
    """Registro de matrícula de un atleta"""
    ESTADOS_PAGO = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('parcial', 'Pago Parcial'),
        ('vencido', 'Vencido'),
    ]
    
    atleta = models.ForeignKey('atletas.Atleta', on_delete=models.CASCADE, related_name='matriculas')
    periodo = models.ForeignKey('PeriodoMatricula', on_delete=models.CASCADE, related_name='matriculas')
    apoderado = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='matriculas')
    
    # Montos
    monto_original = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_aplicado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Estado
    estado_pago = models.CharField(max_length=20, choices=ESTADOS_PAGO, default='pendiente')
    
    # Pago
    metodo_pago = models.CharField(max_length=50, blank=True)  # "Transferencia", "Efectivo", etc.
    comprobante = models.FileField(upload_to='comprobantes/matriculas/', null=True, blank=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Matrícula {self.atleta.nombre_completo} - {self.periodo.nombre}"

#### Modelo: `ConfiguracionMensualidad`

```python
class ConfiguracionMensualidad(models.Model):
    """Configuración global de mensualidades"""
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    dia_vencimiento = models.IntegerField(default=5)  # Día del mes
    recargo_por_atraso = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento_hermanos = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # %
    activo = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Configuración de Mensualidad'
        verbose_name_plural = 'Configuraciones de Mensualidad'

#### Modelo: `Mensualidad`

```python
class Mensualidad(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('vencido', 'Vencido'),
        ('condonado', 'Condonado'),
    ]
    
    atleta = models.ForeignKey('atletas.Atleta', on_delete=models.CASCADE, related_name='mensualidades')
    apoderado = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='mensualidades')
    
    # Periodo (mes/año)
    mes = models.IntegerField()  # 1-12
    anio = models.IntegerField()
    
    # Montos
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    recargo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monto_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Estado y pago
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    fecha_vencimiento = models.DateField()
    fecha_pago = models.DateTimeField(null=True, blank=True)
    metodo_pago = models.CharField(max_length=50, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/mensualidades/', null=True, blank=True)
    
    # Metadata
    notas = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['atleta', 'mes', 'anio']
        ordering = ['-anio', '-mes']
    
    def __str__(self):
        return f"Mensualidad {self.mes}/{self.anio} - {self.atleta.nombre_completo}"

#### Modelo: `PagoManual`

```python
class PagoManual(models.Model):
    """Registro de pagos manuales (admin)"""
    TIPOS = [
        ('matricula', 'Matrícula'),
        ('mensualidad', 'Mensualidad'),
        ('otro', 'Otro'),
    ]
    
    apoderado = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='pagos_manuales')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    concepto = models.CharField(max_length=255)
    metodo_pago = models.CharField(max_length=50)
    comprobante = models.FileField(upload_to='comprobantes/manuales/', null=True, blank=True)
    
    # Relaciones opcionales
    matricula = models.ForeignKey('Matricula', on_delete=models.SET_NULL, null=True, blank=True)
    mensualidad = models.ForeignKey('Mensualidad', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    registrado_por = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='pagos_registrados')
    notas = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Pago Manual - {self.apoderado.name} - ${self.monto}"
```

**Endpoints requeridos**:
- `POST /api/pagos/matriculas/` - Registrar matrícula
- `GET /api/pagos/matriculas/mis-pagos/` - Mis pagos
- `GET /api/pagos/mensualidades/` - Mensualidades del apoderado
- `POST /api/pagos/mensualidades/pagar/` - Pagar mensualidad
- `GET /api/pagos/periodos-matricula/` - Periodos activos
- `POST /api/pagos/periodos-matricula/` - Crear periodo (admin)
- `GET /api/pagos/deudas/` - Listar deudas (admin)
- `GET /api/pagos/deudas/mis-deudas/` - Mis deudas
- `POST /api/pagos/pago-manual/` - Registrar pago manual (admin)
- `GET /api/pagos/reportes/` - Reportes financieros (admin)
- `GET /api/pagos/configuracion-mensualidades/` - Obtener config
- `PATCH /api/pagos/configuracion-mensualidades/` - Actualizar config (admin)

---

### 4. App: `tienda`

#### Modelo: `Producto`

```python
class Producto(models.Model):
    CATEGORIAS = [
        ('ropa', 'Ropa'),
        ('accesorios', 'Accesorios'),
        ('equipamiento', 'Equipamiento'),
        ('otro', 'Otro'),
    ]
    
    NIVELES_ACCESO = [
        ('publico', 'Público'),
        ('premium', 'Premium (solo apoderados)'),
    ]
    
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    nivel_acceso = models.CharField(max_length=20, choices=NIVELES_ACCESO, default='publico')
    
    # Precio
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    precio_oferta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    en_oferta = models.BooleanField(default=False)
    
    # Stock
    stock = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=5)
    
    # Variantes (tallas, colores)
    tiene_variantes = models.BooleanField(default=False)
    
    # Imágenes
    imagen_principal = models.ImageField(upload_to='productos/', null=True, blank=True)
    imagen_2 = models.ImageField(upload_to='productos/', null=True, blank=True)
    imagen_3 = models.ImageField(upload_to='productos/', null=True, blank=True)
    
    # Estado
    activo = models.BooleanField(default=True)
    destacado = models.BooleanField(default=False)
    
    # SEO
    slug = models.SlugField(unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-destacado', 'nombre']
    
    def __str__(self):
        return self.nombre
    
    @property
    def precio_actual(self):
        return self.precio_oferta if self.en_oferta and self.precio_oferta else self.precio

#### Modelo: `VarianteProducto`

```python
class VarianteProducto(models.Model):
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE, related_name='variantes')
    nombre = models.CharField(max_length=100)  # "Talla M", "Color Rojo"
    stock = models.IntegerField(default=0)
    precio_adicional = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.nombre}"

#### Modelo: `Carrito`

```python
class Carrito(models.Model):
    usuario = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='carrito')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Carrito de {self.usuario.name}"
    
    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def cantidad_items(self):
        return sum(item.cantidad for item in self.items.all())

class ItemCarrito(models.Model):
    carrito = models.ForeignKey('Carrito', on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE)
    variante = models.ForeignKey('VarianteProducto', on_delete=models.CASCADE, null=True, blank=True)
    cantidad = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['carrito', 'producto', 'variante']
    
    @property
    def subtotal(self):
        precio_base = self.producto.precio_actual
        precio_variante = self.variante.precio_adicional if self.variante else 0
        return (precio_base + precio_variante) * self.cantidad

#### Modelo: `Pedido`

```python
class Pedido(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('confirmado', 'Confirmado'),
        ('preparando', 'Preparando'),
        ('listo', 'Listo para Entregar'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    METODOS_PAGO = [
        ('transferencia', 'Transferencia'),
        ('efectivo', 'Efectivo'),
        ('tarjeta', 'Tarjeta'),
    ]
    
    METODOS_ENTREGA = [
        ('retiro', 'Retiro en Club'),
        ('envio', 'Envío a Domicilio'),
    ]
    
    usuario = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='pedidos')
    numero_pedido = models.CharField(max_length=50, unique=True)
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    
    # Totales
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    costo_envio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Pago
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO)
    comprobante_pago = models.FileField(upload_to='comprobantes/pedidos/', null=True, blank=True)
    pagado = models.BooleanField(default=False)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    # Entrega
    metodo_entrega = models.CharField(max_length=20, choices=METODOS_ENTREGA)
    direccion_entrega = models.TextField(blank=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    
    # Notas
    notas_cliente = models.TextField(blank=True)
    notas_admin = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido {self.numero_pedido} - {self.usuario.name}"

class ItemPedido(models.Model):
    pedido = models.ForeignKey('Pedido', on_delete=models.CASCADE, related_name='items')
    producto_nombre = models.CharField(max_length=255)
    variante_nombre = models.CharField(max_length=100, blank=True)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.cantidad}x {self.producto_nombre}"
```

**Endpoints requeridos**:
- `GET /api/tienda/productos/` - Listar productos
- `GET /api/tienda/productos/{id}/` - Detalle
- `POST /api/tienda/productos/` - Crear (admin)
- `PATCH /api/tienda/productos/{id}/` - Actualizar (admin)
- `GET /api/tienda/carrito/` - Mi carrito
- `POST /api/tienda/carrito/agregar/` - Agregar al carrito
- `PATCH /api/tienda/carrito/items/{id}/` - Actualizar cantidad
- `DELETE /api/tienda/carrito/items/{id}/` - Eliminar del carrito
- `POST /api/tienda/pedidos/` - Crear pedido
- `GET /api/tienda/pedidos/` - Mis pedidos
- `GET /api/tienda/pedidos/{id}/` - Detalle pedido
- `PATCH /api/tienda/pedidos/{id}/` - Actualizar estado (admin)

---

### 5. App: `horarios`

#### Modelo: `Horario`

```python
class Horario(models.Model):
    DIAS_SEMANA = [
        (0, 'Domingo'),
        (1, 'Lunes'),
        (2, 'Martes'),
        (3, 'Miércoles'),
        (4, 'Jueves'),
        (5, 'Viernes'),
        (6, 'Sábado'),
    ]
    
    equipo = models.ForeignKey('atletas.Equipo', on_delete=models.CASCADE, related_name='horarios')
    entrenador = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='horarios')
    
    dia_semana = models.IntegerField(choices=DIAS_SEMANA)
    hora_inicio = models.TimeField()
    hora_termino = models.TimeField()
    lugar = models.CharField(max_length=255)
    
    # Personalización
    color = models.CharField(max_length=7, default='#FCD34D')
    
    # Estado
    activo = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['dia_semana', 'hora_inicio']
    
    def __str__(self):
        return f"{self.equipo.nombre} - {self.get_dia_semana_display()} {self.hora_inicio}-{self.hora_termino}"

#### Modelo: `Asistencia`

```python
class Asistencia(models.Model):
    METODOS = [
        ('manual', 'Manual'),
        ('qr', 'Código QR'),
    ]
    
    horario = models.ForeignKey('Horario', on_delete=models.CASCADE, related_name='asistencias')
    atleta = models.ForeignKey('atletas.Atleta', on_delete=models.CASCADE, related_name='asistencias')
    fecha = models.DateField()
    presente = models.BooleanField()
    metodo = models.CharField(max_length=20, choices=METODOS, default='manual')
    
    # Metadata
    hora_registro = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        unique_together = ['horario', 'atleta', 'fecha']
        ordering = ['-fecha']
    
    def __str__(self):
        estado = "Presente" if self.presente else "Ausente"
        return f"{self.atleta.nombre_completo} - {self.fecha} - {estado}"
```

**Endpoints requeridos**:
- `GET /api/horarios/` - Listar horarios
- `GET /api/horarios/mis-horarios/` - Horarios del usuario (apoderado/entrenador)
- `POST /api/horarios/` - Crear (admin)
- `PATCH /api/horarios/{id}/` - Actualizar (admin)
- `DELETE /api/horarios/{id}/` - Eliminar (admin)
- `GET /api/horarios/{id}/asistencias/` - Asistencias de un horario
- `POST /api/horarios/{id}/asistencias/` - Marcar asistencia (entrenador)
- `GET /api/atletas/{id}/asistencias/` - Asistencias de un atleta

---

### 6. App: `notificaciones`

#### Modelo: `Notificacion`

```python
class Notificacion(models.Model):
    TIPOS = [
        ('general', 'General'),
        ('pago', 'Pago'),
        ('horario', 'Horario'),
        ('evento', 'Evento'),
        ('urgente', 'Urgente'),
    ]
    
    PRIORIDADES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
    ]
    
    CANALES = [
        ('plataforma', 'Plataforma'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('sms', 'SMS'),
    ]
    
    # Contenido
    tipo = models.CharField(max_length=20, choices=TIPOS)
    titulo = models.CharField(max_length=255)
    mensaje = models.TextField()
    prioridad = models.CharField(max_length=20, choices=PRIORIDADES, default='media')
    
    # Destinatarios
    destinatarios = models.ManyToManyField('users.User', related_name='notificaciones_recibidas')
    canales = models.JSONField(default=list)  # ['plataforma', 'email']
    
    # Estado
    estado = models.CharField(max_length=20, choices=[
        ('borrador', 'Borrador'),
        ('enviada', 'Enviada'),
        ('programada', 'Programada'),
    ], default='borrador')
    
    # Control de lectura
    leida_por = models.ManyToManyField('users.User', related_name='notificaciones_leidas', blank=True)
    
    # Programación
    fecha_envio = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    creado_por = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='notificaciones_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.titulo} ({self.tipo})"
```

**Endpoints requeridos**:
- `GET /api/notificaciones/` - Mis notificaciones
- `POST /api/notificaciones/` - Crear (admin)
- `PATCH /api/notificaciones/{id}/marcar-leida/` - Marcar leída
- `DELETE /api/notificaciones/{id}/` - Eliminar
- `GET /api/notificaciones/no-leidas/count/` - Cantidad no leídas

---

### 7. App: `ranking`

#### Modelo: `RankingAtleta`

```python
class RankingAtleta(models.Model):
    atleta = models.ForeignKey('atletas.Atleta', on_delete=models.CASCADE, related_name='ranking')
    
    # Posición
    posicion = models.IntegerField()
    posicion_anterior = models.IntegerField(null=True, blank=True)
    
    # Puntos
    puntos_totales = models.IntegerField(default=0)
    puntos_mes = models.IntegerField(default=0)
    
    # Estadísticas
    entrenamientos_asistidos = models.IntegerField(default=0)
    entrenamientos_totales = models.IntegerField(default=0)
    porcentaje_asistencia = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Competencias
    competencias_participadas = models.IntegerField(default=0)
    medallas_oro = models.IntegerField(default=0)
    medallas_plata = models.IntegerField(default=0)
    medallas_bronce = models.IntegerField(default=0)
    
    # Metadata
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
```

**Endpoints requeridos**:
- `GET /api/ranking/` - Ranking público
- `GET /api/ranking/atleta/{id}/` - Ranking de atleta específico
- `POST /api/ranking/` - Crear/actualizar (admin)
- `PATCH /api/ranking/{id}/` - Actualizar (admin)

---

### 8. App: `landing`

#### Modelo: `DatosLanding`

```python
class DatosLanding(models.Model):
    """Singleton para datos editables del landing"""
    
    # Hero Section
    titulo_principal = models.CharField(max_length=255, default="Reign All Stars")
    subtitulo = models.CharField(max_length=255, default="La Colmena")
    descripcion_hero = models.TextField()
    imagen_hero = models.ImageField(upload_to='landing/', null=True, blank=True)
    
    # About Section
    titulo_about = models.CharField(max_length=255)
    descripcion_about = models.TextField()
    mision = models.TextField()
    vision = models.TextField()
    
    # Estadísticas
    total_atletas = models.IntegerField(default=0)
    total_entrenadores = models.IntegerField(default=0)
    total_competencias = models.IntegerField(default=0)
    anos_experiencia = models.IntegerField(default=0)
    
    # Redes Sociales
    instagram_url = models.URLField(blank=True)
    facebook_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    
    # Contacto
    email_contacto = models.EmailField()
    telefono_contacto = models.CharField(max_length=20)
    direccion = models.TextField()
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        verbose_name = 'Datos del Landing'
        verbose_name_plural = 'Datos del Landing'
    
    def save(self, *args, **kwargs):
        # Asegurar que solo existe una instancia
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

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

class PerfilEntrenador(models.Model):
    usuario = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='perfil_entrenador')
    
    # Información pública
    foto = models.ImageField(upload_to='entrenadores/', null=True, blank=True)
    resena = models.TextField()
    experiencia_anios = models.IntegerField()
    especialidades = models.JSONField(default=list)  # ["Tumbling", "Stunts"]
    
    # Certificaciones
    certificaciones_validadas = models.IntegerField(default=0)
    
    # Visibilidad
    visible_en_landing = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['orden']
        verbose_name = 'Perfil de Entrenador'
        verbose_name_plural = 'Perfiles de Entrenadores'
    
    def __str__(self):
        return self.usuario.name

class CertificacionEntrenador(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('validado', 'Validado'),
        ('rechazado', 'Rechazado'),
    ]
    
    entrenador = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='certificaciones')
    nombre = models.CharField(max_length=255)
    institucion = models.CharField(max_length=255)
    fecha_obtencion = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    descripcion = models.TextField(blank=True)
    archivo = models.FileField(upload_to='certificaciones/entrenadores/')
    
    # Validación
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    validado_por = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='certificaciones_validadas')
    fecha_validacion = models.DateTimeField(null=True, blank=True)
    comentario_admin = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.nombre} - {self.entrenador.name}"
```

**Endpoints requeridos**:
- `GET /api/landing/datos/` - Datos del landing
- `PATCH /api/landing/datos/` - Actualizar (admin)
- `GET /api/landing/entrenadores/` - Entrenadores visibles
- `GET /api/landing/carrusel/` - Fotos del carrusel
- `POST /api/landing/carrusel/` - Subir foto (admin)

---

## 🔐 Sistema de Permisos

### Permisos por Rol

```python
# utils/permissions.py

from rest_framework import permissions

class IsPublicOrAuthenticated(permissions.BasePermission):
    """Permite acceso público o autenticado según el objeto"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class IsApoderadoOrAdmin(permissions.BasePermission):
    """Solo apoderados y admins"""
    def has_permission(self, request, view):
        return request.user and request.user.role in ['apoderado', 'admin']

class IsEntrenadorOrAdmin(permissions.BasePermission):
    """Solo entrenadores y admins"""
    def has_permission(self, request, view):
        return request.user and request.user.role in ['entrenador', 'admin']

class IsAdminUser(permissions.BasePermission):
    """Solo admins"""
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin'

class IsOwnerOrAdmin(permissions.BasePermission):
    """Dueño del objeto o admin"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        # Adaptar según modelo
        if hasattr(obj, 'apoderado'):
            return obj.apoderado == request.user
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        return False
```

---

## 🚀 Configuración settings.py

```python
# config/settings.py

from datetime import timedelta
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    
    # Local apps
    'users',
    'atletas',
    'pagos',
    'tienda',
    'horarios',
    'notificaciones',
    'ranking',
    'landing',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'reign_all_stars'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'es-cl'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# SimpleJWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Agregar dominio de producción
]

CORS_ALLOW_CREDENTIALS = True
```

---

## 📦 Respuestas Estándar de la API

Todas las respuestas deben seguir este formato:

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {
    // ... datos solicitados
  }
}
```

### Respuesta con Error
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": {
      // ... detalles específicos del error
    }
  }
}
```

---

## ✅ Checklist de Implementación

### Fase 1: Setup Inicial
- [ ] Crear proyecto Django
- [ ] Instalar dependencias
- [ ] Configurar settings.py
- [ ] Configurar CORS
- [ ] Crear app `users` con modelo User customizado

### Fase 2: Autenticación
- [ ] Configurar SimpleJWT
- [ ] Crear serializers para User
- [ ] Implementar endpoints de auth
- [ ] Crear sistema de reset de contraseña

### Fase 3: Apps Principales
- [ ] App `atletas` (modelos, serializers, views, urls)
- [ ] App `pagos` (modelos, serializers, views, urls)
- [ ] App `tienda` (modelos, serializers, views, urls)

### Fase 4: Apps Secundarias
- [ ] App `horarios`
- [ ] App `notificaciones`
- [ ] App `ranking`
- [ ] App `landing`

### Fase 5: Permisos y Seguridad
- [ ] Implementar classes de permisos
- [ ] Aplicar permisos a cada ViewSet
- [ ] Configurar throttling (rate limiting)

### Fase 6: Testing
- [ ] Tests unitarios por app
- [ ] Tests de integración
- [ ] Probar con frontend

---

## 🎯 Prioridades de Desarrollo

**Alta Prioridad (MVP)**:
1. Users + Auth (SimpleJWT)
2. Atletas
3. Pagos (matrículas)
4. Equipos básicos

**Media Prioridad**:
1. Tienda
2. Horarios
3. Pagos (mensualidades)

**Baja Prioridad**:
1. Ranking
2. Notificaciones avanzadas
3. Landing editable

---

🐝 **La Colmena** - Reign All Stars  
**Backend Specification v1.0**
