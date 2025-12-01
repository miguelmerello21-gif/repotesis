# 🚀 Inicio Rápido - Reign All Stars

## 📋 Para Desarrolladores Frontend

### 1. Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd reign-all-stars-frontend

# Instalar dependencias
npm install
```

### 2. Configuración

```bash
# Copiar archivo de entorno
cp .env.example .env

# Editar .env
# VITE_API_URL=http://localhost:8000/api
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Usuario de Prueba

**Estado actual**: El frontend funciona con localStorage (datos mock)

Para probar el sistema:
- Cualquier email/contraseña funciona para login
- Registrar nuevo usuario crea cuenta automáticamente
- Los datos se guardan en el navegador (localStorage)

---

## 📋 Para Desarrolladores Backend

### 1. Leer Documentación

**IMPORTANTE**: Antes de comenzar, lee estos archivos en orden:

1. `README-FRONTEND.md` - Entender la estructura del frontend
2. `BACKEND-SPEC.md` - Especificación completa del backend
3. `/api/services/` - Ver todos los endpoints esperados

### 2. Setup Django

```bash
# Crear proyecto Django
django-admin startproject reign_backend
cd reign_backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers pillow
```

### 3. Configurar Django

Editar `settings.py` según `BACKEND-SPEC.md`:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Apps del proyecto
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
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

### 4. Crear Apps

```bash
python manage.py startapp users
python manage.py startapp atletas
python manage.py startapp pagos
python manage.py startapp tienda
python manage.py startapp horarios
python manage.py startapp notificaciones
python manage.py startapp ranking
python manage.py startapp landing
```

### 5. Implementar Modelos

Seguir especificación en `BACKEND-SPEC.md` para cada app.

### 6. Ejecutar Migraciones

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 7. Ejecutar Servidor

```bash
python manage.py runserver
```

El backend estará disponible en `http://localhost:8000`

---

## 📋 Para Codex / IA

### Contexto del Proyecto

**Objetivo**: Implementar backend Django REST Framework para plataforma de gestión de club de cheerleading.

**Frontend**: Completamente funcional, con capa de API preparada en `/api/`

**Backend**: Por implementar según especificación en `BACKEND-SPEC.md`

### Archivos Clave para Analizar

1. **Estructura de API**: `/api/services/*.js` - 10 archivos de servicios
2. **Especificación Backend**: `BACKEND-SPEC.md` - Modelos y endpoints completos
3. **Documentación**: `README-FRONTEND.md` - Información detallada

### Apps Django a Crear

Prioridad alta (Fase 1):
1. `users` - Autenticación JWT
2. `atletas` - Gestión de atletas
3. `pagos` - Matrículas y mensualidades

Prioridad media (Fase 2):
4. `tienda` - E-commerce
5. `horarios` - Gestión de horarios
6. `notificaciones` - Sistema de notificaciones

Prioridad baja (Fase 3):
7. `ranking` - Sistema de ranking
8. `landing` - Datos del landing page

### Modelos Principales

Ver especificación completa en `BACKEND-SPEC.md`, sección "Estructura de Apps Django Requeridas"

Modelos críticos:
- **User** (users app) - Usuario con campo `role`
- **Atleta** (atletas app) - Atleta con categorías de cheerleading
- **Equipo** (atletas app) - Equipos de competencia
- **Matricula** (pagos app) - Registro de matrículas
- **Mensualidad** (pagos app) - Pagos mensuales
- **Producto** (tienda app) - Catálogo de productos

### Endpoints Esperados

**Total**: 100+ endpoints documentados en `/api/services/`

**Ejemplo - Autenticación** (`/api/services/authService.js`):
- POST `/api/auth/login/`
- POST `/api/auth/register/`
- POST `/api/auth/logout/`
- POST `/api/auth/token/refresh/`
- GET `/api/auth/me/`

Ver todos los endpoints en los archivos de servicios.

### Permisos

