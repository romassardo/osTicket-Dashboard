import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/analytics/FilterPanel.tsx
import React, { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
const FilterPanel = ({ transporteOptions, staffOptions, sectorOptions, statusOptions, onApplyFilters }) => {
    // Estados para los filtros seleccionados
    const [selectedTransporte, setSelectedTransporte] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const handleApply = () => {
        const filters = {};
        if (selectedTransporte)
            filters.transporte = parseInt(selectedTransporte, 10);
        if (selectedStaff)
            filters.staff = parseInt(selectedStaff, 10);
        if (selectedSector)
            filters.organization = parseInt(selectedSector, 10); // El backend espera 'organization'
        if (selectedStatus)
            filters.statuses = parseInt(selectedStatus, 10); // El backend espera 'statuses'
        if (startDate)
            filters.startDate = startDate;
        if (endDate)
            filters.endDate = endDate;
        console.log('Aplicando filtros:', filters);
        onApplyFilters(filters);
    };
    const handleReset = () => {
        setSelectedTransporte('');
        setSelectedStaff('');
        setSelectedSector('');
        setSelectedStatus('');
        setStartDate('');
        setEndDate('');
        onApplyFilters({});
    };
    return (_jsxs("div", { className: "bg-[#1a1f29] p-6 rounded-xl shadow-lg mb-6 border border-[#2d3441] transition-all duration-300 hover:shadow-xl animate-slideInUp", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FunnelIcon, { className: "h-5 w-5 text-[#00d9ff] mr-2" }), _jsx("h2", { className: "text-h2 text-[1.25rem] leading-[1.4] font-semibold text-[#ffffff]", children: "Filtros Avanzados" })] }), _jsxs("button", { onClick: handleReset, className: "flex items-center px-3 py-1 text-[0.75rem] bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]", children: [_jsx(XMarkIcon, { className: "h-4 w-4 mr-1" }), "Limpiar"] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4", children: [_jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "staff", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Agente" }), _jsxs("select", { id: "staff", value: selectedStaff, onChange: (e) => setSelectedStaff(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200", children: [_jsx("option", { value: "", children: "Todos" }), staffOptions.map(option => (_jsx("option", { value: option.staff_id, children: option.name }, option.staff_id)))] })] }), _jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "sector", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Sector" }), _jsxs("select", { id: "sector", value: selectedSector, onChange: (e) => setSelectedSector(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200", children: [_jsx("option", { value: "", children: "Todos" }), sectorOptions && sectorOptions.length > 0 ? (sectorOptions.map(option => (_jsx("option", { value: option.id, children: option.name }, option.id)))) : (_jsx("option", { value: "", disabled: true, children: "No hay sectores disponibles" }))] })] }), _jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "status", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Estado" }), _jsxs("select", { id: "status", value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200", children: [_jsx("option", { value: "", children: "Todos" }), statusOptions.map(option => (_jsx("option", { value: option.id, children: option.name }, option.id)))] })] }), _jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "transporte", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Transporte" }), _jsxs("select", { id: "transporte", value: selectedTransporte, onChange: (e) => setSelectedTransporte(e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-[0.875rem] border border-[#2d3441] focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] rounded-lg bg-[#252a35] text-[#ffffff] transition-colors duration-200", children: [_jsx("option", { value: "", children: "Todos" }), transporteOptions && transporteOptions.length > 0 ? (transporteOptions.map(option => (_jsx("option", { value: option.id, children: option.value }, option.id)))) : (_jsx("option", { value: "", disabled: true, children: "No hay opciones de transporte disponibles" }))] })] }), _jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "start-date", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Fecha Inicio" }), _jsx("input", { type: "date", id: "start-date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "mt-1 block w-full rounded-lg border border-[#2d3441] bg-[#252a35] text-[#ffffff] py-2 px-3 focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] text-[0.875rem] transition-colors duration-200" })] }), _jsxs("div", { className: "lg:col-span-1", children: [_jsx("label", { htmlFor: "end-date", className: "block text-[0.75rem] font-medium text-[#b8c5d6] mb-1", children: "Fecha Fin" }), _jsx("input", { type: "date", id: "end-date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "mt-1 block w-full rounded-lg border border-[#2d3441] bg-[#252a35] text-[#ffffff] py-2 px-3 focus:outline-none focus:ring-[#7c3aed] focus:border-[#00d9ff] text-[0.875rem] transition-colors duration-200" })] }), _jsx("div", { className: "flex items-end lg:col-span-1", children: _jsx("button", { onClick: handleApply, className: "w-full justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#00d9ff] hover:bg-[#00c5e8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition-all duration-200 transform hover:scale-[1.02]", children: "Aplicar Filtros" }) })] })] }));
};
export default FilterPanel;
