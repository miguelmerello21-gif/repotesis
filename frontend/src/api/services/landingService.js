/**
 * Servicio de Landing Page
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/landing/datos/ (obtener todos los datos del landing)
 * - PATCH /api/landing/datos/ (actualizar datos del landing - admin)
 * - GET /api/landing/entrenadores/ (listar entrenadores públicos)
 * - GET /api/landing/eventos/ (obtener próximos eventos)
 * - GET /api/landing/estadisticas/ (estadísticas del club)
 */

import api, { handleApiError } from '../axios';

/**
 * Obtener datos del landing page
 * @returns {Promise} Datos completos del landing
 */
export const obtenerDatosLanding = async () => {
  try {
    const response = await api.get('/landing/datos/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar datos del landing (admin)
 * @param {Object} datosLanding - Datos a actualizar
 * @returns {Promise} Datos actualizados
 */
export const actualizarDatosLanding = async (datosLanding) => {
  try {
    // Se usa el singleton con pk=1
    const response = await api.patch('/landing/datos/1/', datosLanding);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener entrenadores para mostrar en landing
 * @returns {Promise} Lista de entrenadores
 */
export const obtenerEntrenadores = async () => {
  try {
    const response = await api.get('/landing/entrenadores/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener próximos eventos
 * @returns {Promise} Lista de eventos
 */
export const obtenerEventos = async () => {
  try {
    const response = await api.get('/landing/eventos/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener estadísticas del club
 * @returns {Promise} Estadísticas
 */
export const obtenerEstadisticas = async () => {
  try {
    const response = await api.get('/landing/estadisticas/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Carrusel
export const obtenerCarrusel = async () => {
  try {
    const response = await api.get('/landing/carrusel/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearFotoCarrusel = async (file, data = {}) => {
  try {
    const formData = new FormData();
    formData.append('imagen', file);
    if (data.titulo) formData.append('titulo', data.titulo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.orden !== undefined) formData.append('orden', data.orden);
    formData.append('activa', data.activa !== undefined ? data.activa : true);
    const response = await api.post('/landing/carrusel/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarFotoCarrusel = async (id, data = {}) => {
  try {
    const response = await api.patch(`/landing/carrusel/${id}/`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarFotoCarrusel = async (id) => {
  try {
    await api.delete(`/landing/carrusel/${id}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
