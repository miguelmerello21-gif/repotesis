# 🎯 Especificación del Backend - Reign All Stars

## 📌 Para: Equipo de Backend / Codex AI

Este documento especifica la estructura del backend Django REST Framework que debe implementarse para soportar el frontend de **Reign All Stars**.

---

## 🏗️ Estructura de Apps Django Requeridas

### 1. **users** - Gestión de Usuarios y Autenticación

**Responsabilidades**:
- Modelo de usuario customizado con campo `role`
- Autenticación JWT con SimpleJWT
- Gestión de perfiles

**Modelos**:

```python
class User(AbstractUser):
    """Usuario customizado con roles"""
    ROLE_CHOICES = [
        ('public', 'Público'),
        ('apoderado', 'Apoderado'),
        ('entrenador', 'Entrenador'),
        ('admin', 'Administrador'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='public')
    phone = models.CharField(max_length=20, blank=True)
    # username heredado de AbstractUser (usar email en su lugar)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
```

**Endpoints**:
- POST `/api/auth/login/` - Login con JWT
- POST `/api/auth/register/` - Registro de usuario público
- POST `/api/auth/logout/` - Logout
- POST `/api/auth/token/refresh/` - Refresh token
- GET `/api/auth/me/` - Perfil actual
- PATCH `/api/auth/me/` - Actualizar perfil
- POST `/api/auth/password/reset/` - Solicitar reset
- POST `/api/auth/password/reset/confirm/` - Confirmar reset

**Permisos**:
- Login/Register: Público
- Me/Update: Usuario autenticado
- Resto: Usuario autenticado

---

### 2. **atletas** - Gestión de Atletas

**Responsabilidades**:
- CRUD de atletas
- Relación atleta-apoderado
- Certificaciones médicas
- Asignación a equipos

**Modelos**:

```python
class Atleta(models.Model):
    """Atleta de cheerleading"""
    apoderado = models.ForeignKey(User, on_delete=models.CASCADE, related_name='atletas')
    nombre = models.CharField(max_length=255)
    rut = models.CharField(max_length=12, unique=True)
    fecha_nacimiento = models.DateField()
    
    # Categorías de cheerleading
    DIVISION_CHOICES = [
        ('tiny', 'Tiny (hasta 6 años)'),
        ('mini', 'Mini (5-9 años)'),
        ('youth', 'Youth (6-11 años)'),
        ('junior', 'Junior (9-15 años)'),
        ('senior', 'Senior (12-19 años)'),
        ('open', 'Open (15+ años)'),
    ]
    division = models.CharField(max_length=20, choices=DIVISION_CHOICES)
    
    CATEGORIA_CHOICES = [
        ('recreativo', 'Recreativo'),
        ('novice', 'Novice'),
        ('prep', 'Prep'),
        ('elite', 'Elite'),
    ]
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    
    nivel = models.IntegerField(choices=[(i, f'Nivel {i}') for i in range(1, 8)])
    
    equipo = models.ForeignKey('Equipo', on_delete=models.SET_NULL, null=True, blank=True, related_name='atletas')
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Certificacion(models.Model):
    """Certificado médico del atleta"""
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='certificaciones')
    tipo = models.CharField(max_length=50)  # 'medico', 'seguro', etc.
    archivo = models.FileField(upload_to='certificaciones/')
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField()
    validado = models.BooleanField(default=False)
    validado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Equipo(models.Model):
    """Equipo de cheerleading"""
    nombre = models.CharField(max_length=255)
    division = models.CharField(max_length=20)
    categoria = models.CharField(max_length=20)
    nivel = models.IntegerField()
    entrenadores = models.ManyToManyField(User, related_name='equipos_entrenador')
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Endpoints**:
- GET `/api/atletas/` - Listar (admin/entrenador)
- GET `/api/atletas/mis-atletas/` - Atletas del apoderado
- GET `/api/atletas/{id}/` - Detalle
- POST `/api/atletas/` - Crear (apoderado)
- PATCH `/api/atletas/{id}/` - Actualizar
- DELETE `/api/atletas/{id}/` - Eliminar (admin)
- GET `/api/atletas/{id}/ficha/` - Ficha completa
- PATCH `/api/atletas/{id}/asignar-equipo/` - Asignar equipo (admin)
- GET/POST `/api/atletas/{id}/certificaciones/` - Certificaciones

**Permisos**:
- Apoderado: Solo sus atletas
- Entrenador: Atletas de sus equipos (read-only)
- Admin: Todos

---

### 3. **pagos** - Matrículas y Mensualidades

**Responsabilidades**:
- Registro de matrículas
- Gestión de mensualidades
- Periodos de matrícula
- Control de deudas
- Reportes financieros

**Modelos**:

```python
class PeriodoMatricula(models.Model):
    """Periodo de matrícula"""
    nombre = models.CharField(max_length=255)  # "Temporada 2024"
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    costo = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)

