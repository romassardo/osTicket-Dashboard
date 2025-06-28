import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
/**
 * Componente de spinner moderno con animación suave
 * Diseñado siguiendo DESIGN_GUIDE.md para estados de carga
 */
export const Spinner = ({ size = 'md', className = '' }) => {
    const sizeClass = {
        'sm': 'w-4 h-4 border-2',
        'md': 'w-8 h-8 border-2',
        'lg': 'w-12 h-12 border-3',
    }[size];
    return (_jsx("div", { className: `
        inline-block rounded-full border-current 
        border-r-transparent animate-spin 
        ${sizeClass}
        ${className}
      `, style: {
            animationDuration: '0.7s',
        }, role: "status", "aria-label": "Cargando", children: _jsx("span", { className: "sr-only", children: "Cargando..." }) }));
};
export default Spinner;
