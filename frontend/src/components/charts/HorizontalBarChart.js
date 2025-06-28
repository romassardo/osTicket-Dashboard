import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
/**
 * Componente de gráfico de barras horizontal moderno y visualmente mejorado
 * Diseñado según las especificaciones de DESIGN_GUIDE.md
 */
const HorizontalBarChart = ({ data, title, height = 300, className = '', showLabels = true, labelPosition = 'inside', maxItemsToShow = 0 }) => {
    // Estado para rastrear la barra activa en hover
    const [activeIndex, setActiveIndex] = useState(null);
    // Determinar si necesitamos limitar los datos mostrados
    const displayData = maxItemsToShow > 0 && data.length > maxItemsToShow
        ? [...data.slice(0, maxItemsToShow - 1), {
                name: 'Otros',
                value: data.slice(maxItemsToShow - 1).reduce((sum, item) => sum + item.value, 0),
                fullName: `Otros ${data.length - maxItemsToShow + 1} sectores`,
                color: 'var(--bg-accent)'
            }]
        : data;
    // Calcular el valor máximo para dimensionar mejor el gráfico
    const maxValue = Math.max(...displayData.map(item => item.value)) * 1.1;
    // Calcular el total para los porcentajes
    const total = displayData.reduce((sum, item) => sum + item.value, 0);
    // Componente personalizado para el tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (_jsxs("div", { className: "bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg shadow-lg p-3 text-sm", children: [_jsx("p", { className: "font-medium text-[var(--text-primary)] mb-1", children: item.fullName || item.name }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: item.color || 'var(--accent-primary)' } }), _jsxs("span", { className: "text-[var(--text-secondary)]", children: [item.value, " tickets"] })] }), _jsxs("span", { className: "text-[var(--text-muted)] text-xs", children: [percentage, "% del total"] })] })] }));
        }
        return null;
    };
    // Renderizador personalizado para las etiquetas
    const renderCustomizedLabel = (props) => {
        const { x, y, width, height, value } = props; // Eliminado 'name' que no se usaba
        const percentage = ((value / total) * 100).toFixed(1);
        // Posición y estilo según configuración
        const isInside = labelPosition === 'inside';
        // const radius = 10; // Variable no utilizada, comentada
        const fontSize = 11;
        const labelX = isInside ? x + width - 8 : x + width + 8;
        const labelY = y + height / 2;
        const textAnchor = isInside ? 'end' : 'start';
        const fill = isInside ? 'var(--text-primary)' : 'var(--text-secondary)';
        // No mostrar etiquetas en barras muy pequeñas
        if (width < 50 && isInside)
            return null;
        return (_jsx("g", { children: _jsxs("text", { x: labelX, y: labelY, fill: fill, textAnchor: textAnchor, dominantBaseline: "middle", fontSize: fontSize, fontWeight: "500", children: [value, " (", percentage, "%)"] }) }));
    };
    return (_jsxs("div", { className: `relative h-full flex flex-col ${className}`, children: [title && (_jsx("h3", { className: "text-lg font-medium mb-2 text-[var(--text-primary)]", children: title })), _jsxs("div", { className: "flex-1 w-full h-full relative group", children: [_jsx("div", { className: "absolute inset-0 rounded-lg bg-gradient-to-br from-[var(--accent-secondary)]/5 to-transparent opacity-50 pointer-events-none" }), _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsBarChart, { data: displayData, layout: "vertical" // Orientación horizontal de las barras
                            , margin: { top: 10, right: showLabels && labelPosition === 'outside' ? 120 : 20, left: 20, bottom: 5 }, barSize: 24, barGap: 4, onMouseMove: (state) => {
                                if (state.isTooltipActive) {
                                    setActiveIndex(state.activeTooltipIndex);
                                }
                            }, onMouseLeave: () => setActiveIndex(null), children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "barGradient", x1: "0", y1: "0", x2: "1", y2: "0", children: [_jsx("stop", { offset: "0%", stopColor: "var(--accent-primary)", stopOpacity: 0.8 }), _jsx("stop", { offset: "100%", stopColor: "var(--accent-secondary)", stopOpacity: 0.9 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--bg-accent)", opacity: 0.4, horizontal: true, vertical: false }), _jsx(XAxis, { type: "number", stroke: "var(--text-muted)", fontSize: 11, tickLine: false, axisLine: false, allowDecimals: false, domain: [0, maxValue], tick: { fill: 'var(--text-muted)' } }), _jsx(YAxis, { type: "category", dataKey: "name", width: 150, stroke: "var(--text-muted)", fontSize: 12, tickLine: false, axisLine: false, interval: 0, tick: (props) => {
                                        const { x, y, payload } = props;
                                        return (_jsx("g", { transform: `translate(${x},${y})`, children: _jsx("text", { x: -5, y: 0, dy: 4, textAnchor: "end", fill: "var(--text-secondary)", fontSize: 12, className: activeIndex === payload.index ? 'font-medium' : '', children: payload.value }) }));
                                    } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}), cursor: {
                                        fill: 'var(--bg-tertiary)',
                                        stroke: 'var(--accent-secondary)',
                                        strokeWidth: 1,
                                        opacity: 0.1,
                                        radius: 4
                                    } }), _jsxs(Bar, { dataKey: "value", fill: "url(#barGradient)", radius: [0, 4, 4, 0], animationDuration: 800, animationEasing: "ease-out", children: [displayData.map((entry, index) => (_jsx(Cell, { fill: entry.color || 'url(#barGradient)', opacity: activeIndex === null || activeIndex === index ? 1 : 0.6, className: "transition-opacity duration-300", style: {
                                                filter: activeIndex === index ? 'drop-shadow(0 0 2px rgba(255,255,255,0.2))' : 'none',
                                            } }, `cell-${index}`))), showLabels && (_jsx(LabelList, { dataKey: "value", position: labelPosition, content: renderCustomizedLabel }))] })] }) }), _jsx("div", { className: "absolute inset-0 rounded-xl ring-1 ring-inset ring-[var(--bg-accent)]/30 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" })] }), maxItemsToShow > 0 && data.length > maxItemsToShow && (_jsxs("p", { className: "text-xs text-[var(--text-muted)] text-right mt-2 italic", children: ["* Mostrando los ", maxItemsToShow - 1, " principales sectores. Otros ", data.length - maxItemsToShow + 1, " sectores agrupados."] }))] }));
};
export default HorizontalBarChart;
