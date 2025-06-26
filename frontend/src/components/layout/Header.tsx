import React from 'react';

/**
 * Header del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa la estructura de header con sistema de tokens
 */
const Header: React.FC = () => {
  return (
    <header className="dashboard-header-bar">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">Dashboard OsTicket</h1>
        </div>
        <div className="header-right">
          <span className="header-status">Soporte IT</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
