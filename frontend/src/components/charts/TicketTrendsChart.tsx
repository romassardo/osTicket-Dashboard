import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getTicketTrends } from '../../services/api';

interface TicketTrendsChartProps {
  year: number;
  month: number;
  className?: string;
}

// Interfaces para los datos recibidos desde la API y para los datos transformados
interface TrendDataFromAPI {
  date: string;
  ticket_count: number;
}

interface ChartDataPoint {
  day: string;
  fullDate: string;
  created: number;
  closed?: number; // Preparado para futuros datos de tickets cerrados
}

/**
 * Componente de gráfico de tendencias para visualizar tickets creados diariamente
 * Diseño moderno basado en las directrices de DESIGN_GUIDE.md
 */
const TicketTrendsChart: React.FC<TicketTrendsChartProps> = ({ year, month, className = '' }) => {
  // Estado para hover en días específicos
  const [activeDay, setActiveDay] = useState<number | null>(null);
  
  // Obtener datos de tendencias
  const { data: trendsData, isLoading, isError, error } = useQuery({
    queryKey: ['ticketTrends', year, month],
    queryFn: () => getTicketTrends(year, month),
    enabled: !!year && month !== undefined && month !== null, // Permitir month = 0 (enero)
  });

  // Calcular el promedio de tickets para mostrar una línea de referencia
  const calculateAverage = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.created, 0);
    return Math.round((sum / data.length) * 10) / 10; // Redondear a 1 decimal
  };
  
  // Encontrar el día con más tickets para resaltarlo
  const findPeakDay = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    let maxTickets = 0;
    let peakDay = 0;
    
    data.forEach(item => {
      if (item.created > maxTickets) {
        maxTickets = item.created;
        peakDay = parseInt(item.day);
      }
    });
    
    return peakDay;
  };

  // Transformar los datos recibidos de la API al formato que espera el gráfico
  const transformData = (apiData: TrendDataFromAPI[]): ChartDataPoint[] => {
    if (!apiData || apiData.length === 0) return [];
    
    return apiData.map(item => {
      // Extraer solo el día de la fecha (formato: 2025-06-XX)
      const day = item.date.split('-')[2];
      
      return {
        day,
        fullDate: item.date,
        created: item.ticket_count,
        closed: 0 // Por ahora no tenemos datos de tickets cerrados
      };
    });
  };

  const chartData = trendsData && trendsData.length > 0 ? transformData(trendsData) : [];
  const averageTickets = calculateAverage(chartData);
  const peakDay = findPeakDay(chartData);

  // Componente de tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg shadow-lg p-3 text-sm">
          <p className="text-[var(--accent-primary)] font-medium mb-1">
            {data.fullDate}
          </p>
          <div className="flex items-center space-x-2 text-[var(--text-primary)]">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></div>
            <p className="font-medium">{payload[0].value} tickets creados</p>
          </div>
          {averageTickets > 0 && (
            <p className="text-[var(--text-muted)] text-xs mt-1">
              {payload[0].value > averageTickets 
                ? `+${Math.round((payload[0].value - averageTickets) * 10) / 10} sobre el promedio` 
                : payload[0].value < averageTickets 
                  ? `-${Math.round((averageTickets - payload[0].value) * 10) / 10} bajo el promedio`
                  : 'Igual al promedio'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Renderizador personalizado de la leyenda
  const renderLegend = (props: any) => {
    return (
      <div className="flex justify-center items-center gap-6 mt-2 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] mr-2"></div>
          <span className="text-[var(--text-secondary)]">Tickets Creados</span>
        </div>
        {averageTickets > 0 && (
          <div className="flex items-center">
            <div className="w-6 h-[2px] bg-[var(--info)] mr-2 opacity-70"></div>
            <span className="text-[var(--text-muted)]">Promedio: {averageTickets}</span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-[var(--bg-secondary)] rounded-xl p-4 shadow-md h-full ${className}`}>
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Tendencia de Tickets</h3>
        <div className="h-72 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"></div>
          <p className="text-[var(--text-secondary)] text-sm">Cargando datos de tendencias...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`bg-[var(--bg-secondary)] rounded-xl p-4 shadow-md h-full ${className}`}>
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Tendencia de Tickets</h3>
        <div className="h-72 flex flex-col items-center justify-center">
          <div className="text-[var(--error)] bg-[var(--error)]/10 px-4 py-3 rounded-lg max-w-md">
            <p className="font-medium">Error al cargar datos</p>
            <p className="text-sm opacity-80 mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay datos para mostrar
  if (chartData.length === 0) {
    return (
      <div className={`bg-[var(--bg-secondary)] rounded-xl p-4 shadow-md h-full ${className}`}>
        <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">Tendencia de Tickets</h3>
        <div className="h-72 flex items-center justify-center">
          <p className="text-[var(--text-muted)] text-center max-w-xs">
            No hay datos de tickets para este período.<br/>
            <span className="text-sm block mt-2">Intenta seleccionar un período diferente.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--bg-secondary)] rounded-xl p-4 shadow-md h-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">Tendencia de Tickets</h3>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-full">
          {`${month}/${year}`}
        </div>
      </div>
      
      <div className="relative">
        {/* Indicador de día con más tickets */}
        {peakDay > 0 && (
          <div className="absolute top-0 right-0 bg-[var(--accent-secondary)]/20 px-3 py-1 rounded-md text-xs text-[var(--text-secondary)] z-10">
            Pico: Día {peakDay}
          </div>
        )}
        
        <div className="w-full h-[300px] relative group transition-all duration-300">
          {/* Fondo decorativo con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/5 to-transparent rounded-lg opacity-50 pointer-events-none"></div>
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              onMouseMove={(e) => {
                if (e.activeTooltipIndex !== undefined) {
                  setActiveDay(parseInt(chartData[e.activeTooltipIndex]?.day || '0'));
                }
              }}
              onMouseLeave={() => setActiveDay(null)}
            >
              <defs>
                {/* Definición de gradientes para las líneas */}
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                stroke="var(--bg-accent)" 
                strokeDasharray="3 3" 
                vertical={false}
                opacity={0.5}
              />
              
              <XAxis 
                dataKey="day" 
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--bg-accent)' }}
                tickLine={{ stroke: 'var(--bg-accent)' }}
                label={{ 
                  value: 'Día del mes', 
                  position: 'insideBottom', 
                  offset: -10,
                  fill: 'var(--text-muted)',
                  fontSize: 12
                }} 
              />
              
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--bg-accent)' }}
                tickLine={{ stroke: 'var(--bg-accent)' }}
                width={30}
              />
              
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'var(--accent-secondary)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                  opacity: 0.7
                }}
              />
              
              <Legend 
                content={renderLegend}
                verticalAlign="top"
              />
              
              {/* Línea de referencia para el promedio */}
              {averageTickets > 0 && (
                <ReferenceLine 
                  y={averageTickets} 
                  stroke="var(--info)" 
                  strokeDasharray="3 3" 
                  strokeWidth={1.5}
                  opacity={0.7}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="var(--accent-primary)" 
                strokeWidth={2.5}
                name="Creados" 
                dot={(props) => {
                  // Renderizado condicional para los puntos
                  const { cx, cy, payload } = props;
                  const day = parseInt(payload.day);
                  const isActive = activeDay === day;
                  const isPeak = day === peakDay;
                  
                  // Destacar el día con más tickets o el día activo
                  if (isActive || isPeak) {
                    return (
                      <circle 
                        key={`dot-${day}`}
                        cx={cx} 
                        cy={cy} 
                        r={isActive ? 6 : isPeak ? 5 : 4}
                        fill={isPeak ? 'var(--accent-secondary)' : 'var(--accent-primary)'}
                        stroke="var(--bg-secondary)"
                        strokeWidth={2}
                        className="transition-all duration-300"
                      />
                    );
                  }
                  
                  // Puntos normales más sutiles
                  return (
                    <circle 
                      key={`dot-${day}`}
                      cx={cx} 
                      cy={cy} 
                      r={3}
                      fill="var(--accent-primary)"
                      opacity={0.7}
                    />
                  );
                }}
                activeDot={{
                  r: 7,
                  stroke: 'var(--bg-secondary)',
                  strokeWidth: 2,
                  fill: 'var(--accent-primary)',
                }}
                // Área bajo la curva con gradiente
                fill="url(#colorCreated)"
                fillOpacity={0.2}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Overlay para efecto hover */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[var(--bg-accent)]/40 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
        </div>
      </div>
    </div>
  );
};

export default TicketTrendsChart;
