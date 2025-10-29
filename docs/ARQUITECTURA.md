# 🏗️ Arquitectura Técnica - Dashboard OsTicket v1.2

## 📐 Visión General

Dashboard web de visualización de tickets construido con arquitectura cliente-servidor, separando frontend (React) y backend (Node.js/Express) con comunicación vía API RESTful.

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│                 │         │                 │         │              │
│  React Frontend │◄───────►│  Express Backend│◄───────►│  MySQL DB    │
│  (Puerto 5173)  │   API   │  (Puerto 3001)  │ Sequelize│  (OsTicket)  │
│                 │         │                 │         │              │
└─────────────────┘         └─────────────────┘         └──────────────┘
```

## 🎯 Decisiones de Diseño Clave

### Frontend: React + TypeScript + Vite

**¿Por qué React?**
- Ecosistema maduro y amplio
- Performance con Virtual DOM
- Hooks modernos para gestión de estado
- Gran comunidad y librerías

**¿Por qué TypeScript?**
- Type safety para prevenir errores
- Mejor IntelliSense y autocompletado
- Refactoring más seguro
- Documentación implícita en tipos

**¿Por qué Vite?**
- Build ultra-rápido vs Webpack
- HMR instantáneo en desarrollo
- Configuración mínima
- Optimización automática en producción

### Backend: Node.js + Express + Sequelize

**¿Por qué Node.js?**
- JavaScript full-stack (mismo lenguaje)
- Performance con event loop no bloqueante
- npm ecosystem extenso
- Ideal para APIs RESTful

**¿Por qué Express?**
- Framework minimalista y flexible
- Middleware pattern probado
- Routing simple y efectivo
- Gran compatibilidad con librerías

**¿Por qué Sequelize?**
- ORM maduro para Node.js
- Soporte MySQL nativo
- Migrations y seeds
- Queries type-safe con TypeScript

## 📦 Estructura de Carpetas Detallada

### Backend (`/backend`)

```
backend/
├── config/
│   ├── database.js          # Configuración Sequelize
│   └── .env                 # Variables de entorno
├── models/
│   ├── Ticket.js           # Modelo principal de tickets
│   ├── TicketStatus.js     # Estados de tickets
│   ├── Department.js       # Departamentos
│   ├── Staff.js            # Agentes/Staff
│   ├── User.js             # Usuarios
│   ├── HelpTopic.js        # Asuntos/Topics
│   ├── TicketCdata.js      # Custom data (sector, transporte)
│   └── ListItem.js         # Items de listas (valores de custom fields)
├── routes/
│   └── ticketRoutes.js     # Endpoints de tickets
└── server.js               # Servidor Express principal
```

### Frontend (`/frontend`)

```
frontend/
├── public/
│   ├── notification.mp3    # Sonido de notificación
│   └── vite.svg           # Logo Vite
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── TicketStatusChart.tsx      # Gráfico donut estados
│   │   │   └── TicketsByTransportChart.tsx # Gráfico barras transporte
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx        # Layout principal
│   │   │   ├── Header.tsx                 # Header con controles
│   │   │   └── Sidebar.tsx                # Sidebar colapsable
│   │   ├── modals/
│   │   │   └── AdvancedSearchModal.tsx    # Modal búsqueda avanzada
│   │   └── notifications/
│   │       └── ToastNotification.tsx      # Notificaciones toast
│   ├── context/
│   │   ├── SoundContext.tsx              # Estado de sonido global
│   │   ├── NotificationContext.tsx       # Estado de notificaciones
│   │   └── SidebarContext.tsx            # Estado de sidebar
│   ├── services/
│   │   └── api.ts                        # Cliente API con fetch
│   ├── views/
│   │   ├── DashboardView.tsx             # Vista dashboard principal
│   │   ├── TicketsTableView.tsx          # Vista tabla tickets
│   │   ├── AnalyticsView.tsx             # Vista reportes
│   │   └── SettingsView.tsx              # Vista configuración
│   ├── utils/
│   │   └── logger.ts                     # Logger con timestamps
│   ├── App.tsx                           # Componente raíz
│   ├── main.tsx                          # Entry point
│   └── index.css                         # Estilos globales
├── vite.config.ts                        # Configuración Vite
├── tsconfig.json                         # Configuración TypeScript
└── package.json                          # Dependencias
```

## 🔄 Flujo de Datos

### 1. Carga Inicial de Dashboard

```
Usuario → DashboardView
              ↓
         useEffect() hook
              ↓
         api.getTicketStats(year, month)
              ↓
         fetch('/api/tickets/stats')
              ↓
         Backend: GET /api/tickets/stats
              ↓
         Sequelize queries a MySQL
              ↓
         Respuesta JSON con métricas
              ↓
         Frontend actualiza state
              ↓
         Re-render con datos
```

### 2. Auto-refresh de Tickets (60s)

```
setInterval(60000ms)
         ↓
    fetchTickets(true)  // isAutoRefresh = true
         ↓
    fetch('/api/tickets?page=1&limit=50')
         ↓
    Backend devuelve tickets + pagination
         ↓
    Frontend compara total actual vs anterior
         ↓
    ¿Total aumentó? → SÍ
         ↓
    playNotificationSound()
         ↓
    Howler.js reproduce notification.mp3
         ↓
    showNotification(ticketNumber)
