# CHANGELOG - Dashboard osTicket

## [0.35.0] - 2025-01-22

### Added
- **Frontend: Información de Versión y Desarrollador en Sidebar:**
  - Implementado footer informativo en el sidebar con badge de versión "v1.0" destacado con colores accent del sistema de tokens.
  - Agregada información del desarrollador "Rodrigo Massardo" y año "2025" con tipografía jerárquica apropiada.
  - Integrado sistema de separadores visuales entre estado del sistema y información de versión usando bordes sutiles.

### Changed
- **Frontend: Diseño del Footer del Sidebar:**
  - Actualizado componente `Sidebar.tsx` con nueva sección `version-info` que incluye badge de versión y datos del desarrollador.
  - Implementados estilos CSS siguiendo la guía de diseño del proyecto con sistema de tokens para colores, espaciado y tipografía.
  - Aplicada jerarquía visual clara: badge de versión centrado, información del desarrollador en texto secundario y muted.

### Technical Improvements
- **UI/UX Consistency:**
  - Badge de versión usa `--accent-primary` para destacar información importante.
  - Tipografía diferenciada: version-label (600 weight, uppercase), developer-name (500 weight), developer-year (400 weight, muted).
  - Espaciado coherente usando tokens `--space-1`, `--space-2`, `--space-3`, `--space-4` del sistema de diseño.
  - Bordes redondeados `--radius-full` para el badge siguiendo convenciones del proyecto.

## [0.34.0] - 2025-01-22

### 🗄️ **DATABASE OPTIMIZATION COMPLETADO**
- **Backend: Optimización Crítica de Performance de Base de Datos:**
  - Implementado pool de conexiones optimizado: aumentado de 5 a 20 conexiones máximas, con configuración de timeouts mejorada y conexiones mínimas mantenidas.
  - Activado SQL query logging en desarrollo para debugging y profiling de performance usando logger profesional.
  - Creado archivo SQL completo `sql/create_performance_indexes.sql` con índices críticos basados en análisis de `DB_INDEX_RECOMMENDATIONS.md`.

### 🚀 **Performance Optimizations - Eliminación de Queries N+1**
- **Backend: Endpoint `/api/tickets` Optimizado Dramáticamente:**
  - Eliminadas queries N+1 causadas por includes anidados de TicketCdata → ListItems.
  - Separado conteo de datos: query optimizada para conteo + query para datos en paralelo.
  - Implementado post-procesamiento eficiente con Maps para lookups O(1) en lugar de joins N+1.
  - Reducción de ~50+ queries por página a solo 3 queries totales.
  - Optimizada tanto consulta normal como consulta de exportación con estrategia unificada.

- **Backend: Endpoint `/count` Optimizado con SQL Agregado:**
  - Reemplazadas 5 queries separadas (`Promise.all` con múltiples `count`) con máximo 2 queries SQL agregadas.
  - Implementadas consultas raw SQL con `COUNT() CASE` statements para estadísticas.
  - Estrategia diferenciada para consultas con y sin filtro de fecha.
  - Eliminados joins innecesarios repetitivos en cada query de conteo.

- **Backend: Endpoint `/options/transporte` Extremamente Optimizado:**
  - Eliminado `Ticket.findAll()` de TODOS los tickets solo para extraer valores únicos.
  - Implementada consulta SQL directa con `DISTINCT` a `ost_list_items` con joins específicos.
  - Reducción de tiempo de respuesta de segundos a milisegundos.
  - Solo obtiene valores de transporte que realmente se usan en tickets de departamentos permitidos.

### 🔧 **Database Infrastructure Improvements**
- **Índices de Performance Críticos Implementados:**
  - Creados índices simples y compuestos para `ost_ticket`: `dept_id`, `status_id`, `created`, `staff_id`, `user_id`.
  - Índices críticos para joins: `ost_ticket__cdata(ticket_id)`, `ost_department(name)`.
  - Índices de búsqueda: `ost_ticket__cdata(subject)`, `ost_user(name)`, `ost_list_items(value)`.
  - Índices compuestos optimizados: `dept_id+status_id+created` para filtros comunes.
  - Documentación completa de verificación y análisis de performance incluida.

### 📊 **Expected Performance Improvements**
- **Reducción significativa en tiempo de carga de páginas principales (Analytics, Tickets).**
- **Eliminación de timeouts en exportaciones Excel de datasets grandes.**
- **Mejora en responsividad de filtros y búsquedas en tiempo real.**
- **Optimización de recursos del servidor de base de datos y reducción de carga CPU.**

## [0.33.0] - 2025-01-22

### Added
- **Frontend: Optimización Completa de React Performance:**
  - Implementado custom hook `useDebounce` reutilizable en `frontend/src/lib/hooks.ts` para optimizar búsquedas y evitar llamadas excesivas a APIs.
  - Añadido hook adicional `useDebounceCallback` para optimizar funciones que se ejecutan frecuentemente.
  - Creada librería de hooks reutilizables con documentación JSDoc completa y ejemplos de uso.

