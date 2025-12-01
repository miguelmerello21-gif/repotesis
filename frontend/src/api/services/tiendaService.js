/**
 * Servicio de Tienda
 * 
 * Endpoints esperados en Django REST Framework:
 * - GET /api/tienda/productos/ (listar productos - filtrar por tipo: publico/premium)
 * - GET /api/tienda/productos/{id}/ (detalle de producto)
 * - POST /api/tienda/productos/ (crear producto - admin)
 * - PATCH /api/tienda/productos/{id}/ (actualizar producto - admin)
 * - DELETE /api/tienda/productos/{id}/ (eliminar producto - admin)
 * - GET /api/tienda/carrito/ (obtener carrito del usuario)
 * - POST /api/tienda/carrito/agregar/ (agregar al carrito)
 * - PATCH /api/tienda/carrito/actualizar/{item_id}/ (actualizar cantidad)
 * - DELETE /api/tienda/carrito/eliminar/{item_id}/ (eliminar del carrito)
 * - POST /api/tienda/pedidos/ (crear pedido desde carrito)
 * - GET /api/tienda/pedidos/ (listar pedidos del usuario)
 * - GET /api/tienda/pedidos/{id}/ (detalle de pedido)
 */

import api, { handleApiError } from '../axios';

/**
 * Obtener productos de la tienda
 * @param {string|null} tipo - Tipo de productos: 'publico' o 'exclusivo'. Si es null/undefined, trae todos.
 * @returns {Promise} Lista de productos
 */
export const obtenerProductos = async (tipo = null) => {
  try {
    const suffix = tipo ? `?tipo=${tipo}` : '';
    const response = await api.get(`/tienda/productos/${suffix}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener detalle de producto
 * @param {number} productoId - ID del producto
 * @returns {Promise} Datos del producto
 */
export const obtenerProducto = async (productoId) => {
  try {
    const response = await api.get(`/tienda/productos/${productoId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Crear producto (admin)
 * @param {Object} productoData - Datos del producto
 * @returns {Promise} Producto creado
 */
export const crearProducto = async (productoData) => {
  try {
    const isForm = typeof FormData !== 'undefined' && productoData instanceof FormData;
    const response = await api.post('/tienda/productos/', productoData, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar producto (admin)
 * @param {number} productoId - ID del producto
 * @param {Object} productoData - Datos a actualizar
 * @returns {Promise} Producto actualizado
 */
export const actualizarProducto = async (productoId, productoData) => {
  try {
    const isForm = typeof FormData !== 'undefined' && productoData instanceof FormData;
    const response = await api.patch(
      `/tienda/productos/${productoId}/`,
      productoData,
      isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar producto (admin)
 * @param {number} productoId - ID del producto
 * @returns {Promise} Confirmación
 */
export const eliminarProducto = async (productoId) => {
  try {
    await api.delete(`/tienda/productos/${productoId}/`);
    return { success: true };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener carrito del usuario actual
 * @returns {Promise} Datos del carrito
 */
export const obtenerCarrito = async () => {
  try {
    const response = await api.get('/tienda/carrito/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Agregar producto al carrito
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad a agregar
 * @param {string} talla - Talla seleccionada (opcional)
 * @returns {Promise} Carrito actualizado
 */
export const agregarAlCarrito = async (productoId, cantidad = 1, talla = null) => {
  try {
    const response = await api.post('/tienda/carrito/agregar/', {
      producto_id: productoId,
      cantidad,
      talla,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar cantidad de item en carrito
 * @param {number} itemId - ID del item en el carrito
 * @param {number} cantidad - Nueva cantidad
 * @returns {Promise} Carrito actualizado
 */
export const actualizarItemCarrito = async (itemId, cantidad) => {
  try {
    const response = await api.patch(`/tienda/carrito/actualizar/${itemId}/`, {
      cantidad,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Eliminar item del carrito
 * @param {number} itemId - ID del item en el carrito
 * @returns {Promise} Carrito actualizado
 */
export const eliminarDelCarrito = async (itemId) => {
  try {
    const response = await api.delete(`/tienda/carrito/eliminar/${itemId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Crear pedido desde carrito
 * @param {Object} datosPedido - Información del pedido (dirección, notas, etc.)
 * @returns {Promise} Pedido creado
 */
export const crearPedido = async (datosPedido) => {
  try {
    const response = await api.post('/tienda/pedidos/', datosPedido);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener pedidos del usuario
 * @returns {Promise} Lista de pedidos
 */
export const obtenerPedidos = async () => {
  try {
    const response = await api.get('/tienda/pedidos/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Obtener detalle de pedido
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise} Datos del pedido
 */
export const obtenerPedido = async (pedidoId) => {
  try {
    const response = await api.get(`/tienda/pedidos/${pedidoId}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

/**
 * Actualizar pedido (cambio de estado / notas)
 * @param {number|string} pedidoId - ID del pedido
 * @param {Object} payload - { estado?, notas_admin? }
 */
export const actualizarPedido = async (pedidoId, payload) => {
  try {
    const response = await api.patch(`/tienda/pedidos/${pedidoId}/`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const iniciarPagoPedidoWebpay = async (pedidoId) => {
  try {
    const response = await api.post(`/tienda/pedidos/${pedidoId}/webpay/init/`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};

export const confirmarPagoPedidoWebpay = async (token) => {
  try {
    const response = await api.post(`/tienda/pedidos/webpay/confirmar/`, { token });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: handleApiError(error) };
  }
};
