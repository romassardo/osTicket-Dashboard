import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SLAStats } from '../../types';

interface AgentComparisonChartProps {
  stats: SLAStats[];
  loading?: boolean;
}

const AgentComparisonChart: React.FC<AgentComparisonChartProps> = ({ stats, loading }) => {
  const chartData = useMemo(() => {
    if (!stats || stats.length === 0) return [];

    // Filtrar agentes que ya no trabajan
    const excludedAgents = ['Roberto Gerhardt', 'Diego Gomez'];
    const filteredStats = stats.filter(s => !excludedAgents.includes(s.agente));

    // Consolidar por staff_id (puede haber múltiples registros por mes/año/SLA)
    const agentMap = new Map<number, any>();
    filteredStats.forEach(stat => {
      // IMPORTANTE: Convertir a números para evitar concatenación de strings
      const cumplidos = Number(stat.tickets_sla_cumplido) || 0;
      const vencidos = Number(stat.tickets_sla_vencido) || 0;
      
      const existing = agentMap.get(stat.staff_id);
      if (existing) {
        // Consolidar datos sumando tickets (ya como números)
        existing.cumplidos += cumplidos;
        existing.vencidos += vencidos;
      } else {
        agentMap.set(stat.staff_id, {
          agente: stat.agente,
          staff_id: stat.staff_id,
          cumplidos: cumplidos,
          vencidos: vencidos
        });
      }
    });

    // Calcular porcentaje para cada agente consolidado
    const agentData = Array.from(agentMap.values()).map((agent: any) => {
      const total = agent.cumplidos + agent.vencidos;
      const porcentaje = total > 0 ? (agent.cumplidos / total) * 100 : 0;
      const numPorcentaje = typeof porcentaje === 'number' ? porcentaje : parseFloat(porcentaje as any) || 0;
      
      return {
        agente: agent.agente,
        porcentaje: parseFloat(numPorcentaje.toFixed(1)),
        totalTickets: total,
        cumplidos: agent.cumplidos,
        vencidos: agent.vencidos
      };
    });

    // Ordenar de mayor a menor porcentaje
    return agentData.sort((a, b) => b.porcentaje - a.porcentaje);
  }, [stats]);

  const getBarColor = (porcentaje: number) => {
    if (porcentaje >= 90) return '#10b981'; // Verde
    if (porcentaje >= 70) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          👥 Cumplimiento por Agente
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay datos disponibles para comparar agentes
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        👥 Cumplimiento por Agente
      </h3>
      
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis 
            type="number"
            domain={[0, 100]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: '% Cumplimiento SLA', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
          />
          <YAxis 
            type="category"
            dataKey="agente" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            width={110}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number, name, props) => [
              `${value}% (${props.payload.cumplidos}/${props.payload.totalTickets} tickets)`,
              'Cumplimiento'
            ]}
          />
          <Bar 
            dataKey="porcentaje" 
            radius={[0, 4, 4, 0]}
            label={{ position: 'right', fontSize: 11, formatter: (value: number) => `${value}%` }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.porcentaje)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Excelente (90-100%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Regular (70-89%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Crítico (&lt;70%)</span>
        </div>
      </div>
    </div>
  );
};

export default AgentComparisonChart;
