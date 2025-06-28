import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getTicketTrends } from '../../services/api';
const TicketTrendsChart = ({ year, month, className = '' }) => {
    const { data: trendsData, isLoading, isError, error } = useQuery({
        queryKey: ['ticketTrends', year, month],
        queryFn: () => getTicketTrends(year, month),
        enabled: !!year && month !== undefined && month !== null,
    });
    const transformData = (apiData) => {
        if (!apiData || apiData.length === 0)
            return [];
        return apiData.map(item => ({
            day: item.date.split('-')[2],
            fullDate: item.date,
            created: item.ticket_count,
            closed: 0,
        }));
    };
    const chartData = trendsData && trendsData.length > 0 ? transformData(trendsData) : [];
    const averageTickets = (data) => {
        if (!data || data.length === 0)
            return 0;
        const sum = data.reduce((acc, item) => acc + item.created, 0);
        return Math.round((sum / data.length) * 10) / 10;
    };
    const avg = averageTickets(chartData);
    const peakDay = (data) => {
        if (!data || data.length === 0)
            return 0;
        return data.reduce((peak, item) => item.created > peak.created ? item : peak, data[0]).created;
    };
    const peak = peakDay(chartData);
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (_jsxs("div", { className: "bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg shadow-lg p-3 text-sm", children: [_jsx("p", { className: "text-[var(--accent-primary)] font-medium mb-1", children: data.fullDate }), _jsxs("div", { className: "flex items-center space-x-2 text-[var(--text-primary)]", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-[var(--accent-primary)]" }), _jsxs("p", { className: "font-medium", children: [payload[0].value, " tickets creados"] })] }), avg > 0 && (_jsx("p", { className: "text-[var(--text-muted)] text-xs mt-1", children: payload[0].value > avg ? `+${Math.round((payload[0].value - avg) * 10) / 10} sobre el promedio`
                            : payload[0].value < avg ? `-${Math.round((avg - payload[0].value) * 10) / 10} bajo el promedio`
                                : 'Igual al promedio' }))] }));
        }
        return null;
    };
    const CustomLegend = () => (_jsxs("div", { className: "flex justify-center items-center gap-6 mt-2 text-sm", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-3 h-3 rounded-full bg-[var(--accent-primary)] mr-2" }), _jsx("span", { className: "text-[var(--text-secondary)]", children: "Tickets Creados" })] }), avg > 0 && (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-6 h-[2px] bg-[var(--info)] mr-2 opacity-70" }), _jsxs("span", { className: "text-[var(--text-muted)]", children: ["Promedio: ", avg] })] }))] }));
    if (isLoading) {
        return (_jsx("div", { className: `h-full flex items-center justify-center ${className}`, children: _jsx("p", { className: "text-[var(--text-muted)]", children: "Cargando datos de tendencias..." }) }));
    }
    if (isError) {
        return (_jsx("div", { className: `h-full flex items-center justify-center ${className}`, children: _jsxs("p", { className: "text-[var(--error)]", children: ["Error al cargar: ", error?.message] }) }));
    }
    if (chartData.length === 0) {
        return (_jsx("div", { className: `h-full flex items-center justify-center ${className}`, children: _jsx("p", { className: "text-[var(--text-muted)]", children: "No hay datos para este per\u00EDodo." }) }));
    }
    return (_jsxs("div", { className: `relative w-full h-[350px] ${className}`, children: [peak > 0 && (_jsxs("div", { className: "absolute top-0 right-0 bg-[var(--accent-secondary)]/20 px-3 py-1 rounded-md text-xs text-[var(--text-secondary)] z-10", children: ["Pico: D\u00EDa ", chartData.find(d => d.created === peak)?.day] })), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: chartData, margin: { top: 20, right: 20, left: 10, bottom: 20 }, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorCreated", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "var(--accent-primary)", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "var(--accent-primary)", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255, 255, 255, 0.05)", vertical: false }), _jsx(XAxis, { dataKey: "day", tickLine: false, axisLine: { stroke: 'rgba(255, 255, 255, 0.1)' }, tick: { fill: 'var(--text-muted)', fontSize: 12 }, padding: { left: 20, right: 20 } }), _jsx(YAxis, { tickLine: false, axisLine: false, tick: { fill: 'var(--text-muted)', fontSize: 12 }, width: 30 }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: { stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '3 3' } }), _jsx(Legend, { content: _jsx(CustomLegend, {}), verticalAlign: "top" }), avg > 0 && (_jsx(ReferenceLine, { y: avg, stroke: "var(--info)", strokeDasharray: "3 3", strokeWidth: 1.5, opacity: 0.7 })), _jsx(Line, { type: "monotone", dataKey: "created", stroke: "var(--accent-primary)", strokeWidth: 3, dot: false, activeDot: { r: 6, fill: 'var(--accent-primary)', stroke: 'var(--bg-secondary)', strokeWidth: 2 } })] }) })] }));
};
export default TicketTrendsChart;