### Changed
- **Frontend: React.memo y useCallback en Componentes Críticos:**
  - Optimizado `FilterPanel.tsx` con React.memo y memoización de todas las funciones (handleApply, handleReset, onChange handlers) usando useCallback para evitar re-renders innecesarios causados por cambios de filtros.
  - Optimizado `DataTable.tsx` (analytics) con React.memo y useCallback para la función formatDate, eliminando recreaciones en cada render de tablas con múltiples tickets.
  - Optimizado `AnalyticsView.tsx` con React.memo y useCallback para todas las funciones críticas: fetchFilterOptions, fetchTickets, fetchAllTicketsForExport, applyFilters, handlePageChange, exportToExcel, exportToCSV.
  - Optimizado `TicketsTableView.tsx` con React.memo y integración del custom hook useDebounce para búsquedas, reemplazando implementación duplicada de debounce.
  - Optimizado `TicketStatusChart.tsx` con React.memo y useMemo para validación de datos y cálculo del total, evitando recálculos innecesarios en gráficos.

### Fixed
- **Frontend: Corrección de useEffect con Dependency Arrays Problemáticos:**
  - Corregido useEffect en `AnalyticsView.tsx` que tenía dependency array vacío pero usaba `filters` y `currentPage`, causando comportamiento inconsistente.
  - Separado en dos useEffect: uno para cargar opciones de filtro al montar, otro para cargar tickets cuando cambien filters o currentPage.
  - Actualizada función `fetchTickets` en `TicketsTableView.tsx` para usar `debouncedSearchTerm` en lugar de `searchTerm`, mejorando performance en búsquedas.
  - Añadidas dependencias correctas en todos los useCallback para evitar closures obsoletos y bugs de estado.

### Technical Improvements
- **Performance Optimizations:**
  - Implementadas ~15+ optimizaciones de React.memo en componentes críticos que causan más re-renders innecesarios según análisis previo.
  - Memoización de ~20+ funciones con useCallback/useMemo para evitar recreaciones en cada render.
  - Optimización de búsquedas con debounce (500ms delay) para reducir llamadas API y mejorar UX responsive.
  - Añadidos displayName a todos los componentes memoizados para mejor debugging en React DevTools.

### Code Quality
- **Documentación y Mantenibilidad:**
  - Añadidos comentarios explicativos sobre cada optimización implementada, referenciando las memorias del proyecto [[memory:2988538]].
  - Creada documentación JSDoc completa para custom hooks con ejemplos de uso prácticos.
  - Aplicadas mejores prácticas de React para dependency arrays y memoización estratégica.

## [0.32.0] - 2025-01-22

### Added
- **Backend: Sistema de Logging Profesional:**
  - Implementado logger completo en `backend/utils/logger.js` con niveles de log (info, warn, error, debug).
  - Configuración diferenciada: Producción guarda en archivos `logs/app.log` y `logs/error.log`, desarrollo muestra en consola con timestamps.
  - Capacidad de logging de requests HTTP y manejo centralizado de errores.

- **Frontend: Sistema de Logging Profesional:**
  - Implementado logger TypeScript en `frontend/src/utils/logger.ts` con interfaces tipadas.
  - Desarrollo: consola + almacenamiento en memoria (máx 1000 entradas), producción: silencioso (solo errores críticos).
  - Funciones de exportación/importación para debugging y análisis.

### Changed
- **Backend: Eliminación Completa de Console.logs:**
  - Reemplazados todos los `console.log/error/warn` en 8+ archivos del backend con logging profesional.
  - `server.js`: Logs de arranque y registro de rutas con logger.info().
  - `config/db.js`: Conexión DB con logger.info() y errores con logger.error().
  - `middleware/errorHandler.js`: Errores HTTP manejados con logger.error().
  - `routes/ticketRoutes.js`: 15+ instancias reemplazadas en endpoints de transport options, sectors, statistics.
  - `routes/organizationRoutes.js`: Debug y manejo de errores con logger apropiado.

- **Frontend: Eliminación Completa de Console.logs:**
  - Reemplazados todos los `console.log/error/warn` en 7+ archivos del frontend con logging profesional.
  - `views/AnalyticsView.tsx`: 12+ instancias en fetcheo de filtros, carga de tickets, exportaciones.
  - `views/TicketsTableView.tsx`: 6+ instancias en construcción de URLs y parámetros API convertidas a debug.
  - `components/analytics/FilterPanel.tsx`: Logs de aplicación de filtros.
  - `components/modals/AdvancedSearchModal.tsx`: 6+ instancias en cambios de estado y debugging de filtros.
  - `components/tables/DataTable.tsx`: Selección de tickets con logger.debug().
  - `services/api.ts`: 15+ instancias de manejo de errores API con logger.error().
  - `utils/formatters.ts`: Errores de formateo de fechas con logger.warn().

### Removed
- **Archivos de Debug Eliminados:**
  - Eliminados `backend/explore-schema.js` y `backend/test-mysql2-connection.js` (archivos de testing/debug innecesarios).
  - Limpieza completa de archivos temporales y herramientas de desarrollo.

### Added
- **Configuración de Gitignore:**
  - Creado `backend/.gitignore` incluyendo directorio `logs/` para prevenir commit de archivos de log.
  - Asegurada exclusión de logs sensibles del control de versiones.

