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
 * Sidebar del Dashboard — Obsidian Executive Design
 * Premium corporate navigation with amber/gold accent system
 */
const Sidebar: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  const navLinks = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Tickets', href: '/tickets', icon: TicketIcon },
    { name: 'Reportes', href: '/analytics', icon: ChartBarIcon },
    { name: 'Análisis SLA', href: '/sla', icon: ClockIcon },
    { name: 'Monitoreo SLA', href: '/sla-alerts', icon: ExclamationTriangleIcon },
    { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="header-brand">
        <div className="brand-link">
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-light))' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="font-display" style={{ fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
              OsTicket
            </span>
          )}
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle"
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Section label */}
      {!isCollapsed && (
        <div style={{ padding: 'var(--space-4) var(--space-6) var(--space-2)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          Navegación
        </div>
      )}
      
      {/* Navigation */}
      <nav className="nav-menu" style={{ paddingTop: 0 }}>
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
              {!isCollapsed && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="footer-content">
            <div className="status-indicator"></div>
            <span className="status-text">Sistema Operativo</span>
          </div>
          
          <div className="version-info">
            <div className="version-badge">
              <span className="version-label" style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)', fontSize: '0.625rem', padding: '0.2rem 0.6rem' }}>v1.2</span>
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
