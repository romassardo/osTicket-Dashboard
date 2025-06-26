import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define la estructura de las props que el componente espera
interface TicketStatusChartProps {
  data: {
    Open?: number;
    Closed?: number;
  };
}

// Colores para el gráfico
const COLORS = {
  Open: '#3b82f6',    // Azul para tickets abiertos
  Closed: '#10b981',  // Verde para tickets cerrados
};

// Componente de gráfico circular simple y directo
const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data }) => {
  // Transformamos los datos al formato requerido por recharts
  const chartData = [
    { name: 'Abiertos', value: data.Open || 0 },
    { name: 'Cerrados', value: data.Closed || 0 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Distribución de Tickets por Estado
      </h3>
      
      {/* Contenedor con altura absolutamente fija */}
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name === 'Abiertos' ? 'Open' : 'Closed']} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}`, 'Tickets']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TicketStatusChart;
