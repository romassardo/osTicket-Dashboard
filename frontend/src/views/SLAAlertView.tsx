import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Clock, Users, RefreshCw } from 'lucide-react';
import { getSLAAlerts } from '../services/api';
import logger from '../utils/logger';
import type { SLAAlerts } from '../types';

const SLAAlertView: React.FC = () => {
  const [alerts, setAlerts] = useState<SLAAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSLAAlerts();

      const normalized: SLAAlerts = {
        resumen: {
          total_tickets_abiertos: Number(data?.resumen?.total_tickets_abiertos) || 0,
          tickets_en_riesgo: Number(data?.resumen?.tickets_en_riesgo) || 0,
          tickets_vencidos: Number(data?.resumen?.tickets_vencidos) || 0
        },
        tickets_en_riesgo: (data?.tickets_en_riesgo || []).map((ticket) => ({
          ...ticket,
          sla_horas: Number(ticket.sla_horas) || 0,
          horas_transcurridas: Number(ticket.horas_transcurridas) || 0,
          horas_restantes: Number(ticket.horas_restantes) || 0,
          porcentaje_transcurrido:
            typeof ticket.porcentaje_transcurrido === 'number'
              ? ticket.porcentaje_transcurrido
              : parseFloat(ticket.porcentaje_transcurrido as any) || 0
        })),
        agentes_bajo_rendimiento: (data?.agentes_bajo_rendimiento || []).map((agente) => ({
          ...agente,
          total_tickets: Number(agente.total_tickets) || 0,
          tickets_cumplidos: Number(agente.tickets_cumplidos) || 0,
          tickets_vencidos: Number(agente.tickets_vencidos) || 0,
          porcentaje_cumplimiento:
            typeof agente.porcentaje_cumplimiento === 'number'
              ? agente.porcentaje_cumplimiento
              : parseFloat(agente.porcentaje_cumplimiento as any) || 0
        })),
        tendencias_negativas: data?.tendencias_negativas || []
      };

      setAlerts(normalized);
      logger.info('🚨 Alertas SLA cargadas:', normalized.resumen);
    } catch (error) {
      logger.error('Error al cargar alertas SLA:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh cada 5 minutos
    const interval = setInterval(() => fetchAlerts(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchAlerts(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!alerts) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚨 Alertas SLA - Soporte IT
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoreo de tickets en riesgo y agentes con bajo rendimiento
          </p>
        </div>
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

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tickets Abiertos</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {alerts.resumen.total_tickets_abiertos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Total de tickets activos
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">En Riesgo</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {alerts.resumen.tickets_en_riesgo}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            &gt;70% del tiempo SLA transcurrido
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidos</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {alerts.resumen.tickets_vencidos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            SLA excedido
          </p>
        </div>
      </div>

      {/* Tickets en Riesgo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Tickets en Riesgo de Vencer SLA
        </h3>
        
        {alerts.tickets_en_riesgo.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            ✅ No hay tickets en riesgo actualmente
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Asunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tiempo Restante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Progreso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.tickets_en_riesgo.map((ticket) => {
                  const isVencido = ticket.horas_restantes < 0;
                  const progressColor = 
                    isVencido ? 'bg-red-600' :
                    ticket.porcentaje_transcurrido > 90 ? 'bg-red-500' :
                    ticket.porcentaje_transcurrido > 70 ? 'bg-yellow-500' :
                    'bg-green-500';

                  return (
                    <tr key={ticket.ticket_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        #{ticket.number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {ticket.asunto || 'Sin asunto'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {ticket.usuario}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {ticket.agente_asignado || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={isVencido ? 'text-red-600 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                          {isVencido ? `Vencido hace ${Math.abs(ticket.horas_restantes)}h` : `${ticket.horas_restantes}h`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${progressColor} transition-all`}
                              style={{ width: `${Math.min(ticket.porcentaje_transcurrido, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {ticket.porcentaje_transcurrido.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid de Agentes con Problemas y Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agentes con Bajo Rendimiento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Agentes con Bajo Rendimiento (&lt;80%)
          </h3>
          
          {alerts.agentes_bajo_rendimiento.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              ✅ Todos los agentes cumplen el objetivo
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.agentes_bajo_rendimiento.map((agente) => (
                <div 
                  key={agente.staff_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {agente.agente}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {agente.total_tickets} tickets (últimos 30 días)
                      </p>
                    </div>
                    <span className={`text-2xl font-bold ${
                      agente.porcentaje_cumplimiento >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {agente.porcentaje_cumplimiento.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 dark:text-green-400">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {agente.tickets_cumplidos} cumplidos
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-600 dark:text-red-400">✗</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {agente.tickets_vencidos} vencidos
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          agente.porcentaje_cumplimiento >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${agente.porcentaje_cumplimiento}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tendencias Negativas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            Tendencias Negativas (Mes Actual vs Anterior)
          </h3>
          
          {alerts.tendencias_negativas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              ✅ No se detectaron caídas significativas
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.tendencias_negativas.map((tendencia, index) => (
                <div 
                  key={`${tendencia.agente}-${index}`}
                  className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {tendencia.agente}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mes Anterior</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {tendencia.porcentaje_mes_anterior?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mes Actual</p>
                      <p className="text-xl font-bold text-orange-600">
                        {tendencia.porcentaje_mes_actual?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-600">
                      Caída de {Math.abs(tendencia.diferencia).toFixed(1)} puntos porcentuales
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer con última actualización */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Última actualización: {new Date().toLocaleString('es-AR')} • Actualización automática cada 5 minutos
        </p>
      </div>
    </div>
  );
};

export default SLAAlertView;
