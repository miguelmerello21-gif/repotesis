/**
 * Configuración de Axios para conectar con Django REST Framework
 * 
 * Este archivo configura una instancia de Axios con:
 * - URL base desde variable de entorno
 * - Interceptores para JWT (SimpleJWT de Django)
 * - Manejo automático de refresh tokens
 * - Manejo de errores centralizado
 */

import axios from 'axios';

// URL base del backend Django REST Framework
// Se configura en el archivo .env como VITE_API_URL. Si no incluye /api, lo agregamos.
const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = rawBase.replace(/\/+$/, '').endsWith('/api')
  ? rawBase.replace(/\/+$/, '')
  : `${rawBase.replace(/\/+$/, '')}/api`;

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

/**
 * Interceptor de Request
 * Agrega el token JWT a cada petición si existe
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Normalizamos URLs que empiezan con "/" para que respeten el baseURL
    if (config.url && config.url.startsWith('/')) {
      config.url = config.url.slice(1);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de Response
 * Maneja automáticamente el refresh del token JWT cuando expira (401)
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // No intentar refresh ni redirigir para endpoints de auth inicial (login/register/reset)
    const url = originalRequest?.url || '';
    const isAuthEntryPoint =
      url.includes('auth/login') ||
      url.includes('auth/register') ||
      url.includes('auth/password');
    if (isAuthEntryPoint) {
      return Promise.reject(error);
    }

    // Si el error es 401 y no hemos intentado refrescar antes
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No hay refresh token, redirigir a login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
          return Promise.reject(error);
        }

        // Intentar refrescar el token
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar tokens y redirigir a login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Función auxiliar para manejar errores de API de forma consistente
 * @param {Error} error - Error de Axios
 * @returns {Object} Objeto con información del error formateada
 */
export const handleApiError = (error) => {
  if (error.response) {
    // El servidor respondió con un código de error
    return {
      status: error.response.status,
      message: error.response.data?.message || error.response.data?.detail || 'Error del servidor',
      errors: error.response.data?.errors || null,
      data: error.response.data,
    };
  } else if (error.request) {
    // La petición se hizo pero no hubo respuesta
    return {
      status: 0,
      message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      errors: null,
    };
  } else {
    // Error al configurar la petición
    return {
      status: -1,
      message: error.message || 'Error desconocido',
      errors: null,
    };
  }
};

export default api;
