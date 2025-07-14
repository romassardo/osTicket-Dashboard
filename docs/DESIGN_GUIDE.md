# 🎨 Guía de Diseño UX/UI - Dashboard OsTicket

## 🚀 Filosofía de Diseño

### Principios Fundamentales
- **Claridad First**: Cada elemento debe comunicar información de manera instantánea
- **Data-Driven Design**: Los datos son los protagonistas, el diseño los potencia
- **Eficiencia Operativa**: Reducir el tiempo de análisis de métricas de 5 minutos a 30 segundos
- **Escalabilidad Visual**: El diseño debe funcionar con 10 tickets o 10,000 tickets
- **Accesibilidad Universal**: WCAG 2.1 AA como estándar mínimo

---

## 🎯 Arquitectura de Información

### Jerarquía Visual Principal
```
┌─ HEADER (Navegación + Estado Global)
├─ HERO METRICS (KPIs Críticos)
├─ ANALYTICS GRID (Gráficos Principales)
├─ DATA TABLES (Detalles Operativos)
└─ FOOTER (Metadatos y Exportación)
```

### Flujo de Lectura (F-Pattern Optimizado)
1. **Escaneo Superior**: Métricas críticas en cards horizontales
2. **Exploración Vertical**: Gráficos de evolución temporal
3. **Detalle Granular**: Tablas filtradas y búsqueda

---

## 🎨 Sistema de Colores

### Paleta Principal (Dark Mode First)
```css
/* BACKGROUND SYSTEM */
--bg-primary: #0a0e14;     /* Fondo principal */
--bg-secondary: #1a1f29;   /* Cards y secciones */
--bg-tertiary: #252a35;    /* Elementos elevados */
--bg-accent: #2d3441;      /* Hover states */

/* TEXT SYSTEM */
--text-primary: #ffffff;    /* Títulos principales */
--text-secondary: #b8c5d6; /* Texto secundario */
--text-muted: #7a8394;     /* Labels y metadatos */

/* ACCENT COLORS */
--accent-primary: #00d9ff;  /* CTAs y elementos críticos */
--accent-secondary: #7c3aed; /* Estados activos */

/* STATUS SYSTEM */
--success: #10b981;   /* Tickets resueltos */
--warning: #f59e0b;   /* Tickets pendientes */
--error: #ef4444;     /* Tickets críticos/vencidos */
--info: #06b6d4;      /* Tickets en progreso */
--priority-low: #6ee7b7;    /* Prioridad baja */
--priority-medium: #fbbf24; /* Prioridad media */
--priority-high: #fb7185;   /* Prioridad alta */
--priority-urgent: #dc2626; /* Prioridad urgente */
```

### Paleta Light Mode (Alternativa)
```css
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;
--text-primary: #0f172a;
--text-secondary: #475569;
```

---

## ✍️ Sistema Tipográfico

### Fuente Principal
**Inter Variable** - Máxima legibilidad en dashboards
```css
font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Jerarquía Tipográfica
```css
/* HEADERS */
.text-hero: 2.5rem/1.2, 700;      /* Números principales KPI */
.text-h1: 1.875rem/1.3, 600;      /* Títulos de sección */
.text-h2: 1.25rem/1.4, 600;       /* Subtítulos */
.text-h3: 1rem/1.4, 500;          /* Labels importantes */

/* BODY */
.text-base: 0.875rem/1.5, 400;    /* Texto general */
.text-small: 0.75rem/1.4, 400;    /* Metadatos */
.text-micro: 0.6875rem/1.3, 500;  /* Tags y badges */

