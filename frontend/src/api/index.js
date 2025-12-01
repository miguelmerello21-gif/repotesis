/**
 * Índice de exportación de todos los servicios de API
 * 
 * Este archivo centraliza todas las importaciones de servicios
 * para facilitar su uso en los componentes de React.
 * 
 * Uso:
 * import { authService, atletasService } from '../api';
 */

// Exportar la instancia de Axios configurada
export { default as api, handleApiError } from './axios';

// Exportar todos los servicios
export * as authService from './services/authService';
export * as atletasService from './services/atletasService';
export * as tiendaService from './services/tiendaService';
export * as pagosService from './services/pagosService';
export * as equiposService from './services/equiposService';
export * as horariosService from './services/horariosService';
export * as notificacionesService from './services/notificacionesService';
export * as rankingService from './services/rankingService';
export * as landingService from './services/landingService';
export * as usuariosService from './services/usuariosService';
export * as certificacionesService from './services/certificacionesService';
export * as finanzasService from './services/finanzasService';
