import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  TicketIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

/**
 * Sidebar del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa navegación con sistema de tokens y microinteracciones
 */
const Sidebar: React.FC = () => {
  const navLinks = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Reportes', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="sidebar">
      {/* Logo/Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" className="brand-icon">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm3-.75a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V12a.75.75 0 01.75-.75zm3.75-2.25a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="brand-title">OsTicket</h1>
      </div>
      
      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navLinks.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.name} className="nav-item">
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  <IconComponent className="nav-icon" aria-hidden="true" />
                  <span className="nav-text">{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-content">
          <div className="status-indicator"></div>
          <span className="status-text">Sistema Activo</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


