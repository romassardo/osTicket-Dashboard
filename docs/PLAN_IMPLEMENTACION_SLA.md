# 📋 PLAN DE IMPLEMENTACIÓN: SISTEMA SLA MEJORADO

## 🎯 Objetivo
Integrar información detallada de SLA con diferencia promedio (margen/exceso) en el dashboard, incluyendo análisis agregado por agente/mes y detalles individuales por ticket.

---

## 📊 Nuevas Funcionalidades

### 1. **Vista Agregada SLA** (Ya implementada en query)
- Resumen por agente/mes con porcentaje de cumplimiento
- **NUEVO:** Diferencia promedio vs límite SLA
- **NUEVO:** Nombre del SLA asignado
- Tiempos promedio de primera respuesta y resolución

### 2. **Vista Detallada SLA** (Query creada: `query_sla_detallada_individual.txt`)
- Lista de tickets individuales con su estado SLA
- Diferencia exacta en horas (cumplió antes / se pasó)
- Porcentaje del SLA utilizado
- Filtrable por fecha, agente, estado SLA

---

## 🗂️ Estructura de Implementación

### **FASE 1: Backend - Nuevos Endpoints** ⏱️ 2-3 horas

#### 1.1 Crear `/api/sla/stats` (Estadísticas Agregadas)
**Archivo:** `backend/routes/slaRoutes.js` (NUEVO)

```javascript
// GET /api/sla/stats?year=2025&month=10&agent_id=5
// Retorna estadísticas agregadas por agente/mes
{
  "stats": [
    {
      "departamento": "Soporte IT",
      "agente": "Juan Pérez",
      "nombre_sla": "48",
      "anio": 2025,
      "mes": 10,
      "mes_nombre": "Octubre",
      "total_tickets": 45,
      "tickets_sla_cumplido": 38,
      "tickets_sla_vencido": 7,
      "porcentaje_sla_cumplido": "84.44 %",
      "tiempo_promedio_primera_respuesta": "0d 02:15",
      "tiempo_promedio_resolucion": "1d 08:30",
      "diferencia_sla_promedio": "Cumplió 5.3h antes"  // NUEVO
    }
  ]
}
```

**Query base:** `docs/query sla (2).txt`

#### 1.2 Crear `/api/sla/tickets` (Tickets Individuales)
**Archivo:** `backend/routes/slaRoutes.js`

```javascript
// GET /api/sla/tickets?year=2025&month=10&status=vencido&agent_id=5
// Retorna lista de tickets con detalle SLA individual
{
  "tickets": [
    {
      "numero_ticket": "013589",
      "departamento": "Soporte IT",
      "agente": "María González",
      "nombre_sla": "48",
      "limite_sla_horas": 48,
      "fecha_creacion": "2025-10-15T09:00:00.000Z",
      "fecha_cierre": "2025-10-17T11:30:00.000Z",
      "horas_resolucion_real": 50,
      "tiempo_resolucion_legible": "2d 02:30",
      "diferencia_horas": -2,
      "estado_sla": "Vencido",
      "diferencia_sla": "Se pasó 2.0h",  // NUEVO
      "porcentaje_sla_utilizado": "104.17 %",  // NUEVO
      "tiempo_primera_respuesta": "1h 45m"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "per_page": 50
  }
}
```

**Query base:** `docs/query_sla_detallada_individual.txt`

#### 1.3 Actualizar `/api/sla/alerts` (Simplificar)
**Archivo:** `backend/routes/slaRoutes.js` (si ya existe) o crear

**CAMBIOS:**
- ✅ Mantener: `ticket_id`, `number`, `agente_asignado`, métricas SLA
- ❌ **ELIMINAR:** `asunto` (subject), `usuario` (requester name)
- ✅ **AGREGAR:** `diferencia_horas`, `nombre_sla`

