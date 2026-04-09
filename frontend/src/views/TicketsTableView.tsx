import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useSound } from '../context/SoundContext'; // Importar el hook de sonido global
import { requestNotificationPermission, showNewTicketNotification } from '../utils/notifications';
import { DataTable } from '../components/tables/DataTable.tsx';
import SearchBar from '../components/tables/SearchBar.tsx';
import Pagination from '../components/tables/Pagination.tsx';
import TicketDetailModal from '../components/modals/TicketDetailModal';
import type { Ticket, PaginationInfo, AdvancedFilters } from '../types';
import { useDebounce } from '../lib/hooks';
import { useConfig } from '../context/ConfigContext';
import logger from '../utils/logger';

/**
 * TicketsTableView optimizado con React.memo y useDebounce
 * Optimización de dependency arrays y uso de custom hooks [[memory:2988538]]
 */
const TicketsTableView: React.FC = memo(() => {
  const { config } = useConfig();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const { isSoundEnabled, playNotificationSound } = useSound();
  const previousTicketCountRef = useRef<number | null>(null);

  // Solicitar permiso para notificaciones al montar el componente
  useEffect(() => {
    requestNotificationPermission();
  }, []); // Usar el contexto global
  
  // Separar los filtros en estados individuales para mejor control
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Usar custom hook useDebounce para optimizar búsquedas
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  // NUEVO: tipo de fecha
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedSla, setSelectedSla] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Estado para el modal de detalle de ticket
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Función para manejar clic en ticket
  const handleTicketClick = useCallback((ticketId: number) => {
    logger.info(`Abriendo detalle del ticket: ${ticketId}`);
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  }, []);

  // Función para cerrar el modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTicketId(null);
  }, []);

  // Comentamos este objeto memoizado ya que no se está utilizando actualmente
  // Si se necesita en el futuro, se puede descomentar
  /*
  const filters = useMemo(() => ({
    search: searchTerm,
    selectedStatuses,
    dateRange,
    selectedOrganization,
    selectedStaff
  }), [searchTerm, selectedStatuses, dateRange, selectedOrganization, selectedStaff]);
  */

  // Memorizar la función fetchTickets para evitar recreaciones
  const fetchTickets = useCallback(async (isAutoRefreshParam: boolean = false) => {
    const isAutoRefresh = isAutoRefreshParam;
    if (!isAutoRefresh) {
      setLoading(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', config.defaultTableSize.toString());

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (selectedStatuses && selectedStatuses.length > 0) {
        // Enviar todos los estados seleccionados como array
        const statusesStr = selectedStatuses.map(s => s.toString()).join(',');
        params.append('statuses', statusesStr);
        logger.debug('Frontend: enviando statuses:', statusesStr);
      }
      if (dateRange && dateRange[0]) {
        const startDateStr = dateRange[0].toISOString().split('T')[0];
        params.append('startDate', startDateStr);
        logger.debug('Frontend: enviando startDate:', startDateStr);
      }
      if (dateRange && dateRange[1]) {
        const endDateStr = dateRange[1].toISOString().split('T')[0];
        params.append('endDate', endDateStr);

        logger.debug('Frontend: enviando endDate:', endDateStr);
      }
      if (selectedSector) {
        params.append('sector', selectedSector.toString());
        logger.debug('Frontend: enviando sector:', selectedSector);
      }
      if (selectedStaff) {
        params.append('staff', selectedStaff.toString());
        logger.debug('Frontend: enviando staff:', selectedStaff);
      }
      if (selectedSla) {
        params.append('sla', selectedSla.toString());
        logger.debug('Frontend: enviando sla:', selectedSla);
      }
      if (selectedRequestType) {
        params.append('requestType', selectedRequestType);
        logger.debug('Frontend: enviando requestType:', selectedRequestType);
      }
      if (sortField) {
        const colToKey: Record<string, string> = {
          'Número': 'number', 'Asunto': 'subject', 'Agente': 'agente',
          'Usuario': 'usuario', 'Creación': 'created',
          'Sector': 'sector', 'Tipo Solicitud': 'requestType',
        };
        const key = colToKey[sortField];
        if (key) {
          params.append('sortBy', key);
          params.append('sortDir', sortDir);
        }
      }

      const url = `/api/tickets?${params.toString()}`;
      logger.debug('Frontend: URL completa:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los tickets');
      }
      const data = await response.json();

      // Debug: Verificar condiciones para notificación
      logger.debug('🔍 Verificando condiciones para notificación:', {
        isSoundEnabled,
        isAutoRefresh,
        hasPagination: !!data.pagination,
        totalTickets,
        newTotalItems: data.pagination?.total_items,
        ticketsLength: data.tickets?.length,
        previousTicketsLength: tickets.length
      });

      // Condición simplificada: solo verificar si es auto-refresh y hay sonido habilitado
      if (isSoundEnabled && isAutoRefresh) {
        logger.info('🔊 Condiciones básicas cumplidas para notificación');
        
        // Verificar si hay nuevos tickets comparando con el conteo anterior
        const currentCount = data.pagination?.total_items || 0;
        const previousCount = previousTicketCountRef.current;
        
        logger.debug(`📊 Comparando conteos - Anterior: ${previousCount}, Actual: ${currentCount}`);
        
        if (previousCount !== null && currentCount > previousCount) {
          logger.info('🎵 ¡Nuevo ticket detectado por conteo! Reproduciendo sonido...');
          logger.info(`📊 Total anterior: ${previousCount}, Total nuevo: ${currentCount}`);
          
          playNotificationSound().catch(error => logger.error('Error al reproducir el sonido:', error));
          
          // Mostrar notificación visual
          const prevTickets = tickets;
          const newTicket = data.tickets.find(t => !prevTickets.some(pt => pt.id === t.id));
          if (newTicket) {
            logger.info('📱 Mostrando notificación visual para ticket:', newTicket.number);
            showNewTicketNotification(newTicket.number);
          } else {
            logger.warn('⚠️ No se pudo identificar el ticket específico, pero hay más tickets');
            showNewTicketNotification('nuevo');
          }
        } else if (previousCount === null) {
          logger.debug('🔍 Primera carga - guardando conteo inicial');
        } else {
          logger.debug('🔍 No hay nuevos tickets detectados');
        }
        
        // Actualizar la referencia del conteo anterior
        previousTicketCountRef.current = currentCount;
      } else {
        logger.debug('🔇 Condiciones no cumplidas:', { isSoundEnabled, isAutoRefresh });
      }

      setTickets(data.tickets || []);
      setPagination(data.pagination);
      if (data.pagination) {
        setTotalTickets(data.pagination.total_items);
      }
      setLastFetchTime(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedStatuses, dateRange, selectedSector, selectedStaff, selectedSla, selectedRequestType, sortField, sortDir]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const intervalMs = config.refreshInterval * 1000;
    const intervalId = setInterval(() => {
      fetchTickets(true);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [fetchTickets, config.refreshInterval]);

  const handleSearch = useCallback((newSearchTerm: string) => {
    setCurrentPage(1); // Reset to first page on new search
    setSearchTerm(newSearchTerm);
  }, []);

  const handleApplyFilters = useCallback((appliedFilters: AdvancedFilters) => {
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedStatuses(appliedFilters.selectedStatuses || []);
    setDateRange(appliedFilters.dateRange || [null, null]);

    setSelectedSector(appliedFilters.selectedSector || '');
    setSelectedStaff(appliedFilters.selectedStaff || '');
    setSelectedSla(appliedFilters.selectedSla || '');
    setSelectedRequestType(appliedFilters.selectedRequestType || '');
  }, []);

  const handleSort = useCallback((header: string) => {
    if (sortField === header) {
      if (sortDir === 'desc') {
        // Tercer click: quitar sort → volver a default
        setSortField(null);
        setSortDir('desc');
      } else {
        // Segundo click: pasar a desc
        setSortDir('desc');
      }
    } else {
      // Primera vez en esta columna: asc
      setSortField(header);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }, [sortField, sortDir]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRetry = useCallback(() => {
    // Simplemente llamar fetchTickets directamente
    fetchTickets();
  }, [fetchTickets]);

  // Memoizar contador de filtros activos para optimización
  const getActiveFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++; // Usar searchTerm inmediato para UX responsive
    if (selectedStatuses && selectedStatuses.length > 0) count++;
    if (dateRange && (dateRange[0] || dateRange[1])) count++;
    if (selectedSector) count++;
    if (selectedStaff) count++;
    if (selectedSla) count++;
    if (selectedRequestType) count++;
    return count;
  }, [searchTerm, selectedStatuses, dateRange, selectedSector, selectedStaff, selectedSla, selectedRequestType]);

  return (
    <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Tickets</h1>
          <p style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Gestión de tickets de soporte — Departamento IT
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchBar 
        onSearch={handleSearch} 
        onApplyFilters={handleApplyFilters}
        loading={loading}
        activeFilters={getActiveFilterCount > 0}
      />

      {/* Table Container */}
      <div className="mt-6">
        {loading ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 mb-4" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }}></div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'var(--font-body)' }}>Cargando tickets...</p>
            </div>
          </div>
        ) : error ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex flex-col items-center justify-center">
              <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--error)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.5rem' }}>Error al cargar tickets</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{error}</p>
              <button 
                onClick={handleRetry}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8125rem', transition: 'all 150ms ease' }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex flex-col items-center justify-center">
              <svg className="w-10 h-10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>No se encontraron tickets</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.35rem' }}>Intenta con otros filtros de búsqueda</p>
            </div>
          </div>
        ) : (
          <DataTable 
            tickets={tickets} 
            totalCount={pagination?.total_items || tickets.length}
            onTicketClick={handleTicketClick}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex justify-end">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Modal de detalle de ticket */}
      {isModalOpen && selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
});

// Asignar displayName para debugging en React DevTools
TicketsTableView.displayName = 'TicketsTableView';

export default TicketsTableView;
