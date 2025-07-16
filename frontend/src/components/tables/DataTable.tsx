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
    'Transporte',
    'Usuario',
    'Agente',
    'Fecha Creación',
  ];

  return (
    <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 shadow-lg transition-all duration-200 hover:shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-slate-600 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-gray-100 dark:bg-slate-700 p-2 rounded-lg mr-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-500 dark:text-cyan-400" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">Tickets</h3>
          <span className="ml-3 bg-gray-100 dark:bg-slate-700 text-xs font-medium text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full">
            {tickets.length}
          </span>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 shadow-sm group-hover:bg-gray-200 dark:group-hover:bg-slate-600 group-hover:text-gray-900 dark:group-hover:text-white transition-all duration-200">
          {totalCount} {totalCount === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider group"
                >
                  <div className="flex items-center">
                    {header}
                    <ChevronUpDownIcon className="h-4 w-4 ml-1 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <tr 
                  key={ticket.ticket_id} 
                  className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus-within:bg-gray-50 dark:focus-within:bg-slate-700 transition-colors duration-150 cursor-pointer"
                  tabIndex={0}
                  onClick={() => logger.debug(`Ticket seleccionado: ${ticket.ticket_id}`)}
                >
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    <span className="text-blue-600 dark:text-cyan-400 group-hover:text-blue-700 dark:group-hover:text-cyan-300 transition-colors duration-150 inline-flex items-center">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 mr-2 group-hover:bg-blue-600 dark:group-hover:bg-cyan-300 group-hover:animate-pulse"></span>
                      #{ticket.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.cdata?.subject ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white">
                      {ticket.cdata?.dataValues?.sectorName ?? ticket.cdata?.SectorName?.value ?? `ID: ${ticket.cdata?.sector}` ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white">
                      {ticket.cdata?.dataValues?.transporteName ?? ticket.cdata?.TransporteName?.value ?? `ID: ${ticket.cdata?.transporte}` ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.user?.name ?? '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.trim() : '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {ticket.created ? formatDate(ticket.created) : '-'}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-gray-100 dark:bg-slate-700 p-4">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-base">
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
