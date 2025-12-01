import api, { handleApiError } from '../axios';

export const listar = async () => {
  try {
    const resp = await api.get('/certificaciones-entrenador/', {
      params: { _ts: Date.now() }, // evita respuestas cacheadas del navegador
    });
    return { success: true, data: resp.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

const postConfig = (payload) =>
  payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

export const crear = async (payload) => {
  try {
    const resp = await api.post('/certificaciones-entrenador/', payload, postConfig(payload));
    return { success: true, data: resp.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizar = async (id, payload) => {
  try {
    const resp = await api.patch(`/certificaciones-entrenador/${id}/`, payload, postConfig(payload));
    return { success: true, data: resp.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminar = async (id) => {
  try {
    await api.delete(`/certificaciones-entrenador/${id}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
