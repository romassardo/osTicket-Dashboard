import React, { useState, useEffect } from 'react';
import { Calendar, Users, RefreshCw } from 'lucide-react';
import { getSLAStats, getSLASummary, getStaff } from '../services/api';
import SLAMetricsCards from '../components/sla/SLAMetricsCards';
import SLATrendChart from '../components/sla/SLATrendChart';
import AgentComparisonChart from '../components/sla/AgentComparisonChart';
import SLADetailTable from '../components/sla/SLADetailTable';
import logger from '../utils/logger';
import type { SLAStats, SLASummary } from '../types';

const SLADashboardView: React.FC = () => {
  const [stats, setStats] = useState<SLAStats[]>([]);
  const [summary, setSummary] = useState<SLASummary | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Generar lista de años (últimos 3 años)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  // Meses en español
  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params: any = { year: selectedYear };
      if (selectedMonth !== 'all') {
        params.month = selectedMonth;
      }
      if (selectedAgent !== 'all') {
        params.agent = selectedAgent;
      }

      // Obtener datos en paralelo
      const [statsData, summaryData, agentsData] = await Promise.all([
        getSLAStats(params),
        getSLASummary(params),
        getStaff()
      ]);

      setStats(statsData);
      setSummary(summaryData);
      setAgents(agentsData);

      logger.info(`📊 SLA Dashboard cargado: ${statsData.length} registros`);
    } catch (error) {
      logger.error('Error al cargar datos SLA:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Recargar al cambiar filtros
  useEffect(() => {
    if (!loading) {
      fetchData(true);
    }
  }, [selectedYear, selectedMonth, selectedAgent]);

  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Dashboard SLA - Soporte IT
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas de cumplimiento de Acuerdos de Nivel de Servicio (SLA)
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Selector de Año */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Selector de Mes */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los meses</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de Agente */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Agente
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los agentes</option>
              {agents.map(agent => (
                <option key={agent.staff_id} value={agent.staff_id}>
                  {agent.name || `${agent.firstname} ${agent.lastname}`}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                     text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <SLAMetricsCards summary={summary} loading={loading} />

      {/* Gráfico de Tendencia SLA */}
      <SLATrendChart stats={stats} loading={loading} />

      {/* Gráfico de Comparación por Agente */}
      <AgentComparisonChart stats={stats} loading={loading} />

      {/* Tabla Detallada */}
      <SLADetailTable stats={stats} loading={loading} />
    </div>
  );
};

export default SLADashboardView;
