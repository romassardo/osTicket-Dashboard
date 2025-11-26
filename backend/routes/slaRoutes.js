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
        AND d.name = 'Soporte IT'
        ${dateFilter}
        ${agentFilter}
      ORDER BY t.closed DESC
    `;

    const tickets = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    logger.info(`📊 SLA Stats: Procesando ${tickets.length} tickets con horas hábiles...`);

    // Calcular horas hábiles para cada ticket
    const ticketsConHorasHabiles = await Promise.all(
      tickets.map(async (ticket) => {
        const horasHabiles = await calcularHorasHabiles(ticket.created, ticket.closed);
        const gracePeriod = ticket.grace_period || 24;
        const cumplido = horasHabiles <= gracePeriod;
        const diferencia = gracePeriod - horasHabiles;
        
        // Calcular tiempo primera respuesta en horas hábiles
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

    // Agrupar por agente, año, mes, nombre_sla
    const grupos = {};
    for (const ticket of ticketsConHorasHabiles) {
      const key = `${ticket.staff_id}-${ticket.anio}-${ticket.mes}-${ticket.nombre_sla || 'Sin SLA'}`;
      
      if (!grupos[key]) {
        grupos[key] = {
          departamento: ticket.departamento,
          agente: ticket.agente,
          staff_id: ticket.staff_id,
          nombre_sla: ticket.nombre_sla || 'Sin SLA',
          anio: ticket.anio,
          mes: ticket.mes,
          mes_nombre: ticket.mes_nombre,
          tickets: [],
          total_tickets: 0,
          tickets_sla_cumplido: 0,
          tickets_sla_vencido: 0,
          suma_horas_resolucion: 0,
          suma_horas_primera_respuesta: 0,
          cuenta_primera_respuesta: 0,
          suma_diferencia_sla: 0
        };
      }
      
      grupos[key].tickets.push(ticket);
      grupos[key].total_tickets++;
      
      if (ticket.cumplido_sla) {
        grupos[key].tickets_sla_cumplido++;
      } else {
        grupos[key].tickets_sla_vencido++;
      }
      
      grupos[key].suma_horas_resolucion += ticket.horas_habiles_resolucion;
      grupos[key].suma_diferencia_sla += ticket.diferencia_sla;
      
      if (ticket.horas_primera_respuesta !== null) {
        grupos[key].suma_horas_primera_respuesta += ticket.horas_primera_respuesta;
        grupos[key].cuenta_primera_respuesta++;
      }
    }

    // Convertir a array y calcular promedios
    const formattedResults = Object.values(grupos).map(grupo => {
      const porcentaje_sla_cumplido = grupo.total_tickets > 0 
        ? Math.round((grupo.tickets_sla_cumplido / grupo.total_tickets) * 100 * 100) / 100
        : 0;
      
      const tiempo_promedio_resolucion_horas = grupo.total_tickets > 0
        ? grupo.suma_horas_resolucion / grupo.total_tickets
        : 0;
      
      const tiempo_promedio_primera_respuesta_horas = grupo.cuenta_primera_respuesta > 0
        ? grupo.suma_horas_primera_respuesta / grupo.cuenta_primera_respuesta
        : 0;
      
      const diferencia_sla_horas = grupo.total_tickets > 0
        ? grupo.suma_diferencia_sla / grupo.total_tickets
        : 0;

      // Convertir horas hábiles a formato legible
      const formatHorasHabiles = (horas) => {
        if (!horas) return '0h 00m';
        const h = Math.floor(horas);
        const m = Math.round((horas - h) * 60);
        if (h >= HOURS_PER_DAY) {
          const dias = Math.floor(h / HOURS_PER_DAY);
          const horasRestantes = h % HOURS_PER_DAY;
          return `${dias}d ${horasRestantes}h ${String(m).padStart(2, '0')}m`;
        }
        return `${h}h ${String(m).padStart(2, '0')}m`;
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
        departamento: grupo.departamento,
        agente: grupo.agente,
        staff_id: grupo.staff_id,
        nombre_sla: grupo.nombre_sla,
        anio: grupo.anio,
        mes: grupo.mes,
        mes_nombre: grupo.mes_nombre,
        total_tickets: grupo.total_tickets,
        tickets_sla_cumplido: grupo.tickets_sla_cumplido,
        tickets_sla_vencido: grupo.tickets_sla_vencido,
        porcentaje_sla_cumplido,
        tiempo_promedio_primera_respuesta: formatHorasHabiles(tiempo_promedio_primera_respuesta_horas),
        tiempo_promedio_resolucion: formatHorasHabiles(tiempo_promedio_resolucion_horas),
        diferencia_sla_promedio: formatDiferenciaSLA(diferencia_sla_horas),
        // Valores numéricos para cálculos del frontend
        tiempo_primera_respuesta_segundos: tiempo_promedio_primera_respuesta_horas * 3600,
        tiempo_resolucion_segundos: tiempo_promedio_resolucion_horas * 3600,
        diferencia_sla_horas: diferencia_sla_horas,
        // Nuevo: indicador de que usa horas hábiles
        usa_horas_habiles: true
      };
    });

    // Ordenar por año desc, mes desc
    formattedResults.sort((a, b) => {
      if (b.anio !== a.anio) return b.anio - a.anio;
      if (b.mes !== a.mes) return b.mes - a.mes;
      return (a.agente || '').localeCompare(b.agente || '');
    });

    logger.info(`📊 SLA Stats (Horas Hábiles): ${formattedResults.length} registros agrupados`);
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
    logger.info('🚨 Obteniendo alertas SLA con horas hábiles...');
    
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
        AND d.name = 'Soporte IT'
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

    logger.info(`🚨 SLA Alerts (Horas Hábiles): ${ticketsVencidos.length} vencidos, ${ticketsCriticos.length} críticos, ${ticketsEnRiesgo.length} en riesgo`);
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
