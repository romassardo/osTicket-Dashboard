import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, Clock, RefreshCw, CheckCircle, XCircle, ArrowUpDown, Info, Filter } from 'lucide-react';
import { getSLAStats } from '../services/api';
import logger from '../utils/logger';

interface SLAStat {
  agente: string;
  staff_id: number;
  total_tickets: number;
  tickets_sla_cumplido: number;
  tickets_sla_vencido: number;
  porcentaje_sla_cumplido: number;
  tiempo_promedio_primera_respuesta: string;
  tiempo_promedio_resolucion: string;
  diferencia_sla_promedio: string;
  diferencia_sla_horas: number;
}

// Tooltip component
const Tooltip = ({ text, children, position = 'above' }: { text: string; children: React.ReactNode; position?: 'above' | 'below' }) => {
  const [show, setShow] = useState(false);

  const posClass = position === 'below'
    ? 'top-full mt-2'
    : 'bottom-full mb-2';
  const arrowClass = position === 'below'
    ? 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700'
    : 'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700';

  return (
    <div className="relative inline-flex items-center gap-1">
      {children}
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(prev => !prev)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        type="button"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className={`fixed z-[9999] px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-normal leading-relaxed pointer-events-none`}
          style={{ maxWidth: 260, width: 'max-content', transform: 'translateX(-50%)' }}
          ref={(el) => {
            if (!el) return;
            const btn = el.parentElement?.querySelector('button');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            if (position === 'below') {
              el.style.top = `${rect.bottom + 8}px`;
              el.style.left = `${rect.left + rect.width / 2}px`;
            } else {
              el.style.top = `${rect.top - el.offsetHeight - 8}px`;
              el.style.left = `${rect.left + rect.width / 2}px`;
            }
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

const SLAStatsView: React.FC = () => {
  const [stats, setStats] = useState<SLAStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  
  const [sortBy, setSortBy] = useState<keyof SLAStat>('porcentaje_sla_cumplido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Table filters
  const [filterAgente, setFilterAgente] = useState('');

  const fetchStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const params: any = { year: selectedYear };
      if (selectedMonth !== '') params.month = selectedMonth;

      const data = await getSLAStats(params);
      const normalized = (data || []).map((stat: any) => ({
        ...stat,
        porcentaje_sla_cumplido: Number(stat.porcentaje_sla_cumplido) || 0,
        total_tickets: Number(stat.total_tickets) || 0,
        tickets_sla_cumplido: Number(stat.tickets_sla_cumplido) || 0,
        tickets_sla_vencido: Number(stat.tickets_sla_vencido) || 0,
        diferencia_sla_horas: Number(stat.diferencia_sla_horas) || 0
      }));

      setStats(normalized);
      logger.info(`SLA Stats cargadas: ${normalized.length} agentes`);
    } catch (error) {
      logger.error('Error al cargar estadísticas SLA:', error);
      setStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, [selectedYear, selectedMonth]);

  const handleSort = (column: keyof SLAStat) => {
    if (sortBy === column) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('desc'); }
  };

  // Filter out agents with empty/trimmed names (extra safety on frontend)
  const validStats = useMemo(() => {
    return stats.filter(s => s.agente && s.agente.trim().length > 0);
  }, [stats]);

  const filteredAndSorted = useMemo(() => {
    let data = [...validStats];

    // Apply table filters
    if (filterAgente) {
      const q = filterAgente.toLowerCase();
      data = data.filter(s => s.agente.toLowerCase().includes(q));
    }
    // Sort
    data.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number')
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return data;
  }, [validStats, sortBy, sortOrder, filterAgente]);

  const totalTickets = validStats.reduce((s, a) => s + a.total_tickets, 0);
  const totalCumplidos = validStats.reduce((s, a) => s + a.tickets_sla_cumplido, 0);
  const totalVencidos = validStats.reduce((s, a) => s + a.tickets_sla_vencido, 0);
  const pctCumplimiento = totalTickets > 0 ? (totalCumplidos / totalTickets) * 100 : 0;

  const exportToExcel = () => {
    try {
      const headers = ['Agente', 'Total Tickets', 'Cumplidos', 'Vencidos', '% Cumplimiento', 'Diferencia SLA', 'T. Prom. Resolución'];
      const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const headerRow = `<tr>${headers.map(h => `<th style="background:#f3f4f6;font-weight:bold;">${esc(h)}</th>`).join('')}</tr>`;
      const bodyRows = filteredAndSorted.map((s: SLAStat) =>
        `<tr><td>${esc(s.agente)}</td><td>${s.total_tickets}</td><td>${s.tickets_sla_cumplido}</td><td>${s.tickets_sla_vencido}</td><td>${s.porcentaje_sla_cumplido.toFixed(1)}%</td><td>${esc(s.diferencia_sla_promedio)}</td><td>${esc(s.tiempo_promedio_resolucion)}</td></tr>`
      ).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><table border="1">${headerRow}${bodyRows}</table></body></html>`;
      const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sla_analisis_${new Date().toISOString().split('T')[0]}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error al exportar:', error);
    }
  };

  const SortHeader = ({ column, children, tooltip }: { column: keyof SLAStat; children: React.ReactNode; tooltip: string }) => (
    <th
      onClick={() => handleSort(column)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
    >
      <Tooltip text={tooltip} position="below">
        <span className="inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleSort(column); }}>
          {children}
          {sortBy === column ? (
            sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </span>
      </Tooltip>
    </th>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasActiveFilters = !!filterAgente;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6">
      {/* Header + Filtros en una barra */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Análisis SLA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Rendimiento por agente en tickets cerrados (horas hábiles Lun-Vie 8:30-17:30)
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleDateString('es-AR', { month: 'long' })}
                </option>
              ))}
            </select>
            <button
              onClick={exportToExcel}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5 text-gray-700 dark:text-gray-200"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total tickets cerrados */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <Tooltip text="Cantidad total de tickets cerrados en el departamento Soporte IT para el período seleccionado. Solo incluye tickets con agente asignado.">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tickets Cerrados</span>
            </Tooltip>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalTickets}</div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> {totalCumplidos} en tiempo</span>
            <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> {totalVencidos} vencidos</span>
          </div>
        </div>

        {/* % Cumplimiento con barra meta */}
        {(() => {
          const isGood = pctCumplimiento >= 90;
          const isWarn = pctCumplimiento >= 70 && pctCumplimiento < 90;
          const accentColor = isGood ? 'green' : isWarn ? 'yellow' : 'red';
          const label = isGood ? 'Excelente' : isWarn ? 'Atención' : 'Crítico';
          return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border-l-4 border-${accentColor}-500`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 bg-${accentColor}-100 dark:bg-${accentColor}-900/40 rounded-lg`}>
                  {isGood ? <TrendingUp className={`w-5 h-5 text-${accentColor}-600`} /> : <TrendingDown className={`w-5 h-5 text-${accentColor}-600`} />}
                </div>
                <Tooltip text="Porcentaje de tickets resueltos dentro del tiempo definido por su SLA. Se calcula en horas hábiles (Lun-Vie 8:30-17:30, excluyendo feriados). Fórmula: (tickets cumplidos / total tickets) x 100.">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumplimiento SLA</span>
                </Tooltip>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold text-${accentColor}-600`}>{pctCumplimiento.toFixed(1)}%</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${accentColor}-100 text-${accentColor}-700 dark:bg-${accentColor}-900/40 dark:text-${accentColor}-300`}>
                  {label}
                </span>
              </div>
              <div className="relative mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div className={`h-2 rounded-full bg-${accentColor}-500 transition-all`}
                  style={{ width: `${Math.min(pctCumplimiento, 100)}%` }} />
                <div className="absolute top-0 h-2 w-0.5 bg-gray-800 dark:bg-white opacity-60" style={{ left: '90%' }} title="Meta 90%" />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Meta organizacional: 90%</p>
            </div>
          );
        })()}

        {/* Agentes con tickets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <Tooltip text="Cantidad de agentes de Soporte IT que cerraron al menos un ticket en el período seleccionado. Se excluyen tickets sin agente asignado.">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Agentes con Tickets</span>
            </Tooltip>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{validStats.length}</div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {validStats.filter(s => s.porcentaje_sla_cumplido >= 90).length} sobre meta
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {validStats.filter(s => s.porcentaje_sla_cumplido < 70).length} bajo 70%
            </span>
          </div>
        </div>
      </div>

      {/* Tabla principal de agentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filterAgente}
            onChange={(e) => setFilterAgente(e.target.value)}
            placeholder="Buscar agente..."
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {hasActiveFilters && (
            <button
              onClick={() => setFilterAgente('')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
            >
              Limpiar filtro
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {filteredAndSorted.length}{filteredAndSorted.length !== validStats.length ? ` de ${validStats.length}` : ''} agente(s)
          </span>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Sin datos para el período o filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <SortHeader column="agente" tooltip="Nombre del agente de Soporte IT que cerró los tickets. Se obtiene de la tabla ost_staff.">Agente</SortHeader>
                  <SortHeader column="total_tickets" tooltip="Cantidad total de tickets cerrados por este agente en el período. Se filtra por fecha de cierre (t.closed).">Tickets</SortHeader>
                  <SortHeader column="porcentaje_sla_cumplido" tooltip="Porcentaje de tickets resueltos dentro del plazo SLA asignado. Se calcula comparando las horas hábiles de resolución contra el grace_period del SLA del ticket.">Cumplimiento</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Desglose: tickets cumplidos (verde) y vencidos (rojo). Un ticket se considera cumplido si sus horas hábiles de resolución son menores o iguales al grace_period del SLA." position="below">
                      <span>Detalle</span>
                    </Tooltip>
                  </th>
                  <SortHeader column="diferencia_sla_horas" tooltip="Diferencia promedio entre el tiempo SLA permitido y el tiempo real de resolución. Positivo = resolvió antes del límite. Negativo = se excedió del SLA.">Dif. SLA</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Tiempo promedio que tarda el agente en resolver un ticket, medido en horas hábiles (Lun-Vie 8:30-17:30, sin feriados). Se calcula desde la creación hasta el cierre del ticket." position="below">
                      <span>T. Resolución</span>
                    </Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredAndSorted.map((stat) => {
                  const pct = stat.porcentaje_sla_cumplido;
                  const barColor = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500';
                  const textColor = pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-600';
                  const diffColor = stat.diferencia_sla_horas >= 0 ? 'text-green-600' : 'text-red-600';

                  return (
                    <tr key={stat.staff_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.agente}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {stat.total_tickets}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[120px]">
                            <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <div className={`h-2 rounded-full ${barColor} transition-all`}
                                style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${textColor} min-w-[50px]`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 dark:text-green-400 font-medium">{stat.tickets_sla_cumplido}</span>
                          <span className="text-gray-300 dark:text-gray-600">/</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">{stat.tickets_sla_vencido}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-medium ${diffColor}`}>
                          {stat.diferencia_sla_promedio}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                        {stat.tiempo_promedio_resolucion}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        {filteredAndSorted.length} agente(s) &middot; Solo tickets cerrados con agente asignado &middot; {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
};

export default SLAStatsView;
