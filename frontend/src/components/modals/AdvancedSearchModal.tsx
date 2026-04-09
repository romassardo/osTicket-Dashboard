import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './datepicker-custom.css'; // Importar estilos personalizados
import logger from '../../utils/logger';

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

interface SLAOption {
  id: number;
  name: string;
}

interface RequestTypeOption {
  id: string;
  name: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  showSlaStatus?: boolean;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onApplyFilters, showSlaStatus = false }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slaOptions, setSlaOptions] = useState<SLAOption[]>([]);
  const [requestTypeOptions, setRequestTypeOptions] = useState<RequestTypeOption[]>([]);

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedSla, setSelectedSla] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>('');


  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
          logger.error('Error fetching data:', error);
        }
      };

      fetchData('/api/statuses/simple', setStatuses);
      fetchData('/api/tickets/options/sector', setOrganizations);
      fetchData('/api/staff/simple', setStaff);
      fetchData('/api/tickets/options/sla', setSlaOptions);
      fetchData('/api/tickets/options/requestType', setRequestTypeOptions);
    }
  }, [isOpen]);

  const handleStatusChange = (statusId: number) => {
    setSelectedStatuses(prev => {
      const newStatuses = prev.includes(statusId)
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId];
      return newStatuses;
    });
  };

  const handleApply = () => {
    const filtersToApply: any = {
      selectedStatuses: selectedStatuses,
      dateRange: [startDate, endDate],
      selectedSector: selectedOrg,
      selectedStaff: selectedStaff,
      selectedSla: selectedSla,
      selectedRequestType: selectedRequestType,
    };
    if (selectedSlaStatus) filtersToApply.slaStatus = selectedSlaStatus;
    onApplyFilters(filtersToApply);
    onClose();
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedOrg('');
    setSelectedStaff('');
    setSelectedSla('');
    setSelectedRequestType('');
    setSelectedSlaStatus('');
  };

  const chipBase: React.CSSProperties = {
    padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem',
    fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border-default)',
    background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', transition: 'all 150ms ease',
    fontFamily: 'var(--font-body)',
  };
  const chipActive: React.CSSProperties = {
    ...chipBase, background: 'var(--accent-primary)', color: 'var(--bg-primary)',
    borderColor: 'var(--accent-primary)', boxShadow: '0 2px 8px rgba(212,149,44,0.25)',
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', appearance: 'none' as const, background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
    padding: '0.625rem 2.5rem 0.625rem 0.75rem', color: 'var(--text-secondary)',
    fontSize: '0.8125rem', fontFamily: 'var(--font-body)', outline: 'none', transition: 'all 150ms ease',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem',
  };
  const chevronStyle: React.CSSProperties = {
    position: 'absolute' as const, inset: '0 0 0 auto', display: 'flex', alignItems: 'center',
    paddingRight: '0.75rem', color: 'var(--text-muted)', pointerEvents: 'none' as const,
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full max-w-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-search-modal-title"
        style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-subtle)', padding: '1.5rem' }}>
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 id="advanced-search-modal-title" className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Filtros avanzados</h2>
          <button 
            onClick={onClose}
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
            <label style={{ ...labelStyle, color: 'var(--text-primary)' }}>Estado del Ticket</label>
            <div className="flex flex-wrap gap-2">
              {statuses
                .filter(status => ['Abierto', 'Cerrado', 'Resuelto'].includes(status.name))
                .map(status => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => handleStatusChange(status.id)}
                  style={selectedStatuses.includes(status.id) ? chipActive : chipBase}
                >
                  {status.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label style={{ ...labelStyle, color: 'var(--text-primary)' }}>Rango de Fechas</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date || undefined)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Fecha inicial"
                  dateFormat="dd/MM/yyyy"
                  className="modal-datepicker-input"
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>a</span>
              <div className="relative flex-1">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date || undefined)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Fecha final"
                  dateFormat="dd/MM/yyyy"
                  className="modal-datepicker-input"
                />
              </div>
            </div>
          </div>

          {/* Estado SLA (solo para Analytics) */}
          {showSlaStatus && (
            <div>
              <label style={{ ...labelStyle, color: 'var(--text-primary)' }}>Estado SLA</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'cumplido', label: 'Cumplido' },
                  { value: 'no_cumplido', label: 'No cumplido' },
                  { value: 'en_curso', label: 'En curso' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedSlaStatus(prev => prev === opt.value ? '' : opt.value)}
                    style={selectedSlaStatus === opt.value ? chipActive : chipBase}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sector, Agente, SLA y Tipo de Solicitud */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sector" style={labelStyle}>Sector</label>
              <div className="relative">
                <select id="sector" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} style={selectStyle}>
                  <option value="">Todos los sectores</option>
                  {organizations.map(org => (<option key={org.id} value={org.id}>{org.name}</option>))}
                </select>
                <div style={chevronStyle}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="agent" style={labelStyle}>Agente</label>
              <div className="relative">
                <select id="agent" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} style={selectStyle}>
                  <option value="">Todos los agentes</option>
                  {staff.map(s => (<option key={s.staff_id} value={s.staff_id}>{s.fullname}</option>))}
                </select>
                <div style={chevronStyle}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="sla" style={labelStyle}>SLA</label>
              <div className="relative">
                <select id="sla" value={selectedSla} onChange={(e) => setSelectedSla(e.target.value)} style={selectStyle}>
                  <option value="">Todos los SLA</option>
                  {slaOptions.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                <div style={chevronStyle}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="requestType" style={labelStyle}>Tipo de Solicitud</label>
              <div className="relative">
                <select id="requestType" value={selectedRequestType} onChange={(e) => setSelectedRequestType(e.target.value)} style={selectStyle}>
                  <option value="">Todos los tipos</option>
                  {requestTypeOptions.map(rt => (<option key={rt.id} value={rt.id}>{rt.name}</option>))}
                </select>
                <div style={chevronStyle}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={handleClear}
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem', fontFamily: 'var(--font-body)', transition: 'all 150ms ease' }}>
            Limpiar Filtros
          </button>
          <div className="flex gap-3">
            <button onClick={onClose}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem', fontFamily: 'var(--font-body)', transition: 'all 150ms ease' }}>
              Cancelar
            </button>
            <button onClick={handleApply}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(212,149,44,0.3)', transition: 'all 150ms ease' }}>
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