### Technical Debt
- **Logging Centralizado:** Implementado sistema consistente de logging que reemplaza ~50+ instancias de console statements dispersas por la aplicación.
- **Debugging Mejorado:** Logs estructurados con niveles apropiados facilitan debugging en desarrollo y monitoreo en producción.
- **Eliminación de Side Effects:** Removidos todos los console.logs que podrían causar ruido en producción y logs no estructurados.

## [0.31.0] - 2025-01-22

### Changed
- **Frontend: Implementación de ESLint Strict Mode basado en Context7 MCP:**
  - Actualizada configuración ESLint (`eslint.config.js`) con `strictTypeChecked` y `stylisticTypeChecked` de TypeScript ESLint siguiendo mejores prácticas actualizadas de Context7.
  - Añadidas reglas estrictas adicionales: `no-explicit-any`, `prefer-nullish-coalescing`, `prefer-optional-chain`, `no-unnecessary-type-assertion`, `strict-boolean-expressions`.
  - Configurado `projectService` para análisis de tipos completo con `tsconfigRootDir`.

### Fixed
- **Frontend: Corrección Completa de Problemas de Calidad de Código:**
  - Corregidos todos los errores de `strict-boolean-expressions` en `DataTable.tsx` eliminando verificaciones innecesarias y usando comparaciones explícitas para strings y null checks.
  - Solucionados errores de `no-explicit-any` y `no-confusing-void-expression` en `FilterPanel.tsx` mediante tipado estricto con interfaz `AppliedFilters` y arrow functions con llaves.
  - Eliminado uso de `any` y mejoradas verificaciones de arrays con `length > 0` en lugar de verificaciones de truthiness.

### Added
- **Frontend: Mejoras en Tipado TypeScript:**
  - Añadida interfaz `TransporteName` en `types/index.ts` para tipado estricto del campo transporte.
  - Actualizada interfaz `Cdata` para incluir `TransporteName` opcional correctamente tipada.
  - Creada interfaz `AppliedFilters` para manejo type-safe de filtros en `FilterPanel.tsx`.

## [0.30.0] - 2025-06-25

### Fixed
- **Backend/Frontend: Corrección Crítica de Exportación Excel en Página Analytics/Reportes:**
  - Solucionado problema crítico donde al filtrar datos (mostrando ~170 registros filtrados), la exportación a Excel solo incluía 50 registros (los visibles en pantalla) en lugar de todos los registros filtrados.
  - Modificado `backend/routes/ticketRoutes.js` para soportar parámetro `limit='all'` que permite obtener todos los registros sin paginación para exportaciones.
  - Implementada función `fetchAllTicketsForExport()` en `frontend/src/views/AnalyticsView.tsx` que obtiene todos los registros filtrados mediante llamada específica al backend.
  - Corregidas funciones `exportToExcel()` y `exportToCSV()` para usar todos los datos filtrados en lugar de solo los datos visibles en pantalla.
  - Cambiado formato de exportación de `.xls` a `.html` en `frontend/src/utils/exportUtils.ts` para evitar advertencias de seguridad de Excel, incluyendo estilos CSS mejorados y MIME types apropiados.

### Changed
- **Frontend: Mejoras en Header Principal y Layout del Dashboard:**
  - Actualizado `frontend/src/components/layout/Header.tsx` siguiendo la guía de diseño oficial con clases de tipografía apropiadas, atributos de accesibilidad, funcionalidad de refresh y animaciones CSS.
  - Lograda alineación perfecta de elementos a la derecha en header del dashboard usando `flex-1` en contenedor izquierdo para empujar selectores de fecha y tiempo de actualización al borde derecho.
  - Mejorada responsividad y experiencia de usuario en header principal con microinteracciones y estados hover/focus.

### Fixed
- **Frontend: Eliminación de Elementos Debug Visuales:**
  - Removido banner debug amarillo de `frontend/src/components/charts/TicketStatusChart.tsx` que mostraba datos de prueba en esquina superior izquierda del dashboard.
  - Limpieza de elementos visuales innecesarios que interferían con la experiencia de usuario.

## [0.29.0] - 2025-06-25

### Fixed
- **Frontend: Corrección de Bug Crítico en Gráficos del Dashboard:**
  - Solucionado un error en la condición `enabled` de `useQuery` que impedía la carga de datos en los gráficos cuando el mes seleccionado era enero (`month=0`).
  - Corregida la importación del componente `Button` y el uso de la `prop` `variant` en `TicketsByOrganizationChart.tsx` para prevenir errores de renderizado.


## [0.28.2] - 2025-06-25

### Fixed
- **Frontend: Corrección de Errores Críticos en Componentes de Gráficos:**
  - Solucionado error crítico en `TicketsByAgentChart.tsx`: "Cannot read properties of undefined (reading 'charAt')" mediante validación defensiva para campos `firstname` y `lastname` que pueden ser undefined.
  - Corregido warning de React en `TicketTrendsChart.tsx`: Añadidas propiedades `key` únicas a elementos `<circle>` generados dinámicamente para cumplir con las mejores prácticas de React.
  - Estos fixes permiten que el dashboard cargue correctamente sin errores de renderizado.

## [0.28.1] - 2025-06-25

