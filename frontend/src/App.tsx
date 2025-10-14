import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SoundProvider } from './context/SoundContext';
import { NotificationProvider } from './context/NotificationContext';
import { SidebarProvider } from './context/SidebarContext';
import { Suspense, lazy } from 'react';

// Lazy load components for code splitting
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const TicketsTableView = lazy(() => import('./views/TicketsTableView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const NotFoundView = lazy(() => import('./views/NotFoundView'));

import './App.css'; // Mantendremos App.css por si queremos estilos globales iniciales

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0a0e14]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00d9ff]"></div>
    <span className="ml-3 text-[#b8c5d6]">Cargando...</span>
  </div>
);

function App() {
  return (
    <SoundProvider>
      <NotificationProvider>
        <SidebarProvider>
          <BrowserRouter basename="/dashboard">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<DashboardView />} />
                <Route path="tickets" element={<TicketsTableView />} />
                <Route path="analytics" element={<AnalyticsView />} />
                <Route path="settings" element={<SettingsView />} />
              </Route>
              <Route path="*" element={<NotFoundView />} /> {/* Ruta para páginas no encontradas */}
            </Routes>
          </Suspense>
        </BrowserRouter>
        </SidebarProvider>
      </NotificationProvider>
    </SoundProvider>
  );
}

export default App;