/* DISPLAY */
.text-display: 3.5rem/1.1, 800;   /* Solo para números mega importantes */
.text-mono: 'JetBrains Mono', monospace; /* IDs y códigos */
```

---

## 🏗️ Layout System

### Grid Principal
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* RESPONSIVE BREAKPOINTS */
/* Mobile First */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

### Espaciado Consistente
```css
/* SPACING SCALE (8px base) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

---

## 📊 Componentes de Datos

### 1. KPI Cards (Hero Metrics)
```html
<div class="kpi-card">
  <div class="kpi-header">
    <h3>Total Tickets</h3>
    <TrendIcon trend="up" />
  </div>
  <div class="kpi-value">
    <span class="kpi-number">1,247</span>
    <span class="kpi-change positive">+12%</span>
  </div>
  <div class="kpi-subtitle">vs mes anterior</div>
</div>
```

**Características de Diseño:**
- **Elevación**: `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- **Bordes**: `border-radius: 12px`
- **Micro-animación**: Hover scale 1.02
- **Indicadores de tendencia**: Iconos direccionales con colores semánticos

### 2. Gráficos de Evolución Temporal
```javascript
// Configuración para Chart.js/Recharts
const chartConfig = {
  backgroundColor: 'transparent',
  gridColor: 'rgba(255,255,255,0.1)',
  lineWidth: 3,
  pointRadius: 0,
  pointHoverRadius: 6,
  tension: 0.3, // Curvas suaves
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
}
```

**Tipos de Gráficos:**
- **Line Charts**: Evolución temporal de tickets
- **Area Charts**: Volumen acumulado por estado
- **Bar Charts**: Comparación por departamento/agente
- **Donut Charts**: Distribución por prioridad

### 3. Data Tables Avanzadas
```html
<table class="data-table">
  <thead>
    <tr>
      <th sortable>ID Ticket</th>
      <th sortable>Estado</th>
      <th sortable>Prioridad</th>
      <th sortable>Agente</th>
      <th sortable>Última Actualización</th>
    </tr>
  </thead>
  <tbody>
    <!-- Rows with status badges -->
  </tbody>
</table>
```

**Características:**
- **Ordenación visual**: Iconos de sort activos
- **Paginación avanzada**: "Mostrando 1-25 de 1,247 tickets"
- **Filtros rápidos**: Chips de estado/prioridad
- **Búsqueda inteligente**: Search con highlighting

---

## 🎭 Estados y Feedback

### Status Badges
```css
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-open { background: var(--info); color: white; }
.badge-pending { background: var(--warning); color: black; }
.badge-resolved { background: var(--success); color: white; }
.badge-closed { background: var(--text-muted); color: white; }
```

### Loading States
```html
<!-- Skeleton Loading para KPI Cards -->
<div class="kpi-card skeleton">
  <div class="skeleton-line w-24 h-4"></div>
  <div class="skeleton-line w-16 h-8 mt-2"></div>
  <div class="skeleton-line w-20 h-3 mt-1"></div>
</div>
```

---

## 🔄 Microinteracciones

### Animaciones de Entrada
```css
/* Staggered Animation para Cards */
.kpi-card {
  animation: slideInUp 0.6s ease-out both;
}

