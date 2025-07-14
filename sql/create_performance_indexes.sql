-- ================================================================
-- ÍNDICES DE PERFORMANCE CRÍTICOS - Dashboard osTicket
-- ================================================================
-- Este archivo contiene los índices recomendados para mejorar el performance
-- del Dashboard osTicket basado en el análisis de DB_INDEX_RECOMMENDATIONS.md
-- 
-- IMPORTANTE: Ejecutar estos comandos durante horario de bajo tráfico
-- ya que la creación de índices puede ser costosa en tablas grandes.
-- ================================================================

USE osticket; -- Cambiar por el nombre de tu base de datos

-- ================================================================
-- TABLA: ost_ticket (Consultas más críticas del sistema)
-- ================================================================

-- Índice para filtros por departamento (CRÍTICO - usado en todas las consultas)
CREATE INDEX idx_ticket_dept_id ON ost_ticket(dept_id);

-- Índice para filtros por estado (usado en conteos y filtros)
CREATE INDEX idx_ticket_status_id ON ost_ticket(status_id);

-- Índice para ordenamiento por fecha de creación (usado en paginación)
CREATE INDEX idx_ticket_created ON ost_ticket(created);

-- Índice para filtros por staff asignado
CREATE INDEX idx_ticket_staff_id ON ost_ticket(staff_id);

-- Índice para filtros por usuario
CREATE INDEX idx_ticket_user_id ON ost_ticket(user_id);

-- Índice compuesto para filtros más comunes (dept + status + fecha)
CREATE INDEX idx_ticket_dept_status_created ON ost_ticket(dept_id, status_id, created);

-- Índice compuesto para filtros de fecha con departamento
CREATE INDEX idx_ticket_dept_created ON ost_ticket(dept_id, created);

-- ================================================================
-- TABLA: ost_ticket__cdata (Joins críticos con ticket principal)
-- ================================================================

-- Índice para JOIN con ost_ticket (CRÍTICO - usado en todas las consultas de datos)
CREATE INDEX idx_ticket_cdata_ticket_id ON ost_ticket__cdata(ticket_id);

-- Índice para búsquedas por asunto (usado en search)
CREATE INDEX idx_ticket_cdata_subject ON ost_ticket__cdata(subject(100)); -- Solo primeros 100 caracteres

-- Índice para filtros por transporte
CREATE INDEX idx_ticket_cdata_transporte ON ost_ticket__cdata(transporte);

-- Índice para filtros por sector
CREATE INDEX idx_ticket_cdata_sector ON ost_ticket__cdata(sector);

-- ================================================================
-- TABLA: ost_department (Filtros críticos por nombre)
-- ================================================================

-- Índice para filtros por nombre de departamento (CRÍTICO - usado en todas las consultas)
CREATE INDEX idx_department_name ON ost_department(name);

-- ================================================================
-- TABLA: ost_ticket_status (Filtros por estado)
-- ================================================================

-- Índice para filtros por state (open/closed)
CREATE INDEX idx_ticket_status_state ON ost_ticket_status(state);

-- Índice compuesto name + state para optimizar queries agregadas
CREATE INDEX idx_ticket_status_name_state ON ost_ticket_status(name, state);

-- ================================================================
-- TABLA: ost_user (Joins con tickets)
-- ================================================================

-- Índice para filtros por organización
CREATE INDEX idx_user_org_id ON ost_user(org_id);

-- Índice para búsquedas por nombre de usuario
CREATE INDEX idx_user_name ON ost_user(name(50)); -- Solo primeros 50 caracteres

-- ================================================================
-- TABLA: ost_staff (Joins con tickets)
-- ================================================================

-- Índice para JOIN con departamento
CREATE INDEX idx_staff_dept_id ON ost_staff(dept_id);

-- Índice compuesto para ordenamiento por nombre completo
CREATE INDEX idx_staff_name ON ost_staff(firstname, lastname);

-- ================================================================
-- TABLA: ost_list_items (Usada en /options/transporte optimizado)
-- ================================================================

-- Índice para filtros por value en transportes/sectores
CREATE INDEX idx_list_items_value ON ost_list_items(value(50));

-- ================================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- ================================================================

-- Comando para verificar que los índices se crearon correctamente:
-- SHOW INDEX FROM ost_ticket;
-- SHOW INDEX FROM ost_ticket__cdata;
-- SHOW INDEX FROM ost_department;
-- SHOW INDEX FROM ost_ticket_status;
-- SHOW INDEX FROM ost_user;
-- SHOW INDEX FROM ost_staff;
-- SHOW INDEX FROM ost_list_items;

-- ================================================================
-- ANÁLISIS DE PERFORMANCE (Para ejecutar después de crear índices)
-- ================================================================

-- Ejemplo de EXPLAIN para verificar que se usen los índices:
/*
EXPLAIN SELECT t.ticket_id, t.number, tc.subject, ts.name as status, u.name as user_name
FROM ost_ticket t
JOIN ost_department d ON t.dept_id = d.id
JOIN ost_ticket__cdata tc ON t.ticket_id = tc.ticket_id
JOIN ost_ticket_status ts ON t.status_id = ts.id
JOIN ost_user u ON t.user_id = u.id
WHERE d.name IN ('Soporte Informatico', 'Soporte IT')
AND t.created >= '2024-01-01'
ORDER BY t.created DESC
LIMIT 10;
*/

-- ================================================================
-- NOTAS IMPORTANTES:
-- ================================================================
-- 1. Estos índices están optimizados para las consultas del Dashboard osTicket
-- 2. Los índices compuestos están ordenados por selectividad (más selectivo primero)
-- 3. Los índices de texto usan prefijos para evitar overhead innecesario
-- 4. Monitorear el uso de índices con SHOW INDEX y EXPLAIN después de implementar
-- 5. Considerar eliminar índices no utilizados después de un período de prueba
-- ================================================================ 