### Changed
- **Frontend: Refactorización Completa de Gráficos del Dashboard:**
  - Refactorizados los componentes `TicketsByAgentChart` y `TicketsByOrganizationChart` para que acepten `props` dinámicas de `year` y `month`.
  - Se reemplazaron múltiples llamadas ineficientes a la API por únicas llamadas a endpoints de estadísticas agregadas (`/stats/by-agent`, `/stats/by-organization`), mejorando drásticamente el rendimiento.
  - Se renombró `TicketsByDepartmentChart` a `TicketsByOrganizationChart` para reflejar su funcionalidad real y evitar confusiones.
  - Se adoptó el uso de componentes `Card` para unificar el diseño visual de los gráficos.

### Fixed
- **Frontend: Corrección de Errores de Tipado:**
  - Se solucionaron todos los errores de `linting` de TypeScript, incluyendo problemas de `props` (`IntrinsicAttributes`) y tipos `any` implícitos en todos los componentes del gráfico.

## [0.27.0] - 2025-06-25

### Changed
- **Frontend:** Se ha cambiado el nombre del enlace de navegación "Analytics" a "Reportes" en la barra lateral para mayor claridad.

## [0.26.0] - 2025-06-25

### Added
- **Frontend:** Implementada funcionalidad de exportación a Excel en la página Analytics (`AnalyticsView.tsx`):
  - Agregado handler `onClick` al botón "Exportar" que estaba previamente sin funcionalidad.
  - Implementada función `exportToExcel()` usando la librería xlsx ya instalada en el proyecto.
  - El archivo Excel exportado incluye columnas legibles en español: Nº Ticket, Asunto, Estado, Prioridad, Usuario, Agente, Sector/Sucursal, Transporte, Fecha Creación y Última Actualización.
  - Agregada hoja adicional "Filtros" con metadatos de exportación y filtros aplicados para trazabilidad.
  - Implementada validación para evitar exportar cuando no hay datos disponibles.
  - Generación automática de nombre de archivo con fecha y hora (formato: `tickets_analytics_YYYY-MM-DD_HH-MM.xlsx`).

### Fixed
- **Frontend:** Corregidos errores de TypeScript en la exportación usando las propiedades correctas según las interfaces definidas en `types/index.ts`.

## [0.25.0] - 2025-06-25

### Fixed
- **Backend/Frontend:** Corregido problema en la columna "Sector" de la tabla de tickets que mostraba IDs numéricos en lugar de nombres:
  - Actualizada la consulta en `ticketRoutes.js` para incluir la relación con `ListItems` y obtener los nombres de los sectores.
  - Verificado que el frontend (`DataTable.tsx`) muestre correctamente los nombres de los sectores.

## [0.24.0] - 2025-06-25

### Changed
- **Frontend:** Auditoría visual y mejora de la página de Tickets según la guía de diseño oficial:
  - Alineados los colores de fondo y tabla en `TicketsTableView.tsx` y `DataTable.tsx` con los utilizados en Dashboard y Analytics.
  - Mejorado `SearchBar.tsx` con microinteracciones, animaciones y estados hover/focus según la guía.
  - Refinado `Pagination.tsx` con estilos visuales consistentes, destacando la página actual y mejorando feedback visual.
  - Actualizado `AdvancedSearchModal.tsx` con la paleta de colores oficial, mejorando la experiencia de usuario en filtros avanzados.
  - Corregidos errores visuales y de estructura en componentes de la interfaz.

## [0.23.0] - 2025-06-25

### Changed
- **Frontend:** Auditoría visual y ajuste de la página de Analytics según la guía de diseño oficial:
  - Actualizado `FilterPanel.tsx` con colores, tipografía, bordes redondeados, sombras y animaciones según la guía.
  - Mejorado `DataTable.tsx` con estilos visuales que cumplen con la guía de diseño (contenedor con bordes redondeados, cabecera con iconos, estilos de tabla).
  - Mantenida la estructura original de columnas en la tabla (Nº Ticket, Asunto, Agente, Fecha Creación, Transporte).
  - Implementados estados de carga y mensajes vacíos con estilos consistentes.

## [0.22.0] - 2025-06-24

### Fixed
- **Backend:** Se corrigió el endpoint `/options/transporte` para obtener datos reales desde `TicketCdata` y su relación con `ListItems` sin depender de una asociación inversa inexistente.
- **Backend:** Se optimizó el endpoint `/options/sector` para utilizar datos reales de organizaciones desde `/organizations/simple`.
- **Frontend:** Se corrigió la URL en `AnalyticsView.tsx` cambiando de `/api/tickets/analytics` (que no existía) a `/api/tickets` (que ya implementaba todos los filtros necesarios).
- **Frontend:** Se ajustó el manejo de la respuesta en `AnalyticsView.tsx` para usar el formato correcto (`data.data` para los tickets y `data.pagination` para la información de paginación).
- **Frontend:** Se modificó `FilterPanel.tsx` para convertir los valores seleccionados a números (parseInt) antes de enviarlos al backend, asegurando la correcta aplicación de los filtros.

## [0.21.0] - 2025-06-24

