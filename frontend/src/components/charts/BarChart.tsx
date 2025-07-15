import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  height?: number;
  showValues?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ 
  data,
  title = "Gráfico de Barras",
  height = 300,
  showValues = false
}) => {
  return (
    <div className="chart-container">
      {title && (
        <h3 className="chart-title">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="var(--border-muted)"
            opacity={0.5}
          />
          <XAxis 
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-muted)',
              color: 'var(--text-primary)',
            }}
            labelStyle={{
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
            cursor={{
              fill: 'var(--accent-primary)',
              opacity: 0.1,
            }}
          />
          <Bar 
            dataKey="value" 
            fill="var(--accent-primary)"
            radius={[4, 4, 0, 0]}
            stroke="var(--accent-primary)"
            strokeWidth={1}
          >
            {showValues && (
              <LabelList 
                dataKey="value" 
                position="top" 
                fill="var(--text-primary)"
                fontSize={12}
                fontWeight={600}
              />
            )}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
