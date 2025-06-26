// frontend/src/components/analytics/FilterPanel.tsx
import React, { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Define los tipos para las opciones de los filtros
interface StaffOption {
  staff_id: number;
  name: string;
}

interface SectorOption {
  id: number;
  name: string;
}

interface StatusOption {
  id: number;
  name: string;
  state: string;
}

interface TransporteOption {
  id: number;
  value: string;
}

// Define las props del componente
interface FilterPanelProps {
  transporteOptions: TransporteOption[];
  staffOptions: StaffOption[];
  sectorOptions: SectorOption[];
  statusOptions: StatusOption[];
  onApplyFilters: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  transporteOptions, 
  staffOptions,
  sectorOptions,
  statusOptions,
  onApplyFilters 
}) => {
  // Estados para los filtros seleccionados
  const [selectedTransporte, setSelectedTransporte] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    const filters: any = {};
    if (selectedTransporte) filters.transporte = parseInt(selectedTransporte, 10);
    if (selectedStaff) filters.staff = parseInt(selectedStaff, 10);
    if (selectedSector) filters.organization = parseInt(selectedSector, 10); // El backend espera 'organization'
    if (selectedStatus) filters.statuses = parseInt(selectedStatus, 10); // El backend espera 'statuses'
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    console.log('Aplicando filtros:', filters);
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setSelectedTransporte('');
    setSelectedStaff('');
    setSelectedSector('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    onApplyFilters({});
  };

  return (
    <div className="bg-[#1a1f29] p-6 rounded-xl shadow-lg mb-6 border border-[#2d3441] transition-all duration-300 hover:shadow-xl animate-slideInUp">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-[#00d9ff] mr-2" />
          <h2 className="text-h2 text-[1.25rem] leading-[1.4] font-semibold text-[#ffffff]">Filtros Avanzados</h2>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center px-3 py-1 text-[0.75rem] bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Limpiar
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        
        {/* Filtro por Agente */}
        <div className="lg:col-span-1">
          <label htmlFor="staff" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Agente</label>
          <select
            id="staff"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200"
          >
            <option value="">Todos</option>
            {staffOptions.map(option => (
              <option key={option.staff_id} value={option.staff_id}>{option.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Sector */}
        <div className="lg:col-span-1">
          <label htmlFor="sector" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Sector</label>
          <select
            id="sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200"
          >
            <option value="">Todos</option>
            {sectorOptions && sectorOptions.length > 0 ? (
              sectorOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))
            ) : (
              <option value="" disabled>No hay sectores disponibles</option>
            )}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div className="lg:col-span-1">
          <label htmlFor="status" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Estado</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200"
          >
            <option value="">Todos</option>
            {statusOptions.map(option => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Transporte */}
        <div className="lg:col-span-1">
          <label htmlFor="transporte" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Transporte</label>
          <select
            id="transporte"
            value={selectedTransporte}
            onChange={(e) => setSelectedTransporte(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200"
          >
            <option value="">Todos</option>
            {transporteOptions && transporteOptions.length > 0 ? (
              transporteOptions.map(option => (
                <option key={option.id} value={option.id}>{option.value}</option>
              ))
            ) : (
              <option value="" disabled>No hay opciones de transporte disponibles</option>
            )}
          </select>
        </div>

        {/* Filtro por Fecha de Inicio */}
        <div className="lg:col-span-1">
          <label htmlFor="start-date" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Fecha Inicio</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#2d3441] bg-[#252a35] text-[#ffffff] py-2 px-3 focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] text-[0.875rem] transition-colors duration-200"
          />
        </div>

        {/* Filtro por Fecha de Fin */}
        <div className="lg:col-span-1">
          <label htmlFor="end-date" className="block text-[0.75rem] font-medium text-[#b8c5d6] mb-1">Fecha Fin</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[#2d3441] bg-[#252a35] text-[#ffffff] py-2 px-3 focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] text-[0.875rem] transition-colors duration-200"
          />
        </div>

        {/* Botón de Aplicar */}
        <div className="flex items-end lg:col-span-1">
          <button
            onClick={handleApply}
            className="w-full justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#00d9ff] hover:bg-[#00c5e8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition-all duration-200 transform hover:scale-[1.02]"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
