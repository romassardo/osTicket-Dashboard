import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByAgentStats } from '../../services/api';
import BarChart from './BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
const TicketsByAgentChart = ({ year, month }) => {
    const { data: agentStats, isLoading, isError } = useQuery({
        queryKey: ['ticketsByAgentStats', year, month],
        queryFn: () => getTicketsByAgentStats(year, month),
        enabled: !!year && month !== undefined && month !== null,
    });
    if (isLoading) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Tickets por Agente" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-96 flex items-center justify-center", children: _jsx("p", { children: "Cargando datos..." }) }) })] }));
    }
    if (isError) {
        return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Tickets por Agente" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-96 flex items-center justify-center", children: _jsx("p", { className: "text-red-500", children: "Error al cargar los datos." }) }) })] }));
    }
    const chartData = (agentStats || [])
        .map((agent) => ({
        name: `${agent.firstname || ''} ${(agent.lastname || '').charAt(0) || ''}.`.trim(),
        value: agent.ticket_count,
        fullName: `${agent.firstname || ''} ${agent.lastname || ''}`.trim(),
    }))
        .sort((a, b) => b.value - a.value);
    const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
    const dynamicTitle = `Tickets por Agente (${monthName} ${year})`;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: dynamicTitle }) }), _jsx(CardContent, { children: chartData.length > 0 ? (_jsx(BarChart, { data: chartData, height: 400 })) : (_jsx("div", { className: "h-96 flex items-center justify-center", children: _jsx("p", { children: "No hay datos de tickets para este per\u00EDodo." }) })) })] }));
};
export default TicketsByAgentChart;
