import React, { useState, useEffect } from 'react';
import type { Ticket, PaginationInfo } from '../types'; // Corregido para apuntar al directorio types/index.ts
import FilterPanel from '../components/analytics/FilterPanel.tsx';
import { DataTable } from '../components/tables/DataTable.tsx';

import Pagination from '../components/tables/Pagination.tsx'; // Importar el componente de paginación
// Importamos íconos para mejorar la UI según la guía de diseño
import { ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
// Importar utilidades de exportación seguras
import { exportTicketsToExcel, exportTicketsToCSV } from '../utils/exportUtils';

// Definir interfaces para las opciones de filtro
interface TransporteOption {
  id: number;
  value: string;
}

const AnalyticsView: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState({});
  const [transporteOptions, setTransporteOptions] = useState<TransporteOption[]>([]); // Cambiado a objetos {id, value}
  const [staffOptions, setStaffOptions] = useState<{ staff_id: number; name: string }[]>([]);
  const [sectorOptions, setSectorOptions] = useState<{ id: number; name: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ id: number; name: string; state: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Función para cargar opciones de filtros
  const fetchFilterOptions = async () => {
    try {
      console.log('Fetching filter options...');
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
          console.log('Transporte data:', transporteData);
          if (Array.isArray(transporteData) && transporteData.length > 0) {
            // Guardar los objetos completos {id, value}
            setTransporteOptions(transporteData);
          } else {
            console.warn('Transporte data is empty');
            setTransporteOptions([]);
          }
        } catch (e) {
          console.error('Error parsing transporte data:', e);
          setTransporteOptions([]);
        }
      } else {
        console.warn('Transporte response not OK');
        setTransporteOptions([]);
      }
      
      // Procesar opciones de staff
      if (staffRes.ok) {
        try {
          const staffData = await staffRes.json();
          console.log('Staff data:', staffData);
          setStaffOptions(Array.isArray(staffData) ? staffData : []);
        } catch (e) {
          console.error('Error parsing staff data:', e);
          setStaffOptions([]);
        }
      } else {
        setStaffOptions([]);
      }
      
      // Procesar opciones de sector
      if (sectorRes.ok) {
        try {
          const sectorData = await sectorRes.json();
          console.log('Sector data:', sectorData);
          if (Array.isArray(sectorData) && sectorData.length > 0) {
            setSectorOptions(sectorData);
          } else {
            console.warn('Sector data is empty');
            setSectorOptions([]);
          }
        } catch (e) {
          console.error('Error parsing sector data:', e);
          setSectorOptions([]);
        }
      } else {
        console.warn('Sector response not OK');
        setSectorOptions([]);
      }
      
      // Procesar opciones de status
      if (statusRes.ok) {
        try {
          const statusData = await statusRes.json();
          console.log('Status data:', statusData);
          setStatusOptions(Array.isArray(statusData) ? statusData : []);
        } catch (e) {
          console.error('Error parsing status data:', e);
          setStatusOptions([]);
        }
      } else {
        setStatusOptions([]);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Inicializar con arreglos vacíos en caso de error
      setTransporteOptions([]);
      setStaffOptions([]);
      setSectorOptions([]);
      setStatusOptions([]);
    }
  };

  const fetchTickets = async (currentFilters: any = {}, page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50'); // Mostrar 50 registros por página

      // Añadir parámetros de filtro si existen
      if (currentFilters.transporte) params.append('transporte', currentFilters.transporte);
      if (currentFilters.staff) params.append('staff', currentFilters.staff);
      if (currentFilters.organization) params.append('organization', currentFilters.organization);
      if (currentFilters.statuses) params.append('statuses', currentFilters.statuses);
      if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

      const url = `/api/tickets?${params.toString()}`;
      
      console.log('Fetching tickets with URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      // El endpoint /api/tickets devuelve {data: [...], pagination: {...}}
      console.log('Tickets recibidos:', data.data?.length || 0);
      setTickets(data.data || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (newFilters: any) => {
    console.log('Aplicando filtros:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Resetear a la primera página al aplicar filtros
    fetchTickets(newFilters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTickets(filters, page);
  };

  // Cargar tickets al montar el componente
  useEffect(() => {
    fetchFilterOptions();
    fetchTickets(filters, currentPage);
  }, []); // Empty dependency array is correct here for initial load

  const exportToExcel = () => {
    // Generate filename with current date and time
    const now = new Date();
    const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.xls`;
    
    // Use the secure export function
    exportTicketsToExcel(tickets, {
      filename: fileName,
      includeFilters: true,
      filters: filters
    });
  };

  const exportToCSV = () => {
    // Generate filename with current date and time
    const now = new Date();
    const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.csv`;
    
    // Use the secure CSV export function
    exportTicketsToCSV(tickets, {
      filename: fileName,
      includeFilters: true,
      filters: filters
    });
  };

  return (
    <div className="max-w-1400 mx-auto px-8 py-12 bg-[#0a0e14] text-[#ffffff]">
      {/* Header Dashboard según guía de diseño */}
      <div className="dashboard-header flex justify-between items-center mb-8">
        <div className="header-left">
          <h1 className="text-h1 text-[1.875rem] leading-[1.3] font-semibold text-[#ffffff] mb-1">Análisis Avanzado de Tickets</h1>
          <span className="text-small text-[0.75rem] leading-[1.4] text-[#7a8394]">Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="header-right flex space-x-4">
          <div className="flex space-x-2">
            <button 
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]"
              title="Exportar como Excel (.xls)"
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2" />
              <span>Excel</span>
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]"
              title="Exportar como CSV (.csv)"
            >
              <DocumentChartBarIcon className="w-5 h-5 mr-2" />
              <span>CSV</span>
            </button>
          </div>
          <button 
            onClick={() => fetchTickets(filters, currentPage)}
            className="flex items-center px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]"
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
        <div className="flex flex-col justify-center items-center h-64 bg-[#1a1f29] rounded-xl shadow-lg border border-[#2d3441] p-8 animate-fadeIn">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00d9ff] mb-4"></div>
          <p className="text-[#b8c5d6] text-base">Cargando datos...</p>
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
    </div>
  );
};

export default AnalyticsView;
