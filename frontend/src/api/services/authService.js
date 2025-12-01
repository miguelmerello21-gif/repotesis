/**
 * Servicio de Autenticación
 *
 * Endpoints esperados en Django REST Framework:
 * - POST /api/auth/login/ (SimpleJWT - obtener tokens)
 * - POST /api/auth/token/refresh/ (SimpleJWT - refrescar access token)
 * - POST /api/auth/logout/ (invalidar refresh token)
 * - POST /api/auth/register/ (crear nuevo usuario público)
 * - POST /api/auth/password/reset/ (solicitar reset de contraseña)
 * - POST /api/auth/password/reset/validate/ (validar código)
 * - POST /api/auth/password/reset/confirm/ (confirmar reset con código)
 */

import api, { handleApiError } from '../axios';

/**
 * Iniciar sesión
 */
export const login = async (email, password) => {
  try {
    const response = await api.post('auth/login/', { email, password });
    const { access, refresh, user } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Registrar nuevo usuario
 */
export const register = async (userData) => {
  try {
    const response = await api.post('auth/register/', userData);
    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Cerrar sesión
 */
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    // seguimos al cleanup aunque falle
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
  return { success: true };
};

/**
 * Refrescar access token
 */
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('auth/token/refresh/', { refresh: refreshToken });
    const { access } = response.data;
    localStorage.setItem('access_token', access);
    return { success: true, data: { access } };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Solicitar reset de contraseña
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post('auth/password/reset/', { email });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Validar código de recuperación sin cambiar contraseña
 */
export const validatePasswordResetCode = async (email, code) => {
  try {
    const response = await api.post('auth/password/reset/validate/', { email, code });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Confirmar reset de contraseña con código
 */
export const confirmPasswordReset = async (email, code, newPassword) => {
  try {
    const response = await api.post('auth/password/reset/confirm/', {
      email,
      code,
      new_password: newPassword,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener perfil del usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('auth/me/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar perfil del usuario
 */
export const updateProfile = async (userData) => {
  try {
    const response = await api.patch('auth/me/', userData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
