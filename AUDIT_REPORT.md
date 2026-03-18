# 🔍 REPORTE DE AUDITORÍA COMPLETA - osTicket Dashboard

**Fecha:** Junio 2025  
**Auditor:** Cascade AI  
**Versión del proyecto:** v1.2  
**Alcance:** Seguridad, Backend, Frontend, SLA, KPIs, Arquitectura

---

## 📋 RESUMEN EJECUTIVO

Se realizó una auditoría integral del proyecto osTicket Dashboard, cubriendo seguridad, calidad de código, arquitectura, rendimiento y funcionalidad. Se identificaron **38 hallazgos** clasificados por severidad:

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🔴 CRÍTICA | 4 | Credenciales expuestas, código muerto con secrets |
| 🟠 ALTA | 12 | Dead code, errores de arquitectura, duplicación masiva |
| 🟡 MEDIA | 14 | Code smells, inconsistencias, mejoras de rendimiento |
| 🔵 BAJA | 8 | Mejoras cosméticas, documentación, convenciones |

---

## 🔴 HALLAZGOS CRÍTICOS (Severidad: CRÍTICA)

### SEC-001: Credenciales SSH hardcodeadas en documentación versionada

**Archivo:** `INSTRUCCIONES_DESPLIEGUE.md` línea 14-15  
**Problema:** Contraseña SSH expuesta en texto plano dentro del repositorio Git.
```
ssh soporte@***REDACTED_SERVER_IP***
# Contraseña: ***REDACTED_SSH_PASSWORD***
```
**Impacto:** Cualquiera con acceso al repositorio tiene acceso SSH al servidor de producción.  
**Acción:** Eliminar inmediatamente el archivo o reescribirlo sin credenciales. Rotar la contraseña SSH. Considerar autenticación por clave pública.

---

### SEC-002: Credenciales de base de datos hardcodeadas en script de debug

**Archivo:** `backend/query-threads.js` líneas 9-13  
**Problema:** Host, usuario y contraseña de la base de datos en texto plano.
```javascript
host: '***REDACTED_DB_HOST***',
user: 'powerbi',
password: '***REDACTED_DB_PASSWORD***',
database: 'osticketdb'
```
**Impacto:** Exposición directa de credenciales de producción.  
**Acción:** Eliminar este archivo del repositorio y del historial de Git (`git filter-branch` o BFG Repo-Cleaner). Rotar las credenciales.

---

### SEC-003: Scripts de debug/investigación en producción

**Archivos:**
- `backend/debug-threads.js` (85 líneas) — Servidor Express de debug en puerto 3002
- `backend/investigate-db.js` (125 líneas) — Script de investigación de BD
- `backend/query-threads.js` (125 líneas) — Script con credenciales hardcodeadas

**Problema:** Tres scripts de desarrollo/debug que nunca debieron ser commiteados. Exponen estructura interna de la BD, ejecutan queries sin restricción, y uno contiene credenciales.  
**Acción:** Eliminar los tres archivos. Agregar scripts de debug al `.gitignore`.

---

### SEC-004: Infraestructura de producción expuesta en documentación

**Archivos:** `docs/DESPLIEGUE.md`, `INSTRUCCIONES_DESPLIEGUE.md`  
**Problema:** IP del servidor (`***REDACTED_SERVER_IP***`), rutas internas (`/var/www/dashboardsop/`), configuración Apache con rutas de certificados SSL, nombre del proceso PM2, y detalles de infraestructura expuestos.  
**Acción:** Mover guías de deploy a un repositorio privado separado o a un wiki interno. No versionar datos de infraestructura.

---

## 🟠 HALLAZGOS DE SEVERIDAD ALTA

### BE-001: `ticketRoutes.js` — module.exports duplicado y rutas inalcanzables

