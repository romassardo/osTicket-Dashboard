import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketCounts } from '../services/api';
import { useFilter } from '../context/FilterContext';

// Importamos los componentes que hemos creado
import StatCard from '../components/metrics/StatCard';
import TicketStatusChart from '../components/charts/TicketStatusChart';
import TicketTrendsChart from '../components/charts/TicketTrendsChart';
import TicketsBySectorChart from '../components/charts/TicketsBySectorChart';
import TicketsByAgentChart from '../components/charts/TicketsByAgentChart';
import { TicketsByTransportChart } from '../components/charts/TicketsByTransportChart';
import { TicketsByRequestTypeChart } from '../components/charts/TicketsByRequestTypeChart';
import MonthlyComparisonChart from '../components/charts/MonthlyComparisonChart';
import { SkeletonDashboard } from '../components/ui/Loading';
import { Tooltip } from '../components/ui/Tooltip';

/**
 * Vista principal del Dashboard OsTicket
 * Implementa la guía de diseño UX/UI y muestra
 * métricas relevantes para el departamento de Soporte IT
 */
const DashboardView: React.FC = () => {
  const { selectedYear, selectedMonth: contextMonth, setSelectedYear, setSelectedMonth: setContextMonth } = useFilter();
  // Dashboard always needs a specific month (0-indexed). Default to current month if context has null.
  const selectedMonth = contextMonth ?? new Date().getMonth();
  const selectedDate = new Date(selectedYear, selectedMonth, 1);

  const handleMonthChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setContextMonth(parseInt(event.target.value, 10));
  }, [setContextMonth]);

  const handleYearChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value, 10));
  }, [setSelectedYear]);

  // Consulta unificada para obtener todas las métricas del mes seleccionado
  const { data: ticketCounts, isLoading: isLoadingCounts, isError: isErrorCounts } = useQuery({
    queryKey: ['ticketCounts', selectedYear, selectedMonth],
    queryFn: () => {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
      return getTicketCounts(startDate, endDate);
    },
  });

  // Preparar datos para el gráfico de estado usando React.useMemo para optimización
  const statusChartData = React.useMemo(() => {
    if (!ticketCounts?.byStatus) return [{ name: 'Sin datos', value: 1, color: '#94a3b8' }];

    const data = Object.entries(ticketCounts.byStatus).map(([status, value]) => {
      let displayName = status;
      let color = 'var(--text-muted)'; // color por defecto

      switch (status.toLowerCase()) {
        case 'open': color = 'var(--status-open)'; displayName = 'Abierto'; break;
        case 'closed': color = 'var(--status-closed)'; displayName = 'Cerrado'; break;
        case 'resolved': color = 'var(--status-resolved)'; displayName = 'Resuelto'; break;
        case 'pending': color = 'var(--status-pending)'; displayName = 'Pendiente'; break;
        default: displayName = status;
      }
      return { name: displayName, value, color };
    });

    return data.length > 0 ? data : [{ name: 'Sin datos', value: 1, color: '#94a3b8' }];
  }, [ticketCounts]);



  // Estado de carga
  if (isLoadingCounts) {
    return <SkeletonDashboard />;
  }

  // Estado de error
  if (isErrorCounts) {
    return (
      <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--error)', background: 'var(--bg-secondary)', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 500, color: 'var(--error)' }}>Error al cargar los datos del dashboard.</p>
        <button style={{ marginTop: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const monthTitle = selectedDate.toLocaleString('es-ES', { month: 'long' });
  const yearTitle = selectedDate.getFullYear();
  const fullMonthTitle = `${monthTitle} ${yearTitle}`;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    name: new Date(2000, i).toLocaleString('es-ES', { month: 'long' })
  }));

  return (
    <div className="dashboard-container">
      {/* Dashboard Grid Principal - 12 columnas según DESIGN_GUIDE.md */}
      <div className="dashboard-grid">
        
        {/* Header Dashboard */}
        <div className="col-span-12 rounded-xl mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', padding: '1.25rem 1.75rem' }}>
          <div className="flex items-center w-full">
            <div className="flex-1">
              <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Dashboard Soporte IT</h1>
              <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>Vista general de tickets — <span style={{ color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>{fullMonthTitle}</span></p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.25rem', border: '1px solid var(--border-subtle)' }}>
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="capitalize"
                  style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.4rem 0.65rem', border: 'none', fontSize: '0.8125rem', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value} style={{ background: 'var(--bg-tertiary)' }} className="capitalize">{month.name}</option>
                  ))}
                </select>
                <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }}></div>
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '0.4rem 0.65rem', border: 'none', fontSize: '0.8125rem', fontFamily: 'var(--font-body)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', outline: 'none' }}
                >
                  {years.map(year => (
                    <option key={year} value={year} style={{ background: 'var(--bg-tertiary)' }}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.75rem', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                <span style={{ display: 'inline-block', height: 6, width: 6, borderRadius: '50%', background: 'var(--success)' }} className="animate-pulse"></span>
                <span style={{ color: 'var(--text-muted)' }}>Actualizado: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Metrics - KPIs principales usando grid profesional */}
        <div className="kpi-grid">
          <StatCard 
            title="Total Tickets" 
            value={ticketCounts?.total ?? 0} 
            subtitle={fullMonthTitle}
            icon="total"
            trend="+5%"
            tooltip="Todos los tickets creados durante este mes, sin importar su estado actual."
          />
          <StatCard 
            title="Tickets Abiertos" 
            value={ticketCounts?.open ?? 0} 
            subtitle={fullMonthTitle}
            icon="open"
            trend="-2%"
            tooltip="Tickets creados este mes que aún no han sido resueltos ni cerrados."
          />
          <StatCard 
            title="Total Pendientes" 
            value={ticketCounts?.totalPendingAccumulated ?? 0}
            subtitle="Acumulado"
            icon="pending"
            trend="+8%"
            tooltip="La suma histórica de todos los tickets abiertos y no resueltos, incluyendo meses anteriores."
          />
          <StatCard 
            title="Tickets Cerrados" 
            value={ticketCounts?.closed ?? 0} 
            subtitle={fullMonthTitle}
            icon="closed"
            trend="+12%"
            tooltip="Tickets creados en este mes que actualmente tienen estado 'Resuelto' o 'Cerrado'."
          />
        </div>

        {/* Analytics Grid - Primera fila */}
        <div className="analytics-grid-row-1">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--info)]"></span>
              <Tooltip text="Muestra la cantidad de tickets según su estado actual (abiertos, cerrados, resueltos) dentro del mes seleccionado." position="below">
                <h2 className="chart-title inline-flex items-center">Distribución por Estado</h2>
              </Tooltip>
            </div>
            <TicketStatusChart data={statusChartData} />
          </div>
          
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--accent-primary)]"></span>
              <Tooltip text="Muestra la evolución diaria de tickets creados vs cerrados a lo largo del mes seleccionado." position="below">
                <h2 className="chart-title inline-flex items-center">Tendencia de Tickets</h2>
              </Tooltip>
            </div>
            <TicketTrendsChart year={selectedYear} month={selectedMonth + 1} />
          </div>
        </div>

        {/* Analytics Grid - Segunda fila con proporción 5:7 */}
        <div className="analytics-grid-row-2">
          {/* Columna izquierda - Gráficos apilados */}
          <div className="analytics-left-column">
            {/* Uso de Transporte */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-indicator bg-[var(--accent-secondary)]"></span>
                <Tooltip text="Cantidad de tickets categorizados por el medio de transporte asociado al problema reportado." position="below">
                  <h2 className="chart-title inline-flex items-center">Uso de Transporte</h2>
                </Tooltip>
              </div>
              <div className="h-[300px]">
                <TicketsByTransportChart year={selectedYear} month={selectedMonth + 1} />
              </div>
            </div>
            
            {/* Tickets por Agente */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-indicator bg-[var(--warning)]"></span>
                <Tooltip text="Rendimiento individual: cantidad de tickets asignados o resueltos por cada agente de Soporte IT en el mes." position="below">
                  <h2 className="chart-title inline-flex items-center">Tickets por Agente</h2>
                </Tooltip>
              </div>
              <TicketsByAgentChart year={selectedYear} month={selectedMonth + 1} />
            </div>
          </div>
          
          {/* Columna derecha - Tickets por Sector extendido */}
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--warning)]"></span>
              <Tooltip text="Distribución de la demanda de soporte según el sector o área de la empresa que origina la solicitud." position="below">
                <h2 className="chart-title inline-flex items-center">Tickets por Sector</h2>
              </Tooltip>
            </div>
            <TicketsBySectorChart year={selectedYear} month={selectedMonth + 1} />
          </div>
        </div>

        {/* Fila: Tipo de Solicitud (TPSolicitud) - Fallas más comunes */}
        <div className="col-span-12">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--warning)]"></span>
              <Tooltip text="Clasificación detallada de los problemas reportados, permitiendo identificar las fallas técnicas más frecuentes en la operación." position="below">
                <h2 className="chart-title inline-flex items-center">Tipo de Solicitud - Fallas más Comunes</h2>
              </Tooltip>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Categorización de problemas asignada por el agente (disponible desde marzo 2026)
              </p>
            </div>
            <div className="py-4">
              <TicketsByRequestTypeChart year={selectedYear} month={selectedMonth + 1} />
            </div>
          </div>
        </div>

        {/* Analytics Grid - Tercera fila: Comparación Mensual */}
        <div className="col-span-12">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--success)]"></span>
              <Tooltip text="Análisis comparativo de la demanda actual versus el mes anterior, mostrando si el equipo está absorbiendo o acumulando trabajo." position="below">
                <h2 className="chart-title inline-flex items-center">Análisis de Flujo Mensual</h2>
              </Tooltip>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Analiza creados, cerrados y pendientes entre meses, incluye flujo de tickets
              </p>
            </div>
            <MonthlyComparisonChart 
              currentYear={selectedYear} 
              currentMonth={selectedMonth + 1} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
