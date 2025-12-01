# ✅ Checklist de Implementación - Reign All Stars

## 📋 Uso de este Documento

Este checklist guía paso a paso la implementación del backend y la integración completa del sistema.

---

## 🎯 FASE 0: Preparación del Entorno

### Backend - Setup Inicial

- [ ] **Instalar Python 3.10+**
  ```bash
  python --version  # Verificar versión
  ```

- [ ] **Crear entorno virtual**
  ```bash
  python -m venv venv
  source venv/bin/activate  # Linux/Mac
  venv\Scripts\activate     # Windows
  ```

- [ ] **Instalar Django y dependencias**
  ```bash
  pip install django djangorestframework djangorestframework-simplejwt
  pip install django-cors-headers psycopg2-binary pillow
  pip install python-decouple  # Para variables de entorno
  ```

- [ ] **Crear proyecto Django**
  ```bash
  django-admin startproject config .
  ```

- [ ] **Crear archivo `.env` para backend**
  ```env
  SECRET_KEY=tu-secret-key-super-segura
  DEBUG=True
  DB_NAME=reign_all_stars
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_HOST=localhost
  DB_PORT=5432
  ALLOWED_HOSTS=localhost,127.0.0.1
  CORS_ALLOWED_ORIGINS=http://localhost:5173
  ```

- [ ] **Configurar PostgreSQL**
  ```bash
  # Crear base de datos
  createdb reign_all_stars
  ```

### Frontend - Verificación

- [ ] **Verificar que Node.js está instalado**
  ```bash
  node --version  # Debe ser 16+
  npm --version
  ```

- [ ] **Instalar dependencias del frontend**
  ```bash
  npm install
  ```

- [ ] **Crear archivo `.env` para frontend**
  ```bash
  cp .env.example .env
  ```

- [ ] **Configurar `.env` del frontend**
  ```env
  VITE_API_URL=http://localhost:8000/api
  VITE_NODE_ENV=development
  VITE_ENABLE_API_LOGS=true
  ```

- [ ] **Verificar que el frontend corre**
  ```bash
  npm run dev
  # Abrir http://localhost:5173
  ```

---

## 🎯 FASE 1: App Users + Autenticación

### 1.1 Crear App Users

- [ ] **Crear app `users`**
  ```bash
  python manage.py startapp users
  ```

- [ ] **Agregar `users` a INSTALLED_APPS** (settings.py)

- [ ] **Configurar AUTH_USER_MODEL** (settings.py)
  ```python
  AUTH_USER_MODEL = 'users.User'
  ```

### 1.2 Modelo User

- [ ] **Crear modelo User en `users/models.py`**
  - [ ] Hereda de AbstractUser
  - [ ] Campo `email` como USERNAME_FIELD
  - [ ] Campo `role` con choices
  - [ ] Campos adicionales (phone, rut, etc.)
  - Ver `SPEC-BACKEND-COMPLETA.md` sección "Modelo: User"

- [ ] **Crear modelo CustomRole**

- [ ] **Crear modelo PasswordReset**

- [ ] **Crear y aplicar migraciones**
  ```bash
  python manage.py makemigrations users
  python manage.py migrate
  ```

### 1.3 Serializers

- [ ] **Crear `users/serializers.py`**
  - [ ] UserSerializer
  - [ ] UserCreateSerializer (para registro)
  - [ ] UserUpdateSerializer
  - [ ] PasswordResetSerializer
  - [ ] PasswordResetConfirmSerializer

### 1.4 Views

- [ ] **Crear `users/views.py`**
  - [ ] RegisterView (POST)
  - [ ] CurrentUserView (GET /api/auth/me/)
  - [ ] UpdateProfileView (PATCH /api/auth/me/)
  - [ ] PasswordResetRequestView
  - [ ] PasswordResetConfirmView

### 1.5 URLs

- [ ] **Crear `users/urls.py`**
  ```python
  from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
  
  urlpatterns = [
      path('login/', TokenObtainPairView.as_view()),
      path('token/refresh/', TokenRefreshView.as_view()),
      path('register/', RegisterView.as_view()),
      path('me/', CurrentUserView.as_view()),
      # ... más endpoints
  ]
  ```

- [ ] **Incluir en `config/urls.py`**
  ```python
  urlpatterns = [
      path('admin/', admin.site.urls),
      path('api/auth/', include('users.urls')),
  ]
  ```

### 1.6 Configurar SimpleJWT

- [ ] **Configurar SIMPLE_JWT en settings.py**
  ```python
  SIMPLE_JWT = {
      'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
      'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
      # ... más configuración
  }
  ```

