// backend/routes/slaRoutes.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const logger = require('../utils/logger');
const { 
  calcularHorasHabiles, 
  calcularEstadoSLA, 
  verificarCumplimientoSLA,
  cargarFeriados,
  HOURS_PER_DAY 
} = require('../utils/businessHours');
const { formatHorasHabiles, formatDiferenciaSLA, formatTime, formatPrimeraRespuesta } = require('../utils/formatters');
const cache = require('../utils/cache');

/**
 * GET /api/sla/stats
 * Devuelve estadísticas de SLA agrupadas por agente, mes y año
 * AHORA USA HORAS HÁBILES (Lun-Vie 8:30-17:30, excluye feriados)
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

    // Obtener tickets individuales para calcular horas hábiles
    const query = `
      SELECT
        t.ticket_id,
        t.created,
        t.closed,
        IFNULL(d.name, 'Sin departamento') AS departamento,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente,
        s.staff_id,
        s_sla.name AS nombre_sla,
        s_sla.grace_period,
        YEAR(t.closed) AS anio,
        MONTH(t.closed) AS mes,
        DATE_FORMAT(t.closed, '%M') AS mes_nombre,
        fr.first_response
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
        AND d.name IN ('Soporte Informatico', 'Soporte IT')
        AND t.staff_id IS NOT NULL
        AND t.staff_id > 0
        ${dateFilter}
        ${agentFilter}
      ORDER BY t.closed DESC
    `;

    const tickets = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    logger.info(`SLA Stats: Procesando ${tickets.length} tickets con horas hábiles...`);

    // Calcular horas hábiles para cada ticket
    const ticketsConHorasHabiles = await Promise.all(
      tickets.map(async (ticket) => {
        const horasHabiles = await calcularHorasHabiles(ticket.created, ticket.closed);
        const gracePeriod = ticket.grace_period || 24;
        const cumplido = horasHabiles <= gracePeriod;
        const diferencia = gracePeriod - horasHabiles;
        
        let horasPrimeraRespuesta = null;
        if (ticket.first_response) {
          horasPrimeraRespuesta = await calcularHorasHabiles(ticket.created, ticket.first_response);
        }

        return {
          ...ticket,
          horas_habiles_resolucion: horasHabiles,
          cumplido_sla: cumplido,
          diferencia_sla: diferencia,
          horas_primera_respuesta: horasPrimeraRespuesta
        };
      })
    );

    // Agrupar directamente por agente (consolidado, sin subdividir por SLA)
    const agentes = {};
    for (const ticket of ticketsConHorasHabiles) {
      const key = `${ticket.staff_id}`;
      
      if (!agentes[key]) {
        agentes[key] = {
          agente: ticket.agente,
          staff_id: ticket.staff_id,
          total_tickets: 0,
          tickets_sla_cumplido: 0,
          tickets_sla_vencido: 0,
          suma_horas_resolucion: 0,
          suma_horas_primera_respuesta: 0,
          cuenta_primera_respuesta: 0,
          suma_diferencia_sla: 0
        };
      }
      
      agentes[key].total_tickets++;
      
      if (ticket.cumplido_sla) {
        agentes[key].tickets_sla_cumplido++;
      } else {
        agentes[key].tickets_sla_vencido++;
      }
      
      agentes[key].suma_horas_resolucion += ticket.horas_habiles_resolucion;
      agentes[key].suma_diferencia_sla += ticket.diferencia_sla;
      
      if (ticket.horas_primera_respuesta !== null) {
        agentes[key].suma_horas_primera_respuesta += ticket.horas_primera_respuesta;
        agentes[key].cuenta_primera_respuesta++;
      }
    }

    // Convertir a array y calcular promedios
    const formattedResults = Object.values(agentes).map(ag => {
      const porcentaje_sla_cumplido = ag.total_tickets > 0 
        ? Math.round((ag.tickets_sla_cumplido / ag.total_tickets) * 100 * 100) / 100
        : 0;
      
      const avgResolucionHoras = ag.total_tickets > 0
        ? ag.suma_horas_resolucion / ag.total_tickets : 0;
      
      const avgPrimeraRespuestaHoras = ag.cuenta_primera_respuesta > 0
        ? ag.suma_horas_primera_respuesta / ag.cuenta_primera_respuesta : 0;
      
      const avgDiferencia = ag.total_tickets > 0
        ? ag.suma_diferencia_sla / ag.total_tickets : 0;

      return {
        agente: ag.agente,
        staff_id: ag.staff_id,
        total_tickets: ag.total_tickets,
        tickets_sla_cumplido: ag.tickets_sla_cumplido,
        tickets_sla_vencido: ag.tickets_sla_vencido,
        porcentaje_sla_cumplido,
        tiempo_promedio_primera_respuesta: formatHorasHabiles(avgPrimeraRespuestaHoras),
        tiempo_promedio_resolucion: formatHorasHabiles(avgResolucionHoras),
        diferencia_sla_promedio: formatDiferenciaSLA(avgDiferencia),
        diferencia_sla_horas: avgDiferencia,
        usa_horas_habiles: true
      };
    });

    // Ordenar por % cumplimiento desc
    formattedResults.sort((a, b) => b.porcentaje_sla_cumplido - a.porcentaje_sla_cumplido);

    logger.info(`SLA Stats: ${formattedResults.length} agentes, ${tickets.length} tickets procesados`);
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
 * AHORA USA HORAS HÁBILES (Lun-Vie 8:30-17:30, excluye feriados)
 */
