import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TransportData {
  name: string;
  value: number;
  transporteId: string;
}

interface TicketsByTransportChartProps {
  data: TransportData[];
  isLoading?: boolean;
}

// Colores modernos siguiendo la guía de diseño
const TRANSPORT_COLORS = {
  'A pie': '#10b981',       // Verde esmeralda
  'Remoto': '#06b6d4',      // Cian
  'SUBE': '#8b5cf6',        // Púrpura
  'Sin transporte': '#6b7280', // Gris
  'AE677SO': '#f59e0b',     // Ámbar  
  'AF630OG': '#ef4444',     // Rojo
  'MVH444': '#ec4899',      // Rosa
};

const getColorByTransport = (name: string): string => {
  return TRANSPORT_COLORS[name as keyof typeof TRANSPORT_COLORS] || '#64748b';
};

const TicketsByTransportChart: React.FC<TicketsByTransportChartProps> = ({ 
  data, 
  isLoading = false 
}) => {
  
  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-accent)]/10 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)] text-sm">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-accent)]/10 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--bg-accent)] rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-[var(--text-muted)] text-sm">No hay datos de transporte</p>
        </div>
      </div>
    );
  }

  // Calcular el total para mostrar en el tooltip
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Ordenar datos por valor descendente
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Preparar datos para el gráfico con colores
  const chartData = sortedData.map(item => ({
    ...item,
    fill: getColorByTransport(item.name)
  }));

  return (
    <div className="w-full h-[350px] bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-accent)]/10 p-6 hover:border-[var(--accent-primary)]/20 transition-all duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center">
          <span className="inline-block w-2 h-6 bg-[var(--accent-primary)] rounded-sm mr-3"></span>
          Tickets por Tipo de Transporte
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          Distribución de {total.toLocaleString()} tickets por medio de transporte utilizado
        </p>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="horizontal"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barCategoryGap="15%"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--bg-accent)" 
              opacity={0.3}
            />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'var(--text-muted)',
                fontFamily: 'Inter Variable, Inter, sans-serif'
              }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12, 
                fill: 'var(--text-muted)',
                fontFamily: 'Inter Variable, Inter, sans-serif'
              }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--bg-accent)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter Variable, Inter, sans-serif',
                fontSize: '14px'
              }}
              labelStyle={{ 
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}
              formatter={(value: any) => [
                `${value} tickets (${((value / total) * 100).toFixed(1)}%)`,
                'Cantidad'
              ]}
              labelFormatter={(label) => `Transporte: ${label}`}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              stroke="none"
            >
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen estadístico */}
      <div className="mt-4 pt-4 border-t border-[var(--bg-accent)]/20">
        <div className="flex justify-between items-center text-sm">
          <span className="text-[var(--text-muted)]">Tipos de transporte:</span>
          <span className="font-medium text-[var(--text-primary)]">{data.length}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-[var(--text-muted)]">Total tickets:</span>
          <span className="font-medium text-[var(--text-primary)]">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TicketsByTransportChart;
