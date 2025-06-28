import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * Componente con iconos SVG para el dashboard
 * Basado en el sistema de diseño de DESIGN_GUIDE.md
 */
export const InfoCircle = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 16v-4" }), _jsx("path", { d: "M12 8h.01" })] }));
};
export const AlertTriangle = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), _jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }), _jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })] }));
};
export const Buildings = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("rect", { x: "4", y: "2", width: "16", height: "20", rx: "2", ry: "2" }), _jsx("line", { x1: "9", y1: "22", x2: "9", y2: "2" }), _jsx("line", { x1: "15", y1: "22", x2: "15", y2: "2" }), _jsx("line", { x1: "4", y1: "12", x2: "20", y2: "12" }), _jsx("line", { x1: "4", y1: "7", x2: "9", y2: "7" }), _jsx("line", { x1: "15", y1: "7", x2: "20", y2: "7" }), _jsx("line", { x1: "4", y1: "17", x2: "9", y2: "17" }), _jsx("line", { x1: "15", y1: "17", x2: "20", y2: "17" })] }));
};
export const ChartBar = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("line", { x1: "18", y1: "20", x2: "18", y2: "10" }), _jsx("line", { x1: "12", y1: "20", x2: "12", y2: "4" }), _jsx("line", { x1: "6", y1: "20", x2: "6", y2: "14" }), _jsx("line", { x1: "2", y1: "20", x2: "22", y2: "20" })] }));
};
export const PieChart = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83" }), _jsx("path", { d: "M22 12A10 10 0 0 0 12 2v10z" })] }));
};
export const LineChart = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("line", { x1: "4", y1: "19", x2: "20", y2: "19" }), _jsx("polyline", { points: "4 15 8 9 12 11 16 6 20 10" })] }));
};
export const Calendar = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }), _jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), _jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), _jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })] }));
};
export const Refresh = ({ className = '', color }) => {
    return (_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: color || 'currentColor', strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, children: [_jsx("path", { d: "M23 4v6h-6" }), _jsx("path", { d: "M1 20v-6h6" }), _jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })] }));
};
