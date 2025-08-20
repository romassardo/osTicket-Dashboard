import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByAgentStats } from '../../services/api';
import BarChart from './BarChart';

interface TicketsByAgentChartProps {
  year: number;
  month: number;
}

interface ChartDataItem {
  name: string;
  value: number;
  fullName: string;
}

const TicketsByAgentChart: React.FC<TicketsByAgentChartProps> = ({ year, month }) => {
  const { data: agentStats, isLoading, isError } = useQuery({
    queryKey: ['ticketsByAgentStats', year, month],
    queryFn: () => getTicketsByAgentStats(year, month),
    enabled: !!year && month !== undefined && month !== null,
  });

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-96 flex items-center justify-center">
        <p className="text-red-500">Error al cargar los datos.</p>
      </div>
    );
  }

  const chartData: ChartDataItem[] = (agentStats || [])
    .map((agent: { agent_id: number; agent_name: string; ticket_count: number }) => ({
      name: agent.agent_name,
      value: agent.ticket_count,
      fullName: agent.agent_name,
    }))
    .sort((a: ChartDataItem, b: ChartDataItem) => b.value - a.value);

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
  const dynamicTitle = `Tickets por Agente (${monthName} ${year})`;

  return (
    <div>
      <h3 className="text-base font-medium text-[var(--text-primary)] mb-4">{dynamicTitle}</h3>
      {chartData.length > 0 ? (
        <BarChart data={chartData} height={400} showValues={true} />
      ) : (
        <div className="h-96 flex items-center justify-center">
          <p>No hay datos de tickets para este período.</p>
        </div>
      )}
    </div>
  );
};

export default TicketsByAgentChart;