import React from 'react';

interface TicketStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

/**
 * Gráfico de distribución por estado siguiendo DESIGN_GUIDE.md
 * Implementa barras horizontales con animaciones y sistema de tokens
 */
const TicketStatusChart: React.FC<TicketStatusChartProps> = ({ data }) => {
  // Total de tickets para calcular porcentajes
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container" style={{
      background: '#1a1f29',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      minHeight: '350px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 className="chart-title" style={{ color: '#f8fafc', marginBottom: '24px' }}>
        Distribución de Tickets por Estado (Junio 2025)
      </h2>

      <div className="chart-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Gráfico de Dona */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {(() => {
              let cumulativePercentage = 0;
              const radius = 70;
              const strokeWidth = 25;
              const center = 100;
              const circumference = 2 * Math.PI * radius;
              
              return data.map((item, index) => {
                let percentage = total > 0 ? (item.value / total) * 100 : 0;
                
                // Asegurar que cada segmento sea visible (mínimo 3% para visibilidad)
                const minVisiblePercentage = 3;
                const displayPercentage = Math.max(percentage, minVisiblePercentage);
                
                const strokeDasharray = `${(displayPercentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
                
                // Actualizar para la siguiente iteración (usar el porcentaje real, no el de display)
                const currentOffset = strokeDashoffset;
                cumulativePercentage += displayPercentage;
                
                return (
                  <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={currentOffset}
                    strokeLinecap="round"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: `${center}px ${center}px`,
                      transition: 'stroke-dasharray 1s ease-in-out',
                      opacity: 0.95
                    }}
                  />
                );
              });
            })()}
            
            {/* Círculo de fondo */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="25"
            />
            
            {/* Total en el centro */}
            <text x="100" y="95" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">
              TOTAL
            </text>
            <text x="100" y="115" textAnchor="middle" fill="#f8fafc" fontSize="24" fontWeight="700">
              {total.toLocaleString()}
            </text>
          </svg>
        </div>
        
        {/* Leyenda horizontal */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
            
            return (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: item.color
                  }}></div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#e2e8f0'
                  }}>{item.name}</span>
                </div>
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1
                  }}>{percentage}%</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>({item.value.toLocaleString()})</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TicketStatusChart;
