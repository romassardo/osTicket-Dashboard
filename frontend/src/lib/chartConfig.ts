/**
 * Configuración profesional de gráficos según DESIGN_GUIDE.md
 * Configuraciones específicas para Recharts con animaciones y estilos optimizados
 */

// Configuración base para todos los gráficos
export const baseChartConfig = {
  // Configuración de animación según DESIGN_GUIDE.md
  animationDuration: 750,
  animationEasing: 'easeInOutQuart',
  
  // Configuración de responsive
  responsive: true,
  maintainAspectRatio: false,
  
  // Colores de grid y fondo
  backgroundColor: 'transparent',
  gridColor: 'rgba(255, 255, 255, 0.1)',
  
  // Configuración de líneas
  lineWidth: 3,
  tension: 0.3, // Curvas suaves
  
  // Configuración de puntos
  pointRadius: 0,
  pointHoverRadius: 6,
  
  // Configuración de barras
  barBorderRadius: 4,
  barBorderWidth: 0,
};

// Configuración específica para PieChart/DonutChart
export const pieChartConfig = {
  ...baseChartConfig,
  innerRadius: 60,
  outerRadius: 120,
  paddingAngle: 2,
  cornerRadius: 4,
  
  // Configuración de labels
  labelLine: false,
  label: false,
  
  // Animación de entrada
  animationBegin: 0,
  animationDuration: 800,
};

// Configuración para LineChart
export const lineChartConfig = {
  ...baseChartConfig,
  strokeWidth: 3,
  strokeDasharray: 'none',
  connectNulls: false,
  
  // Configuración de área (si se usa AreaChart)
  fillOpacity: 0.1,
  
  // Configuración de grid
  grid: {
    stroke: 'rgba(255, 255, 255, 0.1)',
    strokeDasharray: '3 3',
  },
};

// Configuración para BarChart
export const barChartConfig = {
  ...baseChartConfig,
  barCategoryGap: '20%',
  barGap: 4,
  
  // Configuración de barras
  fill: 'var(--accent-primary)',
  radius: [4, 4, 0, 0],
};

// Configuración para AreaChart
export const areaChartConfig = {
  ...lineChartConfig,
  fillOpacity: 0.2,
  stackOffset: 'none',
};

// Configuración de colores según DESIGN_GUIDE.md
export const chartColors = {
  primary: 'var(--accent-primary)',      // #00d9ff
  secondary: 'var(--accent-secondary)',  // #7c3aed
  success: 'var(--success)',             // #10b981
  warning: 'var(--warning)',             // #f59e0b
  error: 'var(--error)',                 // #ef4444
  info: 'var(--info)',                   // #06b6d4
  muted: 'var(--text-muted)',            // #7a8394
  
  // Paleta extendida para múltiples series
  palette: [
    'var(--accent-primary)',   // #00d9ff
    'var(--accent-secondary)', // #7c3aed
    'var(--success)',          // #10b981
    'var(--warning)',          // #f59e0b
    'var(--info)',             // #06b6d4
    'var(--error)',            // #ef4444
    '#06b6d4',                 // cyan-500
    '#8b5cf6',                 // violet-500
    '#ec4899',                 // pink-500
    '#f59e0b',                 // amber-500
  ],
  
  // Estados específicos para tickets
  ticketStatus: {
    open: 'var(--status-open)',         // #fbbf24
    closed: 'var(--status-closed)',     // #6b7280
    resolved: 'var(--status-resolved)', // #10b981
    pending: 'var(--status-pending)',   // #f59e0b
  },
};

// Configuración de tooltip personalizado
export const tooltipConfig = {
  contentStyle: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)',
  },
  cursor: {
    stroke: 'rgba(0, 217, 255, 0.3)',
    strokeWidth: 1,
  },
  itemStyle: {
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
  },
  labelStyle: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    marginBottom: '4px',
  },
};

// Configuración de leyenda
export const legendConfig = {
  iconType: 'circle' as const,
  wrapperStyle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '16px',
  },
  iconSize: 8,
  layout: 'horizontal' as const,
  align: 'center' as const,
  verticalAlign: 'bottom' as const,
};

// Configuración de ejes
export const axisConfig = {
  xAxis: {
    axisLine: false,
    tickLine: false,
    tick: {
      fontSize: 12,
      fill: 'var(--text-muted)',
    },
    tickMargin: 8,
  },
  yAxis: {
    axisLine: false,
    tickLine: false,
    tick: {
      fontSize: 12,
      fill: 'var(--text-muted)',
    },
    tickMargin: 8,
    width: 50,
  },
};

// Configuración para gráficos responsivos
export const responsiveConfig = {
  mobile: {
    fontSize: 10,
    margin: { top: 5, right: 5, left: 5, bottom: 5 },
    innerRadius: 40,
    outerRadius: 80,
  },
  tablet: {
    fontSize: 12,
    margin: { top: 10, right: 10, left: 10, bottom: 10 },
    innerRadius: 50,
    outerRadius: 100,
  },
  desktop: {
    fontSize: 14,
    margin: { top: 20, right: 20, left: 20, bottom: 20 },
    innerRadius: 60,
    outerRadius: 120,
  },
};

// Helper function para aplicar configuración responsive
export const getResponsiveConfig = () => {
  if (typeof window === 'undefined') return responsiveConfig.desktop;
  
  const width = window.innerWidth;
  if (width < 768) return responsiveConfig.mobile;
  if (width < 1024) return responsiveConfig.tablet;
  return responsiveConfig.desktop;
};

// Configuración de animaciones específicas para cada tipo de gráfico
export const animationConfigs = {
  slideInFromLeft: {
    animationBegin: 0,
    animationDuration: 750,
    animationEasing: 'ease-out',
  },
  fadeIn: {
    animationBegin: 200,
    animationDuration: 600,
    animationEasing: 'ease-in-out',
  },
  scaleUp: {
    animationBegin: 100,
    animationDuration: 800,
    animationEasing: 'ease-out',
  },
};

export default {
  baseChartConfig,
  pieChartConfig,
  lineChartConfig,
  barChartConfig,
  areaChartConfig,
  chartColors,
  tooltipConfig,
  legendConfig,
  axisConfig,
  responsiveConfig,
  getResponsiveConfig,
  animationConfigs,
}; 