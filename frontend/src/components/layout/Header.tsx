import React from 'react';
import { useSound } from '../../context/SoundContext';
import { ArrowPathIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

/**
 * Header del Dashboard — Obsidian Executive Design
 * Refined corporate header with premium controls
 */
const Header: React.FC = () => {
  const { isSoundEnabled, toggleSound } = useSound();
  const [lastUpdate, setLastUpdate] = React.useState(new Date());
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdate(new Date());
    setCurrentTime(new Date());
    
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 500);
  };

  const formatLastUpdate = (date: Date) => {
    const diffInMinutes = Math.floor((currentTime.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'hace menos de 1 min';
    if (diffInMinutes === 1) return 'hace 1 min';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return 'hace 1 hora';
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    return date.toLocaleDateString('es-ES');
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="dashboard-header" role="banner" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="header-left">
        <h1 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.3 }}>
          Panel de Control
        </h1>
        <span 
          className="text-small" 
          style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
          role="status"
          aria-live="polite"
        >
          Actualizado {formatLastUpdate(lastUpdate)}
        </span>
      </div>
      
      <div className="header-right">
        {/* Refresh Button */}
        <button 
          onClick={handleRefresh}
          className="header-button"
          disabled={isRefreshing}
          title="Refrescar datos del dashboard"
          aria-label="Refrescar datos del dashboard"
          style={{ 
            opacity: isRefreshing ? 0.6 : 1,
            cursor: isRefreshing ? 'not-allowed' : 'pointer'
          }}
        >
          <ArrowPathIcon 
            className={`header-button-icon ${isRefreshing ? 'spinning' : ''}`}
          />
          <span>{isRefreshing ? 'Actualizando...' : 'Refrescar'}</span>
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="header-button"
          title={`Cambiar a modo ${resolvedTheme === 'dark' ? 'claro' : 'oscuro'}`}
          aria-label={`Cambiar a modo ${resolvedTheme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {resolvedTheme === 'dark' ? (
            <SunIcon className="header-button-icon" />
          ) : (
            <MoonIcon className="header-button-icon" />
          )}
          <span>{resolvedTheme === 'dark' ? 'Claro' : 'Oscuro'}</span>
        </button>

        {/* Sound Toggle */}
        <button 
          className="header-button" 
          title={isSoundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
          aria-label={isSoundEnabled ? 'Desactivar sonido de notificaciones' : 'Activar sonido de notificaciones'}
          onClick={toggleSound}
        >
          {isSoundEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="header-button-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="header-button-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 6.036H12a14.25 14.25 0 0 0-6.38 1.242m6.38-1.242a14.25 14.25 0 0 1 6.38 1.242m-6.38-1.242a14.25 14.25 0 0 0-6.38-1.242m12.76 0a14.25 14.25 0 0 1 0 11.928M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          )}
        </button>

        {/* Status */}
        <div className="status-indicator-container" role="status" aria-label="Estado del sistema" style={{ background: 'var(--bg-tertiary)', padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          <div className="status-dot" aria-hidden="true" style={{ width: 6, height: 6 }}></div>
          <span className="status-text" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Soporte IT</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
