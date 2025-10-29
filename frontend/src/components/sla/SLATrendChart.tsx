import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SLAStats } from '../../types';

interface SLATrendChartProps {
  stats: SLAStats[];
  loading?: boolean;
}

const SLATrendChart: React.FC<SLATrendChartProps> = ({ stats, loading }) => {
  const chartData = useMemo(() => {
    if (!stats || stats.length === 0) return [];

    // Agrupar por mes
    const groupedByMonth = stats.reduce((acc: any, item) => {
      const key = `${item.mes_nombre} ${item.anio}`;
      
      if (!acc[key]) {
        acc[key] = {
          mes: key,
          agentes: [],
          promedioMes: 0
        };
      }
      
      acc[key].agentes.push({
        agente: item.agente,
        porcentaje: item.porcentaje_sla_cumplido
      });
      
      return acc;
    }, {});

    // Convertir a array y calcular promedio del mes
    return Object.values(groupedByMonth).map((month: any) => {
      const data: any = { mes: month.mes };
      
      // Agregar cada agente como una serie
      month.agentes.forEach((a: any) => {
        data[a.agente] = a.porcentaje;
      });
      
      // Calcular promedio del mes
      const total = month.agentes.reduce((sum: number, a: any) => sum + a.porcentaje, 0);
      data['Promedio'] = month.agentes.length > 0 ? total / month.agentes.length : 0;
      
      return data;
    });
  }, [stats]);

  // Obtener nombres únicos de agentes para las líneas
  const agenteNames = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    const names = new Set(stats.map(s => s.agente));
    return Array.from(names);
  }, [stats]);

  // Colores para cada agente
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          📈 Evolución SLA (últimos meses)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No hay datos disponibles para mostrar la tendencia
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        📈 Evolución SLA (últimos meses)
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis 
            dataKey="mes" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ value: '% Cumplimiento', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => {
              const numValue = typeof value === 'number' ? value : parseFloat(value as any) || 0;
              return `${numValue.toFixed(1)}%`;
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          
          {/* Línea de promedio (más gruesa y destacada) */}
          <Line 
            type="monotone" 
            dataKey="Promedio" 
            stroke="#9333ea" 
            strokeWidth={3}
            dot={{ fill: '#9333ea', r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Líneas de cada agente */}
          {agenteNames.map((nombre, index) => (
            <Line 
              key={nombre}
              type="monotone" 
              dataKey={nombre} 
              stroke={colors[index % colors.length]} 
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center text-xs text-gray-500 dark:text-gray-400">
        <div className="w-3 h-0.5 bg-red-500 mr-2"></div>
        <span className="mr-4">Meta: &gt;95%</span>
        <div className="w-3 h-0.5 bg-yellow-500 mr-2"></div>
        <span className="mr-4">Advertencia: 80-95%</span>
        <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
        <span>Crítico: &lt;80%</span>
      </div>
    </div>
  );
};

export default SLATrendChart;
