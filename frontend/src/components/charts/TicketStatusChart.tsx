import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TicketStatusData {
  name: string;
  value: number;
}

interface TicketStatusChartProps {
  data: TicketStatusData[];
}

// Colores estáticos para el gráfico
const STATUS_COLORS = {
  'Abierto': '#fbbf24',     // Amarillo
  'Cerrado': '#6b7280',     // Gris  
  'Resuelto': '#10b981',    // Verde
  'Pendiente': '#f59e0b',   // Naranja
} as const;

// Componente de tooltip personalizado
const StatusTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm">
          <span className="font-semibold">{data.value}</span> tickets
        </p>
      </div>
    );
  }
  return null;
};

const TicketStatusChart: React.FC<TicketStatusChartProps> = memo(({ data }) => {
  // Preparar datos del gráfico con colores
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      color: STATUS_COLORS[item.name as keyof typeof STATUS_COLORS] || '#6b7280'
    }));
  }, [data]);

  // Calcular total de tickets
  const totalTickets = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  // Los valores de configuración están hardcodeados en el JSX para evitar problemas de tipado

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      {/* Contenedor del gráfico */}
      <div className="relative flex-grow" style={{ height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              cornerRadius={4}
              dataKey="value"
              animationBegin={0}
              animationDuration={750}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Texto central con total de tickets */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalTickets.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              tickets totales
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda personalizada */}
      <div className="ml-6 min-w-[140px]">
        <div className="space-y-3">
          {chartData.map((entry, index) => {
            const percentage = totalTickets > 0 ? Math.round((entry.value / totalTickets) * 100) : 0;
            return (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {entry.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.value} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TicketStatusChart.displayName = 'TicketStatusChart';

export default TicketStatusChart;
