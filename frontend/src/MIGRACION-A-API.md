# 🔄 Guía de Migración de localStorage a API

## 📋 Objetivo

Este documento explica cómo migrar el frontend de Reign All Stars desde su implementación actual con **localStorage** hacia una integración completa con **Django REST Framework**.

---

## 🎯 Estado Actual vs. Estado Objetivo

### ✅ Estado Actual
- Frontend 100% funcional con datos en localStorage
- Todas las operaciones CRUD funcionan localmente
- Sistema de autenticación simulado
- No hay persistencia real de datos

### 🎯 Estado Objetivo
- Frontend conectado a Django REST Framework
- Persistencia real de datos en PostgreSQL/MySQL
- Autenticación JWT con SimpleJWT
- Todas las funcionalidades preservadas

---

## 📊 Componentes que Requieren Migración

### 1. **AuthContext.tsx** → API de Autenticación

#### Actualmente usa:
```typescript
// AuthContext.tsx (líneas 62-96)
const login = async (email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const foundUser = users.find((u: any) => u.email === email);
  // ...
};
```

#### Migrar a:
```typescript
// AuthContext.tsx (migrado)
import { login as apiLogin, logout as apiLogout } from '../api/services/authService';

const login = async (email: string, password: string) => {
  const result = await apiLogin(email, password);
  
  if (result.success) {
    setUser(result.data.user);
    return true;
  }
  
  return false;
};
```

#### Cambios necesarios:
1. Reemplazar `localStorage.getItem('users')` por llamadas a `/api/auth/login/`
2. Reemplazar `localStorage.setItem('user')` por usar tokens JWT
3. El `authService.js` ya maneja el guardado de tokens automáticamente

---

### 2. **Componentes de Gestión** → Servicios API

Cada componente que actualmente usa localStorage debe migrar a su servicio correspondiente:

| Componente | localStorage Key | Servicio API | Método |
|------------|------------------|--------------|--------|
| **AtletasManagement.tsx** | `'matriculas'` | `atletasService` | `obtenerAtletas()` |
| **GestionEquipos.tsx** | `'equipos'` | `equiposService` | `obtenerEquipos()` |
| **GestionHorarios.tsx** | `'horarios'` | `horariosService` | `obtenerHorarios()` |
| **GestionTienda.tsx** | `'productos'` | `tiendaService` | `obtenerProductos()` |
| **MisAtletas.tsx** | `'matriculas'` | `atletasService` | `obtenerMisAtletas()` |
| **MisPagos.tsx** | `'pagos'` | `pagosService` | `obtenerMisPagos()` |
| **CarritoCompras.tsx** | `'carrito'` | `tiendaService` | `obtenerCarrito()` |
| **GestionNotificaciones.tsx** | `'notificaciones'` | `notificacionesService` | `enviarNotificacion()` |

---

## 🔧 Pasos de Migración por Componente

### Ejemplo: AtletasManagement.tsx

#### ❌ Implementación Actual (localStorage)

```typescript
// AtletasManagement.tsx (línea ~50)
const loadAtletas = () => {
  const saved = localStorage.getItem('matriculas');
  if (saved) {
    const atletas = JSON.parse(saved);
    setAtletas(atletas);
  }
};

const handleAgregarAtleta = () => {
  const nuevoAtleta = { id: `atleta-${Date.now()}`, ...formData };
  const updated = [...atletas, nuevoAtleta];
  localStorage.setItem('matriculas', JSON.stringify(updated));
  setAtletas(updated);
};
```

#### ✅ Implementación Migrada (API)

```typescript
// AtletasManagement.tsx (migrado)
import { obtenerAtletas, crearAtleta } from '../api/services/atletasService';
import { useApi } from '../hooks/useApi';

const { data: atletas, loading, execute } = useApi();

const loadAtletas = async () => {
  await execute(() => obtenerAtletas());
};

const handleAgregarAtleta = async () => {
  const result = await execute(() => crearAtleta(formData));
  
  if (result.success) {
    toast.success('Atleta creado correctamente');
    loadAtletas(); // Recargar lista
  } else {
    toast.error(result.error.message);
  }
};
```

#### Cambios aplicados:
1. ✅ Importar servicios desde `/api/services/`
2. ✅ Usar el hook `useApi` para manejar loading/error
3. ✅ Reemplazar `localStorage.getItem/setItem` por llamadas API
4. ✅ Manejar estados de carga y errores
5. ✅ Actualizar UI con `toast` según resultado

---