```javascript
// Respuesta simplificada
{
  "resumen": {
    "total_tickets_abiertos": 32,
    "tickets_en_riesgo": 26,
    "tickets_vencidos": 21
  },
  "tickets_en_riesgo": [
    {
      "ticket_id": 14321,
      "number": "013321",
      "agente_asignado": "María González",
      "nombre_sla": "48",  // NUEVO
      "fecha_creacion": "2025-10-25T12:34:00.000Z",
      "sla_horas": 48,
      "horas_transcurridas": 44,
      "horas_restantes": 4,
      "diferencia_horas": 4,  // NUEVO (positivo = margen)
      "porcentaje_transcurrido": 91.7
    }
  ],
  "agentes_bajo_rendimiento": [...]
}
```

---

### **FASE 2: Frontend - Nuevas Vistas** ⏱️ 4-5 horas

#### 2.1 Nueva Vista: `SLAStatsView.tsx` (Dashboard SLA Agregado)
**Ruta:** `/sla/stats`
**Archivo:** `frontend/src/views/SLAStatsView.tsx` (NUEVO)

**Componentes:**
- **Filtros:** Selector de año, mes, agente
- **Tarjetas de Resumen:**
  - Total de tickets cerrados
  - % Cumplimiento SLA promedio
  - Diferencia promedio general
- **Tabla Detallada:**
  - Columnas: Agente, Tickets, Cumplidos, Vencidos, %, Diferencia SLA
  - Ordenable por columna
  - Exportable a Excel
- **Gráficos:**
  - Línea temporal: % cumplimiento por mes
  - Barra: Comparativa por agente

#### 2.2 Nueva Vista: `SLATicketsView.tsx` (Tickets Individuales)
**Ruta:** `/sla/tickets`
**Archivo:** `frontend/src/views/SLATicketsView.tsx` (NUEVO)

**Componentes:**
- **Filtros:**
  - Fecha (mes/año)
  - Agente
  - Estado SLA: Todos / Cumplido / Vencido
  - Búsqueda por número de ticket
- **Tabla de Tickets:**
  - Columnas: Número, Agente, SLA, Estado, Tiempo Real, Diferencia
  - Color coding: Verde (cumplido), Rojo (vencido)
  - Click → Modal con detalles completos
- **Paginación:** 50 tickets por página

#### 2.3 Actualizar: `SLAAlertView.tsx` (Simplificar)
**Archivo:** `frontend/src/views/SLAAlertView.tsx` (MODIFICAR)

**CAMBIOS:**
- ❌ **Eliminar columnas:** Asunto, Usuario
- ✅ **Agregar columnas:** Nombre SLA, Diferencia (margen)
- ✅ **Mejorar visualización:** Badges de estado, colores de alerta

```tsx
// Ejemplo de tabla simplificada
<Table>
  <TableHead>
    <TableRow>
      <TableCell>Número</TableCell>
      <TableCell>Agente</TableCell>
      <TableCell>SLA</TableCell>
      <TableCell>Horas Restantes</TableCell>
      <TableCell>Margen</TableCell>  {/* NUEVO */}
      <TableCell>% Transcurrido</TableCell>
      <TableCell>Estado</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {tickets.map(ticket => (
      <TableRow key={ticket.ticket_id}>
        <TableCell>{ticket.number}</TableCell>
        <TableCell>{ticket.agente_asignado}</TableCell>
        <TableCell><Badge>{ticket.nombre_sla}</Badge></TableCell>
        <TableCell>{ticket.horas_restantes}h</TableCell>
        <TableCell>
          <span className={ticket.diferencia_horas < 5 ? 'text-red-500' : 'text-green-500'}>
            {ticket.diferencia_horas > 0 ? `+${ticket.diferencia_horas}h` : `${ticket.diferencia_horas}h`}
          </span>
        </TableCell>
        <TableCell>
          <ProgressBar value={ticket.porcentaje_transcurrido} />
        </TableCell>
        <TableCell>
          <StatusBadge status={ticket.porcentaje_transcurrido > 90 ? 'Crítico' : 'Normal'} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### **FASE 3: API Service Layer** ⏱️ 1 hora

#### 3.1 Agregar funciones en `api.ts`
**Archivo:** `frontend/src/services/api.ts`

```typescript
// Nuevas funciones
export const getSLAStats = async (filters: {
  year?: number;
  month?: number;
  agent_id?: number;
}) => {
  const params = new URLSearchParams();
  if (filters.year) params.append('year', filters.year.toString());
  if (filters.month) params.append('month', filters.month.toString());
  if (filters.agent_id) params.append('agent_id', filters.agent_id.toString());
  
  const response = await api.get(`/api/sla/stats?${params.toString()}`);
  return response.data;
};

