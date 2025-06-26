// backend/routes/priorityRoutes.js
const express = require('express');
const router = express.Router();
const { TicketPriority, Ticket, Department, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET all ticket priorities related to allowed departments
router.get('/', async (req, res) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Obtenemos todas las prioridades de tickets utilizadas en los departamentos permitidos
    const priorities = await TicketPriority.findAll({
      attributes: [
        'priority_id', 
        'priority', 
        'priority_desc',
        'priority_color',
        'priority_urgency',
        [sequelize.fn('COUNT', sequelize.col('Tickets.ticket_id')), 'ticketCount']
      ],
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
      }],
      group: ['TicketPriority.priority_id'],
      order: [['priority_urgency', 'DESC']]
    });
    
    res.json(priorities);
  } catch (error) {
    next(error);
  }
});

// GET a single ticket priority by ID
router.get('/:id', async (req, res) => {
  try {
    const priorityId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si la prioridad de ticket existe y tiene tickets en los departamentos permitidos
    const priority = await TicketPriority.findOne({
      where: { priority_id: priorityId },
      attributes: ['priority_id', 'priority', 'priority_desc', 'priority_color', 'priority_urgency'],
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
    });
    
    if (priority) {
      res.json(priority);
    } else {
      next({ statusCode: 404, message: `Prioridad de ticket no encontrada o no tiene tickets en los departamentos permitidos: ${priorityId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;