// backend/routes/helpTopicRoutes.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { HelpTopic, Department, TicketPriority, Staff, Ticket, TicketCdata, TicketStatus } = require('../models');

// Middleware para filtrar por departamento "Soporte Informatico" o "Soporte IT"
const filterByAllowedDepartments = async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Obtener IDs de departamentos permitidos
    const allowedDepartments = await Department.findAll({
      where: {
        name: {
          [Op.in]: allowedDepartmentNames
        }
      },
      attributes: ['id']
    });

    const allowedDeptIds = allowedDepartments.map(dept => dept.id);
    
    // Guardar los IDs de departamentos permitidos para usar en las rutas
    req.allowedDeptIds = allowedDeptIds;
    next();
  } catch (error) {
    next(error);
  }
};

// Aplicar el middleware a todas las rutas
router.use(filterByAllowedDepartments);

// GET - Obtener todos los temas de ayuda (filtrando por departamentos permitidos)
router.get('/', async (req, res) => {
  try {
    const helpTopics = await HelpTopic.findAll({
      attributes: ['topic_id', 'topic', 'isactive', 'dept_id'],
      where: {
        dept_id: {
          [Op.in]: req.allowedDeptIds
        },
        isactive: 1 // Solo temas activos
      },
      include: [
        {
          model: Department,
          attributes: ['id', 'name', 'email']
        },
        {
          model: TicketPriority,
          attributes: ['priority_id', 'priority', 'priority_desc']
        },
        {
          model: Staff,
          as: 'ApprovedStaff',
          attributes: ['staff_id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [['sort', 'ASC']]
    });

    res.json(helpTopics);
  } catch (error) {
    next(error);
  }
});

// GET - Obtener un tema de ayuda específico por ID
router.get('/:id', async (req, res) => {
  try {
    const helpTopic = await HelpTopic.findOne({
      attributes: ['topic_id', 'topic', 'isactive', 'dept_id', 'priority_id', 'notes', 'created', 'updated'],
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds
        }
      },
      include: [
        {
          model: Department,
          attributes: ['id', 'name', 'email']
        },
        {
          model: TicketPriority,
          attributes: ['priority_id', 'priority', 'priority_desc']
        },
        {
          model: Staff,
          as: 'ApprovedStaff',
          attributes: ['staff_id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!helpTopic) {
      return next({ statusCode: 404, message: 'Tema de ayuda no encontrado o no pertenece a un departamento permitido', isCustomError: true });
    }

    res.json(helpTopic);
  } catch (error) {
    next(error);
  }
});

// GET - Obtener tickets asociados a un tema de ayuda específico
router.get('/:id/tickets', async (req, res) => {
  try {
    // Primero verificamos que el tema de ayuda pertenece a un departamento permitido
    const helpTopic = await HelpTopic.findOne({
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds
        }
      }
    });

    if (!helpTopic) {
      return next({ statusCode: 404, message: 'Tema de ayuda no encontrado o no pertenece a un departamento permitido', isCustomError: true });
    }

    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Obtenemos los tickets asociados con este tema de ayuda y aplicamos paginación
    const result = await Ticket.findAndCountAll({
      attributes: ['ticket_id', 'number', 'user_id', 'status_id', 'topic_id', 'source', 'isoverdue', 'isanswered', 'duedate', 'closed', 'created', 'updated'],
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds  // Filtrado adicional por departamentos permitidos
        }
      },
      include: [
        { 
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: TicketPriority,
          attributes: ['priority_id', 'priority', 'priority_desc']
        },
        {
          model: Staff,
          as: 'AssignedStaff',
          attributes: ['staff_id', 'firstname', 'lastname', 'email']
        },
        {
          model: HelpTopic,
          attributes: ['topic_id', 'topic']
        },
        {
          model: TicketCdata,
          as: 'cdata',
          attributes: ['subject'],
          required: false
        }
      ],
      order: [['created', 'DESC']],
      limit: limit,
      offset: offset
    });

    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: result.rows,
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

// GET - Contar tickets por tema de ayuda
router.get('/:id/tickets/count', async (req, res) => {
  try {
    // Verificar que el tema pertenece a un departamento permitido
    const helpTopic = await HelpTopic.findOne({
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds
        }
      }
    });

    if (!helpTopic) {
      return next({ statusCode: 404, message: 'Tema de ayuda no encontrado o no pertenece a un departamento permitido', isCustomError: true });
    }

    // Contar tickets por estado para este tema
    const ticketsByStatus = await Ticket.findAll({
      attributes: [
        'status_id',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('ticket_id')), 'count']
      ],
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds
        }
      },
      include: [{
        model: TicketStatus,
        as: 'status',
        attributes: ['name', 'state']
      }],
      group: ['status_id']
    });

    // Contar el total de tickets
    const totalTickets = await Ticket.count({
      where: {
        topic_id: req.params.id,
        dept_id: {
          [Op.in]: req.allowedDeptIds
        }
      }
    });

    res.json({
      topic_id: parseInt(req.params.id),
      topic: helpTopic.topic,
      total_tickets: totalTickets,
      tickets_by_status: ticketsByStatus
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;