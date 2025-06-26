import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css'; // Importar estilos personalizados

interface Status {
  id: number;
  name: string;
  state: string;
}

interface Organization {
  id: number;
  name: string;
}

interface Staff {
  staff_id: number;
  fullname: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  // DEBUG: Monitorear cambios en selectedStatuses
  useEffect(() => {
    console.log('🔍 Modal: selectedStatuses cambió a:', selectedStatuses);
  }, [selectedStatuses]);

  // DEBUG: Monitorear cuando se abre/cierra el modal
  useEffect(() => {
    console.log('🔍 Modal: isOpen cambió a:', isOpen);
    if (!isOpen) {
      console.log('🔍 Modal: Cerrando modal, estados actuales:', {
        selectedStatuses,
        startDate,
        endDate,
        selectedOrg,
        selectedStaff
      });
    }
  }, [isOpen, selectedStatuses, startDate, endDate, selectedOrg, selectedStaff]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async (url: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch from ${url}`);
          }
          const data = await response.json();
          setter(data);
        } catch (error) {
          console.error(error);
        }
      };

      fetchData('http://localhost:3001/api/statuses/simple', setStatuses);
      fetchData('http://localhost:3001/api/organizations/simple', setOrganizations);
      fetchData('http://localhost:3001/api/staff/simple', setStaff);
    }
  }, [isOpen]);

  const handleStatusChange = (statusId: number) => {
    setSelectedStatuses(prev => {
      const newStatuses = prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId];
      console.log('Modal: Estado de statuses actualizado:', newStatuses);
      return newStatuses;
    });
  };

  const handleApply = () => {
    const filtersToApply = {
      selectedStatuses: selectedStatuses,
      dateRange: [startDate, endDate],
      selectedOrganization: selectedOrg,
      selectedStaff: selectedStaff,
    };
    console.log('Modal: Aplicando filtros:', filtersToApply);
    onApplyFilters(filtersToApply);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-[#1a1f29] rounded-xl shadow-2xl border border-[#2d3441] p-6 w-full max-w-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="flex items-center justify-between mb-6 border-b border-[#2d3441] pb-4">
          <h2 className="text-xl font-bold text-[#ffffff]">Filtros avanzados</h2>
          <button 
            onClick={onClose}
            className="text-[#7a8394] hover:text-[#ffffff] transition-colors duration-200 rounded-full h-8 w-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:ring-opacity-50"
            aria-label="Cerrar modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Estados */}
          <div>
            <label className="block text-sm font-medium text-[#b8c5d6] mb-3">Estado del Ticket</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => handleStatusChange(status.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedStatuses.includes(status.id)
                      ? 'bg-[#00d9ff] text-[#0a0e14] shadow-lg shadow-[#00d9ff]/20'
                      : 'bg-[#252a35] hover:bg-[#2d3441] text-[#b8c5d6] hover:text-[#ffffff] ring-1 ring-[#2d3441]'
                  }`}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="block text-sm font-medium text-[#b8c5d6] mb-3">Rango de Fechas</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date || undefined)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Fecha inicial"
                  className="w-full bg-[#252a35] border border-[#2d3441] rounded-lg p-2.5 text-[#b8c5d6] shadow-inner focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent focus:outline-none transition-all duration-200"
                  calendarClassName="bg-[#1a1f29] border-[#2d3441] shadow-xl"
                />
              </div>
              <span className="text-[#7a8394] font-medium">a</span>
              <div className="relative flex-1">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date || undefined)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Fecha final"
                  className="w-full bg-[#252a35] border border-[#2d3441] rounded-lg p-2.5 text-[#b8c5d6] shadow-inner focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Sector y Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sector (Organization) */}
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-[#b8c5d6] mb-2">Sector</label>
              <div className="relative">
                <select
                  id="sector"
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-full appearance-none bg-[#252a35] border border-[#2d3441] rounded-lg p-2.5 pr-10 text-[#b8c5d6] shadow-inner focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent focus:outline-none transition-all duration-200"
                >
                  <option value="">Todos los sectores</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7a8394]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Agente (Staff) */}
            <div>
              <label htmlFor="agent" className="block text-sm font-medium text-[#b8c5d6] mb-2">Agente</label>
              <div className="relative">
                <select
                  id="agent"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full appearance-none bg-[#252a35] border border-[#2d3441] rounded-lg p-2.5 pr-10 text-[#b8c5d6] shadow-inner focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent focus:outline-none transition-all duration-200"
                >
                  <option value="">Todos los agentes</option>
                  {staff.map(s => (
                    <option key={s.staff_id} value={s.staff_id}>{s.fullname}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7a8394]">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </form>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[#2d3441]">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg bg-[#252a35] text-[#b8c5d6] hover:bg-[#2d3441] hover:text-[#ffffff] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2d3441] focus:ring-opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleApply} 
            className="px-4 py-2 rounded-lg bg-[#00d9ff] text-[#0a0e14] hover:bg-[#33e1ff] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:ring-opacity-50 font-medium shadow-lg shadow-[#00d9ff]/20"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
