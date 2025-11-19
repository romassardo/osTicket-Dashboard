import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Download, Calendar, Users, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { getSLAStats } from '../services/api';
import logger from '../utils/logger';

interface SLAStat {
  departamento: string;
  agente: string;
  staff_id: number;
  nombre_sla: string;
  anio: number;
  mes: number;
  mes_nombre: string;
  total_tickets: number;
  tickets_sla_cumplido: number;
  tickets_sla_vencido: number;
  porcentaje_sla_cumplido: number;
  tiempo_promedio_primera_respuesta: string;
  tiempo_promedio_resolucion: string;
  diferencia_sla_promedio: string;
  diferencia_sla_horas: number;
}

const SLAStatsView: React.FC = () => {
  const [stats, setStats] = useState<SLAStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<keyof SLAStat>('porcentaje_sla_cumplido');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params: any = {
        year: selectedYear
      };
      if (selectedMonth !== '') {
        params.month = selectedMonth;
      }

      const data = await getSLAStats(params);
      // Normalizar porcentaje_sla_cumplido a número
      const normalizedData = (data || []).map(stat => ({
        ...stat,
        porcentaje_sla_cumplido: Number(stat.porcentaje_sla_cumplido) || 0,
        total_tickets: Number(stat.total_tickets) || 0,
        tickets_sla_cumplido: Number(stat.tickets_sla_cumplido) || 0,
        tickets_sla_vencido: Number(stat.tickets_sla_vencido) || 0,
        diferencia_sla_horas: Number(stat.diferencia_sla_horas) || 0
      }));

      // Consolidar por agente (puede haber múltiples registros por mes/año/SLA)
      const agentMap = new Map<number, SLAStat>();
      normalizedData.forEach(stat => {
        const existing = agentMap.get(stat.staff_id);
        if (existing) {
          // Consolidar datos
          existing.total_tickets += stat.total_tickets;
          existing.tickets_sla_cumplido += stat.tickets_sla_cumplido;
          existing.tickets_sla_vencido += stat.tickets_sla_vencido;
          // Recalcular porcentaje
          existing.porcentaje_sla_cumplido = existing.total_tickets > 0
            ? (existing.tickets_sla_cumplido / existing.total_tickets) * 100
            : 0;
          // Promedio ponderado de diferencia SLA
          const totalRecords = (existing as any)._recordCount || 1;
          existing.diferencia_sla_horas = 
            (existing.diferencia_sla_horas * totalRecords + stat.diferencia_sla_horas) / (totalRecords + 1);
          (existing as any)._recordCount = totalRecords + 1;
        } else {
          agentMap.set(stat.staff_id, { ...stat, _recordCount: 1 } as any);
        }
      });

      // Regenerar el texto de diferencia promedio y convertir map a array
      const consolidatedStats = Array.from(agentMap.values()).map(stat => {
        const horasAbs = Math.abs(stat.diferencia_sla_horas);
        let diferenciaTexto = '';
        if (stat.diferencia_sla_horas >= 0) {
          diferenciaTexto = `Cumplió ${horasAbs.toFixed(1)}h antes`;
        } else {
          diferenciaTexto = `Se pasó ${horasAbs.toFixed(1)}h`;
        }
        return {
          ...stat,
          // Luego de consolidar por agente, las métricas son sobre todos los SLA
          nombre_sla: 'Todos los SLA',
          diferencia_sla_promedio: diferenciaTexto
        };
      });

      setStats(consolidatedStats);
      logger.info(`📊 Estadísticas SLA cargadas: ${consolidatedStats.length} agentes únicos (de ${normalizedData.length} registros)`);
    } catch (error) {
      logger.error('Error al cargar estadísticas SLA:', error);
      setStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear, selectedMonth]);

  const handleRefresh = () => {
    fetchStats(true);
  };

  const handleSort = (column: keyof SLAStat) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedStats = useMemo(() => {
    const data = [...stats];

    data.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
  
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });

    return data;
  }, [stats, sortBy, sortOrder]);

  // Calcular resumen general
  const totalTickets = stats.reduce((sum, s) => sum + s.total_tickets, 0);
  const totalCumplidos = stats.reduce((sum, s) => sum + s.tickets_sla_cumplido, 0);
  const totalVencidos = stats.reduce((sum, s) => sum + s.tickets_sla_vencido, 0);
  const promedioGeneral = totalTickets > 0 ? ((totalCumplidos / totalTickets) * 100).toFixed(1) : '0.0';
  const porcentajeNoCumplido = totalTickets > 0 ? ((totalVencidos / totalTickets) * 100).toFixed(1) : '0.0';

  const exportToExcel = () => {
    logger.info('🔽 Exportando estadísticas SLA a Excel (XLS)...');

    try {
      // Encabezados del archivo
      const headers = [
        'Agente',
        'SLA',
        'Año',
        'Mes',
        'Total Tickets',
        'Cumplidos',
        'Vencidos',
        '% Cumplimiento',
        'Diferencia SLA',
        'T. Promedio Resolución'
      ];

      const escapeHtml = (value: any) => {
        const str = value !== null && value !== undefined ? String(value) : '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      const headerRow = `<tr>${headers
        .map((h) => `<th style="background:#f3f4f6;font-weight:bold;">${escapeHtml(h)}</th>`)
        .join('')}</tr>`;

      const bodyRows = sortedStats
        .map((stat) =>
          `<tr>` +
          `<td>${escapeHtml(stat.agente)}</td>` +
          `<td>${escapeHtml(stat.nombre_sla)}</td>` +
          `<td>${escapeHtml(stat.anio)}</td>` +
          `<td>${escapeHtml(stat.mes_nombre)}</td>` +
          `<td>${escapeHtml(stat.total_tickets)}</td>` +
          `<td>${escapeHtml(stat.tickets_sla_cumplido)}</td>` +
          `<td>${escapeHtml(stat.tickets_sla_vencido)}</td>` +
          `<td>${escapeHtml(stat.porcentaje_sla_cumplido.toFixed(1))}%</td>` +
          `<td>${escapeHtml(stat.diferencia_sla_promedio)}</td>` +
          `<td>${escapeHtml(stat.tiempo_promedio_resolucion)}</td>` +
          `</tr>`
        )
        .join('');

      const tableHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table border="1">${headerRow}${bodyRows}</table></body></html>`;

      const blob = new Blob(['\ufeff' + tableHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fecha = new Date().toISOString().split('T')[0];

      link.href = url;
      link.setAttribute('download', `sla_analisis_historico_${fecha}.xls`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('❌ Error al exportar estadísticas SLA a XLS:', error);
      alert('Ocurrió un error al exportar el archivo.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Análisis Histórico SLA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Estadísticas de cumplimiento SLA por agente, periodo y tendencias de rendimiento
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 hover:bg-green-700
                     text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                     text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mes (opcional)
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleDateString('es-AR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</h3>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {totalTickets}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {stats.length} agentes activos
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">% Cumplimiento</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">
            {promedioGeneral}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {totalCumplidos} de {totalTickets} cumplidos
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">% No Cumplido</h3>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {porcentajeNoCumplido}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {totalVencidos} tickets fuera de tiempo
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidos</h3>
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {totalVencidos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {totalTickets > 0 ? ((totalVencidos / totalTickets) * 100).toFixed(1) : '0.0'}% del total
          </p>
        </div>
      </div>

      {/* Gráficos de Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top 5 Agentes por Cumplimiento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top 5 Agentes - Mayor Cumplimiento
          </h3>
          <div className="space-y-4">
            {[...sortedStats]
              .sort((a, b) => b.porcentaje_sla_cumplido - a.porcentaje_sla_cumplido)
              .slice(0, 5)
              .map((stat, idx) => (
                <div key={`top-${stat.staff_id}-${idx}`} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                      {idx + 1}. {stat.agente}
                    </span>
                    <span className={`font-bold ${
                      stat.porcentaje_sla_cumplido >= 90 ? 'text-green-600' :
                      stat.porcentaje_sla_cumplido >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stat.porcentaje_sla_cumplido.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full transition-all ${
                        stat.porcentaje_sla_cumplido >= 90 ? 'bg-green-500' :
                        stat.porcentaje_sla_cumplido >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stat.porcentaje_sla_cumplido, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{stat.total_tickets} tickets</span>
                    <span>{stat.tickets_sla_cumplido} cumplidos</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Distribución de Cumplimiento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Distribución de Agentes por Cumplimiento
          </h3>
          <div className="space-y-4">
            {(() => {
              const excelente = sortedStats.filter(s => s.porcentaje_sla_cumplido >= 90).length;
              const bueno = sortedStats.filter(s => s.porcentaje_sla_cumplido >= 80 && s.porcentaje_sla_cumplido < 90).length;
              const regular = sortedStats.filter(s => s.porcentaje_sla_cumplido >= 70 && s.porcentaje_sla_cumplido < 80).length;
              const bajo = sortedStats.filter(s => s.porcentaje_sla_cumplido < 70).length;
              const total = sortedStats.length || 1;

              return (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Excelente (≥90%)</span>
                      <span className="text-sm font-bold text-green-600">{excelente} agentes</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-green-500 rounded-full" style={{ width: `${(excelente / total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bueno (80-89%)</span>
                      <span className="text-sm font-bold text-yellow-600">{bueno} agentes</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-yellow-500 rounded-full" style={{ width: `${(bueno / total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Regular (70-79%)</span>
                      <span className="text-sm font-bold text-orange-600">{regular} agentes</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-orange-500 rounded-full" style={{ width: `${(regular / total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bajo (&lt;70%)</span>
                      <span className="text-sm font-bold text-red-600">{bajo} agentes</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-red-500 rounded-full" style={{ width: `${(bajo / total) * 100}%` }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tabla de Estadísticas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Detalle por Agente
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Click en las columnas para ordenar
          </p>
        </div>

        {sortedStats.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No hay datos disponibles para el período seleccionado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th 
                    onClick={() => handleSort('agente')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Agente {sortBy === 'agente' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('nombre_sla')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    SLA {sortBy === 'nombre_sla' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('total_tickets')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Total {sortBy === 'total_tickets' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('tickets_sla_cumplido')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cumplidos {sortBy === 'tickets_sla_cumplido' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('tickets_sla_vencido')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Vencidos {sortBy === 'tickets_sla_vencido' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('porcentaje_sla_cumplido')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    % Cumplimiento {sortBy === 'porcentaje_sla_cumplido' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('diferencia_sla_horas')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Diferencia SLA {sortBy === 'diferencia_sla_horas' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    T. Promedio Resolución
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedStats.map((stat, index) => {
                  const cumplimientoColor = 
                    stat.porcentaje_sla_cumplido >= 90 ? 'text-green-600 font-bold' :
                    stat.porcentaje_sla_cumplido >= 80 ? 'text-yellow-600 font-semibold' :
                    'text-red-600 font-bold';

                  const diferenciaColor = 
                    stat.diferencia_sla_horas >= 5 ? 'text-green-600 font-semibold' :
                    stat.diferencia_sla_horas >= 0 ? 'text-yellow-600' :
                    'text-red-600 font-bold';

                  return (
                    <tr key={`${stat.staff_id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {stat.agente}
                          </span>
                          {stat.mes_nombre && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {stat.mes_nombre} {stat.anio}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                          {stat.nombre_sla}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {stat.total_tickets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {stat.tickets_sla_cumplido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        {stat.tickets_sla_vencido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${cumplimientoColor}`}>
                            {stat.porcentaje_sla_cumplido.toFixed(1)}%
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                stat.porcentaje_sla_cumplido >= 90 ? 'bg-green-500' :
                                stat.porcentaje_sla_cumplido >= 80 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(stat.porcentaje_sla_cumplido, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${diferenciaColor}`}>
                          {stat.diferencia_sla_promedio}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
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
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Mostrando {sortedStats.length} agente(s) • Última actualización: {new Date().toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  );
};

export default SLAStatsView;
