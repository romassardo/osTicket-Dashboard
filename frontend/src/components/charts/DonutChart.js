import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
// Colores fijos para evitar problemas de caché o CSS
const COLORS = {
    'Abierto': '#FF6B6B', // Rojo brillante
    'Cerrado': '#4ECDC4', // Verde azulado
    'Resuelto': '#45B7D1', // Azul cielo
    'Vencido': '#FFA726', // Naranja
    'Pendiente': '#AB47BC', // Púrpura
    'En Proceso': '#66BB6A' // Verde
};
// Función para obtener color por nombre
const getColorByName = (name) => {
    return COLORS[name] || '#95A5A6'; // Gris por defecto
};
const DonutChart = ({ data, title = "Distribución de Tickets", isLoading = false }) => {
    // Mostrar estado de carga
    if (isLoading) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: title }), _jsx("div", { className: "flex items-center justify-center", style: { height: 300 }, children: _jsx("p", { className: "text-gray-500", children: "Cargando datos..." }) })] }));
    }
    // Mostrar estado vacío
    if (!data || data.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: title }), _jsx("div", { className: "flex items-center justify-center", style: { height: 300 }, children: _jsx("p", { className: "text-gray-500", children: "No hay datos para mostrar" }) })] }));
    }
    // Calcular total para el tooltip
    const total = data.reduce((sum, item) => sum + item.value, 0);
    // Renderizar el gráfico
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: title }), _jsx("div", { style: { width: '100%', height: 300 }, children: _jsx(ResponsiveContainer, { children: _jsxs(PieChart, { children: [_jsx(Pie, { data: data, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 100, paddingAngle: 2, dataKey: "value", label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, labelLine: false, children: data.map((entry, index) => (_jsx(Cell, { fill: getColorByName(entry.name) }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name) => [`${value} tickets (${((value / total) * 100).toFixed(1)}%)`, name], contentStyle: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white'
                                } }), _jsx(Legend, {})] }) }) }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-100", children: _jsxs("div", { className: "flex justify-between items-center text-sm text-gray-600", children: [_jsx("span", { children: "Total:" }), _jsxs("span", { className: "font-medium", children: [total, " tickets"] })] }) })] }));
};
export default DonutChart;
