// backend/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const { Department, Ticket, User, TicketStatus, Staff, TicketCdata, HelpTopic, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET all departments
router.get('/', async (req, res) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    const departments = await Department.findAll({
      attributes: ['id', 'name'],
      where: {
        name: {
          [Op.or]: allowedDepartmentNames
        }
      }
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
});

// GET a single department by ID
router.get('/:id', async (req, res) => {
  try {
    const departmentId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    const department = await Department.findByPk(departmentId, {
      attributes: ['id', 'name', 'ispublic']
    });

    if (department && allowedDepartmentNames.includes(department.name)) {
      res.json(department);
    } else {
      // Si el departamento no existe o no es uno de los permitidos, devuelve 404.
      next({ statusCode: 404, message: `Department not found or not accessible with ID: ${departmentId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

// GET tickets for a specific department
router.get('/:id/tickets', async (req, res, next) => {
  try {
    const departmentId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Primero verificamos que el departamento exista y sea uno de los permitidos
    const department = await Department.findByPk(departmentId, { attributes: ['id', 'name'] });
    if (!department || !allowedDepartmentNames.includes(department.name)) {
      return next({ statusCode: 404, message: `Department not found or not accessible with ID: ${departmentId}`, isCustomError: true });
    }
    
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Si el departamento es válido, buscamos sus tickets con paginación
    const result = await Ticket.findAndCountAll({
      attributes: ['ticket_id', 'number', 'user_id', 'status_id', 'topic_id', 'source', 'isoverdue', 'isanswered', 'duedate', 'closed', 'created', 'updated'], // dept_id y staff_id se obtienen del contexto o joins
      include: [
        {
          model: User,
          attributes: ['id', 'name']
        },
        {
          model: TicketStatus,
          as: 'status',
          attributes: ['id', 'name', 'state']
        },
        {
          model: Department,
          attributes: ['id', 'name'],
          where: { id: departmentId },
          required: true
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
          model: HelpTopic, // Asegúrate que el modelo HelpTopic está importado
          attributes: ['topic_id', 'topic', 'isactive']
        }
      ],
      order: [
        ['created', 'DESC']
      ],
      limit: limit,
      offset: offset
    });
    
    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      department: {
        id: department.id,
        name: department.name
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