```

### 3. Sidebar Collapse

```
Usuario click en botón toggle
         ↓
    toggleSidebar() de SidebarContext
         ↓
    setIsCollapsed(!isCollapsed)
         ↓
    useEffect → localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
         ↓
    CSS class 'collapsed' aplicada
         ↓
    Animación CSS transition (300ms)
         ↓
    Sidebar width: 280px → 70px
```

## 🎨 Sistema de Diseño

### Tokens de Diseño (CSS Variables)

```css
/* Colores */
--bg-primary: #0a0e1a;
--bg-secondary: #12172b;
--accent-primary: #00d9ff;
--accent-secondary: #00a3cc;
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;

/* Espaciado */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */

/* Duración animaciones */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Bordes */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

### Componentes Clave

#### Context Providers

**SoundContext:**
```typescript
interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playNotificationSound: (ticketData?) => Promise<void>;
}
```

**SidebarContext:**
```typescript
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}
```

#### Hooks Personalizados

- `useSound()` - Acceso a estado de sonido
- `useSidebar()` - Acceso a estado de sidebar

## 🔌 API Endpoints

### Base URL

- **Desarrollo:** `http://localhost:3001/api`
- **Producción:** `https://soporteticket.ddns.net/api`

### Endpoints Principales

```
GET  /api/tickets                    # Lista de tickets con paginación
GET  /api/tickets/stats              # Estadísticas generales
GET  /api/tickets/stats/by-status    # Tickets agrupados por estado
GET  /api/tickets/stats/by-transport # Tickets agrupados por transporte
GET  /api/tickets/export             # Exportar todos los tickets (sin paginación)
GET  /api/sla/alerts                 # Alertas SLA (tickets en riesgo, agentes con bajo rendimiento)
```

Ver [API.md](API.md) para documentación completa.

### Módulo SLA

- **Endpoint `/api/sla/alerts`** (backend/routes/slaRoutes.js): ejecuta consultas SQL directas sobre `ost_ticket`, `ost_staff`, `ost_department` y `ost_sla` para detectar:
  - Tickets abiertos de "Soporte IT" con más del 70% del SLA transcurrido.
  - Agentes cuyo porcentaje de cumplimiento sea <80% en los últimos 30 días.
  - Resumen de tickets abiertos/en riesgo/vencidos.
- **Hardening SQL**: uso de `COALESCE(NULLIF(s_sla.grace_period, 0), 24)` y `NULLIF(...)` para evitar divisiones por cero cuando `grace_period` es `NULL` o `0`.
- **Normalización frontend** (`frontend/src/views/SLAAlertView.tsx`): se convierte cada campo numérico a `Number` antes de renderizar (especialmente `porcentaje_transcurrido` y `porcentaje_cumplimiento`) para prevenir errores al aplicar `.toFixed()`.
- **Auto-refresh**: la vista SLA actualiza datos automáticamente cada 5 minutos y permite refresco manual.

## 🔐 Seguridad

### Base de Datos

- **Solo lectura:** Usuario MySQL con permisos SELECT únicamente
- **Sin modificación:** Dashboard no puede crear/actualizar/eliminar tickets

### Frontend

- **No hay autenticación:** Dashboard asume red interna segura
- **CORS configurado:** Solo permite origen específico en producción

### Backend

- **Variables de entorno:** Credenciales nunca en código
- **Validación de queries:** Sequelize previene SQL injection
- **Rate limiting:** Implementado en producción (Apache)

## 📊 Performance

### Optimizaciones Frontend

- **Code splitting:** Lazy loading de vistas con React.lazy()
- **Memoization:** useMemo() y useCallback() para prevenir re-renders
- **Virtual DOM:** React optimiza actualizaciones
- **Build optimizado:** Vite comprime y minimiza assets

### Optimizaciones Backend

- **Sequelize eager loading:** `include` para evitar N+1 queries
- **Paginación:** Máximo 50 tickets por request
- **Indexación DB:** Índices en columnas frecuentemente consultadas
- **Cache de conexión:** Pool de conexiones MySQL reutilizables

## 🧪 Testing

### Frontend (Pendiente)

- Unit tests con Vitest
- Integration tests con React Testing Library
- E2E tests con Playwright

### Backend (Pendiente)

- Unit tests con Jest
- API tests con Supertest

## 📈 Escalabilidad

### Horizontal

- Frontend: CDN para assets estáticos
- Backend: Load balancer con múltiples instancias PM2

### Vertical

- MySQL: Optimización de queries y índices
- Caching: Redis para datos frecuentes (futuro)

## 🔄 Flujo de Despliegue

```
Desarrollo Local
      ↓
   git push
      ↓
  Build Frontend (npm run build)
      ↓
  SCP archivos a servidor
      ↓
  PM2 restart backend
      ↓
  Apache sirve frontend estático
      ↓
  Verificar en producción
```

Ver [DESPLIEGUE.md](DESPLIEGUE.md) para guía completa.

## 🎯 Roadmap Técnico

### Próximas Mejoras

- [ ] WebSockets para actualizaciones real-time
- [ ] Server-Sent Events (SSE) como alternativa
- [ ] PWA (Progressive Web App)
- [ ] Offline mode con Service Workers
- [ ] Tests automatizados completos
- [ ] CI/CD con GitHub Actions
- [ ] Docker containers
- [ ] Kubernetes deployment

---

**Versión:** v1.2  
**Última actualización:** Octubre 2025
