import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowUp, ArrowDown } from 'lucide-react';
import type { SLAStats } from '../../types';

interface SLADetailTableProps {
  stats: SLAStats[];
  loading?: boolean;
}

type SortField = 'agente' | 'mes' | 'total_tickets' | 'porcentaje_sla_cumplido' | 'tiempo_promedio_resolucion';
type SortOrder = 'asc' | 'desc';

const SLADetailTable: React.FC<SLADetailTableProps> = ({ stats, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('porcentaje_sla_cumplido');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    if (!stats) return [];

    let filtered = [...stats];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.agente.toLowerCase().includes(term) ||
        item.mes_nombre.toLowerCase().includes(term)
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'agente':
          aVal = a.agente;
          bVal = b.agente;
          break;
        case 'mes':
          aVal = `${a.anio}-${a.mes}`;
          bVal = `${b.anio}-${b.mes}`;
          break;
        case 'total_tickets':
          aVal = a.total_tickets;
          bVal = b.total_tickets;
          break;
        case 'porcentaje_sla_cumplido':
          aVal = a.porcentaje_sla_cumplido;
          bVal = b.porcentaje_sla_cumplido;
          break;
        case 'tiempo_promedio_resolucion':
          aVal = a.tiempo_resolucion_segundos || 0;
          bVal = b.tiempo_resolucion_segundos || 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stats, searchTerm, sortField, sortOrder]);

  const handleExport = () => {
    // Preparar datos para exportar
    const csvContent = [
      ['Agente', 'Año', 'Mes', 'Total Tickets', 'SLA Cumplido', 'SLA Vencido', '% Cumplimiento', 'Tiempo 1° Respuesta', 'Tiempo Resolución'],
      ...filteredAndSortedData.map(row => [
        row.agente,
        row.anio,
        row.mes_nombre,
        row.total_tickets,
        row.tickets_sla_cumplido,
        row.tickets_sla_vencido,
        `${row.porcentaje_sla_cumplido}%`,
        row.tiempo_promedio_primera_respuesta,
        row.tiempo_promedio_resolucion
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sla_detalle_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUp className="w-4 h-4 opacity-30" />;
    return sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          📋 Detalle Mensual por Agente
        </h3>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Búsqueda */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar agente o mes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       w-full sm:w-64"
            />
          </div>

          {/* Botón Exportar */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 
                     text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th 
                onClick={() => handleSort('agente')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  Agente
                  <SortIcon field="agente" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('mes')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  Mes
                  <SortIcon field="mes" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('total_tickets')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  Total
                  <SortIcon field="total_tickets" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cumplido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vencido
              </th>
              <th 
                onClick={() => handleSort('porcentaje_sla_cumplido')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  % Cumplimiento
                  <SortIcon field="porcentaje_sla_cumplido" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tiempo 1° Resp.
              </th>
              <th 
                onClick={() => handleSort('tiempo_promedio_resolucion')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  Tiempo Resoluc.
                  <SortIcon field="tiempo_promedio_resolucion" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No se encontraron resultados para la búsqueda' : 'No hay datos disponibles'}
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((row, index) => {
                const porcentaje = typeof row.porcentaje_sla_cumplido === 'number' 
                  ? row.porcentaje_sla_cumplido 
                  : parseFloat(row.porcentaje_sla_cumplido as any) || 0;
                const colorClass = porcentaje >= 95 ? 'text-green-600 dark:text-green-400' :
                                 porcentaje >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                                 'text-red-600 dark:text-red-400';

                return (
                  <tr key={`${row.staff_id}-${row.anio}-${row.mes}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.agente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {row.mes_nombre} {row.anio}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {row.total_tickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      {row.tickets_sla_cumplido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                      {row.tickets_sla_vencido}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${colorClass}`}>
                      {porcentaje.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {row.tiempo_promedio_primera_respuesta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {row.tiempo_promedio_resolucion}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con conteo */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Mostrando {filteredAndSortedData.length} de {stats.length} registros
      </div>
    </div>
  );
};

export default SLADetailTable;
