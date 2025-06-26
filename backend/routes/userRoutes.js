// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { User, Ticket, Department, TicketStatus, Staff, sequelize } = require('../models');
const { Op } = require('sequelize');

// GET all users related to allowed departments
router.get('/', async (req, res) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Obtenemos usuarios que tienen tickets en los departamentos permitidos
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'created'],
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
      group: ['User.id'],
      order: [['name', 'ASC']]
    });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si el usuario tiene tickets en departamentos permitidos
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'created'],
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
    
    if (user) {
      res.json(user);
    } else {
      next({ statusCode: 404, message: `Usuario no encontrado o no tiene tickets en los departamentos permitidos: ${userId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

// GET tickets for a specific user
router.get('/:id/tickets', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si el usuario existe y tiene tickets en departamentos permitidos
    const userExists = await User.findOne({
      attributes: ['id', 'name', 'email'],
      where: { id: userId },
      include: [{
        model: Ticket,
        required: true,
        include: [{
          model: Department,
          as: 'department',
          where: {
            name: {
              [Op.or]: allowedDepartmentNames
            }
          },
          required: true
        }]
      }]
    });
    
    if (!userExists) {
      return next({ statusCode: 404, message: `Usuario no encontrado o no tiene tickets en los departamentos permitidos: ${userId}`, isCustomError: true });
    }
    
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Obtenemos los tickets del usuario con paginación
    const result = await Ticket.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Department,
          as: 'department',
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
        }
      ],
      order: [['created', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      user: {
        id: userExists.id,
        name: userExists.name,
        email: userExists.email
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