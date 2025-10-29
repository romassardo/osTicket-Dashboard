import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  TicketIcon,
  Cog6ToothIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useSidebar } from '../../context/SidebarContext';

/**
 * Sidebar del Dashboard siguiendo DESIGN_GUIDE.md
 * Implementa navegación con sistema de tokens y microinteracciones
 */
const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  const navLinks = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Reportes', href: '/analytics', icon: ChartBarIcon },
    { name: 'SLA Dashboard', href: '/sla', icon: ClockIcon },
    { name: 'Alertas SLA', href: '/sla-alerts', icon: ExclamationTriangleIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo/Brand */}
      <div className="header-brand">
        <div className="brand-link">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm3-.75a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V12a.75.75 0 01.75-.75zm3.75-2.25a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
            </svg>
          </div>
          {!isCollapsed && <span>OsTicket</span>}
        </div>
        
        {/* Botón toggle */}
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="nav-menu">
        {navLinks.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <IconComponent className="nav-icon" aria-hidden="true" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <div className="status-indicator"></div>
            <span className="status-text">Sistema Activo</span>
          </div>
          
          {/* Version & Developer Info */}
          <div className="version-info">
            <div className="version-badge">
              <span className="version-label">v1.2</span>
            </div>
            <div className="developer-info">
              <span className="developer-name">Rodrigo Massardo</span>
              <span className="developer-year">2025</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
