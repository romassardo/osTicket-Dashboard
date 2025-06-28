import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
/**
 * Layout principal del Dashboard según DESIGN_GUIDE.md
 * Implementa el sistema de tokens de diseño y dark mode first
 */
const DashboardLayout = () => {
    return (_jsxs("div", { className: "dashboard-layout", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "dashboard-main", children: [_jsx(Header, {}), _jsx("main", { className: "dashboard-content", children: _jsx(Outlet, {}) })] })] }));
};
export default DashboardLayout;
