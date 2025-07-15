import React from 'react';

/**
 * Componentes de Skeleton Loading según DESIGN_GUIDE.md
 * Reemplazan los spinners básicos con placeholders que imitan el contenido
 */

// Skeleton para KPI Cards
export const SkeletonKPICard: React.FC = () => {
  return (
    <div className="group relative overflow-hidden bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10">
      {/* Efecto decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent transform -translate-y-16 translate-x-16"></div>
      
      <div className="flex justify-between items-start mb-4">
        {/* Encabezado con icono skeleton */}
        <div className="flex items-center">
          <div className="mr-3 flex-shrink-0 rounded-lg bg-[var(--bg-tertiary)] p-2 w-10 h-10 loading-shimmer"></div>
          <div>
            <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded loading-shimmer mb-1"></div>
            <div className="h-3 w-16 bg-[var(--bg-tertiary)] rounded loading-shimmer"></div>
          </div>
        </div>

        {/* Indicador de tendencia skeleton */}
        <div className="h-6 w-12 bg-[var(--bg-tertiary)] rounded-full loading-shimmer"></div>
      </div>

      {/* Valor principal skeleton */}
      <div className="h-8 w-20 bg-[var(--bg-tertiary)] rounded loading-shimmer"></div>
    </div>
  );
};

// Skeleton para Chart Cards
export const SkeletonChartCard: React.FC<{ height?: string }> = ({ height = "h-64" }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="w-2 h-6 bg-[var(--bg-tertiary)] rounded-sm mr-3 loading-shimmer"></div>
        <div className="h-6 w-32 bg-[var(--bg-tertiary)] rounded loading-shimmer"></div>
      </div>
      
      {/* Área del gráfico */}
      <div className={`${height} bg-[var(--bg-tertiary)] rounded-lg loading-shimmer relative overflow-hidden`}>
        {/* Elementos decorativos que simulan un gráfico */}
        <div className="absolute bottom-0 left-4 w-8 h-16 bg-[var(--bg-accent)] rounded-t loading-shimmer"></div>
        <div className="absolute bottom-0 left-16 w-8 h-24 bg-[var(--bg-accent)] rounded-t loading-shimmer"></div>
        <div className="absolute bottom-0 left-28 w-8 h-12 bg-[var(--bg-accent)] rounded-t loading-shimmer"></div>
        <div className="absolute bottom-0 left-40 w-8 h-20 bg-[var(--bg-accent)] rounded-t loading-shimmer"></div>
      </div>
    </div>
  );
};

// Skeleton para Header del Dashboard
export const SkeletonHeader: React.FC = () => {
  return (
    <div className="col-span-12 backdrop-blur-md bg-[var(--bg-secondary)]/80 rounded-xl p-6 mb-8 shadow-lg border border-[var(--bg-accent)]/20">
      <div className="flex items-center w-full">
        <div className="flex-1">
          <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded loading-shimmer mb-2"></div>
          <div className="h-4 w-36 bg-[var(--bg-tertiary)] rounded loading-shimmer"></div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Selector de fecha skeleton */}
          <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--bg-accent)]/30">
            <div className="h-8 w-20 bg-[var(--bg-accent)] rounded loading-shimmer"></div>
            <div className="h-8 w-16 bg-[var(--bg-accent)] rounded loading-shimmer"></div>
          </div>
          
          {/* Badge skeleton */}
          <div className="h-6 w-32 bg-[var(--bg-tertiary)] rounded-full loading-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton completo para Dashboard
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        
        {/* Header Skeleton */}
        <SkeletonHeader />

        {/* KPI Grid Skeleton */}
        <div className="kpi-grid">
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
        </div>

        {/* Analytics Grid Row 1 Skeleton */}
        <div className="analytics-grid-row-1">
          <SkeletonChartCard />
          <SkeletonChartCard />
        </div>

        {/* Analytics Grid Row 2 Skeleton */}
        <div className="analytics-grid-row-2">
          <div className="analytics-left-column">
            <SkeletonChartCard height="h-72" />
            <SkeletonChartCard height="h-64" />
          </div>
          <SkeletonChartCard height="h-[500px]" />
        </div>

      </div>
    </div>
  );
};

// Componente de Loading básico mejorado
interface LoadingProps {
  message?: string;
  variant?: 'spinner' | 'skeleton';
}

const Loading: React.FC<LoadingProps> = ({ 
  message = "Cargando datos...", 
  variant = "spinner" 
}) => {
  if (variant === 'skeleton') {
    return <SkeletonDashboard />;
  }

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex animate-pulse flex-col items-center">
        <div className="h-10 w-10 rounded-full bg-[var(--accent-primary)] loading-shimmer"></div>
        <div className="mt-4 text-[var(--text-secondary)]">{message}</div>
      </div>
    </div>
  );
};

export default Loading;
