import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Ticket, PaginationInfo } from '../types'; // Corregido para apuntar al directorio types/index.ts
import FilterPanel from '../components/analytics/FilterPanel.tsx';
import { DataTable } from '../components/tables/DataTable.tsx';

import Pagination from '../components/tables/Pagination.tsx'; // Importar el componente de paginación
// Importamos íconos para mejorar la UI según la guía de diseño
import { ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
// Importar utilidades de exportación seguras
import { exportTicketsToExcel, exportTicketsToCSV } from '../utils/exportUtils';
import { useConfig } from '../contexts/ConfigContext';
import logger from '../utils/logger';

// Definir interfaces para las opciones de filtro
interface TransporteOption {
  id: number;
  value: string;
}

/**
 * AnalyticsView optimizado con React.memo y useCallback para evitar re-renders innecesarios
 * Vista principal de analytics - useEffect optimization needed según memorias del proyecto [[memory:2988538]]
 */
const AnalyticsView: React.FC = memo(() => {
  const { config } = useConfig();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false); // Nuevo estado para exportación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState({});
  
  // Estados para opciones de filtro
  const [transporteOptions, setTransporteOptions] = useState<TransporteOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [sectorOptions, setSectorOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);

  // Memoizar función fetchFilterOptions para evitar recreaciones
  const fetchFilterOptions = useCallback(async () => {
    try {
      logger.info('Fetching filter options...');
      const [transporteRes, staffRes, sectorRes, statusRes] = await Promise.all([
        fetch('/api/tickets/options/transporte'),
        fetch('/api/tickets/options/staff'),
        fetch('/api/tickets/options/sector'),
        fetch('/api/tickets/options/status'),
      ]);

      // Procesar opciones de transporte
      if (transporteRes.ok) {
        try {
          const transporteData = await transporteRes.json();
          logger.info('Transporte data:', transporteData);
          if (Array.isArray(transporteData) && transporteData.length > 0) {
            // Guardar los objetos completos {id, value}
            setTransporteOptions(transporteData);
          } else {
            logger.warn('Transporte data is empty');
            setTransporteOptions([]);
          }
        } catch (e) {
          logger.error('Error parsing transporte data:', e);
          setTransporteOptions([]);
        }
      } else {
        logger.warn('Transporte response not OK');
        setTransporteOptions([]);
      }
      
      // Procesar opciones de staff
      if (staffRes.ok) {
        try {
          const staffData = await staffRes.json();
          logger.info('Staff data:', staffData);
          setStaffOptions(Array.isArray(staffData) ? staffData : []);
        } catch (e) {
          logger.error('Error parsing staff data:', e);
          setStaffOptions([]);
        }
      } else {
        setStaffOptions([]);
      }
      
      // Procesar opciones de sector
      if (sectorRes.ok) {
        try {
          const sectorData = await sectorRes.json();
          logger.info('Sector data:', sectorData);
          setSectorOptions(Array.isArray(sectorData) ? sectorData : []);
        } catch (e) {
          logger.error('Error parsing sector data:', e);
          setSectorOptions([]);
        }
      } else {
        setSectorOptions([]);
      }
      
      // Procesar opciones de status
      if (statusRes.ok) {
        try {
          const statusData = await statusRes.json();
          logger.info('Status data:', statusData);
          setStatusOptions(Array.isArray(statusData) ? statusData : []);
        } catch (e) {
          logger.error('Error parsing status data:', e);
          setStatusOptions([]);
        }
      } else {
        setStatusOptions([]);
      }
    } catch (error) {
      logger.error('Error fetching filter options:', error);
      setTransporteOptions([]);
      setStaffOptions([]);
      setSectorOptions([]);
      setStatusOptions([]);
    }
  }, []); // Sin dependencias ya que solo configura estados internos

  // Memoizar función fetchTickets para evitar recreaciones
  const fetchTickets = useCallback(async (currentFilters: any = {}, page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', config.defaultTableSize.toString()); // Usar límite configurable

      // Añadir parámetros de filtro si existen
      if (currentFilters.transporte) params.append('transporte', currentFilters.transporte);
      if (currentFilters.staff) params.append('staff', currentFilters.staff);
      if (currentFilters.sector) params.append('sector', currentFilters.sector);
      if (currentFilters.statuses) params.append('statuses', currentFilters.statuses);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

      const url = `/api/tickets?${params.toString()}`;
      
      logger.info('Fetching tickets with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // El endpoint /api/tickets devuelve {data: [...], pagination: {...}}
      logger.info('Tickets recibidos:', data.data?.length || 0);
      setTickets(data.data || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Error fetching tickets:', error);
      setTickets([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoizar función fetchAllTicketsForExport para evitar recreaciones  
  const fetchAllTicketsForExport = useCallback(async (currentFilters: any = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '99999'); // Usar número muy alto en lugar de 'all' para obtener todos los registros
      params.append('page', '1'); // Especificar página 1

      // Añadir parámetros de filtro si existen
      if (currentFilters.transporte) params.append('transporte', currentFilters.transporte);
      if (currentFilters.staff) params.append('staff', currentFilters.staff);
      if (currentFilters.sector) params.append('sector', currentFilters.sector);
      if (currentFilters.statuses) params.append('statuses', currentFilters.statuses);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

      const url = `/api/tickets?${params.toString()}`;
      
      logger.info('Fetching ALL tickets for export with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      logger.info('Total tickets para exportación:', data.data?.length || 0);
      logger.info('Pagination info:', data.pagination);
      return data.data || [];
    } catch (error) {
      logger.error('Error fetching all tickets for export:', error);
      throw error;
    }
  }, []); // Sin dependencias externas ya que usa parámetros

  // Memoizar applyFilters para evitar recreaciones
  const applyFilters = useCallback((newFilters: any) => {
    logger.info('Aplicando filtros:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a la primera página al aplicar filtros
    fetchTickets(newFilters, 1);
  }, [fetchTickets]);

  // Memoizar handlePageChange para evitar recreaciones
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchTickets(filters, page);
  }, [fetchTickets, filters]);

  // Cargar opciones de filtro solo al montar el componente
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]); // Ejecutar solo cuando fetchFilterOptions cambie

  // Cargar tickets cuando cambien filters o currentPage
  useEffect(() => {
    fetchTickets(filters, currentPage);
  }, [fetchTickets, filters, currentPage]); // Dependencias correctas

  // Memoizar exportToExcel para evitar recreaciones
  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      // Obtener TODOS los tickets filtrados para exportación
      const allTicketsForExport = await fetchAllTicketsForExport(filters);
      
      if (allTicketsForExport.length === 0) {
        alert('No hay datos para exportar con los filtros aplicados.');
        return;
      }

      // DEBUG: Log de la estructura de datos para debuggear el problema de transporte
      logger.info('🔍 DEBUG EXPORTACIÓN: Estructura de datos recibidos:');
      logger.info('🔍 DEBUG EXPORTACIÓN: Primer ticket completo:', JSON.stringify(allTicketsForExport[0], null, 2));
      logger.info('🔍 DEBUG EXPORTACIÓN: Cantidad total de tickets:', allTicketsForExport.length);

      // Verificar la estructura de cdata para transporte en los primeros 3 tickets
      allTicketsForExport.slice(0, 3).forEach((ticket: any, index: number) => {
        logger.info(`🔍 DEBUG EXPORTACIÓN: Ticket ${index + 1} cdata:`, JSON.stringify(ticket.cdata, null, 2));
        logger.info(`🔍 DEBUG EXPORTACIÓN: Ticket ${index + 1} transporte value:`, ticket.cdata?.transporte);
        if (ticket.cdata?.TransporteName) {
          logger.info(`🔍 DEBUG EXPORTACIÓN: Ticket ${index + 1} TransporteName:`, JSON.stringify(ticket.cdata.TransporteName, null, 2));
        }
        if (ticket.cdata?.dataValues) {
          logger.info(`🔍 DEBUG EXPORTACIÓN: Ticket ${index + 1} dataValues:`, JSON.stringify(ticket.cdata.dataValues, null, 2));
        }
      });

      // Generate filename with current date and time
      const now = new Date();
      const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.xlsx`;
      
      // Use the secure Excel export function with ALL filtered data
      exportTicketsToExcel(allTicketsForExport, {
        filename: fileName,
        includeFilters: true,
        filters: filters
      });

      logger.info(`Excel exportado exitosamente con ${allTicketsForExport.length} registros`);
    } catch (error) {
      logger.error('Error durante la exportación a Excel:', error);
      alert('Error al exportar a Excel. Por favor, inténtelo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllTicketsForExport, filters]);

  // Memoizar exportToCSV para evitar recreaciones
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      // Obtener TODOS los tickets filtrados para exportación
      const allTicketsForExport = await fetchAllTicketsForExport(filters);
      
      if (allTicketsForExport.length === 0) {
        alert('No hay datos para exportar con los filtros aplicados.');
        return;
      }

      // Generate filename with current date and time
      const now = new Date();
      const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.csv`;
      
      // Use the secure CSV export function with ALL filtered data
      exportTicketsToCSV(allTicketsForExport, {
        filename: fileName,
        includeFilters: true,
        filters: filters
      });

      logger.info(`CSV exportado exitosamente con ${allTicketsForExport.length} registros`);
    } catch (error) {
      logger.error('Error durante la exportación a CSV:', error);
      alert('Error al exportar a CSV. Por favor, inténtelo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  }, [fetchAllTicketsForExport, filters]);

  return (
    <div className="max-w-1400 mx-auto px-8 py-12 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      {/* Header Dashboard según guía de diseño */}
      <div className="dashboard-header flex justify-between items-center mb-8">
        <div className="header-left">
          <h1 className="text-h1 text-[1.875rem] leading-[1.3] font-semibold text-gray-900 dark:text-white mb-1">Análisis Avanzado de Tickets</h1>
          <span className="text-small text-[0.75rem] leading-[1.4] text-gray-600 dark:text-gray-300">Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="header-right flex space-x-4">
          <div className="flex space-x-2">
            <button 
              onClick={exportToExcel}
              disabled={isExporting || isLoading}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                isExporting || isLoading 
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
              }`}
              title="Exportar como Excel (.xlsx - archivo Excel nativo)"
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2" />
              <span>{isExporting ? 'Exportando...' : 'Excel'}</span>
            </button>
            <button 
              onClick={exportToCSV}
              disabled={isExporting || isLoading}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                isExporting || isLoading 
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
              }`}
              title="Exportar como CSV (.csv)"
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2" />
              <span>{isExporting ? 'Exportando...' : 'CSV'}</span>
            </button>
          </div>
          
          <button
            onClick={() => fetchTickets(filters, currentPage)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
      
      {/* Panel de filtros con estilos actualizados */}
      <FilterPanel 
        transporteOptions={transporteOptions}
        staffOptions={staffOptions}
        sectorOptions={sectorOptions}
        statusOptions={statusOptions}
        onApplyFilters={applyFilters}
      />
      
      {/* Estado de carga con animación mejorada según guía */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 p-8 animate-fadeIn">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 dark:border-cyan-400 mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 text-base">Cargando datos...</p>
        </div>
      ) : (
        <>
          <DataTable tickets={tickets} />
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex justify-end">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      )}

      {/* Indicador de exportación */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-gray-200 dark:border-slate-600 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-cyan-400 mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 text-lg">Procesando exportación...</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Obteniendo todos los registros filtrados</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Asignar displayName para debugging en React DevTools
AnalyticsView.displayName = 'AnalyticsView';

export default AnalyticsView;
