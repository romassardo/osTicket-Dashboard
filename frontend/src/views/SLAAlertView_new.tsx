import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, XCircle, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import { getSLAAlerts } from '../services/api';
import logger from '../utils/logger';
import type { SLAAlerts, TicketEnRiesgo } from '../types';
import TicketDetailModal from '../components/modals/TicketDetailModal';

const SLAAlertView: React.FC = () => {
  const [alerts, setAlerts] = useState<SLAAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    vencidos: true,
    criticos: true,
    enRiesgo: false
  });

  const handleTicketClick = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicketId(null);
  };

  const toggleSection = (section: 'vencidos' | 'criticos' | 'enRiesgo') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
          tickets_vencidos: Number(data?.resumen?.tickets_vencidos) || 0,
          tickets_criticos: Number(data?.resumen?.tickets_criticos) || 0,
          tickets_en_riesgo: Number(data?.resumen?.tickets_en_riesgo) || 0
        },
        tickets_vencidos: (data?.tickets_vencidos || []).map((ticket) => ({
          ...ticket,
          sla_horas: Number(ticket.sla_horas) || 0,
          horas_transcurridas: Number(ticket.horas_transcurridas) || 0,
          horas_restantes: Number(ticket.horas_restantes) || 0,
          priority_id: Number(ticket.priority_id) || 2,
          prioridad_nombre: ticket.prioridad_nombre || 'Normal',
          horas_desde_ultima_actividad: Number(ticket.horas_desde_ultima_actividad) || 0,
          porcentaje_consumido: Number(ticket.porcentaje_consumido) || 0
        })),
        tickets_criticos: (data?.tickets_criticos || []).map((ticket) => ({
          ...ticket,
          sla_horas: Number(ticket.sla_horas) || 0,
          horas_transcurridas: Number(ticket.horas_transcurridas) || 0,
          horas_restantes: Number(ticket.horas_restantes) || 0,
          priority_id: Number(ticket.priority_id) || 2,
          prioridad_nombre: ticket.prioridad_nombre || 'Normal',
          horas_desde_ultima_actividad: Number(ticket.horas_desde_ultima_actividad) || 0,
          porcentaje_consumido: Number(ticket.porcentaje_consumido) || 0
        })),
        tickets_en_riesgo: (data?.tickets_en_riesgo || []).map((ticket) => ({
          ...ticket,
          sla_horas: Number(ticket.sla_horas) || 0,
          horas_transcurridas: Number(ticket.horas_transcurridas) || 0,
          horas_restantes: Number(ticket.horas_restantes) || 0,
          priority_id: Number(ticket.priority_id) || 2,
          prioridad_nombre: ticket.prioridad_nombre || 'Normal',
          horas_desde_ultima_actividad: Number(ticket.horas_desde_ultima_actividad) || 0,
          porcentaje_consumido: Number(ticket.porcentaje_consumido) || 0
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

  // Función para renderizar tabla de tickets
  const renderTicketTable = (tickets: TicketEnRiesgo[], tipo: 'vencido' | 'critico' | 'riesgo') => {
    const getPriorityBadge = (priorityId: number, priorityName: string) => {
      const configs = {
        1: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', icon: '🔴' },
        2: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200', icon: '🟠' },
        3: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: '🟡' },
        4: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: '🟢' }
      };
      const config = configs[priorityId as keyof typeof configs] || configs[2];
      return (
        <span className={`px-2 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium inline-flex items-center gap-1`}>
          <span>{config.icon}</span>
          {priorityName}
        </span>
      );
    };

    const formatTiempo = (horas: number) => {
      if (horas < 1) return 'Hace < 1h';
      if (horas < 24) return `Hace ${Math.floor(horas)}h`;
      const dias = Math.floor(horas / 24);
      const horasRestantes = Math.floor(horas % 24);
      return `Hace ${dias}d ${horasRestantes}h`;
    };

    const formatHorasRestantes = (horas: number, tipo: string) => {
      const abs = Math.abs(horas);
      if (tipo === 'vencido') {
        if (abs >= 48) {
          const dias = Math.floor(abs / 24);
          const hrs = Math.floor(abs % 24);
          return `Vencido: ${dias}d ${hrs}h`;
        }
        return `Vencido: ${Math.floor(abs)}h`;
      }
      if (abs >= 24) {
        const dias = Math.floor(abs / 24);
        const hrs = Math.floor(abs % 24);
        return `${dias}d ${hrs}h`;
      }
      return `${Math.floor(abs)}h`;
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Agente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                SLA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                % Consumido
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Tiempo Restante
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Prioridad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Última Actividad
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket, idx) => (
              <tr key={ticket.ticket_id || `ticket-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleTicketClick(ticket.ticket_id)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                  >
                    #{ticket.number}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                  {ticket.agente_asignado || 'Sin asignar'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                    {ticket.nombre_sla || 'Sin SLA'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ticket.porcentaje_consumido >= 100 ? 'bg-red-500' :
                          ticket.porcentaje_consumido >= 90 ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(ticket.porcentaje_consumido, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      ticket.porcentaje_consumido >= 100 ? 'text-red-600' :
                      ticket.porcentaje_consumido >= 90 ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      {ticket.porcentaje_consumido.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={
                    tipo === 'vencido' ? 'text-red-600 font-bold' :
                    tipo === 'critico' ? 'text-orange-600 font-semibold' :
                    'text-yellow-600'
                  }>
                    {formatHorasRestantes(ticket.horas_restantes, tipo)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {getPriorityBadge(ticket.priority_id, ticket.prioridad_nombre)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {formatTiempo(ticket.horas_desde_ultima_actividad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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

  if (!alerts) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🚨 Monitoreo SLA en Tiempo Real
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tickets activos categorizados por nivel de urgencia - Actualización automática cada 5 min
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

      {/* Tarjetas de Resumen - 4 categorías */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Abiertos</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {alerts.resumen.total_tickets_abiertos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tickets activos
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidos</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {alerts.resumen.tickets_vencidos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            &gt;100% SLA consumido
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Críticos</h3>
            <AlertOctagon className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {alerts.resumen.tickets_criticos}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            90-100% SLA consumido
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
            70-90% SLA consumido
          </p>
        </div>
      </div>

      {/* Sección 1: Tickets Vencidos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('vencidos')}
          className="w-full px-6 py-4 flex items-center justify-between bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tickets Vencidos ({alerts.tickets_vencidos.length})
            </h3>
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠️ Requieren acción inmediata
            </span>
          </div>
          {expandedSections.vencidos ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>
        {expandedSections.vencidos && (
          <div className="p-6">
            {alerts.tickets_vencidos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                ✅ No hay tickets vencidos
              </div>
            ) : (
              renderTicketTable(alerts.tickets_vencidos, 'vencido')
            )}
          </div>
        )}
      </div>

      {/* Sección 2: Tickets Críticos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('criticos')}
          className="w-full px-6 py-4 flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tickets Críticos ({alerts.tickets_criticos.length})
            </h3>
            <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              ⏰ Vencen muy pronto
            </span>
          </div>
          {expandedSections.criticos ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>
        {expandedSections.criticos && (
          <div className="p-6">
            {alerts.tickets_criticos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                ✅ No hay tickets críticos
              </div>
            ) : (
              renderTicketTable(alerts.tickets_criticos, 'critico')
            )}
          </div>
        )}
      </div>

      {/* Sección 3: Tickets En Riesgo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('enRiesgo')}
          className="w-full px-6 py-4 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tickets En Riesgo ({alerts.tickets_en_riesgo.length})
            </h3>
            <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              📊 Monitorear
            </span>
          </div>
          {expandedSections.enRiesgo ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
        </button>
        {expandedSections.enRiesgo && (
          <div className="p-6">
            {alerts.tickets_en_riesgo.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                ✅ No hay tickets en riesgo
              </div>
            ) : (
              renderTicketTable(alerts.tickets_en_riesgo, 'riesgo')
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          💡 <strong>Tip:</strong> Para análisis histórico de rendimiento por agente, revisa la vista 
          <span className="font-semibold text-blue-600 dark:text-blue-400"> "Análisis Histórico SLA"</span> 
          {' '}con filtros de fecha y gráficos de tendencias.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Última actualización: {new Date().toLocaleString('es-AR')} • Actualización automática cada 5 minutos
        </p>
      </div>

      {/* Modal de detalle */}
      {isModalOpen && selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default SLAAlertView;
