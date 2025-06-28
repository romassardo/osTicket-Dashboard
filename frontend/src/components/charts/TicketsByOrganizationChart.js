import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByOrganizationStats } from '../../services/api';
import HorizontalBarChart from './HorizontalBarChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import Button from '../ui/Button';
import { InfoCircle, AlertTriangle, Buildings } from '../ui/Icons';
// Paleta de colores para organizaciones (compatible con dark mode)
const ORG_COLORS = [
    'var(--accent-primary)', // Principal
    'var(--accent-secondary)', // Secundario
    '#3b82f6', // Azul
    '#10b981', // Verde
    '#f97316', // Naranja
    '#8b5cf6', // Púrpura
    '#ec4899', // Rosa
    '#14b8a6', // Verde azulado
    '#f59e0b', // Ámbar
    '#6366f1', // Indigo
];
/**
 * Componente para visualizar la distribución de tickets por sector organizacional
 * Versión modernizada que incluye animaciones, interactividad y modo de visualización limitada
 */
const TicketsByOrganizationChart = ({ year, month, className = '' }) => {
    // Estado para controlar cuántos sectores mostrar
    const [showAllOrgs, setShowAllOrgs] = useState(false);
    const MAX_VISIBLE_ORGS = 7; // Máximo de organizaciones a mostrar por defecto
    // Consulta para obtener datos de tickets por organización
    const { data: orgStats, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['ticketsByOrganizationStats', year, month],
        queryFn: () => getTicketsByOrganizationStats(year, month),
        enabled: !!year && month !== undefined && month !== null, // Permitir month = 0 (enero)
        staleTime: 300000, // 5 minutos
    });
    // Procesamiento de datos para el gráfico
    const chartData = useMemo(() => {
        if (!orgStats || orgStats.length === 0)
            return [];
        return orgStats
            .map((org, index) => ({
            name: org.name.length > 22 ? org.name.substring(0, 22) + '...' : org.name,
            value: org.ticket_count,
            fullName: org.name,
            color: ORG_COLORS[index % ORG_COLORS.length], // Asignar color cíclicamente
        }))
            .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor
    }, [orgStats]);
    // Mensaje de estado y título dinámico
    const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
    const dynamicTitle = `Tickets por Empresa`;
    const dynamicDescription = `${monthName} ${year}${chartData.length ? ` · ${chartData.length} sectores` : ''}`;
    // Contenido condicional para estados de carga, error o sin datos
    const renderContent = () => {
        if (isLoading) {
            return (_jsxs("div", { className: "h-64 flex flex-col items-center justify-center space-y-4", children: [_jsx(Spinner, { size: "lg", className: "text-[var(--accent-primary)]" }), _jsx("p", { className: "text-[var(--text-secondary)] font-medium animate-pulse", children: "Cargando datos de sectores..." })] }));
        }
        if (isError) {
            return (_jsxs("div", { className: "h-64 flex flex-col items-center justify-center space-y-4", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-[var(--bg-danger)] flex items-center justify-center", children: _jsx(AlertTriangle, { className: "w-8 h-8 text-[var(--text-danger)]" }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[var(--text-danger)] font-medium mb-1", children: "Error al cargar los datos" }), _jsx("p", { className: "text-[var(--text-muted)] text-sm max-w-xs", children: error?.message || 'Verifica si el endpoint existe en el backend.' }), _jsx(Button, { variant: "ghost", className: "mt-3", size: "sm", onClick: () => refetch(), children: "Reintentar" })] })] }));
        }
        if (!chartData.length) {
            return (_jsxs("div", { className: "h-64 flex flex-col items-center justify-center space-y-4", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-[var(--bg-warning)]/20 flex items-center justify-center", children: _jsx(InfoCircle, { className: "w-8 h-8 text-[var(--text-warning)]" }) }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[var(--text-secondary)] font-medium mb-1", children: "No hay datos de tickets para este per\u00EDodo" }), _jsx("p", { className: "text-[var(--text-muted)] text-sm", children: "Prueba seleccionando otro mes o a\u00F1o" })] })] }));
        }
        // Si tenemos datos, mostrar el gráfico
        return (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -top-2 -right-2 w-24 h-24 opacity-5 pointer-events-none", children: _jsx(Buildings, { className: "w-full h-full text-[var(--text-primary)]" }) }), _jsx("div", { className: "overflow-hidden", children: _jsx("div", { className: "overflow-y-auto max-h-[400px] pr-2 pb-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-[var(--bg-accent)]", children: _jsx(HorizontalBarChart, { data: chartData, height: Math.max(42 * (showAllOrgs ? chartData.length : Math.min(chartData.length, MAX_VISIBLE_ORGS)), 300), showLabels: true, labelPosition: "inside", maxItemsToShow: showAllOrgs ? 0 : MAX_VISIBLE_ORGS }) }) }), chartData.length > MAX_VISIBLE_ORGS && (_jsx("div", { className: "mt-4 text-center", children: _jsx(Button, { variant: "ghost", size: "sm", className: "text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]", onClick: () => setShowAllOrgs(prev => !prev), children: showAllOrgs ? 'Mostrar principales' : `Ver todos los sectores (${chartData.length})` }) }))] }));
    };
    return (_jsxs(Card, { className: `${className} shadow-sm shadow-[var(--accent-primary)]/10`, children: [_jsx(CardHeader, { className: "pb-2", children: _jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center text-xl", children: [_jsx(Buildings, { className: "mr-2 h-5 w-5 text-[var(--accent-secondary)] inline" }), dynamicTitle] }), dynamicDescription && (_jsx(CardDescription, { className: "mt-1", children: dynamicDescription }))] }) }) }), _jsx(CardContent, { className: "pt-4", children: renderContent() })] }));
};
export default TicketsByOrganizationChart;
