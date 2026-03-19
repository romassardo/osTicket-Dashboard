# Performance Audit — osTicket Dashboard
**Fecha:** 2026-03-19  
**Auditor:** Cascade AI  
**Skill:** web-performance-audit (secondsky/claude-skills)

---

## Resumen Ejecutivo

Se identificaron **14 problemas de performance** clasificados en 3 niveles de impacto.
El cuello de botella principal es el endpoint `/api/sla/stats` que ejecuta ~548 operaciones
de cálculo de horas hábiles por request, iterando día por día para cada ticket.

| Severidad | Cantidad | Tiempo estimado de fix |
|-----------|----------|------------------------|
| 🔴 Crítico | 3 | 1-2 días |
| 🟡 Medio | 6 | 2-3 días |
| 🟢 Bajo | 5 | 1 día |

---

## 🔴 CRÍTICO — Impacto inmediato en tiempos de carga

### 1. SLA /stats: Cálculo de horas hábiles O(N×D) por request

**Archivo:** `backend/routes/slaRoutes.js` (líneas 89-110)  
**Archivo:** `backend/utils/businessHours.js` (líneas 205-266)

**Problema:** Para cada ticket, `calcularHorasHabiles()` itera día por día desde `created`
hasta `closed`. Con 274 tickets de ~20 días promedio cada uno:
- 274 tickets × 2 llamadas (resolución + primera respuesta) = **548 llamadas**
- Cada llamada itera ~20-40 días = **~15,000 operaciones de Date**
- Todo esto ocurre en cada request (no hay cache en `/stats`)

**Solución propuesta:** Algoritmo O(1) por ticket — calcular semanas completas + días restantes:
```javascript
// En vez de iterar día por día:
function calcularHorasHabilesOptimizado(inicio, fin, feriados) {
  const diasTotales = Math.ceil((fin - inicio) / (1000*60*60*24));
  const semanasCompletas = Math.floor(diasTotales / 7);
  const horasSemanales = semanasCompletas * 5 * HOURS_PER_DAY;
  // Solo iterar los días restantes (max 6) + ajustar feriados
  // ...
}
```

**Impacto estimado:** Reducción de ~15,000 iteraciones a ~1,500 (10x más rápido)

---

### 2. SLA /stats y /summary: Sin cache

**Archivo:** `backend/routes/slaRoutes.js`

**Problema:** El endpoint `/alerts` tiene cache de 2 minutos, pero `/stats` y `/summary`
(los más costosos) no tienen ningún cache. Cada navegación a la página SLA recalcula todo.

**Solución propuesta:**
```javascript
// Agregar cache con key basada en los parámetros
const cacheKey = `sla:stats:${year}:${month}:${agent}`;
const cached = cache.get(cacheKey);
if (cached) return res.json(cached);
// ... calcular ...
cache.set(cacheKey, formattedResults, 300); // 5 minutos
```

**Impacto estimado:** Requests subsiguientes de ~3s a <5ms

---

### 3. Sin compresión HTTP (gzip/brotli)

**Archivo:** `backend/server.js`

**Problema:** El servidor Express no tiene middleware de compresión. Las respuestas JSON
de SLA pueden tener 50-200KB sin comprimir. Sin gzip, se transmite todo el payload crudo.

**Solución propuesta:**
```bash
npm install compression
```
```javascript
const compression = require('compression');
app.use(compression()); // Antes de las rutas
```

**Impacto estimado:** Reducción de 60-80% en tamaño de transferencia de red

---

## 🟡 MEDIO — Mejoras significativas

### 4. /tickets/count: 3 queries separadas que podrían ser 1

**Archivo:** `backend/routes/ticketRoutes.js` (líneas 377-441)

**Problema:** El endpoint hace 3 queries secuenciales:
1. `Ticket.count()` — total
2. `Ticket.findAll()` con GROUP BY — por estado
3. `Ticket.count()` — pendientes acumulados

**Solución:** Combinar en 1-2 queries con subqueries o UNION.

---

### 5. /monthly-comparison: 7 queries secuenciales

**Archivo:** `backend/routes/statsRoutes.js` (líneas 533-677)

**Problema:** `getMonthFlowData()` hace 3 queries por mes (creados, cerrados, pendientes)
+ 1 query de flujo = 7 queries totales. Son secuenciales (await uno tras otro).

**Solución:** Ejecutar las 2 llamadas a `getMonthFlowData` en paralelo con `Promise.all`,
o combinar las 3 queries internas en una sola con CASE WHEN.

---

### 6. Dashboard: 7 API calls simultáneos al cargar

**Archivos:** `frontend/src/views/DashboardView.tsx` + 6 chart components

**Problema:** Al abrir el Dashboard se disparan 7 requests en paralelo:
1. `/tickets/count`
2. `/tickets/stats/tendencies`
3. `/stats/tickets-by-transport`
4. `/tickets/stats/by-agent`
5. `/stats/tickets-by-sector`
6. `/stats/tickets-by-request-type`
7. `/stats/monthly-comparison`

Cada uno genera 1-7 queries en el backend = **~20 queries** por page load.

**Solución:** Crear endpoint unificado `/api/dashboard/summary` que devuelva todos los
datos en un solo request, o al menos agrupar los más livianos.

