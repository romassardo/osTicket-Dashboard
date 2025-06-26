import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

/**
 * Representa un gráfico de torta/dona con diseño moderno que visualiza 
 * distribución de datos en categorías.
 */
interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// Renderizador personalizado para el segmento activo en la torta
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 11;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Segmento activo con efecto de resaltado */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5} // Efecto de expansión
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
      
      {/* Crea un resplandor exterior sutil */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 8}
        fill="none"
        stroke={fill}
        strokeWidth={1}
        strokeOpacity={0.5}
      />
      
      {/* Línea y etiqueta del porcentaje */}
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="var(--text-secondary)" fontSize="13px">{`${payload.name} ${(percent * 100).toFixed(0)}%`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="var(--text-muted)" fontSize="11px">{`(${value})`}</text>
    </g>
  );
};

/**
 * Componente de gráfico de dona moderno para visualizar distribuciones
 * Con soporte para interacciones y animaciones según DESIGN_GUIDE
 */
const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  height = 350, // Aumentamos el tamaño ligeramente para acomodar nuevas funciones
  showLegend = true,
  showTooltip = true,
  legendPosition = 'bottom',
}) => {
  // Estado para rastrear segmento activo
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  
  // Si no hay datos o son todos ceros, mostrar un mensaje
  const hasValidData = data.some(item => item.value > 0);
  
  // Asegurarnos que tenemos al menos un dato para mostrar
  const dataWithTotal = !hasValidData ? [
    { name: 'Sin datos', value: 1, color: 'var(--bg-accent)' }
  ] : data;

  // Calcular el total para mostrar porcentajes
  const total = dataWithTotal.reduce((sum, item) => sum + item.value, 0);
  
  // Función para renderizar etiquetas de leyenda personalizadas
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className="recharts-legend flex flex-wrap justify-center gap-3 mt-4 text-[var(--text-secondary)]">
        {payload.map((entry: any, index: number) => {
          const item = dataWithTotal.find(d => d.name === entry.value);
          const percentage = item ? ((item.value / total) * 100).toFixed(1) : '0';
          const isActive = index === activeIndex;
          
          return (
            <div 
              key={`legend-item-${index}`} 
              className={`flex items-center px-2 py-1 rounded-md transition-all duration-300 ${isActive ? 'bg-[var(--bg-tertiary)] shadow-md' : 'hover:bg-[var(--bg-tertiary)]'}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <span 
                className={`inline-block w-3 h-3 rounded-full mr-2 ${isActive ? 'shadow-lg' : ''}`}
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.value} 
                <span className="text-[var(--text-muted)] ml-1">({percentage}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col">
      {title && (
        <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">{title}</h3>
      )}
      
      <div className="donut-chart-wrapper flex-1 relative group">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              innerRadius={60} // Base fija para el radio interno
              outerRadius={100} // Base fija para el radio externo
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              // Animación más suave
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                // Solo mostrar etiqueta si el porcentaje es significativo (mayor al 5%) y no es el segmento activo
                if (percent < 0.05 || index === activeIndex) return null;
                
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="var(--text-primary)" 
                    textAnchor="middle" 
                    dominantBaseline="central"
                    fontWeight="600"
                    fontSize="11px"
                    fillOpacity={0.85}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || `var(--${hasValidData ? 'accent' : 'bg'}-primary)`}
                  // Efecto de transición suave
                  className="transition-opacity duration-300"
                  style={{
                    filter: activeIndex === index ? 'drop-shadow(0 0 3px rgba(255,255,255,0.3))' : 'none',
                    opacity: activeIndex === -1 || activeIndex === index ? 1 : 0.6
                  }} 
                />
              ))}
            </Pie>
            
            {showTooltip && (
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--bg-accent)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  padding: '0.5rem 0.75rem',
                }}
                formatter={(value: number, name: string) => [
                  <span className="font-medium text-[var(--text-primary)]">{value} <span className="text-[var(--text-secondary)] font-normal">({((value / total) * 100).toFixed(1)}%)</span></span>,
                  <span className="text-[var(--accent-primary)]">{name}</span>
                ]}
              />
            )}
            
            {showLegend && (
              <Legend 
                content={renderLegend}
                verticalAlign={legendPosition === 'top' || legendPosition === 'bottom' ? legendPosition : 'middle'} 
                align={legendPosition === 'left' || legendPosition === 'right' ? legendPosition : 'center'}
                layout="horizontal"
                wrapperStyle={{
                  paddingTop: legendPosition === 'bottom' ? '10px' : '0px',
                  paddingBottom: legendPosition === 'top' ? '10px' : '0px',
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Efecto decorativo para el gráfico */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[var(--accent-secondary)]/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"></div>
      </div>
      
      {/* Centro del donut con total */}
      <div className="donut-center">
        <div className="donut-total">
          <span className="donut-number">{total}</span>
          <span className="donut-label">Total</span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
