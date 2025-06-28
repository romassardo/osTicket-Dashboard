import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBarIcon, TicketIcon, Cog6ToothIcon, HomeIcon, } from '@heroicons/react/24/outline';
/**
 * Sidebar del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa navegación con sistema de tokens y microinteracciones
 */
const Sidebar = () => {
    const navLinks = [
        { name: 'Dashboard', href: '/', icon: HomeIcon },
        { name: 'Tickets', href: '/tickets', icon: TicketIcon },
        { name: 'Reportes', href: '/analytics', icon: ChartBarIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ];
    return (_jsxs("aside", { className: "dashboard-sidebar", children: [_jsx("div", { className: "header-brand", children: _jsxs("div", { className: "brand-link", children: [_jsx("div", { className: "brand-icon", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", className: "w-4 h-4", children: _jsx("path", { fillRule: "evenodd", d: "M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm3-.75a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V12a.75.75 0 01.75-.75zm3.75-2.25a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z", clipRule: "evenodd" }) }) }), _jsx("span", { children: "OsTicket" })] }) }), _jsx("nav", { className: "nav-menu", children: navLinks.map((item) => {
                    const IconComponent = item.icon;
                    return (_jsxs(NavLink, { to: item.href, end: item.href === '/', className: ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`, children: [_jsx(IconComponent, { className: "nav-icon", "aria-hidden": "true" }), _jsx("span", { children: item.name })] }, item.name));
                }) }), _jsx("div", { className: "sidebar-footer", children: _jsxs("div", { className: "footer-content", children: [_jsx("div", { className: "status-indicator" }), _jsx("span", { className: "status-text", children: "Sistema Activo" })] }) })] }));
};
export default Sidebar;
