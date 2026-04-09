/**
 * exportUtils.ts — Generación de Excel con diseño corporativo usando ExcelJS
 * Todas las descargas del sistema pasan por este módulo.
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Ticket } from '../types';
import logger from './logger';

// ─── Paleta corporativa ───────────────────────────────────────────────────────
const C = {
  titleBg:    'FF0F172A', // Navy oscuro  — fondo título principal
  headerBg:   'FF1E3A5F', // Azul corporativo — fondo encabezados de columna
  accentBg:   'FFD4952C', // Dorado/ámbar — acento de la app
  white:      'FFFFFFFF',
  rowAlt:     'FFF8FAFC', // Gris muy suave — filas alternadas
  totalsBg:   'FFE2E8F0', // Gris medio — fila de totales
  greenBg:    'FFDCFCE7', // Verde claro — SLA cumplido
  greenText:  'FF166534',
  redBg:      'FFFEE2E2', // Rojo claro — SLA vencido
  redText:    'FF991B1B',
  yellowBg:   'FFFEF9C3', // Amarillo claro — en curso / pendiente
  yellowText: 'FF854D0E',
  border:     'FFE2E8F0',
} as const;

type ArgbColor = string;

// ─── Helper: aplicar estilo a una celda ──────────────────────────────────────
function styleCell(
  cell: ExcelJS.Cell,
  opts: {
    bold?: boolean;
    italic?: boolean;
    fontSize?: number;
    fontColor?: ArgbColor;
    bgColor?: ArgbColor;
    hAlign?: ExcelJS.Alignment['horizontal'];
    vAlign?: ExcelJS.Alignment['vertical'];
    wrapText?: boolean;
    border?: boolean;
    numFmt?: string;
  }
) {
  cell.font = {
    name: 'Calibri',
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    size: opts.fontSize ?? 11,
    color: opts.fontColor ? { argb: opts.fontColor } : undefined,
  };
  if (opts.bgColor) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: opts.bgColor },
    };
  }
  cell.alignment = {
    horizontal: opts.hAlign ?? 'left',
    vertical: opts.vAlign ?? 'middle',
    wrapText: opts.wrapText ?? false,
  };
  if (opts.border) {
    const side: ExcelJS.BorderStyle = 'thin';
    const color = { argb: C.border };
    cell.border = {
      top: { style: side, color },
      left: { style: side, color },
      bottom: { style: side, color },
      right: { style: side, color },
    };
  }
  if (opts.numFmt) cell.numFmt = opts.numFmt;
}

// ─── Helper: agregar fila de título principal (merged) ───────────────────────
function addTitleRow(
  ws: ExcelJS.Worksheet,
  text: string,
  colCount: number
): ExcelJS.Row {
  const row = ws.addRow([text]);
  row.height = 36;
  ws.mergeCells(row.number, 1, row.number, colCount);
  styleCell(row.getCell(1), {
    bold: true,
    fontSize: 16,
    fontColor: C.white,
    bgColor: C.titleBg,
    hAlign: 'center',
    vAlign: 'middle',
  });
  return row;
}

// ─── Helper: agregar fila de subtítulo (metadata) ────────────────────────────
function addSubtitleRow(
  ws: ExcelJS.Worksheet,
  text: string,
  colCount: number
): ExcelJS.Row {
  const row = ws.addRow([text]);
  row.height = 20;
  ws.mergeCells(row.number, 1, row.number, colCount);
  styleCell(row.getCell(1), {
    fontSize: 10,
    italic: true,
    fontColor: C.white,
    bgColor: C.headerBg,
    hAlign: 'center',
    vAlign: 'middle',
  });
  return row;
}

// ─── Helper: agregar fila de encabezados de columna ──────────────────────────
function addHeaderRow(
  ws: ExcelJS.Worksheet,
  headers: string[]
): ExcelJS.Row {
  const row = ws.addRow(headers);
  row.height = 22;
  row.eachCell((cell) => {
    styleCell(cell, {
      bold: true,
      fontSize: 11,
      fontColor: C.white,
      bgColor: C.headerBg,
      hAlign: 'center',
      vAlign: 'middle',
      border: true,
    });
  });
  return row;
}

// ─── Helpers de datos para tickets ───────────────────────────────────────────
const getTransporte = (t: any): string =>
  t.cdata?.dataValues?.transporteName ||
  t.cdata?.TransporteName?.value ||
  t.cdata?.transporte || '-';

const getSector = (t: any): string =>
  t.cdata?.dataValues?.sectorName ||
  t.cdata?.SectorName?.value ||
  t.cdata?.sector || '-';

const getSlaName = (t: any): string => t.sla?.name ?? '-';

const getSlaCumplido = (t: any): string => {
  if (!t.sla || t.sla.grace_period == null || !t.created) return '-';
  const grace = Number(t.sla.grace_period);
  const start = new Date(t.created);
  const end   = t.closed ? new Date(t.closed) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(grace)) return '-';
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  if (!t.closed) return hours > grace ? 'No' : 'Pendiente';
  return hours <= grace ? 'Sí' : 'No';
};

// ─── Export: Tickets (Analytics / Reportes) ──────────────────────────────────
export interface TicketExportOptions {
  filename?: string;
  sheetTitle?: string;
  periodo?: string;
  filters?: Record<string, any>;
}

export const exportTicketsToExcel = async (
  tickets: Ticket[],
  options: TicketExportOptions = {}
): Promise<void> => {
  if (tickets.length === 0) return;

  const {
    filename    = `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheetTitle  = 'Reporte de Tickets',
    periodo     = '',
    filters     = {},
  } = options;

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Dashboard Soporte IT';
  wb.created  = new Date();
  wb.modified = new Date();

  // ── Hoja principal ───────────────────────────────────────────────
  const ws = wb.addWorksheet('Tickets', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const COLS = 10;
  const headers = [
    'Nº Ticket', 'Asunto', 'Estado', 'Usuario', 'Agente',
    'Sector / Sucursal', 'Transporte', 'SLA', 'SLA Cumplido', 'Fecha Creación',
  ];

  ws.columns = [
    { width: 13 }, { width: 52 }, { width: 13 }, { width: 26 }, { width: 26 },
    { width: 22 }, { width: 16 }, { width: 16 }, { width: 15 }, { width: 16 },
  ];

  // Título + subtítulo
  addTitleRow(ws, `DASHBOARD SOPORTE IT — ${sheetTitle}`, COLS);
  const meta: string[] = [
    `Exportado: ${new Date().toLocaleString('es-AR')}`,
    `Total: ${tickets.length} registros`,
  ];
  if (periodo) meta.splice(1, 0, `Período: ${periodo}`);
  const activeFilters = Object.entries(filters).filter(([, v]) => v);
  if (activeFilters.length > 0) {
    const filterStr = activeFilters.map(([k, v]) => `${k}: ${v}`).join(' | ');
    meta.push(`Filtros: ${filterStr}`);
  }
  addSubtitleRow(ws, meta.join('   ·   '), COLS);

  // Fila vacía separadora
  ws.addRow([]).height = 6;

  // Encabezados
  addHeaderRow(ws, headers);

  // ── Datos ────────────────────────────────────────────────────────
  tickets.forEach((t, i) => {
    const slaCumplido = getSlaCumplido(t);
    const isAlt = i % 2 === 1;

    const row = ws.addRow([
      t.number || '-',
      t.cdata?.subject || '-',
      t.status?.name || '-',
      t.user?.name || '-',
      t.AssignedStaff
        ? `${t.AssignedStaff.firstname} ${t.AssignedStaff.lastname}`
        : '-',
      getSector(t),
      getTransporte(t),
      getSlaName(t),
      slaCumplido,
      t.created ? new Date(t.created).toLocaleDateString('es-AR') : '-',
    ]);

    row.height = 18;

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const isSlacol = colNum === 9; // columna SLA Cumplido
      let bgColor: ArgbColor = isAlt ? C.rowAlt : C.white;
      let textColor: ArgbColor | undefined;

      if (isSlacol) {
        if (slaCumplido === 'Sí')       { bgColor = C.greenBg;  textColor = C.greenText; }
        else if (slaCumplido === 'No')  { bgColor = C.redBg;    textColor = C.redText;   }
        else if (slaCumplido === 'Pendiente') { bgColor = C.yellowBg; textColor = C.yellowText; }
      }

      styleCell(cell, {
        bgColor,
        fontColor: textColor,
        bold: isSlacol && slaCumplido !== '-',
        hAlign: colNum === 1 || colNum >= 7 ? 'center' : 'left',
        border: true,
      });
    });
  });

  // ── Hoja de información ──────────────────────────────────────────
  const wsInfo = wb.addWorksheet('Información');
  wsInfo.columns = [{ width: 25 }, { width: 50 }];
  addTitleRow(wsInfo, 'INFORMACIÓN DEL REPORTE', 2);
  wsInfo.addRow([]);
  [
    ['Generado por', 'Dashboard Soporte IT'],
    ['Fecha de exportación', new Date().toLocaleString('es-AR')],
    ['Total de registros', tickets.length.toString()],
    ...(periodo ? [['Período', periodo]] : []),
    ...activeFilters.map(([k, v]) => [k, String(v)]),
  ].forEach(([label, value]) => {
    const row = wsInfo.addRow([label, value]);
    styleCell(row.getCell(1), { bold: true, bgColor: C.rowAlt, border: true });
    styleCell(row.getCell(2), { border: true });
    row.height = 18;
  });

  // ── Generar archivo ──────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename
  );
  logger.info(`Excel exportado: ${tickets.length} registros → ${filename}`);
};

// ─── Export: Análisis SLA por agente ─────────────────────────────────────────
export interface SlaStatRow {
  agente: string;
  total_tickets: number;
  tickets_sla_cumplido: number;
  tickets_sla_vencido: number;
  porcentaje_sla_cumplido: number;
  diferencia_sla_promedio: string;
  tiempo_promedio_resolucion: string;
  [key: string]: any;
}

export interface SlaExportOptions {
  filename?: string;
  periodo?: string;
}

export const exportSlaStatsToExcel = async (
  stats: SlaStatRow[],
  options: SlaExportOptions = {}
): Promise<void> => {
  if (stats.length === 0) return;

  const {
    filename = `sla_analisis_${new Date().toISOString().slice(0, 10)}.xlsx`,
    periodo  = '',
  } = options;

  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Dashboard Soporte IT';
  wb.created  = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet('Análisis SLA', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const headers = [
    'Agente', 'Total Tickets', 'Cumplidos', 'Vencidos',
    '% Cumplimiento', 'Diferencia SLA (prom)', 'T. Prom. Resolución',
  ];
  const COLS = headers.length;

  ws.columns = [
    { width: 30 }, { width: 16 }, { width: 14 }, { width: 14 },
    { width: 18 }, { width: 24 }, { width: 24 },
  ];

  // Título + subtítulo
  addTitleRow(ws, 'DASHBOARD SOPORTE IT — Análisis SLA por Agente', COLS);
  const meta = [
    `Exportado: ${new Date().toLocaleString('es-AR')}`,
    `Total agentes: ${stats.length}`,
  ];
  if (periodo) meta.splice(1, 0, `Período: ${periodo}`);
  addSubtitleRow(ws, meta.join('   ·   '), COLS);

  ws.addRow([]).height = 6;
  addHeaderRow(ws, headers);

  // ── Datos ────────────────────────────────────────────────────────
  stats.forEach((s, i) => {
    const pct = Number(s.porcentaje_sla_cumplido) || 0;
    const isAlt = i % 2 === 1;

    const row = ws.addRow([
      s.agente || '-',
      s.total_tickets,
      s.tickets_sla_cumplido,
      s.tickets_sla_vencido,
      pct / 100,
      s.diferencia_sla_promedio || '-',
      s.tiempo_promedio_resolucion || '-',
    ]);
    row.height = 18;

    // Colorear % cumplimiento
    let pctBg: ArgbColor = C.redBg, pctText: ArgbColor = C.redText;
    if (pct >= 80)      { pctBg = C.greenBg;  pctText = C.greenText;  }
    else if (pct >= 50) { pctBg = C.yellowBg; pctText = C.yellowText; }

    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const isPct = col === 5;
      styleCell(cell, {
        bgColor: isPct ? pctBg : (isAlt ? C.rowAlt : C.white),
        fontColor: isPct ? pctText : undefined,
        bold: isPct,
        hAlign: col === 1 ? 'left' : 'center',
        border: true,
        numFmt: isPct ? '0.0%' : undefined,
      });
    });
  });

  // Fila de totales
  const totalTickets    = stats.reduce((s, r) => s + r.total_tickets, 0);
  const totalCumplidos  = stats.reduce((s, r) => s + r.tickets_sla_cumplido, 0);
  const totalVencidos   = stats.reduce((s, r) => s + r.tickets_sla_vencido, 0);
  const pctTotal        = totalTickets > 0 ? totalCumplidos / totalTickets : 0;

  const totRow = ws.addRow(['TOTALES', totalTickets, totalCumplidos, totalVencidos, pctTotal, '', '']);
  totRow.height = 22;
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    styleCell(cell, {
      bold: true,
      bgColor: C.totalsBg,
      hAlign: col === 1 ? 'left' : 'center',
      border: true,
      numFmt: col === 5 ? '0.0%' : undefined,
    });
  });

  // ── Generar archivo ──────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename
  );
  logger.info(`SLA Excel exportado: ${stats.length} agentes → ${filename}`);
};
