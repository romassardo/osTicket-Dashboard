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
        YEAR(t.closed) AS anio,
        MONTH(t.closed) AS mes,
        DATE_FORMAT(t.closed, '%M') AS mes_nombre,

        COUNT(t.ticket_id) AS total_tickets,

        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_sla_cumplido,

        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) > s_sla.grace_period 
            THEN 1 ELSE 0 
          END
        ) AS tickets_sla_vencido,

        ROUND(
          SUM(
            CASE 
              WHEN TIMESTAMPDIFF(HOUR, t.created, t.closed) <= s_sla.grace_period 
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
        AVG(TIMESTAMPDIFF(SECOND, t.created, t.closed)) AS tiempo_promedio_resolucion_segundos

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

      GROUP BY anio, mes, departamento, agente, s.staff_id
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

      return {
        ...row,
        tiempo_promedio_primera_respuesta: formatTime(row.tiempo_promedio_primera_respuesta_segundos),
        tiempo_promedio_resolucion: formatTime(row.tiempo_promedio_resolucion_segundos),
        // Mantener también los valores en segundos para cálculos
        tiempo_primera_respuesta_segundos: row.tiempo_promedio_primera_respuesta_segundos,
        tiempo_resolucion_segundos: row.tiempo_promedio_resolucion_segundos
      };
    });

    logger.info(`📊 SLA Stats: ${formattedResults.length} registros encontrados`);
    res.json(formattedResults);

  } catch (error) {
    logger.error('❌ Error al obtener estadísticas SLA:', error);
    next(error);
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
    const ticketsEnRiesgo = await sequelize.query(`
      SELECT
        t.ticket_id,
        t.number,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente_asignado,
        t.created AS fecha_creacion,
        COALESCE(NULLIF(s_sla.grace_period, 0), 24) AS sla_horas,
        TIMESTAMPDIFF(HOUR, t.created, NOW()) AS horas_transcurridas,
        COALESCE(NULLIF(s_sla.grace_period, 0), 24) - TIMESTAMPDIFF(HOUR, t.created, NOW()) AS horas_restantes,
        ROUND(
          (TIMESTAMPDIFF(HOUR, t.created, NOW()) / NULLIF(COALESCE(s_sla.grace_period, 24), 0)) * 100,
          1
        ) AS porcentaje_transcurrido
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      WHERE t.closed IS NULL
        AND d.name = 'Soporte IT'
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) >= 0
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
        AND TIMESTAMPDIFF(HOUR, t.created, NOW()) > (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.7)
      ORDER BY horas_restantes ASC
      LIMIT 20
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Agentes con bajo rendimiento (últimos 30 días)
    const agentesConProblemas = await sequelize.query(`
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
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Resumen general
    const resumenGeneral = await sequelize.query(`
      SELECT
        COUNT(t.ticket_id) AS total_tickets_abiertos,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, NOW()) > (COALESCE(NULLIF(s_sla.grace_period, 0), 24) * 0.7)
            THEN 1 ELSE 0 
          END
        ) AS tickets_en_riesgo,
        SUM(
          CASE 
            WHEN TIMESTAMPDIFF(HOUR, t.created, NOW()) > COALESCE(NULLIF(s_sla.grace_period, 0), 24)
            THEN 1 ELSE 0 
          END
        ) AS tickets_vencidos
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      WHERE t.closed IS NULL
        AND d.name = 'Soporte IT'
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const response = {
      resumen: resumenGeneral[0] || { total_tickets_abiertos: 0, tickets_en_riesgo: 0, tickets_vencidos: 0 },
      tickets_en_riesgo: ticketsEnRiesgo,
      agentes_bajo_rendimiento: agentesConProblemas,
      tendencias_negativas: []
    };

    logger.info(`🚨 SLA Alerts: ${ticketsEnRiesgo.length} tickets en riesgo, ${agentesConProblemas.length} agentes con problemas`);
    res.json(response);

  } catch (error) {
    logger.error('❌ Error al obtener alertas SLA:', error);
    logger.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener alertas SLA',
      message: error.message,
      resumen: { total_tickets_abiertos: 0, tickets_en_riesgo: 0, tickets_vencidos: 0 },
      tickets_en_riesgo: [],
      agentes_bajo_rendimiento: [],
      tendencias_negativas: []
    });
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