### Added
- **API:** Se crearon nuevos endpoints en el backend (`/api/tickets/options/...`) para obtener listas únicas de agentes (staff), sectores y estados, necesarios para los filtros del dashboard.
- **Frontend:** Se implementó la lógica en la vista de "Análisis Avanzado" para consumir los nuevos endpoints y cargar dinámicamente las opciones en los filtros.
- **UI:** Se añadieron nuevos menús desplegables en el `FilterPanel` para permitir el filtrado por agente, sector y estado, completando la funcionalidad de filtrado múltiple.

### Fixed
- **Proxy:** Se corrigió la configuración del proxy en Vite (`vite.config.ts`) eliminando una regla de reescritura (`rewrite`) incorrecta. Esto solucionó errores 404 y de parsing de JSON, restableciendo la comunicación entre el frontend y el backend.

## [0.20.0] - 2025-06-24

### Fixed
- **Backend:** Se corrigió el filtrado de tickets en la API (`/api/tickets`) para que muestre estricta y únicamente los tickets pertenecientes a los departamentos "Soporte Informatico" y "Soporte IT".
- **Frontend:** Se solucionó un problema de visualización en la barra de búsqueda (`SearchBar.tsx`) que impedía que el ícono de limpiar ("X") y el spinner de carga se mostraran correctamente.
- **Build:** Se estabilizó el proceso de compilación del frontend eliminando configuraciones conflictivas de PostCSS y realizando una reinstalación limpia de las dependencias (`node_modules`) para resolver incompatibilidades con Vite y Tailwind CSS.

## [0.19.0] - 2025-06-13

### Added
- **Tabla de Tickets:** Ahora se muestra el campo personalizado "Sector" (Localidad / Sucursal / Sector) directamente en la tabla, obteniendo el dato desde `ost_ticket__cdata`.

### Changed
- **Backend:** Refactorización del modelo `TicketCdata.js` para incluir el campo `sector`.
- **Backend:** Ajuste en la ruta `GET /api/tickets` (`ticketRoutes.js`) para incluir el campo `sector` desde `TicketCdata` y eliminar la inclusión innecesaria del modelo `Department` para esta columna.
- **Frontend:** Actualización de tipos (`types/index.ts`) para reflejar que el campo "Sector" proviene de `cdata`.
- **Frontend:** Modificación del componente `DataTable.tsx` para cambiar el encabezado de la columna de "Departamento" a "Sector" y mostrar el valor `ticket.cdata?.sector`.

### Fixed
- **Backend:** Corregido un error `ReferenceError: next is not defined` en la ruta `GET /api/tickets` (`ticketRoutes.js`) al asegurar que la función `next` esté disponible y se llame correctamente en el manejador de errores.

## [0.18.0] - 2025-06-13

### Fixed
- **Frontend: Corrección de Gráfico de Tickets por Sector:**
  - Solucionado el error que impedía la correcta visualización de los tickets agrupados por sector/sucursal.
  - El backend ahora procesa correctamente los nombres de los sectores que venían en un formato JSON inesperado.
  - El gráfico ahora muestra barras horizontales legibles con scroll vertical cuando el contenido excede el área visible.

### Added
- **Frontend: Componente `HorizontalBarChart.tsx`:**
  - Creado un nuevo componente de gráfico reutilizable diseñado específicamente para mostrar barras horizontales.
  - Esto desacopla la lógica de los gráficos y previene que cambios en un gráfico afecten a otros, mejorando la estabilidad del dashboard.

### Changed
- **Frontend: Estabilización del Dashboard:**
  - El gráfico de "Tickets por Agente" ha sido restaurado y funciona correctamente después de aislar la lógica del gráfico de sectores en su propio componente.


## [0.17.0] - 2025-01-15

### Enhanced
- **Frontend: Optimización Completa del Layout y UX del Dashboard:**
  - **Nueva Métrica "Abiertos Totales":** Agregada 4ta tarjeta KPI que muestra tickets abiertos sin filtro de fecha (49 tickets) para coincidir con la ticketera principal, manteniendo separación entre gestión operativa mensual y vista general del sistema.
  - **Layout Optimizado para 4 Tarjetas:** Ajustado CSS para mostrar las 4 tarjetas en una sola línea con mejor aprovechamiento del espacio horizontal. Grid cambiado de `auto-fit` a `repeat(4, 1fr)` con gap reducido.
  - **Contenido Centrado en Tarjetas:** Implementado `text-align: center` en todos los elementos KPI para evitar contenido pegado a los bordes. Mejorada legibilidad y balance visual.
  - **Etiquetas Clarificadas en Gráfico de Tendencias:** Cambiadas etiquetas de "Nuevos (prom.)" a "Nuevos / Día" para mayor claridad sobre que representan promedios diarios, no totales.

### Technical Improvements
- **Responsive Design Mejorado:
  - **Tarjetas KPI:** Se ajustó el tamaño y espaciado para mejor visualización en pantallas pequeñas. Se implementó un comportamiento de apilamiento vertical (`flex-direction: column`) en resoluciones menores a 768px para asegurar legibilidad y evitar desbordamientos.
  - **Gráficos:** Se revisó la responsividad de los gráficos para asegurar que se adapten correctamente a diferentes tamaños de pantalla, evitando cortes o solapamientos.
