// frontend/src/components/analytics/DataTable.tsx
import type { Ticket } from '../../types';
import React, { memo, useCallback } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface DataTableProps {
  tickets: Ticket[];
}

/**
 * DataTable optimizado con React.memo y useCallback para evitar re-renders innecesarios
 * Candidato principal para optimización según memorias del proyecto [[memory:2988538]]
 */
const DataTable: React.FC<DataTableProps> = memo(({ tickets }) => {
  
  // Memoizar función formatDate para evitar recreaciones en cada render
  const formatDate = useCallback((dateString: string): string => {
    if (dateString === '') return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Helper function para obtener el nombre del transporte de forma robusta
  const getTransporteName = useCallback((ticket: Ticket): string => {
    // Prioridad 1: dataValues.transporteName (agregado por backend post-procesamiento)
    if (ticket.cdata?.dataValues?.transporteName) {
      return ticket.cdata.dataValues.transporteName;
    }
    // Prioridad 2: TransporteName.value (estructura de asociación Sequelize)
    if (ticket.cdata?.TransporteName?.value) {
      return ticket.cdata.TransporteName.value;
    }
    // Fallback: ID como string
    if (ticket.cdata?.transporte) {
      return `ID: ${ticket.cdata.transporte}`;
    }
    return '-';
  }, []);

  // Helper function para obtener el nombre del sector de forma robusta
  const getSectorName = useCallback((ticket: Ticket): string => {
    // Prioridad 1: dataValues.sectorName (agregado por backend post-procesamiento)
    if (ticket.cdata?.dataValues?.sectorName) {
      return ticket.cdata.dataValues.sectorName;
    }
    // Prioridad 2: SectorName.value (estructura de asociación Sequelize)
    if (ticket.cdata?.SectorName?.value) {
      return ticket.cdata.SectorName.value;
    }
    // Fallback: ID como string
    if (ticket.cdata?.sector) {
      return `ID: ${ticket.cdata.sector}`;
    }
    return '-';
  }, []);

  // Early return memoizado - evita re-render si tickets está vacío y no cambia
  if (tickets.length === 0) {
    return (
      <div className="bg-[#1a1f29] p-6 rounded-xl shadow-lg border border-[#2d3441] text-center animate-fadeIn transition-all duration-300">
        <div className="flex flex-col items-center justify-center py-8">
          <DocumentTextIcon className="h-16 w-16 text-[#2d3441] mb-4" />
          <p className="text-[#b8c5d6] text-lg font-medium mb-2">No se encontraron tickets</p>
          <p className="text-[#6b7280] text-sm">Intenta ajustar los filtros para ver más resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2d3441] shadow-lg transition-all duration-300 hover:shadow-xl bg-[#1a1f29]">
      <div className="p-4 border-b border-[#2d3441] flex items-center">
        <DocumentTextIcon className="h-5 w-5 text-[#00d9ff] mr-2" />
        <h3 className="text-[1rem] font-semibold text-[#ffffff]">Resultados ({tickets.length})</h3>
      </div>
      <table className="min-w-full divide-y divide-[#2d3441]">
        <thead className="bg-[#252a35]">
          <tr className="text-left text-[0.75rem] font-medium text-[#b8c5d6] uppercase tracking-wider">
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Nº Ticket
            </th>
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Asunto
            </th>
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Agente
            </th>
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Sector/Sucursal
            </th>
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Transporte
            </th>
            <th scope="col" className="px-6 py-4 text-[0.7rem]">
              Fecha Creación
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1f29] divide-y divide-[#2d3441]">
          {tickets.map((ticket) => (
            <tr key={ticket.ticket_id} className="hover:bg-[#252a35] transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] font-medium text-[#ffffff]">
                {ticket.number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6] max-w-[250px] truncate">
                {ticket.cdata?.subject ?? '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]">
                {ticket.AssignedStaff != null ? 
                  `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]">
                {getSectorName(ticket)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]">
                {getTransporteName(ticket)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[0.875rem] text-[#b8c5d6]">
                {formatDate(ticket.created)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// Asignar displayName para debugging en React DevTools
DataTable.displayName = 'DataTable';

export default DataTable;