export const getSLATickets = async (filters: {
  year?: number;
  month?: number;
  agent_id?: number;
  status?: 'cumplido' | 'vencido';
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });
  
  const response = await api.get(`/api/sla/tickets?${params.toString()}`);
  return response.data;
};

export const getSLAAlerts = async () => {
  const response = await api.get('/api/sla/alerts');
  return response.data;
};
```

---

### **FASE 4: Routing y Navegación** ⏱️ 30 min

#### 4.1 Actualizar `App.tsx`
**Archivo:** `frontend/src/App.tsx`

```tsx
import SLAStatsView from './views/SLAStatsView';
import SLATicketsView from './views/SLATicketsView';

// Agregar rutas
<Route path="/sla/stats" element={<SLAStatsView />} />
<Route path="/sla/tickets" element={<SLATicketsView />} />
<Route path="/sla/alerts" element={<SLAAlertView />} />
```

#### 4.2 Actualizar `Sidebar.tsx`
**Archivo:** `frontend/src/components/layout/Sidebar.tsx`

```tsx
// Agregar sección SLA en el menú
<NavSection title="SLA">
  <NavItem icon={<AlertCircle />} label="Alertas" path="/sla/alerts" />
  <NavItem icon={<BarChart3 />} label="Estadísticas" path="/sla/stats" />
  <NavItem icon={<FileText />} label="Detalle Tickets" path="/sla/tickets" />
</NavSection>
```

---

### **FASE 5: Componentes Reutilizables** ⏱️ 2 horas

#### 5.1 Crear `SLABadge.tsx` (Indicador visual de SLA)
**Archivo:** `frontend/src/components/sla/SLABadge.tsx`

```tsx
interface SLABadgeProps {
  status: 'cumplido' | 'vencido' | 'en_riesgo';
  diferencia?: number;
}

export const SLABadge = ({ status, diferencia }: SLABadgeProps) => {
  const colors = {
    cumplido: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
    en_riesgo: 'bg-yellow-100 text-yellow-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status === 'cumplido' && diferencia && `✓ +${diferencia}h`}
      {status === 'vencido' && diferencia && `✗ ${Math.abs(diferencia)}h`}
      {status === 'en_riesgo' && '⚠️'}
    </span>
  );
};
```

#### 5.2 Crear `SLAProgressBar.tsx` (Barra de progreso SLA)
**Archivo:** `frontend/src/components/sla/SLAProgressBar.tsx`

```tsx
interface SLAProgressBarProps {
  percentage: number;
  showLabel?: boolean;
}

export const SLAProgressBar = ({ percentage, showLabel = true }: SLAProgressBarProps) => {
  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${getColor()} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 mt-1">{percentage.toFixed(1)}%</span>
      )}
    </div>
  );
};
```

---

### **FASE 6: Exportación y Reportes** ⏱️ 1 hora

#### 6.1 Agregar exportación Excel en vistas SLA
**Función reutilizable:**

```typescript
import * as XLSX from 'xlsx';