class Matricula(models.Model):
    """Registro de matrícula de un atleta"""
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='matriculas')
    periodo = models.ForeignKey(PeriodoMatricula, on_delete=models.PROTECT)
    apoderado = models.ForeignKey(User, on_delete=models.CASCADE)
    
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_matricula = models.DateTimeField(auto_now_add=True)
    
    METODO_CHOICES = [
        ('transferencia', 'Transferencia'),
        ('efectivo', 'Efectivo'),
        ('webpay', 'WebPay'),
    ]
    metodo_pago = models.CharField(max_length=20, choices=METODO_CHOICES)
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('rechazado', 'Rechazado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pagado')
    
    comprobante = models.FileField(upload_to='comprobantes/', blank=True)

class ConfiguracionMensualidades(models.Model):
    """Configuración global de mensualidades"""
    monto_base = models.DecimalField(max_digits=10, decimal_places=2)
    dia_vencimiento = models.IntegerField(default=5)  # Día del mes
    monto_recargo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)

class Mensualidad(models.Model):
    """Pago mensual de un atleta"""
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='mensualidades')
    apoderado = models.ForeignKey(User, on_delete=models.CASCADE)
    
    mes = models.IntegerField()  # 1-12
    anio = models.IntegerField()
    
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vencimiento = models.DateField()
    fecha_pago = models.DateTimeField(null=True, blank=True)
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('atrasado', 'Atrasado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    metodo_pago = models.CharField(max_length=20, blank=True)
    comprobante = models.FileField(upload_to='comprobantes/', blank=True)

class Deuda(models.Model):
    """Registro de deudas"""
    apoderado = models.ForeignKey(User, on_delete=models.CASCADE, related_name='deudas')
    tipo = models.CharField(max_length=50)  # 'matricula', 'mensualidad', 'tienda'
    referencia_id = models.IntegerField()  # ID del objeto relacionado
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vencimiento = models.DateField()
    pagado = models.BooleanField(default=False)
```

**Endpoints**:
- POST `/api/pagos/matriculas/` - Registrar matrícula
- GET `/api/pagos/matriculas/` - Listar (admin)
- GET `/api/pagos/matriculas/mis-pagos/` - Mis pagos
- GET `/api/pagos/mensualidades/` - Mensualidades del apoderado
- POST `/api/pagos/mensualidades/` - Registrar pago
- GET/POST/PATCH `/api/pagos/periodos-matricula/` - Periodos (admin)
- GET `/api/pagos/deudas/` - Listar deudas (admin)
- GET `/api/pagos/deudas/mis-deudas/` - Mis deudas
- POST `/api/pagos/pago-manual/` - Registrar manual (admin)
- GET `/api/pagos/reportes/` - Reportes (admin)
- GET/PATCH `/api/pagos/configuracion-mensualidades/` - Config (admin)

---

### 4. **tienda** - E-commerce

**Responsabilidades**:
- Catálogo de productos (público y premium)
- Carrito de compras
- Gestión de pedidos

**Modelos**:

```python
class Producto(models.Model):
    """Producto de la tienda"""
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    TIPO_CHOICES = [
        ('publico', 'Público'),
        ('premium', 'Premium (Solo Apoderados)'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    
    imagen = models.ImageField(upload_to='productos/', blank=True)
    stock = models.IntegerField(default=0)
    tallas_disponibles = models.JSONField(default=list, blank=True)  # ['XS', 'S', 'M', 'L', 'XL']
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Carrito(models.Model):
    """Carrito de compras"""
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='carrito')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ItemCarrito(models.Model):
    """Item en el carrito"""
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    talla = models.CharField(max_length=10, blank=True)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

class Pedido(models.Model):
    """Pedido realizado"""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pedidos')
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('procesando', 'Procesando'),
        ('enviado', 'Enviado'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    total = models.DecimalField(max_digits=10, decimal_places=2)
    direccion_envio = models.TextField(blank=True)
    notas = models.TextField(blank=True)

class ItemPedido(models.Model):
    """Item en un pedido"""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    talla = models.CharField(max_length=10, blank=True)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
```

**Endpoints**:
- GET/POST/PATCH/DELETE `/api/tienda/productos/` - CRUD productos
- GET `/api/tienda/carrito/` - Mi carrito
- POST `/api/tienda/carrito/agregar/` - Agregar al carrito
- PATCH `/api/tienda/carrito/actualizar/{item_id}/` - Actualizar cantidad
- DELETE `/api/tienda/carrito/eliminar/{item_id}/` - Eliminar
- POST `/api/tienda/pedidos/` - Crear pedido
- GET `/api/tienda/pedidos/` - Mis pedidos
- GET `/api/tienda/pedidos/{id}/` - Detalle pedido

---

### 5. **horarios** - Gestión de Horarios

**Responsabilidades**:
- Horarios de entrenamiento por equipo
- Asignación de entrenadores

**Modelos**:

```python
class Horario(models.Model):
    """Horario de entrenamiento"""
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='horarios')
    
    DIA_CHOICES = [
        ('lunes', 'Lunes'),
        ('martes', 'Martes'),
        ('miercoles', 'Miércoles'),
        ('jueves', 'Jueves'),
        ('viernes', 'Viernes'),
        ('sabado', 'Sábado'),
        ('domingo', 'Domingo'),
    ]
    dia = models.CharField(max_length=20, choices=DIA_CHOICES)
    
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    lugar = models.CharField(max_length=255, default='Gimnasio La Colmena')
    
    activo = models.BooleanField(default=True)
```

**Endpoints**:
- GET `/api/horarios/` - Listar horarios
- GET `/api/horarios/mis-horarios/` - Horarios del usuario
- POST/PATCH/DELETE `/api/horarios/` - CRUD (admin)

---

### 6. **notificaciones** - Sistema de Notificaciones

**Responsabilidades**:
- Notificaciones internas
- Envío a usuarios específicos o grupos

**Modelos**:

```python
class Notificacion(models.Model):
    """Notificación para usuarios"""
    destinatario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    
    titulo = models.CharField(max_length=255)
    mensaje = models.TextField()
    
    TIPO_CHOICES = [
        ('info', 'Información'),
        ('exito', 'Éxito'),
        ('advertencia', 'Advertencia'),
        ('error', 'Error'),
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='info')
    
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
```

**Endpoints**:
- GET `/api/notificaciones/` - Mis notificaciones
- POST `/api/notificaciones/` - Crear (admin)
- PATCH `/api/notificaciones/{id}/marcar-leida/` - Marcar leída
- DELETE `/api/notificaciones/{id}/` - Eliminar
- GET `/api/notificaciones/no-leidas/count/` - Cantidad no leídas

---

### 7. **ranking** - Sistema de Ranking

**Responsabilidades**:
- Ranking público de atletas
- Gestión de posiciones

**Modelos**:

```python
class Ranking(models.Model):
    """Entrada de ranking"""
    atleta = models.ForeignKey(Atleta, on_delete=models.CASCADE, related_name='ranking')
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE)
    
    posicion = models.IntegerField()
    puntos = models.DecimalField(max_digits=10, decimal_places=2)
    
    categoria = models.CharField(max_length=50)
    nivel = models.IntegerField()
    
    anio = models.IntegerField()
    temporada = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Endpoints**:
- GET `/api/ranking/` - Ranking público
- GET `/api/ranking/atleta/{id}/` - Ranking de atleta
- POST/PATCH/DELETE `/api/ranking/` - CRUD (admin)

---

### 8. **landing** - Datos del Landing Page

**Responsabilidades**:
- Configuración del landing page
- Estadísticas del club
- Próximos eventos

**Modelos**:

```python
class DatosLanding(models.Model):
    """Datos configurables del landing"""
    # Estadísticas
    total_campeonatos = models.IntegerField(default=0)
    total_atletas = models.IntegerField(default=0)
    total_entrenadores = models.IntegerField(default=0)
    anios_experiencia = models.IntegerField(default=9)  # Desde 2016
    
    # Información de contacto
    telefono = models.CharField(max_length=20)
    email = models.EmailField()
    direccion = models.TextField()
    
    # Redes sociales
    instagram = models.URLField(blank=True)
    facebook = models.URLField(blank=True)
    
    # Configuración (solo debe existir un registro)
    class Meta:
        verbose_name_plural = "Datos Landing"

class Evento(models.Model):
    """Próximos eventos del club"""
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    fecha = models.DateField()
    hora = models.TimeField(null=True, blank=True)
    lugar = models.CharField(max_length=255)
    destacado = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['fecha']

class Membresia(models.Model):
    """Tipos de membresía"""
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField()
    beneficios = models.JSONField(default=list)  # Lista de strings
    destacada = models.BooleanField(default=False)
    orden = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['orden']
```

**Endpoints**:
- GET `/api/landing/datos/` - Datos del landing
- PATCH `/api/landing/datos/` - Actualizar (admin)
- GET `/api/landing/entrenadores/` - Entrenadores públicos
- GET `/api/landing/eventos/` - Próximos eventos
- GET `/api/landing/estadisticas/` - Estadísticas del club

---

## 🔒 Sistema de Permisos

### Roles y Permisos

```python
# permissions.py

class IsPublic(permissions.BasePermission):
    """Acceso público (sin autenticación)"""
    def has_permission(self, request, view):
        return True

class IsApoderado(permissions.BasePermission):
    """Usuario con rol apoderado"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'apoderado'

class IsEntrenador(permissions.BasePermission):
    """Usuario con rol entrenador"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'entrenador'

class IsAdmin(permissions.BasePermission):
    """Usuario con rol admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsApoderadoOrAdmin(permissions.BasePermission):
    """Apoderado o Admin"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['apoderado', 'admin']
```

---

## 📊 Migración de Datos

### Datos Iniciales Requeridos

1. **Usuario Admin por defecto**:
   - Email: admin@reignallstars.cl
   - Password: (configurar en deployment)
   - Role: admin

2. **Configuración de Mensualidades**:
   - Monto base: $50,000 CLP
   - Día vencimiento: 5
   - Recargo: $5,000 CLP

3. **Datos del Landing**:
   - Campeonatos: 15
   - Atletas: 150
   - Entrenadores: 8
   - Años: 9 (desde 2016)

---

## 🔧 Configuraciones Técnicas

### Settings Recomendados

```python
# settings.py

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# File Uploads
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Allowed file types
ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
MAX_UPLOAD_SIZE = 5242880  # 5MB
```

---

## 🎯 Prioridades de Implementación

### Fase 1 - Core (Crítico)
1. ✅ App `users` - Autenticación JWT
2. ✅ App `atletas` - CRUD básico
3. ✅ App `pagos` - Matrículas

### Fase 2 - Funcionalidad Principal
4. ✅ App `tienda` - Productos y carrito
5. ✅ App `horarios` - Gestión de horarios
6. ✅ App `notificaciones` - Sistema de notificaciones

### Fase 3 - Complementario
7. ✅ App `ranking` - Sistema de ranking
8. ✅ App `landing` - Datos del landing page
9. ✅ Admin Django - Configuración
10. ✅ Testing - Pruebas unitarias

---

## 📝 Notas Finales

- Todos los modelos deben tener `created_at` y `updated_at` cuando sea relevante
- Usar `soft delete` (campo `activo`) en lugar de eliminar registros
- Implementar paginación en todos los listados (PageNumberPagination, 20 items)
- Validaciones de RUT chileno en el modelo Atleta
- Generar automáticamente deudas cuando se atrasan pagos
- Enviar notificación automática cuando se crea una matrícula
- El cambio de role de 'public' a 'apoderado' debe ser automático al registrar primera matrícula

---

🐝 **La Colmena** - Reign All Stars
