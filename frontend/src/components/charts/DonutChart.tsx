import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Colores fijos para evitar problemas de caché o CSS
const COLORS = {
  'Abierto': '#FF6B6B',      // Rojo brillante
  'Cerrado': '#4ECDC4',      // Verde azulado
  'Resuelto': '#45B7D1',     // Azul cielo
  'Vencido': '#FFA726',      // Naranja
  'Pendiente': '#AB47BC',    // Púrpura
  'En Proceso': '#66BB6A'    // Verde
};

// Interfaz simple para el componente
interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  isLoading?: boolean;
}

// Función para obtener color por nombre
const getColorByName = (name: string): string => {
  return COLORS[name as keyof typeof COLORS] || '#95A5A6'; // Gris por defecto
};

const DonutChart: React.FC<DonutChartProps> = ({ data, title = "Distribución de Tickets", isLoading = false }) => {
  
  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: 300 }}>
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  // Mostrar estado vacío
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: 300 }}>
          <p className="text-gray-500">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }
  
  // Calcular total para el tooltip
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Renderizar el gráfico
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColorByName(entry.name)}
                />
              ))}
            </Pie>
            
            <Tooltip 
              formatter={(value: any, name: any) => [`${value} tickets (${((value / total) * 100).toFixed(1)}%)`, name]}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '6px',
                color: 'white'
              }}
            />
            
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total:</span>
          <span className="font-medium">{total} tickets</span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
