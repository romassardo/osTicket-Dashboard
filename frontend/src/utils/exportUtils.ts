import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import type { Ticket } from '../types';

/**
 * Export utilities usando SheetJS para generar archivos Excel reales
 * Reemplaza la implementación anterior que generaba HTML
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
  const csvRows = tickets.map(ticket => {
    // Función helper para obtener transporte de forma robusta
    const getTransporteValue = (ticket: any): string => {
      // Intentar múltiples formas de acceder al transporte
      const transporteValue = 
        ticket.cdata?.dataValues?.transporteName ||  // Estructura optimizada
        ticket.cdata?.TransporteName?.value ||        // Estructura original
        ticket.cdata?.transporte ||                   // Campo directo
        null;
      
      return transporteValue ? String(transporteValue) : '-';
    };

    // Función helper para obtener sector de forma robusta
    const getSectorValue = (ticket: any): string => {
      const sectorValue = 
        ticket.cdata?.dataValues?.sectorName ||       // Estructura optimizada
        ticket.cdata?.SectorName?.value ||            // Estructura original
        ticket.cdata?.sector ||                       // Campo directo
        null;
      
      return sectorValue ? String(sectorValue) : '-';
    };

    return [
      ticket.number || '-',
      (ticket.cdata?.subject || '-').replace(/"/g, '""'), // Escape quotes
      (ticket.status?.name || '-').replace(/"/g, '""'),
      ticket.user ? `${ticket.user.name}`.replace(/"/g, '""') : '-',
      ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.replace(/"/g, '""') : '-',
      getSectorValue(ticket).replace(/"/g, '""'),
      getTransporteValue(ticket).replace(/"/g, '""'),
      ticket.created ? new Date(ticket.created).toLocaleDateString('es-ES') : '-'
    ];
  });

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
 * Exporta tickets a Excel usando SheetJS - genera archivos .xlsx reales
 * Reemplaza la implementación anterior que generaba HTML
 */
export const exportTicketsToExcel = (tickets: Ticket[], options: ExportOptions = {}) => {
  if (tickets.length === 0) {
    alert('No hay datos para exportar. Aplique filtros o espere a que se carguen los datos.');
    return;
  }

  const {
    filename = `tickets_analytics_${new Date().toISOString().slice(0, 10)}.xlsx`,
    includeFilters = true,
    filters = {}
  } = options;

  // Mostrar mensaje de confirmación con el número de registros
  const confirmMessage = `Se exportarán ${tickets.length} registros a Excel. ¿Continuar?`;
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    // Función helper para obtener transporte de forma robusta
    const getTransporteValue = (ticket: any): string => {
      const transporteValue = 
        ticket.cdata?.dataValues?.transporteName ||  // Estructura optimizada
        ticket.cdata?.TransporteName?.value ||        // Estructura original
        ticket.cdata?.transporte ||                   // Campo directo
        null;
      
      return transporteValue ? String(transporteValue) : '-';
    };

    // Función helper para obtener sector de forma robusta
    const getSectorValue = (ticket: any): string => {
      const sectorValue = 
        ticket.cdata?.dataValues?.sectorName ||       // Estructura optimizada
        ticket.cdata?.SectorName?.value ||            // Estructura original
        ticket.cdata?.sector ||                       // Campo directo
        null;
      
      return sectorValue ? String(sectorValue) : '-';
    };

    // Convertir tickets a array de objetos para SheetJS
    const ticketsData = tickets.map(ticket => ({
      'Nº Ticket': ticket.number || '-',
      'Asunto': ticket.cdata?.subject || '-',
      'Estado': ticket.status?.name || '-',
      'Usuario': ticket.user ? ticket.user.name : '-',
      'Agente': ticket.AssignedStaff ? `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}` : '-',
      'Sector/Sucursal': getSectorValue(ticket),
      'Transporte': getTransporteValue(ticket),
      'Fecha Creación': ticket.created ? new Date(ticket.created).toLocaleDateString('es-ES') : '-'
    }));

    // Crear worksheet principal con los datos según Context7
    const worksheet = XLSX.utils.json_to_sheet(ticketsData);

    // Crear workbook y añadir worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    // Si incluye filtros, crear una hoja adicional con metadatos
    if (includeFilters) {
      const metadataData = [
        ['Reporte de Tickets'],
        ['Fecha de exportación', new Date().toLocaleString('es-ES')],
        ['Total de registros', tickets.length.toString()],
        [''], // Línea vacía
        ['Filtros aplicados:']
      ];

      if (Object.keys(filters).length > 0) {
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
            metadataData.push([filterName, String(value)]);
          }
        });
      } else {
        metadataData.push(['Sin filtros', 'Todos los registros disponibles']);
      }

      // Crear worksheet de metadatos
      const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(workbook, metadataWorksheet, "Información");
    }

    // Calcular ancho de columnas automáticamente
    const colWidths = [
      { wch: 12 },  // Nº Ticket
      { wch: 50 },  // Asunto
      { wch: 12 },  // Estado
      { wch: 25 },  // Usuario
      { wch: 25 },  // Agente
      { wch: 20 },  // Sector/Sucursal
      { wch: 15 },  // Transporte
      { wch: 15 }   // Fecha Creación
    ];
    worksheet["!cols"] = colWidths;

    // Generar archivo Excel con compresión según Context7
    XLSX.writeFile(workbook, filename, { compression: true });

    // Mostrar mensaje de éxito
    setTimeout(() => {
      alert(`✅ Exportación Excel completada exitosamente.\n${tickets.length} registros exportados a ${filename}\n\nArchivo Excel real (.xlsx) generado correctamente.`);
    }, 500);

  } catch (error) {
    console.error('Error durante la exportación a Excel:', error);
    alert('❌ Error al generar el archivo Excel. Por favor, inténtelo de nuevo.');
  }
};