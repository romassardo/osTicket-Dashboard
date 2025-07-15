import axios from 'axios';
import logger from '../utils/logger';

// Define el nuevo tipo de respuesta para el endpoint de conteos
export interface TicketCounts {
  totalInDateRange: number;
  openInDateRange: number;
  closedInDateRange: number;
  totalOpen: number;
  byStatus: { [key: string]: number };
}

const apiClient = axios.create({
  baseURL: '/api', // Usamos una ruta relativa para que funcione en producción
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Obtiene el conteo de tickets para las tarjetas y gráficos del dashboard.
 * Puede ser filtrado por un rango de fechas.
 */
export const getTicketCounts = async (startDate?: string, endDate?: string): Promise<TicketCounts> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get('/tickets/count', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener conteo de tickets:', error);
    throw error;
  }
};

/**
 * Obtiene todos los departamentos disponibles.
 */
export const getDepartments = async () => {
  try {
    const response = await apiClient.get('/departments');
    return response.data;
  } catch (error) {
    logger.error('Error al obtener departamentos:', error);
    throw error;
  }
};

/**
 * Obtiene todas las organizaciones disponibles.
 */
export const getOrganizations = async (year?: number, month?: number) => {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await apiClient.get('/organizations', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener organizaciones:', error);
    throw error;
  }
};

/**
 * Debug: Obtiene información detallada de organizaciones
 */
export const getOrganizationsDebug = async () => {
  try {
    const response = await apiClient.get('/organizations/debug');
    return response.data;
  } catch (error) {
    logger.error('Error al obtener debug de organizaciones:', error);
    throw error;
  }
};

/**
 * Obtiene todos los miembros del staff/agentes.
 */
export const getStaff = async () => {
  try {
    const response = await apiClient.get('/staff');
    return response.data;
  } catch (error) {
    logger.error('Error al obtener staff:', error);
    throw error;
  }
};

/**
 * Obtiene tickets por departamento específico.
 */
export const getTicketsByDepartment = async (departmentId: string, page: number = 1, limit: number = 10) => {
  try {
    const response = await apiClient.get(`/departments/${departmentId}/tickets`, { params: { page, limit } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets del departamento ${departmentId}:`, error);
    throw error;
  }
};

/**
 * Obtiene tickets por agente específico (filtrado por mes).
 */
export const getTicketsByStaff = async (staffId: string, page: number = 1, limit: number = 10, year?: number, month?: number) => {
  try {
    const response = await apiClient.get(`/staff/${staffId}/tickets`, { params: { page, limit, year, month } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets del agente ${staffId}:`, error);
    throw error;
  }
};

/**
 * Obtiene tickets por organización específica (filtrado por mes).
 */
export const getTicketsByOrganization = async (organizationId: string, page: number = 1, limit: number = 10, year?: number, month?: number) => {
  try {
    const response = await apiClient.get(`/organizations/${organizationId}/tickets`, { params: { page, limit, year, month } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets de la organización ${organizationId}:`, error);
    throw error;
  }
};

/**
 * Obtiene datos de tendencias de tickets para un mes y año específicos.
 */
export const getTicketTrends = async (year: number, month: number) => {
  try {
    const response = await apiClient.get('/tickets/stats/tendencies', { params: { year, month } });
    return response.data;
  } catch (error) { 
    logger.error(`Error al obtener tendencias de tickets para ${year}-${month}:`, error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de tickets agrupados por agente para un mes y año específicos.
 */
export const getTicketsByAgentStats = async (year: number, month: number) => {
  try {
    const response = await apiClient.get('/tickets/stats/by-agent', { params: { year, month } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets por agente para ${year}-${month}:`, error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de tickets por organización para un mes y año específicos.
 * @param {number} year - El año para el filtro.
 * @param {number} month - El mes para el filtro.
 * @returns Una promesa que resuelve a un array de datos para el gráfico.
 */
export const getTicketsByOrganizationStats = async ({ year, month }: { year: number; month: number }) => {
  try {
    const response = await apiClient.get('/stats/tickets-by-organization', { params: { year, month } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets por organización para ${year}-${month}:`, error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de tickets por sector para un mes y año específicos.
 * @param {number} year - El año para el filtro.
 * @param {number} month - El mes para el filtro.
 * @returns Una promesa que resuelve a un array de datos para el gráfico.
 */
export const getTicketsBySectorStats = async ({ year, month }: { year: number; month: number }) => {
  try {
    const response = await apiClient.get('/stats/tickets-by-sector', { params: { year, month } });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener tickets por sector para ${year}-${month}:`, error);
    throw error;
  }
};

/**
 * Obtiene tickets con paginación.
 * Filtrado por departamento de Soporte IT.
 */
export const getTickets = async (page: number = 1, limit: number = 10, search?: string) => {
  try {
    const params: { page: number; limit: number; search?: string } = { page, limit };
    if (search) {
      params.search = search;
    }
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener tickets:', error);
    throw error;
  }
};

/**
 * Obtiene las estadísticas de uso de transporte desde el backend.
 * @returns Una promesa que resuelve a un array de datos para el gráfico.
 */
export const getTicketsByTransport = async ({ year, month }: { year: number; month: number }) => {
  try {
    const response = await apiClient.get('/stats/tickets-by-transport', { params: { year, month } });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener estadísticas de transporte:', error);
    throw error;
  }
};

export default apiClient;
