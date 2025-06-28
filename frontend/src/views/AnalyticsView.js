import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import FilterPanel from '../components/analytics/FilterPanel.tsx';
import { DataTable } from '../components/tables/DataTable.tsx';
import { Card } from '../components/ui/Card.tsx';
import Pagination from '../components/tables/Pagination.tsx'; // Importar el componente de paginación
// Importamos íconos para mejorar la UI según la guía de diseño
import { ArrowPathIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
// Importar librería xlsx para exportación a Excel
import * as XLSX from 'xlsx';
const AnalyticsView = () => {
    const [tickets, setTickets] = useState([]);
    const [filters, setFilters] = useState({});
    const [transporteOptions, setTransporteOptions] = useState([]); // Cambiado a objetos {id, value}
    const [staffOptions, setStaffOptions] = useState([]);
    const [sectorOptions, setSectorOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    // Función para cargar opciones de filtros
    const fetchFilterOptions = async () => {
        try {
            console.log('Fetching filter options...');
            const [transporteRes, staffRes, sectorRes, statusRes] = await Promise.all([
                fetch('/api/tickets/options/transporte'),
                fetch('/api/tickets/options/staff'),
                fetch('/api/tickets/options/sector'),
                fetch('/api/tickets/options/status'),
            ]);
            // Procesar opciones de transporte
            if (transporteRes.ok) {
                try {
                    const transporteData = await transporteRes.json();
                    console.log('Transporte data:', transporteData);
                    if (Array.isArray(transporteData) && transporteData.length > 0) {
                        // Guardar los objetos completos {id, value}
                        setTransporteOptions(transporteData);
                    }
                    else {
                        console.warn('Transporte data is empty');
                        setTransporteOptions([]);
                    }
                }
                catch (e) {
                    console.error('Error parsing transporte data:', e);
                    setTransporteOptions([]);
                }
            }
            else {
                console.warn('Transporte response not OK');
                setTransporteOptions([]);
            }
            // Procesar opciones de staff
            if (staffRes.ok) {
                try {
                    const staffData = await staffRes.json();
                    console.log('Staff data:', staffData);
                    setStaffOptions(Array.isArray(staffData) ? staffData : []);
                }
                catch (e) {
                    console.error('Error parsing staff data:', e);
                    setStaffOptions([]);
                }
            }
            else {
                setStaffOptions([]);
            }
            // Procesar opciones de sector
            if (sectorRes.ok) {
                try {
                    const sectorData = await sectorRes.json();
                    console.log('Sector data:', sectorData);
                    if (Array.isArray(sectorData) && sectorData.length > 0) {
                        setSectorOptions(sectorData);
                    }
                    else {
                        console.warn('Sector data is empty');
                        setSectorOptions([]);
                    }
                }
                catch (e) {
                    console.error('Error parsing sector data:', e);
                    setSectorOptions([]);
                }
            }
            else {
                console.warn('Sector response not OK');
                setSectorOptions([]);
            }
            // Procesar opciones de status
            if (statusRes.ok) {
                try {
                    const statusData = await statusRes.json();
                    console.log('Status data:', statusData);
                    setStatusOptions(Array.isArray(statusData) ? statusData : []);
                }
                catch (e) {
                    console.error('Error parsing status data:', e);
                    setStatusOptions([]);
                }
            }
            else {
                setStatusOptions([]);
            }
        }
        catch (error) {
            console.error('Error fetching filter options:', error);
            // Inicializar con arreglos vacíos en caso de error
            setTransporteOptions([]);
            setStaffOptions([]);
            setSectorOptions([]);
            setStatusOptions([]);
        }
    };
    const fetchTickets = async (currentFilters = {}, page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '50'); // Mostrar 50 registros por página
            // Añadir parámetros de filtro si existen
            if (currentFilters.transporte)
                params.append('transporte', currentFilters.transporte);
            if (currentFilters.staff)
                params.append('staff', currentFilters.staff);
            if (currentFilters.organization)
                params.append('organization', currentFilters.organization);
            if (currentFilters.statuses)
                params.append('statuses', currentFilters.statuses);
            if (currentFilters.startDate)
                params.append('startDate', currentFilters.startDate);
            if (currentFilters.endDate)
                params.append('endDate', currentFilters.endDate);
            const url = `/api/tickets?${params.toString()}`;
            console.log('Fetching tickets with URL:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();
            // El endpoint /api/tickets devuelve {data: [...], pagination: {...}}
            console.log('Tickets recibidos:', data.data?.length || 0);
            setTickets(data.data || []);
            setPagination(data.pagination || null);
        }
        catch (error) {
            console.error('Error fetching tickets:', error);
            setTickets([]);
            setPagination(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const applyFilters = (newFilters) => {
        console.log('Aplicando filtros:', newFilters);
        setFilters(newFilters);
        setCurrentPage(1); // Resetear a la primera página al aplicar filtros
        fetchTickets(newFilters, 1);
    };
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchTickets(filters, page);
    };
    // Cargar tickets al montar el componente
    useEffect(() => {
        fetchFilterOptions();
        fetchTickets(filters, currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const exportToExcel = () => {
        if (tickets.length === 0) {
            alert('No hay datos para exportar. Aplique filtros o espere a que se carguen los datos.');
            return;
        }
        // Formatear los datos para el Excel con nombres de columnas legibles
        const formattedData = tickets.map(ticket => ({
            'Nº Ticket': ticket.number,
            'Asunto': ticket.cdata?.subject || '-',
            'Estado': ticket.status?.name || '-',
            'Usuario': ticket.user ? `${ticket.user.name}` : '-',
            'Agente': ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}` : '-',
            'Sector/Sucursal': ticket.cdata?.SectorName?.value || ticket.cdata?.sector || '-',
            'Transporte': ticket.cdata?.TransporteName?.value || '-',
            'Fecha Creación': ticket.created ? new Date(ticket.created).toLocaleDateString('es-ES') : '-'
        }));
        // Crear hoja de trabajo
        const workSheet = XLSX.utils.json_to_sheet(formattedData);
        // Crear libro de trabajo
        const workBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workBook, workSheet, 'Tickets');
        // Agregar una segunda hoja con información de filtros aplicados
        const filterInfo = [];
        filterInfo.push({ 'Filtro': 'Fecha de exportación', 'Valor': new Date().toLocaleString('es-ES') });
        filterInfo.push({ 'Filtro': 'Total de registros', 'Valor': tickets.length });
        if (filters && Object.keys(filters).length > 0) {
            filterInfo.push({ 'Filtro': '--- FILTROS APLICADOS ---', 'Valor': '' });
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    let filterName = key;
                    switch (key) {
                        case 'transporte':
                            filterName = 'Transporte';
                            break;
                        case 'staff':
                            filterName = 'Agente';
                            break;
                        case 'organization':
                            filterName = 'Sector/Organización';
                            break;
                        case 'statuses':
                            filterName = 'Estados';
                            break;
                        case 'startDate':
                            filterName = 'Fecha desde';
                            break;
                        case 'endDate':
                            filterName = 'Fecha hasta';
                            break;
                    }
                    filterInfo.push({ 'Filtro': filterName, 'Valor': value });
                }
            });
        }
        else {
            filterInfo.push({ 'Filtro': 'Filtros aplicados', 'Valor': 'Ninguno (todos los registros)' });
        }
        const filterSheet = XLSX.utils.json_to_sheet(filterInfo);
        XLSX.utils.book_append_sheet(workBook, filterSheet, 'Filtros');
        // Generar nombre de archivo con fecha y hora
        const now = new Date();
        const fileName = `tickets_analytics_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}.xlsx`;
        // Descargar archivo
        XLSX.writeFile(workBook, fileName);
    };
    return (_jsxs("div", { className: "max-w-1400 mx-auto px-8 py-12 bg-[#0a0e14] text-[#ffffff]", children: [_jsxs("div", { className: "dashboard-header flex justify-between items-center mb-8", children: [_jsxs("div", { className: "header-left", children: [_jsx("h1", { className: "text-h1 text-[1.875rem] leading-[1.3] font-semibold text-[#ffffff] mb-1", children: "An\u00E1lisis Avanzado de Tickets" }), _jsxs("span", { className: "text-small text-[0.75rem] leading-[1.4] text-[#7a8394]", children: ["\u00DAltima actualizaci\u00F3n: ", new Date().toLocaleTimeString()] })] }), _jsxs("div", { className: "header-right flex space-x-4", children: [_jsxs("button", { onClick: exportToExcel, className: "flex items-center px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]", children: [_jsx(DocumentChartBarIcon, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: "Exportar" })] }), _jsxs("button", { onClick: () => fetchTickets(filters, currentPage), className: "flex items-center px-4 py-2 bg-[#252a35] hover:bg-[#2d3441] rounded-lg transition-all duration-200 text-[#b8c5d6]", children: [_jsx(ArrowPathIcon, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: "Actualizar" })] })] })] }), _jsx(FilterPanel, { transporteOptions: transporteOptions, staffOptions: staffOptions, sectorOptions: sectorOptions, statusOptions: statusOptions, onApplyFilters: applyFilters }), isLoading ? (_jsxs("div", { className: "flex flex-col justify-center items-center h-64 bg-[#1a1f29] rounded-xl shadow-lg border border-[#2d3441] p-8 animate-fadeIn", children: [_jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00d9ff] mb-4" }), _jsx("p", { className: "text-[#b8c5d6] text-base", children: "Cargando datos..." })] })) : (_jsxs(_Fragment, { children: [_jsx(DataTable, { tickets: tickets }), pagination && pagination.total_pages > 1 && (_jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Pagination, { pagination: pagination, onPageChange: handlePageChange }) }))] }))] }));
};
export default AnalyticsView;