### Ejemplo: MisAtletas.tsx (Vista de Apoderado)

#### ❌ Implementación Actual

```typescript
// MisAtletas.tsx
const loadAtletas = () => {
  const matriculas = JSON.parse(localStorage.getItem('matriculas') || '[]');
  const misAtletas = matriculas.filter((m: any) => m.userId === user?.id);
  setAtletas(misAtletas);
};
```

#### ✅ Implementación Migrada

```typescript
// MisAtletas.tsx (migrado)
import { obtenerMisAtletas } from '../api/services/atletasService';

const loadAtletas = async () => {
  const result = await obtenerMisAtletas();
  
  if (result.success) {
    setAtletas(result.data);
  } else {
    toast.error('Error al cargar atletas');
  }
};
```

**Ventaja**: El backend filtra automáticamente por usuario usando el JWT, no es necesario filtrar en frontend.

---

## 🔐 Migración de Autenticación

### Cambios en AuthContext.tsx

#### Antes (localStorage):
```typescript
const login = async (email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const foundUser = users.find((u: any) => u.email === email);
  
  if (foundUser) {
    setUser(foundUser);
    localStorage.setItem('user', JSON.stringify(foundUser));
    return true;
  }
  return false;
};
```

#### Después (API + JWT):
```typescript
import { login as apiLogin, getCurrentUser } from '../api/services/authService';

const login = async (email: string, password: string) => {
  const result = await apiLogin(email, password);
  
  if (result.success) {
    // apiLogin ya guardó los tokens en localStorage
    setUser(result.data.user);
    return true;
  }
  
  return false;
};

// Nuevo: Verificar sesión al cargar la app
const checkAuth = async () => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    const result = await getCurrentUser();
    if (result.success) {
      setUser(result.data);
    } else {
      // Token inválido, limpiar sesión
      logout();
    }
  }
};
```

### Actualizar useEffect inicial:
```typescript
useEffect(() => {
  checkAuth(); // Reemplaza la lectura de localStorage
}, []);
```

---

## 📦 Migración de Datos Iniciales

### Usuarios de Prueba

Crear un management command en Django para poblar datos iniciales:

```python
# backend/users/management/commands/seed_users.py
from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        # Admin
        User.objects.create_superuser(
            email='admin@club.com',
            password='admin123',
            name='Administrador'
        )
        
        # Entrenador
        User.objects.create_user(
            email='coach@club.com',
            password='coach123',
            name='Coach María',
            role='entrenador'
        )
        
        # Apoderado
        User.objects.create_user(
            email='apoderado@club.com',
            password='apod123',
            name='Juan Pérez',
            role='apoderado'
        )
```

Ejecutar:
```bash
python manage.py seed_users
```

---

## 🧪 Testing de la Migración

### Checklist de Pruebas

Para cada componente migrado:

- [ ] **Login/Logout funciona**
  - [ ] Login con credenciales correctas devuelve tokens
  - [ ] Login con credenciales incorrectas muestra error
  - [ ] Logout limpia tokens y redirige
  
- [ ] **Operaciones CRUD funcionan**
  - [ ] GET: Listar elementos
  - [ ] POST: Crear nuevo elemento
  - [ ] PATCH: Actualizar elemento
  - [ ] DELETE: Eliminar elemento
  
- [ ] **Permisos por rol**
  - [ ] Admin puede acceder a todo
  - [ ] Apoderado solo ve sus datos
  - [ ] Entrenador solo ve sus equipos
  - [ ] Público solo ve landing page y tienda pública
  
- [ ] **Manejo de errores**
  - [ ] Errores 400 muestran mensaje claro
  - [ ] Errores 401 refrescan token automáticamente
  - [ ] Errores 403 muestran mensaje de permisos
  - [ ] Errores 500 muestran mensaje de servidor

---

## 🔄 Estrategia de Migración Gradual

### Fase 1: Autenticación (1-2 días)
1. Configurar backend con SimpleJWT
2. Migrar AuthContext a API
3. Probar login/logout/refresh

### Fase 2: Módulos Principales (3-5 días)
1. Migrar gestión de atletas
2. Migrar gestión de equipos
3. Migrar sistema de pagos
4. Migrar tienda

### Fase 3: Módulos Secundarios (2-3 días)
1. Migrar horarios
2. Migrar notificaciones
3. Migrar ranking
4. Migrar landing page editable

### Fase 4: Testing y Ajustes (2-3 días)
1. Pruebas de integración
2. Corrección de bugs
3. Optimización de performance
4. Documentación final

