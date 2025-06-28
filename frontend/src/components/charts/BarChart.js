import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const BarChart = ({ data, title = "Gráfico de Barras", height = 300 }) => {
    return (_jsxs("div", { className: "chart-container", children: [title && (_jsx("h3", { className: "chart-title", children: title })), _jsx(ResponsiveContainer, { width: "100%", height: height, children: _jsxs(RechartsBarChart, { data: data, margin: {
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border-muted)", opacity: 0.5 }), _jsx(XAxis, { dataKey: "name", stroke: "var(--text-muted)", fontSize: 11, tickLine: false, axisLine: false, angle: -45, textAnchor: "end", height: 80, interval: 0 }), _jsx(YAxis, { stroke: "var(--text-muted)", fontSize: 12, tickLine: false, axisLine: false, allowDecimals: false }), _jsx(Tooltip, { contentStyle: {
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-muted)',
                                color: 'var(--text-primary)',
                            }, labelStyle: {
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                            }, cursor: {
                                fill: 'var(--accent-primary)',
                                opacity: 0.1,
                            } }), _jsx(Bar, { dataKey: "value", fill: "var(--accent-primary)", radius: [4, 4, 0, 0], stroke: "var(--accent-primary)", strokeWidth: 1 })] }) })] }));
};
export default BarChart;
