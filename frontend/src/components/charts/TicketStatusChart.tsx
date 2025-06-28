import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Colores según DESIGN_GUIDE.md - Sistema de estados
const COLORS = {
  'Abiertos': '#06b6d4',     // info - Tickets en estado inicial
  'Abierto': '#06b6d4',      // Alias para compatibilidad
  'En Progreso': '#f59e0b',  // warning - Tickets siendo trabajados
  'Resueltos': '#10b981',    // success - Tickets completados
  'Resuelto': '#10b981',     // Alias para compatibilidad
  'Cerrados': '#6b7280',     // muted - Tickets finalizados
  'Cerrado': '#6b7280',      // Alias para compatibilidad
  'Vencidos': '#ef4444',     // error - Tickets críticos
  'Vencido': '#ef4444',      // Alias para compatibilidad
  'Pendientes': '#f59e0b',   // warning - Tickets esperando acción
  'Pendiente': '#f59e0b'     // Alias para compatibilidad
};

interface TicketStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string; // Opcional porque usaremos colores fijos
  }>;
}

// Función para obtener color por nombre (robusta y flexible)
const getColorByName = (name: string): string => {
  // DEBUG: Mostrar en consola qué nombres llegan
  console.log('🔍 DEBUG - Nombre recibido:', name);
  
  // Primero intentar coincidencia exacta
  if (COLORS[name as keyof typeof COLORS]) {
    console.log('✅ Color encontrado (exacto):', COLORS[name as keyof typeof COLORS]);
    return COLORS[name as keyof typeof COLORS];
  }
  
  // Normalizar el nombre (minúsculas, sin espacios extra)
  const normalizedName = name.toLowerCase().trim();
  
  // Mapeo flexible de nombres comunes
  const nameMapping: { [key: string]: string } = {
    'abierto': '#06b6d4',      // info - azul
    'abiertos': '#06b6d4',     
    'open': '#06b6d4',
    'nuevo': '#06b6d4',
    'nuevos': '#06b6d4',
    
    'cerrado': '#6b7280',      // muted - gris
    'cerrados': '#6b7280',
    'closed': '#6b7280',
    
    'resuelto': '#10b981',     // success - verde
    'resueltos': '#10b981',
    'resolved': '#10b981',
    'solucionado': '#10b981',
    
    'en proceso': '#f59e0b',   // warning - naranja
    'enproceso': '#f59e0b',
    'en_proceso': '#f59e0b',
    'progreso': '#f59e0b',
    'in progress': '#f59e0b',
    
    'vencido': '#ef4444',      // error - rojo
    'vencidos': '#ef4444',
    'overdue': '#ef4444',
    'atrasado': '#ef4444',
    
    'pendiente': '#f59e0b',    // warning - naranja
    'pendientes': '#f59e0b',
    'pending': '#f59e0b'
  };
  
  const color = nameMapping[normalizedName];
  if (color) {
    return color;
  }
  
  // Si no se encuentra, usar color por defecto
  return '#95A5A6'; // Gris por defecto
};

const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data }) => {
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className="h-full flex items-center justify-center min-h-[350px] bg-[#1a1f29] rounded-xl border border-[#2d3441]">
        <p className="text-[#7a8394] font-inter text-sm">No hay datos de estado para mostrar.</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-[350px] bg-[#1a1f29] rounded-xl border border-[#2d3441] p-6">
      {/* DEBUG: Mostrar datos recibidos */}
      <div className="absolute top-2 left-2 text-red-500 text-xs font-bold bg-yellow-300 px-2 py-1 rounded z-50">
        Datos: {data.map(d => d.name).join(', ')}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={80}
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
            paddingAngle={2}
          >
            {data.map((entry, index) => {
              const color = getColorByName(entry.name);
              console.log(`🎨 Aplicando color ${color} a segmento ${entry.name}`);
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={color}
                  stroke="none"
                  style={{ fill: color }} // Forzar color via style también
                />
              );
            })}
          </Pie>
          
          <Tooltip 
            formatter={(value: any, name: any) => [
              `${value.toLocaleString()} tickets (${((value / total) * 100).toFixed(1)}%)`, 
              name
            ]}
            contentStyle={{
              backgroundColor: '#252a35',
              border: '1px solid #2d3441',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              padding: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
            labelStyle={{ color: '#b8c5d6', marginBottom: '4px' }}
          />
          
          <Legend
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconSize={12}
            wrapperStyle={{ 
              right: -10, 
              top: '50%', 
              transform: 'translateY(-50%)',
              fontFamily: 'Inter, sans-serif'
            }}
            formatter={(value: any) => {
              const item = data.find(d => d.name === value);
              const percentage = total > 0 ? ((item?.value ?? 0) / total) * 100 : 0;
              return (
                <span 
                  className="text-sm font-medium ml-3" 
                  style={{ 
                    color: '#b8c5d6',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.875rem'
                  }}
                >
                  {value} ({percentage.toFixed(0)}%)
                </span>
              );
            }}
          />
          
          {/* Centro del donut según DESIGN_GUIDE.md - Centrado perfecto */}
          <text 
            x="50%" 
            y="45%" 
            textAnchor="middle" 
            dominantBaseline="central" 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: '500',
              fill: '#7a8394'
            }}
          >
            Total
          </text>
          <text 
            x="50%" 
            y="50%" 
            textAnchor="middle" 
            dominantBaseline="central" 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '2rem',
              fontWeight: '700',
              fill: '#ffffff'
            }}
          >
            {total.toLocaleString()}
          </text>
          <text 
            x="50%" 
            y="55%" 
            textAnchor="middle" 
            dominantBaseline="central" 
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem',
              fontWeight: '400',
              fill: '#7a8394'
            }}
          >
            tickets
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TicketStatusChart;
