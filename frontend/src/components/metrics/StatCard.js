import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { TicketIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
const StatCard = ({ title, value, subtitle, icon, iconCustom, trend, className = '' }) => {
    // Determinar si la tendencia es positiva o negativa
    const isTrendPositive = trend && trend.startsWith('+');
    const isTrendNegative = trend && trend.startsWith('-');
    // Seleccionar el icono apropiado basado en la prop icon
    const renderIcon = () => {
        switch (icon) {
            case 'total':
                return _jsx(TicketIcon, { className: "h-6 w-6 text-[var(--accent-primary)]" });
            case 'open':
                return _jsx(ExclamationTriangleIcon, { className: "h-6 w-6 text-[var(--warning)]" });
            case 'pending':
                return _jsx(ClockIcon, { className: "h-6 w-6 text-[var(--info)]" });
            case 'closed':
                return _jsx(CheckCircleIcon, { className: "h-6 w-6 text-[var(--success)]" });
            case 'custom':
                return iconCustom;
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: `group relative overflow-hidden bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300 ${className}`, children: [_jsx("div", { className: "absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent transform -translate-y-16 translate-x-16 group-hover:translate-x-14 transition-all duration-500" }), _jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex items-center", children: [renderIcon() && (_jsx("div", { className: "mr-3 flex-shrink-0 rounded-lg bg-[var(--bg-tertiary)] p-2 group-hover:scale-110 transition-transform duration-300", children: renderIcon() })), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-[var(--text-primary)]", children: title }), subtitle && _jsx("p", { className: "text-xs text-[var(--text-muted)]", children: subtitle })] })] }), trend && (_jsxs("span", { className: `flex items-center text-xs px-2 py-1 rounded-full 
              ${isTrendPositive ? 'text-[var(--success)] bg-[var(--success)]/10' : ''}
              ${isTrendNegative ? 'text-[var(--error)] bg-[var(--error)]/10' : ''}
              ${!isTrendPositive && !isTrendNegative ? 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]' : ''}
            `, children: [isTrendPositive && _jsx(ArrowUpIcon, { className: "h-3 w-3 mr-1" }), isTrendNegative && _jsx(ArrowDownIcon, { className: "h-3 w-3 mr-1" }), trend] }))] }), _jsx("div", { className: "text-2xl md:text-3xl font-bold text-[var(--text-primary)] group-hover:translate-y-0 transform transition-all duration-300", children: typeof value === 'number' ? value.toLocaleString() : value })] }));
};
export default StatCard;
