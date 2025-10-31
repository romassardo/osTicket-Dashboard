// backend/routes/slaRoutes.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/sla/stats
 * Devuelve estadísticas de SLA agrupadas por agente, mes y año
 * Basado en la query SQL proporcionada
 */
router.get('/stats', async (req, res, next) => {
  const { year, month, agent } = req.query;

  try {
    let dateFilter = '';
    const replacements = {};

    // Construir filtros de fecha
    if (year && month) {
      dateFilter = 'AND YEAR(t.closed) = :year AND MONTH(t.closed) = :month';
      replacements.year = parseInt(year, 10);
      replacements.month = parseInt(month, 10);
    } else if (year) {
      dateFilter = 'AND YEAR(t.closed) = :year';
      replacements.year = parseInt(year, 10);
    }

    // Filtro por agente específico
    let agentFilter = '';
    if (agent && agent !== 'all') {
      agentFilter = 'AND s.staff_id = :agentId';
      replacements.agentId = parseInt(agent, 10);
    }

    const query = `
      SELECT
        IFNULL(d.name, 'Sin departamento') AS departamento,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente,
        s.staff_id,
        s_sla.name AS nombre_sla,
        YEAR(t.closed) AS anio,
        MONTH(t.closed) AS mes,
        DATE_FORMAT(t.closed, '%M') AS mes_nombre,

        COUNT(t.ticket_id) AS total_tickets,

        SUM(
          CASE 
            WHEN s_sla.grace_period IS NOT NULL 
              AND TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_sla_cumplido,

        SUM(
          CASE 
            WHEN s_sla.grace_period IS NOT NULL 
              AND TIMESTAMPDIFF(HOUR, t.created, t.closed) > s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_sla_vencido,

        ROUND(
          SUM(
            CASE 
              WHEN s_sla.grace_period IS NOT NULL 
                AND TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
              THEN 1 ELSE 0 
            END
          ) / NULLIF(COUNT(t.ticket_id), 0) * 100,
          2
        ) AS porcentaje_sla_cumplido,

        -- Tiempo promedio primera respuesta (en segundos)
        AVG(
          CASE
            WHEN fr.first_response IS NOT NULL
            THEN TIMESTAMPDIFF(SECOND, t.created, fr.first_response)
          END
        ) AS tiempo_promedio_primera_respuesta_segundos,

        -- Tiempo promedio resolución (en segundos)
        AVG(
          CASE 
            WHEN t.closed IS NOT NULL 
            THEN TIMESTAMPDIFF(SECOND, t.created, t.closed)
          END
        ) AS tiempo_promedio_resolucion_segundos,
        
        -- Diferencia promedio vs límite SLA (margen o exceso)
        AVG(
          CASE 
            WHEN s_sla.grace_period IS NOT NULL AND t.closed IS NOT NULL
            THEN CAST(s_sla.grace_period AS SIGNED) - TIMESTAMPDIFF(HOUR, t.created, t.closed)
          END
        ) AS diferencia_sla_horas

      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id

      LEFT JOIN (
        SELECT 
          th.object_id AS ticket_id,
          MIN(te.created) AS first_response
        FROM ost_thread th
        INNER JOIN ost_thread_entry te ON te.thread_id = th.id
        WHERE te.type = 'R'
        GROUP BY th.object_id
      ) fr ON fr.ticket_id = t.ticket_id

      WHERE t.closed IS NOT NULL
        AND d.name = 'Soporte IT'
        ${dateFilter}
        ${agentFilter}

      GROUP BY anio, mes, departamento, agente, s.staff_id, nombre_sla
      ORDER BY anio DESC, mes DESC, departamento, agente
    `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Formatear tiempos para que sean legibles
    const formattedResults = results.map(row => {
      // Convertir segundos a formato "Xd HH:MM"
      const formatTime = (seconds) => {
        if (!seconds) return '0d 00:00';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      // Formatear diferencia SLA
      const formatDiferenciaSLA = (horas) => {
        if (horas === null || horas === undefined) return 'Sin datos';
        const horasAbs = Math.abs(horas);
        if (horas >= 0) {
          return `Cumplió ${horasAbs.toFixed(1)}h antes`;
        } else {
          return `Se pasó ${horasAbs.toFixed(1)}h`;
        }
      };

      return {
        ...row,
        tiempo_promedio_primera_respuesta: formatTime(row.tiempo_promedio_primera_respuesta_segundos),
        tiempo_promedio_resolucion: formatTime(row.tiempo_promedio_resolucion_segundos),
        diferencia_sla_promedio: formatDiferenciaSLA(row.diferencia_sla_horas),
        // Mantener también los valores en segundos y horas para cálculos
        tiempo_primera_respuesta_segundos: row.tiempo_promedio_primera_respuesta_segundos,
        tiempo_resolucion_segundos: row.tiempo_promedio_resolucion_segundos,
        diferencia_sla_horas: row.diferencia_sla_horas
      };
    });

    logger.info(`📊 SLA Stats: ${formattedResults.length} registros encontrados`);
    res.json(formattedResults);

  } catch (error) {
    logger.error('❌ Error al obtener estadísticas SLA:', {
      message: error.message,
      sql: error.sql,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Error al obtener estadísticas SLA',
      error: error.message,
      details: error.sql || error.original?.sql
    });
  }
});

/**
 * GET /api/sla/alerts
 * Devuelve alertas de SLA: tickets en riesgo y agentes con bajo rendimiento
 */
router.get('/alerts', async (req, res, next) => {
  try {
    logger.info('🚨 Obteniendo alertas SLA...');
    
    // 1. Tickets abiertos en riesgo de vencer SLA (más del 70% del tiempo transcurrido)
    // Query base para tickets abiertos con métricas SLA
    const qBase = `
      SELECT
        t.ticket_id,
        t.number,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente_asignado,
        IFNULL(s_sla.name, 'Sin SLA') AS nombre_sla,
        t.created AS fecha_creacion,
        COALESCE(NULLIF(s_sla.grace_period, 0), 24) AS sla_horas,
        TIMESTAMPDIFF(HOUR, t.created, NOW()) AS horas_transcurridas,
        CAST(COALESCE(NULLIF(s_sla.grace_period, 0), 24) AS SIGNED) - TIMESTAMPDIFF(HOUR, t.created, NOW()) AS horas_restantes,
        COALESCE(p.priority_id, 2) AS priority_id,
        IFNULL(p.priority, 'Normal') AS prioridad_nombre,
        TIMESTAMPDIFF(HOUR, IFNULL(t.updated, t.created), NOW()) AS horas_desde_ultima_actividad,
        ROUND((TIMESTAMPDIFF(HOUR, t.created, NOW()) / COALESCE(NULLIF(s_sla.grace_period, 0), 24)) * 100, 1) AS porcentaje_consumido
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      LEFT JOIN ost_help_topic h ON h.topic_id = t.topic_id
      LEFT JOIN ost_ticket_priority p ON p.priority_id = h.priority_id
      WHERE t.closed IS NULL
        AND d.name = 'Soporte IT'
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
    `;

    // 1. Tickets VENCIDOS (>100% del SLA)
    const qVencidos = qBase + `
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) >= COALESCE(NULLIF(s_sla.grace_period, 0), 24)
      ORDER BY horas_restantes ASC
      LIMIT 50
    `;

    // 2. Tickets CRÍTICOS (90-100% del SLA)
    const qCriticos = qBase + `
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) >= (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.9)
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) < COALESCE(NULLIF(s_sla.grace_period, 0), 24)
      ORDER BY horas_restantes ASC
      LIMIT 50
    `;

    // 3. Tickets EN RIESGO (70-90% del SLA)
    const qEnRiesgo = qBase + `
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) >= (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.7)
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) < (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.9)
      ORDER BY horas_restantes ASC
      LIMIT 50
    `;
    // Ejecutar las 3 queries en paralelo
    let ticketsVencidos, ticketsCriticos, ticketsEnRiesgo;
    try {
      [ticketsVencidos, ticketsCriticos, ticketsEnRiesgo] = await Promise.all([
        sequelize.query(qVencidos, { type: sequelize.QueryTypes.SELECT }),
        sequelize.query(qCriticos, { type: sequelize.QueryTypes.SELECT }),
        sequelize.query(qEnRiesgo, { type: sequelize.QueryTypes.SELECT })
      ]);
    } catch (error) {
      logger.error('❌ Error SQL en queries de alertas SLA', {
        message: error.message,
        name: error.name,
        sql: error.sql || (error.original && error.original.sql),
        stack: error.stack
      });
      throw error;
    }

    // 2. Agentes con bajo rendimiento (últimos 30 días)
    const qAgentesConProblemas = `
      SELECT
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente,
        COUNT(t.ticket_id) AS total_tickets,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= COALESCE(NULLIF(s_sla.grace_period, 0), 24)
            THEN 1 ELSE 0 
          END
        ) AS tickets_cumplidos,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) > COALESCE(NULLIF(s_sla.grace_period, 0), 24)
            THEN 1 ELSE 0 
          END
        ) AS tickets_vencidos,
        ROUND(
          SUM(
            CASE 
              WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= COALESCE(NULLIF(s_sla.grace_period, 0), 24)
              THEN 1 ELSE 0 
            END
          ) / NULLIF(COUNT(t.ticket_id), 0) * 100,
          1
        ) AS porcentaje_cumplimiento
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      WHERE t.closed IS NOT NULL
        AND d.name = 'Soporte IT'
        AND t.closed >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND s.staff_id IS NOT NULL
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
      GROUP BY agente
      HAVING porcentaje_cumplimiento < 80 AND total_tickets >= 5
      ORDER BY porcentaje_cumplimiento ASC
    `;
    let agentesConProblemas;
    try {
      agentesConProblemas = await sequelize.query(qAgentesConProblemas, {
        type: sequelize.QueryTypes.SELECT
      });
    } catch (error) {
      logger.error('❌ Error SQL en agentes_con_problemas', {
        message: error.message,
        name: error.name,
        sql: error.sql || (error.original && error.original.sql),
        query: qAgentesConProblemas,
        stack: error.stack
      });
      throw error;
    }

    // 3. Resumen general con 3 categorías
    const qResumenGeneral = `
      SELECT
        CAST(COUNT(t.ticket_id) AS UNSIGNED) AS total_tickets_abiertos,
        CAST(COALESCE(SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, NOW()) >= COALESCE(NULLIF(s_sla.grace_period, 0), 24)
            THEN 1 ELSE 0 
          END
        ), 0) AS UNSIGNED) AS tickets_vencidos,
        CAST(COALESCE(SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, NOW()) >= (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.9)
              AND TIMESTAMPDIFF(HOUR, t.created, NOW()) < COALESCE(NULLIF(s_sla.grace_period, 0), 24)
            THEN 1 ELSE 0 
          END
        ), 0) AS UNSIGNED) AS tickets_criticos,
        CAST(COALESCE(SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, NOW()) >= (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.7)
              AND TIMESTAMPDIFF(HOUR, t.created, NOW()) < (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.9)
            THEN 1 ELSE 0 
          END
        ), 0) AS UNSIGNED) AS tickets_en_riesgo
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      WHERE t.closed IS NULL
        AND d.name = 'Soporte IT'
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
    `;
    let resumenGeneral;
    try {
      resumenGeneral = await sequelize.query(qResumenGeneral, {
        type: sequelize.QueryTypes.SELECT
      });
    } catch (error) {
      logger.error('❌ Error SQL en resumen_general', {
        message: error.message,
        name: error.name,
        sql: error.sql || (error.original && error.original.sql),
        query: qResumenGeneral,
        stack: error.stack
      });
      throw error;
    }
    
    const response = {
      resumen: resumenGeneral[0] || { 
        total_tickets_abiertos: 0, 
        tickets_vencidos: 0, 
        tickets_criticos: 0, 
        tickets_en_riesgo: 0 
      },
      tickets_vencidos: ticketsVencidos,
      tickets_criticos: ticketsCriticos,
      tickets_en_riesgo: ticketsEnRiesgo,
      agentes_bajo_rendimiento: agentesConProblemas,
      tendencias_negativas: []
    };

    logger.info(`🚨 SLA Alerts: ${ticketsVencidos.length} vencidos, ${ticketsCriticos.length} críticos, ${ticketsEnRiesgo.length} en riesgo, ${agentesConProblemas.length} agentes con problemas`);
    res.json(response);

  } catch (error) {
    logger.error('❌ Error al obtener alertas SLA:', error);
    logger.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener alertas SLA',
      message: error.message,
      resumen: { total_tickets_abiertos: 0, tickets_vencidos: 0, tickets_criticos: 0, tickets_en_riesgo: 0 },
      tickets_vencidos: [],
      tickets_criticos: [],
      tickets_en_riesgo: [],
      agentes_bajo_rendimiento: [],
      tendencias_negativas: []
    });
  }
});

