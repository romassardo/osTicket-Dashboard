import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByAgentStats } from '../../services/api';
import BarChart from './BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

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
      <Card>
        <CardHeader>
          <CardTitle>Tickets por Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <p>Cargando datos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tickets por Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <p className="text-red-500">Error al cargar los datos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDataItem[] = (agentStats || [])
    .map((agent: { firstname: string; lastname: string; ticket_count: number }) => ({
      name: `${agent.firstname || ''} ${(agent.lastname || '').charAt(0) || ''}.`.trim(),
      value: agent.ticket_count,
      fullName: `${agent.firstname || ''} ${agent.lastname || ''}`.trim(),
    }))
    .sort((a: ChartDataItem, b: ChartDataItem) => b.value - a.value);

  const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
  const dynamicTitle = `Tickets por Agente (${monthName} ${year})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dynamicTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <BarChart data={chartData} height={400} />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <p>No hay datos de tickets para este período.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketsByAgentChart;