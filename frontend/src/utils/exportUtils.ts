import { saveAs } from 'file-saver';
import type { Ticket } from '../types';

/**
 * Secure export utility to replace the vulnerable xlsx library
 * Exports data as CSV which is more secure and lighter
 */

interface ExportOptions {
  filename?: string;
  includeFilters?: boolean;
  filters?: Record<string, any>;
}

/**
 * Convert tickets data to CSV format
 */
export const exportTicketsToCSV = (tickets: Ticket[], options: ExportOptions = {}) => {
  if (tickets.length === 0) {
    alert('No hay datos para exportar. Aplique filtros o espere a que se carguen los datos.');
    return;
  }

  const {
    filename = `tickets_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
    includeFilters = true,
    filters = {}
  } = options;

  // CSV Headers
  const headers = [
    'Nº Ticket',
    'Asunto',
    'Estado',
    'Usuario',
    'Agente',
    'Sector/Sucursal',
    'Transporte',
    'Fecha Creación'
  ];

  // Convert tickets to CSV rows
  const csvRows = tickets.map(ticket => [
    ticket.number,
    (ticket.cdata?.subject || '-').replace(/"/g, '""'), // Escape quotes
    (ticket.status?.name || '-').replace(/"/g, '""'),
    ticket.user ? `${ticket.user.name}`.replace(/"/g, '""') : '-',
    ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.replace(/"/g, '""') : '-',
    (ticket.cdata?.SectorName?.value || ticket.cdata?.sector || '-').replace(/"/g, '""'),
    ((ticket.cdata as any)?.TransporteName?.value || '-').replace(/"/g, '""'),
    ticket.created ? new Date(ticket.created).toLocaleDateString('es-ES') : '-'
  ]);

  // Build CSV content
  let csvContent = '';
  
  // Add metadata header if filters are included
  if (includeFilters) {
    csvContent += `# Reporte de Tickets - Exportado el ${new Date().toLocaleString('es-ES')}\n`;
    csvContent += `# Total de registros: ${tickets.length}\n`;
    
    if (Object.keys(filters).length > 0) {
      csvContent += '# Filtros aplicados:\n';
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          let filterName = key;
          switch (key) {
            case 'transporte': filterName = 'Transporte'; break;
            case 'staff': filterName = 'Agente'; break;
            case 'organization': filterName = 'Sector/Organización'; break;
            case 'statuses': filterName = 'Estados'; break;
            case 'startDate': filterName = 'Fecha desde'; break;
            case 'endDate': filterName = 'Fecha hasta'; break;
          }
          csvContent += `# ${filterName}: ${value}\n`;
        }
      });
    } else {
      csvContent += '# Filtros aplicados: Ninguno (todos los registros)\n';
    }
    csvContent += '\n';
  }

  // Add headers
  csvContent += headers.map(header => `"${header}"`).join(',') + '\n';

  // Add data rows
  csvRows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

/**
 * Alternative Excel-compatible export using HTML table format
 * This creates an .xls file that Excel can open, but is much more secure than xlsx
 */
export const exportTicketsToExcel = (tickets: Ticket[], options: ExportOptions = {}) => {
  if (tickets.length === 0) {
    alert('No hay datos para exportar. Aplique filtros o espere a que se carguen los datos.');
    return;
  }

  const {
    filename = `tickets_analytics_${new Date().toISOString().slice(0, 10)}.xls`,
    includeFilters = true,
    filters = {}
  } = options;

  // Create HTML table content
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Excel.Sheet">
    </head>
    <body>
      <table border="1">
  `;

  // Add metadata if filters are included
  if (includeFilters) {
    htmlContent += `
      <tr><td colspan="8"><strong>Reporte de Tickets - ${new Date().toLocaleString('es-ES')}</strong></td></tr>
      <tr><td colspan="8">Total de registros: ${tickets.length}</td></tr>
    `;

    if (Object.keys(filters).length > 0) {
      htmlContent += '<tr><td colspan="8"><strong>Filtros aplicados:</strong></td></tr>';
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          let filterName = key;
          switch (key) {
            case 'transporte': filterName = 'Transporte'; break;
            case 'staff': filterName = 'Agente'; break;
            case 'organization': filterName = 'Sector/Organización'; break;
            case 'statuses': filterName = 'Estados'; break;
            case 'startDate': filterName = 'Fecha desde'; break;
            case 'endDate': filterName = 'Fecha hasta'; break;
          }
          htmlContent += `<tr><td colspan="8">${filterName}: ${value}</td></tr>`;
        }
      });
    }
    htmlContent += '<tr><td colspan="8"></td></tr>';
  }

  // Add headers
  htmlContent += `
    <tr>
      <th>Nº Ticket</th>
      <th>Asunto</th>
      <th>Estado</th>
      <th>Usuario</th>
      <th>Agente</th>
      <th>Sector/Sucursal</th>
      <th>Transporte</th>
      <th>Fecha Creación</th>
    </tr>
  `;

  // Add data rows
  tickets.forEach(ticket => {
    htmlContent += `
      <tr>
        <td>${ticket.number}</td>
        <td>${ticket.cdata?.subject || '-'}</td>
        <td>${ticket.status?.name || '-'}</td>
        <td>${ticket.user ? ticket.user.name : '-'}</td>
        <td>${ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}` : '-'}</td>
        <td>${ticket.cdata?.SectorName?.value || ticket.cdata?.sector || '-'}</td>
        <td>${(ticket.cdata as any)?.TransporteName?.value || '-'}</td>
        <td>${ticket.created ? new Date(ticket.created).toLocaleDateString('es-ES') : '-'}</td>
      </tr>
    `;
  });

  htmlContent += `
      </table>
    </body>
    </html>
  `;

  // Create and download file
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  saveAs(blob, filename);
};