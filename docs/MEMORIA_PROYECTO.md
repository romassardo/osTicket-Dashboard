# MEMORIA DEL PROYECTO - Dashboard OsTicket

## Versión Actual: 0.17.0

### 🎯 CAMBIOS RECIENTES - Layout y UX Optimizado (v0.17.0)

#### **Nueva Funcionalidad - 4ta Tarjeta KPI:**
- **Problema**: Dashboard solo mostraba tickets abiertos de junio (25), ticketera mostraba total (49)
- **Solución**: Nueva tarjeta "Abiertos Totales" que muestra tickets sin filtro de fecha
- **Beneficio**: Separación clara entre gestión operativa mensual vs vista general del sistema

#### **Optimización Visual:**
- **Layout 4 Tarjetas**: Grid optimizado para mostrar 4 tarjetas en una línea
- **Contenido Centrado**: Text-align center en todas las tarjetas KPI
- **Espaciado Optimizado**: Padding reducido y gap ajustado para mejor densidad
- **Etiquetas Claras**: "Nuevos / Día" en lugar de "Nuevos (prom.)"

#### **Mejoras Técnicas:**
- CSS responsive mejorado (4→2→1 tarjetas según pantalla)
- API extendida con `totalOpenTickets`
- Breakpoints optimizados para mejor UX

### 🎯 CAMBIOS ANTERIORES - Filtro Mensual (v0.16.0)

#### **Problema Identificado:**
- Dashboard mostraba datos anuales completos (2,111 tickets de 2025)
- Gráfico de dona con proporciones extremas: 2% abiertos vs 98% cerrados
- No era útil para gestión operativa diaria

#### **Solución Implementada:**
- **Backend:** API `/api/tickets/count` acepta parámetros `year` y `month`
- **Frontend:** Dashboard filtrado a **junio 2025** para datos operativos
- **UI:** Títulos actualizados para reflejar enfoque mensual
- **Conceptual:** Separación Dashboard (mensual) vs Analytics (histórico)

#### **Archivos Modificados:**
- `backend/routes/ticketRoutes.js` - Filtro mensual
- `frontend/src/services/api.ts` - Parámetro month opcional
- `frontend/src/views/DashboardView.tsx` - Query junio 2025
- `frontend/src/components/charts/TicketStatusChart.tsx` - Título mensual

#### **Beneficios:**
- Proporciones equilibradas en gráficos
- Gestión operativa enfocada
- Preparación para página Analytics separada

### 🏗️ ARQUITECTURA ACTUAL

#### **Tech Stack:**
- **Backend:** Node.js + Express + Sequelize + MySQL
- **Frontend:** React + TypeScript + Vite + Tailwind + React Query
- **Design:** Sistema de tokens CSS + Glassmorphism

#### **Estructura de Datos:**
- Filtro por departamentos: 'Soporte Informatico', 'Soporte IT'
- Estados principales: Abierto, Cerrado
- Filtrado temporal: Año y mes específicos

#### **Componentes Principales:**
- `DashboardLayout` - Layout principal
- `StatCard` - Tarjetas KPI
- `TicketStatusChart` - Gráfico de dona
- `TicketTrendsChart` - Tendencias temporales

### 📊 PRÓXIMAS FUNCIONALIDADES

#### **Página Analytics (Futura):**
- Análisis histórico anual
- Comparaciones entre períodos
- Gráficos avanzados de tendencias
- Reportes detallados

#### **Consideraciones de Diseño:**
- Dashboard = Operativo mensual
- Analytics = Histórico/comparativo
- Mantener consistencia en design system
- Datos reales (no mock)

### 🔧 COMANDOS IMPORTANTES

```bash
# Backend (Puerto 3001)
cd dashboard-osticket/backend
npm run dev

# Frontend (Puerto 3000)
cd dashboard-osticket/frontend  
npm run dev
```

### 📝 NOTAS TÉCNICAS

- Usar `year` y `month` en queries para filtrado preciso
- Mantener fallback a filtro anual
- Design system basado en tokens CSS
- Separación estricta entre componentes operativos y analíticos 