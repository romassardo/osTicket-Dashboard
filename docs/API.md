# 🔌 Documentación API - Dashboard OsTicket v1.2

## Base URL

- **Desarrollo:** `http://localhost:3001/api`
- **Producción:** `https://***REDACTED_DOMAIN***/api`

## Formato de Respuestas

Todas las respuestas son JSON con estructura consistente:

### Respuesta Exitosa
```json
{
  "tickets": [...],
  "pagination": {
    "total_items": 11602,
    "total_pages": 233,
    "current_page": 1,
    "per_page": 50
  }
}
```

### Respuesta de Error
```json
{
  "error": "Mensaje de error descriptivo",
  "statusCode": 400
}
```

## Endpoints

### 1. Lista de Tickets

**GET** `/api/tickets`

Obtiene lista paginada de tickets con filtros opcionales.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | number | No | Número de página (default: 1) |
| `limit` | number | No | Tickets por página (default: 50, max: 100) |
| `search` | string | No | Búsqueda en número, asunto, usuario |
| `status` | string | No | ID de estado único |
| `statuses` | string | No | IDs de estados separados por coma (ej: "1,2,3") |
| `staff` | string | No | ID de agente asignado |
| `sector` | string | No | ID de sector |
| `startDate` | string | No | Fecha inicio (YYYY-MM-DD) |
| `endDate` | string | No | Fecha fin (YYYY-MM-DD) |

#### Ejemplo de Request

```bash
GET /api/tickets?page=1&limit=50&statuses=1,2&startDate=2025-01-01&endDate=2025-12-31
```

#### Ejemplo de Response

```json
{
  "tickets": [
    {
      "ticket_id": 13589,
      "number": "013589",
      "created": "2025-10-10T14:30:00.000Z",
      "closed": null,
      "TicketStatus": {
        "id": 1,
        "name": "Abierto"
      },
      "HelpTopic": {
        "topic_id": 15,
        "topic": "Soporte Técnico"
      },
      "User": {
        "name": "Juan Pérez"
      },
      "Staff": {
        "firstname": "María",
        "lastname": "González"
      },
      "Department": {
        "name": "IT Support"
      },
      "sector": "Administración",
      "transporte": "Remoto"
    }
  ],
  "pagination": {
    "total_items": 11602,
    "total_pages": 233,
    "current_page": 1,
    "per_page": 50
  }
}
```

### 2. Estadísticas Generales

**GET** `/api/tickets/stats`

Obtiene métricas agregadas de tickets.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | number | No | Año para filtrar (ej: 2025) |
| `month` | number | No | Mes para filtrar (1-12) |

#### Ejemplo de Request

```bash
GET /api/tickets/stats?year=2025&month=10
```

#### Ejemplo de Response

```json
{
  "total": 106,
  "open": 18,
  "closed": 45,
  "resolved": 43,
  "pending": 37,
  "percentageChange": 5.2
}
```

### 3. Distribución por Estado

**GET** `/api/tickets/stats/by-status`

Agrupa tickets por estado actual.

#### Query Parameters

Mismo que `/stats` (year, month)

#### Ejemplo de Response

```json
{
  "byStatus": [
    {
      "status_id": 1,
      "status_name": "Abierto",
      "count": 18
    },
    {
      "status_id": 2,
      "status_name": "Resuelto",
      "count": 43
    },
    {
      "status_id": 3,
      "status_name": "Cerrado",
      "count": 45
    }
  ]
}
```

### 4. Distribución por Transporte

**GET** `/api/tickets/stats/by-transport`

Agrupa tickets por medio de transporte.

#### Query Parameters

Mismo que `/stats` (year, month)

#### Ejemplo de Response

```json
{
  "byTransport": [
    {
      "transport_id": 105,
      "transport_name": "Remoto",
      "count": 45
    },
    {
      "transport_id": 111,
      "transport_name": "A pie",
      "count": 32
    },
    {
      "transport_id": 107,
      "transport_name": "SUBE",
      "count": 15
    },
    {
      "transport_id": 109,
      "transport_name": "AE677SO",
      "count": 8
    }
  ]
}
```

### 5. Exportar Tickets

**GET** `/api/tickets/export`

Obtiene TODOS los tickets que coinciden con los filtros (sin paginación). Usar para exportación a Excel.