**Archivo:** `backend/routes/ticketRoutes.js` líneas 661, 1210  
**Problema:** `module.exports = router;` aparece en la línea 661 y luego de nuevo en la línea 1210. Las rutas definidas después de la línea 661 (`/stats/by-organization`, `/stats/tendencies`, opciones, `/:id`) **podrían no registrarse correctamente** dependiendo de cómo Node.js procese el módulo, ya que la primera exportación se ejecuta antes que esas rutas.  
**Acción:** Eliminar el primer `module.exports` (línea 661) y dejar solo el de la línea 1210.

---

### BE-002: `ticketRoutes.js` — Referencias a modelos inexistentes

**Archivo:** `backend/routes/ticketRoutes.js` líneas 427-434, 611-613  
**Problema:** Las rutas `/stats/by-transport` y `/export` referencian modelos `Location`, `Team`, `Topic` que **no están importados ni definidos** en el archivo de modelos (`backend/models/index.js`). Estas rutas fallarán en runtime con `ReferenceError`.  
**Acción:** Eliminar las rutas rotas o implementar los modelos faltantes.

---

### BE-003: Exceso masivo de `console.log` de debug en producción

**Archivos:** `backend/routes/ticketRoutes.js` (30+ console.log con prefijo `[DEBUG]` y `[DEBUG TEMPORAL]`)  
**Problema:** Logs de debug extensos que incluyen dumps de objetos completos, investigaciones temporales (líneas 176-213), y datos sensibles como estructura de queries.  
**Acción:** Reemplazar todos los `console.log` por el logger del proyecto. Eliminar todo log marcado como `[DEBUG TEMPORAL]`. Los logs de debug solo deben activarse con `NODE_ENV=development`.

---

### BE-004: `slaRoutes.js` — Funciones de formateo duplicadas

**Archivo:** `backend/routes/slaRoutes.js`  
**Problema:** Las funciones `formatHorasHabiles`, `formatDiferenciaSLA`, y `formatTime` están definidas **dentro de cada handler de ruta** (líneas 171-181, 184-192, 493-498, 502-509, 513-518, 630-635). Esto viola DRY con al menos 6 funciones duplicadas.  
**Acción:** Extraer a `backend/utils/formatters.js` y reutilizar.

---

### BE-005: `slaRoutes.js` `/summary` usa TIMESTAMPDIFF en vez de horas hábiles

**Archivo:** `backend/routes/slaRoutes.js` líneas 578-627  
**Problema:** El endpoint `/api/sla/summary` usa `TIMESTAMPDIFF(HOUR, ...)` (horas calendario) mientras que `/api/sla/stats` usa `calcularHorasHabiles()` (horas hábiles). Esto genera **inconsistencia de datos** entre las tarjetas de resumen y la tabla detallada.  
**Acción:** Migrar `/summary` para que también use la función `calcularHorasHabiles`.

---

### BE-006: `/sla/tickets` inconsistente con `/sla/stats`

**Archivo:** `backend/routes/slaRoutes.js` líneas 383-556  
**Problema:** Similar a BE-005, el endpoint `/tickets` usa `TIMESTAMPDIFF` (horas calendario) para determinar cumplimiento SLA, mientras que `/stats` usa horas hábiles. Un ticket puede aparecer como "cumplido" en una vista y "vencido" en otra.  
**Acción:** Unificar toda la lógica SLA para usar horas hábiles consistentemente.

---

### FE-001: Archivo muerto `SLAAlertView_new.tsx`

**Archivo:** `frontend/src/views/SLAAlertView_new.tsx` (464 líneas)  
**Problema:** Versión alternativa/borrador del componente SLAAlertView que no se usa en ninguna ruta. Dead code puro de 464 líneas.  
**Acción:** Eliminar.

---

### FE-002: Archivos duplicados de tipos y utilidades

**Archivos:**
- `frontend/src/types/index.js` (3 líneas, vacío) + `frontend/src/types/index.ts` (220 líneas)
- `frontend/src/lib/utils.js` + `frontend/src/lib/utils.ts`
- `frontend/src/utils/formatters.js` + `frontend/src/utils/formatters.ts`

