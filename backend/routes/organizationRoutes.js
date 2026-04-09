// backend/routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { Organization, User, Ticket, Department, TicketStatus, Staff, TicketCdata, HelpTopic, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Cache del field_id del campo 'sector' en los formularios custom de osTicket
let _cachedSectorFieldId = null;
async function getSectorFieldId() {
  if (_cachedSectorFieldId !== null) return _cachedSectorFieldId;
  const rows = await sequelize.query(
    "SELECT id FROM ost_form_field WHERE name = 'sector' AND form_id = 2 LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  _cachedSectorFieldId = rows.length > 0 ? rows[0].id : null;
  return _cachedSectorFieldId;
}

// GET a simplified list of all organizations for filter controls
router.get('/simple', async (req, res, next) => {
  try {
    const sectorFieldId = await getSectorFieldId();

    if (!sectorFieldId) {
      logger.info('No se encontró el campo de formulario para "sector".');
      return res.json([]);
    }

    const sectorValues = await sequelize.query(
      `SELECT DISTINCT value FROM ost_form_entry_values WHERE field_id = :sectorFieldId`,
      {
        replacements: { sectorFieldId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const organizations = sectorValues.map(item => {
      try {
        if (!item.value || typeof item.value !== 'string') return null;
        const parsed = JSON.parse(item.value);
        const id = Object.keys(parsed)[0];
        const name = parsed[id];
        return { id, name };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    organizations.sort((a, b) => a.name.localeCompare(b.name));
    res.json(organizations);
  } catch (error) {
    next(error);
  }
});

// GET all organizations related to allowed departments
router.get('/', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endOfMonth   = `${year}-${String(month).padStart(2, '0')}-31 23:59:59`;

    const sectorFieldId = await getSectorFieldId();

    const ticketsByOrg = await sequelize.query(`
      SELECT
        MIN(t.ticket_id)               AS id,
        fev.value                      AS org_name,
        COUNT(t.ticket_id)             AS ticket_count
      FROM ost_form_entry fe
      JOIN ost_form_entry_values fev ON fev.entry_id = fe.id AND fev.field_id = :sectorFieldId
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
        sectorFieldId: sectorFieldId || 0,
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
          return Object.values(parsed)[0] || org.org_name;
        } catch (e) {
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

    const organization = await Organization.findByPk(orgId, { attributes: ['id', 'name'] });

    if (!organization) {
      return next({ statusCode: 404, message: `Organización no encontrada: ${orgId}`, isCustomError: true });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endOfMonth   = `${year}-${String(month).padStart(2, '0')}-31 23:59:59`;

    const dateFilter = {
      created: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    };

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
          required: false
        },
        {
          model: HelpTopic,
          attributes: ['topic_id', 'topic', 'isactive'],
          required: false
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
