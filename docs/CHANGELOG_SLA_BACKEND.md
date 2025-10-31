# 🔨 CHANGELOG: Backend SLA Mejorado

## 📅 Fecha: 2025-10-29

---

## ✅ Cambios Implementados

### 1. **Endpoint `/api/sla/stats` - Actualizado**

#### Nuevos Campos en Respuesta:
- ✅ `nombre_sla`: Nombre del SLA asignado (ej: "48", "Semana", "Mes en curso")
- ✅ `diferencia_sla_promedio`: Margen/exceso promedio en formato legible
- ✅ `diferencia_sla_horas`: Valor numérico de la diferencia (para cálculos)

#### Ejemplo de Respuesta:
```json
{
  "departamento": "Soporte IT",
  "agente": "Juan Pérez",
  "staff_id": 5,
  "nombre_sla": "48",
  "anio": 2025,
  "mes": 10,
  "mes_nombre": "October",
  "total_tickets": 45,
  "tickets_sla_cumplido": 38,
  "tickets_sla_vencido": 7,
  "porcentaje_sla_cumplido": 84.44,
  "tiempo_promedio_primera_respuesta": "0d 02:15",
  "tiempo_promedio_resolucion": "1d 08:30",
  "diferencia_sla_promedio": "Cumplió 5.3h antes",
  "diferencia_sla_horas": 5.3
}
```

#### Lógica de Cálculo:
```sql
AVG(s_sla.grace_period - TIMESTAMPDIFF(HOUR, t.created, t.closed)) AS diferencia_sla_horas
```

#### Formato JavaScript:
```javascript
const formatDiferenciaSLA = (horas) => {
  if (horas === null || horas === undefined) return 'Sin datos';
  const horasAbs = Math.abs(horas);
  if (horas >= 0) {
    return `Cumplió ${horasAbs.toFixed(1)}h antes`;
  } else {
    return `Se pasó ${horasAbs.toFixed(1)}h`;
  }
};
```

---

### 2. **Endpoint `/api/sla/alerts` - Actualizado**

#### Nuevos Campos:
- ✅ `nombre_sla`: Nombre del SLA del ticket
- ✅ `diferencia_horas`: Margen restante (positivo) o exceso (negativo)

#### Campos Mantenidos:
- `ticket_id`
- `number`
- `agente_asignado`
- `fecha_creacion`
- `sla_horas`
- `horas_transcurridas`
- `horas_restantes`
- `porcentaje_transcurrido`

#### Campos Eliminados:
- ❌ `asunto` (no incluido en query original)
- ❌ `usuario` (no incluido en query original)

#### Ejemplo de Respuesta:
```json
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
      "nombre_sla": "48",
      "fecha_creacion": "2025-10-25T12:34:00.000Z",
      "sla_horas": 48,
      "horas_transcurridas": 44,
      "horas_restantes": 4,
      "diferencia_horas": 4,
      "porcentaje_transcurrido": 91.7
    }
  ],
  "agentes_bajo_rendimiento": [...]
}
```

---

### 3. **Endpoint `/api/sla/tickets` - NUEVO** ⭐

#### Descripción:
Endpoint completamente nuevo que devuelve lista detallada de tickets con información individual de cumplimiento SLA.

#### Query Parameters:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | Integer | No | Año a filtrar |
| `month` | Integer | No | Mes a filtrar (1-12) |
| `agent_id` | Integer | No | ID del agente |
| `status` | String | No | 'cumplido' o 'vencido' |
| `page` | Integer | No | Página (default: 1) |
| `limit` | Integer | No | Items por página (default: 50) |

#### Filtro por Defecto:
- Si no se especifica fecha, devuelve **últimos 3 meses** automáticamente
- Esto previene sobrecarga en queries de todo el histórico

#### Campos en Respuesta:
```json
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
      "diferencia_sla": "Se pasó 2.0h",
      "porcentaje_sla_utilizado": "104.17 %",
      "tiempo_primera_respuesta": "1h 45m"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "per_page": 50,
    "total_pages": 4
  }
}
```

#### Características Especiales:
- ✅ **Paginación**: Maneja grandes volúmenes de datos
- ✅ **Filtros múltiples**: Fecha + Agente + Estado SLA
- ✅ **Formatos legibles**: Tiempos en "Xd HH:MM" y diferencias descriptivas
- ✅ **Orden**: Por fecha de cierre descendente (más recientes primero)
- ✅ **Seguridad**: Solo tickets de "Soporte IT"

#### Ejemplos de Uso:

**Tickets vencidos del mes actual:**
```
GET /api/sla/tickets?year=2025&month=10&status=vencido
```

**Tickets de un agente específico:**
```
GET /api/sla/tickets?agent_id=5&page=1&limit=50
```

**Últimos 3 meses (default):**
```
GET /api/sla/tickets
```

---

## 📊 Comparativa Antes vs Ahora

### `/api/sla/stats`

#### Antes:
```json
{
  "agente": "Juan Pérez",
  "total_tickets": 45,
  "tickets_sla_cumplido": 38,
  "porcentaje_sla_cumplido": 84.44
}
```

