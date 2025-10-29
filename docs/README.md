# 📊 Dashboard OsTicket - Soporte IT v1.2

Dashboard web interactivo para visualización y análisis en tiempo real de tickets del sistema OsTicket. Desarrollado para el equipo de Soporte IT con foco en usabilidad, rendimiento y experiencia de usuario.

## ✨ Características Implementadas

### 📈 Visualización de Datos
- ✅ Resumen general de tickets (totales, abiertos, cerrados, pendientes)
- ✅ Gráficos interactivos con Chart.js y Recharts
- ✅ Distribución por estado con gráfico donut
- ✅ Análisis de tickets por tipo de transporte
- ✅ Vista de alertas SLA con tickets en riesgo y agentes con bajo rendimiento
- ✅ Filtros por año y mes
- ✅ Actualización automática cada 60 segundos
- ℹ️ La vista de alertas SLA se refresca automáticamente cada 5 minutos

### 🎯 Gestión de Tickets
- ✅ Tabla completa con paginación (50 tickets por página)
- ✅ Búsqueda avanzada con múltiples filtros
- ✅ Filtrado por estado, sector, staff, fechas
- ✅ Exportación a Excel
- ✅ Información detallada: número, asunto, sector, transporte, usuario, agente, fechas

### 🔔 Sistema de Notificaciones
- ✅ Notificaciones sonoras para tickets nuevos
- ✅ Notificaciones visuales (toast)
- ✅ Detección automática de nuevos tickets
- ✅ Botón de control de sonido On/Off
- ✅ Fallback con Web Audio API

### 🎨 Interfaz de Usuario
- ✅ Sidebar colapsable (280px ↔ 70px)
- ✅ Diseño responsive mobile-first
- ✅ Dark mode nativo
- ✅ Animaciones y microinteracciones
- ✅ Sistema de tokens de diseño
- ✅ Tipografía Inter Variable

## Tecnologías

- **Backend:** Node.js + Express
- **Frontend:** React.js con TypeScript, Vite, Tailwind CSS, React Query y Axios
- **Base de Datos:** MySQL (conexión de solo lectura a la base de datos de OsTicket)
- **ORM:** Sequelize (para Node.js)
- **Gráficos:** Recharts (preferido), Chart.js

## 📂 Estructura del Proyecto

```
dashboard-osticket/
├── backend/                    # API y lógica del servidor
│   ├── config/                # Configuración de base de datos
│   ├── models/                # Modelos Sequelize
│   ├── routes/                # Endpoints de la API
│   └── server.js              # Servidor Express
├── frontend/                  # Aplicación React
│   ├── public/               # Archivos estáticos (notification.mp3, vite.svg)
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── charts/       # Gráficos (Chart.js, Recharts)
│   │   │   ├── layout/       # Header, Sidebar, Footer
│   │   │   ├── modals/       # Búsqueda avanzada
│   │   │   └── notifications/# Sistema de notificaciones
│   │   ├── context/          # Contextos React (Sound, Notification, Sidebar)
│   │   ├── services/         # API client
│   │   ├── views/            # Vistas principales
│   │   └── utils/            # Utilidades y helpers
│   └── vite.config.ts        # Configuración Vite
└── docs/                     # Documentación del proyecto
    ├── README.md             # Este archivo
    ├── INSTALACION.md        # Guía de instalación
    ├── ARQUITECTURA.md       # Arquitectura técnica
    ├── API.md                # Documentación de endpoints
    ├── DESPLIEGUE.md         # Guía de despliegue
    ├── GUIA_USUARIO.md       # Manual de usuario
    ├── DESIGN_GUIDE.md       # Guía de diseño UI/UX
    ├── SISTEMA_NOTIFICACIONES.md  # Sistema de notificaciones
    └── CHANGELOG.md          # Historial de cambios
```

## 📚 Documentación

- **[Instalación](INSTALACION.md)** - Cómo instalar y configurar el proyecto
- **[Arquitectura](ARQUITECTURA.md)** - Estructura técnica y decisiones de diseño
- **[API](API.md)** - Documentación completa de endpoints
- **[Despliegue](DESPLIEGUE.md)** - Guía para desplegar a producción
- **[Guía de Usuario](GUIA_USUARIO.md)** - Manual de uso del dashboard
- **[Diseño](DESIGN_GUIDE.md)** - Sistema de diseño y componentes UI
- **[Notificaciones](SISTEMA_NOTIFICACIONES.md)** - Sistema audiovisual de notificaciones

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Backend
cd backend
npm install
npm start  # Puerto 3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev  # Puerto 5173
```

### Producción

URL: **https://***REDACTED_DOMAIN***/dashboard/**

## 👤 Desarrollador

**Rodrigo Massardo** - 2025

---

**Versión:** v1.2
