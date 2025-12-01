/**
 * Servicio de Notificaciones
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/notificaciones/ (listar notificaciones del usuario)
 * - POST /api/notificaciones/ (crear notificación - admin)
 * - PATCH /api/notificaciones/{id}/marcar-leida/ (marcar como leída)
 * - DELETE /api/notificaciones/{id}/ (eliminar notificación)
 * - GET /api/notificaciones/no-leidas/count/ (cantidad de no leídas)
 */

import api, { handleApiError } from '../axios';

/**
 * Obtener notificaciones del usuario actual
 * @param {Object} filters - Filtros opcionales (leida, tipo)
 * @returns {Promise} Lista de notificaciones
 */
export const obtenerNotificaciones = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/notificaciones/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Crear notificación (admin)
 * @param {Object} notificacionData - Datos de la notificación
 * @returns {Promise} Notificación creada
 */
export const crearNotificacion = async (notificacionData) => {
  try {
    const response = await api.post('/notificaciones/', notificacionData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Marcar notificación como leída
 * @param {number} notificacionId - ID de la notificación
 * @returns {Promise} Notificación actualizada
 */
export const marcarComoLeida = async (notificacionId) => {
  try {
    const response = await api.patch(`/notificaciones/${notificacionId}/marcar-leida/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar notificación
 * @param {number} notificacionId - ID de la notificación
 * @returns {Promise} Confirmación
 */
export const eliminarNotificacion = async (notificacionId) => {
  try {
    await api.delete(`/notificaciones/${notificacionId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener cantidad de notificaciones no leídas
 * @returns {Promise} Cantidad de no leídas
 */
export const obtenerNoLeidasCount = async () => {
  try {
    const response = await api.get('/notificaciones/no-leidas/count/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
