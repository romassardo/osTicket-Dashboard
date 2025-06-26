import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardView from './views/DashboardView';
import TicketsTableView from './views/TicketsTableView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import NotFoundView from './views/NotFoundView';
import './App.css'; // Mantendremos App.css por si queremos estilos globales iniciales

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardView />} />
          <Route path="tickets" element={<TicketsTableView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<NotFoundView />} /> {/* Ruta para páginas no encontradas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