**Problema:** Pares de archivos `.js`/`.ts` donde el `.js` es un stub vacío o duplicado. Genera confusión sobre cuál es la fuente de verdad.  
**Acción:** Eliminar los archivos `.js` redundantes.

---

### FE-003: Carpetas de contexto duplicadas

**Archivos:**
- `frontend/src/context/` — NotificationContext, SidebarContext, SoundContext
- `frontend/src/contexts/` — ConfigContext, ThemeContext

**Problema:** Dos carpetas con nombres casi idénticos (`context` vs `contexts`). Rompe convención y dificulta encontrar providers.  
**Acción:** Unificar en una sola carpeta `context/` o `contexts/`.

---

### FE-004: `SLAStatsView.tsx` redefine interface duplicando types

**Archivo:** `frontend/src/views/SLAStatsView.tsx` líneas 6-22  
**Problema:** Define `interface SLAStat` localmente cuando ya existe `SLAStats` en `types/index.ts` con la misma estructura. Además usa hack `(existing as any)._recordCount` (línea 79-84) para trackear consolidación.  
**Acción:** Importar y reutilizar el tipo de `types/index.ts`. Refactorizar la consolidación usando un Map limpio.

---

### BE-007: Datos de ejemplo hardcodeados como fallback

**Archivo:** `backend/routes/ticketRoutes.js` líneas 775-783  
**Problema:** Si no hay datos reales, el endpoint `/stats/by-organization` retorna datos ficticios hardcodeados (`"Empresa A"`, `"Soporte General"`, `"Sector Finanzas"`). Esto puede confundir a usuarios del dashboard.  
**Acción:** Retornar array vacío. El frontend debe manejar el estado vacío.

---

## 🟡 HALLAZGOS DE SEVERIDAD MEDIA

### BE-008: `backend/config/.env` no está en `backend/.gitignore`

**Archivo:** `backend/.gitignore`  
**Problema:** El `.gitignore` del backend no incluye `.env` ni `config/.env`. Depende del `.gitignore` raíz que sí tiene `.env`. Si alguien clona solo el backend, el `.env` podría versionarse.  
**Acción:** Agregar `config/.env` y `config/.env.local` al `backend/.gitignore`.

---

### BE-009: Error handler middleware no se usa consistentemente

**Archivo:** `backend/routes/slaRoutes.js`, `backend/routes/ticketRoutes.js`  
**Problema:** Algunos handlers llaman `next(error)`, otros retornan `res.status(500).json(...)` directamente. El middleware `errorHandler.js` existe pero no se aplica consistentemente. Algunos errores exponen `error.sql` al cliente (slaRoutes línea 238).  
**Acción:** Estandarizar: siempre usar `next(error)`. Nunca exponer SQL al cliente en producción.

---

### BE-010: `/sla/alerts` calcula horas hábiles por cada ticket abierto en cada request

**Archivo:** `backend/routes/slaRoutes.js` líneas 283-308  
**Problema:** Cada llamada a `/api/sla/alerts` ejecuta `calcularHorasHabiles` y `calcularEstadoSLA` para **cada ticket abierto** (potencialmente cientos). Cada cálculo consulta feriados y itera día por día. Sin caching de resultados.  
**Acción:** Implementar caching de alertas (Redis o in-memory con TTL de 2-5 min). Pre-computar estados SLA periódicamente.

---

### BE-011: `/sla/stats` hace `Promise.all` sobre todos los tickets cerrados

**Archivo:** `backend/routes/slaRoutes.js` líneas 86-107  
**Problema:** Para cada ticket cerrado, ejecuta `calcularHorasHabiles` (que es async y accede a BD). Con miles de tickets, esto genera miles de promesas simultáneas. Sin paginación ni límite.  
**Acción:** Procesar en batches (ej: 100 tickets por batch). Considerar calcular horas hábiles en una vista SQL materializada.

