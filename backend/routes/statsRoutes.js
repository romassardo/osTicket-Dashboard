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

/**
 * GET /api/stats/tickets-by-organization
 * Devuelve un conteo de tickets agrupados por organización.
 * Parámetros: year, month, debug, fieldId, explore
 */
router.get('/tickets-by-organization', async (req, res, next) => {
  const { year, month, debug, fieldId, explore } = req.query;

  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Si se pide explore, mostrar todos los campos con datos
    if (explore === 'true') {
      const fieldsWithData = await sequelize.query(`
        SELECT
          fev.field_id,
          ff.label,
          ff.name,
          fev.value,
          COUNT(*) as count
        FROM ost_form_entry_values fev
        INNER JOIN ost_form_field ff ON fev.field_id = ff.field_id
        INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
        INNER JOIN ost_ticket t ON fe.object_id = t.ticket_id
        INNER JOIN ost_department d ON t.dept_id = d.id
        WHERE fe.object_type = 'T'
          AND d.name IN (:allowedDepts)
          AND fev.value IS NOT NULL
          AND fev.value != ''
          AND LENGTH(fev.value) > 2
        GROUP BY fev.field_id, ff.label, ff.name, fev.value
        HAVING count > 10
        ORDER BY fev.field_id, count DESC
        LIMIT 50
      `, {
        replacements: { allowedDepts: allowedDepartmentNames },
        type: sequelize.QueryTypes.SELECT
      });

      return res.json({
        explore: true,
        fieldsWithData,
        message: "Buscar field_id y values que contengan empresas (ej: 'Empresa X', 'Corp Y') vs sucursales ('Pacheco', 'Romero')"
      });
    }

    // Si se pide debug, devolver información de debugging
    if (debug === 'true') {
      // Ver todos los campos de formulario disponibles que podrían contener empresas
      const allFields = await sequelize.query(`
        SELECT field_id, form_id, type, label, name, hint
        FROM ost_form_field
        WHERE (label LIKE '%empresa%' OR label LIKE '%Empresa%'
            OR label LIKE '%compañ%' OR label LIKE '%organiz%'
            OR name LIKE '%empresa%' OR name LIKE '%company%')
        ORDER BY field_id
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Ver valores de muestra de field_id = 36 (actual)
      const field36Sample = await sequelize.query(`
        SELECT
          fev.value,
          COUNT(*) as count
        FROM ost_form_entry_values fev
        INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
        WHERE fe.object_type = 'T'
          AND fev.field_id = 36
          AND fev.value IS NOT NULL
        GROUP BY fev.value
        ORDER BY count DESC
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      // Ver otros campos que podrían ser empresas
      const otherFields = await sequelize.query(`
        SELECT
          fev.field_id,
          ff.label,
          fev.value,
          COUNT(*) as count
        FROM ost_form_entry_values fev
        INNER JOIN ost_form_field ff ON fev.field_id = ff.field_id
        INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
        WHERE fe.object_type = 'T'
          AND fev.field_id != 36
          AND fev.value IS NOT NULL
          AND fev.value != ''
          AND ff.type IN ('text', 'list', 'choices')
        GROUP BY fev.field_id, ff.label, fev.value
        HAVING count > 20
        ORDER BY fev.field_id, count DESC
        LIMIT 30
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      return res.json({
        debug: true,
        allFields,
        field36Sample,
        otherFields,
        message: "Buscar field_id que contenga empresas reales (no sucursales como Pacheco)"
      });
    }

    // Permitir probar diferentes field_id
    const targetFieldId = fieldId ? parseInt(fieldId, 10) : 36;

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
 * DEBUGGING: Endpoint temporal para investigar el problema de organizaciones
 */
router.get('/debug-organizations', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    // 1. Ver cuántos tickets hay en total de los departamentos permitidos
    const totalTickets = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM ost_ticket t
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN (:allowedDepts)
    `, {
      replacements: { allowedDepts: allowedDepartmentNames },
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Ver cuántos usuarios únicos están en esos tickets
    const uniqueUsers = await sequelize.query(`
      SELECT COUNT(DISTINCT t.user_id) as unique_users
      FROM ost_ticket t
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN (:allowedDepts)
    `, {
      replacements: { allowedDepts: allowedDepartmentNames },
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Ver muestra de usuarios de tickets con sus org_id
    const userSample = await sequelize.query(`
      SELECT DISTINCT t.user_id, u.name as user_name, u.org_id
      FROM ost_ticket t
      INNER JOIN ost_user u ON t.user_id = u.id
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN (:allowedDepts)
      LIMIT 10
    `, {
      replacements: { allowedDepts: allowedDepartmentNames },
      type: sequelize.QueryTypes.SELECT
    });

    // 4. Ver distribución de org_id en tickets de soporte IT
    const orgDistribution = await sequelize.query(`
      SELECT
        u.org_id,
        COUNT(*) as ticket_count
      FROM ost_ticket t
      INNER JOIN ost_user u ON t.user_id = u.id
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN (:allowedDepts)
      GROUP BY u.org_id
      ORDER BY ticket_count DESC
      LIMIT 10
    `, {
      replacements: { allowedDepts: allowedDepartmentNames },
      type: sequelize.QueryTypes.SELECT
    });

    // 5. Ver organizaciones reales que existen
    const allOrgs = await sequelize.query(`
      SELECT id, name FROM ost_organization ORDER BY name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      debug: {
        totalTickets: totalTickets[0].total,
        uniqueUsers: uniqueUsers[0].unique_users,
        userSample,
        orgDistribution,
        allOrganizations: allOrgs,
        message: "Revisar si org_id de users coincide con id de organizations"
      }
    });

  } catch (error) {
    logger.error('❌ Error en debug organizaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DEBUGGING: Investigar campos custom disponibles
 */
router.get('/debug-fields', async (req, res, next) => {
  try {
    // 1. Ver todos los campos de formulario disponibles
    const allFields = await sequelize.query(`
      SELECT field_id, form_id, type, label, name, hint, configuration
      FROM ost_form_field
      WHERE type IN ('text', 'memo', 'list', 'choices')
      ORDER BY field_id
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Ver valores de muestra de algunos tickets recientes
    const sampleValues = await sequelize.query(`
      SELECT
        fev.field_id,
        ff.label,
        ff.name,
        fev.value,
        COUNT(*) as value_count
      FROM ost_form_entry_values fev
      INNER JOIN ost_form_field ff ON fev.field_id = ff.field_id
      INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
      WHERE fe.object_type = 'T'
        AND fev.value IS NOT NULL
        AND fev.value != ''
        AND ff.type IN ('text', 'list', 'choices')
      GROUP BY fev.field_id, ff.label, ff.name, fev.value
      HAVING value_count > 5
      ORDER BY fev.field_id, value_count DESC
      LIMIT 50
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Ver valores específicos de field_id = 36 (que estamos usando actualmente)
    const field36Values = await sequelize.query(`
      SELECT
        fev.value,
        COUNT(*) as count
      FROM ost_form_entry_values fev
      INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
      WHERE fe.object_type = 'T'
        AND fev.field_id = 36
        AND fev.value IS NOT NULL
      GROUP BY fev.value
      ORDER BY count DESC
      LIMIT 20
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      debug: true,
      allFields,
      sampleValues,
      field36Values,
      message: "Buscar campo que contenga empresas (no sucursales)"
    });

  } catch (error) {
    logger.error('❌ Error en debug fields:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 