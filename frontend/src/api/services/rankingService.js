import api, { handleApiError } from '../axios';

// Ranking
export const obtenerRanking = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/ranking/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerRankingAtleta = async (atletaId) => {
  try {
    const response = await api.get(`/ranking/atleta/${atletaId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearActualizarRanking = async (rankingData) => {
  try {
    const response = await api.post('/ranking/', rankingData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarRanking = async (rankingId, rankingData) => {
  try {
    const response = await api.patch(`/ranking/${rankingId}/`, rankingData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarRanking = async (rankingId) => {
  try {
    await api.delete(`/ranking/${rankingId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Logros
export const listarLogros = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/logros/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearLogro = async (payload) => {
  try {
    const response = await api.post('/logros/', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarLogro = async (logroId) => {
  try {
    await api.delete(`/logros/${logroId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Evaluaciones
export const listarEvaluaciones = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/evaluaciones/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearEvaluacion = async (payload) => {
  try {
    const response = await api.post('/evaluaciones/', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarEvaluacion = async (evaluacionId) => {
  try {
    await api.delete(`/evaluaciones/${evaluacionId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
