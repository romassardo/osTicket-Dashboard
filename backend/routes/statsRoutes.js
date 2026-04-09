// backend/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const { TicketCdata, ListItems, Ticket, User, Organization, Department, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * GET /api/stats/tickets-by-transport
 * Devuelve un conteo de tickets agrupados por medio de transporte.
 * Es utilizado para alimentar el gráfico de barras horizontales en el dashboard.
 */
router.get('/tickets-by-transport', async (req, res, next) => {
  const { year, month } = req.query;

  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    let whereClause = {};
    if (year && month) {
      whereClause.created = {
        [Op.between]: [
          new Date(year, month - 1, 1),
          new Date(year, month, 0, 23, 59, 59)
        ]
      };
    }

    const transportStats = await Ticket.findAll({
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: {
              [Op.in]: allowedDepartmentNames
            }
          },
          attributes: [],
          required: true
        },
        {
          model: TicketCdata,
          as: 'cdata',
          attributes: ['transporte'],
      include: [
        {
          model: ListItems,
          as: 'TransporteName',
          attributes: ['value'],
              required: false
            }
          ],
          required: false
        }
      ],
      where: whereClause,
      attributes: ['ticket_id'],
    });

    // Agrupar por nombre de transporte
    const grouped = transportStats.reduce((acc, ticket) => {
      const transportName = ticket.cdata?.TransporteName?.value || 'Sin Especificar';
      acc[transportName] = (acc[transportName] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([name, count]) => ({
      name,
      value: count
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor

    logger.info(`Stats: ${result.length} categorías de transporte encontradas`);
    res.json(result);

  } catch (error) {
    logger.error('Error al obtener estadísticas de transporte:', error);
    next(error);
  }
});

/**
 * GET /api/stats/tickets-by-sector
 * Devuelve un conteo de tickets agrupados por sector.
 * Es utilizado para alimentar el gráfico de barras horizontales en el dashboard.
 */
router.get('/tickets-by-sector', async (req, res, next) => {
  const { year, month } = req.query;

  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    let whereClause = {};
    if (year && month) {
      whereClause.created = {
        [Op.between]: [
          new Date(year, month - 1, 1),
          new Date(year, month, 0, 23, 59, 59)
        ]
      };
    }

    const sectorStats = await Ticket.findAll({
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: {
              [Op.in]: allowedDepartmentNames
            }
          },
          attributes: [],
          required: true
        },
        {
          model: TicketCdata,
          as: 'cdata',
          attributes: ['sector'],
          include: [
            {
              model: ListItems,
              as: 'SectorName',
              attributes: ['value'],
              required: false
            }
          ],
          required: false
        }
      ],
      where: whereClause,
      attributes: ['ticket_id'],
    });

    // Agrupar por nombre de sector
    const grouped = sectorStats.reduce((acc, ticket) => {
      const sectorName = ticket.cdata?.SectorName?.value || 'Sin Especificar';
      acc[sectorName] = (acc[sectorName] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([name, count]) => ({
      name,
      value: count
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor

    logger.info(`Stats: ${result.length} categorías de sector encontradas`);
    res.json(result);

  } catch (error) {
    logger.error('Error al obtener estadísticas de sector:', error);
    next(error);
  }
});

// Cache del field_id del campo de organización en formularios custom
let _cachedOrgFieldId = null;
async function getOrgFieldId() {
  if (_cachedOrgFieldId !== null) return _cachedOrgFieldId;
  const rows = await sequelize.query(
    "SELECT id FROM ost_form_field WHERE name = 'sector' AND form_id = 2 LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  _cachedOrgFieldId = rows.length > 0 ? rows[0].id : 36; // fallback al ID conocido
  return _cachedOrgFieldId;
}

/**
 * GET /api/stats/tickets-by-organization
 * Devuelve un conteo de tickets agrupados por organización.
 * Parámetros: year, month
 */
router.get('/tickets-by-organization', async (req, res, next) => {
  const { year, month } = req.query;

  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    const targetFieldId = await getOrgFieldId();

    // Construcción del filtro de fecha para SQL directo
    let dateFilter = '';
    const replacements = { allowedDepts: allowedDepartmentNames, fieldId: targetFieldId };

    if (year && month) {
      const numericYear = parseInt(year, 10);
      const numericMonth = parseInt(month, 10);
      const startDate = new Date(numericYear, numericMonth - 1, 1);
      const endDate = new Date(numericYear, numericMonth, 0, 23, 59, 59);

      dateFilter = 'AND t.created BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    // Intentar obtener organizaciones desde campos custom de formularios
    let results = [];

    try {
      // Primero intentar desde campos custom de formularios (más común en osTicket)
      results = await sequelize.query(`
        SELECT
          CASE
            WHEN fev.value IS NOT NULL AND fev.value != '' THEN
              CASE
                WHEN fev.value LIKE '{%' THEN
                  TRIM(BOTH '"' FROM JSON_UNQUOTE(JSON_EXTRACT(fev.value, CONCAT('$.', JSON_UNQUOTE(JSON_KEYS(fev.value, '$')[0])))))
                WHEN fev.value LIKE '[%' THEN
                  TRIM(BOTH '"' FROM JSON_UNQUOTE(JSON_EXTRACT(fev.value, '$[0]')))
                ELSE TRIM(BOTH '"' FROM fev.value)
              END
            ELSE 'Sin Organización'
          END as name,
          COUNT(t.ticket_id) as value
        FROM ost_ticket t
        INNER JOIN ost_department d ON t.dept_id = d.id
        LEFT JOIN ost_form_entry fe ON fe.object_id = t.ticket_id AND fe.object_type = 'T'
        LEFT JOIN ost_form_entry_values fev ON fev.entry_id = fe.id AND fev.field_id = :fieldId
        WHERE d.name IN (:allowedDepts)
          ${dateFilter}
        GROUP BY name
        HAVING value > 0
        ORDER BY value DESC
        LIMIT 15
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });

      // Si no hay resultados desde formularios, intentar desde tabla de organizaciones
      if (results.length === 0 || (results.length === 1 && results[0].name === 'Sin Organización')) {
        results = await sequelize.query(`
          SELECT
            COALESCE(o.name, 'Sin Organización') as name,
            COUNT(t.ticket_id) as value
          FROM ost_ticket t
          INNER JOIN ost_user u ON t.user_id = u.id
          LEFT JOIN ost_organization o ON u.org_id = o.id AND u.org_id > 0
          INNER JOIN ost_department d ON t.dept_id = d.id
          WHERE d.name IN (:allowedDepts)
            ${dateFilter}
          GROUP BY o.id, o.name
          ORDER BY value DESC
          LIMIT 15
        `, {
          replacements,
          type: sequelize.QueryTypes.SELECT
        });
      }

    } catch (error) {
      logger.warn('Error al obtener organizaciones desde formularios, usando método tradicional:', error.message);

      // Fallback a consulta tradicional
      results = await sequelize.query(`
        SELECT
          COALESCE(o.name, 'Sin Organización') as name,
          COUNT(t.ticket_id) as value
        FROM ost_ticket t
        INNER JOIN ost_user u ON t.user_id = u.id
        LEFT JOIN ost_organization o ON u.org_id = o.id AND u.org_id > 0
        INNER JOIN ost_department d ON t.dept_id = d.id
        WHERE d.name IN (:allowedDepts)
          ${dateFilter}
        GROUP BY o.id, o.name
        ORDER BY value DESC
        LIMIT 15
      `, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
    }

    // Formatear resultados
    const formattedData = results.map(item => ({
      name: item.name,
      value: parseInt(item.value, 10)
    }));
    
    logger.info(`📊 Estadísticas de organización generadas (field_id: ${targetFieldId}): ${formattedData.length} resultados.`);
    res.json(formattedData);

  } catch (error) {
    logger.error('❌ Error al generar estadísticas de organización:', error);
    next(error);
  }
});

/**
 * GET /api/stats/monthly-comparison
 * Compara flujo de tickets entre dos meses: creados, cerrados y pendientes que pasaron de un mes a otro
 * Query params: month1, year1, month2, year2
 */
router.get('/monthly-comparison', async (req, res, next) => {
  try {
    const { month1, year1, month2, year2 } = req.query;
    
    if (!month1 || !year1 || !month2 || !year2) {
      return res.status(400).json({ 
        error: 'Se requieren month1, year1, month2, year2' 
      });
    }

    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    // Función para obtener análisis de flujo de un mes
    const getMonthFlowData = async (year, month) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // 1. Tickets CREADOS en el mes
      const createdInMonth = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM ost_ticket t
        INNER JOIN ost_department d ON t.dept_id = d.id
        WHERE d.name IN (:allowedDepts)
          AND t.created BETWEEN :startDate AND :endDate
      `, {
        replacements: { 
          allowedDepts: allowedDepartmentNames,
          startDate: startDate,
          endDate: endDate
        },
        type: sequelize.QueryTypes.SELECT
      });

      // 2. Tickets CERRADOS en el mes (resueltos + cerrados)
      const closedInMonth = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM ost_ticket t
        INNER JOIN ost_department d ON t.dept_id = d.id
        INNER JOIN ost_ticket_status s ON t.status_id = s.id
        WHERE d.name IN (:allowedDepts)
          AND t.closed BETWEEN :startDate AND :endDate
          AND s.state IN ('closed', 'resolved')
      `, {
        replacements: { 
          allowedDepts: allowedDepartmentNames,
          startDate: startDate,
          endDate: endDate
        },
        type: sequelize.QueryTypes.SELECT
      });

      // 3. Tickets PENDIENTES al final del mes (creados antes o durante el mes, pero no cerrados)
      const pendingAtEndOfMonth = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM ost_ticket t
        INNER JOIN ost_department d ON t.dept_id = d.id
        INNER JOIN ost_ticket_status s ON t.status_id = s.id
        WHERE d.name IN (:allowedDepts)
          AND t.created <= :endDate
          AND (t.closed IS NULL OR t.closed > :endDate)
          AND s.state = 'open'
      `, {
        replacements: { 
          allowedDepts: allowedDepartmentNames,
          endDate: endDate
        },
        type: sequelize.QueryTypes.SELECT
      });

      return {
        created: parseInt(createdInMonth[0].count, 10),
        closed: parseInt(closedInMonth[0].count, 10),
        pending: parseInt(pendingAtEndOfMonth[0].count, 10)
      };
    };

    // Obtener datos para ambos meses en paralelo (antes era secuencial)
    const [month1Data, month2Data] = await Promise.all([
      getMonthFlowData(year1, month1),
      getMonthFlowData(year2, month2)
    ]);

    // Calcular tickets pendientes que pasaron entre meses
    // Para esto necesitamos los tickets que estaban pendientes al final del mes1 
    // y siguen pendientes al inicio del mes2
    const month1EndDate = new Date(year1, month1, 0, 23, 59, 59);
    const month2StartDate = new Date(year2, month2 - 1, 1);
    
    let ticketFlow = 0;
    if (month2StartDate > month1EndDate) {
      // Tickets que estaban abiertos al final del mes1 y siguen abiertos al inicio del mes2
      const flowQuery = await sequelize.query(`
        SELECT COUNT(*) as count
        FROM ost_ticket t
        INNER JOIN ost_department d ON t.dept_id = d.id
        INNER JOIN ost_ticket_status s ON t.status_id = s.id
        WHERE d.name IN (:allowedDepts)
          AND t.created <= :month1End
          AND (t.closed IS NULL OR t.closed >= :month2Start)
          AND s.state = 'open'
      `, {
        replacements: { 
          allowedDepts: allowedDepartmentNames,
          month1End: month1EndDate,
          month2Start: month2StartDate
        },
        type: sequelize.QueryTypes.SELECT
      });
      ticketFlow = parseInt(flowQuery[0].count, 10);
    }

    // Formatear respuesta para el gráfico
    const comparisonData = [
      {
        category: 'Creados',
        [`${getMonthName(month1)} ${year1}`]: month1Data.created,
        [`${getMonthName(month2)} ${year2}`]: month2Data.created
      },
      {
        category: 'Cerrados',
        [`${getMonthName(month1)} ${year1}`]: month1Data.closed,
        [`${getMonthName(month2)} ${year2}`]: month2Data.closed
      },
      {
        category: 'Pendientes al Final',
        [`${getMonthName(month1)} ${year1}`]: month1Data.pending,
        [`${getMonthName(month2)} ${year2}`]: month2Data.pending
      }
    ];

    // Agregar información del flujo si aplica
    const responseData = {
      comparison: comparisonData,
      flow: {
        ticketsCarriedOver: ticketFlow,
        description: `Tickets que pasaron de ${getMonthName(month1)} ${year1} a ${getMonthName(month2)} ${year2}`
      }
    };

    logger.info(`📊 Análisis de flujo mensual generado: ${month1}/${year1} vs ${month2}/${year2}`);
    res.json(responseData);

  } catch (error) {
    logger.error('❌ Error en análisis de flujo mensual:', error);
    next(error);
  }
});

// Helper function para nombres de meses en español
function getMonthName(monthNumber) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthNumber - 1];
}

/**
 * GET /api/stats/tickets-by-request-type
 * Devuelve un conteo de tickets agrupados por TPSolicitud (Tipo de Solicitud).
 * Campo personalizado tipo lista asignado por el agente.
 * Disponible a partir de marzo 2026.
 */
router.get('/tickets-by-request-type', async (req, res, next) => {
  const { year, month } = req.query;

  try {
    // Paso 1: Buscar el field_id de TPSolicitud
    let fieldRows;
    try {
      fieldRows = await sequelize.query(
        "SELECT `id` AS field_id, `name`, `label`, `type` FROM `ost_form_field` WHERE `name` LIKE '%tpsolicitud%' OR `name` LIKE '%TPSolicitud%' OR `label` LIKE '%TPSolicitud%' OR `label` LIKE '%Tipo de Solicitud%' OR `label` LIKE '%tipo solicitud%' LIMIT 1",
        { type: sequelize.QueryTypes.SELECT }
      );
    } catch (e1) {
      logger.error('TPSolicitud paso 1 error:', e1.original?.sqlMessage || e1.message);
      return res.json([]);
    }

    const fieldInfo = fieldRows && fieldRows.length > 0 ? fieldRows[0] : null;
    if (!fieldInfo) {
      logger.warn('TPSolicitud: Campo no encontrado en ost_form_field');
      return res.json([]);
    }

    logger.info(`TPSolicitud: field_id=${fieldInfo.field_id}, name=${fieldInfo.name}, type=${fieldInfo.type}`);

    // Paso 2: Construir filtro de fecha
    let dateFilter = '';
    const replacements = { fieldId: fieldInfo.field_id };
    if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59);
      dateFilter = 'AND t.created BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    // Paso 3: Obtener valores agrupados (raw values, parseamos JSON después)
    const dataQuery = "SELECT fev.`value` AS raw_val, COUNT(*) AS cnt" +
      " FROM ost_form_entry_values fev" +
      " INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id" +
      " INNER JOIN ost_ticket t ON fe.object_id = t.ticket_id" +
      " INNER JOIN ost_department d ON t.dept_id = d.id" +
      " WHERE fe.object_type = 'T'" +
      "   AND fev.field_id = :fieldId" +
      "   AND fev.`value` IS NOT NULL AND fev.`value` != ''" +
      "   AND d.`name` IN ('Soporte Informatico', 'Soporte IT')" +
      "   " + dateFilter +
      " GROUP BY fev.`value`" +
      " ORDER BY cnt DESC";

    const rows = await sequelize.query(dataQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Parsear valores: pueden ser JSON {"id":"nombre"} o texto plano
    const parseValue = (raw) => {
      if (!raw) return 'Sin Especificar';
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          const vals = Object.values(parsed);
          return vals.length > 0 ? String(vals[0]) : 'Sin Especificar';
        }
        return String(parsed);
      } catch (e) {
        return String(raw);
      }
    };

    // Agrupar por nombre parseado (varios JSON pueden mapear al mismo nombre)
    const grouped = {};
    for (const r of rows) {
      const name = parseValue(r.raw_val);
      grouped[name] = (grouped[name] || 0) + Number(r.cnt);
    }

    const result = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    logger.info(`TPSolicitud: ${result.length} categorías encontradas`);
    res.json(result);

  } catch (error) {
    logger.error('TPSolicitud error:', error.original?.sqlMessage || error.message);
    next(error);
  }
});

module.exports = router;