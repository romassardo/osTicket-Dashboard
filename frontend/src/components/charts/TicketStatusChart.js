import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
// Colores según DESIGN_GUIDE.md - Sistema de estados
const COLORS = {
    'Abiertos': '#06b6d4', // info - Tickets en estado inicial
    'Abierto': '#06b6d4', // Alias para compatibilidad
    'En Progreso': '#f59e0b', // warning - Tickets siendo trabajados
    'Resueltos': '#10b981', // success - Tickets completados
    'Resuelto': '#10b981', // Alias para compatibilidad
    'Cerrados': '#6b7280', // muted - Tickets finalizados
    'Cerrado': '#6b7280', // Alias para compatibilidad
    'Vencidos': '#ef4444', // error - Tickets críticos
    'Vencido': '#ef4444', // Alias para compatibilidad
    'Pendientes': '#f59e0b', // warning - Tickets esperando acción
    'Pendiente': '#f59e0b' // Alias para compatibilidad
};
// Función para obtener color por nombre (robusta y flexible)
const getColorByName = (name) => {
    // DEBUG: Mostrar en consola qué nombres llegan
    console.log('🔍 DEBUG - Nombre recibido:', name);
    // Primero intentar coincidencia exacta
    if (COLORS[name]) {
        console.log('✅ Color encontrado (exacto):', COLORS[name]);
        return COLORS[name];
    }
    // Normalizar el nombre (minúsculas, sin espacios extra)
    const normalizedName = name.toLowerCase().trim();
    // Mapeo flexible de nombres comunes
    const nameMapping = {
        'abierto': '#06b6d4', // info - azul
        'abiertos': '#06b6d4',
        'open': '#06b6d4',
        'nuevo': '#06b6d4',
        'nuevos': '#06b6d4',
        'cerrado': '#6b7280', // muted - gris
        'cerrados': '#6b7280',
        'closed': '#6b7280',
        'resuelto': '#10b981', // success - verde
        'resueltos': '#10b981',
        'resolved': '#10b981',
        'solucionado': '#10b981',
        'en proceso': '#f59e0b', // warning - naranja
        'enproceso': '#f59e0b',
        'en_proceso': '#f59e0b',
        'progreso': '#f59e0b',
        'in progress': '#f59e0b',
        'vencido': '#ef4444', // error - rojo
        'vencidos': '#ef4444',
        'overdue': '#ef4444',
        'atrasado': '#ef4444',
        'pendiente': '#f59e0b', // warning - naranja
        'pendientes': '#f59e0b',
        'pending': '#f59e0b'
    };
    const color = nameMapping[normalizedName];
    if (color) {
        return color;
    }
    // Si no se encuentra, usar color por defecto
    return '#95A5A6'; // Gris por defecto
};
const TicketStatusChart = ({ data }) => {
    if (!data || data.length === 0 || data.every(item => item.value === 0)) {
        return (_jsx("div", { className: "h-full flex items-center justify-center min-h-[350px] bg-[#1a1f29] rounded-xl border border-[#2d3441]", children: _jsx("p", { className: "text-[#7a8394] font-inter text-sm", children: "No hay datos de estado para mostrar." }) }));
    }
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (_jsxs("div", { className: "w-full h-[350px] bg-[#1a1f29] rounded-xl border border-[#2d3441] p-6", children: [_jsxs("div", { className: "absolute top-2 left-2 text-red-500 text-xs font-bold bg-yellow-300 px-2 py-1 rounded z-50", children: ["Datos: ", data.map(d => d.name).join(', ')] }), _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", labelLine: false, outerRadius: 120, innerRadius: 80, dataKey: "value", stroke: "#ffffff", strokeWidth: 2, paddingAngle: 2, children: data.map((entry, index) => {
                                const color = getColorByName(entry.name);
                                console.log(`🎨 Aplicando color ${color} a segmento ${entry.name}`);
                                return (_jsx(Cell, { fill: color, stroke: "none", style: { fill: color } }, `cell-${index}`));
                            }) }), _jsx(Tooltip, { formatter: (value, name) => [
                                `${value.toLocaleString()} tickets (${((value / total) * 100).toFixed(1)}%)`,
                                name
                            ], contentStyle: {
                                backgroundColor: '#252a35',
                                border: '1px solid #2d3441',
                                borderRadius: '8px',
                                color: '#ffffff',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.875rem',
                                padding: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                            }, labelStyle: { color: '#b8c5d6', marginBottom: '4px' } }), _jsx(Legend, { iconType: "circle", layout: "vertical", verticalAlign: "middle", align: "right", iconSize: 12, wrapperStyle: {
                                right: -10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontFamily: 'Inter, sans-serif'
                            }, formatter: (value) => {
                                const item = data.find(d => d.name === value);
                                const percentage = total > 0 ? ((item?.value ?? 0) / total) * 100 : 0;
                                return (_jsxs("span", { className: "text-sm font-medium ml-3", style: {
                                        color: '#b8c5d6',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '0.875rem'
                                    }, children: [value, " (", percentage.toFixed(0), "%)"] }));
                            } }), _jsx("text", { x: "50%", y: "45%", textAnchor: "middle", dominantBaseline: "central", style: {
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                fill: '#7a8394'
                            }, children: "Total" }), _jsx("text", { x: "50%", y: "50%", textAnchor: "middle", dominantBaseline: "central", style: {
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '2rem',
                                fontWeight: '700',
                                fill: '#ffffff'
                            }, children: total.toLocaleString() }), _jsx("text", { x: "50%", y: "55%", textAnchor: "middle", dominantBaseline: "central", style: {
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.75rem',
                                fontWeight: '400',
                                fill: '#7a8394'
                            }, children: "tickets" })] }) })] }));
};
export default TicketStatusChart;
