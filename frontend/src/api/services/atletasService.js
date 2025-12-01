import api, { handleApiError } from '../axios';

export const listarAtletas = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/atletas/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerMisAtletas = async () => {
  try {
    const response = await api.get('/atletas/mis-atletas/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerAtleta = async (atletaId) => {
  try {
    const response = await api.get(`/atletas/${atletaId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearAtleta = async (atletaData) => {
  try {
    const response = await api.post('/atletas/', atletaData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarAtleta = async (atletaId, atletaData) => {
  try {
    const response = await api.patch(`/atletas/${atletaId}/`, atletaData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarAtleta = async (atletaId) => {
  try {
    const response = await api.delete(`/atletas/${atletaId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const asignarEquipo = async (atletaId, equipoId) => {
  try {
    const response = await api.patch(`/atletas/${atletaId}/asignar-equipo/`, { equipo: equipoId });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerCertificaciones = async (atletaId) => {
  try {
    const response = await api.get(`/atletas/${atletaId}/certificaciones/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const subirCertificacion = async (atletaId, formData) => {
  try {
    const response = await api.post(`/atletas/${atletaId}/certificaciones/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarCertificacion = async (certificacionId) => {
  try {
    const response = await api.delete(`/certificaciones/${certificacionId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarCertificacion = async (certificacionId, payload) => {
  try {
    const response = await api.patch(`/certificaciones/${certificacionId}/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarCertificaciones = async () => {
  try {
    const response = await api.get('/certificaciones/listar-todas/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarCertificacionesPorAtleta = async (atletaId) => {
  try {
    const response = await api.get(`/certificaciones/por-atleta/${atletaId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarAtletasPorEquipo = async (equipoId) => {
  try {
    const response = await api.get(`/atletas/por-equipo/${equipoId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
