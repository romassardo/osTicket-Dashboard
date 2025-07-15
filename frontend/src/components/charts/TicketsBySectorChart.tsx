import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsBySectorStats } from '../../services/api';
import { HorizontalBarChart } from './HorizontalBarChart';
import { Spinner } from '../ui/Spinner';

interface TicketsBySectorChartProps {
  year: number;
  month: number;
  className?: string;
}

const TicketsBySectorChart: React.FC<TicketsBySectorChartProps> = ({ year, month, className }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ticketsBySector', year, month],
    queryFn: () => getTicketsBySectorStats({ year, month }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[800px] text-red-500">
        Error: {error instanceof Error ? error.message : 'Error desconocido'}
      </div>
    );
  }

  // Calcular altura dinámica basada en número de sectores
  const sectorCount = data?.length || 0;
  const barHeight = 35; // Altura por barra incluyendo espaciado
  const margins = 60; // Margen superior e inferior
  const dynamicHeight = Math.max(300, sectorCount * barHeight + margins);

  return (
    <div className={`h-[800px] ${className}`}>
      {/* Contenedor con scroll */}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        {/* Gráfico con altura dinámica */}
        <div style={{ height: `${dynamicHeight}px`, minHeight: '800px' }}>
          <HorizontalBarChart data={data || []} barColor="#10b981" />
        </div>
      </div>
    </div>
  );
};

export default TicketsBySectorChart; 