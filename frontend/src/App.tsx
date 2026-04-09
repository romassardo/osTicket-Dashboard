import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SoundProvider } from './context/SoundContext';
import { NotificationProvider } from './context/NotificationContext';
import { SidebarProvider } from './context/SidebarContext';
import { FilterProvider } from './context/FilterContext';
import { Suspense, lazy } from 'react';

// Lazy load components for code splitting
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const TicketsTableView = lazy(() => import('./views/TicketsTableView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));
const SLAOverviewView = lazy(() => import('./views/SLAStatsView'));
const SLAAlertView = lazy(() => import('./views/SLAAlertView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const NotFoundView = lazy(() => import('./views/NotFoundView'));

import './App.css'; // Mantendremos App.css por si queremos estilos globales iniciales

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
    <span className="ml-3" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>Cargando...</span>
  </div>
);

function App() {
  return (
    <SoundProvider>
      <NotificationProvider>
        <SidebarProvider>
          <FilterProvider>
            <BrowserRouter basename="/dashboard">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<DashboardView />} />
                    <Route path="tickets" element={<TicketsTableView />} />
                    <Route path="analytics" element={<AnalyticsView />} />
                    <Route path="sla" element={<SLAOverviewView />} />
                    <Route path="sla-alerts" element={<SLAAlertView />} />
                    <Route path="settings" element={<SettingsView />} />
                  </Route>
                  <Route path="*" element={<NotFoundView />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </FilterProvider>
        </SidebarProvider>
      </NotificationProvider>
    </SoundProvider>
  );
}

export default App;