- [ ] **Agregar `rest_framework_simplejwt.token_blacklist` a INSTALLED_APPS**

- [ ] **Migrar blacklist**
  ```bash
  python manage.py migrate
  ```

### 1.7 Testing de Autenticación

- [ ] **Crear superusuario**
  ```bash
  python manage.py createsuperuser
  ```

- [ ] **Probar login con curl/Postman**
  ```bash
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@club.com", "password": "admin123"}'
  ```

- [ ] **Verificar que devuelve access y refresh tokens**

- [ ] **Probar refresh token**
  ```bash
  curl -X POST http://localhost:8000/api/auth/token/refresh/ \
    -H "Content-Type: application/json" \
    -d '{"refresh": "TOKEN_AQUI"}'
  ```

- [ ] **Probar registro de nuevo usuario**

### 1.8 Integración Frontend

- [ ] **Modificar AuthContext.tsx para usar API**
  - Ver `MIGRACION-A-API.md` sección "Migración de Autenticación"

- [ ] **Probar login desde frontend**

- [ ] **Verificar que tokens se guardan en localStorage**

- [ ] **Probar logout**

- [ ] **Probar refresh automático al expirar token**

---

## 🎯 FASE 2: App Atletas + Equipos

### 2.1 Crear Apps

- [ ] **Crear app `atletas`**
  ```bash
  python manage.py startapp atletas
  ```

- [ ] **Agregar a INSTALLED_APPS**

### 2.2 Modelos

- [ ] **Crear modelo Atleta**
  - Ver `SPEC-BACKEND-COMPLETA.md` sección "Modelo: Atleta"

- [ ] **Crear modelo Equipo**

- [ ] **Crear modelo CertificacionAtleta**

- [ ] **Crear migraciones y migrar**
  ```bash
  python manage.py makemigrations atletas
  python manage.py migrate
  ```

### 2.3 Serializers

- [ ] **Crear `atletas/serializers.py`**
  - [ ] AtletaSerializer
  - [ ] AtletaListSerializer
  - [ ] AtletaDetailSerializer
  - [ ] EquipoSerializer
  - [ ] CertificacionAtletaSerializer

### 2.4 Views

- [ ] **Crear `atletas/views.py`**
  - [ ] AtletaViewSet con action `mis_atletas`
  - [ ] EquipoViewSet
  - [ ] CertificacionAtletaViewSet

### 2.5 Permisos

- [ ] **Crear `atletas/permissions.py`**
  - [ ] IsApoderadoOrAdmin
  - [ ] IsOwnerOrAdmin

- [ ] **Aplicar permisos a ViewSets**

### 2.6 URLs

- [ ] **Crear `atletas/urls.py` con router**

- [ ] **Incluir en config/urls.py**
  ```python
  path('api/atletas/', include('atletas.urls')),
  path('api/equipos/', include('atletas.urls')),
  ```

### 2.7 Testing

- [ ] **Crear atleta desde admin**

