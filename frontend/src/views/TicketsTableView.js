import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from '../components/tables/DataTable.tsx';
import SearchBar from '../components/tables/SearchBar.tsx';
import Pagination from '../components/tables/Pagination.tsx';
const TicketsTableView = () => {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    // Separar los filtros en estados individuales para mejor control
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [dateRange, setDateRange] = useState([null, null]);
    const [selectedOrganization, setSelectedOrganization] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    // Comentamos este objeto memoizado ya que no se está utilizando actualmente
    // Si se necesita en el futuro, se puede descomentar
    /*
    const filters = useMemo(() => ({
      search: searchTerm,
      selectedStatuses,
      dateRange,
      selectedOrganization,
      selectedStaff
    }), [searchTerm, selectedStatuses, dateRange, selectedOrganization, selectedStaff]);
    */
    // Memorizar la función fetchTickets para evitar recreaciones
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', '15');
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (selectedStatuses && selectedStatuses.length > 0) {
                // Convertir a strings si son números
                const statusesStr = selectedStatuses.map(s => s.toString()).join(',');
                params.append('statuses', statusesStr);
                console.log('Frontend: enviando statuses:', statusesStr);
            }
            if (dateRange && dateRange[0]) {
                const startDateStr = dateRange[0].toISOString().split('T')[0];
                params.append('startDate', startDateStr);
                console.log('Frontend: enviando startDate:', startDateStr);
            }
            if (dateRange && dateRange[1]) {
                const endDateStr = dateRange[1].toISOString().split('T')[0];
                params.append('endDate', endDateStr);
                console.log('Frontend: enviando endDate:', endDateStr);
            }
            if (selectedOrganization) {
                params.append('organization', selectedOrganization.toString());
                console.log('Frontend: enviando organization:', selectedOrganization);
            }
            if (selectedStaff) {
                params.append('staff', selectedStaff.toString());
                console.log('Frontend: enviando staff:', selectedStaff);
            }
            const url = `/api/tickets?${params.toString()}`;
            console.log('Frontend: URL completa:', url);
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los tickets');
            }
            const data = await response.json();
            setTickets(data.data);
            setPagination(data.pagination);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, selectedStatuses, dateRange, selectedOrganization, selectedStaff]);
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);
    const handleSearch = useCallback((newSearchTerm) => {
        setCurrentPage(1); // Reset to first page on new search
        setSearchTerm(newSearchTerm);
    }, []);
    const handleApplyFilters = useCallback((appliedFilters) => {
        setCurrentPage(1); // Reset to first page when filters change
        setSelectedStatuses(appliedFilters.selectedStatuses || []);
        setDateRange(appliedFilters.dateRange || [null, null]);
        setSelectedOrganization(appliedFilters.selectedOrganization || '');
        setSelectedStaff(appliedFilters.selectedStaff || '');
    }, []);
    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);
    const handleRetry = useCallback(() => {
        // Simplemente llamar fetchTickets directamente
        fetchTickets();
    }, [fetchTickets]);
    const getActiveFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm)
            count++;
        if (selectedStatuses && selectedStatuses.length > 0)
            count++;
        if (dateRange && (dateRange[0] || dateRange[1]))
            count++;
        if (selectedOrganization)
            count++;
        if (selectedStaff)
            count++;
        return count;
    }, [searchTerm, selectedStatuses, dateRange, selectedOrganization, selectedStaff]);
    return (_jsxs("div", { className: "p-6 lg:p-8 bg-[#0a0e14] min-h-screen", children: [_jsx("div", { className: "flex items-center justify-between mb-8", children: _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-[#ffffff]", children: "Tickets" }), _jsx("p", { className: "mt-2 text-sm text-[#7a8394]", children: "Gesti\u00F3n de tickets de soporte para el departamento de Soporte IT" })] }) }), _jsx(SearchBar, { onSearch: handleSearch, onApplyFilters: handleApplyFilters, loading: loading, activeFilters: getActiveFilterCount > 0 }), _jsx("div", { className: "mt-6", children: loading ? (_jsx("div", { className: "bg-[#1a1f29] rounded-xl p-10 text-center border border-[#2d3441] shadow-lg", children: _jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d9ff] mb-4" }), _jsx("p", { className: "text-[#b8c5d6] font-medium", children: "Cargando tickets..." })] }) })) : error ? (_jsx("div", { className: "bg-[#1a1f29] rounded-xl p-10 text-center border border-[#2d3441] shadow-lg", children: _jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx("svg", { className: "w-12 h-12 text-[#ef4444] mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("p", { className: "text-[#b8c5d6] font-medium mb-2", children: "Error al cargar tickets" }), _jsx("p", { className: "text-[#7a8394] text-sm", children: error }), _jsx("button", { onClick: handleRetry, className: "mt-4 px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] text-[#b8c5d6] rounded-lg transition-colors", children: "Reintentar" })] }) })) : tickets.length === 0 ? (_jsx("div", { className: "bg-[#1a1f29] rounded-xl p-10 text-center border border-[#2d3441] shadow-lg", children: _jsxs("div", { className: "flex flex-col items-center justify-center", children: [_jsx("svg", { className: "w-12 h-12 text-[#7a8394] mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("p", { className: "text-[#b8c5d6] font-medium", children: "No se encontraron tickets" }), _jsx("p", { className: "text-[#7a8394] text-sm mt-2", children: "Intenta con otros filtros de b\u00FAsqueda" })] }) })) : (_jsx(DataTable, { tickets: tickets, totalCount: pagination?.total_items || tickets.length })) }), pagination && pagination.total_pages > 1 && (_jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Pagination, { pagination: pagination, onPageChange: handlePageChange }) }))] }));
};
export default TicketsTableView;