.kpi-card:nth-child(2) { animation-delay: 0.1s; }
.kpi-card:nth-child(3) { animation-delay: 0.2s; }
.kpi-card:nth-child(4) { animation-delay: 0.3s; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover Effects
```css
.kpi-card:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.chart-container:hover {
  background: var(--bg-accent);
  transition: background 0.2s ease;
}
```

---

## 📱 Responsive Design

### Mobile-First Strategy
```css
/* MOBILE (320px+) */
.kpi-grid {
  grid-template-columns: 1fr;
  gap: 1rem;
}

.chart-container {
  min-height: 250px;
}

/* TABLET (768px+) */
@media (min-width: 768px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* DESKTOP (1024px+) */
@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .chart-container {
    min-height: 400px;
  }
}
```

### Navigation Adaptativa
- **Desktop**: Navegación horizontal con breadcrumbs
- **Tablet**: Navegación colapsable
- **Mobile**: Bottom navigation con iconos

---

## 🎪 Componentes Específicos del Dashboard

### 1. Header Dashboard
```html
<header class="dashboard-header">
  <div class="header-left">
    <h1>Dashboard OsTicket</h1>
    <span class="last-update">Última actualización: hace 2 min</span>
  </div>
  <div class="header-right">
    <DateRangePicker />
    <RefreshButton />
    <ExportButton />
  </div>
</header>
```

### 2. Quick Filters
```html
<div class="quick-filters">
  <FilterChip active>Todos</FilterChip>
  <FilterChip>Abiertos</FilterChip>
  <FilterChip>Pendientes</FilterChip>
  <FilterChip>Críticos</FilterChip>
  <FilterChip>Mi Equipo</FilterChip>
</div>
```

### 3. Agent Performance Card
```html
<div class="agent-card">
  <div class="agent-avatar">
    <img src="avatar.jpg" alt="Agent Name" />
    <div class="status-indicator online"></div>
  </div>
  <div class="agent-stats">
    <h4>María García</h4>
    <div class="stat-row">
      <span>Tickets Resueltos:</span>
      <strong>23</strong>
    </div>
    <div class="stat-row">
      <span>Tiempo Promedio:</span>
      <strong>2.3h</strong>
    </div>
  </div>
</div>
```

---

## 🔍 Búsqueda y Filtros Avanzados

### Barra de Búsqueda Global
```html
<div class="search-container">
  <SearchIcon />
  <input 
    type="text" 
    placeholder="Buscar por ID, cliente, asunto..."
    class="search-input"
  />
  <div class="search-shortcuts">
    <kbd>⌘</kbd><kbd>K</kbd>
  </div>
</div>
```

### Panel de Filtros Avanzados
```html
<div class="advanced-filters">
  <FilterGroup label="Estado">
    <Checkbox>Abierto</Checkbox>
    <Checkbox>En Progreso</Checkbox>
    <Checkbox>Resuelto</Checkbox>
  </FilterGroup>
  
  <FilterGroup label="Prioridad">
    <RadioGroup options={priorities} />
  </FilterGroup>
  
  <FilterGroup label="Departamento">
    <Select options={departments} />
  </FilterGroup>
</div>
```

---

## 📈 Visualización de Métricas Clave

### Distribución de Estados (Donut Chart)
```javascript
const statusDistribution = {
  data: [
    { name: 'Abiertos', value: 45, color: '#06b6d4' },
    { name: 'En Progreso', value: 30, color: '#f59e0b' },
    { name: 'Resueltos', value: 20, color: '#10b981' },
    { name: 'Cerrados', value: 5, color: '#6b7280' }
  ],
  centerText: {
    title: 'Total',
    value: '1,247',
    subtitle: 'tickets'
  }
}
```

### Evolución Temporal (Area Chart)
```javascript
const evolutionChart = {
  xAxis: 'date',
  yAxis: 'count',
  areas: [
    { key: 'nuevos', name: 'Nuevos', color: '#00d9ff' },
    { key: 'resueltos', name: 'Resueltos', color: '#10b981' },
    { key: 'cerrados', name: 'Cerrados', color: '#6b7280' }
  ],
  gradient: true,
  tooltip: 'detailed'
}
```

### Heatmap de Actividad
```html
<div class="activity-heatmap">
  <h3>Actividad por Hora</h3>
  <div class="heatmap-grid">
    <!-- 24 horas x 7 días = 168 celdas -->
    <div class="heatmap-cell" data-intensity="high"></div>
    <!-- ... más celdas ... -->
  </div>
  <div class="heatmap-legend">
    <span>Menos</span>
    <div class="legend-scale"></div>
    <span>Más</span>
  </div>
</div>
```

---

## ⚡ Performance y Optimización

### Lazy Loading para Gráficos
```javascript
const ChartComponent = lazy(() => import('./Chart'));

// Usar con Suspense
<Suspense fallback={<ChartSkeleton />}>
  <ChartComponent data={chartData} />
</Suspense>
```

### Virtualización para Tablas Grandes
```javascript
// Para tablas con +1000 filas
import { FixedSizeList as List } from 'react-window';

const VirtualizedTable = ({ data }) => (
  <List
    height={600}
    itemCount={data.length}
    itemSize={50}
    itemData={data}
  >
    {Row}
  </List>
);
```

---

## 🎨 Tokens de Diseño

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
```

### Border Radius
```css
--radius-sm: 6px;    /* Buttons pequeños */
--radius-md: 8px;    /* Cards, inputs */
--radius-lg: 12px;   /* Modals, containers */
--radius-xl: 16px;   /* Hero sections */
--radius-full: 9999px; /* Pills, avatars */
```

### Durations
```css
--duration-fast: 150ms;    /* Micro-interactions */
--duration-normal: 300ms;  /* Standard transitions */
--duration-slow: 500ms;    /* Page transitions */
```

---

## 🔐 Accesibilidad

### Contraste de Colores
- **Texto principal**: Mínimo 4.5:1
- **Texto grande**: Mínimo 3:1
- **Elementos UI**: Mínimo 3:1

### Navegación por Teclado
```css
/* Focus visible mejorado */
.focus-ring:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### ARIA Labels
```html
<button aria-label="Refrescar datos del dashboard">
  <RefreshIcon />
</button>

<div role="status" aria-live="polite">
  Datos actualizados: {lastUpdate}
</div>
```

---

## 🚀 Implementación Técnica

### Estructura de Componentes React
```
components/
├── layout/
│   ├── DashboardLayout.jsx
│   ├── Header.jsx
│   └── Sidebar.jsx
├── metrics/
│   ├── KPICard.jsx
│   ├── MetricsGrid.jsx
│   └── TrendIndicator.jsx
├── charts/
│   ├── LineChart.jsx
│   ├── DonutChart.jsx
│   ├── BarChart.jsx
│   └── HeatMap.jsx
├── tables/
│   ├── DataTable.jsx
│   ├── FilterBar.jsx
│   └── Pagination.jsx
└── ui/
    ├── Button.jsx
    ├── Badge.jsx
    ├── Loading.jsx
    └── Card.jsx
```

### CSS Modules o Styled Components
```css
/* KPICard.module.css */
.kpiCard {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--duration-normal) ease;
}

.kpiCard:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

---

## 🎯 Casos de Uso Específicos

### 1. Vista de Supervisor
- **KPIs Críticos**: SLA compliance, tickets críticos, agentes activos
- **Gráficos**: Distribución por departamento, evolución semanal
- **Acciones**: Reasignación rápida, escalamiento

### 2. Vista de Agente
- **KPIs Personales**: Mis tickets, tiempo promedio, satisfacción
- **Gráficos**: Mi performance vs. equipo
- **Acciones**: Filtros por "asignados a mí"

### 3. Vista Ejecutiva
- **KPIs Estratégicos**: ROI del soporte, customer satisfaction, trends
- **Gráficos**: High-level metrics, comparaciones temporales
- **Exportación**: PDF reports, presentations

---

## 📋 Checklist de Implementación

### Fase 1: Foundation
- [ ] Sistema de tokens de diseño
- [ ] Componentes base (Button, Card, Badge)
- [ ] Layout responsive
- [ ] Dark/Light mode toggle

### Fase 2: Core Components
- [ ] KPI Cards con animaciones
- [ ] Gráficos básicos (Line, Bar, Donut)
- [ ] Data table con paginación
- [ ] Filtros y búsqueda

### Fase 3: Advanced Features
- [ ] Heatmaps de actividad
- [ ] Filtros avanzados
- [ ] Exportación de datos
- [ ] Notificaciones real-time

### Fase 4: Performance
- [ ] Lazy loading
- [ ] Virtualización
- [ ] Optimización de queries
- [ ] Caching inteligente

---

## 🎨 Mockups y Referencias

### Inspiración de Diseño
- **Vercel Analytics**: Clean, modern, data-focused
- **Linear**: Excellent typography and spacing
- **Notion**: Intuitive filters and search
- **Stripe Dashboard**: Outstanding data visualization

### Herramientas Recomendadas
- **Figma**: Para prototipado
- **Framer Motion**: Para animaciones
- **Recharts**: Para gráficos React
- **Tailwind CSS**: Para sistema de diseño

---

Esta guía de diseño está optimizada para crear un dashboard moderno, funcional y visualmente impactante que transforme datos complejos de OsTicket en insights accionables de manera intuitiva y eficiente.