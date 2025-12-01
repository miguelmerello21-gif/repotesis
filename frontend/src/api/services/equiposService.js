/**
 * Servicio de Equipos
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/equipos/ (listar equipos)
 * - GET /api/equipos/{id}/ (detalle de equipo)
 * - POST /api/equipos/ (crear equipo - admin)
 * - PATCH /api/equipos/{id}/ (actualizar equipo - admin)
 * - DELETE /api/equipos/{id}/ (eliminar equipo - admin)
 * - GET /api/equipos/{id}/atletas/ (atletas del equipo)
 * - GET /api/equipos/{id}/horarios/ (horarios del equipo)
 */

import api, { handleApiError } from '../axios';

/**
 * Listar todos los equipos
 * @param {Object} filters - Filtros opcionales (division, nivel, categoria)
 * @returns {Promise} Lista de equipos
 */
export const listarEquipos = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/equipos/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener detalle de equipo
 * @param {number} equipoId - ID del equipo
 * @returns {Promise} Datos del equipo
 */
export const obtenerEquipo = async (equipoId) => {
  try {
    const response = await api.get(`/equipos/${equipoId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Crear nuevo equipo (admin)
 * @param {Object} equipoData - Datos del equipo
 * @returns {Promise} Equipo creado
 */
export const crearEquipo = async (equipoData) => {
  try {
    const response = await api.post('/equipos/', equipoData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar equipo (admin)
 * @param {number} equipoId - ID del equipo
 * @param {Object} equipoData - Datos a actualizar
 * @returns {Promise} Equipo actualizado
 */
export const actualizarEquipo = async (equipoId, equipoData) => {
  try {
    const response = await api.patch(`/equipos/${equipoId}/`, equipoData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar equipo (admin)
 * @param {number} equipoId - ID del equipo
 * @returns {Promise} Confirmación
 */
export const eliminarEquipo = async (equipoId) => {
  try {
    await api.delete(`/equipos/${equipoId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener atletas de un equipo
 * @param {number} equipoId - ID del equipo
 * @returns {Promise} Lista de atletas
 */
export const obtenerAtletasEquipo = async (equipoId) => {
  try {
    const response = await api.get(`/equipos/${equipoId}/atletas/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener horarios de un equipo
 * @param {number} equipoId - ID del equipo
 * @returns {Promise} Lista de horarios
 */
export const obtenerHorariosEquipo = async (equipoId) => {
  try {
    const response = await api.get(`/equipos/${equipoId}/horarios/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
