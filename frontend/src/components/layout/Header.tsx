import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Header del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa la estructura de header con sistema de tokens y accesibilidad
 */
const Header: React.FC = () => {
  const [lastUpdate, setLastUpdate] = React.useState(new Date());
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdate(new Date());
    setCurrentTime(new Date());
    
    // Simular tiempo de recarga mínimo para UX
    setTimeout(() => {
      setIsRefreshing(false);
      // Aquí se podría disparar un evento global para refrescar datos
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

  // Actualizar el tiempo cada minuto para mantener la información fresca
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-left">
        <h1 className="text-h1" style={{ color: 'var(--text-primary)' }}>
          Dashboard OsTicket
        </h1>
        <span 
          className="text-small" 
          style={{ color: 'var(--text-muted)' }}
          role="status"
          aria-live="polite"
        >
          Última actualización: {formatLastUpdate(lastUpdate)}
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

        {/* Sistema Status Indicator */}
        <div className="status-indicator-container" role="status" aria-label="Estado del sistema">
          <div className="status-dot" aria-hidden="true"></div>
          <span className="status-text">Soporte IT</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
