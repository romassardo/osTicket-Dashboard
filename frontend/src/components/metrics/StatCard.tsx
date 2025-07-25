import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { TicketIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Componente KPI Card siguiendo la guía de diseño DESIGN_GUIDE.md
 * Implementa el sistema de tokens de diseño y microinteracciones
 * Con soporte para iconos, subtítulos y tendencias
 */
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: 'total' | 'open' | 'pending' | 'closed' | 'custom';
  iconCustom?: React.ReactNode;
  trend?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconCustom,
  trend,
  className = '' 
}) => {
  // Determinar si la tendencia es positiva o negativa
  const isTrendPositive = trend && trend.startsWith('+');
  const isTrendNegative = trend && trend.startsWith('-');
  
  // Seleccionar el icono apropiado basado en la prop icon
  const renderIcon = () => {
    switch (icon) {
      case 'total':
        return <TicketIcon className="h-6 w-6 text-[var(--accent-primary)]" />;
      case 'open':
        return <ExclamationTriangleIcon className="h-6 w-6 text-[var(--warning)]" />;
      case 'pending':
        return <ClockIcon className="h-6 w-6 text-[var(--info)]" />;
      case 'closed':
        return <CheckCircleIcon className="h-6 w-6 text-[var(--success)]" />;
      case 'custom':
        return iconCustom;
      default:
        return null;
    }
  };

  return (
    <div className={`group relative overflow-hidden bg-[var(--bg-secondary)] rounded-xl p-6 shadow-lg border border-[var(--bg-accent)]/10 hover:border-[var(--accent-primary)]/20 transition-all duration-300 ${className}`}>
      {/* Efecto decorativo en la tarjeta */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent transform -translate-y-16 translate-x-16 group-hover:translate-x-14 transition-all duration-500"></div>
      
      <div className="flex justify-between items-start mb-4">
        {/* Encabezado con icono */}
        <div className="flex items-center">
          {renderIcon() && (
            <div className="mr-3 flex-shrink-0 rounded-lg bg-[var(--bg-tertiary)] p-2 group-hover:scale-110 transition-transform duration-300">
              {renderIcon()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
          </div>
        </div>

        {/* Indicador de tendencia */}
        {trend && (
          <span 
            className={`flex items-center text-xs px-2 py-1 rounded-full 
              ${isTrendPositive ? 'text-[var(--success)] bg-[var(--success)]/10' : ''}
              ${isTrendNegative ? 'text-[var(--error)] bg-[var(--error)]/10' : ''}
              ${!isTrendPositive && !isTrendNegative ? 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]' : ''}
            `}
          >
            {isTrendPositive && <ArrowUpIcon className="h-3 w-3 mr-1" />}
            {isTrendNegative && <ArrowDownIcon className="h-3 w-3 mr-1" />}
            {trend}
          </span>
        )}
      </div>

      {/* Valor principal con animación de entrada */}
      <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] group-hover:translate-y-0 transform transition-all duration-300">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
};

export default StatCard;