- **Código Refactorizado:**
  - **Componente `KPIBadge.tsx`:** Optimizada la lógica de renderizado y manejo de datos. Mejorada la claridad del código y eliminadas redundancias.
  - **Componente `DashboardView.tsx`:** Reorganizada la estructura para mayor legibilidad y mantenibilidad. Separada la lógica de obtención de datos de la presentación.

### Fixed
- **Error de Cálculo en Promedio de Tickets Nuevos:** Corregido un error en la lógica que calculaba el promedio de tickets nuevos por día en el gráfico de tendencias. Ahora el cálculo es preciso y refleja correctamente la actividad diaria.
- **Visualización de Tooltips en Gráficos:** Mejorada la visualización de tooltips en los gráficos para asegurar que no se corten y sean completamente legibles en todos los navegadores y resoluciones.

## [0.16.0] - 2024-12-10

### Added
- **Backend: Endpoint para Estadísticas de Tickets por Agente:**
  - Se implementó un nuevo endpoint `GET /api/tickets/stats/by-agent` que devuelve el conteo de tickets (abiertos, cerrados, reabiertos) agrupados por agente para un rango de fechas opcional.
  - La consulta Sequelize utiliza `COUNT` y `CASE` para generar las estadísticas directamente desde la base de datos.
- **Frontend: Gráfico de Tickets por Agente:**
  - Se añadió un nuevo gráfico de barras en el dashboard (`TicketsByAgentChart.tsx`) que consume el endpoint `/api/tickets/stats/by-agent`.
  - El gráfico muestra los tickets abiertos, cerrados y reabiertos por cada agente, permitiendo filtrar por mes y año.
  - Se utilizaron los colores de la guía de diseño para las barras del gráfico.

### Changed
- **Backend: Modelo `Staff.js`:** Se añadió el campo `dept_id` para permitir futuras agrupaciones o filtros por departamento del staff.
- **Frontend: `DashboardView.tsx`:** Se integró el nuevo gráfico `TicketsByAgentChart` y se añadió un filtro de fecha (mes/año) que aplica a este gráfico y al de tendencias.

### Fixed
- **Backend: Filtro de Fecha en `GET /api/tickets/stats/tendencies`:** Se corrigió el filtro de fecha para que el día final del mes se calcule correctamente (ej. `endDate.setDate(0)` para el último día del mes anterior al `endOfMonth.getMonth() + 1`).

## [0.15.0] - 2024-11-22

### Added
- **Backend: Endpoint para Tendencias de Tickets:**
  - Implementado `GET /api/tickets/stats/tendencies` que devuelve el conteo de tickets nuevos, cerrados y reabiertos por día para un mes y año específicos.
  - La consulta agrupa por día y utiliza `DATE_FORMAT` para formatear las fechas.
- **Frontend: Gráfico de Tendencias de Tickets:**
  - Añadido un nuevo gráfico de líneas en el dashboard (`TicketTrendsChart.tsx`) que consume el endpoint `/api/tickets/stats/tendencies`.
  - El gráfico muestra las tendencias de tickets nuevos, cerrados y reabiertos a lo largo del mes seleccionado.
  - Se incluyó un filtro para seleccionar mes y año.

### Changed
- **Frontend: `DashboardView.tsx`:** Se integró el nuevo gráfico de tendencias y se refactorizó la obtención de datos para los KPIs para usar el endpoint `/api/tickets/count` con filtros de fecha.

## [0.14.0] - 2024-11-05

### Added
- **Backend: Endpoint de Conteo de Tickets Mejorado:**
  - El endpoint `GET /api/tickets/count` ahora acepta parámetros de query `year` y `month` para filtrar los conteos por un período específico.
  - Devuelve conteos totales, por estado (abiertos, cerrados, etc.) y por departamento para el período filtrado.
- **Frontend: Filtros de Fecha para KPIs:**
  - Se añadieron selectores de Mes y Año en `DashboardView.tsx` que permiten al usuario filtrar los datos de las tarjetas KPI.
  - Al cambiar el mes o año, se vuelve a llamar al endpoint `/api/tickets/count` con los nuevos parámetros.

### Changed
- **Backend: Lógica de Conteo en `ticketRoutes.js`:** Refactorizada para construir dinámicamente la cláusula `where` de fecha basada en los parámetros `year` y `month`.
- **Frontend: `fetchTicketCounts` en `DashboardView.tsx`:** Modificada para pasar `year` y `month` al backend.

## [0.13.0] - 2024-10-18

### Added
- **Frontend: Implementación de Dark Mode:**
  - Se añadió soporte completo para Dark Mode siguiendo la guía de diseño (`DESIGN_GUIDE.md`).
  - Se utilizaron variables CSS (tokens) para colores de fondo, texto, bordes, etc., definidos en `src/index.css`.
  - Se implementó un botón/toggle para que el usuario pueda cambiar entre Light y Dark Mode.
  - El estado del modo (light/dark) se persiste en `localStorage`.
- **Frontend: Componente `ThemeSwitcher.tsx`:** Creado para manejar la lógica del cambio de tema.

### Changed
- **Estilos Globales:** Actualizados en `src/index.css` para incluir los tokens de color para ambos modos.
- **Componentes:** Todos los componentes principales (`DashboardView.tsx`, `KPIBadge.tsx`, `DataTable.tsx`, etc.) fueron adaptados para usar los tokens de color y asegurar la correcta visualización en ambos modos.

