import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, RefreshCw, XCircle, AlertOctagon, Filter } from 'lucide-react';
import { getSLAAlerts } from '../services/api';
import logger from '../utils/logger';
import type { SLAAlerts, TicketEnRiesgo } from '../types';
import TicketDetailModal from '../components/modals/TicketDetailModal';
import { Tooltip } from '../components/ui/Tooltip';

type Categoria = 'todos' | 'vencido' | 'critico' | 'riesgo';

const SLAAlertView: React.FC = () => {
  const [alerts, setAlerts] = useState<SLAAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterCategoria, setFilterCategoria] = useState<Categoria>('todos');
  const [filterTicket, setFilterTicket] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  const normalizeTicket = (ticket: any): TicketEnRiesgo => ({
    ...ticket,
    sla_horas: Number(ticket.sla_horas) || 0,
    horas_transcurridas: Number(ticket.horas_transcurridas) || 0,
    horas_restantes: Number(ticket.horas_restantes) || 0,
    priority_id: Number(ticket.priority_id) || 2,
    prioridad_nombre: ticket.prioridad_nombre || 'Normal',
    horas_desde_ultima_actividad: Number(ticket.horas_desde_ultima_actividad) || 0,
    porcentaje_consumido: Number(ticket.porcentaje_consumido) || 0
  });

  const fetchAlerts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const data = await getSLAAlerts();
      const normalized: SLAAlerts = {
        resumen: {
          total_tickets_abiertos: Number(data?.resumen?.total_tickets_abiertos) || 0,
          tickets_vencidos: Number(data?.resumen?.tickets_vencidos) || 0,
          tickets_criticos: Number(data?.resumen?.tickets_criticos) || 0,
          tickets_en_riesgo: Number(data?.resumen?.tickets_en_riesgo) || 0
        },
        tickets_vencidos: (data?.tickets_vencidos || []).map(normalizeTicket),
        tickets_criticos: (data?.tickets_criticos || []).map(normalizeTicket),
        tickets_en_riesgo: (data?.tickets_en_riesgo || []).map(normalizeTicket),
        agentes_bajo_rendimiento: data?.agentes_bajo_rendimiento || [],
        tendencias_negativas: data?.tendencias_negativas || []
      };
      setAlerts(normalized);
      logger.info('Alertas SLA cargadas:', normalized.resumen);
    } catch (error) {
      logger.error('Error al cargar alertas SLA:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Unificar todos los tickets con su categoría
  const allTickets = useMemo(() => {
    if (!alerts) return [];
    return [
      ...alerts.tickets_vencidos.map(t => ({ ...t, _cat: 'vencido' as const })),
      ...alerts.tickets_criticos.map(t => ({ ...t, _cat: 'critico' as const })),
      ...alerts.tickets_en_riesgo.map(t => ({ ...t, _cat: 'riesgo' as const })),
    ];
  }, [alerts]);

  const agentOptions = useMemo(() => {
    const set = new Set<string>();
    allTickets.forEach(t => { if (t.agente_asignado) set.add(t.agente_asignado); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter(t => {
      if (filterCategoria !== 'todos' && t._cat !== filterCategoria) return false;
      if (filterTicket && !t.number.toLowerCase().includes(filterTicket.toLowerCase())) return false;
      if (filterAgent && t.agente_asignado !== filterAgent) return false;
      return true;
    });
  }, [allTickets, filterCategoria, filterTicket, filterAgent]);

  const catBadge = (cat: 'vencido' | 'critico' | 'riesgo') => {
    const cfg = {
      vencido: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Vencido' },
      critico: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'Crítico' },
      riesgo: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', label: 'En Riesgo' },
    }[cat];
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
  };

  const priorityBadge = (id: number, name: string) => {
    const colors: Record<number, string> = {
      1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-green-500'
    };
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
        <span className={`w-2 h-2 rounded-full ${colors[id] || 'bg-gray-400'}`} />
        {name}
      </span>
    );
  };

  const fmtTiempo = (horas: number) => {
    if (horas < 1) return '< 1h';
    if (horas < 24) return `${Math.floor(horas)}h`;
    return `${Math.floor(horas / 24)}d ${Math.floor(horas % 24)}h`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '1.5rem' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 rounded w-1/3" style={{ background: 'var(--bg-tertiary)' }} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />)}
          </div>
          <div className="h-96 rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
        </div>
      </div>
    );
  }

  if (!alerts) return null;

  const { resumen } = alerts;
  const totalConProblema = resumen.tickets_vencidos + resumen.tickets_criticos + resumen.tickets_en_riesgo;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '1.5rem' }} className="space-y-6">
      {/* Header */}
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', padding: '1.25rem' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display flex items-center gap-2" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
              Monitoreo SLA
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Tickets abiertos con riesgo de incumplimiento (horas hábiles Lun-Vie 8:30-17:30)
            </p>
          </div>
          <button
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', background: 'var(--accent-primary)', color: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: refreshing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.375rem', alignSelf: 'flex-start', transition: 'all 150ms ease' }}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setFilterCategoria('todos')}
          className={`rounded-xl shadow-sm p-4 text-left transition-all ${filterCategoria === 'todos' ? 'ring-2 ring-blue-500' : ''} bg-white dark:bg-gray-800`}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <Tooltip text="Total de tickets abiertos en el departamento Soporte IT. Incluye tickets con y sin SLA asignado.">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Abiertos</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{resumen.total_tickets_abiertos}</div>
          <p className="text-xs text-gray-400 mt-1">{totalConProblema} con alertas</p>
        </button>

        <button onClick={() => setFilterCategoria('vencido')}
          className={`rounded-xl shadow-sm p-4 text-left transition-all border-l-4 border-red-500 ${filterCategoria === 'vencido' ? 'ring-2 ring-red-500' : ''} bg-white dark:bg-gray-800`}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <Tooltip text="Tickets cuyo tiempo de resolución en horas hábiles superó el 100% del SLA asignado. Requieren atención inmediata.">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vencidos</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-red-600">{resumen.tickets_vencidos}</div>
          <p className="text-xs text-gray-400 mt-1">&gt;100% consumido</p>
        </button>

        <button onClick={() => setFilterCategoria('critico')}
          className={`rounded-xl shadow-sm p-4 text-left transition-all border-l-4 border-orange-500 ${filterCategoria === 'critico' ? 'ring-2 ring-orange-500' : ''} bg-white dark:bg-gray-800`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-4 h-4 text-orange-600" />
            <Tooltip text="Tickets que consumieron entre 90% y 100% de su SLA en horas hábiles. Están por vencer.">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Críticos</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-orange-600">{resumen.tickets_criticos}</div>
          <p className="text-xs text-gray-400 mt-1">90-100% consumido</p>
        </button>

        <button onClick={() => setFilterCategoria('riesgo')}
          className={`rounded-xl shadow-sm p-4 text-left transition-all border-l-4 border-yellow-500 ${filterCategoria === 'riesgo' ? 'ring-2 ring-yellow-500' : ''} bg-white dark:bg-gray-800`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <Tooltip text="Tickets que consumieron entre 70% y 90% de su SLA en horas hábiles. Necesitan seguimiento.">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">En Riesgo</span>
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{resumen.tickets_en_riesgo}</div>
          <p className="text-xs text-gray-400 mt-1">70-90% consumido</p>
        </button>
      </div>

      {/* Filtros + Tabla unificada */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Barra de filtros */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filterTicket}
            onChange={(e) => setFilterTicket(e.target.value)}
            placeholder="Buscar # ticket..."
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Todos los agentes</option>
            {agentOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {(filterTicket || filterAgent || filterCategoria !== 'todos') && (
            <button onClick={() => { setFilterTicket(''); setFilterAgent(''); setFilterCategoria('todos'); }}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filteredTickets.length} tickets</span>
        </div>

        {/* Tabla */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay tickets que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Número de ticket en osTicket. Click para ver detalle." position="below"><span>Ticket</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Categoría de alerta: Vencido (>100% SLA), Crítico (90-100%), En Riesgo (70-90%)." position="below"><span>Estado</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Agente de Soporte IT asignado al ticket." position="below"><span>Agente</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Nombre del SLA asignado al ticket. Define el tiempo máximo de resolución." position="below"><span>SLA</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Porcentaje del tiempo SLA ya consumido en horas hábiles (Lun-Vie 8:30-17:30, sin feriados)." position="below"><span>% Consumido</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Horas hábiles restantes antes de vencer el SLA. Si es negativo, indica cuánto se excedió." position="below"><span>Restante</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Prioridad asignada al ticket según el Help Topic." position="below"><span>Prioridad</span></Tooltip>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Tooltip text="Tiempo transcurrido en horas hábiles desde la última actividad en el ticket." position="below"><span>Últ. Actividad</span></Tooltip>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredTickets.map((ticket) => {
                  const pct = ticket.porcentaje_consumido;
                  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : 'bg-yellow-500';
                  const pctTextColor = pct >= 100 ? 'text-red-600' : pct >= 90 ? 'text-orange-600' : 'text-yellow-600';

                  return (
                    <tr key={ticket.ticket_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedTicketId(ticket.ticket_id); setIsModalOpen(true); }}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          #{ticket.number}
                        </button>
                      </td>
                      <td className="px-4 py-3">{catBadge(ticket._cat)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {ticket.agente_asignado || <span className="text-gray-400 italic">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {ticket.nombre_sla || 'Sin SLA'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <div className={`h-1.5 rounded-full ${barColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${pctTextColor}`}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          ticket._cat === 'vencido' ? 'text-red-600' : ticket._cat === 'critico' ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {ticket._cat === 'vencido' ? `−${fmtTiempo(Math.abs(ticket.horas_restantes))}` : fmtTiempo(ticket.horas_restantes)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{priorityBadge(ticket.priority_id, ticket.prioridad_nombre)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {fmtTiempo(ticket.horas_desde_ultima_actividad)} atrás
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
        Auto-actualización cada 5 min &middot; {new Date().toLocaleString('es-AR')}
      </p>

      {/* Modal de detalle */}
      {isModalOpen && selectedTicketId && (
        <TicketDetailModal
          isOpen={isModalOpen}
          ticketId={selectedTicketId}
          onClose={() => { setIsModalOpen(false); setSelectedTicketId(null); }}
        />
      )}
    </div>
  );
};

export default SLAAlertView;