---

### FE-005: `SLAAlertView.tsx` — Filtros compartidos entre secciones

**Archivo:** `frontend/src/views/SLAAlertView.tsx`  
**Problema:** Los 6 estados de filtro (filterTicket, filterAgent, filterSla, etc.) son compartidos entre las 3 tablas (vencidos, críticos, en riesgo). Filtrar en una tabla afecta las tres.  
**Acción:** Independizar los filtros por sección o agregar un filtro global explícito.

---

### FE-006: Normalización excesiva de datos del backend

**Archivo:** `frontend/src/views/SLAAlertView.tsx` líneas 93-141  
**Problema:** Se normalizan manualmente 30+ campos con `Number()` en cada request. Si el backend devolviera tipos correctos, esto no sería necesario.  
**Acción:** Arreglar los tipos de retorno en el backend. Usar un middleware de serialización consistente.

---

### FE-007: `DashboardView` y `SLADashboardView` no usan React Query

**Problema:** Todas las vistas hacen fetching manual con `useEffect` + `useState` + `try/catch`. No hay caching, deduplicación, ni revalidación automática. El proyecto tiene `axios` pero no aprovecha React Query (que está en las dependencias).  
**Acción:** Migrar gradualmente el data fetching a React Query (TanStack Query) para caching, stale-while-revalidate, y mejor UX.

---

### FE-008: Sin manejo de errores visible al usuario

**Problema:** Cuando un fetch falla, se loguea al console pero el usuario no ve ningún mensaje de error. Las vistas quedan en blanco o con datos vacíos sin explicación.  
**Acción:** Implementar estado de error con componente de retry para cada vista.

---

### FE-009: Exportación a Excel usa HTML table hack

**Archivo:** `frontend/src/views/SLAStatsView.tsx` líneas 164-230  
**Problema:** La exportación a "Excel" genera una tabla HTML con extensión `.xls`. No es un archivo Excel real (XLSX). El proyecto ya tiene la dependencia `xlsx` instalada.  
**Acción:** Usar la librería `xlsx` que ya está instalada para generar archivos XLSX reales.

---

### BE-012: Logger usa `appendFileSync` (síncrono, bloquea event loop)

**Archivo:** `backend/utils/logger.js` línea 27, 31  
**Problema:** `fs.appendFileSync` bloquea el event loop de Node.js en cada escritura de log en producción. Con alto volumen, degrada rendimiento.  
**Acción:** Usar `fs.appendFile` (async) o migrar a una librería como `pino` o `winston`.

---

### BE-013: No hay rate limiting ni validación de input

**Problema:** Ningún endpoint tiene rate limiting. Los parámetros de query (`year`, `month`, `agent`, etc.) se parsean con `parseInt` sin validación de rango. No hay sanitización de inputs SQL (Sequelize parameteriza, pero los raw queries en slaRoutes usan `replacements` correctamente).  
**Acción:** Agregar `express-rate-limit`. Validar rangos de parámetros (year: 2000-2100, month: 1-12, etc.).

---

### FE-010: `App.tsx` — Indentación inconsistente en Routes

**Archivo:** `frontend/src/App.tsx` líneas 37-44  
**Problema:** Mezcla de indentación (línea 38 tiene indentación extra respecto a sus hermanos).  
**Acción:** Corregir indentación.

---

## 🔵 HALLAZGOS DE SEVERIDAD BAJA

### DOC-001: 10 archivos de documentación en `docs/`, algunos redundantes

**Problema:** `INSTRUCCIONES_DESPLIEGUE.md` (raíz) duplica información de `docs/DESPLIEGUE.md`. El `CHANGELOG.md` en docs tiene 900+ líneas con detalles de debugging.  
**Acción:** Consolidar documentación. Eliminar `INSTRUCCIONES_DESPLIEGUE.md` de la raíz.

