# Recomendaciones de Índices para la Base de Datos OsTicket (Dashboard IT)

Este archivo resume las columnas de la base de datos de OsTicket que se beneficiarían de la creación de índices para mejorar el rendimiento de las consultas del Dashboard de Soporte IT. Estas recomendaciones deben ser revisadas y aplicadas por un administrador de la base de datos (DBA) directamente en el servidor MySQL.

**Leyenda:**
- **PK:** Clave Primaria (generalmente indexada por defecto)
- **FK:** Clave Foránea (candidata fuerte para índice)
- **Filtro:** Columna usada en cláusulas `WHERE`.
- **Join:** Columna usada en operaciones `JOIN`.
- **Búsqueda:** Columna usada para búsquedas de texto (ej. `LIKE`).
- **Orden:** Columna usada en cláusulas `ORDER BY`.

## Tabla `ost_ticket` (Modelo: `Ticket`)

- `status_id` (FK, Filtro, Join)
- `priority_id` (FK, Filtro, Join) - *Nota: Confirmar si la prioridad del ticket se gestiona directamente aquí o a través de `ost_help_topic.priority_id`.*
- `created` (Filtro por fecha, Orden)
- `number` (Búsqueda)
- `dept_id` (FK, Filtro, Join) - **CRÍTICO** para el filtro por departamento.
- `staff_id` (FK, Filtro, Join)
- `user_id` (FK, Filtro, Join)
- `topic_id` (FK, Filtro, Join)

## Tabla `ost_ticket__cdata` (Modelo: `TicketCdata`)

- `subject` (Búsqueda)
- `ticket_id` (FK, Join) - **CRÍTICO** para la unión con `ost_ticket`.

## Tabla `ost_department` (Modelo: `Department`)

- `name` (Filtro) - **CRÍTICO** para el filtro por departamento ("Soporte Informatico", "Soporte IT").
- `id` (PK)

## Tabla `ost_user` (Modelo: `User`)

- `name` (Orden)
- `org_id` (FK, Filtro, Join)
- `id` (PK)

## Tabla `ost_staff` (Modelo: `Staff`)

- `dept_id` (FK, Join) - *O la columna/tabla intermedia que vincule `Staff` a `Department`.*
- `firstname` (Orden)
- `lastname` (Orden)
- `staff_id` (PK)

## Tabla `ost_organization` (Modelo: `Organization`)

- `name` (Orden)
- `id` (PK)

## Tabla `ost_help_topic` (Modelo: `HelpTopic`)

- `dept_id` (FK, Filtro, Join) - **CRÍTICO** para el filtro por departamento.
- `isactive` (Filtro)
- `sort` (Orden)
- `topic_id` (PK)

## Otras Tablas Relevantes (Claves Primarias ya suelen estar indexadas)

- **Tabla `ost_ticket_status` (Modelo: `TicketStatus`)**: `id` (PK)
- **Tabla `ost_ticket_priority` (Modelo: `TicketPriority`)**: `priority_id` (PK)

**Consideraciones Adicionales:**

*   Las **Claves Primarias (PK)** listadas (ej. `ticket_id`, `Department.id`) generalmente ya están indexadas por el sistema de base de datos.
*   Todas las **Claves Foráneas (FK)** son candidatas muy importantes para la indexación.
*   El impacto de los índices en las operaciones de escritura (`INSERT`, `UPDATE`, `DELETE`) es mínimo para este proyecto, ya que el dashboard es de **solo lectura**.
*   Es recomendable que un DBA analice estas sugerencias en el contexto del sistema OsTicket completo y monitorice el rendimiento después de aplicar los cambios.
