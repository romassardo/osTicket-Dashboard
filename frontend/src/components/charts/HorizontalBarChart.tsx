// frontend/src/components/charts/HorizontalBarChart.tsx
import React, { memo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip'; // Asumiendo que tenemos un tooltip personalizado

interface ChartData {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: ChartData[];
  barColor?: string;
}

/**
 * Componente reutilizable de gráfico de barras horizontales.
 * Ideal para comparar valores entre diferentes categorías.
 * Optimizado para funcionar con scroll interno.
 */
export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = memo(({
  data,
  barColor = '#3b82f6', // Un azul por defecto
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No hay datos disponibles.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3441" horizontal={false} />
        <XAxis type="number" stroke="#7a8394" />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#7a8394"
          width={110} // Más espacio para nombres largos
          tick={{ fontSize: 11 }}
          interval={0} // Mostrar todos los nombres
        />
        <Tooltip
          cursor={{ fill: 'rgba(122, 131, 148, 0.1)' }}
          content={<ChartTooltip />} // Usamos el tooltip personalizado si existe
        />
        <Bar dataKey="value" fill={barColor} barSize={25} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

HorizontalBarChart.displayName = 'HorizontalBarChart';