---

### FE-011: `react.svg` asset no utilizado

**Archivo:** `frontend/src/assets/react.svg`  
**Problema:** Asset del template de Vite, no se usa en el proyecto.  
**Acción:** Eliminar.

---

### FE-012: Nombres de componentes no convencionales

**Problema:** `datepicker-custom.css` usa kebab-case mientras el resto del proyecto usa PascalCase. Archivo CSS dentro de `modals/`.  
**Acción:** Mover a carpeta de estilos o colocarlo junto al componente que lo usa.

---

### BE-014: `models/index.js` exporta modelos en dos formatos

**Archivo:** `backend/models/index.js` líneas 19-47  
**Problema:** Los modelos se exportan tanto como propiedades directas (`db.Ticket`) como dentro de `db.models.Ticket`. Redundante.  
**Acción:** Elegir un formato y estandarizar.

---

### FE-013: Múltiples chart libraries (Chart.js + Recharts)

**Problema:** El `package.json` incluye tanto `chart.js` + `react-chartjs-2` como `recharts`. La documentación indica preferir Recharts, pero ambas están instaladas.  
**Acción:** Migrar todo a Recharts y eliminar Chart.js.

---

### FE-014: `ConfigContext.tsx` y `ThemeContext.tsx` potencialmente no usados

**Archivos:** `frontend/src/contexts/ConfigContext.tsx`, `frontend/src/contexts/ThemeContext.tsx`  
**Problema:** No aparecen referenciados en `App.tsx`. Potencial dead code.  
**Acción:** Verificar uso y eliminar si no se usan.

---

### BE-015: Timezone hardcodeada a Argentina (GMT-3)

**Archivo:** `backend/routes/ticketRoutes.js` líneas 55-56  
**Problema:** `-03:00` hardcodeado en múltiples lugares. No configurable.  
**Acción:** Mover a variable de entorno `TZ` o configuración.

---

### FE-015: `getOrganizationsDebug` función de debug en API service

**Archivo:** `frontend/src/services/api.ts` líneas 72-80  
**Problema:** Función de debug expuesta en el service de producción.  
**Acción:** Eliminar.

---

---

## 📊 AUDITORÍA SLA — Sobrecarga de Información

### Diagnóstico

El módulo SLA ocupa **3 vistas completas** (SLADashboardView, SLAAlertView, SLAStatsView) con un total de ~1,460 líneas de frontend + 654 líneas de backend. Es la sección más pesada del proyecto.

### Problemas principales

1. **3 vistas separadas con información solapada:**
   - `SLADashboardView` (Dashboard SLA): Tarjetas + gráfico tendencia + comparación agentes + tabla detallada
   - `SLAAlertView` (Monitoreo SLA): 4 tarjetas + 3 tablas colapsables con 7 columnas + filtros por columna
   - `SLAStatsView` (Análisis Histórico): 4 tarjetas + 2 gráficos + tabla sorteable + exportación

2. **Tarjetas de resumen repetidas:** Las 3 vistas muestran tarjetas de métricas muy similares (total tickets, cumplidos, vencidos, %).

3. **Datos inconsistentes entre vistas** (ver BE-005 y BE-006): Una vista calcula en horas hábiles y otra en horas calendario.

4. **Exceso de columnas en tablas:** Las tablas de SLAAlertView tienen 7 columnas + 6 filtros inline, dificultando lectura en pantallas < 1440px.

### Recomendación de simplificación

Consolidar en **2 vistas**:

| Vista | Contenido |
|-------|-----------|
| **SLA Overview** (fusión de Dashboard + Stats) | 4 KPI cards + Top 5 agentes + distribución + tabla sorteable con export |
| **SLA Monitoreo** (AlertView simplificado) | 3 tarjetas de urgencia + 1 tabla unificada con pestañas (Vencidos/Críticos/En Riesgo) + filtros globales |

