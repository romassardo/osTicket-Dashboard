// frontend/src/components/charts/TicketsByTransportChart.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByTransport } from '../../services/api';
import { HorizontalBarChart } from './HorizontalBarChart';
import { Spinner } from '../ui/Spinner'; // Asumiendo que tenemos un spinner

interface TicketsByTransportChartProps {
  year: number;
  month: number;
}

export const TicketsByTransportChart: React.FC<TicketsByTransportChartProps> = ({ year, month }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ticketsByTransport', year, month],
    queryFn: () => getTicketsByTransport({ year, month }),
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
      <div className="flex items-center justify-center h-full text-red-500">
        Error al cargar los datos: {error.message}
      </div>
    );
  }

  return <HorizontalBarChart data={data || []} barColor="#8b5cf6" />;
};