#### Query Parameters

Mismos que `/api/tickets` excepto `page` y `limit`

#### Ejemplo de Request

```bash
GET /api/tickets/export?statuses=2&startDate=2025-10-01&endDate=2025-10-31
```

#### Ejemplo de Response

```json
{
  "tickets": [
    // Array con todos los tickets (puede ser muy grande)
  ],
  "count": 145
}
```

⚠️ **Advertencia:** Este endpoint puede devolver miles de tickets. Usar con precaución.

### 6. Alertas SLA

**GET** `/api/sla/alerts`

Retorna métricas de SLA para el departamento "Soporte IT": tickets abiertos en riesgo, agentes con bajo rendimiento y resumen general.

> **Nota:** El backend calcula los porcentajes con SQL y el frontend convierte los valores a `Number` antes de renderizarlos para evitar errores al usar `.toFixed()`.

#### Campos Incluidos

**Tickets en Riesgo:**
- `ticket_id`: ID del ticket
- `number`: Número de ticket (formato 013321)
- `agente_asignado`: Nombre completo del agente
- `nombre_sla`: Nombre del SLA asignado (ej: "48", "Semana", "Mes en curso")
- `fecha_creacion`: Timestamp de creación
- `sla_horas`: Límite del SLA en horas
- `horas_transcurridas`: Horas desde la creación
- `horas_restantes`: Horas restantes hasta vencimiento
- `diferencia_horas`: Margen disponible (positivo = horas de margen, negativo = horas excedidas)
- `porcentaje_transcurrido`: Porcentaje del SLA utilizado

**Campos eliminados:** `asunto` y `usuario` no se incluyen para simplificar la respuesta y mejorar el rendimiento.

#### Normalización Frontend

Al consumir este endpoint desde `SLAAlertView`, los campos numéricos (`total_tickets_abiertos`, `tickets_en_riesgo`, `tickets_vencidos`, `sla_horas`, `horas_transcurridas`, `horas_restantes`, `diferencia_horas`, `porcentaje_transcurrido`, `porcentaje_cumplimiento`) se transforman a `Number`. Esto garantiza que cualquier string retornado por MySQL (p. ej. `"26"`) sea seguro para operaciones como `.toFixed()` o cálculos de porcentajes.

#### Query Parameters

No requiere parámetros.

#### Ejemplo de Response

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
  "agentes_bajo_rendimiento": [
    {
      "agente": "Juan Pérez",
      "total_tickets": 12,
      "tickets_cumplidos": 8,
      "tickets_vencidos": 4,
      "porcentaje_cumplimiento": 66.7
    }
  ],
  "tendencias_negativas": []
}
```

### 7. Estadísticas SLA Agregadas

**GET** `/api/sla/stats`

Retorna estadísticas de cumplimiento de SLA agregadas por agente y mes, incluyendo la **diferencia promedio** entre el tiempo real de resolución y el límite del SLA.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | Integer | No | Año a filtrar (ej: 2025) |
| `month` | Integer | No | Mes a filtrar (1-12) |
| `agent_id` | Integer | No | ID del agente a filtrar |

#### Ejemplo de Response

```json
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
      "diferencia_sla_promedio": "Cumplió 5.3h antes"
    }
  ]
}
```

**Campos destacados:**
- `diferencia_sla_promedio`: Texto descriptivo del margen/exceso promedio (ej: "Cumplió 5.3h antes" o "Se pasó 3.2h")
- `nombre_sla`: Nombre del SLA asignado a los tickets del grupo

### 8. Detalle de Tickets con SLA Individual

**GET** `/api/sla/tickets`

Retorna lista detallada de tickets cerrados con información individual de cumplimiento SLA, incluyendo la **diferencia exacta** en horas y el **porcentaje de SLA utilizado**.

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `year` | Integer | No | Año a filtrar |
| `month` | Integer | No | Mes a filtrar (1-12) |
| `agent_id` | Integer | No | ID del agente |
| `status` | String | No | Estado SLA: 'cumplido' o 'vencido' |
| `page` | Integer | No | Página (default: 1) |
| `limit` | Integer | No | Items por página (default: 50) |

#### Ejemplo de Response

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

**Campos destacados:**
- `diferencia_horas`: Diferencia numérica (positivo = cumplió antes, negativo = se pasó)
- `diferencia_sla`: Texto descriptivo de la diferencia
- `porcentaje_sla_utilizado`: Porcentaje del tiempo SLA consumido
- `estado_sla`: "Cumplido" o "Vencido"

**Uso recomendado:** Filtrar por los últimos 3-6 meses para optimizar el rendimiento de la query.

## Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Request exitoso |
| 400 | Bad Request | Parámetros inválidos |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

## Esquema de Datos

### Ticket

```typescript
interface Ticket {
  ticket_id: number;           // ID único del ticket
  number: string;              // Número visible (ej: "013589")
  created: string;             // ISO 8601 timestamp
  closed: string | null;       // ISO 8601 timestamp o null
  updated: string;             // ISO 8601 timestamp
  duedate: string | null;      // ISO 8601 timestamp o null
  isanswered: number;          // 0 o 1
  isoverdue: number;           // 0 o 1
  status_id: number;           // FK a TicketStatus
  dept_id: number;             // FK a Department
  staff_id: number | null;     // FK a Staff
  user_id: number;             // FK a User
  topic_id: number;            // FK a HelpTopic
  
