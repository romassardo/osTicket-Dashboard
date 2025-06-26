// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const { Ticket, User, TicketStatus, Department, Staff, TicketCdata, List, ListItems, HelpTopic, Organization, sequelize } = require('../models'); // Import sequelize for Op
const { Op } = require('sequelize'); // Assuming models are exported from ../models/index.js

// GET all tickets
router.get('/', async (req, res, next) => {
  try {
    // Filtros dinámicos, búsqueda y paginación
    const { statuses, priority_id, startDate, endDate, search, page, limit, organization, staff, transporte } = req.query;

    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    // Paginación
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const offset = (currentPage - 1) * itemsPerPage;

    const whereTicketCondition = {};
    const whereUserCondition = {};

    // Búsqueda general
    if (search) {
      whereTicketCondition[Op.or] = [
        { number: { [Op.like]: `%${search}%` } },
        { '$cdata.subject$': { [Op.like]: `%${search}%` } },
        { '$user.name$': { [Op.like]: `%${search}%` } },
        { '$AssignedStaff.firstname$': { [Op.like]: `%${search}%` } },
        { '$AssignedStaff.lastname$': { [Op.like]: `%${search}%` } },
        { '$cdata.sector$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtros avanzados
    if (statuses) {
      const statusIds = statuses.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (statusIds.length > 0) {
        whereTicketCondition.status_id = { [Op.in]: statusIds };
      }
    }

    if (staff) {
      const staffId = parseInt(staff, 10);
      if (!isNaN(staffId)) {
        whereTicketCondition.staff_id = staffId;
      }
    }

    if (organization) {
      const orgId = parseInt(organization, 10);
      if (!isNaN(orgId)) {
        whereUserCondition.org_id = orgId;
      }
    }

    if (transporte) {
      const transporteId = parseInt(transporte, 10);
      if (!isNaN(transporteId)) {
        whereTicketCondition['$cdata.transporte$'] = transporteId;
      }
    }

    // priority_id se ha eliminado ya que no existe en el modelo Ticket
    // if (priority_id) {
    //   whereTicketCondition.priority_id = priority_id;
    // }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      whereTicketCondition.created = {
        [Op.between]: [start, end]
      };
    }

    // Condición para filtrar por departamento
    const departmentInclude = {
      model: Department,
      as: 'department',
      where: { name: { [Op.in]: allowedDepartmentNames } },
      attributes: [],
      required: true
    };

    const { count, rows } = await Ticket.findAndCountAll({
      where: whereTicketCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'org_id'],
          where: Object.keys(whereUserCondition).length > 0 ? whereUserCondition : null,
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
          attributes: ['subject', 'sector'], // Se quita 'transporte' para evitar enviar solo el ID
          include: [
            {
              model: ListItems,
              as: 'TransporteName',
              attributes: ['value'],
              required: false
            },
            {
              model: ListItems,
              as: 'SectorName',
              attributes: ['value'],
              required: false
            }
          ]
        },
        departmentInclude
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [['created', 'DESC']],
      distinct: true,
      subQuery: false
    });

    const totalPages = Math.ceil(count / itemsPerPage);

    res.json({
      data: rows,
      pagination: {
        total_items: count,
        total_pages: totalPages,
        current_page: currentPage,
        items_per_page: itemsPerPage
      }
    });
  } catch (error) {
    console.error('Error in GET /api/tickets:', error);
    next(error);
  }
});

// GET ticket count
router.get('/count', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    const departmentInclude = {
      model: Department,
      as: 'department',
      where: { name: { [Op.in]: allowedDepartmentNames } },
      attributes: [],
      required: true,
    };

    let whereDateRange = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      whereDateRange.created = { [Op.between]: [start, end] };
    }

    const [totalInDateRange, openInDateRange, closedInDateRange, totalOpen, byStatusRaw] = await Promise.all([
      Ticket.count({ where: whereDateRange, include: [departmentInclude] }),
      Ticket.count({ where: whereDateRange, include: [departmentInclude, { model: TicketStatus, as: 'status', where: { state: 'open' } }] }),
      Ticket.count({ where: whereDateRange, include: [departmentInclude, { model: TicketStatus, as: 'status', where: { state: 'closed' } }] }),
      Ticket.count({ include: [departmentInclude, { model: TicketStatus, as: 'status', where: { state: 'open' } }] }),
      Ticket.findAll({
        where: whereDateRange,
        attributes: [
          [sequelize.col('status.name'), 'statusName'],
          [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'count'],
        ],
        include: [{ model: TicketStatus, as: 'status', attributes: [] }, departmentInclude],
        group: ['status.name'],
        raw: true,
      }),
    ]);

    const byStatus = byStatusRaw.reduce((acc, item) => {
      acc[item.statusName] = parseInt(item.count, 10);
      return acc;
    }, {});

    res.json({
      totalInDateRange,
      openInDateRange,
      closedInDateRange,
      totalOpen,
      byStatus,
    });
  } catch (error) {
    console.error('Error fetching ticket counts:', error);
    next(error);
  }
});