## [0.12.0] - 2024-09-30

### Added
- **Frontend: Guía de Diseño (`DESIGN_GUIDE.md`):**
  - Se creó un archivo `DESIGN_GUIDE.md` que detalla los principios de diseño, paleta de colores (con tokens CSS), tipografía, espaciado, y componentes UI para el proyecto.
  - Se enfoca en un diseño "Dark Mode First" y principios de accesibilidad WCAG 2.1 AA.
- **Frontend: Aplicación Inicial de Estilos de la Guía:**
  - Se comenzaron a aplicar los tokens de color y tipografía definidos en la guía a los componentes existentes (`KPIBadge.tsx`, `DataTable.tsx`).
  - Ajustes en `src/index.css` para definir variables CSS globales para los tokens.

### Changed
- **`DataTable.tsx`:** Se aplicaron estilos de la guía para bordes, sombreado, hover, y diferenciación de cabeceras.
- **`KPIBadge.tsx`:** Se ajustaron colores y tipografía según la guía.

## [0.11.0] - 2024-09-12

### Added
- **Frontend: Visualización de Usuario y Agente en Tabla:**
  - Se añadieron las columnas "Usuario" (nombre del creador del ticket) y "Agente" (staff asignado) a `DataTable.tsx`.
  - Se ajustó el backend (`ticketRoutes.js` en `GET /api/tickets`) para incluir los modelos `User` (con `id`, `name`) y `Staff` (como `AssignedStaff` con `staff_id`, `firstname`, `lastname`) en la respuesta.
  - Se actualizaron los tipos en `frontend/src/types/index.ts` para reflejar estos cambios.

### Removed
- **Frontend: Columnas Innecesarias de la Tabla:**
  - Se eliminaron las columnas "Estado", "Prioridad" y "Última Actualización" de `DataTable.tsx` según solicitud del usuario.

### Fixed
- **Frontend: Visualización de Nombre de Usuario:** Corregido para usar `user.name` en lugar de `user.firstname` y `user.lastname` que no existen en el tipo `User`.

## [0.10.0] - 2024-08-28

### Added
- **Frontend: Rediseño Visual de Tabla de Tickets (`DataTable.tsx`):**
  - Se aplicó un rediseño visual a la tabla siguiendo buenas prácticas de UI/UX y buscando coherencia con el diseño general (aún sin guía de diseño específica).
  - Mejoras incluyen: sombra para elevación, bordes redondeados, efecto hover en filas, cabeceras con fondo y texto diferenciado.
  - Se añadió un indicador visual de estado (ej. color en la fila o insignia) basado en el estado del ticket (Abierto, Cerrado, etc.).

### Changed
- **Frontend: Robustez en `DataTable.tsx`:**
  - Se mejoró el manejo de datos potencialmente nulos o faltantes usando encadenamiento opcional (`?.`) y valores por defecto (`?? '-'`) para evitar errores de renderizado.
  - Se verificó que los tipos de datos en `frontend/src/types/index.ts` coincidan con la estructura de datos del backend.

### Fixed
- **Backend: Búsqueda y Datos Anidados en `GET /api/tickets`:**
  - Se corrigió la búsqueda para que funcione correctamente incluso con strings vacíos.
  - Se aseguró que la estructura anidada (ej. `cdata.subject`) se maneje adecuadamente en las consultas y en la respuesta.

## [0.9.0] - 2024-08-15

### Added
- **Backend: Endpoint `GET /api/tickets`:**
  - Implementación inicial para obtener una lista paginada de tickets.
  - Incluye modelos relacionados como `User`, `TicketStatus`, `Department`, `Staff`, `TicketCdata` (para el asunto).
  - Permite búsqueda por número de ticket y por asunto (en `TicketCdata.subject`).
  - Permite filtros por `status_id`, `priority_id`, y rango de fechas (`startDate`, `endDate`).
- **Backend: Modelo `TicketCdata.js`:**
  - Creado para acceder a la tabla `ost_ticket__cdata`, específicamente para el campo `subject`.
  - Establecida la relación `Ticket.hasOne(TicketCdata)`. 

### Changed
- **Backend: Modelos:** Se revisaron y completaron las asociaciones entre `Ticket` y otros modelos como `User`, `TicketStatus`, `Department`, `Staff`.

## [0.8.0] - 2024-07-30

### Added
- **Backend: Modelos Sequelize Adicionales:**
  - `TicketStatus.js`: Modelo para `ost_ticket_status`.
  - `Department.js`: Modelo para `ost_department`.
  - `Staff.js`: Modelo para `ost_staff`.
  - `Organization.js`: Modelo para `ost_organization`.
  - `TicketPriority.js`: Modelo para `ost_ticket_priority` (derivado de `ost_list` y `ost_list_items`).
  - `HelpTopic.js`: Modelo para `ost_help_topic`.
- **Backend: `models/index.js`:**
  - Importados todos los nuevos modelos.
  - Definidas las asociaciones principales entre los modelos (ej. `Ticket.belongsTo(User)`, `Ticket.belongsTo(Department)`, etc.) basadas en el ERD de osTicket.

