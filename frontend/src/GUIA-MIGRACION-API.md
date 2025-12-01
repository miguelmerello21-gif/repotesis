# 🔄 Guía de Migración: LocalStorage → API Backend

## 📋 Introducción

Este documento explica cómo migrar el frontend actual (que usa `localStorage` y Context API) para conectarse con el backend Django REST Framework.

---

## 🎯 Estado Actual vs. Estado Final

### Estado Actual (LocalStorage)
```javascript
// AuthContext.tsx - Actualmente
const login = (email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    setUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};
```

### Estado Final (API Backend)
```javascript
// AuthContext.tsx - Con API
import { authService } from '../api';

const login = async (email: string, password: string) => {
  const result = await authService.login(email, password);
  if (result.success) {
    setUser(result.data.user);
    // Los tokens ya se guardan automáticamente en el servicio
  } else {
    throw new Error(result.error.message);
  }
};
```

---

## 📝 Pasos de Migración

### 1. Actualizar AuthContext.tsx

**Archivo**: `/contexts/AuthContext.tsx`

**Cambios necesarios**:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'public' | 'apoderado' | 'entrenador' | 'admin';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          // Verificar que el token sea válido obteniendo el perfil actual
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.data);
          } else {
            // Token inválido, limpiar
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.data.user);
      } else {
        throw new Error(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setUser(result.data.user);
      } else {
        throw new Error(result.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

### 2. Actualizar Componente de Login (AuthModal.tsx)

**Archivo**: `/components/AuthModal.tsx`

**Cambios necesarios**:

```typescript
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api';
import { toast } from 'sonner@2.0.3';

// En la función handleLogin:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    await login(email, password);
    toast.success('¡Bienvenido a La Colmena! 🐝');
    onClose();
  } catch (error: any) {
    toast.error(error.message || 'Error al iniciar sesión');
  } finally {
    setIsLoading(false);
  }
};

// En la función handleRegister:
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    await register({ name, email, password, phone });
    toast.success('¡Cuenta creada exitosamente! 🐝');
    onClose();
  } catch (error: any) {
    toast.error(error.message || 'Error al registrarse');
  } finally {
    setIsLoading(false);
  }
};

// Para reset de contraseña:
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    const result = await authService.requestPasswordReset(email);
    if (result.success) {
      toast.success('Código de recuperación enviado a tu email');
      setMode('reset');
    } else {
      toast.error(result.error.message);
    }
  } finally {
    setIsLoading(false);
  }
};
```

---

### 3. Actualizar Componente de Atletas (MisAtletas.tsx)

**Archivo**: `/components/MisAtletas.tsx`

**Antes (LocalStorage)**:
```typescript
const atletas = JSON.parse(localStorage.getItem('atletas') || '[]')
  .filter(a => a.apoderadoId === user.id);
```

**Después (API)**:
```typescript
import { atletasService } from '../api';
import { useState, useEffect } from 'react';

const MisAtletas = () => {
  const [atletas, setAtletas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarAtletas = async () => {
      setIsLoading(true);
      const result = await atletasService.obtenerMisAtletas();
      if (result.success) {
        setAtletas(result.data);
      } else {
        toast.error('Error al cargar atletas');
      }
      setIsLoading(false);
    };

    cargarAtletas();
  }, []);

  if (isLoading) return <div>Cargando...</div>;

  return (
    // ... resto del componente
  );
};
```

---

### 4. Actualizar Componente de Matrícula (MatriculaForm.tsx)

**Archivo**: `/components/MatriculaForm.tsx`

**Cambios necesarios**:

```typescript
import { atletasService, pagosService } from '../api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. Crear el atleta
    const atletaResult = await atletasService.crearAtleta({
      nombre: nombreAtleta,
      rut: rutAtleta,
      fecha_nacimiento: fechaNacimiento,
      division: categoriaSeleccionada.division,
      nivel: categoriaSeleccionada.nivel,
      // ... más campos
    });

    if (!atletaResult.success) {
      throw new Error(atletaResult.error.message);
    }

    // 2. Registrar el pago de matrícula
    const pagoResult = await pagosService.registrarMatricula({
      atleta_id: atletaResult.data.id,
      monto: costoMatricula,
      metodo_pago: metodoPago,
    });

    if (!pagoResult.success) {
      throw new Error(pagoResult.error.message);
    }

    toast.success('¡Matrícula registrada exitosamente! 🐝');
    onSuccess();
  } catch (error: any) {
    toast.error(error.message || 'Error al matricular');
  } finally {
    setIsLoading(false);
  }
};
```

---

### 5. Actualizar Componente de Tienda (TiendaPublica.tsx / TiendaApoderado.tsx)

**Archivo**: `/components/TiendaPublica.tsx`

**Cambios necesarios**:

```typescript
import { tiendaService } from '../api';

const TiendaPublica = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      
      // Cargar productos
      const productosResult = await tiendaService.obtenerProductos('publico');
      if (productosResult.success) {
        setProductos(productosResult.data);
      }

      // Si está autenticado, cargar carrito
      if (user) {
        const carritoResult = await tiendaService.obtenerCarrito();
        if (carritoResult.success) {
          setCarrito(carritoResult.data.items || []);
        }
      }

      setIsLoading(false);
    };

    cargarDatos();
  }, [user]);

  const agregarAlCarrito = async (producto: any) => {
    const result = await tiendaService.agregarAlCarrito(producto.id, 1, tallaSeleccionada);
    
    if (result.success) {
      toast.success('Producto agregado al carrito 🛍️');
      setCarrito(result.data.items);
    } else {
      toast.error(result.error.message);
    }
  };

  // ... resto del componente
};
```

---

### 6. Actualizar Admin Panel - Gestión de Usuarios

**Archivo**: `/components/UsersManagement.tsx`

**Cambios necesarios**:

```typescript
import { usuariosService } from '../api';

const UsersManagement = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setIsLoading(true);
    const result = await usuariosService.listarUsuarios();
    if (result.success) {
      setUsuarios(result.data);
    }
    setIsLoading(false);
  };

  const cambiarRol = async (usuarioId: number, nuevoRol: string) => {
    const result = await usuariosService.cambiarRolUsuario(usuarioId, nuevoRol);
    
    if (result.success) {
      toast.success('Rol actualizado correctamente');
      cargarUsuarios(); // Recargar lista
    } else {
      toast.error(result.error.message);
    }
  };

  const eliminarUsuario = async (usuarioId: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    const result = await usuariosService.eliminarUsuario(usuarioId);
    
    if (result.success) {
      toast.success('Usuario eliminado');
      cargarUsuarios();
    } else {
      toast.error(result.error.message);
    }
  };

  // ... resto del componente
};
```

---

### 7. Actualizar LandingDataContext

**Archivo**: `/contexts/LandingDataContext.tsx`

**Cambios necesarios**:

```typescript
import { landingService } from '../api';

export const LandingDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [landingData, setLandingData] = useState<LandingData>(defaultLandingData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);
      const result = await landingService.obtenerDatosLanding();
      
      if (result.success) {
        setLandingData(result.data);
      }
      
      setIsLoading(false);
    };

    cargarDatos();
  }, []);

  const actualizarLandingData = async (nuevosDatos: Partial<LandingData>) => {
    const result = await landingService.actualizarDatosLanding(nuevosDatos);
    
    if (result.success) {
      setLandingData(result.data);
      return true;
    }
    
    return false;
  };

  return (
    <LandingDataContext.Provider value={{ landingData, actualizarLandingData, isLoading }}>
      {children}
    </LandingDataContext.Provider>
  );
};
```

---

## 🔍 Patrón General de Migración

Para cualquier componente que use localStorage, sigue este patrón:

### Antes:
```typescript
const datos = JSON.parse(localStorage.getItem('clave') || '[]');
```

### Después:
```typescript
const [datos, setDatos] = useState([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const cargarDatos = async () => {
    setIsLoading(true);
    const result = await servicio.obtenerDatos();
    if (result.success) {
      setDatos(result.data);
    } else {
      toast.error(result.error.message);
    }
    setIsLoading(false);
  };

  cargarDatos();
}, []);
```

---

## ⚠️ Consideraciones Importantes

### 1. Manejo de Errores
Siempre manejar los errores de la API:

```typescript
const result = await servicio.funcion();
if (!result.success) {
  toast.error(result.error.message);
  return;
}
// Continuar con result.data
```

### 2. Loading States
Agregar estados de carga para mejor UX:

```typescript
{isLoading ? (
  <div>Cargando...</div>
) : (
  // Contenido
)}
```

### 3. Actualizar después de Mutaciones
Después de crear/actualizar/eliminar, recargar los datos:

```typescript
const crear = async () => {
  const result = await servicio.crear(datos);
  if (result.success) {
    await cargarDatos(); // Recargar lista
  }
};
```

### 4. Tokens JWT
Los tokens se manejan automáticamente:
- Se guardan en `localStorage` después del login
- Se incluyen en cada petición automáticamente
- Se refrescan automáticamente cuando expiran

---

## 📋 Checklist de Migración por Componente

### AuthContext
- [ ] Migrar `login()` a usar `authService.login()`
- [ ] Migrar `register()` a usar `authService.register()`
- [ ] Migrar `logout()` a usar `authService.logout()`
- [ ] Agregar verificación de token al cargar

### Atletas
- [ ] MisAtletas.tsx - `atletasService.obtenerMisAtletas()`
- [ ] FichaAtleta.tsx - `atletasService.obtenerFichaAtleta()`
- [ ] MatriculaForm.tsx - `atletasService.crearAtleta()`
- [ ] AtletasManagement.tsx - `atletasService.listarAtletas()`

### Tienda
- [ ] TiendaPublica.tsx - `tiendaService.obtenerProductos()`
- [ ] TiendaApoderado.tsx - `tiendaService.obtenerProductos('premium')`
- [ ] CarritoCompras.tsx - `tiendaService.obtenerCarrito()`
- [ ] GestionTienda.tsx - CRUD de productos

### Pagos
- [ ] MisPagos.tsx - `pagosService.obtenerMisPagos()`
- [ ] ConfiguracionMensualidades.tsx - `pagosService.obtenerConfiguracionMensualidades()`
- [ ] ReportesFinancieros.tsx - `pagosService.obtenerReportesFinancieros()`

### Admin
- [ ] UsersManagement.tsx - `usuariosService.*`
- [ ] GestionEquipos.tsx - `equiposService.*`
- [ ] GestionHorarios.tsx - `horariosService.*`
- [ ] GestionNotificaciones.tsx - `notificacionesService.*`

### Landing
- [ ] LandingDataContext.tsx - `landingService.obtenerDatosLanding()`
- [ ] GestionLanding.tsx - `landingService.actualizarDatosLanding()`

---

## 🚀 Orden Recomendado de Migración

1. **AuthContext** (crítico - base para todo)
2. **AuthModal** (login/register)
3. **LandingPage** (datos públicos, sin autenticación)
4. **MisAtletas** (funcionalidad básica de apoderado)
5. **TiendaPublica/Apoderado** (tienda)
6. **MisPagos** (historial)
7. **Admin - UsersManagement** (gestión básica)
8. **Resto de componentes admin**

---

## ✅ Testing de la Migración

Para cada componente migrado, verificar:

1. ✅ **Carga inicial**: Los datos se cargan correctamente
2. ✅ **Loading states**: Se muestran indicadores de carga
3. ✅ **Manejo de errores**: Los errores se muestran al usuario
4. ✅ **Crear**: Se pueden crear nuevos registros
5. ✅ **Actualizar**: Se pueden editar registros existentes
6. ✅ **Eliminar**: Se pueden eliminar registros
7. ✅ **Refresh automático**: La lista se actualiza después de cambios
8. ✅ **Tokens**: La autenticación funciona correctamente

---

**Nota**: Esta migración debe hacerse **después** de que el backend esté implementado y funcionando. Mientras tanto, el frontend actual seguirá funcionando con localStorage.

🐝 **La Colmena** - Reign All Stars