---

## ⚠️ Consideraciones Importantes

### 1. **Mantener compatibilidad temporal**

Durante la migración, puedes mantener ambos sistemas:

```typescript
// Función helper para migración gradual
const loadData = async (storageKey: string, apiFunction: () => Promise<any>) => {
  // Intentar cargar desde API
  const result = await apiFunction();
  
  if (result.success) {
    return result.data;
  }
  
  // Fallback a localStorage si API falla
  console.warn('API failed, using localStorage fallback');
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
};
```

### 2. **Limpiar localStorage después de migración**

Agregar función de limpieza:

```typescript
const cleanOldData = () => {
  const keysToRemove = [
    'users', 'matriculas', 'equipos', 'horarios', 
    'productos', 'carrito', 'pagos', 'notificaciones'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Old localStorage data cleaned');
};
```

### 3. **Manejar datos huérfanos**

Algunos datos en localStorage pueden no tener `userId`. Al migrar, asignarlos al usuario actual o descartarlos:

```typescript
const migrateOrphanData = async () => {
  const user = getCurrentUser();
  const oldData = JSON.parse(localStorage.getItem('matriculas') || '[]');
  
  // Filtrar solo datos del usuario actual
  const myData = oldData.filter((item: any) => item.userId === user?.id);
  
  // Migrar a API
  for (const item of myData) {
    await crearAtleta(item);
  }
};
```

---

## 📝 Ejemplo Completo: Migración de GestionEquipos.tsx

### Antes (localStorage):

```typescript
const [equipos, setEquipos] = useState<Equipo[]>([]);

const loadEquipos = () => {
  const saved = localStorage.getItem('equipos');
  if (saved) {
    setEquipos(JSON.parse(saved));
  }
};

const handleCrearEquipo = () => {
  const nuevoEquipo = { id: `equipo-${Date.now()}`, ...formData };
  const updated = [...equipos, nuevoEquipo];
  localStorage.setItem('equipos', JSON.stringify(updated));
  setEquipos(updated);
  toast.success('Equipo creado');
};

const handleEliminarEquipo = (id: string) => {
  const updated = equipos.filter(e => e.id !== id);
  localStorage.setItem('equipos', JSON.stringify(updated));
  setEquipos(updated);
  toast.success('Equipo eliminado');
};
```

### Después (API):

```typescript
import { obtenerEquipos, crearEquipo, eliminarEquipo } from '../api/services/equiposService';
import { useApi } from '../hooks/useApi';

const { 
  data: equipos, 
  loading, 
  error,
  execute 
} = useApi();

const loadEquipos = async () => {
  await execute(() => obtenerEquipos());
};

const handleCrearEquipo = async () => {
  const result = await execute(() => crearEquipo(formData));
  
  if (result.success) {
    toast.success('Equipo creado');
    loadEquipos(); // Recargar lista actualizada
  } else {
    toast.error(result.error.message);
  }
};

const handleEliminarEquipo = async (id: string) => {
  if (!confirm('¿Eliminar equipo?')) return;
  
  const result = await execute(() => eliminarEquipo(id));
  
  if (result.success) {
    toast.success('Equipo eliminado');
    loadEquipos();
  } else {
    toast.error(result.error.message);
  }
};

useEffect(() => {
  loadEquipos();
}, []);

// Renderizar con estados de carga
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error.message} />;
```

---

## ✅ Checklist Final de Migración

### Backend (Django)
- [ ] SimpleJWT configurado
- [ ] CORS configurado
- [ ] Modelos creados
- [ ] Serializers implementados
- [ ] ViewSets con permisos
- [ ] URLs configuradas
- [ ] Datos iniciales cargados

### Frontend (React)
- [ ] `.env` configurado con `VITE_API_URL`
- [ ] `AuthContext` migrado a API
- [ ] Todos los componentes usando servicios API
- [ ] localStorage limpiado
- [ ] Manejo de errores implementado
- [ ] Estados de carga implementados
- [ ] Testing completo realizado

---

## 🚀 Comandos Útiles

```bash
# Backend (Django)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (React)
npm run dev

# Testing
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@club.com", "password": "admin123"}'
```

---

**Duración estimada total de migración**: 8-12 días de desarrollo + testing

**Riesgo**: Bajo (frontend ya funciona, solo se cambia la fuente de datos)

**Beneficios**: Persistencia real, multi-usuario, escalabilidad, seguridad

🐝 **La Colmena** - Reign All Stars
