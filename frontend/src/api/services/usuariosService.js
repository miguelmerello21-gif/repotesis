/**
 * Servicio de Gestión de Usuarios
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/usuarios/ (listar usuarios - admin)
 * - GET /api/usuarios/{id}/ (detalle de usuario - admin)
 * - PATCH /api/usuarios/{id}/ (actualizar usuario - admin)
 * - DELETE /api/usuarios/{id}/ (eliminar usuario - admin)
 * - PATCH /api/usuarios/{id}/cambiar-rol/ (cambiar rol - admin)
 */

import api, { handleApiError } from '../axios';

/**
 * Listar todos los usuarios (admin)
 * @param {Object} filters - Filtros opcionales (role, activo)
 * @returns {Promise} Lista de usuarios
 */
export const listarUsuarios = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/usuarios/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener detalle de usuario (admin)
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise} Datos del usuario
 */
export const obtenerUsuario = async (usuarioId) => {
  try {
    const response = await api.get(`/usuarios/${usuarioId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar usuario (admin)
 * @param {number} usuarioId - ID del usuario
 * @param {Object} usuarioData - Datos a actualizar
 * @returns {Promise} Usuario actualizado
 */
export const actualizarUsuario = async (usuarioId, usuarioData) => {
  try {
    const response = await api.patch(`/usuarios/${usuarioId}/`, usuarioData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar usuario (admin)
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise} Confirmación
 */
export const eliminarUsuario = async (usuarioId) => {
  try {
    await api.delete(`/usuarios/${usuarioId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Cambiar rol de usuario (admin)
 * @param {number} usuarioId - ID del usuario
 * @param {string} nuevoRol - Nuevo rol (public, apoderado, entrenador, admin)
 * @returns {Promise} Usuario actualizado
 */
export const cambiarRolUsuario = async (usuarioId, nuevoRol) => {
  try {
    const response = await api.patch(`/usuarios/${usuarioId}/cambiar-rol/`, {
      role: nuevoRol,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