export const exportSLAToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SLA Report');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
```

---

## 📂 Estructura de Archivos

```
dashboard-osticket/
├── backend/
│   ├── routes/
│   │   ├── slaRoutes.js (NUEVO - endpoints SLA)
│   │   └── ticketRoutes.js
│   └── server.js (registrar slaRoutes)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── sla/
│   │   │       ├── SLABadge.tsx (NUEVO)
│   │   │       ├── SLAProgressBar.tsx (NUEVO)
│   │   │       └── SLAFilters.tsx (NUEVO)
│   │   ├── views/
│   │   │   ├── SLAStatsView.tsx (NUEVO)
│   │   │   ├── SLATicketsView.tsx (NUEVO)
│   │   │   └── SLAAlertView.tsx (MODIFICAR)
│   │   ├── services/
│   │   │   └── api.ts (AGREGAR funciones SLA)
│   │   └── App.tsx (AGREGAR rutas)
│   │
├── docs/
│   ├── query sla (2).txt (✅ Actualizada)
│   ├── query_sla_detallada_individual.txt (✅ Nueva)
│   ├── PLAN_IMPLEMENTACION_SLA.md (✅ Este archivo)
│   └── API.md (ACTUALIZAR documentación endpoints)

```

---

## 🔄 Orden de Implementación Recomendado

1. ✅ **Queries SQL** (COMPLETADO)
   - query sla (2).txt con diferencia_sla_promedio
   - query_sla_detallada_individual.txt

2. 🔨 **Backend - Endpoints**
   - Crear `slaRoutes.js`
   - Implementar `/api/sla/stats`
   - Implementar `/api/sla/tickets`
   - Actualizar `/api/sla/alerts`

3. 🎨 **Frontend - Componentes Base**
   - `SLABadge.tsx`
   - `SLAProgressBar.tsx`
   - `SLAFilters.tsx`

4. 📱 **Frontend - Vistas**
   - Actualizar `SLAAlertView.tsx` (simplificar)
   - Crear `SLAStatsView.tsx`
   - Crear `SLATicketsView.tsx`

5. 🔗 **Integración**
   - Actualizar `api.ts`
   - Actualizar `App.tsx` (routing)
   - Actualizar `Sidebar.tsx` (navegación)

6. 📊 **Testing y Ajustes**
   - Probar filtros
   - Validar cálculos SLA
   - Ajustar responsive design

7. 📝 **Documentación**
   - Actualizar `API.md`
   - Screenshots de nuevas vistas
   - Guía de uso

---

## ⏱️ Estimación de Tiempos

| Fase | Tiempo Estimado |
|------|----------------|
| Backend | 2-3 horas |
| Frontend Componentes | 2 horas |
| Frontend Vistas | 4-5 horas |
| API Service | 1 hora |
| Routing | 30 min |
| Testing | 2 horas |
| Documentación | 1 hora |
| **TOTAL** | **12-14 horas** |

---

## 🎯 Prioridades

### Alta Prioridad (MVP)
1. Endpoint `/api/sla/stats` con diferencia promedio
2. Vista `SLAStatsView.tsx` con tabla básica
3. Actualizar `SLAAlertView.tsx` (eliminar asunto/usuario)

### Media Prioridad
4. Endpoint `/api/sla/tickets` detallado
5. Vista `SLATicketsView.tsx` con filtros
6. Componentes `SLABadge` y `SLAProgressBar`

### Baja Prioridad (Mejoras)
7. Gráficos avanzados
8. Exportación Excel
9. Notificaciones de SLA en riesgo

---

## 📌 Notas Importantes

- **Rendimiento:** La query individual puede ser pesada. Siempre filtrar por fecha (últimos 3-6 meses).
- **Cache:** Considerar cachear estadísticas agregadas (Redis/memoria).
- **Permisos:** Verificar que solo usuarios autorizados accedan a datos SLA.
- **Zona horaria:** Todas las fechas en GMT-3 (Argentina).
- **Testing:** Validar cálculos con datos reales de osTicket.

---

## 🚀 Próximos Pasos Inmediatos

1. Revisar y aprobar este plan
2. Comenzar con Fase 2: Backend - Endpoints
3. Crear rama Git: `feature/sla-improvements`
4. Implementar MVP (Alta Prioridad)
5. Testing con datos reales
6. Deploy a producción

---

**Última actualización:** 2025-10-29
**Autor:** Dashboard OsTicket Team
