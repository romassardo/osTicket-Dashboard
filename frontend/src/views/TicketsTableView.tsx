import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { DataTable } from '../components/tables/DataTable.tsx';
import SearchBar from '../components/tables/SearchBar.tsx';
import Pagination from '../components/tables/Pagination.tsx';
import type { Ticket, PaginationInfo, AdvancedFilters } from '../types';
import { useDebounce } from '../lib/hooks';
import { useConfig } from '../contexts/ConfigContext';
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
  
  // Separar los filtros en estados individuales para mejor control
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Usar custom hook useDebounce para optimizar búsquedas
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');

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
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', config.defaultTableSize.toString());

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (selectedStatuses && selectedStatuses.length > 0) {
        // Convertir a strings si son números
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

      const url = `/api/tickets?${params.toString()}`;
      logger.debug('Frontend: URL completa:', url);
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los tickets');
      }
      const data = await response.json();
      setTickets(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, selectedStatuses, dateRange, selectedSector, selectedStaff]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
  }, []);

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
    return count;
  }, [searchTerm, selectedStatuses, dateRange, selectedSector, selectedStaff]);

  return (
    <div className="p-6 lg:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Gestión de tickets de soporte para el departamento de Soporte IT
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
          <div className="bg-white dark:bg-slate-800 rounded-xl p-10 text-center border border-gray-200 dark:border-slate-600 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-cyan-400 mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">Cargando tickets...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-10 text-center border border-gray-200 dark:border-slate-600 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Error al cargar tickets</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-10 text-center border border-gray-200 dark:border-slate-600 shadow-lg">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-gray-700 dark:text-gray-300 font-medium">No se encontraron tickets</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Intenta con otros filtros de búsqueda</p>
            </div>
          </div>
        ) : (
          <DataTable tickets={tickets} totalCount={pagination?.total_items || tickets.length} />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="mt-6 flex justify-end">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
});

// Asignar displayName para debugging en React DevTools
TicketsTableView.displayName = 'TicketsTableView';

export default TicketsTableView;
