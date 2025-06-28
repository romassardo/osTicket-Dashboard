import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardView from './views/DashboardView';
import TicketsTableView from './views/TicketsTableView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import NotFoundView from './views/NotFoundView';
import './App.css'; // Mantendremos App.css por si queremos estilos globales iniciales
function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsxs(Route, { path: "/", element: _jsx(DashboardLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(DashboardView, {}) }), _jsx(Route, { path: "tickets", element: _jsx(TicketsTableView, {}) }), _jsx(Route, { path: "analytics", element: _jsx(AnalyticsView, {}) }), _jsx(Route, { path: "settings", element: _jsx(SettingsView, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFoundView, {}) }), " "] }) }));
}
export default App;