#### Ahora:
```json
{
  "agente": "Juan Pérez",
  "nombre_sla": "48",                          // ← NUEVO
  "total_tickets": 45,
  "tickets_sla_cumplido": 38,
  "porcentaje_sla_cumplido": 84.44,
  "diferencia_sla_promedio": "Cumplió 5.3h antes",  // ← NUEVO
  "diferencia_sla_horas": 5.3                  // ← NUEVO
}
```

### `/api/sla/alerts`

#### Antes:
```json
{
  "ticket_id": 14321,
  "number": "013321",
  "agente_asignado": "María González",
  "horas_restantes": 4
}
```

#### Ahora:
```json
{
  "ticket_id": 14321,
  "number": "013321",
  "agente_asignado": "María González",
  "nombre_sla": "48",           // ← NUEVO
  "horas_restantes": 4,
  "diferencia_horas": 4         // ← NUEVO
}
```

---

## 🔧 Cambios Técnicos

### Queries SQL Modificadas:

#### 1. `/api/sla/stats` - Agregada columna:
```sql
s_sla.name AS nombre_sla,
AVG(s_sla.grace_period - TIMESTAMPDIFF(HOUR, t.created, t.closed)) AS diferencia_sla_horas
```

#### 2. `/api/sla/alerts` - Agregadas columnas:
```sql
IFNULL(s_sla.name, 'Sin SLA') AS nombre_sla,
COALESCE(NULLIF(s_sla.grace_period, 0), 24) - TIMESTAMPDIFF(HOUR, t.created, NOW()) AS diferencia_horas
```

#### 3. `/api/sla/tickets` - Query completa nueva:
- SELECT con 14 campos calculados
- JOIN con ost_ticket, ost_staff, ost_sla, ost_department
- Subquery para primera respuesta
- Filtros dinámicos (fecha, agente, estado)
- Paginación con LIMIT/OFFSET
- Query de conteo separada para total

---

## 📁 Archivo Modificado

**Ruta:** `backend/routes/slaRoutes.js`

**Líneas modificadas:**
- Líneas 36-84: Query `/stats` actualizada
- Líneas 116-147: Formateo de resultados `/stats`
- Líneas 167-193: Query `/alerts` actualizada
- Líneas 289-467: Nuevo endpoint `/tickets` completo

**Total de líneas agregadas:** ~180 líneas

---

## ✅ Testing Recomendado

### 1. Endpoint `/api/sla/stats`
```bash
# Verificar nuevos campos
curl -X GET "http://localhost:3001/api/sla/stats?year=2025&month=10"

# Validar formato de diferencia_sla_promedio
# Debe devolver: "Cumplió X.Xh antes" o "Se pasó X.Xh"
```

### 2. Endpoint `/api/sla/alerts`
```bash
# Verificar nombre_sla y diferencia_horas
curl -X GET "http://localhost:3001/api/sla/alerts"
```

### 3. Endpoint `/api/sla/tickets`
```bash
# Últimos 3 meses (default)
curl -X GET "http://localhost:3001/api/sla/tickets"

# Filtrado por estado
curl -X GET "http://localhost:3001/api/sla/tickets?status=vencido&page=1&limit=10"

# Filtrado por mes y agente
curl -X GET "http://localhost:3001/api/sla/tickets?year=2025&month=10&agent_id=5"
```

---

## 🚀 Próximos Pasos

### Backend ✅ COMPLETADO
- [x] Actualizar `/api/sla/stats`
- [x] Actualizar `/api/sla/alerts`
- [x] Crear `/api/sla/tickets`

### Frontend ⏳ PENDIENTE
- [ ] Actualizar `api.ts` con nuevas funciones
- [ ] Crear vista `SLAStatsView.tsx`
- [ ] Crear vista `SLATicketsView.tsx`
- [ ] Actualizar vista `SLAAlertView.tsx`
- [ ] Crear componentes `SLABadge`, `SLAProgressBar`

### Testing ⏳ PENDIENTE
- [ ] Probar endpoints en desarrollo
- [ ] Validar filtros y paginación
- [ ] Verificar formatos de respuesta

### Deploy ⏳ PENDIENTE
- [ ] Subir a producción
- [ ] Actualizar documentación API.md
- [ ] Verificar rendimiento en producción

---

## 📝 Notas Importantes

1. **Compatibilidad:** Los cambios son **backwards compatible**. Los endpoints existentes mantienen todos sus campos originales.

2. **Rendimiento:** El nuevo endpoint `/tickets` filtra por defecto los últimos 3 meses para evitar queries pesadas.

3. **Formato de Fechas:** Todas las fechas están en formato ISO 8601 (UTC).

4. **Zona Horaria:** Los cálculos de horas usan la zona horaria del servidor MySQL.

5. **Departamento:** Todos los endpoints filtran por `d.name = 'Soporte IT'`.

---

**Autor:** Dashboard OsTicket Team  
**Fecha:** 2025-10-29  
**Versión Backend:** 1.1.0
