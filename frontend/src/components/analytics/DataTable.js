import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
const DataTable = ({ tickets }) => {
    // Función para formatear la fecha
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (tickets.length === 0) {
        return (_jsx("div", { className: "bg-[#1a1f29] p-6 rounded-xl shadow-lg border border-[#2d3441] text-center animate-fadeIn transition-all duration-300", children: _jsxs("div", { className: "flex flex-col items-center justify-center py-8", children: [_jsx(DocumentTextIcon, { className: "h-16 w-16 text-[#2d3441] mb-4" }), _jsx("p", { className: "text-[#b8c5d6] text-lg font-medium mb-2", children: "No se encontraron tickets" }), _jsx("p", { className: "text-[#6b7280] text-sm", children: "Intenta ajustar los filtros para ver m\u00E1s resultados" })] }) }));
    }
    return (_jsxs("div", { className: "overflow-x-auto rounded-xl border border-[#2d3441] shadow-lg transition-all duration-300 hover:shadow-xl bg-[#1a1f29]", children: [_jsxs("div", { className: "p-4 border-b border-[#2d3441] flex items-center", children: [_jsx(DocumentTextIcon, { className: "h-5 w-5 text-[#00d9ff] mr-2" }), _jsxs("h3", { className: "text-[1rem] font-semibold text-[#ffffff]", children: ["Resultados (", tickets.length, ")"] })] }), _jsxs("table", { className: "min-w-full divide-y divide-[#2d3441]", children: [_jsx("thead", { className: "bg-[#252a35]", children: _jsxs("tr", { className: "text-left text-[0.75rem] font-medium text-[#b8c5d6] uppercase tracking-wider", children: [_jsx("th", { scope: "col", className: "px-6 py-4 text-[0.7rem]", children: "N\u00BA Ticket" }), _jsx("th", { scope: "col", className: "px-6 py-4 text-[0.7rem]", children: "Asunto" }), _jsx("th", { scope: "col", className: "px-6 py-4 text-[0.7rem]", children: "Agente" }), _jsx("th", { scope: "col", className: "px-6 py-4 text-[0.7rem]", children: "Fecha Creaci\u00F3n" }), _jsx("th", { scope: "col", className: "px-6 py-4 text-[0.7rem]", children: "Transporte" })] }) }), _jsx("tbody", { className: "bg-[#1a1f29] divide-y divide-[#2d3441]", children: tickets.map((ticket) => (_jsxs("tr", { className: "hover:bg-[#252a35] transition-colors duration-200", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[0.875rem] font-medium text-[#ffffff]", children: ticket.number }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6] max-w-[250px] truncate", children: ticket.cdata?.subject || '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]", children: ticket.AssignedStaff ?
                                        `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}` : '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]", children: formatDate(ticket.created) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]", children: ticket.cdata?.TransporteName?.value || '-' })] }, ticket.ticket_id))) })] })] }));
};
export default DataTable;
