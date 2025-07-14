import React from 'react';
import type { Ticket } from '../../types';
import { formatDate } from '../../utils/formatters';
import { DocumentTextIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import logger from '../../utils/logger';

interface DataTableProps {
  tickets: Ticket[];
  totalCount?: number;
}

const DataTable: React.FC<DataTableProps> = ({ tickets, totalCount = 0 }) => {
  const tableHeaders = [
    'Número',
    'Asunto',
    'Sector',
    'Usuario',
    'Agente',
    'Fecha Creación',
  ];

  return (
    <div className="overflow-hidden bg-[#1a1f29] rounded-xl border border-[#2d3441] shadow-lg transition-all duration-200 hover:shadow-xl">
      <div className="p-4 border-b border-[#2d3441] flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-[#252a35] p-2 rounded-lg mr-3">
            <DocumentTextIcon className="h-5 w-5 text-[#00d9ff]" />
          </div>
          <h3 className="font-medium text-[#ffffff]">Tickets</h3>
          <span className="ml-3 bg-[#252a35] text-xs font-medium text-[#b8c5d6] px-2.5 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#252a35] text-[#b8c5d6] border border-[#2d3441] shadow-sm group-hover:bg-[#2d3441] group-hover:text-[#ffffff] transition-all duration-200">
          {totalCount} {totalCount === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2d3441]">
          <thead className="bg-[#1a1f29]">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#7a8394] uppercase tracking-wider group"
                >
                  <div className="flex items-center">
                    {header}
                    <ChevronUpDownIcon className="h-4 w-4 ml-1 text-[#7a8394] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3441]">
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr 
                  key={ticket.ticket_id} 
                  className="hover:bg-[#252a35] focus-within:bg-[#252a35] transition-colors duration-150 cursor-pointer"
                  tabIndex={0}
                  onClick={() => logger.debug(`Ticket seleccionado: ${ticket.ticket_id}`)}
                >
                  <td className="px-6 py-4 text-sm text-[#b8c5d6] font-medium">
                    <span className="text-[#00d9ff] group-hover:text-[#00d9ff] transition-colors duration-150 inline-flex items-center">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d9ff] mr-2 group-hover:bg-[#00d9ff] group-hover:animate-pulse"></span>
                      #{ticket.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#b8c5d6]">{ticket.cdata?.subject ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium bg-[#252a35] text-[#b8c5d6] rounded-lg border border-[#2d3441] shadow-sm transition-colors duration-200 hover:bg-[#2d3441] hover:text-[#ffffff]">
                      {ticket.cdata?.SectorName?.value ?? ticket.cdata?.sector ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#b8c5d6]">{ticket.user?.name ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#b8c5d6]">{ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.trim() : '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#7a8394]">
                      {ticket.created ? formatDate(ticket.created) : '-'}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-[#252a35] p-4">
                      <DocumentTextIcon className="h-12 w-12 text-[#7a8394]" />
                    </div>
                    <p className="text-[#7a8394] text-base">
                      No se encontraron tickets
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { DataTable };