---

### 7. Librería `xlsx` importada estáticamente (~500KB)

**Archivo:** `frontend/package.json`

**Problema:** `xlsx` es una librería pesada que solo se usa al exportar datos (acción
poco frecuente), pero se incluye en el bundle principal.

**Solución:** Dynamic import:
```typescript
const exportToExcel = async () => {
  const XLSX = await import('xlsx');
  // usar XLSX...
};
```

---

### 8. `howler` importado globalmente para sonidos

**Archivo:** `frontend/package.json`, `context/SoundContext.tsx`

**Problema:** La librería de audio se carga para todos los usuarios aunque muchos
no necesitan sonidos de notificación.

**Solución:** Lazy load con dynamic import cuando el usuario activa sonidos.

---

### 9. Debug endpoints expuestos en producción

**Archivo:** `backend/routes/statsRoutes.js` (líneas 379-526)

**Problema:** `/api/stats/debug-organizations` y `/api/stats/debug-fields` ejecutan
queries costosas y exponen estructura interna de la BD.

**Solución:** Deshabilitar en producción:
```javascript
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug-organizations', ...);
  router.get('/debug-fields', ...);
}
```

---

## 🟢 BAJO — Optimizaciones incrementales

### 10. Sequelize `sync()` en cada inicio de servidor

**Archivo:** `backend/server.js` (línea 135)

**Problema:** `db.sequelize.sync()` verifica/crea tablas en cada reinicio.
En producción con BD estable esto es innecesario.

**Solución:** Usar `sync()` solo en desarrollo, o remover completamente si las
migraciones se manejan por separado.

---

### 11. React Query: refetchInterval de 5 minutos en todas las queries

**Archivo:** `frontend/src/main.tsx` (línea 25)

**Problema:** `refetchInterval: 5 * 60 * 1000` está configurado globalmente.
Esto significa que TODAS las queries se re-ejecutan cada 5 minutos, incluyendo
datos estáticos como staff, departments, etc.

**Solución:** Remover el refetchInterval global y aplicarlo solo donde sea necesario
(ej: Dashboard, SLA Alerts).

---

### 12. @heroicons/react: importación completa del paquete

**Archivo:** Múltiples componentes

**Problema:** Se importa `@heroicons/react/24/outline` que puede incluir todos los
iconos en el bundle si tree-shaking no es perfecto.

**Nota:** Con Vite + ESM esto generalmente se resuelve con tree-shaking, pero vale
verificar con el bundle analyzer.

---

### 13. Sin índices de BD verificados para filtros de fecha

**Problema:** Las queries filtran frecuentemente por `t.created`, `t.closed`, `d.name`,
`t.dept_id`, `t.staff_id`. Sin índices apropiados, MySQL hace full table scans.

**Solución:** Verificar y crear índices:
```sql
-- Verificar índices existentes
SHOW INDEX FROM ost_ticket;
-- Crear si faltan
CREATE INDEX idx_ticket_created ON ost_ticket(created);
CREATE INDEX idx_ticket_closed ON ost_ticket(closed);
CREATE INDEX idx_ticket_dept_created ON ost_ticket(dept_id, created);
CREATE INDEX idx_ticket_staff_closed ON ost_ticket(staff_id, closed);
```

---

### 14. Sin ETags ni cache headers en respuestas API

**Problema:** Las respuestas API no incluyen headers de cache (`Cache-Control`, `ETag`).
El navegador no puede cachear respuestas ni hacer conditional requests.

**Solución:** Agregar headers para endpoints estáticos o semi-estáticos:
```javascript
res.set('Cache-Control', 'public, max-age=120'); // 2 minutos
```

---

## Resumen de Acciones — Orden de Prioridad

| # | Acción | Impacto | Esfuerzo | Archivos |
|---|--------|---------|----------|----------|
| 1 | Cache en /stats y /summary | ⬆⬆⬆ | Bajo | slaRoutes.js |
| 2 | Compresión HTTP | ⬆⬆⬆ | Bajo | server.js |
| 3 | Fix feriados race condition | ⬆⬆⬆ | ✅ HECHO | businessHours.js |
| 4 | Desactivar SQL logging | ⬆⬆ | ✅ HECHO | db.js |
| 5 | Optimizar calcularHorasHabiles | ⬆⬆⬆ | Medio | businessHours.js |
| 6 | Combinar queries /count | ⬆⬆ | Medio | ticketRoutes.js |
| 7 | Parallelizar monthly-comparison | ⬆⬆ | Bajo | statsRoutes.js |
| 8 | Lazy import xlsx | ⬆ | Bajo | componentes export |
| 9 | Ocultar debug endpoints | ⬆ | Bajo | statsRoutes.js |
| 10 | Remover refetchInterval global | ⬆ | Bajo | main.tsx |

---

## Ya Implementado en Esta Sesión

- ✅ `backend/config/db.js` — SQL logging desactivado por defecto (`LOG_SQL=true` para debug)
- ✅ `backend/utils/businessHours.js` — Race condition en cache de feriados corregida
- ✅ `frontend/src/context/FilterContext.tsx` — Filtro mes/año compartido entre pestañas