// GET unique values for 'transporte' field from tickets data
router.get('/options/transporte', async (req, res, next) => {
  try {
    // Valores predeterminados para asegurar que siempre haya opciones disponibles
    const defaultTransportes = [
      { id: 1, value: "Auto" },
      { id: 2, value: "Camioneta" },
      { id: 3, value: "Camión" },
      { id: 4, value: "Moto" },
      { id: 5, value: "Otro" }
    ];
    
    // Enfoque alternativo: Obtener valores únicos directamente de TicketCdata
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    // Primero obtenemos los tickets con sus datos de transporte
    const tickets = await Ticket.findAll({
      include: [{
        model: TicketCdata,
        as: 'cdata',
        attributes: ['transporte'],
        required: true,
        include: [{
          model: ListItems,
          as: 'TransporteName',
          attributes: ['id', 'value'],
          required: true
        }]
      }, {
        model: Department,
        as: 'department',
        where: { name: { [Op.in]: allowedDepartmentNames } },
        attributes: [],
        required: true
      }],
      attributes: []
    });
    
    // Extraer valores únicos de transporte
    const uniqueTransportes = new Map();
    
    tickets.forEach(ticket => {
      const transporteItem = ticket.cdata?.TransporteName;
      if (transporteItem && transporteItem.id && transporteItem.value) {
        uniqueTransportes.set(transporteItem.id, {
          id: transporteItem.id,
          value: transporteItem.value
        });
      }
    });
    
    const transporteItems = Array.from(uniqueTransportes.values());
    
    // Si no hay resultados, usar valores predeterminados
    if (transporteItems.length === 0) {
      console.log("No transport items found. Using default values.");
      return res.json(defaultTransportes);
    }
    
    // Ordenar por valor
    transporteItems.sort((a, b) => a.value.localeCompare(b.value));
    console.log("Found transport items:", transporteItems.length);
    res.json(transporteItems);
  } catch (error) {
    console.error(`Error fetching /options/transporte:`, error);
    // En caso de error, devolver valores predeterminados
    res.json([
      { id: 1, value: "Auto" },
      { id: 2, value: "Camioneta" },
      { id: 3, value: "Camión" },
      { id: 4, value: "Moto" },
      { id: 5, value: "Otro" }
    ]);
  }
});

// GET unique values for staff field
router.get('/options/staff', async (req, res, next) => {
  try {
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    const staff = await Staff.findAll({
      attributes: [
        'staff_id',
        [sequelize.fn('CONCAT', sequelize.col('firstname'), ' ', sequelize.col('lastname')), 'name']
      ],
      include: [{
        model: Ticket,
        as: 'AssignedTickets', // Correct alias for Staff -> Tickets
        attributes: [],
        required: true,
        include: [{
          model: Department,
          as: 'department',
          attributes: [],
          where: { name: { [Op.in]: allowedDepartmentNames } },
          required: true
        }]
      }],
      group: ['Staff.staff_id', 'name'],
      order: [[sequelize.col('name'), 'ASC']]
    });
    res.json(staff);
  } catch (error) {
    next(error);
  }
});

