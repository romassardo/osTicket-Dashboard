import axios from 'axios';
import logger from '../utils/logger';

// Define el nuevo tipo de respuesta para el endpoint de conteos
export interface TicketCounts {
  total: number;
  open: number;
  closed: number;
  pending: number;
  totalPendingAccumulated: number;
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

/**
 * Obtiene el análisis de flujo de tickets entre dos meses específicos.
 * Analiza tickets creados, cerrados y pendientes, incluye flujo entre meses.
 * @param month1 - Mes del primer período (1-12)
 * @param year1 - Año del primer período  
 * @param month2 - Mes del segundo período (1-12)
 * @param year2 - Año del segundo período
 * @returns Objeto con datos de comparación y flujo de tickets entre meses
 */
export const getMonthlyComparison = async (month1: number, year1: number, month2: number, year2: number) => {
  try {
    const response = await apiClient.get('/stats/monthly-comparison', {
      params: { month1, year1, month2, year2 }
    });
    return response.data;
  } catch (error) {
    logger.error(`Error al obtener comparación mensual ${month1}/${year1} vs ${month2}/${year2}:`, error);
    throw error;
  }
};

// ==================== SLA API FUNCTIONS ====================

/**
 * Obtiene estadísticas detalladas de SLA agrupadas por agente, mes y año
 * @param params - year, month, agent (opcionales)
 * @returns Array de estadísticas SLA por agente
 */
export const getSLAStats = async (params?: { year?: number; month?: number; agent?: string }) => {
  try {
    const response = await apiClient.get('/sla/stats', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener estadísticas SLA:', error);
    throw error;
  }
};

/**
 * Obtiene alertas de SLA: tickets en riesgo, agentes con bajo rendimiento y tendencias negativas
 * @returns Objeto con resumen de alertas, tickets en riesgo, agentes con problemas y tendencias
 */
export const getSLAAlerts = async () => {
  try {
    const response = await apiClient.get('/sla/alerts');
    return response.data;
  } catch (error) {
    logger.error('Error al obtener alertas SLA:', error);
    throw error;
  }
};

/**
 * Obtiene un resumen general de SLA para mostrar en tarjetas del dashboard
 * @param params - year, month (opcionales)
 * @returns Objeto con métricas generales de SLA
 */
export const getSLASummary = async (params?: { year?: number; month?: number }) => {
  try {
    const response = await apiClient.get('/sla/summary', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener resumen SLA:', error);
    throw error;
  }
};

/**
 * Obtiene lista detallada de tickets con información individual de SLA
 * @param params - year, month, agent_id, status ('cumplido' | 'vencido'), page, limit
 * @returns Objeto con array de tickets y paginación
 */
export const getSLATickets = async (params?: { 
  year?: number; 
  month?: number; 
  agent_id?: number;
  status?: 'cumplido' | 'vencido';
  page?: number;
  limit?: number;
}) => {
  try {
    const response = await apiClient.get('/sla/tickets', { params });
    return response.data;
  } catch (error) {
    logger.error('Error al obtener tickets SLA:', error);
    throw error;
  }
};

export default apiClient;
