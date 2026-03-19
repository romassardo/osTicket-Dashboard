import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { TicketIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Tooltip } from '../ui/Tooltip';

/**
 * KPI Card — Obsidian Executive Design
 * Premium metric cards with left accent border and refined hierarchy
 */
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: 'total' | 'open' | 'pending' | 'closed' | 'custom';
  iconCustom?: React.ReactNode;
  trend?: string;
  className?: string;
  tooltip?: string;
}

const iconAccentMap: Record<string, string> = {
  total: 'var(--accent-primary)',
  open: 'var(--warning)',
  pending: 'var(--info)',
  closed: 'var(--success)',
};

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconCustom,
  trend,
  className = '',
  tooltip
}) => {
  const isTrendPositive = trend && trend.startsWith('+');
  const isTrendNegative = trend && trend.startsWith('-');
  const accentColor = icon ? iconAccentMap[icon] || 'var(--accent-primary)' : 'var(--accent-primary)';
  
  const renderIcon = () => {
    const iconClass = "h-5 w-5";
    switch (icon) {
      case 'total':
        return <TicketIcon className={iconClass} style={{ color: accentColor }} />;
      case 'open':
        return <ExclamationTriangleIcon className={iconClass} style={{ color: accentColor }} />;
      case 'pending':
        return <ClockIcon className={iconClass} style={{ color: accentColor }} />;
      case 'closed':
        return <CheckCircleIcon className={iconClass} style={{ color: accentColor }} />;
      case 'custom':
        return iconCustom;
      default:
        return null;
    }
  };

  const titleContent = (
    <div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 400 }}>{subtitle}</p>}
    </div>
  );

  return (
    <div 
      className={`group relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.borderLeftColor = accentColor;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.borderLeftColor = accentColor;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {renderIcon() && (
            <div 
              className="flex-shrink-0 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
              style={{ 
                width: 36, height: 36,
                background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
              }}
            >
              {renderIcon()}
            </div>
          )}
          {tooltip ? (
            <Tooltip text={tooltip} position="below">
              {titleContent}
            </Tooltip>
          ) : (
            titleContent
          )}
        </div>

        {trend && (
          <span 
            className="flex items-center"
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              color: isTrendPositive ? 'var(--success)' : isTrendNegative ? 'var(--error)' : 'var(--text-muted)',
              background: isTrendPositive ? 'color-mix(in srgb, var(--success) 10%, transparent)' : isTrendNegative ? 'color-mix(in srgb, var(--error) 10%, transparent)' : 'var(--bg-tertiary)',
            }}
          >
            {isTrendPositive && <ArrowUpIcon className="h-3 w-3 mr-0.5" />}
            {isTrendNegative && <ArrowDownIcon className="h-3 w-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>

      <div 
        className="font-display"
        style={{ 
          fontSize: '1.75rem', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
};

export default StatCard;
