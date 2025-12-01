import api, { handleApiError } from '../axios';

export const listarEgresos = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/egresos/${params ? `?${params}` : ''}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

const buildPayload = (payload) => {
  const hasFile = payload?.comprobante instanceof File;
  if (!hasFile) {
    return payload;
  }
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.append(key, value);
    }
  });
  return form;
};

export const crearEgreso = async (payload) => {
  try {
    const data = buildPayload(payload);
    const response = await api.post('/egresos/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarEgreso = async (egresoId, payload) => {
  try {
    const data = buildPayload(payload);
    const response = await api.patch(`/egresos/${egresoId}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarEgreso = async (egresoId) => {
  try {
    await api.delete(`/egresos/${egresoId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
