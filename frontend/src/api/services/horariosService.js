/**
 * Servicio de Horarios
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/horarios/ (listar horarios)
 * - GET /api/horarios/mis-horarios/ (horarios del apoderado/entrenador)
 * - POST /api/horarios/ (crear horario - admin)
 * - PATCH /api/horarios/{id}/ (actualizar horario - admin)
 * - DELETE /api/horarios/{id}/ (eliminar horario - admin)
 */

import api, { handleApiError } from '../axios';

/**
 * Listar horarios
 * @param {Object} filters - Filtros opcionales (equipo, dia)
 * @returns {Promise} Lista de horarios
 */
export const listarHorarios = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/horarios/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener horarios del usuario actual (apoderado/entrenador)
 * @returns {Promise} Lista de horarios
 */
export const obtenerMisHorarios = async () => {
  try {
    const response = await api.get('/horarios/mis-horarios/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Crear horario (admin)
 * @param {Object} horarioData - Datos del horario
 * @returns {Promise} Horario creado
 */
export const crearHorario = async (horarioData) => {
  try {
    const response = await api.post('/horarios/', horarioData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar horario (admin)
 * @param {number} horarioId - ID del horario
 * @param {Object} horarioData - Datos a actualizar
 * @returns {Promise} Horario actualizado
 */
export const actualizarHorario = async (horarioId, horarioData) => {
  try {
    const response = await api.patch(`/horarios/${horarioId}/`, horarioData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar horario (admin)
 * @param {number} horarioId - ID del horario
 * @returns {Promise} Confirmación
 */
export const eliminarHorario = async (horarioId) => {
  try {
    await api.delete(`/horarios/${horarioId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Listar asistencias de un horario
 * @param {number} horarioId - ID del horario
 */
export const listarAsistencias = async (horarioId) => {
  try {
    const response = await api.get(`/horarios/${horarioId}/asistencias/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Registrar asistencia en un horario
 * @param {number} horarioId - ID del horario
 * @param {Object} asistenciaData - { atleta, fecha, presente, metodo }
 */
export const registrarAsistencia = async (horarioId, asistenciaData) => {
  try {
    const response = await api.post(`/horarios/${horarioId}/asistencias/`, asistenciaData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Listar asistencias con filtros (atleta, equipo, fecha)
 */
export const listarAsistenciasGeneral = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const query = params ? `?${params}` : '';
    const response = await api.get(`/asistencias/${query}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Listar asistencias de un atleta
 */
export const listarAsistenciasPorAtleta = async (atletaId, filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const query = params ? `?${params}` : '';
    const response = await api.get(`/atletas/${atletaId}/asistencias/${query}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