- [ ] **Probar GET /api/atletas/** (como admin)

- [ ] **Probar GET /api/atletas/mis-atletas/** (como apoderado)

- [ ] **Probar POST /api/atletas/** (crear atleta)

### 2.8 Integración Frontend

- [ ] **Modificar AtletasManagement.tsx para usar API**

- [ ] **Modificar MisAtletas.tsx para usar API**

- [ ] **Probar CRUD completo desde frontend**

---

## 🎯 FASE 3: App Pagos

### 3.1 Crear App

- [ ] **Crear app `pagos`**

- [ ] **Agregar a INSTALLED_APPS**

### 3.2 Modelos

- [ ] **Crear PeriodoMatricula**

- [ ] **Crear Matricula**

- [ ] **Crear ConfiguracionMensualidad**

- [ ] **Crear Mensualidad**

- [ ] **Crear PagoManual**

- [ ] **Migrar**

### 3.3 Serializers, Views, URLs

- [ ] **Crear serializers**

- [ ] **Crear ViewSets**

- [ ] **Configurar URLs**

### 3.4 Testing

- [ ] **Crear periodo de matrícula**

- [ ] **Probar matrícula de atleta**

- [ ] **Verificar conversión público → apoderado**

### 3.5 Integración Frontend

- [ ] **Modificar MatriculaForm.tsx**

- [ ] **Modificar MisPagos.tsx**

- [ ] **Probar flujo completo de matrícula**

---

## 🎯 FASE 4: App Tienda

### 4.1 Crear App

- [ ] **Crear app `tienda`**

- [ ] **Agregar a INSTALLED_APPS**

### 4.2 Modelos

- [ ] **Crear Producto**

- [ ] **Crear VarianteProducto**

- [ ] **Crear Carrito**

- [ ] **Crear ItemCarrito**

- [ ] **Crear Pedido**

- [ ] **Crear ItemPedido**

- [ ] **Migrar**

### 4.3 Serializers, Views, URLs

- [ ] **Crear serializers**

- [ ] **Crear ViewSets**

- [ ] **Configurar URLs**

### 4.4 Testing

- [ ] **Crear productos desde admin**

- [ ] **Probar agregar al carrito**

- [ ] **Probar crear pedido**

### 4.5 Integración Frontend

- [ ] **Modificar TiendaPublica.tsx**

- [ ] **Modificar TiendaApoderado.tsx**

- [ ] **Modificar CarritoCompras.tsx**

- [ ] **Probar flujo e-commerce completo**

---

## 🎯 FASE 5: Apps Secundarias

### 5.1 App Horarios

- [ ] **Crear app**

- [ ] **Crear modelos (Horario, Asistencia)**

- [ ] **Implementar endpoints**

- [ ] **Integrar con GestionHorarios.tsx**

- [ ] **Integrar con AsistenciaEntrenador.tsx**

### 5.2 App Notificaciones

- [ ] **Crear app**

- [ ] **Crear modelo Notificacion**

- [ ] **Implementar endpoints**

- [ ] **Integrar con GestionNotificaciones.tsx**

- [ ] **Integrar con MisNotificaciones.tsx**

### 5.3 App Ranking

- [ ] **Crear app**

- [ ] **Crear modelo RankingAtleta**

- [ ] **Implementar endpoints**

- [ ] **Integrar con GestionRanking.tsx**

- [ ] **Integrar con RankingPublico.tsx**

### 5.4 App Landing

- [ ] **Crear app**

- [ ] **Crear modelos (DatosLanding, FotoCarrusel, etc.)**

- [ ] **Implementar endpoints**

- [ ] **Integrar con GestionLanding.tsx**

- [ ] **Integrar con LandingPage.tsx**

---

## 🎯 FASE 6: Permisos y Seguridad

### 6.1 Permisos Personalizados

- [ ] **Crear `utils/permissions.py`**

- [ ] **Implementar clases de permisos**
  - [ ] IsPublicOrAuthenticated
  - [ ] IsApoderadoOrAdmin
  - [ ] IsEntrenadorOrAdmin
  - [ ] IsAdminUser
  - [ ] IsOwnerOrAdmin

- [ ] **Aplicar permisos a todos los ViewSets**

### 6.2 Throttling (Rate Limiting)

- [ ] **Configurar DEFAULT_THROTTLE_CLASSES en settings**

- [ ] **Configurar DEFAULT_THROTTLE_RATES**

### 6.3 Validaciones

- [ ] **Validar datos en serializers**

- [ ] **Agregar validaciones custom donde sea necesario**

### 6.4 CORS

- [ ] **Verificar configuración de CORS**

- [ ] **Probar desde frontend en diferentes puertos**

---

## 🎯 FASE 7: Testing

### 7.1 Tests Unitarios

- [ ] **Crear tests para app users**
  ```bash
  python manage.py test users
  ```

- [ ] **Crear tests para app atletas**

- [ ] **Crear tests para app pagos**

- [ ] **Crear tests para app tienda**

- [ ] **Crear tests para apps secundarias**

### 7.2 Tests de Integración

- [ ] **Probar flujo completo de matrícula**

- [ ] **Probar flujo completo de e-commerce**

- [ ] **Probar autenticación end-to-end**

### 7.3 Testing Manual

- [ ] **Login como cada tipo de usuario**

- [ ] **Verificar permisos por rol**

- [ ] **Probar todas las funcionalidades principales**

---

## 🎯 FASE 8: Migración Completa del Frontend

### 8.1 Componentes Principales

- [ ] **AuthContext.tsx** → usar authService
- [ ] **AdminPanel.tsx** → usar servicios API
- [ ] **AtletasManagement.tsx** → usar atletasService
- [ ] **GestionEquipos.tsx** → usar equiposService
- [ ] **GestionHorarios.tsx** → usar horariosService
- [ ] **GestionTienda.tsx** → usar tiendaService
- [ ] **GestionNotificaciones.tsx** → usar notificacionesService
- [ ] **MisAtletas.tsx** → usar atletasService
- [ ] **MisPagos.tsx** → usar pagosService
- [ ] **MatriculaForm.tsx** → usar pagosService
- [ ] **TiendaPublica.tsx** → usar tiendaService
- [ ] **TiendaApoderado.tsx** → usar tiendaService
- [ ] **CarritoCompras.tsx** → usar tiendaService
- [ ] **PerfilEntrenador.tsx** → usar servicios API
- [ ] **AsistenciaEntrenador.tsx** → usar horariosService

### 8.2 Limpieza

- [ ] **Eliminar todas las referencias a localStorage para datos**

- [ ] **Mantener solo tokens en localStorage**

- [ ] **Ejecutar función de limpieza**
  ```javascript
  cleanOldData(); // Definida en MIGRACION-A-API.md
  ```

---

## 🎯 FASE 9: Optimización y Deploy

### 9.1 Optimización Backend

- [ ] **Configurar STATIC_ROOT y MEDIA_ROOT**

- [ ] **Configurar almacenamiento de archivos (S3, etc.)**

- [ ] **Optimizar queries (select_related, prefetch_related)**

- [ ] **Agregar índices a campos frecuentemente buscados**

### 9.2 Optimización Frontend

- [ ] **Build de producción**
  ```bash
  npm run build
  ```

- [ ] **Verificar que no hay console.logs**

- [ ] **Optimizar imágenes**

### 9.3 Configuración de Producción

- [ ] **Configurar DEBUG=False en backend**

- [ ] **Configurar ALLOWED_HOSTS correctamente**

- [ ] **Configurar CORS_ALLOWED_ORIGINS para dominio real**

- [ ] **Configurar SECRET_KEY segura**

- [ ] **Configurar base de datos de producción**

### 9.4 Deploy

- [ ] **Backend**: Deploy en servidor (Heroku, DigitalOcean, AWS, etc.)

- [ ] **Frontend**: Deploy en Vercel/Netlify/similar

- [ ] **Configurar variables de entorno en producción**

- [ ] **Verificar que frontend apunta a backend correcto**

### 9.5 Testing en Producción

- [ ] **Probar login**

- [ ] **Probar creación de atleta**

- [ ] **Probar matrícula**

- [ ] **Probar tienda**

- [ ] **Verificar que todos los flujos funcionan**

---

## 🎯 FASE 10: Documentación y Entrega

### 10.1 Documentación de API

- [ ] **Instalar drf-spectacular o similar para docs automáticas**
  ```bash
  pip install drf-spectacular
  ```

- [ ] **Configurar en settings**

- [ ] **Generar documentación OpenAPI/Swagger**

- [ ] **Verificar en /api/docs/**

### 10.2 Documentación de Usuario

- [ ] **Crear manual de usuario (admin)**

- [ ] **Crear manual de usuario (apoderado)**

- [ ] **Crear manual de usuario (entrenador)**

### 10.3 Documentación Técnica

- [ ] **Actualizar README con instrucciones de deploy**

- [ ] **Documentar arquitectura final**

- [ ] **Documentar configuración de entorno**

### 10.4 Entrega

- [ ] **Crear repositorio Git**

- [ ] **Crear .gitignore adecuado**

- [ ] **Hacer commit inicial**

- [ ] **Crear release v1.0.0**

- [ ] **Entregar credenciales y accesos**

---

## 📊 Resumen de Progreso

### Frontend
- [x] Componentes implementados: 45+
- [x] Servicios API preparados: 10
- [x] Documentación: Completa

### Backend
- [ ] Apps creadas: 0/8
- [ ] Modelos implementados: 0/25
- [ ] Endpoints implementados: 0/60
- [ ] Tests escritos: 0

### Integración
- [ ] AuthContext migrado a API
- [ ] Componentes migrados a API: 0/15
- [ ] localStorage limpiado
- [ ] Testing end-to-end completado

---

## 🎉 Checklist de Finalización

Proyecto completado cuando:

- [x] Frontend 100% funcional con localStorage ✅
- [ ] Backend Django REST Framework desplegado
- [ ] Todos los endpoints implementados
- [ ] Frontend migrado a API
- [ ] Tests pasando (>80% coverage)
- [ ] Documentación completa
- [ ] Deploy en producción
- [ ] Usuarios pueden usar el sistema end-to-end

---

**Instrucciones de uso**:
1. Seguir las fases en orden
2. Marcar cada item al completarlo
3. No avanzar a la siguiente fase sin completar la anterior
4. Consultar los documentos de referencia según sea necesario

**Documentos de referencia**:
- `SPEC-BACKEND-COMPLETA.md` - Especificación técnica detallada
- `README-FRONTEND.md` - Documentación del frontend
- `MIGRACION-A-API.md` - Guía de migración
- `RESUMEN-EJECUTIVO.md` - Visión general

🐝 **La Colmena** - Reign All Stars