4 roles con permisos diferenciados:
- `public` - Acceso limitado (landing, tienda básica)
- `apoderado` - Gestión de sus atletas y pagos
- `entrenador` - Vista de atletas asignados
- `admin` - Control total del sistema

---

## 📚 Documentación Disponible

### Documentos de Referencia

| Archivo | Descripción | Audiencia |
|---------|-------------|-----------|
| `README-FRONTEND.md` | Documentación técnica completa | Frontend + Backend |
| `BACKEND-SPEC.md` | Especificación del backend Django | Backend + IA |
| `GUIA-MIGRACION-API.md` | Guía de integración | Frontend |
| `RESUMEN-PROYECTO.md` | Resumen ejecutivo | Todos |
| `INICIO-RAPIDO.md` | Este archivo | Todos |

### Estructura de Código

```
/api/                     # Capa de API preparada
  axios.js                # Cliente HTTP con JWT
  index.js                # Exportaciones
  services/               # 10 servicios organizados
    authService.js        # 8 endpoints de autenticación
    atletasService.js     # 9 endpoints de atletas
    equiposService.js     # 7 endpoints de equipos
    horariosService.js    # 5 endpoints de horarios
    landingService.js     # 5 endpoints de landing
    notificacionesService.js  # 5 endpoints de notificaciones
    pagosService.js       # 12 endpoints de pagos
    rankingService.js     # 5 endpoints de ranking
    tiendaService.js      # 12 endpoints de tienda
    usuariosService.js    # 5 endpoints de usuarios
```

---

## ✅ Checklist Rápido

### Frontend
- [ ] Clonar repositorio
- [ ] Instalar dependencias (`npm install`)
- [ ] Copiar `.env.example` a `.env`
- [ ] Ejecutar en desarrollo (`npm run dev`)
- [ ] Verificar que funciona (localhost:5173)

### Backend
- [ ] Leer `BACKEND-SPEC.md`
- [ ] Crear proyecto Django
- [ ] Instalar dependencias (DRF, SimpleJWT, CORS)
- [ ] Configurar settings.py
- [ ] Crear 8 apps Django
- [ ] Implementar modelos
- [ ] Crear serializers y views
- [ ] Configurar URLs
- [ ] Ejecutar migraciones
- [ ] Probar endpoints con frontend

### Integración
- [ ] Configurar CORS en Django
- [ ] Apuntar frontend a backend (VITE_API_URL)
- [ ] Probar login/registro
- [ ] Migrar AuthContext a API
- [ ] Migrar componentes gradualmente
- [ ] Testing completo

---

## 🆘 Solución de Problemas

### Frontend no se conecta al backend

```bash
# Verificar que el backend está corriendo
curl http://localhost:8000/api/

# Verificar variable de entorno
echo $VITE_API_URL

# Verificar CORS en Django
# settings.py debe incluir 'http://localhost:5173' en CORS_ALLOWED_ORIGINS
```

### Error 401 Unauthorized

```bash
# Verificar que el token se está enviando
# Abrir DevTools → Network → Headers
# Debe incluir: Authorization: Bearer <token>

# Verificar configuración JWT en Django
# settings.py → SIMPLE_JWT
```

### Error CORS

```bash
# Instalar django-cors-headers
pip install django-cors-headers

# Agregar a INSTALLED_APPS y MIDDLEWARE
# Configurar CORS_ALLOWED_ORIGINS
```

---

## 🎯 Próximos Pasos

1. **Frontend**: Ya está listo ✅
2. **Backend**: Implementar según `BACKEND-SPEC.md`
3. **Integración**: Seguir `GUIA-MIGRACION-API.md`
4. **Testing**: Probar todos los flujos
5. **Deployment**: Subir a producción

---

## 📞 Recursos Adicionales

- **Documentación Django**: https://docs.djangoproject.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **SimpleJWT**: https://django-rest-framework-simplejwt.readthedocs.io/
- **React**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

🐝 **La Colmena** - Reign All Stars  
¡Bienvenido al proyecto!
