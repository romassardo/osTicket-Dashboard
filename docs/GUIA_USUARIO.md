# 📖 Guía de Usuario - Dashboard OsTicket v1.2

## 🎯 Introducción

El Dashboard OsTicket es una herramienta de visualización en tiempo real diseñada para el equipo de Soporte IT. Permite monitorear, analizar y gestionar tickets de manera eficiente con actualizaciones automáticas y notificaciones.

## 🚀 Acceso al Dashboard

**URL Producción:** https://soporteticket.ddns.net/dashboard/

El dashboard se actualiza automáticamente cada 60 segundos.

## 🧭 Navegación Principal

### Sidebar (Barra Lateral)

#### Menú de Navegación
- **Dashboard** - Vista general con métricas y gráficos
- **Tickets** - Tabla completa de todos los tickets
- **Reportes** - Análisis y reportes detallados
- **Settings** - Configuración del sistema

#### Botón de Colapsar
- Click en el icono **chevron** (< >) para colapsar/expandir el sidebar
- **Expandido:** 280px - muestra texto completo
- **Colapsado:** 70px - solo iconos
- El estado se guarda automáticamente

### Header (Barra Superior)

#### Controles Disponibles
1. **Título** - Muestra la vista actual
2. **Última actualización** - Timestamp de última carga
3. **Botón Modo Oscuro/Claro** - Alterna tema visual
4. **Botón Sonido ON/OFF** - Activa/desactiva notificaciones sonoras
5. **Estado del Sistema** - Indicador "Sistema Activo"
6. **Botón Refrescar** - Actualización manual de datos

## 📊 Vista Dashboard

### Métricas Principales (Cards)

#### Total Tickets
- Cantidad total de tickets en el período seleccionado
- Indicador de cambio porcentual vs período anterior
- Color: Azul

#### Tickets Abiertos
- Tickets actualmente sin resolver
- Indicador de tendencia
- Color: Naranja/Amarillo

#### Total Pendientes
- Tickets acumulados sin resolver
- Indicador de crecimiento
- Color: Azul

### Filtros Globales

**Selectores en Header:**
- **Año:** Filtra por año (2024, 2025, etc.)
- **Mes:** Filtra por mes específico
- Ambos filtros afectan TODAS las métricas y gráficos

### Gráficos Interactivos

#### 1. Distribución por Estado (Donut)
- Visualiza tickets por estado: Abierto, Cerrado, Resuelto
- **Hover:** Muestra cantidad exacta y porcentaje
- Centro muestra: **Total de tickets**
- Colores:
  - Verde: Cerrado
  - Azul: Abierto
  - Naranja: Resuelto

#### 2. Tendencia de Tickets (Línea)
- Evolución temporal de tickets
- Eje X: Tiempo (días/semanas)
- Eje Y: Cantidad de tickets
- **Hover:** Muestra fecha y cantidad exacta
- **Zoom:** Click y arrastra para acercar

#### 3. Tickets por Transporte (Barras Horizontales)
- Agrupa tickets por medio de transporte
- Categorías:
  - A pie
  - Remoto
  - SUBE
  - Vehículos (AE677SO, AF630OG, MVH444)
  - Sin transporte
- **Hover:** Muestra cantidad y porcentaje

## 🎫 Vista Tickets

### Tabla de Tickets

#### Columnas Disponibles
1. **#** - Número de ticket único
2. **Asunto** - Descripción del ticket
3. **Sector** - Departamento o sector
4. **Transporte** - Medio utilizado
5. **Usuario** - Quien creó el ticket
6. **Agente** - Staff asignado
7. **Estado** - Estado actual (badge con color)
8. **Fecha Creación** - Timestamp de creación
9. **Acciones** - Botones de acción

#### Paginación
- **50 tickets por página**
- Controles: Primera, Anterior, Siguiente, Última
- Indicador: "Mostrando X-Y de Z resultados"

### Búsqueda y Filtros

#### Búsqueda Rápida
- **Barra de búsqueda** en la parte superior
- Busca en: número, asunto, usuario
- Actualización en tiempo real

#### Botón "Filtros Avanzados"

Abre modal con opciones:

**1. Filtro por Estados**
- Checkboxes múltiples
- Estados disponibles: Abierto, Cerrado, Resuelto, etc.
- Selecciona uno o varios

**2. Filtro por Rango de Fechas**
- **Fecha Inicio:** Selecciona fecha inicial
- **Fecha Fin:** Selecciona fecha final
- Calendario interactivo

**3. Filtro por Sector**
- Dropdown con todos los sectores
- Un sector a la vez

**4. Filtro por Staff/Agente**
- Dropdown con todos los agentes
- Un agente a la vez

**Botones:**
- **Aplicar Filtros:** Ejecuta búsqueda
- **Limpiar:** Resetea todos los filtros

### Exportación

**Botón "Exportar a Excel"**
- Exporta tickets actualmente filtrados
- Incluye todas las columnas visibles
- Formato: `.xlsx`
- Nombre archivo: `tickets_YYYY-MM-DD.xlsx`

## 🔔 Sistema de Notificaciones

### Notificaciones Sonoras

**Funcionamiento:**
1. Dashboard detecta nuevo ticket automáticamente cada 60 segundos
2. Reproduce sonido de notificación
3. Muestra toast visual con número de ticket

**Control:**
- **Botón "Sonido ON/OFF"** en header
- Estado se guarda en navegador
- Funciona incluso con pestaña inactiva

### Notificaciones Visuales (Toast)

**Tipos:**
- **Info** - Azul: Información general
- **Success** - Verde: Operación exitosa
- **Warning** - Amarillo: Advertencias
- **Error** - Rojo: Errores

**Comportamiento:**
- Aparecen en esquina superior derecha
- Auto-cierre en 5 segundos
- Barra de progreso visual
- Click en X para cerrar manualmente

## ⚙️ Configuración

### Preferencias Guardadas Automáticamente

- **Estado del sidebar** (colapsado/expandido)
- **Sonido activado/desactivado**
- **Tema oscuro/claro** (próximamente)

### Actualización Automática

El dashboard se actualiza cada **60 segundos**:
- Métricas principales
- Gráficos
- Tabla de tickets
- Detección de tickets nuevos

## 🎨 Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `F5` | Recargar página |
| `Ctrl + R` | Refrescar datos |
| `Esc` | Cerrar modales |

## 💡 Consejos de Uso

### Mejores Prácticas

1. **Dejar pestaña abierta** - Recibirás notificaciones automáticas
2. **Usar filtros avanzados** - Para búsquedas específicas
3. **Exportar regularmente** - Para análisis externo
4. **Revisar última actualización** - En header, para confirmar datos frescos

### Solución de Problemas Comunes

**No se escucha el sonido:**
1. Verificar botón "Sonido ON" en header
2. Verificar volumen del navegador/sistema
3. Interactuar con la página primero (click en cualquier parte)

**Datos no se actualizan:**
1. Verificar "última actualización" en header
2. Click en botón "Refrescar"
3. Recargar página (F5)

**Filtros no funcionan:**
1. Click en "Limpiar" y volver a aplicar
2. Verificar que las fechas sean válidas
3. Recargar página

## 📱 Uso en Móviles

El dashboard es responsive y funciona en:
- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768px+)
- ✅ Mobile (375px+)

**Nota:** Algunas funciones pueden estar optimizadas para desktop.

## 🆘 Soporte

Para reportar problemas o sugerencias:
- Contactar a: **Rodrigo Massardo**
- Email: rodrigo@ejemplo.com (actualizar)
- Dashboard v1.2

---

**Última actualización:** Octubre 2025