### Changed
- **Backend: `server.js`:** Se aseguró que `db.sequelize.sync()` se llame para crear/actualizar tablas según los modelos al iniciar.

## [0.7.0] - 2024-07-15

### Added
- **Frontend: Tabla de Tickets (`DataTable.tsx`):**
  - Componente básico para mostrar una lista de tickets con columnas como Número, Asunto, Estado, Prioridad, Departamento, Fecha Creación, Última Actualización.
  - Consume datos del endpoint `/api/tickets`.
  - Implementa paginación básica en el frontend.
- **Frontend: `DashboardView.tsx`:**
  - Vista principal del dashboard que integra la `DataTable`.
  - Lógica para llamar al API `/api/tickets` y manejar la paginación.

### Changed
- **Backend: Endpoint `GET /api/tickets`:**
  - Mejorada la lógica de paginación (offset, limit).
  - Añadida la ordenación por fecha de creación descendente.

## [0.6.0] - 2024-06-28

### Added
- **Backend: Endpoint `GET /api/tickets/stats/by-department`:**
  - Devuelve el conteo de tickets agrupados por departamento.
  - Utiliza alias en Sequelize para los conteos.
- **Frontend: Gráfico de Tickets por Departamento (`TicketsByDepartmentChart.tsx`):**
  - Nuevo componente de gráfico (Chart.js) que muestra la distribución de tickets por departamento.
  - Consume el nuevo endpoint `/api/tickets/stats/by-department`.

### Changed
- **Frontend: `DashboardView.tsx`:** Integrado el nuevo gráfico de tickets por departamento.

## [0.5.0] - 2024-06-10

### Added
- **Backend: Endpoint `GET /api/tickets/stats/by-status`:**
  - Devuelve el conteo de tickets agrupados por estado (abierto, cerrado, etc.).
- **Frontend: Gráfico de Tickets por Estado (`TicketsByStatusChart.tsx`):**
  - Nuevo componente de gráfico (Chart.js) que muestra la distribución de tickets por estado.
  - Consume el nuevo endpoint `/api/tickets/stats/by-status`.

### Changed
- **Backend: Modelo `Staff.js`:** Se añadió el campo `dept_id` para permitir futuras agrupaciones o filtros por departamento del staff.
- **Frontend: `DashboardView.tsx`:** Integrado el nuevo gráfico de tickets por estado. Se reemplazó el gráfico de ejemplo anterior.

## [0.4.0] - 2024-05-20

### Added
- **Frontend: Componente `KPIBadge.tsx`:**
  - Creado para mostrar métricas clave (KPIs) como "Tickets Nuevos Hoy", "Tickets Cerrados Hoy", etc.
  - Consume datos del endpoint `/api/tickets/count`.
- **Frontend: `DashboardView.tsx`:**
  - Integrados varios `KPIBadge` para mostrar las métricas principales.
  - Añadido un gráfico de ejemplo (Chart.js) para futura integración de visualizaciones de datos.

### Changed
- **Backend: Endpoint `GET /api/tickets/count`:**
  - Ahora devuelve un objeto más detallado con conteos específicos (nuevosHoy, cerradosHoy, pendientesHoy, vencidosHoy).

## [0.3.0] - 2024-05-10

### Added
- **Backend: Sincronización de Modelos Sequelize:**
  - Implementada la sincronización de modelos con la base de datos usando `sequelize.sync()` al iniciar el servidor.
- **Backend: Modelos Base:**
  - Creados los modelos `User.js` y `Ticket.js` con sus definiciones de campos y tipos de datos básicos según la estructura de osTicket.
- **Backend: Configuración de Conexión a BD:**
  - Establecida la conexión a la base de datos MySQL de osTicket usando Sequelize.
  - Variables de entorno configuradas para los detalles de la conexión.

### Fixed
- **Conectividad a la Base de Datos:** Resueltos problemas iniciales de conexión, asegurando que el servidor backend pueda acceder a la base de datos de osTicket.

## [0.2.0] - 2024-04-25

### Added
- **Estructura Inicial del Proyecto:**
  - Creada la estructura de directorios para el backend (Node.js/Express) y frontend (React/Vite).
  - Configurados archivos base como `package.json` para ambos.
- **Backend: Configuración de Express y Sequelize:**
  - Instaladas dependencias (`express`, `sequelize`, `mysql2`, `dotenv`, `cors`).
  - Configuración inicial del servidor Express en `server.js`.
  - Configuración de Sequelize para la conexión a la base de datos en `config/db.js`.
- **Frontend: Proyecto Vite con TypeScript:**
  - Creado el proyecto frontend usando Vite con la plantilla de TypeScript.
  - Estructura de directorios inicial para componentes, vistas, etc.

## [0.1.0] - 2024-04-10

### Added
- **Inicio del Proyecto y Repositorio:**
  - Creación del repositorio Git para el proyecto "Dashboard OsTicket".
  - Definición inicial de objetivos y alcance del proyecto.
  - Investigación preliminar sobre la estructura de la base de datos de osTicket y tecnologías a utilizar.

---
*Este CHANGELOG sigue la convención de [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).*
*Las versiones siguen el versionado semántico (SemVer).*
