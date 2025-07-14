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

  // Mostrar mensaje de confirmación con el número de registros
  const confirmMessage = `Se exportarán ${tickets.length} registros a CSV. ¿Continuar?`;
  if (!confirm(confirmMessage)) {
    return;
  }

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
    csvContent += `# Total de registros exportados: ${tickets.length}\n`;
    
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
      csvContent += '# Filtros aplicados: Ninguno (todos los registros disponibles)\n';
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

  // Mostrar mensaje de éxito
  setTimeout(() => {
    alert(`✅ Exportación CSV completada exitosamente.\n${tickets.length} registros exportados a ${filename}`);
  }, 500);
};

/**
 * Alternative Excel-compatible export using HTML table format
 * This creates an .html file that Excel can open without security warnings
 */
export const exportTicketsToExcel = (tickets: Ticket[], options: ExportOptions = {}) => {
  if (tickets.length === 0) {
    alert('No hay datos para exportar. Aplique filtros o espere a que se carguen los datos.');
    return;
  }

  const {
    filename = `tickets_analytics_${new Date().toISOString().slice(0, 10)}.html`,
    includeFilters = true,
    filters = {}
  } = options;

  // Mostrar mensaje de confirmación con el número de registros
  const confirmMessage = `Se exportarán ${tickets.length} registros a Excel. ¿Continuar?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  // Create HTML table content with better Excel compatibility
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Excel.Sheet">
      <meta name="Generator" content="Dashboard OsTicket">
      <title>Reporte de Tickets</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .metadata { background-color: #f9f9f9; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; }
        .metadata h3 { margin-top: 0; color: #333; }
      </style>
    </head>
    <body>
  `;

  // Add metadata if filters are included
  if (includeFilters) {
    htmlContent += `
      <div class="metadata">
        <h3>📊 Reporte de Tickets - ${new Date().toLocaleString('es-ES')}</h3>
        <p><strong>Total de registros exportados:</strong> ${tickets.length}</p>
    `;

    if (Object.keys(filters).length > 0) {
      htmlContent += '<p><strong>Filtros aplicados:</strong></p><ul>';
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          let filterName = key;
          switch (key) {
            case 'transporte': filterName = '🚚 Transporte'; break;
            case 'staff': filterName = '👤 Agente'; break;
            case 'organization': filterName = '🏢 Sector/Organización'; break;
            case 'statuses': filterName = '📋 Estados'; break;
            case 'startDate': filterName = '📅 Fecha desde'; break;
            case 'endDate': filterName = '📅 Fecha hasta'; break;
          }
          htmlContent += `<li>${filterName}: ${value}</li>`;
        }
      });
      htmlContent += '</ul>';
    } else {
      htmlContent += '<p><strong>Filtros aplicados:</strong> Ninguno (todos los registros disponibles)</p>';
    }
    htmlContent += '</div>';
  }

  // Add table with headers
  htmlContent += `
    <table>
      <thead>
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
      </thead>
      <tbody>
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
      </tbody>
    </table>
    </body>
    </html>
  `;

  // Create and download file with proper MIME type
  const blob = new Blob([htmlContent], { 
    type: 'text/html;charset=utf-8' 
  });
  saveAs(blob, filename);

  // Mostrar mensaje de éxito
  setTimeout(() => {
    alert(`✅ Exportación Excel completada exitosamente.\n${tickets.length} registros exportados a ${filename}\n\nNota: El archivo se abrirá como HTML en Excel sin advertencias de seguridad.`);
  }, 500);
};