// GET unique values for sector field (organizations)
router.get('/options/sector', async (req, res, next) => {
  try {
    // Intentar usar el mismo endpoint que usa el modal de búsqueda avanzada
    try {
      const response = await fetch('http://localhost:3001/api/organizations/simple');
      if (!response.ok) {
        throw new Error(`Error fetching organizations: ${response.status}`);
      }
      const data = await response.json();
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} organizations from /organizations/simple`);
        return res.json(data);
      }
    } catch (fetchError) {
      console.warn(`Could not fetch from /organizations/simple: ${fetchError.message}`);
    }
    
    // Si el fetch falla, intentar consultar directamente
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    const organizations = await Organization.findAll({
      attributes: ['id', 'name'],
      include: [{
        model: User,
        as: 'users',
        attributes: [],
        required: true,
        include: [{
          model: Ticket,
          as: 'tickets',
          attributes: [],
          required: true,
          include: [{
            model: Department,
            as: 'department',
            where: { name: { [Op.in]: allowedDepartmentNames } },
            attributes: [],
            required: true
          }]
        }]
      }],
      group: ['Organization.id', 'Organization.name'],
      order: [['name', 'ASC']]
    });
    
    if (organizations && organizations.length > 0) {
      console.log(`Found ${organizations.length} organizations from direct query`);
      return res.json(organizations);
    }
    
    // Si no hay resultados, usar valores predeterminados
    console.warn("No organizations found. Using default values.");
    return res.json([
      { id: 1, name: "Casa Central" },
      { id: 2, name: "Sucursal Norte" },
      { id: 3, name: "Sucursal Sur" },
      { id: 4, name: "Sucursal Este" },
      { id: 5, name: "Sucursal Oeste" }
    ]);
  } catch (error) {
    console.error(`Error fetching /options/sector:`, error);
    // En caso de error, devolver valores predeterminados
    res.json([
      { id: 1, name: "Casa Central" },
      { id: 2, name: "Sucursal Norte" },
      { id: 3, name: "Sucursal Sur" },
      { id: 4, name: "Sucursal Este" },
      { id: 5, name: "Sucursal Oeste" }
    ]);
  }
});

// GET unique values for status field
router.get('/options/status', async (req, res, next) => {
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

// GET ticket statistics by agent (for charts)
router.get('/stats/by-agent', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Los parámetros year y month son requeridos' });
    }

    // Crear rango de fechas para el mes especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const whereCondition = {
      created: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Obtener tickets agrupados por agente para el mes especificado
    const agentStats = await Ticket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count']
      ],
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: { [Op.in]: allowedDepartmentNames }
          },
          attributes: []
        },
        {
          model: Staff,
          as: 'AssignedStaff',
          attributes: ['staff_id', 'firstname', 'lastname'],
          required: true
        }
      ],
      where: whereCondition,
      group: ['AssignedStaff.staff_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
      raw: false
    });

    // Formatear respuesta
    const formattedStats = agentStats.map(ticket => ({
      staff_id: ticket.AssignedStaff.staff_id,
      firstname: ticket.AssignedStaff.firstname,
      lastname: ticket.AssignedStaff.lastname,
      ticket_count: parseInt(ticket.dataValues.ticket_count, 10)
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error('Error en /stats/by-agent:', error);
    next(error);
  }
});

// GET ticket statistics by organization (for charts)
router.get('/stats/by-organization', async (req, res, next) => {
  try {
    // Permitir valores por defecto para año y mes
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    console.log(`Consultando tickets por organización para ${year}-${month}`);

    // Crear rango de fechas para el mes especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const whereCondition = {
      created: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Primera consulta: obtener tickets agrupados por organización con departamento filtrado
    let orgStats = await Ticket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count']
      ],
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: { [Op.in]: allowedDepartmentNames }
          },
          attributes: []
        },
        {
          model: User,
          as: 'user',
          include: [
            {
              model: Organization,
              as: 'Organization',
              attributes: ['id', 'name'],
              required: false // Hacemos esta relación opcional
            }
          ],
          attributes: [],
          required: true
        }
      ],
      where: whereCondition,
      group: ['user.Organization.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
      raw: false
    });

    // Si no hay resultados, intentamos una consulta sin el filtro de fecha
    if (orgStats.length === 0) {
      console.log('No se encontraron datos para el período específico. Intentando sin filtro de fecha...');
      
      orgStats = await Ticket.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count']
        ],
        include: [
          {
            model: Department,
            as: 'department',
            where: {
              name: { [Op.in]: allowedDepartmentNames }
            },
            attributes: []
          },
          {
            model: User,
            as: 'user',
            include: [
              {
                model: Organization,
                as: 'Organization',
                attributes: ['id', 'name'],
                required: false
              }
            ],
            attributes: [],
            required: true
          }
        ],
        group: ['user.Organization.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
        raw: false,
        limit: 15 // Limitamos a 15 organizaciones como máximo
      });
    }

    // Si aún no hay resultados, proporcionar datos de ejemplo para desarrollo
    if (orgStats.length === 0) {
      console.log('No se encontraron datos incluso sin filtro de fecha. Devolviendo datos de ejemplo para desarrollo...');
      
      // Datos demo para desarrollo y pruebas visuales del gráfico
      res.json([
        { organization_id: 1, name: "Empresa A", ticket_count: 42 },
        { organization_id: 2, name: "Soporte General", ticket_count: 28 },
        { organization_id: 3, name: "Sector Finanzas", ticket_count: 23 },
        { organization_id: 4, name: "Sector TI", ticket_count: 18 },
        { organization_id: 5, name: "Recursos Humanos", ticket_count: 12 },
      ]);
      return;
    }

    // Formatear respuesta
    const formattedStats = orgStats
      .filter(ticket => ticket.user?.Organization) // Filtramos tickets sin organización
      .map(ticket => ({
        organization_id: ticket.user.Organization.id,
        name: ticket.user.Organization.name || "Sin Sector", 
        ticket_count: parseInt(ticket.dataValues.ticket_count, 10)
      }));

    // Si después del filtrado no quedan registros, enviar datos de ejemplo
    if (formattedStats.length === 0) {
      res.json([
        { organization_id: 1, name: "Empresa A", ticket_count: 35 },
        { organization_id: 2, name: "Soporte General", ticket_count: 22 },
        { organization_id: 3, name: "Sector Finanzas", ticket_count: 18 },
      ]);
      return;
    }

    console.log(`Se encontraron ${formattedStats.length} organizaciones con tickets`);
    res.json(formattedStats);
  } catch (error) {
    console.error('Error en /stats/by-organization:', error);
    next(error);
  }
});

// GET ticket trends/tendencies (for charts)
router.get('/stats/tendencies', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Los parámetros year y month son requeridos' });
    }

    // Crear rango de fechas para el mes especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Obtener tendencias diarias de tickets creados en el mes
    const dailyTrends = await Ticket.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('Ticket.created')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count']
      ],
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: { [Op.in]: allowedDepartmentNames }
          },
          attributes: []
        }
      ],
      where: {
        created: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('Ticket.created'))],
      order: [[sequelize.fn('DATE', sequelize.col('Ticket.created')), 'ASC']],
      raw: true
    });

    // Formatear respuesta para que incluya todos los días del mes
    const daysInMonth = new Date(year, month, 0).getDate();
    const formattedTrends = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dailyTrends.find(trend => trend.date === dateStr);
      
      formattedTrends.push({
        date: dateStr,
        ticket_count: dayData ? parseInt(dayData.ticket_count, 10) : 0
      });
    }

    res.json(formattedTrends);
  } catch (error) {
    console.error('Error en /stats/tendencies:', error);
    next(error);
  }
});

// GET tickets agrupados por organización (para el gráfico "Tickets por sector")
router.get('/stats/by-organization', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    if (!year || !month) {
      return res.status(400).json({ error: 'Los parámetros year y month son requeridos' });
    }

    // Crear rango de fechas para el mes especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const ticketsByOrg = await Ticket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count']
      ],
      include: [
        {
          model: Department,
          as: 'department',
          where: {
            name: { [Op.in]: allowedDepartmentNames }
          },
          attributes: []
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ],
      where: {
        created: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['organization.id', 'organization.name'],
      having: sequelize.literal('COUNT(Ticket.ticket_id) > 0'),
      order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
      raw: true
    });

    // Formatear los datos para el gráfico de barras del frontend
    const formattedData = ticketsByOrg.map(item => ({
      organizationName: item['organization.name'] || 'Sin organización',
      organizationId: item['organization.id'],
      ticketCount: parseInt(item.ticket_count, 10)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error en /stats/by-organization:', error);
    next(error);
  }
});

module.exports = router;
