import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { Ticket, PaginationInfo, AdvancedFilters } from '../types';
import { DataTable } from '../components/tables/DataTable.tsx';
import SearchBar from '../components/tables/SearchBar.tsx';
import Pagination from '../components/tables/Pagination.tsx';
import { ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { exportTicketsToExcel, exportTicketsToCSV } from '../utils/exportUtils';
import { useConfig } from '../context/ConfigContext';
import { useDebounce } from '../lib/hooks';
import logger from '../utils/logger';

const getSlaStatusCode = (
  ticket: Ticket
): 'cumplido' | 'no_cumplido' | 'en_curso' | 'sin_sla' | 'sin_datos' => {
  const sla = ticket.sla;

  if (!sla || !sla.grace_period) {
    return 'sin_sla';
  }

  if (!ticket.closed || ticket.closed === '0000-00-00 00:00:00') {
    return 'en_curso';
  }

  const createdDate = ticket.created ? new Date(ticket.created) : null;
  const closedDate = new Date(ticket.closed);

  if (!createdDate || isNaN(createdDate.getTime()) || isNaN(closedDate.getTime())) {
    return 'sin_datos';
  }

  const diffHours = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

  if (diffHours <= sla.grace_period) {
    return 'cumplido';
  }

  return 'no_cumplido';
};

const filterTicketsBySlaStatus = (
  tickets: Ticket[],
  slaStatus?: 'cumplido' | 'no_cumplido' | 'en_curso'
): Ticket[] => {
  if (!slaStatus) {
    return tickets;
  }

  return tickets.filter((ticket) => getSlaStatusCode(ticket) === slaStatus);
};

/**
 * AnalyticsView optimizado con React.memo y useCallback para evitar re-renders innecesarios
 * Vista principal de analytics - useEffect optimization needed según memorias del proyecto [[memory:2988538]]
 */
const AnalyticsView: React.FC = memo(() => {
  const { config } = useConfig();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Memoizar función fetchTickets para evitar recreaciones
  const fetchTickets = useCallback(async (currentFilters: any = {}, page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', config.defaultTableSize.toString()); // Usar límite configurable

      // Añadir parámetros de filtro si existen
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.sla) params.append('sla', currentFilters.sla);
      if (currentFilters.staff) params.append('staff', currentFilters.staff);
      if (currentFilters.sector) params.append('sector', currentFilters.sector);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.requestType) params.append('requestType', currentFilters.requestType);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);
      // NOTA: slaStatus se maneja solo en frontend, no se envía al backend
      if (currentFilters.sortBy) { params.append('sortBy', currentFilters.sortBy); params.append('sortDir', currentFilters.sortDir || 'desc'); }

      const url = `/api/tickets/reports?${params.toString()}`;
      logger.info('Fetching tickets with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // El endpoint /api/tickets/reports devuelve {tickets: [...], pagination: {...}}
      logger.info('Tickets recibidos:', data.tickets?.length || 0);
      setTickets(data.tickets || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Error fetching tickets:', error);
      setTickets([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [config.defaultTableSize]);

  // Memoizar función fetchAllTicketsForExport para evitar recreaciones  
  const fetchAllTicketsForExport = useCallback(async (currentFilters: any = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '99999'); // Usar número muy alto en lugar de 'all' para obtener todos los registros
      params.append('page', '1'); // Especificar página 1

      // Añadir parámetros de filtro si existen
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.sla) params.append('sla', currentFilters.sla);
      if (currentFilters.staff) params.append('staff', currentFilters.staff);
      if (currentFilters.sector) params.append('sector', currentFilters.sector);
      if (currentFilters.status) params.append('status', currentFilters.status);
      if (currentFilters.requestType) params.append('requestType', currentFilters.requestType);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

      const url = `/api/tickets/reports?${params.toString()}`;
      logger.info('Fetching ALL tickets for export with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      logger.info('Total tickets para exportación:', data.tickets?.length || 0);
      logger.info('Pagination info:', data.pagination);
      return data.tickets || [];
    } catch (error) {
      logger.error('Error fetching all tickets for export:', error);
      throw error;
    }
  }, []); // Sin dependencias externas ya que usa parámetros

  // Handler: búsqueda por texto desde SearchBar
  const handleSearch = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  }, []);

  // Handler: filtros avanzados desde AdvancedSearchModal
  const handleApplyFilters = useCallback((advancedFilters: AdvancedFilters) => {
    const newFilters: any = {};
    if (advancedFilters.selectedSla) newFilters.sla = advancedFilters.selectedSla;
    if (advancedFilters.selectedStaff) newFilters.staff = advancedFilters.selectedStaff;
    if (advancedFilters.selectedSector) newFilters.sector = advancedFilters.selectedSector;
    if (advancedFilters.selectedRequestType) newFilters.requestType = advancedFilters.selectedRequestType;
    if (advancedFilters.selectedStatuses && advancedFilters.selectedStatuses.length > 0) {
      newFilters.status = advancedFilters.selectedStatuses[0];
    }
    if (advancedFilters.dateRange) {
      if (advancedFilters.dateRange[0]) newFilters.startDate = advancedFilters.dateRange[0].toISOString().split('T')[0];
      if (advancedFilters.dateRange[1]) newFilters.endDate = advancedFilters.dateRange[1].toISOString().split('T')[0];
    }
    if (advancedFilters.slaStatus) newFilters.slaStatus = advancedFilters.slaStatus;
    logger.info('Aplicando filtros avanzados:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Memoizar handlePageChange para evitar recreaciones
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Construir filtros combinados (search + modal filters)
  const combinedFilters = useMemo(() => {
    const combined = { ...filters };
    if (debouncedSearchTerm) combined.search = debouncedSearchTerm;
    return combined;
  }, [filters, debouncedSearchTerm]);

  // Cargar tickets cuando cambien filtros combinados o currentPage
  useEffect(() => {
    fetchTickets(combinedFilters, currentPage);
  }, [fetchTickets, combinedFilters, currentPage]);

  const handleSort = useCallback((header: string) => {
    const colToKey: Record<string, string> = {
      'Número': 'number', 'Asunto': 'subject', 'Agente': 'agente',
      'Usuario': 'usuario', 'Creación': 'created',
    };
    const key = colToKey[header];
    if (!key) return;
    setSortField(prev => {
      const newDir = prev === header ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
      setSortDir(newDir);
      setFilters((f: any) => ({ ...f, sortBy: key, sortDir: newDir }));
      setCurrentPage(1);
      return header;
    });
  }, [sortDir]);

  // Contar filtros activos para indicador visual
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.sla) count++;
    if (filters.staff) count++;
    if (filters.sector) count++;
    if (filters.status) count++;
    if (filters.requestType) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.slaStatus) count++;
    return count;
  }, [searchTerm, filters]);

  // Memoizar exportToExcel para evitar recreaciones
  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      // Obtener TODOS los tickets filtrados para exportación
      const allTicketsForExport = await fetchAllTicketsForExport(filters);

      const currentSlaStatus = (filters as any).slaStatus as
        | 'cumplido'
        | 'no_cumplido'
        | 'en_curso'
        | undefined;

      const allTicketsFiltered = filterTicketsBySlaStatus(
        allTicketsForExport,
        currentSlaStatus === 'cumplido' || currentSlaStatus === 'no_cumplido' || currentSlaStatus === 'en_curso'
          ? currentSlaStatus
          : undefined
      );
      
      if (allTicketsFiltered.length === 0) {
        alert('No hay datos para exportar con los filtros aplicados.');
        return;
      }

      // DEBUG: Log de la estructura de datos para debuggear el problema de transporte
      logger.info('🔍 DEBUG EXPORTACIÓN: Estructura de datos recibidos:');
      logger.info('🔍 DEBUG EXPORTACIÓN: Primer ticket completo:', JSON.stringify(allTicketsFiltered[0], null, 2));
      logger.info('🔍 DEBUG EXPORTACIÓN: Cantidad total de tickets tras filtro SLA:', allTicketsFiltered.length);

      // Verificar la estructura de cdata para transporte en los primeros 3 tickets
      allTicketsFiltered.slice(0, 3).forEach((ticket: any, index: number) => {
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
      exportTicketsToExcel(allTicketsFiltered, {
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

      const currentSlaStatus = (filters as any).slaStatus as
        | 'cumplido'
        | 'no_cumplido'
        | 'en_curso'
        | undefined;

      const allTicketsFiltered = filterTicketsBySlaStatus(
        allTicketsForExport,
        currentSlaStatus === 'cumplido' || currentSlaStatus === 'no_cumplido' || currentSlaStatus === 'en_curso'
          ? currentSlaStatus
          : undefined
      );
      
      if (allTicketsFiltered.length === 0) {
        alert('No hay datos para exportar con los filtros aplicados.');
        return;
      }

      // Generate filename with current date and time
      const now = new Date();
      const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.csv`;
      
      // Use the secure CSV export function with ALL filtered data
      exportTicketsToCSV(allTicketsFiltered, {
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

  const currentSlaStatusForView = (filters as any).slaStatus as
    | 'cumplido'
    | 'no_cumplido'
    | 'en_curso'
    | undefined;

  const filteredTickets = filterTicketsBySlaStatus(
    tickets,
    currentSlaStatusForView === 'cumplido' || currentSlaStatusForView === 'no_cumplido' || currentSlaStatusForView === 'en_curso'
      ? currentSlaStatusForView
      : undefined
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 2rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Análisis Avanzado de Tickets</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>Actualizado: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={exportToExcel}
            disabled={isExporting || isLoading}
            className="header-button"
            title="Exportar como Excel (.xlsx)"
          >
            <DocumentChartBarIcon className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'Excel'}</span>
          </button>
          <button 
            onClick={exportToCSV}
            disabled={isExporting || isLoading}
            className="header-button"
            title="Exportar como CSV (.csv)"
          >
            <DocumentChartBarIcon className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'CSV'}</span>
          </button>
          <button
            onClick={() => fetchTickets(filters, currentPage)}
            disabled={isLoading}
            className="header-button"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
      
      {/* Barra de búsqueda y filtros (mismo estilo que Tickets) */}
      <SearchBar
        onSearch={handleSearch}
        onApplyFilters={handleApplyFilters}
        loading={isLoading}
        activeFilters={activeFilterCount > 0}
        showSlaStatus
      />
      
      {/* Estado de carga con animación mejorada según guía */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', padding: '2rem' }}>
          <div className="animate-spin rounded-full h-10 w-10 mb-4" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Cargando datos...</p>
        </div>
      ) : (
        <>
          <DataTable
            tickets={filteredTickets}
            totalCount={pagination?.total_items || filteredTickets.length}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex justify-end">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      )}

      {/* Indicador de exportación */}
      {isExporting && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="flex flex-col items-center" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="animate-spin rounded-full h-10 w-10 mb-4" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }}></div>
            <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>Procesando exportación...</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>Obteniendo todos los registros filtrados</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Asignar displayName para debugging en React DevTools
AnalyticsView.displayName = 'AnalyticsView';

export default AnalyticsView;
