// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const { Staff, Ticket, Department, User, TicketStatus, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

// GET a simplified list of all staff members for filter controls
router.get('/simple', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    const staff = await Staff.findAll({
      attributes: [
        'staff_id',
        [fn('CONCAT', col('firstname'), ' ', col('lastname')), 'fullname']
      ],
      include: [{
        model: Department,
        as: 'department',
        where: {
          name: {
            [Op.in]: allowedDepartmentNames
          }
        },
        attributes: [],
        required: true
      }],
      where: {
        isactive: 1
      },
      order: [['firstname', 'ASC'], ['lastname', 'ASC']]
    });
    res.json(staff);
  } catch (error) {
    next(error);
  }
});

// GET all staff members related to allowed departments
router.get('/', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Obtenemos personal que está asignado a los departamentos permitidos
    const staffMembers = await Staff.findAll({
      attributes: ['staff_id', 'firstname', 'lastname', 'email', 'isactive', 'created'],
      include: [{
        model: Department,
        as: 'department',
        where: {
          name: {
            [Op.in]: allowedDepartmentNames
          }
        },
        attributes: ['id', 'name']
      }],
      order: [['firstname', 'ASC'], ['lastname', 'ASC']]
    });
    
    res.json(staffMembers);
  } catch (error) {
    next(error);
  }
});

// GET a single staff member by ID
router.get('/:id', async (req, res) => {
  try {
    const staffId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    const staffMember = await Staff.findByPk(staffId, {
      attributes: ['staff_id', 'firstname', 'lastname', 'email', 'isactive', 'created'],
      include: [{
        model: Department,
        as: 'department',
        where: {
          name: {
            [Op.in]: allowedDepartmentNames
          }
        },
        attributes: ['id', 'name']
      }]
    });
    
    if (staffMember) {
      res.json(staffMember);
    } else {
      next({ statusCode: 404, message: `Miembro del personal no encontrado o no pertenece a los departamentos permitidos: ${staffId}`, isCustomError: true });
    }
  } catch (error) {
    next(error);
  }
});

// GET tickets assigned to a specific staff member
router.get('/:id/tickets', async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Verificamos si el miembro del personal existe y pertenece a departamentos permitidos
    const staffMember = await Staff.findByPk(staffId, {
      attributes: ['staff_id', 'firstname', 'lastname', 'email'],
      include: [{
        model: Department,
        as: 'department',
        where: {
          name: {
            [Op.in]: allowedDepartmentNames
          }
        }
      }]
    });
    
    if (!staffMember) {
      return next({ statusCode: 404, message: `Miembro del personal no encontrado o no pertenece a los departamentos permitidos: ${staffId}`, isCustomError: true });
    }
    
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtro temporal para solo mostrar tickets del mes actual (junio 2025)
    const year = parseInt(req.query.year) || 2025;
    const month = parseInt(req.query.month) || 6;
    
    const startOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    const dateFilter = {
      staff_id: staffId,
      created: {
        [Op.between]: [startOfMonth, endOfMonth]
      }
    };

    // Obtenemos los tickets asignados al miembro del personal con paginación y filtro temporal
    const result = await Ticket.findAndCountAll({
      where: dateFilter,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Department,
        as: 'department',
          attributes: ['id', 'name'],
          where: {
            name: {
              [Op.in]: allowedDepartmentNames
            }
          },
          required: true
        },
        {
          model: TicketStatus,
          as: 'status',
          attributes: ['id', 'name', 'state']
        }
      ],
      order: [['created', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      staff: {
        id: staffMember.staff_id,
        firstname: staffMember.firstname,
        lastname: staffMember.lastname,
        email: staffMember.email
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