Esto reduce de ~1,460 a ~900 líneas de frontend y elimina 1 endpoint backend.

---

## 📈 AUDITORÍA KPIs — Métricas y Best Practices

### KPIs actuales del Dashboard Principal

| KPI | Tipo | Evaluación |
|-----|------|------------|
| Total Tickets | Vanity metric | 🟡 Poco accionable solo |
| Tickets Abiertos | Operacional | ✅ Bueno |
| Tickets Cerrados | Operacional | ✅ Bueno |
| Tickets Pendientes | Operacional | ✅ Bueno |
| Tickets Pendientes Acumulados | Tendencia | ✅ Muy útil |
| Distribución por Estado (donut) | Composición | ✅ Bueno |
| Tendencia Diaria | Tendencia | ✅ Bueno |
| Tickets por Agente | Comparación | ✅ Bueno |
| Tickets por Sector | Composición | ✅ Bueno |
| Comparación Mensual | Comparación | ✅ Bueno |

### KPIs SLA

| KPI | Tipo | Evaluación |
|-----|------|------------|
| % Cumplimiento SLA | Outcome | ✅ Core KPI |
| Tickets Vencidos/Críticos/En Riesgo | Alertas | ✅ Accionable |
| Tiempo Promedio Resolución | Eficiencia | ✅ Bueno |
| Tiempo Primera Respuesta | Eficiencia | ✅ Bueno |
| Top 5 Agentes | Ranking | 🟡 Puede desmotivar — cambiar a "Oportunidades de mejora" |
| Distribución de Agentes por Cumplimiento | Composición | ✅ Bueno |

### KPIs faltantes recomendados

| KPI Sugerido | Valor | Prioridad |
|-------------|-------|-----------|
| **Backlog Aging** (tickets abiertos > 7 días) | Identifica tickets olvidados | Alta |
| **Tasa de Reapertura** | Mide calidad de resolución | Media |
| **First Contact Resolution Rate** | % resueltos en primera respuesta | Alta |
| **Tickets por Hora del Día** (heatmap) | Identifica picos de demanda | Media |
| **Trend Arrow** en cada KPI card | Compara vs período anterior | Alta |

### Problemas de visualización

1. **Sin indicadores de tendencia:** Las tarjetas KPI muestran números estáticos sin comparación temporal (↑↓ vs mes anterior).
2. **Gráficos sin benchmark/meta:** Los gráficos SLA no muestran una línea de meta (ej: 90% target).
3. **Colores inconsistentes:** Los rangos de colores SLA difieren entre vistas:
   - Dashboard SLA: 90-100% verde, 70-89% amarillo, 0-69% rojo
   - Stats View: 90%+ verde, 80-89% amarillo, <80% rojo
   - Alert View: 100%+ rojo, 90-100% naranja, 70-90% amarillo

---

## 🛠️ PLAN DE ACCIÓN PRIORIZADO

### Fase 1: Seguridad (URGENTE — esta semana)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 1 | Eliminar `query-threads.js`, `debug-threads.js`, `investigate-db.js` | 3 archivos | 5 min |
| 2 | Eliminar o sanitizar `INSTRUCCIONES_DESPLIEGUE.md` | 1 archivo | 10 min |
| 3 | Rotar credenciales SSH y DB expuestas | Servidor | 30 min |
| 4 | Limpiar historial Git de credenciales (`git filter-branch` o BFG) | Repo | 1 hora |
| 5 | Agregar `config/.env` a `backend/.gitignore` | 1 línea | 2 min |

