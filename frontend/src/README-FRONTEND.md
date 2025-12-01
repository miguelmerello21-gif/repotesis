# 🐝 Reign All Stars - Frontend Documentation

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Configuración Inicial](#configuración-inicial)
5. [Capa de API](#capa-de-api)
6. [Endpoints Esperados del Backend](#endpoints-esperados-del-backend)
7. [Sistema de Autenticación](#sistema-de-autenticación)
8. [Roles de Usuario](#roles-de-usuario)
9. [Integración con Django REST Framework](#integración-con-django-rest-framework)
10. [Guía para el Equipo de Backend](#guía-para-el-equipo-de-backend)

---

## 📖 Descripción General

**Reign All Stars** es una plataforma de gestión deportiva para un club de cheerleading. El frontend está construido con **React + TypeScript + Vite** y utiliza **Tailwind CSS** para estilos.

El sistema incluye:
- ✅ Landing page pública con información del club
- ✅ Sistema de autenticación con 4 roles (público, apoderado, entrenador, admin)
- ✅ Gestión de atletas y equipos
- ✅ Sistema de matrículas y pagos
- ✅ Tienda con productos públicos y premium
- ✅ Panel administrativo completo
- ✅ Sistema de notificaciones
- ✅ Gestión de horarios y ranking

---

## 📁 Estructura del Proyecto

```
reign-all-stars-frontend/
│
├── api/                          # 🔌 Capa de conexión con el backend
│   ├── axios.js                  # Configuración de Axios + interceptores JWT
│   ├── index.js                  # Exportación centralizada de servicios
│   └── services/                 # Servicios organizados por dominio
│       ├── authService.js        # Autenticación (login, register, logout)
│       ├── atletasService.js     # Gestión de atletas
│       ├── equiposService.js     # Gestión de equipos
│       ├── horariosService.js    # Gestión de horarios
│       ├── landingService.js     # Datos del landing page
│       ├── notificacionesService.js  # Notificaciones
│       ├── pagosService.js       # Matrículas y mensualidades
│       ├── rankingService.js     # Sistema de ranking
│       ├── tiendaService.js      # Productos y carrito
│       └── usuariosService.js    # Gestión de usuarios (admin)
│
├── components/                   # 🧩 Componentes de React
│   ├── ui/                       # Componentes de shadcn/ui
│   ├── figma/                    # Componentes de utilidad
│   ├── AdminPanel.tsx            # Panel de administración
│   ├── Navbar.tsx                # Barra de navegación
│   ├── LandingPage.tsx           # Página de inicio
│   ├── AuthModal.tsx             # Modal de login/registro
│   ├── TiendaPublica.tsx         # Tienda pública
│   ├── TiendaApoderado.tsx       # Tienda premium
│   ├── MisAtletas.tsx            # Vista de atletas del apoderado
│   ├── MatriculaForm.tsx         # Formulario de matrícula
│   ├── MisPagos.tsx              # Historial de pagos
│   ├── GestionEquipos.tsx        # Gestión de equipos (admin)
│   ├── GestionHorarios.tsx       # Gestión de horarios (admin)
│   ├── UsersManagement.tsx       # Gestión de usuarios (admin)
│   ├── AtletasManagement.tsx     # Gestión de atletas (admin)
│   ├── GestionTienda.tsx         # Gestión de productos (admin)
│   ├── GestionNotificaciones.tsx # Envío de notificaciones (admin)
│   ├── ReportesFinancieros.tsx   # Reportes financieros (admin)
│   └── ... (más componentes)
│
├── contexts/                     # 🔄 Context API de React
│   ├── AuthContext.tsx           # Estado global de autenticación
│   └── LandingDataContext.tsx    # Datos del landing page
│
├── constants/                    # 📊 Constantes y configuración
│   └── cheerCategories.ts        # Categorías de cheerleading
│
├── utils/                        # 🛠️ Utilidades
│   └── plantillasNotificacionesDefecto.ts
│
├── styles/                       # 🎨 Estilos globales
│   └── globals.css               # Estilos Tailwind y customizaciones
│
├── App.tsx                       # 🚀 Componente principal
├── .env.example                  # 📝 Ejemplo de variables de entorno
└── README-FRONTEND.md            # 📖 Esta documentación

```

---

## 🛠️ Tecnologías Utilizadas

- **React 18** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **Context API** - Manejo de estado global

---

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura la URL del backend:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 4. Build para Producción

```bash
npm run build
```

---

## 🔌 Capa de API

### Configuración de Axios

El archivo `/api/axios.js` configura una instancia de Axios con:

- ✅ **URL base** desde variable de entorno `VITE_API_URL`
- ✅ **Interceptor de request**: Agrega automáticamente `Authorization: Bearer <token>`
- ✅ **Interceptor de response**: Refresca el token JWT automáticamente cuando expira (401)
- ✅ **Manejo de errores** centralizado con `handleApiError()`

### Uso de los Servicios

Todos los servicios están disponibles desde `/api/index.js`:

```javascript
import { authService, atletasService, tiendaService } from '../api';

// Ejemplo: Login
const resultado = await authService.login(email, password);
if (resultado.success) {
  console.log('Usuario:', resultado.data.user);
} else {
  console.error('Error:', resultado.error.message);
}

// Ejemplo: Obtener atletas
const atletas = await atletasService.obtenerMisAtletas();
```

### Estructura de Respuestas

Todos los servicios devuelven un objeto con:

```javascript
{
  success: true | false,
  data: { ... },           // Solo si success === true
  error: {                 // Solo si success === false
    status: number,
    message: string,
    errors: object | null
  }
}
```

### Hook useApi

Para facilitar el manejo de estados de carga y errores, se ha creado el hook `useApi`:

```typescript
import { useApi } from '../hooks/useApi';
import { obtenerAtletas } from '../api/services/atletasService';

function MiComponente() {
  const { data, loading, error, execute } = useApi();

  useEffect(() => {
    execute(() => obtenerAtletas());
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {data?.map(atleta => (
        <AtletaCard key={atleta.id} atleta={atleta} />
      ))}
    </div>
  );
}
```

**Ventajas del hook**:
- ✅ Manejo automático de estados (loading, error, data)
- ✅ Callbacks opcionales (onSuccess, onError)
- ✅ Función reset para limpiar estado
- ✅ TypeScript support

---

## 📡 Endpoints Esperados del Backend

El frontend espera que Django REST Framework implemente los siguientes endpoints:

### 🔐 Autenticación (`/api/auth/`)

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| POST | `/auth/login/` | Iniciar sesión (SimpleJWT) | `{ email, password }` |
| POST | `/auth/register/` | Registrar nuevo usuario | `{ name, email, password, phone }` |
| POST | `/auth/logout/` | Cerrar sesión | `{ refresh }` |
| POST | `/auth/token/refresh/` | Refrescar access token | `{ refresh }` |
| GET | `/auth/me/` | Obtener perfil actual | - |
| PATCH | `/auth/me/` | Actualizar perfil | `{ name, phone, ... }` |
| POST | `/auth/password/reset/` | Solicitar reset | `{ email }` |
| POST | `/auth/password/reset/confirm/` | Confirmar reset | `{ email, code, new_password }` |

### 👥 Atletas (`/api/atletas/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/atletas/` | Listar todos | Admin/Entrenador |
| GET | `/atletas/mis-atletas/` | Atletas del apoderado | Apoderado |
| GET | `/atletas/{id}/` | Detalle | Apoderado/Admin/Entrenador |
| POST | `/atletas/` | Crear atleta | Apoderado |
| PATCH | `/atletas/{id}/` | Actualizar | Apoderado/Admin |
| DELETE | `/atletas/{id}/` | Eliminar | Admin |
| GET | `/atletas/{id}/ficha/` | Ficha completa | Apoderado/Admin/Entrenador |
| PATCH | `/atletas/{id}/asignar-equipo/` | Asignar equipo | Admin |
| GET | `/atletas/{id}/certificaciones/` | Certificaciones | Apoderado/Admin |
| POST | `/atletas/{id}/certificaciones/` | Subir certificación | Apoderado |

### 🏆 Equipos (`/api/equipos/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/equipos/` | Listar equipos | Todos |
| GET | `/equipos/{id}/` | Detalle | Todos |
| POST | `/equipos/` | Crear | Admin |
| PATCH | `/equipos/{id}/` | Actualizar | Admin |
| DELETE | `/equipos/{id}/` | Eliminar | Admin |
| GET | `/equipos/{id}/atletas/` | Atletas del equipo | Todos |
| GET | `/equipos/{id}/horarios/` | Horarios del equipo | Todos |

### 📅 Horarios (`/api/horarios/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/horarios/` | Listar horarios | Todos |
| GET | `/horarios/mis-horarios/` | Horarios del usuario | Apoderado/Entrenador |
| POST | `/horarios/` | Crear | Admin |
| PATCH | `/horarios/{id}/` | Actualizar | Admin |
| DELETE | `/horarios/{id}/` | Eliminar | Admin |

### 💰 Pagos (`/api/pagos/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/pagos/matriculas/` | Registrar matrícula | Apoderado |
| GET | `/pagos/matriculas/` | Listar matrículas | Admin |
| GET | `/pagos/matriculas/mis-pagos/` | Mis pagos | Apoderado |
| GET | `/pagos/mensualidades/` | Mensualidades | Apoderado |
| POST | `/pagos/mensualidades/` | Pagar mensualidad | Apoderado |
| GET | `/pagos/periodos-matricula/` | Periodos activos | Todos |
| POST | `/pagos/periodos-matricula/` | Crear periodo | Admin |
| PATCH | `/pagos/periodos-matricula/{id}/` | Actualizar periodo | Admin |
| GET | `/pagos/deudas/` | Listar deudas | Admin |
| GET | `/pagos/deudas/mis-deudas/` | Mis deudas | Apoderado |
| POST | `/pagos/pago-manual/` | Registrar pago manual | Admin |
| GET | `/pagos/reportes/` | Reportes financieros | Admin |
| GET | `/pagos/configuracion-mensualidades/` | Config mensualidades | Admin |
| PATCH | `/pagos/configuracion-mensualidades/` | Actualizar config | Admin |

### 🛍️ Tienda (`/api/tienda/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/tienda/productos/` | Listar productos | Todos |
| GET | `/tienda/productos/{id}/` | Detalle | Todos |
| POST | `/tienda/productos/` | Crear producto | Admin |
| PATCH | `/tienda/productos/{id}/` | Actualizar | Admin |
| DELETE | `/tienda/productos/{id}/` | Eliminar | Admin |
| GET | `/tienda/carrito/` | Mi carrito | Usuario autenticado |
| POST | `/tienda/carrito/agregar/` | Agregar al carrito | Usuario autenticado |
| PATCH | `/tienda/carrito/actualizar/{item_id}/` | Actualizar cantidad | Usuario autenticado |
| DELETE | `/tienda/carrito/eliminar/{item_id}/` | Eliminar del carrito | Usuario autenticado |
| POST | `/tienda/pedidos/` | Crear pedido | Usuario autenticado |
| GET | `/tienda/pedidos/` | Listar pedidos (admin: todos / usuario: solo suyos) | Usuario autenticado |
| GET | `/tienda/pedidos/{id}/` | Detalle pedido | Usuario autenticado |
| PATCH | `/tienda/pedidos/{id}/` | Actualizar estado pedido | Admin |

### 🔔 Notificaciones (`/api/notificaciones/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/notificaciones/` | Mis notificaciones | Usuario autenticado |
| POST | `/notificaciones/` | Crear notificación | Admin |
| PATCH | `/notificaciones/{id}/marcar-leida/` | Marcar leída | Usuario autenticado |
| DELETE | `/notificaciones/{id}/` | Eliminar | Usuario autenticado |
| GET | `/notificaciones/no-leidas/count/` | Cantidad no leídas | Usuario autenticado |

### 📊 Ranking (`/api/ranking/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/ranking/` | Ranking público | Todos |
| GET | `/ranking/atleta/{id}/` | Ranking de atleta | Todos |
| POST | `/ranking/` | Crear/actualizar | Admin |
| PATCH | `/ranking/{id}/` | Actualizar | Admin |
| DELETE | `/ranking/{id}/` | Eliminar | Admin |

### 🏠 Landing Page (`/api/landing/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/landing/datos/` | Datos del landing | Todos |
| PATCH | `/landing/datos/` | Actualizar datos | Admin |
| GET | `/landing/entrenadores/` | Entrenadores | Todos |
| GET | `/landing/eventos/` | Próximos eventos | Todos |
| GET | `/landing/estadisticas/` | Estadísticas club | Todos |

### 👤 Usuarios (`/api/usuarios/`)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/usuarios/` | Listar usuarios | Admin |
| GET | `/usuarios/{id}/` | Detalle | Admin |
| PATCH | `/usuarios/{id}/` | Actualizar | Admin |
| DELETE | `/usuarios/{id}/` | Eliminar | Admin |
| PATCH | `/usuarios/{id}/cambiar-rol/` | Cambiar rol | Admin |

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación JWT

El frontend está configurado para trabajar con **Django SimpleJWT**:

1. **Login**: Usuario envía `email` + `password` → Backend devuelve `access` + `refresh` tokens
2. **Storage**: Tokens se guardan en `localStorage`
3. **Requests**: Cada petición incluye automáticamente `Authorization: Bearer <access_token>`
4. **Refresh**: Si el access token expira (401), se refresca automáticamente usando el refresh token
5. **Logout**: Se invalida el refresh token en el backend y se limpian los tokens del localStorage

### Tokens Esperados

```javascript
// Respuesta esperada del endpoint /api/auth/login/
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "apoderado",
    "phone": "+56912345678"
  }
}
```

---

## 👥 Roles de Usuario

El sistema maneja 4 roles con permisos diferenciados:

### 1. **Público** (`role: 'public'`)
- Ver landing page
- Ver tienda pública
- Matricular atletas (se convierte en apoderado tras pagar)

### 2. **Apoderado** (`role: 'apoderado'`)
- Ver y gestionar sus atletas
- Acceso a tienda premium
- Ver horarios de sus atletas
- Pagar mensualidades
- Ver historial de pagos

### 3. **Entrenador** (`role: 'entrenador'`)
- Ver atletas asignados
- Ver horarios de entrenamientos
- Recibir notificaciones

### 4. **Admin** (`role: 'admin'`)
- Acceso completo al Admin Panel
- Gestión de usuarios, atletas, equipos
- Configuración de matrículas y mensualidades
- Gestión de tienda y productos
- Reportes financieros
- Envío de notificaciones

---

## 🔗 Integración con Django REST Framework

### Configuración Requerida en Django

#### 1. Instalar Django REST Framework + SimpleJWT

```bash
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
```

#### 2. Configurar `settings.py`

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend en desarrollo
    "https://tu-dominio.com",  # Frontend en producción
]

CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# SimpleJWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

#### 3. Estructura de Apps Sugerida

El backend Django debería organizarse en las siguientes apps:

```
backend/
├── users/           # Modelo de usuario customizado + autenticación
├── atletas/         # Modelo de atletas, equipos, certificaciones
├── pagos/           # Matrículas, mensualidades, deudas
├── tienda/          # Productos, carrito, pedidos
├── horarios/        # Horarios de entrenamiento
├── notificaciones/  # Sistema de notificaciones
├── ranking/         # Ranking de atletas
└── landing/         # Datos del landing page
```

---

## 📚 Guía para el Equipo de Backend

### Paso 1: Analizar los Servicios del Frontend

Revisa todos los archivos en `/api/services/` para entender:
- Qué endpoints espera el frontend
- Qué datos se envían en cada petición
- Qué estructura de respuesta se espera

### Paso 2: Crear Modelos Django

Basándote en los servicios, crea los modelos necesarios. Ejemplo:

```python
# models.py en app 'atletas'
class Atleta(models.Model):
    apoderado = models.ForeignKey(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    rut = models.CharField(max_length=12, unique=True)
    fecha_nacimiento = models.DateField()
    division = models.CharField(max_length=50)
    nivel = models.IntegerField()
    equipo = models.ForeignKey('Equipo', on_delete=models.SET_NULL, null=True)
    # ... más campos
```

### Paso 3: Crear Serializers

```python
# serializers.py
from rest_framework import serializers

class AtletaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Atleta
        fields = '__all__'
```

### Paso 4: Crear ViewSets

```python
# views.py
from rest_framework import viewsets
from rest_framework.decorators import action

class AtletaViewSet(viewsets.ModelViewSet):
    queryset = Atleta.objects.all()
    serializer_class = AtletaSerializer
    
    @action(detail=False, methods=['get'])
    def mis_atletas(self, request):
        atletas = Atleta.objects.filter(apoderado=request.user)
        serializer = self.get_serializer(atletas, many=True)
        return Response(serializer.data)
```

### Paso 5: Configurar URLs

```python
# urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'atletas', AtletaViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
```

### Paso 6: Implementar Autenticación SimpleJWT

```python
# urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

---

## ✅ Checklist de Implementación Backend

- [ ] Instalar dependencias (DRF, SimpleJWT, CORS)
- [ ] Configurar CORS y REST Framework en settings.py
- [ ] Crear modelo de User customizado con campo `role`
- [ ] Implementar autenticación JWT (login, refresh, logout)
- [ ] Crear app `atletas` con modelos y endpoints
- [ ] Crear app `pagos` con matrículas y mensualidades
- [ ] Crear app `tienda` con productos y carrito
- [ ] Crear app `equipos` y `horarios`
- [ ] Implementar sistema de notificaciones
- [ ] Implementar ranking
- [ ] Configurar permisos por rol
- [ ] Probar todos los endpoints con el frontend

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## 📞 Contacto y Soporte

Para cualquier duda sobre el frontend, revisar:
- **Componentes**: `/components/`
- **Servicios API**: `/api/services/`
- **Contextos**: `/contexts/`

---

## 📝 Notas Importantes

1. **Todas las funcionalidades actuales del frontend están preservadas** - No se ha eliminado ni modificado lógica existente
2. **La capa de API está lista** - Solo falta conectar con el backend real
3. **Los servicios documentan todos los endpoints esperados** - El equipo de backend puede usarlos como especificación
4. **El frontend funciona actualmente con datos mockeados en localStorage** - Al conectar el backend, reemplazar las llamadas de Context por servicios de API

---

**Fecha de última actualización**: Noviembre 2024  
**Versión del Frontend**: 1.0.0  
**Preparado para integrarse con**: Django REST Framework 3.14+

🐝 **La Colmena** - Reign All Stars