router.get('/alerts', async (req, res, next) => {
  try {
    // Verificar cache (TTL 2 minutos para alertas)
    const cacheKey = 'sla:alerts';
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('SLA Alerts: sirviendo desde cache');
      return res.json(cached);
    }

    logger.info('Calculando alertas SLA con horas hábiles...');
    
    // Obtener todos los tickets abiertos con su información básica
    const qTicketsAbiertos = `
      SELECT
        t.ticket_id,
        t.number,
        t.created AS fecha_creacion,
        t.updated AS ultima_actividad,
        TRIM(CONCAT(IFNULL(s.firstname,''), ' ', IFNULL(s.lastname,''))) AS agente_asignado,
        IFNULL(s_sla.name, 'Sin SLA') AS nombre_sla,
        COALESCE(NULLIF(s_sla.grace_period, 0), 24) AS sla_horas,
        COALESCE(p.priority_id, 2) AS priority_id,
        IFNULL(p.priority, 'Normal') AS prioridad_nombre
      FROM ost_ticket t
      LEFT JOIN ost_department d ON d.id = t.dept_id
      LEFT JOIN ost_staff s ON s.staff_id = t.staff_id
      LEFT JOIN ost_sla s_sla ON s_sla.id = t.sla_id
      LEFT JOIN ost_help_topic h ON h.topic_id = t.topic_id
      LEFT JOIN ost_ticket_priority p ON p.priority_id = h.priority_id
      WHERE t.closed IS NULL
        AND d.name IN ('Soporte Informatico', 'Soporte IT')
        AND COALESCE(NULLIF(s_sla.grace_period, 0), 24) > 0
      ORDER BY t.created ASC
    `;

    const ticketsAbiertos = await sequelize.query(qTicketsAbiertos, {
      type: sequelize.QueryTypes.SELECT
    });

    logger.info(`🚨 Procesando ${ticketsAbiertos.length} tickets abiertos con horas hábiles...`);

    // Calcular estado SLA con horas hábiles para cada ticket
    const ticketsConEstado = await Promise.all(
      ticketsAbiertos.map(async (ticket) => {
        const estado = await calcularEstadoSLA(ticket.fecha_creacion, ticket.sla_horas);
        
        // Calcular horas desde última actividad (también en horas hábiles)
        const horasUltimaActividad = ticket.ultima_actividad 
          ? await calcularHorasHabiles(ticket.ultima_actividad, new Date())
          : estado.horasTranscurridas;

        return {
          ticket_id: ticket.ticket_id,
          number: ticket.number,
          agente_asignado: ticket.agente_asignado,
          nombre_sla: ticket.nombre_sla,
          fecha_creacion: ticket.fecha_creacion,
          sla_horas: ticket.sla_horas,
          horas_transcurridas: estado.horasTranscurridas,
          horas_restantes: estado.horasRestantes,
          porcentaje_consumido: estado.porcentajeConsumido,
          vencido: estado.vencido,
          priority_id: ticket.priority_id,
          prioridad_nombre: ticket.prioridad_nombre,
          horas_desde_ultima_actividad: Math.round(horasUltimaActividad * 10) / 10
        };
      })
    );

    // Clasificar tickets
    const ticketsVencidos = [];
    const ticketsCriticos = [];
    const ticketsEnRiesgo = [];

    for (const ticket of ticketsConEstado) {
      const pct = Number(ticket.porcentaje_consumido) || 0;
      if (pct >= 100) {
        ticketsVencidos.push(ticket);
      } else if (pct >= 90) {
        ticketsCriticos.push(ticket);
      } else if (pct >= 70) {
        ticketsEnRiesgo.push(ticket);
      }
    }

    // Ordenar por urgencia (horas restantes ascendente)
    ticketsVencidos.sort((a, b) => a.horas_restantes - b.horas_restantes);
    ticketsCriticos.sort((a, b) => a.horas_restantes - b.horas_restantes);
    ticketsEnRiesgo.sort((a, b) => a.horas_restantes - b.horas_restantes);

    // Limitar a 50 por categoría
    const vencidosLimitados = ticketsVencidos.slice(0, 50);
    const criticosLimitados = ticketsCriticos.slice(0, 50);
    const enRiesgoLimitados = ticketsEnRiesgo.slice(0, 50);

    // Resumen
    const resumen = {
      total_tickets_abiertos: ticketsAbiertos.length,
      tickets_vencidos: ticketsVencidos.length,
      tickets_criticos: ticketsCriticos.length,
      tickets_en_riesgo: ticketsEnRiesgo.length
    };

    // Nota: agentes_bajo_rendimiento se mantiene vacío por ahora
    // ya que requeriría procesar todos los tickets cerrados de los últimos 30 días
    // lo cual sería muy costoso. Se puede habilitar si es necesario.
    const agentesConProblemas = [];

    const response = {
      resumen,
      tickets_vencidos: vencidosLimitados,
      tickets_criticos: criticosLimitados,
      tickets_en_riesgo: enRiesgoLimitados,
      agentes_bajo_rendimiento: agentesConProblemas,
      tendencias_negativas: [],
      usa_horas_habiles: true
    };

    // Cachear resultado por 2 minutos
    cache.set(cacheKey, response, 120);

    logger.info(`SLA Alerts: ${ticketsVencidos.length} vencidos, ${ticketsCriticos.length} críticos, ${ticketsEnRiesgo.length} en riesgo`);
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
        AND d.name IN ('Soporte Informatico', 'Soporte IT')
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
        AND d.name IN ('Soporte Informatico', 'Soporte IT')
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

    // Formatear resultados (usando funciones compartidas de utils/formatters.js)
    const formattedTickets = tickets.map(ticket => {
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
 * AHORA USA HORAS HÁBILES (consistente con /stats)
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

    // Obtener tickets cerrados con sus datos de SLA y primera respuesta
    const tickets = await sequelize.query(`
      SELECT
        t.ticket_id,
        t.created,
        t.closed,
        s_sla.grace_period,
        fr.first_response
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
        AND d.name IN ('Soporte Informatico', 'Soporte IT')
        ${dateFilter}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Calcular usando horas hábiles (consistente con /stats)
    let ticketsCumplidos = 0;
    let ticketsVencidos = 0;
    let sumaTiempoResolucion = 0;
    let sumaTiempoPrimeraRespuesta = 0;
    let cuentaPrimeraRespuesta = 0;

    const resultados = await Promise.all(tickets.map(async (ticket) => {
      const horasResolucion = await calcularHorasHabiles(ticket.created, ticket.closed);
      const gracePeriod = ticket.grace_period || 0;
      const cumplido = horasResolucion <= gracePeriod;

      if (cumplido) ticketsCumplidos++;
      else ticketsVencidos++;

      sumaTiempoResolucion += horasResolucion;

      if (ticket.first_response) {
        const horasPrimeraRespuesta = await calcularHorasHabiles(ticket.created, ticket.first_response);
        sumaTiempoPrimeraRespuesta += horasPrimeraRespuesta;
        cuentaPrimeraRespuesta++;
      }

      return { horasResolucion, cumplido };
    }));

    const totalTickets = tickets.length;
    const porcentajeCumplimiento = totalTickets > 0
      ? Math.round((ticketsCumplidos / totalTickets) * 100 * 10) / 10
      : 0;
    const avgResolucionHoras = totalTickets > 0 ? sumaTiempoResolucion / totalTickets : 0;
    const avgPrimeraRespuestaHoras = cuentaPrimeraRespuesta > 0 ? sumaTiempoPrimeraRespuesta / cuentaPrimeraRespuesta : 0;

    const result = {
      total_tickets: totalTickets,
      tickets_cumplidos: ticketsCumplidos,
      tickets_vencidos: ticketsVencidos,
      porcentaje_cumplimiento: porcentajeCumplimiento,
      avg_tiempo_primera_respuesta: avgPrimeraRespuestaHoras * 3600,
      avg_tiempo_resolucion: avgResolucionHoras * 3600,
      tiempo_promedio_primera_respuesta: formatHorasHabiles(avgPrimeraRespuestaHoras),
      tiempo_promedio_resolucion: formatHorasHabiles(avgResolucionHoras),
      usa_horas_habiles: true
    };

    logger.info(`SLA Summary generado: ${totalTickets} tickets, ${porcentajeCumplimiento}% cumplimiento`);
    res.json(result);

  } catch (error) {
    logger.error('Error al obtener resumen SLA:', error);
    next(error);
  }
});

module.exports = router;
