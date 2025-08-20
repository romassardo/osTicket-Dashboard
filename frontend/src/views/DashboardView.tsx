import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketCounts } from '../services/api';

// Importamos los componentes que hemos creado
import StatCard from '../components/metrics/StatCard';
import TicketStatusChart from '../components/charts/TicketStatusChart';
import TicketTrendsChart from '../components/charts/TicketTrendsChart';
import TicketsBySectorChart from '../components/charts/TicketsBySectorChart';
import TicketsByAgentChart from '../components/charts/TicketsByAgentChart';
import { TicketsByTransportChart } from '../components/charts/TicketsByTransportChart'; // <-- IMPORTAR NUEVO GRÁFICO
import MonthlyComparisonChart from '../components/charts/MonthlyComparisonChart';
import { SkeletonDashboard } from '../components/ui/Loading';

/**
 * Vista principal del Dashboard OsTicket
 * Implementa la guía de diseño UX/UI y muestra
 * métricas relevantes para el departamento de Soporte IT
 */
const DashboardView: React.FC = () => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  const handleMonthChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(event.target.value, 10);
    setSelectedDate(new Date(selectedDate.getFullYear(), newMonth, 1));
  }, [selectedDate]);

  const handleYearChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(event.target.value, 10);
    setSelectedDate(new Date(newYear, selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

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
      <div className="rounded-lg border border-[#ef4444] bg-[#1a1f29] p-6 text-center">
        <p className="font-medium text-[#ef4444]">Error al cargar los datos del dashboard.</p>
        <button className="mt-4 rounded-md bg-[#252a35] px-4 py-2 text-[#b8c5d6] hover:bg-[#2d3441]">
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
        
        {/* Header Dashboard - Ocupa todo el ancho */}
        <div className="col-span-12 dashboard-header backdrop-blur-md bg-[var(--bg-secondary)]/80 rounded-xl p-6 mb-8 shadow-lg border border-[var(--bg-accent)]/20">
          <div className="flex items-center w-full">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">Dashboard Soporte IT</h1>
              <p className="text-[var(--text-secondary)] mt-1">Vista general de tickets - {fullMonthTitle}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Selector de fecha con estilo moderno */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--bg-accent)]/30">
                <select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="bg-transparent text-[var(--text-secondary)] px-3 py-2 border-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded-md capitalize"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value} className="bg-[var(--bg-tertiary)] capitalize">{month.name}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={handleYearChange}
                  className="bg-transparent text-[var(--text-secondary)] px-3 py-2 border-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded-md"
                >
                  {years.map(year => (
                    <option key={year} value={year} className="bg-[var(--bg-tertiary)]">{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Badge de última actualización con animación sutil */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)]/40 rounded-full px-3 py-1 text-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)] animate-pulse"></span>
                <span className="text-[var(--text-muted)]">Actualizado: {new Date().toLocaleTimeString()}</span>
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
          />
          <StatCard 
            title="Tickets Abiertos" 
            value={ticketCounts?.open ?? 0} 
            subtitle={fullMonthTitle}
            icon="open"
            trend="-2%"
          />
          <StatCard 
            title="Total Pendientes" 
            value={ticketCounts?.totalPendingAccumulated ?? 0}
            subtitle="Acumulado"
            icon="pending"
            trend="+8%"
          />
          <StatCard 
            title="Tickets Cerrados" 
            value={ticketCounts?.closed ?? 0} 
            subtitle={fullMonthTitle}
            icon="closed"
            trend="+12%"
          />
        </div>

        {/* Analytics Grid - Primera fila */}
        <div className="analytics-grid-row-1">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--info)]"></span>
              <h2 className="chart-title">Distribución por Estado</h2>
            </div>
            <TicketStatusChart data={statusChartData} />
          </div>
          
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--accent-primary)]"></span>
              <h2 className="chart-title">Tendencia de Tickets</h2>
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
                <h2 className="chart-title">Uso de Transporte</h2>
              </div>
              <div className="h-[300px]">
                <TicketsByTransportChart year={selectedYear} month={selectedMonth + 1} />
              </div>
            </div>
            
            {/* Tickets por Agente */}
            <div className="chart-card">
              <div className="chart-header">
                <span className="chart-indicator bg-[var(--warning)]"></span>
                <h2 className="chart-title">Tickets por Agente</h2>
              </div>
              <TicketsByAgentChart year={selectedYear} month={selectedMonth + 1} />
            </div>
          </div>
          
          {/* Columna derecha - Tickets por Sector extendido */}
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--warning)]"></span>
              <h2 className="chart-title">Tickets por Sector</h2>
            </div>
            <TicketsBySectorChart year={selectedYear} month={selectedMonth + 1} />
          </div>
        </div>

        {/* Analytics Grid - Tercera fila: Comparación Mensual */}
        <div className="col-span-12">
          <div className="chart-card">
            <div className="chart-header">
              <span className="chart-indicator bg-[var(--success)]"></span>
              <h2 className="chart-title">Análisis de Flujo Mensual</h2>
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
