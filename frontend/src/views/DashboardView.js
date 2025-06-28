import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketCounts } from '../services/api';
// Importamos los componentes que hemos creado
import StatCard from '../components/metrics/StatCard';
import TicketStatusChart from '../components/charts/TicketStatusChart';
import TicketTrendsChart from '../components/charts/TicketTrendsChart';
import TicketsByOrganizationChart from '../components/charts/TicketsByOrganizationChart';
import TicketsByAgentChart from '../components/charts/TicketsByAgentChart';
/**
 * Vista principal del Dashboard OsTicket
 * Implementa la guía de diseño UX/UI y muestra
 * métricas relevantes para el departamento de Soporte IT
 */
const DashboardView = () => {
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const handleMonthChange = (event) => {
        const newMonth = parseInt(event.target.value, 10);
        setSelectedDate(new Date(selectedDate.getFullYear(), newMonth, 1));
    };
    const handleYearChange = (event) => {
        const newYear = parseInt(event.target.value, 10);
        setSelectedDate(new Date(newYear, selectedDate.getMonth(), 1));
    };
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
        if (!ticketCounts?.byStatus)
            return [{ name: 'Sin datos', value: 1, color: '#94a3b8' }];
        const data = Object.entries(ticketCounts.byStatus).map(([status, value]) => {
            let displayName = status;
            let color = 'var(--text-muted)'; // color por defecto
            switch (status.toLowerCase()) {
                case 'open':
                    color = 'var(--status-open)';
                    displayName = 'Abierto';
                    break;
                case 'closed':
                    color = 'var(--status-closed)';
                    displayName = 'Cerrado';
                    break;
                case 'resolved':
                    color = 'var(--status-resolved)';
                    displayName = 'Resuelto';
                    break;
                case 'pending':
                    color = 'var(--status-pending)';
                    displayName = 'Pendiente';
                    break;
                default: displayName = status;
            }
            return { name: displayName, value, color };
        });
        return data.length > 0 ? data : [{ name: 'Sin datos', value: 1, color: '#94a3b8' }];
    }, [ticketCounts]);
    // Estado de carga
    if (isLoadingCounts) {
        return (_jsx("div", { className: "flex h-64 items-center justify-center", children: _jsxs("div", { className: "flex animate-pulse flex-col items-center", children: [_jsx("div", { className: "h-10 w-10 rounded-full bg-[#2d3441]" }), _jsx("div", { className: "mt-4 text-[#b8c5d6]", children: "Cargando datos..." })] }) }));
    }
    // Estado de error
    if (isErrorCounts) {
        return (_jsxs("div", { className: "rounded-lg border border-[#ef4444] bg-[#1a1f29] p-6 text-center", children: [_jsx("p", { className: "font-medium text-[#ef4444]", children: "Error al cargar los datos del dashboard." }), _jsx("button", { className: "mt-4 rounded-md bg-[#252a35] px-4 py-2 text-[#b8c5d6] hover:bg-[#2d3441]", children: "Reintentar" })] }));
    }
    const monthTitle = selectedDate.toLocaleString('es-ES', { month: 'long' });
    const yearTitle = selectedDate.getFullYear();
    const fullMonthTitle = `${monthTitle} ${yearTitle}`;
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        name: new Date(2000, i).toLocaleString('es-ES', { month: 'long' })
    }));
    return (_jsxs("div", { className: "dashboard-container bg-[var(--bg-primary)] min-h-screen p-6 text-[var(--text-primary)]", children: [_jsx("div", { className: "dashboard-header backdrop-blur-md bg-[var(--bg-secondary)]/80 rounded-xl p-6 mb-8 shadow-lg border border-[var(--bg-accent)]/20", children: _jsxs("div", { className: "flex flex-wrap justify-between items-center gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent", children: "Dashboard Soporte IT" }), _jsxs("p", { className: "text-[var(--text-secondary)] mt-1", children: ["Vista general de tickets - ", fullMonthTitle] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--bg-accent)]/30", children: [_jsx("select", { value: selectedMonth, onChange: handleMonthChange, className: "bg-transparent text-[var(--text-secondary)] px-3 py-2 border-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded-md capitalize", children: months.map(month => (_jsx("option", { value: month.value, className: "bg-[var(--bg-tertiary)] capitalize", children: month.name }, month.value))) }), _jsx("select", { value: selectedYear, onChange: handleYearChange, className: "bg-transparent text-[var(--text-secondary)] px-3 py-2 border-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded-md", children: years.map(year => (_jsx("option", { value: year, className: "bg-[var(--bg-tertiary)]", children: year }, year))) })] }), _jsxs("div", { className: "flex items-center gap-2 bg-[var(--bg-tertiary)]/40 rounded-full px-3 py-1 text-xs", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" }), _jsxs("span", { className: "text-[var(--text-muted)]", children: ["Actualizado: ", new Date().toLocaleTimeString()] })] })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsx(StatCard, { title: "Total Tickets", value: ticketCounts?.totalInDateRange ?? 0, subtitle: fullMonthTitle, icon: "total", trend: "+5%" }), _jsx(StatCard, { title: "Tickets Abiertos", value: ticketCounts?.openInDateRange ?? 0, subtitle: fullMonthTitle, icon: "open", trend: "-2%" }), _jsx(StatCard, { title: "Total Pendientes", value: ticketCounts?.totalOpen ?? 0, subtitle: "Acumulado", icon: "pending", trend: "+8%" }), _jsx(StatCard, { title: "Tickets Cerrados", value: ticketCounts?.closedInDateRange ?? 0, subtitle: fullMonthTitle, icon: "closed", trend: "+12%" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs("div", { className: "bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300", children: [_jsxs("h2", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx("span", { className: "inline-block w-2 h-6 bg-[var(--info)] rounded-sm mr-3" }), "Distribuci\u00F3n por Estado"] }), _jsx(TicketStatusChart, { data: statusChartData })] }), _jsxs("div", { className: "bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300", children: [_jsxs("h2", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx("span", { className: "inline-block w-2 h-6 bg-[var(--accent-primary)] rounded-sm mr-3" }), "Tendencia de Tickets"] }), _jsx(TicketTrendsChart, { year: selectedYear, month: selectedMonth + 1 })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300", children: [_jsxs("h2", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx("span", { className: "inline-block w-2 h-6 bg-[var(--warning)] rounded-sm mr-3" }), "Tickets por Agente"] }), _jsx(TicketsByAgentChart, { year: selectedYear, month: selectedMonth + 1 })] }), _jsxs("div", { className: "bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300", children: [_jsxs("h2", { className: "text-lg font-medium mb-4 flex items-center", children: [_jsx("span", { className: "inline-block w-2 h-6 bg-[var(--success)] rounded-sm mr-3" }), "Tickets por Empresa"] }), _jsx(TicketsByOrganizationChart, { year: selectedYear, month: selectedMonth + 1 })] })] })] }));
};
export default DashboardView;
