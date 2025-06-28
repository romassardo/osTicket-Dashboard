import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Link } from 'react-router-dom';
const NotFoundView = () => {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-bg-primary", children: [_jsx("h1", { className: "text-6xl font-bold text-accent-primary mb-4", children: "404" }), _jsx("h2", { className: "text-2xl font-semibold text-gray-800 dark:text-white mb-2", children: "P\u00E1gina No Encontrada" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-6", children: "Lo sentimos, la p\u00E1gina que buscas no existe o ha sido movida." }), _jsx(Link, { to: "/", className: "px-6 py-3 bg-accent-primary text-white font-semibold rounded-lg shadow hover:bg-opacity-90 transition-colors", children: "Volver al Inicio" })] }));
};
export default NotFoundView;
