import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';

/**
 * Layout principal del Dashboard según DESIGN_GUIDE.md
 * Implementa el sistema de tokens de diseño y dark mode first
 */
const DashboardLayout: React.FC = () => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={`dashboard-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* --- Sidebar --- */}
      <Sidebar />

      {/* --- Main Content Area --- */}
      <div className="dashboard-main">
        {/* --- Header --- */}
        <Header />
        {/* --- Page Content --- */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