/**
 * GET /api/sla/tickets
 * Devuelve lista detallada de tickets con información individual de SLA
 * Permite filtrado por fecha, agente y estado SLA
 */
router.get('/tickets', async (req, res, next) => {
  const { year, month, agent_id, status, page = 1, limit = 50 } = req.query;

  try {
    let dateFilter = '';
    let agentFilter = '';
    let statusFilter = '';
    const replacements = {};

    // Filtro de fecha (últimos 3 meses por defecto si no se especifica)
    if (year && month) {
      dateFilter = 'AND YEAR(t.closed) = :year AND MONTH(t.closed) = :month';
      replacements.year = parseInt(year, 10);
      replacements.month = parseInt(month, 10);
    } else if (year) {
      dateFilter = 'AND YEAR(t.closed) = :year';
      replacements.year = parseInt(year, 10);
    } else {
      // Por defecto: últimos 3 meses
      dateFilter = 'AND t.closed >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
    }

    // Filtro por agente
    if (agent_id && agent_id !== 'all') {
      agentFilter = 'AND s.staff_id = :agentId';
      replacements.agentId = parseInt(agent_id, 10);
    }

    // Filtro por estado SLA (cumplido/vencido)
    if (status === 'cumplido') {
      statusFilter = 'AND TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period';
    } else if (status === 'vencido') {
      statusFilter = 'AND TIMESTAMPDIFF(HOUR, t.created, t.closed) > s_sla.grace_period';
    }

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      WHERE t.closed IS NOT NULL
        AND d.name = 'Soporte IT'
        ${dateFilter}
        ${agentFilter}
        ${statusFilter}
    `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const total = countResult.total;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Query principal con paginación
    const query = `
      SELECT
        t.number AS numero_ticket,
        IFNULL(d.name, 'Sin departamento') AS departamento,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente,
        IFNULL(s_sla.name, 'Sin SLA') AS nombre_sla,
        s_sla.grace_period AS limite_sla_horas,
        t.created AS fecha_creacion,
        t.closed AS fecha_cierre,
        TIMESTAMPDIFF(HOUR, t.created, t.closed) AS horas_resolucion_real,
        (s_sla.grace_period - TIMESTAMPDIFF(HOUR, t.created, t.closed)) AS diferencia_horas,
        CASE 
          WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
          THEN 'Cumplido'
          ELSE 'Vencido'
        END AS estado_sla,
        ROUND((TIMESTAMPDIFF(HOUR, t.created, t.closed) / s_sla.grace_period) * 100, 2) AS porcentaje_sla_utilizado,
        TIMESTAMPDIFF(SECOND, t.created, t.closed) AS tiempo_resolucion_segundos,
        fr.first_response AS tiempo_primera_respuesta
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      LEFT JOIN (
        SELECT 
          th.object_id AS ticket_id,
          MIN(te.created) AS first_response
        FROM ost_thread th
        INNER JOIN ost_thread_entry te ON te.thread_id = th.id
        WHERE te.type = 'R'
        GROUP BY th.object_id
      ) fr ON fr.ticket_id = t.ticket_id
      WHERE t.closed IS NOT NULL
        AND d.name = 'Soporte IT'
        ${dateFilter}
        ${agentFilter}
        ${statusFilter}
      ORDER BY t.closed DESC
      LIMIT :limit OFFSET :offset
    `;

    replacements.limit = parseInt(limit, 10);
    replacements.offset = offset;

    const tickets = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Formatear resultados
    const formattedTickets = tickets.map(ticket => {
      // Formatear tiempo de resolución
      const formatTime = (seconds) => {
        if (!seconds) return '0d 00:00';
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      // Formatear diferencia SLA
      const formatDiferenciaSLA = (horas) => {
        if (horas === null || horas === undefined) return 'Sin datos';
        const horasAbs = Math.abs(horas);
        if (horas >= 0) {
          return `Cumplió ${horasAbs.toFixed(1)}h antes`;
        } else {
          return `Se pasó ${horasAbs.toFixed(1)}h`;
        }
      };

      // Formatear tiempo primera respuesta
      const formatPrimeraRespuesta = (fechaCreacion, fechaRespuesta) => {
        if (!fechaRespuesta) return 'Sin respuesta';
        const diffSeconds = Math.floor((new Date(fechaRespuesta) - new Date(fechaCreacion)) / 1000);
        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
      };

      return {
        numero_ticket: ticket.numero_ticket,
        departamento: ticket.departamento,
        agente: ticket.agente,
        nombre_sla: ticket.nombre_sla,
        limite_sla_horas: ticket.limite_sla_horas,
        fecha_creacion: ticket.fecha_creacion,
        fecha_cierre: ticket.fecha_cierre,
        horas_resolucion_real: ticket.horas_resolucion_real,
        tiempo_resolucion_legible: formatTime(ticket.tiempo_resolucion_segundos),
        diferencia_horas: ticket.diferencia_horas,
        estado_sla: ticket.estado_sla,
        diferencia_sla: formatDiferenciaSLA(ticket.diferencia_horas),
        porcentaje_sla_utilizado: `${ticket.porcentaje_sla_utilizado} %`,
        tiempo_primera_respuesta: formatPrimeraRespuesta(ticket.fecha_creacion, ticket.tiempo_primera_respuesta)
      };
    });

    const response = {
      tickets: formattedTickets,
      pagination: {
        total: total,
        page: parseInt(page, 10),
        per_page: parseInt(limit, 10),
        total_pages: Math.ceil(total / parseInt(limit, 10))
      }
    };

    logger.info(`📋 SLA Tickets: ${formattedTickets.length} tickets encontrados (total: ${total})`);
    res.json(response);

  } catch (error) {
    logger.error('❌ Error al obtener tickets SLA:', error);
    next(error);
  }
});

/**
 * GET /api/sla/summary
 * Devuelve un resumen general de SLA para las tarjetas del dashboard
 */
router.get('/summary', async (req, res, next) => {
  const { year, month } = req.query;

  try {
    let dateFilter = '';
    const replacements = {};

    if (year && month) {
      dateFilter = 'AND YEAR(t.closed) = :year AND MONTH(t.closed) = :month';
      replacements.year = parseInt(year, 10);
      replacements.month = parseInt(month, 10);
    } else if (year) {
      dateFilter = 'AND YEAR(t.closed) = :year';
      replacements.year = parseInt(year, 10);
    }

    const summary = await sequelize.query(`
      SELECT
        COUNT(t.ticket_id) AS total_tickets,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_cumplidos,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) > s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_vencidos,
        ROUND(
          SUM(
            CASE 
              WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
              THEN 1 ELSE 0 
            END
          ) / NULLIF(COUNT(t.ticket_id), 0) * 100,
          1
        ) AS porcentaje_cumplimiento,
        AVG(
          CASE
            WHEN fr.first_response IS NOT NULL
            THEN TIMESTAMPDIFF(SECOND, t.created, fr.first_response)
          END
        ) AS avg_tiempo_primera_respuesta,
        AVG(TIMESTAMPDIFF(SECOND, t.created, t.closed)) AS avg_tiempo_resolucion
      FROM ost_ticket t
      INNER JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      LEFT JOIN (
        SELECT 
          th.object_id AS ticket_id,
          MIN(te.created) AS first_response
        FROM ost_thread th
        INNER JOIN ost_thread_entry te ON te.thread_id = th.id
        WHERE te.type = 'R'
        GROUP BY th.object_id
      ) fr ON fr.ticket_id = t.ticket_id
      WHERE t.closed IS NOT NULL
        AND d.name = 'Soporte IT'
        ${dateFilter}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Formatear tiempos
    const formatTime = (seconds) => {
      if (!seconds) return '0d 00:00';
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const result = {
      ...summary[0],
      tiempo_promedio_primera_respuesta: formatTime(summary[0].avg_tiempo_primera_respuesta),
      tiempo_promedio_resolucion: formatTime(summary[0].avg_tiempo_resolucion)
    };

    logger.info(`📊 SLA Summary generado correctamente`);
    res.json(result);

  } catch (error) {
    logger.error('❌ Error al obtener resumen SLA:', error);
    next(error);
  }
});

module.exports = router;
