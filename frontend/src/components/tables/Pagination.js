import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
const Pagination = ({ pagination, onPageChange }) => {
    const { current_page, total_pages } = pagination;
    const handlePrevious = () => {
        if (current_page > 1) {
            onPageChange(current_page - 1);
        }
    };
    const handleNext = () => {
        if (current_page < total_pages) {
            onPageChange(current_page + 1);
        }
    };
    return (_jsxs("div", { className: "flex justify-between items-center mt-5 text-sm", children: [_jsxs("span", { className: "text-slate-400 font-medium bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm", children: ["P\u00E1gina ", _jsx("span", { className: "text-cyan-400 font-semibold", children: current_page }), " de ", _jsx("span", { className: "text-slate-200 font-semibold", children: total_pages })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: handlePrevious, disabled: current_page <= 1, className: "flex items-center justify-center px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 shadow-lg shadow-slate-900/20 hover:bg-slate-750 hover:text-cyan-400 hover:border-slate-600 hover:shadow-slate-900/30 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-slate-500 disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all duration-200", "aria-label": "P\u00E1gina anterior", children: [_jsx(ChevronLeftIcon, { className: "h-5 w-5 mr-1 transition-transform duration-300 group-hover:-translate-x-0.5" }), _jsx("span", { children: "Anterior" })] }), _jsxs("button", { onClick: handleNext, disabled: current_page >= total_pages, className: "flex items-center justify-center px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 shadow-lg shadow-slate-900/20 hover:bg-slate-750 hover:text-cyan-400 hover:border-slate-600 hover:shadow-slate-900/30 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-slate-500 disabled:hover:border-slate-700 disabled:hover:shadow-none transition-all duration-200", "aria-label": "P\u00E1gina siguiente", children: [_jsx("span", { children: "Siguiente" }), _jsx(ChevronRightIcon, { className: "h-5 w-5 ml-1 transition-transform duration-300 group-hover:translate-x-0.5" })] })] })] }));
};
export default Pagination;