  // Relaciones
  TicketStatus: {
    id: number;
    name: string;
  };
  HelpTopic: {
    topic_id: number;
    topic: string;
  };
  User: {
    name: string;
  };
  Staff: {
    firstname: string;
    lastname: string;
  } | null;
  Department: {
    name: string;
  };
  
  // Custom fields
  sector: string;              // Nombre del sector
  transporte: string;          // Nombre del transporte
}
```

### Pagination

```typescript
interface Pagination {
  total_items: number;    // Total de tickets en DB
  total_pages: number;    // Total de páginas
  current_page: number;   // Página actual (1-indexed)
  per_page: number;       // Items por página (50)
}
```

## Ejemplos de Uso

### JavaScript/TypeScript (Fetch)

```typescript
// Obtener tickets de la primera página
async function getTickets() {
  const response = await fetch('/api/tickets?page=1&limit=50');
  const data = await response.json();
  console.log(data.tickets);
}

// Buscar tickets por texto
async function searchTickets(query: string) {
  const response = await fetch(`/api/tickets?search=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.tickets;
}

// Obtener estadísticas del mes actual
async function getCurrentMonthStats() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const response = await fetch(`/api/tickets/stats?year=${year}&month=${month}`);
  return await response.json();
}
```

### cURL

```bash
# Lista de tickets
curl "http://localhost:3001/api/tickets?page=1&limit=10"

# Filtrar por estado
curl "http://localhost:3001/api/tickets?statuses=1,2"

# Filtrar por rango de fechas
curl "http://localhost:3001/api/tickets?startDate=2025-01-01&endDate=2025-12-31"

# Obtener estadísticas
curl "http://localhost:3001/api/tickets/stats"

# Exportar tickets
curl "http://localhost:3001/api/tickets/export" > tickets.json
```

## Rate Limiting

- **Desarrollo:** Sin límite
- **Producción:** 100 requests por minuto por IP (configurado en Apache)

## CORS

- **Desarrollo:** Permite `http://localhost:5173`
- **Producción:** Permite `https://***REDACTED_DOMAIN***`

## Notas Importantes

1. **Solo Lectura:** Todos los endpoints son GET, no se permiten POST/PUT/DELETE
2. **Paginación Obligatoria:** `/api/tickets` siempre usa paginación (max 100 por página)
3. **Fechas en GMT-3:** Todas las fechas se manejan en zona horaria Argentina
4. **Caché:** No hay caché implementado, todos los requests son en tiempo real
5. **Performance:** Queries optimizadas con eager loading de Sequelize

## Troubleshooting

### Error: "Cannot read property 'name' of null"

**Causa:** Ticket sin relación (Staff, Department, etc.)

**Solución:** Backend maneja nulls correctamente desde v1.2

### Error: "Request timeout"

**Causa:** Query muy grande (ej: exportar 50,000 tickets)

**Solución:** Usar filtros para reducir dataset

### Error: "CORS policy blocked"

**Causa:** Request desde origen no permitido

**Solución:** Verificar configuración CORS en backend

---

**Versión API:** v1.2  
**Última actualización:** Octubre 2025
