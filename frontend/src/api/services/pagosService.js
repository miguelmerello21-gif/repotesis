/**
 * Servicio de Pagos (Matrículas y Mensualidades)
 */

import api, { handleApiError } from '../axios';

export const registrarMatricula = async (datosMatricula) => {
  try {
    const response = await api.post('/pagos/matriculas/', datosMatricula);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarMatriculas = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/pagos/matriculas/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerMisPagos = async () => {
  try {
    const response = await api.get('/pagos/matriculas/mis-pagos/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerMensualidades = async () => {
  try {
    const response = await api.get('/pagos/mensualidades/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const registrarPagoMensualidad = async (datosPago) => {
  try {
    const response = await api.post('/pagos/mensualidades/', datosPago);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerPeriodosMatricula = async () => {
  try {
    const response = await api.get('/pagos/periodos-matricula/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearPeriodoMatricula = async (datosPeriodo) => {
  try {
    const response = await api.post('/pagos/periodos-matricula/', datosPeriodo);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarPeriodoMatricula = async (periodoId, datosPeriodo) => {
  try {
    const response = await api.patch(`/pagos/periodos-matricula/${periodoId}/`, datosPeriodo);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarPeriodoMatricula = async (periodoId) => {
  try {
    await api.delete(`/pagos/periodos-matricula/${periodoId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarDeudas = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/pagos/deudas/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerMisDeudas = async () => {
  try {
    const response = await api.get('/pagos/deudas/mis-deudas/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const registrarPagoManual = async (datosPago) => {
  try {
    const response = await api.post('/pagos/pago-manual/', datosPago);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const obtenerReportesFinancieros = async (filtros = {}) => {
  try {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/pagos/reportes/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const iniciarWebpay = async (matriculaId, monto, buyOrder, sessionId) => {
  try {
    const response = await api.post('/pagos/webpay/init/', { matricula_id: matriculaId, monto, buy_order: buyOrder, session_id: sessionId });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const confirmarWebpay = async (token) => {
  try {
    const response = await api.post('/pagos/webpay/confirmar/', { token });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Pagos online (nuevo flujo)
export const listarPagosOnline = async () => {
  try {
    const response = await api.get('/pagos/online/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearPagoOnline = async (payload) => {
  try {
    const response = await api.post('/pagos/online/', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarPagoOnline = async (pagoId, payload) => {
  try {
    const response = await api.patch(`/pagos/online/${pagoId}/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarPagoOnline = async (pagoId) => {
  try {
    await api.delete(`/pagos/online/${pagoId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const regenerarObligacionesPagoOnline = async (pagoId) => {
  try {
    const response = await api.post(`/pagos/online/${pagoId}/generar-obligaciones/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const listarObligacionesPagoOnline = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/pagos/online-obligaciones/?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const pagarObligacionPagoOnline = async (obligacionId, payload = {}) => {
  try {
    const response = await api.post(`/pagos/online-obligaciones/${obligacionId}/pagar/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const iniciarWebpayPagoOnline = async (obligacionId, buyOrder, sessionId) => {
  try {
    const response = await api.post('/pagos/online/webpay/init/', {
      obligacion_id: obligacionId,
      buy_order: buyOrder,
      session_id: sessionId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const confirmarWebpayPagoOnline = async (token) => {
  try {
    const response = await api.post('/pagos/online/webpay/confirmar/', { token });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

// Tarjetas guardadas (simulación de tokenización)
export const listarTarjetas = async () => {
  try {
    const response = await api.get('/pagos/tarjetas/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const crearTarjeta = async (payload) => {
  try {
    const response = await api.post('/pagos/tarjetas/', payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const actualizarTarjeta = async (tarjetaId, payload) => {
  try {
    const response = await api.patch(`/pagos/tarjetas/${tarjetaId}/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const eliminarTarjeta = async (tarjetaId) => {
  try {
    await api.delete(`/pagos/tarjetas/${tarjetaId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const pagarObligacionConTarjetaGuardada = async (obligacionId, cardId) => {
  try {
    const response = await api.post(`/pagos/online-obligaciones/${obligacionId}/pagar-con-tarjeta/`, {
      card_id: cardId,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const autopagarObligaciones = async () => {
  try {
    const response = await api.post('/pagos/online-obligaciones/autopagar/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