### Fase 2: Dead Code y Limpieza (1-2 días)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 6 | Eliminar `SLAAlertView_new.tsx` | 1 archivo | 2 min |
| 7 | Eliminar `.js` duplicados (`types/index.js`, `lib/utils.js`, `utils/formatters.js`) | 3 archivos | 5 min |
| 8 | Eliminar `getOrganizationsDebug` de api.ts | 1 función | 2 min |
| 9 | Eliminar `react.svg` asset no usado | 1 archivo | 1 min |
| 10 | Corregir doble `module.exports` en ticketRoutes.js | 1 línea | 2 min |
| 11 | Eliminar rutas rotas (`/export`, `/stats/by-transport`) o implementar modelos | 2 rutas | 30 min |
| 12 | Eliminar datos de ejemplo hardcodeados en `/stats/by-organization` | 5 líneas | 5 min |
| 13 | Eliminar `console.log [DEBUG]` y `[DEBUG TEMPORAL]` de ticketRoutes.js | ~30 líneas | 20 min |
| 14 | Unificar carpetas `context/` y `contexts/` | 5 archivos | 20 min |

### Fase 3: Consistencia SLA (3-5 días)

| # | Acción | Archivos | Esfuerzo |
|---|--------|----------|----------|
| 15 | Unificar `/sla/summary` para usar horas hábiles | slaRoutes.js | 2 horas |
| 16 | Unificar `/sla/tickets` para usar horas hábiles | slaRoutes.js | 2 horas |
| 17 | Extraer funciones de formateo a `utils/formatters.js` | Nuevo archivo + slaRoutes.js | 1 hora |
| 18 | Estandarizar rangos de colores SLA (frontend) | 3 componentes | 1 hora |
| 19 | Consolidar 3 vistas SLA en 2 | 3→2 archivos | 1 día |

### Fase 4: Mejoras de Calidad (1-2 semanas)

| # | Acción | Esfuerzo |
|---|--------|----------|
| 20 | Estandarizar error handling con middleware | 4 horas |
| 21 | Migrar logger a async (`pino` o `winston`) | 2 horas |
| 22 | Agregar rate limiting | 1 hora |
| 23 | Agregar validación de inputs (express-validator) | 4 horas |
| 24 | Migrar data fetching a React Query | 1 día |
| 25 | Agregar indicadores de tendencia a KPI cards | 4 horas |
| 26 | Agregar línea de meta en gráficos SLA | 2 horas |
| 27 | Implementar caching para `/sla/alerts` | 4 horas |
| 28 | Eliminar Chart.js, usar solo Recharts | 4 horas |

---

## 📁 INVENTARIO DE ARCHIVOS A ELIMINAR

```
ELIMINAR INMEDIATAMENTE (seguridad):
  backend/query-threads.js          ← Credenciales hardcodeadas
  backend/debug-threads.js          ← Servidor debug
  backend/investigate-db.js         ← Script investigación
  INSTRUCCIONES_DESPLIEGUE.md       ← Credenciales SSH

ELIMINAR (dead code):
  frontend/src/views/SLAAlertView_new.tsx    ← Vista no usada (464 líneas)
  frontend/src/types/index.js                ← Stub vacío
  frontend/src/lib/utils.js                  ← Duplicado de utils.ts
  frontend/src/utils/formatters.js           ← Duplicado de formatters.ts
  frontend/src/assets/react.svg              ← Asset template no usado

REVISAR USO:
  frontend/src/contexts/ConfigContext.tsx     ← Posiblemente no usado
  frontend/src/contexts/ThemeContext.tsx      ← Posiblemente no usado
```

---

## 📐 MÉTRICAS DEL CODEBASE

| Métrica | Valor |
|---------|-------|
| Archivos backend (sin node_modules) | 33 |
| Archivos frontend src | 55 |
| Archivos documentación | 10 |
| Líneas en ticketRoutes.js | 1,211 |
| Líneas en slaRoutes.js | 654 |
| Líneas en SLAAlertView.tsx | 623 |
| Líneas en SLAStatsView.tsx | 637 |
| Total dead code identificado | ~800 líneas |
| Funciones duplicadas | 6+ |
| console.log de debug | 30+ |

---

**Fin del reporte de auditoría.**  
Para proceder con la implementación de las correcciones, confirmar prioridades con el equipo.
