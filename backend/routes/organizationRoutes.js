// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { Organization, User, Ticket, Department, TicketStatus, Staff, TicketCdata, HelpTopic, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// GET a simplified list of all organizations for filter controls
router.get('/simple', async (req, res, next) => {
  try {
    // 1. Encontrar el ID del campo 'sector' que está en el formulario de ticket (id=2)
    const sectorField = await sequelize.query(
      "SELECT id FROM ost_form_field WHERE name = 'sector' AND form_id = 2 LIMIT 1",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!sectorField || sectorField.length === 0) {
      logger.info('No se encontró el campo de formulario para "sector".');
      return res.json([]);
    }

    const sectorFieldId = sectorField[0].id;

    // 2. Obtener todos los valores únicos para ese campo
    const sectorValues = await sequelize.query(
      `SELECT DISTINCT value FROM ost_form_entry_values WHERE field_id = :sectorFieldId`,
      {
        replacements: { sectorFieldId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // 3. Parsear los valores, que están guardados como JSON
    const organizations = sectorValues.map(item => {
      try {
        if (!item.value || typeof item.value !== 'string') return null;
        const parsed = JSON.parse(item.value);
        const id = Object.keys(parsed)[0];
        const name = parsed[id];
        // Devolvemos un objeto con formato { id, name } para que coincida con lo que el frontend espera
        return { id, name };
      } catch (e) {
        // Si el valor no es un JSON válido, lo ignoramos
        return null;
      }
    }).filter(Boolean); // Elimina cualquier resultado nulo

    // 4. Ordenar alfabéticamente por nombre
    organizations.sort((a, b) => a.name.localeCompare(b.name));

    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

// EXPLORAR CAMPOS CUSTOM ESPECÍFICOS - Encontrar Empresa y Sector
router.get('/custom-fields', async (req, res, next) => {
  try {
    logger.info('=== BUSCANDO CAMPOS EMPRESA Y SECTOR ===');
    
    // 1. Ver datos custom de tickets (donde pueden estar Empresa y Sector)
    const ticketCustomSample = await sequelize.query(`
      SELECT * FROM ost_ticket__cdata 
      WHERE ticket_id IN (
        SELECT ticket_id FROM ost_ticket 
        WHERE created BETWEEN '2025-06-01' AND '2025-06-30'
        LIMIT 10
      )
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 2. Ver estructura de campos de formulario
    const formFields = await sequelize.query(`
      SELECT field_id, form_id, type, label, name, hint, configuration
      FROM ost_form_field 
      WHERE label LIKE '%empresa%' 
        OR label LIKE '%Empresa%'
        OR label LIKE '%sector%' 
        OR label LIKE '%Sector%'
        OR label LIKE '%sucursal%' 
        OR label LIKE '%Sucursal%'
        OR label LIKE '%localidad%'
        OR label LIKE '%Localidad%'
        OR name LIKE '%empresa%'
        OR name LIKE '%sector%'
        OR name LIKE '%sucursal%'
        OR name LIKE '%localidad%'
      LIMIT 20
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 3. Ver valores de formularios custom de tickets recientes
    const formValues = await sequelize.query(`
      SELECT fev.*, ff.label, ff.name as field_name
      FROM ost_form_entry_values fev
      INNER JOIN ost_form_field ff ON fev.field_id = ff.field_id
      INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
      WHERE fe.object_type = 'T'
        AND fe.object_id IN (
          SELECT ticket_id FROM ost_ticket 
          WHERE created BETWEEN '2025-06-01' AND '2025-06-30'
          LIMIT 10
        )
        AND (ff.label LIKE '%empresa%' 
          OR ff.label LIKE '%Empresa%'
          OR ff.label LIKE '%sector%' 
          OR ff.label LIKE '%Sector%'
          OR ff.label LIKE '%sucursal%' 
          OR ff.label LIKE '%Sucursal%'
          OR ff.label LIKE '%localidad%'
          OR ff.label LIKE '%Localidad%')
      LIMIT 20
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 4. Intentar obtener TODOS los campos custom disponibles
    const allFormFields = await sequelize.query(`
      SELECT field_id, form_id, type, label, name, hint 
      FROM ost_form_field 
      WHERE type IN ('text', 'memo', 'list', 'choices')
      ORDER BY label
      LIMIT 30
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    res.json({
      status: 'success',
      ticketCustomSample,
      formFields,
      formValues,
      allFormFields,
      message: 'Buscar campos Empresa y Localidad/Sucursal/Sector en estos datos'
    });
    
  } catch (error) {
    logger.error('Error explorando custom fields:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXPLORAR HELP TOPICS Y CUSTOM FIELDS - Segundo endpoint de exploración
router.get('/explore-topics', async (req, res, next) => {
  try {
    logger.info('=== EXPLORANDO HELP TOPICS Y CUSTOM FIELDS ===');
    
    // 1. Ver todos los Help Topics disponibles (pueden contener sectores)
    const helpTopics = await sequelize.query(`
      SELECT topic_id, topic, notes, dept_id, isactive
      FROM ost_help_topic 
      WHERE isactive = 1
      ORDER BY topic
    `, { type: sequelize.QueryTypes.SELECT });
    
    // 2. Ver datos custom de usuarios (puede contener sector/sucursal)
    const userCustomData = await sequelize.query(`
      SELECT * FROM ost_user__cdata LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 3. Ver datos custom de tickets
    const ticketCustomData = await sequelize.query(`
      SELECT * FROM ost_ticket__cdata LIMIT 10  
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 4. Ver campos de formularios que pueden tener sectores
    const formFields = await sequelize.query(`
      SELECT field_id, form_id, type, label, name, hint, configuration
      FROM ost_form_field 
      WHERE label LIKE '%sector%' 
        OR label LIKE '%sucursal%' 
        OR label LIKE '%ubicacion%'
        OR label LIKE '%localidad%'
        OR label LIKE '%area%'
        OR label LIKE '%zona%'
        OR name LIKE '%sector%'
        OR name LIKE '%sucursal%'
      LIMIT 20
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 5. Agrupar tickets por Help Topic para ver si ahí están los sectores
    const ticketsByTopic = await sequelize.query(`
      SELECT 
        ht.topic_id,
        ht.topic,
        COUNT(t.ticket_id) as ticket_count
      FROM ost_ticket t
      INNER JOIN ost_help_topic ht ON t.topic_id = ht.topic_id
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN ('Soporte Informatico', 'Soporte IT')
        AND t.created BETWEEN '2025-06-01' AND '2025-06-30'
      GROUP BY ht.topic_id, ht.topic
      ORDER BY ticket_count DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    res.json({
      status: 'success',
      helpTopics,
      userCustomData,
      ticketCustomData,
      formFields,
      ticketsByTopic,
      message: 'Buscar información real de sectores en estos datos'
    });
    
  } catch (error) {
    logger.error('Error explorando topics:', error);
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR SECTORES REALES - Endpoint completamente nuevo (DEBE IR PRIMERO)
router.get('/find-sectors', async (req, res, next) => {
  try {
    logger.info('=== BUSCANDO SECTORES REALES ===');
    
    // 1. Ver qué tablas existen en la base de datos
    const tables = await sequelize.query('SHOW TABLES', { type: sequelize.QueryTypes.SELECT });
    logger.info('Tablas encontradas:', tables.length);
    
    // 2. Buscar tablas con datos de formularios o campos custom
    const customTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('form') || tableName.includes('field') || tableName.includes('data') || tableName.includes('custom');
    });
    
    // 3. Explorar datos reales de tickets para ver si hay patrones
    const sampleTickets = await sequelize.query(`
      SELECT t.*, u.name as user_name, d.name as dept_name
      FROM ost_ticket t
      LEFT JOIN ost_user u ON t.user_id = u.id  
      LEFT JOIN ost_department d ON t.dept_id = d.id
      WHERE t.created >= '2025-06-01'
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    // 4. Ver datos completos de usuarios para encontrar campos de sector
    const userSample = await sequelize.query(`
      SELECT * FROM ost_user LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });
    
    res.json({
      status: 'success',
      totalTables: tables.length,
      customTables: customTables.map(t => Object.values(t)[0]),
      sampleTickets,
      userSample,
      message: 'Buscar campos con información de sector/sucursal en los datos mostrados'
    });
    
  } catch (error) {
    logger.error('Error buscando sectores:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG SIMPLE - Endpoint para ver estructura de tablas
router.get('/structure', async (req, res, next) => {
  try {
    // 1. Ver todas las tablas de la base de datos
    const allTables = await sequelize.query('SHOW TABLES', { type: sequelize.QueryTypes.SELECT });
    
    // 2. Buscar tablas que podrían contener información de localización
    const locationTables = await sequelize.query(`
      SHOW TABLES LIKE '%form%' 
      UNION 
      SHOW TABLES LIKE '%custom%'
      UNION
      SHOW TABLES LIKE '%field%'
      UNION
      SHOW TABLES LIKE '%data%'
      UNION
      SHOW TABLES LIKE '%entry%'
    `, { type: sequelize.QueryTypes.SELECT });
    
    // 3. Ver estructura completa de ticket para campos custom
    const ticketCols = await sequelize.query('SHOW COLUMNS FROM ost_ticket', { type: sequelize.QueryTypes.SELECT });
    
    // 4. Ver si hay datos en ost_form (formularios custom de osTicket)
    const formsData = await sequelize.query(`
      SELECT * FROM ost_form LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    // 5. Ver si hay campos custom en ost_form_field
    const formFields = await sequelize.query(`
      SELECT * FROM ost_form_field 
      WHERE label LIKE '%sector%' 
        OR label LIKE '%sucursal%' 
        OR label LIKE '%localidad%'
        OR label LIKE '%ubicacion%'
        OR label LIKE '%area%'
        OR label LIKE '%departamento%'
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT }).catch(() => []);
    
    res.json({
      allTables: allTables.slice(0, 20), // Primeras 20 tablas
      locationTables,
      ticketColumns: ticketCols,
      formsData,
      formFields
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// DEBUG - Endpoint para explorar campos de localización
router.get('/debug-location', async (req, res, next) => {
  try {
    // 1. Explorar estructura de tabla usuarios
    const userFields = await sequelize.query(`
      SHOW COLUMNS FROM ost_user
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 2. Explorar estructura de tabla organizaciones  
    const orgFields = await sequelize.query(`
      SHOW COLUMNS FROM ost_organization
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 3. Ver las primeras 3 filas de usuarios sin filtros
    const sampleUsers = await sequelize.query(`
      SELECT *
      FROM ost_user 
      LIMIT 3
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // 4. Ver las primeras 3 filas de organizaciones
    const sampleOrgs = await sequelize.query(`
      SELECT *
      FROM ost_organization 
      LIMIT 3
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      userFields,
      orgFields,
      sampleUsers,
      sampleOrgs
    });

  } catch (error) {
    logger.error('Debug location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG - Endpoint para probar organizaciones (DEBE IR PRIMERO)
router.get('/debug', async (req, res, next) => {
  try {
    // 1. Verificar todas las organizaciones que existen
    const allOrganizations = await Organization.findAll({
      attributes: ['id', 'name', 'created'],
      raw: true,
      limit: 10
    });

    // 2. Verificar usuarios con organizaciones
    const usersWithOrgs = await User.findAll({
      attributes: ['id', 'name', 'org_id'],
      where: {
        org_id: {
          [Op.not]: null
        }
      },
      limit: 10,
      raw: true
    });

    // 3. Contar tickets de junio 2025 por organización (simplificado)
    const june2025Start = new Date('2025-06-01T00:00:00.000Z');
    const june2025End = new Date('2025-06-30T23:59:59.999Z');

    const ticketsByOrg = await sequelize.query(`
      SELECT 
        o.id as org_id,
        o.name as org_name,
        COUNT(t.ticket_id) as ticket_count
      FROM ost_organization o
      LEFT JOIN ost_user u ON u.org_id = o.id
      LEFT JOIN ost_ticket t ON t.user_id = u.id
      WHERE t.created BETWEEN :startDate AND :endDate
      GROUP BY o.id, o.name
      HAVING COUNT(t.ticket_id) > 0
      ORDER BY ticket_count DESC
      LIMIT 10
    `, {
      replacements: { 
        startDate: june2025Start, 
        endDate: june2025End 
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      debug: {
        allOrganizations,
        usersWithOrgs,
        ticketsByOrg,
        dateRange: `${june2025Start.toISOString()} - ${june2025End.toISOString()}`
      }
    });

  } catch (error) {
    logger.error('Debug organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all organizations related to allowed departments
router.get('/', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Filtro temporal para solo mostrar tickets del mes actual (junio 2025)
    const year = parseInt(req.query.year) || 2025;
    const month = parseInt(req.query.month) || 6;
    
    // Fechas como cadenas sin zona horaria para evitar desfases
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endOfMonth   = `${year}-${String(month).padStart(2, '0')}-31 23:59:59`; // 31 funciona para cualquier mes, MySQL lo ajusta

    // Nuevo conteo por campo personalizado "Localidad / Sucursal / Sector" (field_id = 36)
    const ticketsByOrg = await sequelize.query(`
      SELECT 
        MIN(t.ticket_id)               AS id, -- identificador arbitrario para el frontend
        fev.value                      AS org_name,
        COUNT(t.ticket_id)             AS ticket_count
      FROM ost_form_entry fe
      JOIN ost_form_entry_values fev ON fev.entry_id = fe.id AND fev.field_id = 36
      JOIN ost_ticket t              ON t.ticket_id = fe.object_id
      JOIN ost_department d          ON d.id = t.dept_id
      WHERE d.name IN (:allowedDepts)
        AND t.created BETWEEN :startDate AND :endDate
      GROUP BY fev.value
      HAVING ticket_count > 0
      ORDER BY ticket_count DESC
      LIMIT 20
    `, {
      replacements: {
        allowedDepts: allowedDepartmentNames,
        startDate: startOfMonth,
        endDate: endOfMonth
      },
      type: sequelize.QueryTypes.SELECT
    });

    const formattedData = ticketsByOrg.map(org => ({
      id: org.id,
      name: (() => {
        try {
          const parsed = JSON.parse(org.org_name);
          // El valor es un objeto como {"57":"Mutual Asis 3..."}, extraemos el primer valor.
          return Object.values(parsed)[0] || org.org_name;
        } catch (e) {
          // Si no es JSON, es texto plano.
          return org.org_name;
        }
      })(),
      ticketCount: parseInt(org.ticket_count)
    }));

    res.json(formattedData);
  } catch (error) {
    logger.error('Error en organizaciones:', error);
    next(error);
  }
});

// GET a single organization by ID
router.get('/:id', async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    const organization = await Organization.findByPk(orgId, {
      attributes: ['id', 'name', 'created'],
      include: [{
        model: User,
        attributes: [],
        required: true,
        include: [{
          model: Ticket,
          attributes: [],
          required: true,
          include: [{
            model: Department,
            attributes: [],
            where: {
              name: {
                [Op.or]: allowedDepartmentNames
              }
            },
            required: true
          }]
        }]
      }]
    });
    
    if (organization) {
      res.json(organization);
    } else {
      next({ statusCode: 404, message: `Organización no encontrada o no tiene tickets en los departamentos permitidos: ${orgId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

// GET tickets for a specific organization
router.get('/:id/tickets', async (req, res, next) => {
  try {
    const orgId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si la organización existe
    const organization = await Organization.findByPk(orgId, { attributes: ['id', 'name'] });
    
    if (!organization) {
      return next({ statusCode: 404, message: `Organización no encontrada: ${orgId}`, isCustomError: true });
    }
    
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtro temporal para solo mostrar tickets del mes actual (junio 2025)
    const year = parseInt(req.query.year) || 2025;
    const month = parseInt(req.query.month) || 6;
    
    // Fechas como cadenas sin zona horaria para evitar desfases
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endOfMonth   = `${year}-${String(month).padStart(2, '0')}-31 23:59:59`; // 31 funciona para cualquier mes, MySQL lo ajusta
    
    const dateFilter = {
      created: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    };

    // Obtenemos los tickets de los usuarios de la organización con paginación y filtro temporal
    const result = await Ticket.findAndCountAll({
      attributes: ['ticket_id', 'number', 'user_id', 'status_id', 'dept_id', 'topic_id', 'source', 'isoverdue', 'isanswered', 'duedate', 'closed', 'created', 'updated'],
      where: dateFilter,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email'],
          where: { org_id: orgId },
          required: true
        },
        {
          model: Department,
          attributes: ['id', 'name'],
          where: {
            name: {
              [Op.or]: allowedDepartmentNames
            }
          },
          required: true
        },
        {
          model: TicketStatus,
          as: 'status',
          attributes: ['id', 'name', 'state']
        },
        {
          model: Staff,
          as: 'AssignedStaff',
          attributes: ['staff_id', 'firstname', 'lastname']
        },
        {
          model: TicketCdata,
          as: 'cdata',
          attributes: ['subject'],
          required: false // Left join
        },
        {
          model: HelpTopic,
          attributes: ['topic_id', 'topic', 'isactive'],
          required: false // Left join
        }
      ],
      order: [['created', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    if (result.rows.length === 0) {
      return next({ statusCode: 404, message: `No se encontraron tickets para la organización en los departamentos permitidos: ${orgId}`, isCustomError: true });
    }
    
    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      organization: {
        id: organization.id,
        name: organization.name
      },
      tickets: result.rows,
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        items_per_page: limit
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;