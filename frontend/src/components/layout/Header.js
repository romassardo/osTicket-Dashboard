import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
/**
 * Header del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa la estructura de header con sistema de tokens
 */
const Header = () => {
    return (_jsx("header", { className: "dashboard-header-bar", children: _jsxs("div", { className: "header-content", children: [_jsx("div", { className: "header-left", children: _jsx("h1", { className: "header-title", children: "Dashboard OsTicket" }) }), _jsx("div", { className: "header-right", children: _jsx("span", { className: "header-status", children: "Soporte IT" }) })] }) }));
};
export default Header;
