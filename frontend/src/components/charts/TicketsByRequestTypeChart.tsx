import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByRequestType } from '../../services/api';
import { Spinner } from '../ui/Spinner';

interface TicketsByRequestTypeChartProps {
  year: number;
  month: number;
}

interface ChartItem {
  name: string;
  value: number;
}

export const TicketsByRequestTypeChart: React.FC<TicketsByRequestTypeChartProps> = ({ year, month }) => {
  const { data, isLoading, isError, error } = useQuery<ChartItem[]>({
    queryKey: ['ticketsByRequestType', year, month],
    queryFn: () => getTicketsByRequestType({ year, month }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 text-sm">
        Error al cargar: {(error as Error).message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Sin datos de tipo de solicitud para este período
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-2">
      {data.map((item, i) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const totalPct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
        return (
          <div key={item.name} className="group flex items-center gap-3">
            <div className="w-[180px] min-w-[180px] text-right">
              <span className="text-xs text-gray-400 dark:text-gray-400 leading-tight truncate block" title={item.name}>
                {item.name}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700/40 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: i === 0 ? '#f59e0b' : i < 3 ? '#fbbf24' : '#fcd34d',
                    opacity: 1 - (i * 0.025),
                  }}
                />
              </div>
              <div className="w-[70px] min-w-[70px] text-right">
                <span className="text-sm font-semibold text-gray-200">{item.value}</span>
                <span className="text-[10px] text-gray-500 ml-1">({totalPct}%)</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
