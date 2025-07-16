import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMonthlyComparison } from '../../services/api';

interface MonthlyComparisonChartProps {
  currentYear: number;
  currentMonth: number;
  className?: string;
}

interface ComparisonData {
  category: string;
  [key: string]: string | number; // Permite propiedades dinámicas para los nombres de meses
}

interface FlowData {
  ticketsCarriedOver: number;
  description: string;
}

interface MonthlyComparisonResponse {
  comparison: ComparisonData[];
  flow: FlowData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ 
  currentYear, 
  currentMonth, 
  className = '' 
}) => {
  // Estado para los selectores de comparación (por defecto: mes actual vs mes anterior)
  const [compareMonth, setCompareMonth] = useState(() => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    return prevMonth;
  });
  
  const [compareYear, setCompareYear] = useState(() => {
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return prevYear;
  });

  // Query para obtener datos de comparación
  const { data: responseData, isLoading, isError } = useQuery<MonthlyComparisonResponse>({
    queryKey: ['monthlyComparison', currentMonth, currentYear, compareMonth, compareYear],
    queryFn: () => getMonthlyComparison(currentMonth, currentYear, compareMonth, compareYear),
    enabled: !!(currentMonth && currentYear && compareMonth && compareYear),
  });

  // Extraer datos del response
  const comparisonData = responseData?.comparison || [];
  const flowData = responseData?.flow;

  // Generar opciones para los selectores
  const months = useMemo(() => [
    { value: 1, name: 'Enero' }, { value: 2, name: 'Febrero' }, { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' }, { value: 5, name: 'Mayo' }, { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' }, { value: 8, name: 'Agosto' }, { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' }, { value: 11, name: 'Noviembre' }, { value: 12, name: 'Diciembre' }
  ], []);

  const years = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => currentYear - i), 
    [currentYear]
  );

  // Custom Tooltip
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-lg p-3 shadow-lg">
          <p className="text-[var(--text-primary)] font-medium mb-2">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value} tickets`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Manejar cambios en los selectores
  const handleCompareMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCompareMonth(parseInt(event.target.value, 10));
  };

  const handleCompareYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCompareYear(parseInt(event.target.value, 10));
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-[var(--bg-accent)] h-4 w-4"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-[var(--bg-accent)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--bg-accent)] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !responseData) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <p className="text-[var(--text-muted)]">Error al cargar el análisis de flujo mensual</p>
      </div>
    );
  }

  // Obtener las claves dinámicas para las barras
  const dataKeys = comparisonData.length > 0 
    ? Object.keys(comparisonData[0]).filter(key => key !== 'category')
    : [];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controles de comparación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--text-secondary)]">
          Comparando con:
        </div>
        <div className="flex items-center gap-2">
          <select
            value={compareMonth}
            onChange={handleCompareMonthChange}
            className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 border border-[var(--bg-accent)]/30 rounded text-sm focus:ring-1 focus:ring-[var(--accent-primary)]"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.name}
              </option>
            ))}
          </select>
          <select
            value={compareYear}
            onChange={handleCompareYearChange}
            className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 border border-[var(--bg-accent)]/30 rounded text-sm focus:ring-1 focus:ring-[var(--accent-primary)]"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información de flujo de tickets */}
      {flowData && (
        <div className="bg-[var(--bg-tertiary)]/30 rounded-lg p-4 border border-[var(--bg-accent)]/20">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[var(--info)]/20 flex items-center justify-center">
                <span className="text-[var(--info)] text-sm font-medium">↗</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Tickets que continuaron pendientes: {flowData.ticketsCarriedOver}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {flowData.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de barras */}
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={comparisonData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-accent)" opacity={0.3} />
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--bg-accent)' }}
              tickLine={{ stroke: 'var(--bg-accent)' }}
            />
            <YAxis 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--bg-accent)' }}
              tickLine={{ stroke: 'var(--bg-accent)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}
            />
            
            {/* Barras dinámicas basadas en los datos */}
            {dataKeys.map((key, index) => {
              // Asignar colores específicos para cada mes
              let fillColor;
              if (index === 0) {
                fillColor = 'var(--accent-primary)'; // Primer mes
              } else {
                fillColor = 'var(--accent-secondary)'; // Segundo mes
              }
              
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={fillColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(MonthlyComparisonChart); 