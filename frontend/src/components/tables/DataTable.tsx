import React from 'react';
import type { Ticket } from '../../types';
import { formatDate } from '../../utils/formatters';
import { DocumentTextIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import logger from '../../utils/logger';

interface DataTableProps {
  tickets: Ticket[];
  totalCount?: number;
  onTicketClick?: (ticketId: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ tickets, totalCount = 0, onTicketClick }) => {
  const tableHeaders = [
    'Número',
    'Asunto',
    'Estado SLA',
    'Agente',
    'Usuario',
    'Sector',
    'Tipo Solicitud',
    'Creación',
  ];

  const getSLAStatus = (ticket: Ticket): { label: string; style: React.CSSProperties } => {
    const sla = ticket.sla;

    if (!sla || !sla.grace_period) {
      return {
        label: 'Sin SLA',
        style: { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
      };
    }

    if (!ticket.closed || ticket.closed === '0000-00-00 00:00:00') {
      return {
        label: 'En curso',
        style: { background: 'color-mix(in srgb, var(--info) 15%, transparent)', color: 'var(--info)' },
      };
    }

    const createdDate = ticket.created ? new Date(ticket.created) : null;
    const closedDate = new Date(ticket.closed);

    if (!createdDate || isNaN(createdDate.getTime()) || isNaN(closedDate.getTime())) {
      return {
        label: 'Sin datos',
        style: { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
      };
    }

    const diffHours = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

    if (diffHours <= sla.grace_period) {
      return {
        label: 'Cumplido',
        style: { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' },
      };
    }

    return {
      label: 'No cumplido',
      style: { background: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' },
    };
  };

  return (
    <div className="overflow-hidden transition-all duration-200" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex justify-between items-center" style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center">
          <div style={{ background: 'var(--accent-primary-glow)', padding: '0.5rem', borderRadius: 'var(--radius-md)', marginRight: '0.75rem' }}>
            <DocumentTextIcon className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 className="font-display" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>Tickets</h3>
          <span style={{ marginLeft: '0.75rem', background: 'var(--bg-tertiary)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.15rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
            {tickets.length}
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          {totalCount} {totalCount === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="group"
                  style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center">
                    {header}
                    <ChevronUpDownIcon className="h-3.5 w-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket, idx) => {
                const slaStatus = getSLAStatus(ticket);
                const isUnassigned = !ticket.AssignedStaff;
                return (
                  <tr 
                    key={ticket.ticket_id} 
                    className="transition-colors duration-150 cursor-pointer"
                    style={{ 
                      background: isUnassigned ? 'color-mix(in srgb, var(--warning) 8%, var(--bg-secondary))' : 'var(--bg-secondary)',
                      borderBottom: idx < tickets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isUnassigned ? 'color-mix(in srgb, var(--warning) 12%, var(--bg-secondary))' : 'var(--bg-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isUnassigned ? 'color-mix(in srgb, var(--warning) 8%, var(--bg-secondary))' : 'var(--bg-secondary)'; }}
                    tabIndex={0}
                    onClick={() => {
                      logger.debug(`Ticket seleccionado: ${ticket.ticket_id}`);
                      onTicketClick?.(ticket.ticket_id);
                    }}
                  >
                    <td style={{ padding: '0.65rem 1rem', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <span className="inline-flex items-center" style={{ color: 'var(--accent-primary)' }}>
                        <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-primary)', marginRight: 6 }}></span>
                        #{ticket.number}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', maxWidth: 250 }}>
                      <div className="truncate" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }} title={ticket.cdata?.subject ?? '-'}>
                        {ticket.cdata?.subject ?? '-'}
                      </div>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ ...slaStatus.style, padding: '0.15rem 0.5rem', fontSize: '0.6875rem', fontWeight: 600, borderRadius: 'var(--radius-sm)' }}>
                        {slaStatus.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.trim() : '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ticket.user?.name ?? '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ticket.cdata?.dataValues?.sectorName
                        ?? ticket.cdata?.SectorName?.value
                        ?? (ticket.cdata?.sector ? `ID: ${ticket.cdata.sector}` : '-')}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ticket.requestType || '-'}
                    </td>
                    <td style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ticket.created ? formatDate(ticket.created) : '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="text-center" style={{ padding: '3rem 1.5rem' }}>
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div style={{ borderRadius: '50%', background: 'var(--bg-tertiary)', padding: '1rem' }}>
                      <DocumentTextIcon className="h-10 w-10" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
