// backend/routes/statusRoutes.js
const express = require('express');
const router = express.Router();
const { TicketStatus, Ticket, Department, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET a simplified list of all statuses for filter controls
router.get('/simple', async (req, res, next) => {
  try {
    const statuses = await TicketStatus.findAll({
      attributes: ['id', 'name', 'state'],
      order: [['name', 'ASC']]
    });
    res.json(statuses);
  } catch (error) {
    next(error);
  }
});

// GET all ticket statuses related to allowed departments
router.get('/', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Obtenemos todos los estados de tickets utilizados en los departamentos permitidos
    const statuses = await TicketStatus.findAll({
      attributes: [
        'id', 
        'name', 
        'state',
        'created',
        'updated',
        [sequelize.fn('COUNT', sequelize.col('Tickets.ticket_id')), 'ticketCount']
      ],
      include: [{
        model: Ticket,
        attributes: [],
        required: true,
        include: [{
          model: Department,
          as: 'department',
          attributes: [],
          where: {
            name: {
              [Op.or]: allowedDepartmentNames
            }
          },
          required: true
        }]
      }],
      group: ['TicketStatus.id'],
      order: [['name', 'ASC']]
    });
    
    res.json(statuses);
  } catch (error) {
    next(error);
  }
});

// GET a single ticket status by ID
router.get('/:id', async (req, res, next) => {
  try {
    const statusId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si el estado de ticket existe y tiene tickets en los departamentos permitidos
    const status = await TicketStatus.findOne({
      where: { id: statusId },
      attributes: ['id', 'name', 'state', 'created', 'updated'],
      include: [{
        model: Ticket,
        attributes: [],
        required: true,
        include: [{
          model: Department,
          as: 'department',
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
    
    if (status) {
      res.json(status);
    } else {
      next({ statusCode: 404, message: `Estado de ticket no encontrado o no tiene tickets en los departamentos permitidos: ${statusId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;