import React from 'react';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import type { SLASummary } from '../../types';

interface SLAMetricsCardsProps {
  summary: SLASummary | null;
  loading?: boolean;
}

const SLAMetricsCards: React.FC<SLAMetricsCardsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const porcentaje = typeof summary.porcentaje_cumplimiento === 'number' 
    ? summary.porcentaje_cumplimiento 
    : parseFloat(summary.porcentaje_cumplimiento as any) || 0;
  const isGood = porcentaje >= 95;
  const isWarning = porcentaje >= 80 && porcentaje < 95;
  const isBad = porcentaje < 80;

  const getColorClass = () => {
    if (isGood) return 'text-green-600 dark:text-green-400';
    if (isWarning) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBgColorClass = () => {
    if (isGood) return 'bg-green-50 dark:bg-green-900/20';
    if (isWarning) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Tarjeta 1: % SLA Cumplimiento */}
      <div className={`rounded-lg shadow-md p-6 ${getBgColorClass()} border-l-4 ${
        isGood ? 'border-green-500' : isWarning ? 'border-yellow-500' : 'border-red-500'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">% SLA Cumplimiento</h3>
          {isGood ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className={`text-3xl font-bold ${getColorClass()}`}>
          {porcentaje.toFixed(1)}%
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isGood ? 'Excelente rendimiento' : isWarning ? 'Requiere atención' : 'Crítico'}
        </p>
      </div>

      {/* Tarjeta 2: Tickets Cumplidos vs Vencidos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Cumplidos / Vencidos</h3>
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-1" />
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.tickets_cumplidos || 0}
            </span>
          </div>
          <span className="text-gray-400">/</span>
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-1" />
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.tickets_vencidos || 0}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Total: {summary.total_tickets || 0} tickets
        </p>
      </div>

      {/* Tarjeta 3: Tiempo Promedio Primera Respuesta */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo 1° Respuesta</h3>
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {summary.tiempo_promedio_primera_respuesta || '0d 00:00'}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Promedio de respuesta inicial
        </p>
      </div>

      {/* Tarjeta 4: Tiempo Promedio Resolución */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo Resolución</h3>
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {summary.tiempo_promedio_resolucion || '0d 00:00'}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Promedio hasta resolución
        </p>
      </div>
    </div>
  );
};

export default SLAMetricsCards;
