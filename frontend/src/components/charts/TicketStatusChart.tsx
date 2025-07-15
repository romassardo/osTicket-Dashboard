import React, { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { pieChartConfig, chartColors, tooltipConfig, legendConfig, getResponsiveConfig } from '../../lib/chartConfig';

// Colores según DESIGN_GUIDE.md - Sistema de estados
const COLORS = {
  'Abiertos': chartColors.ticketStatus.open,
  'Abierto': chartColors.ticketStatus.open,
  'En Progreso': chartColors.warning,
  'Resueltos': chartColors.ticketStatus.resolved,
  'Resuelto': chartColors.ticketStatus.resolved,
  'Cerrados': chartColors.ticketStatus.closed,
  'Cerrado': chartColors.ticketStatus.closed,
  'Vencidos': chartColors.error,
  'Vencido': chartColors.error,
  'Pendientes': chartColors.ticketStatus.pending,
  'Pendiente': chartColors.ticketStatus.pending
};

interface TicketStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

// Función para obtener color por nombre (robusta y flexible)
const getColorByName = (name: string): string => {
  if (COLORS[name as keyof typeof COLORS]) {
    return COLORS[name as keyof typeof COLORS];
  }
  
  const normalizedName = name.toLowerCase().trim();
  
  const nameMapping: { [key: string]: string } = {
    'abierto': chartColors.ticketStatus.open,
    'abiertos': chartColors.ticketStatus.open,
    'open': chartColors.ticketStatus.open,
    'nuevo': chartColors.ticketStatus.open,
    'nuevos': chartColors.ticketStatus.open,
    
    'cerrado': chartColors.ticketStatus.closed,
    'cerrados': chartColors.ticketStatus.closed,
    'closed': chartColors.ticketStatus.closed,
    
    'resuelto': chartColors.ticketStatus.resolved,
    'resueltos': chartColors.ticketStatus.resolved,
    'resolved': chartColors.ticketStatus.resolved,
    'solucionado': chartColors.ticketStatus.resolved,
    'solucionados': chartColors.ticketStatus.resolved,
    
    'pendiente': chartColors.ticketStatus.pending,
    'pendientes': chartColors.ticketStatus.pending,
    'pending': chartColors.ticketStatus.pending,
    'esperando': chartColors.ticketStatus.pending,
    
    'vencido': chartColors.error,
    'vencidos': chartColors.error,
    'overdue': chartColors.error,
    'atrasado': chartColors.error,
    'atrasados': chartColors.error,
    
    'en progreso': chartColors.warning,
    'en_progreso': chartColors.warning,
    'in_progress': chartColors.warning,
    'working': chartColors.warning,
    'trabajando': chartColors.warning
  };

  return nameMapping[normalizedName] || chartColors.muted;
};

// Componente de tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div 
        style={tooltipConfig.contentStyle}
        className="shadow-xl"
      >
        <p style={tooltipConfig.labelStyle}>
          {data.name}
        </p>
        <p style={tooltipConfig.itemStyle}>
          <span style={{ color: data.color }}>●</span>
          {` ${data.value} tickets`}
        </p>
        <p style={{ ...tooltipConfig.itemStyle, fontSize: '0.75rem', opacity: 0.8 }}>
          {((data.value / payload[0].payload.total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

// Etiqueta personalizada para mostrar el total en el centro
const CenterLabel = ({ viewBox, data }: any) => {
  const { cx, cy } = viewBox;
  const total = data.reduce((sum: number, entry: any) => sum + entry.value, 0);
  
  return (
    <g>
      <text 
        x={cx} 
        y={cy - 10} 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-2xl font-bold"
        fill="var(--text-primary)"
      >
        {total.toLocaleString()}
      </text>
      <text 
        x={cx} 
        y={cy + 15} 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs"
        fill="var(--text-muted)"
      >
        tickets
      </text>
    </g>
  );
};

const TicketStatusChart: React.FC<TicketStatusChartProps> = memo(({ data }) => {
  const responsiveConfig = getResponsiveConfig();
  
  // Procesar datos y aplicar colores
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return data.map(item => ({
      ...item,
      color: item.color || getColorByName(item.name),
      total, // Añadir total para el tooltip
    }));
  }, [data]);

  // Configuración del gráfico responsive
  const chartConfig = useMemo(() => ({
    ...pieChartConfig,
    innerRadius: responsiveConfig.innerRadius,
    outerRadius: responsiveConfig.outerRadius,
  }), [responsiveConfig]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] mx-auto mb-4 flex items-center justify-center">
            📊
          </div>
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart margin={responsiveConfig.margin}>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            innerRadius={chartConfig.innerRadius}
            outerRadius={chartConfig.outerRadius}
            paddingAngle={chartConfig.paddingAngle}
            cornerRadius={chartConfig.cornerRadius}
            dataKey="value"
            animationBegin={chartConfig.animationBegin}
            animationDuration={chartConfig.animationDuration}
            label={<CenterLabel data={processedData} />}
          >
            {processedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="var(--bg-primary)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            {...legendConfig}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload?.value || 0})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

TicketStatusChart.displayName = 'TicketStatusChart';

export default TicketStatusChart;
