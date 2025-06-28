import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getTicketTrends } from '../../services/api';

interface TicketTrendsChartProps {
  year: number;
  month: number;
  className?: string;
}

interface TrendDataFromAPI {
  date: string;
  ticket_count: number;
}

interface ChartDataPoint {
  day: string;
  fullDate: string;
  created: number;
  closed?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const TicketTrendsChart: React.FC<TicketTrendsChartProps> = ({ year, month, className = '' }) => {


  const { data: trendsData, isLoading, isError, error } = useQuery({
    queryKey: ['ticketTrends', year, month],
    queryFn: () => getTicketTrends(year, month),
    enabled: !!year && month !== undefined && month !== null,
  });

  const transformData = (apiData: TrendDataFromAPI[]): ChartDataPoint[] => {
    if (!apiData || apiData.length === 0) return [];
    return apiData.map(item => ({
      day: item.date.split('-')[2],
      fullDate: item.date,
      created: item.ticket_count,
      closed: 0,
    }));
  };

  const chartData = trendsData && trendsData.length > 0 ? transformData(trendsData) : [];

  const averageTickets = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.created, 0);
    return Math.round((sum / data.length) * 10) / 10;
  };
  const avg = averageTickets(chartData);

  const peakDay = (data: ChartDataPoint[]): number => {
    if (!data || data.length === 0) return 0;
    return data.reduce((peak, item) => item.created > peak.created ? item : peak, data[0]).created;
  };
  const peak = peakDay(chartData);

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg shadow-lg p-3 text-sm">
          <p className="text-[var(--accent-primary)] font-medium mb-1">{data.fullDate}</p>
          <div className="flex items-center space-x-2 text-[var(--text-primary)]">
            <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></div>
            <p className="font-medium">{payload[0].value} tickets creados</p>
          </div>
          {avg > 0 && (
            <p className="text-[var(--text-muted)] text-xs mt-1">
              {payload[0].value > avg ? `+${Math.round((payload[0].value - avg) * 10) / 10} sobre el promedio`
                : payload[0].value < avg ? `-${Math.round((avg - payload[0].value) * 10) / 10} bajo el promedio`
                : 'Igual al promedio'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex justify-center items-center gap-6 mt-2 text-sm">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] mr-2"></div>
        <span className="text-[var(--text-secondary)]">Tickets Creados</span>
      </div>
      {avg > 0 && (
        <div className="flex items-center">
          <div className="w-6 h-[2px] bg-[var(--info)] mr-2 opacity-70"></div>
          <span className="text-[var(--text-muted)]">Promedio: {avg}</span>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <p className="text-[var(--text-muted)]">Cargando datos de tendencias...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <p className="text-[var(--error)]">Error al cargar: {error?.message}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <p className="text-[var(--text-muted)]">No hay datos para este período.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[350px] ${className}`}>
      {peak > 0 && (
        <div className="absolute top-0 right-0 bg-[var(--accent-secondary)]/20 px-3 py-1 rounded-md text-xs text-[var(--text-secondary)] z-10">
          Pico: Día {chartData.find(d => d.created === peak)?.day}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} padding={{ left: 20, right: 20 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={30} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Legend content={<CustomLegend />} verticalAlign="top" />
          {avg > 0 && (
            <ReferenceLine y={avg} stroke="var(--info)" strokeDasharray="3 3" strokeWidth={1.5} opacity={0.7} />
          )}
          <Line type="monotone" dataKey="created" stroke="var(--accent-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--accent-primary)', stroke: 'var(--bg-secondary)', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TicketTrendsChart;
