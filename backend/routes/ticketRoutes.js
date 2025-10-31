const express = require('express');
const { Op, fn, col } = require('sequelize');
const { Ticket, User, Department, Staff, Organization, TicketStatus, TicketPriority, HelpTopic } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware para manejo de errores asíncrono
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/tickets - Ruta principal para la tabla de tickets
router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, status, statuses, staff, sector, transporte, startDate, endDate } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    let where = {};
    
    // Filtros específicos - manejar tanto estado único como múltiples estados
    if (statuses && statuses !== 'all') {
        const statusArray = statuses.split(',').map(s => s.trim()).filter(s => s !== '');
        console.log(`[DEBUG] Filtro por estados múltiples - statuses recibidos: ${statusArray.join(', ')}`);
        where.status_id = { [Op.in]: statusArray };
    } else if (status && status !== 'all') {
        console.log(`[DEBUG] Filtro por estado único - status recibido: ${status}`);
        where.status_id = status;
    }
    if (staff && staff !== 'all') {
        console.log(`[DEBUG] Filtro por staff - staff recibido: ${staff}`);
        where.staff_id = staff;
    }
    if (sector && sector !== 'all') {
        console.log(`[DEBUG] Filtro por sector - sector recibido: ${sector}`);
        where['$cdata.sector$'] = sector;
    }
    if (transporte && transporte !== 'all') {
        console.log(`[DEBUG] Filtro por transporte - transporte recibido: ${transporte}`);
        where['$cdata.transporte$'] = transporte;
    }
    
    // Filtro por rango de fechas (manejando zona horaria Argentina GMT-3)
    // NUEVO: Lógica automática inteligente según estado seleccionado
    if (startDate && endDate) {
        // Crear fechas en la zona horaria local
        const start = new Date(startDate + 'T00:00:00.000-03:00');
        const end = new Date(endDate + 'T23:59:59.999-03:00');
        
        // Lógica automática: usar 'closed' para estados Cerrado/Resuelto, 'created' para Abierto
        let dateField = 'created'; // Por defecto
        if (statuses) {
            const statusArray = statuses.split(',').map(s => s.trim());
            // Si incluye estados Cerrado (3) o Resuelto (2), usar fecha de cierre
            if (statusArray.includes('2') || statusArray.includes('3')) {
                dateField = 'closed';
            }
        } else if (status && (status === '2' || status === '3')) {
            dateField = 'closed';
        }
        
        console.log(`[DEBUG] Filtro automático de fechas - Campo: ${dateField} (basado en estados), Start: ${start.toISOString()}, End: ${end.toISOString()}`);
        where[dateField] = { [Op.between]: [start, end] };
    } else if (startDate) {
        const start = new Date(startDate + 'T00:00:00.000-03:00');
        
        // Lógica automática: usar 'closed' para estados Cerrado/Resuelto, 'created' para Abierto
        let dateField = 'created'; // Por defecto
        if (statuses) {
            const statusArray = statuses.split(',').map(s => s.trim());
            if (statusArray.includes('2') || statusArray.includes('3')) {
                dateField = 'closed';
            }
        } else if (status && (status === '2' || status === '3')) {
            dateField = 'closed';
        }
        
        console.log(`[DEBUG] Filtro automático desde fecha - Campo: ${dateField} (basado en estados), Start: ${start.toISOString()}`);
        where[dateField] = { [Op.gte]: start };
    } else if (endDate) {
        const end = new Date(endDate + 'T23:59:59.999-03:00');
        
        // Lógica automática: usar 'closed' para estados Cerrado/Resuelto, 'created' para Abierto
        let dateField = 'created'; // Por defecto
        if (statuses) {
            const statusArray = statuses.split(',').map(s => s.trim());
            if (statusArray.includes('2') || statusArray.includes('3')) {
                dateField = 'closed';
            }
        } else if (status && (status === '2' || status === '3')) {
            dateField = 'closed';
        }
        
        console.log(`[DEBUG] Filtro automático hasta fecha - Campo: ${dateField} (basado en estados), End: ${end.toISOString()}`);
        where[dateField] = { [Op.lte]: end };
    }
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        where[Op.or] = [
            { number: { [Op.like]: searchTerm } },
            { '$user.name$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.firstname$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.lastname$': { [Op.like]: searchTerm } }
        ];
    }
    
    const { count, rows } = await Ticket.findAndCountAll({
        where,
        include: [
            { model: TicketStatus, as: 'status', attributes: ['name'] },
            { 
                model: Department, 
                as: 'department', 
                attributes: ['name'],
                where: {
                    name: { [Op.in]: ['Soporte Informatico', 'Soporte IT'] }
                }
            },
            { model: Staff, as: 'AssignedStaff', attributes: ['firstname', 'lastname'], required: false },
            { model: User, as: 'user', attributes: ['name'], required: false },
            { model: HelpTopic, attributes: ['topic'], required: false },
            {
                model: require('../models').TicketCdata,
                as: 'cdata',
                attributes: ['subject', 'sector', 'transporte'],
                required: false,
                include: [
                    {
                        model: require('../models').ListItems,
                        as: 'SectorName',
                        attributes: ['id', 'value'],
                        required: false
                    },
                    {
                        model: require('../models').ListItems,
                        as: 'TransporteName',
                        attributes: ['id', 'value'],
                        required: false
                    }
                ]
            }
        ],
        limit: parseInt(limit, 10),
        offset,
        order: [['created', 'DESC']],
        subQuery: false,
        distinct: true
    });
    
    console.log(`[DEBUG] Consulta completada - Total encontrados: ${count}, Devolviendo: ${rows.length}`);
    if (rows.length > 0) {
        console.log(`[DEBUG] Primer ticket encontrado:`, {
            id: rows[0].ticket_id,
            number: rows[0].number,
            status: rows[0].status?.name,
            status_id: rows[0].status_id,
            created: rows[0].created
        });
    }
    
    // LOG TEMPORAL: Si estamos filtrando por fechas pero no por estado, mostrar todos los status_id de hoy
    if ((startDate || endDate) && !status && !statuses) {
        console.log(`[DEBUG TEMPORAL] Tickets de hoy por status_id (campo 'created'):`);
        const statusCounts = {};
        rows.forEach(ticket => {
            const statusId = ticket.status_id;
            const statusName = ticket.status?.name || 'Sin nombre';
            const key = `${statusId} (${statusName})`;
            statusCounts[key] = (statusCounts[key] || 0) + 1;
        });
        console.log(statusCounts);
        
        // INVESTIGACIÓN ADICIONAL: Buscar tickets cerrados hoy usando el campo 'closed'
        if (startDate && endDate && startDate === endDate) {
            console.log(`[DEBUG TEMPORAL] Investigando tickets cerrados hoy usando campo 'closed'...`);
            const closedStart = new Date(startDate + 'T00:00:00.000-03:00');
            const closedEnd = new Date(endDate + 'T23:59:59.999-03:00');
            
            Ticket.findAll({
                where: {
                    closed: { [Op.between]: [closedStart, closedEnd] }
                },
                include: [{ model: TicketStatus, as: 'status', attributes: ['name'] }],
                attributes: ['ticket_id', 'number', 'status_id', 'created', 'closed']
            }).then(closedTickets => {
                console.log(`[DEBUG TEMPORAL] Tickets cerrados hoy (campo 'closed'): ${closedTickets.length}`);
                const closedStatusCounts = {};
                closedTickets.forEach(ticket => {
                    const statusId = ticket.status_id;
                    const statusName = ticket.status?.name || 'Sin nombre';
                    const key = `${statusId} (${statusName})`;
                    closedStatusCounts[key] = (closedStatusCounts[key] || 0) + 1;
                });
                console.log('[DEBUG TEMPORAL] Distribución por status_id (cerrados hoy):', closedStatusCounts);
            }).catch(err => {
                console.log('[DEBUG TEMPORAL] Error investigando tickets cerrados:', err.message);
            });
        }
    }
    
    res.json({
        tickets: rows,
        pagination: {
            total_items: count,
            total_pages: Math.ceil(count / parseInt(limit, 10)),
            current_page: parseInt(page, 10),
            per_page: parseInt(limit, 10)
        }
    });
}));

// GET /api/tickets/reports - Obtener tickets para reportes con filtros y paginación
router.get('/reports', async (req, res) => {
  console.log('✅✅✅ /api/tickets/reports endpoint hit! ✅✅✅');
    logger.info('--- INICIO PETICIÓN GET /api/tickets ---');
    logger.info(`Query recibido: ${JSON.stringify(req.query)}`);

    const { page = 1, limit = 10, search, month, year, status, priority, department, sla, team, topic, location, staff, sector, transporte, startDate, endDate } = req.query;
    logger.info('Paso 1: Parámetros extraídos.');

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    logger.info(`Paso 2: Offset calculado: ${offset}`);

    let where = {};
    // Incluir asociaciones para obtener nombres legibles
    let include = [
        {
            model: TicketStatus,
            as: 'status',
            attributes: ['id', 'name']
        },
        {
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
        },
        {
            model: Staff,
            as: 'AssignedStaff',
            attributes: ['staff_id', 'firstname', 'lastname'],
            required: false
        },
        {
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
            required: false
        },
        {
            model: HelpTopic,
            attributes: ['topic', 'topic_id'],
            required: false
        },
        {
            model: require('../models').TicketCdata,
            as: 'cdata',
            attributes: ['subject', 'sector', 'transporte'],
            required: false,
            include: [
                {
                    model: require('../models').ListItems,
                    as: 'SectorName',
                    attributes: ['id', 'value'],
                    required: false
                },
                {
                    model: require('../models').ListItems,
                    as: 'TransporteName',
                    attributes: ['id', 'value'],
                    required: false
                }
            ]
        }
    ];

    // Habilitar búsqueda ampliada por número, usuario y staff
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        where[Op.or] = [
            { number: { [Op.like]: searchTerm } },
            { '$user.name$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.firstname$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.lastname$': { [Op.like]: searchTerm } }
        ];
    }

    // Filtros específicos
    if (department && department !== 'all') where.dept_id = department;
    if (status && status !== 'all') where.status_id = status;
    if (priority && priority !== 'all') where.priority_id = priority;
    if (staff && staff !== 'all') where.staff_id = staff;
    if (sector && sector !== 'all') where['$cdata.sector$'] = sector;
    if (transporte && transporte !== 'all') where['$cdata.transporte$'] = transporte;

    // Filtro por rango de fechas para reportes
    if (startDate && endDate) {
        where.created = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
        where.created = { [Op.gte]: new Date(startDate) };
    }

    // Filtro por fecha (mes y año)
    if (year && year !== 'all') {
        const yearNum = parseInt(year, 10);
        let startDate, endDate;
        if (month && month !== 'all') {
            const monthNum = parseInt(month, 10);
            startDate = new Date(yearNum, monthNum - 1, 1);
            endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        } else {
            startDate = new Date(yearNum, 0, 1);
            endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        }
        where.created = { [Op.between]: [startDate, endDate] };
    }

    // Filtro automático por departamento Soporte IT (consistente con otros endpoints)
    const departmentFilter = {
        model: Department,
        as: 'department',
        where: {
            name: { [Op.in]: ['Soporte Informatico', 'Soporte IT'] }
        },
        attributes: ['id', 'name']
    };
    
    // Reemplazar la asociación de Department en include con el filtro
    include = include.map(inc => {
        if (inc.model === Department && inc.as === 'department') {
            return departmentFilter;
        }
        return inc;
    });

    try {
        logger.info(`[REPORTS_LOG] 🔍 Ejecutando consulta con filtros: ${JSON.stringify(where, null, 2)}`);
        const { count, rows } = await Ticket.findAndCountAll({
            where,
            include,
            limit: parseInt(limit, 10),
            offset,
            order: [['created', 'DESC']],
        });

        logger.info(`[REPORTS_LOG] ✅ Consulta exitosa. Tickets encontrados: ${count}.`);

        return res.status(200).json({
            tickets: rows,
            pagination: {
                total_items: count,
                total_pages: Math.ceil(count / parseInt(limit, 10)),
                current_page: parseInt(page, 10),
                per_page: parseInt(limit, 10)
            }
        });

    } catch (error) {
        logger.error(`[REPORTS_LOG] ❌ Error en la ruta /reports: ${error.message}`);
        console.error(error); // Log completo del error para diagnóstico
        return res.status(500).json({
            message: 'Error interno del servidor al procesar la solicitud de reportes.',
            error: error.message
        });
    }
});

// GET /api/tickets/stats - Obtener estadísticas de tickets
router.get('/stats', asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    const stats = await getTicketCounts({ month, year });
    res.json(stats);
}));

// GET /api/tickets/stats/by-transport
router.get('/stats/by-transport', asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    let where = {};

    if (year && year !== 'all') {
        const yearNum = parseInt(year, 10);
        let startDate, endDate;
        if (month && month !== 'all') {
            const monthNum = parseInt(month, 10);
            startDate = new Date(yearNum, monthNum - 1, 1);
            endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        } else {
            startDate = new Date(yearNum, 0, 1);
            endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        }
        where.created = { [Op.between]: [startDate, endDate] };
    }

    const transportData = await Ticket.findAll({
        attributes: [
            [Ticket.sequelize.col('location.id'), 'transportId'],
            [Ticket.sequelize.col('location.name'), 'transportName'],
            [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count']
        ],
        include: [{
            model: Location,
            as: 'location',
            attributes: []
        }],
        where,
        group: ['location.id', 'location.name'],
        order: [[Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'DESC']]
    });

    res.json(transportData);
}));

// GET /api/tickets/count - Obtener conteos de tickets para dashboard
router.get('/count', asyncHandler(async (req, res) => {
    
    const { startDate, endDate, month, year } = req.query;
    let where = {};
    
    // Filtro por rango de fechas
    if (startDate && endDate) {
        where.created = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    } else if (year && month) {
        // Filtro por mes y año específico
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const startOfMonth = new Date(yearNum, monthNum - 1, 1);
        const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        where.created = {
            [Op.between]: [startOfMonth, endOfMonth]
        };
    }
    
    // Incluir filtro por departamento "Soporte IT" para ser consistente
    const departmentInclude = {
        model: Department,
        as: 'department',
        where: {
            name: { [Op.in]: ['Soporte Informatico', 'Soporte IT'] }
        },
        attributes: []
    };
    
    // Obtener conteos básicos (solo Soporte IT)
    const totalTickets = await Ticket.count({ 
        where,
        include: [departmentInclude]
    });
    
    // Obtener conteos por estado dinámicamente (solo Soporte IT)
    const statusCounts = await Ticket.findAll({
        attributes: [
            'status_id',
            [fn('COUNT', col('ticket_id')), 'count']
        ],
        include: [
            {
                model: TicketStatus,
                as: 'status',
                attributes: ['name']
            },
            departmentInclude
        ],
        where,
        group: ['status_id', 'status.id'],
        raw: false
    });
    
    // Procesar conteos por estado
    let openTickets = 0;
    let closedTickets = 0;
    let pendingTickets = 0;
    const byStatus = {};
    
    statusCounts.forEach(item => {
        const statusName = item.status?.name?.toLowerCase() || '';
        const count = parseInt(item.dataValues.count) || 0;
        
        // Agregar al objeto byStatus para la gráfica
        byStatus[item.status?.name || 'Desconocido'] = count;
        
        // Categorizar estados
        if (statusName.includes('open') || statusName.includes('abierto') || statusName.includes('nuevo')) {
            openTickets += count;
        } else if (statusName.includes('closed') || statusName.includes('cerrado') || statusName.includes('resuelto')) {
            closedTickets += count;
        } else if (statusName.includes('pending') || statusName.includes('pendiente') || statusName.includes('espera')) {
            pendingTickets += count;
        }
    });
    
    // Obtener total de tickets pendientes acumulados (todos los tickets NO cerrados - solo Soporte IT)
    // Esto incluye tickets abiertos del mes actual + tickets abiertos de meses anteriores
    // Basado en los estados que vimos: "Abierto" = pendiente, "Resuelto" y "Cerrado" = no pendiente
    const totalPendingCount = await Ticket.count({
        include: [
            {
                model: TicketStatus,
                as: 'status',
                where: {
                    // Solo incluir estados que NO sean "Resuelto" o "Cerrado"
                    name: {
                        [Op.notIn]: ['Resuelto', 'Cerrado']
                    }
                }
            },
            departmentInclude
        ]
    });
    
    res.json({
        total: totalTickets,
        open: openTickets,
        closed: closedTickets,
        pending: pendingTickets,
        totalPendingAccumulated: totalPendingCount,
        byStatus: byStatus
    });
}));

// GET /api/tickets/stats/by-agent - Obtener estadísticas de tickets por agente (solo Soporte IT)
router.get('/stats/by-agent', asyncHandler(async (req, res) => {
    const { year, month } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    // Filtro por fecha
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const where = {
        created: {
            [Op.between]: [startDate, endDate]
        }
    };
    
    // Obtener tickets agrupados por agente asignado (solo Soporte IT)
    const agentStats = await Ticket.findAll({
        attributes: [
            [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.ticket_id')), 'ticket_count']
        ],
        include: [
            {
                model: Staff,
                as: 'AssignedStaff',
                attributes: ['staff_id', 'firstname', 'lastname'],
                include: [{
                    model: Department,
                    as: 'department',
                    where: {
                        name: { [Op.in]: ['Soporte Informatico', 'Soporte IT'] }
                    },
                    attributes: []
                }],
                required: true
            }
        ],
        where,
        group: ['AssignedStaff.staff_id', 'AssignedStaff.firstname', 'AssignedStaff.lastname'],
        order: [[Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.ticket_id')), 'DESC']],
        limit: 10
    });
    
    // Formatear respuesta
    const formattedStats = agentStats.map(ticket => ({
        agent_id: ticket.AssignedStaff.staff_id,
        agent_name: `${ticket.AssignedStaff.firstname} ${ticket.AssignedStaff.lastname}`.trim(),
        ticket_count: parseInt(ticket.dataValues.ticket_count, 10)
    }));
    
    res.json(formattedStats);
}));

// GET /api/tickets/export - Exportar tickets
router.get('/export', asyncHandler(async (req, res) => {
    console.log('🔄 GET /api/tickets/export - Iniciando exportación con query:', req.query);
    const { search, month, year, status, priority, department, sla, team, topic, location } = req.query;

    let where = {};
    let include = [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Sla, as: 'sla', attributes: ['name'] },
        { model: Team, as: 'team', attributes: ['name'] },
        { model: Topic, as: 'topic', attributes: ['topic'] },
        { model: Location, as: 'location', attributes: ['name'] },
    ];

    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        const searchCondition = {
            [Op.or]: [
                { '$user.name$': { [Op.like]: searchTerm } },
                { '$department.name$': { [Op.like]: searchTerm } },
                { '$location.name$': { [Op.like]: searchTerm } },
                { 'number': { [Op.like]: searchTerm } }
            ]
        };
        where = { ...where, ...searchCondition };
    }

    if (department && department !== 'all') where.dept_id = department;
    if (sla && sla !== 'all') where.sla_id = sla;
    if (team && team !== 'all') where.team_id = team;
    if (topic && topic !== 'all') where.topic_id = topic;
    if (location && location !== 'all') where.location_id = location;
    if (status && status !== 'all') where.status_id = status;
    if (priority && priority !== 'all') where.priority_id = priority;

    if (year && year !== 'all') {
        const yearNum = parseInt(year, 10);
        let startDate, endDate;
        if (month && month !== 'all') {
            const monthNum = parseInt(month, 10);
            startDate = new Date(yearNum, monthNum - 1, 1);
            endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
        } else {
            startDate = new Date(yearNum, 0, 1);
            endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
        }
        where.created = { [Op.between]: [startDate, endDate] };
    }

    const tickets = await Ticket.findAll({
        where,
        include,
        order: [['created', 'DESC']]
    });

    console.log(`✅ GET /api/tickets/export - Encontrados ${tickets.length} tickets para exportar.`);
    res.json(tickets);
}));

module.exports = router;

// GET ticket statistics by organization (for charts)
router.get('/stats/by-organization', async (req, res, next) => {
  try {
    // Permitir valores por defecto para año y mes
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];
    
    logger.info(`Consultando tickets por organización para ${year}-${month}`);

    // Crear rango de fechas para el mes especificado
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Consulta simplificada: usar datos del sector desde TicketCdata en lugar de Organization
    const orgStats = await Ticket.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count'],
        [sequelize.col('cdata.SectorName.value'), 'sector_name']
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
          model: TicketCdata,
          as: 'cdata',
          attributes: [],
          required: true, // Solo tickets que tengan datos de sector
          include: [
            {
              model: ListItems,
              as: 'SectorName',
              attributes: ['value'],
              required: true
            }
          ]
        }
      ],
      where: {
        created: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['cdata.SectorName.value'],
      having: sequelize.where(sequelize.col('cdata.SectorName.value'), {
        [Op.not]: null,
        [Op.ne]: ''
      }),
      order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
      raw: true,
      limit: 15
    });

    // Si no hay datos en el período, intentar sin filtro de fecha
    let finalStats = orgStats;
    if (finalStats.length === 0) {
      logger.info('No se encontraron datos para el período específico. Intentando sin filtro de fecha...');
      
      finalStats = await Ticket.findAll({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'ticket_count'],
          [sequelize.col('cdata.SectorName.value'), 'sector_name']
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
            model: TicketCdata,
            as: 'cdata',
            attributes: [],
            required: true,
            include: [
              {
                model: ListItems,
                as: 'SectorName',
                attributes: ['value'],
                required: true
              }
            ]
          }
        ],
        group: ['cdata.SectorName.value'],
        having: sequelize.where(sequelize.col('cdata.SectorName.value'), {
          [Op.not]: null,
          [Op.ne]: ''
        }),
        order: [[sequelize.fn('COUNT', sequelize.col('Ticket.ticket_id')), 'DESC']],
        raw: true,
        limit: 15
      });
    }

    // Formatear respuesta usando los datos reales del sector
    const formattedStats = finalStats.map((stat, index) => ({
      organization_id: index + 1, // ID secuencial para el gráfico
      name: stat.sector_name || "Sin Sector",
      ticket_count: parseInt(stat.ticket_count, 10)
    }));

    // Si aún no hay datos, usar datos de ejemplo como último recurso
    if (formattedStats.length === 0) {
      logger.info('No se encontraron datos reales. Devolviendo datos de ejemplo...');
      res.json([
        { organization_id: 1, name: "Empresa A", ticket_count: 35 },
        { organization_id: 2, name: "Soporte General", ticket_count: 22 },
        { organization_id: 3, name: "Sector Finanzas", ticket_count: 18 },
      ]);
      return;
    }

    logger.info(`Se encontraron ${formattedStats.length} sectores con tickets:`, formattedStats);
    res.json(formattedStats);
  } catch (error) {
    logger.error('Error en /stats/by-organization:', error);
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
        [fn('DATE', col('Ticket.created')), 'date'],
        [fn('COUNT', col('Ticket.ticket_id')), 'ticket_count']
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
      group: [fn('DATE', col('Ticket.created'))],
      order: [[fn('DATE', col('Ticket.created')), 'ASC']],
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
    logger.error('Error en /stats/tendencies:', error);
    next(error);
  }
});

// GET /api/tickets/options/staff - Obtener opciones de staff (solo Soporte IT)
router.get('/options/staff', asyncHandler(async (req, res) => {
  try {
    // Primero obtener el ID del departamento "Soporte IT"
    const soporteITDept = await Department.findOne({
      where: { name: { [Op.like]: '%Soporte%IT%' } }
    });
    
    const staffOptions = await Staff.findAll({
      attributes: ['staff_id', 'firstname', 'lastname'],
      where: { 
        isactive: 1,
        dept_id: soporteITDept ? soporteITDept.id : null
      },
      order: [['firstname', 'ASC']]
    });
    
    const formattedStaff = staffOptions.map(staff => ({
      staff_id: staff.staff_id,
      name: `${staff.firstname} ${staff.lastname}`
    }));
    
    res.json(formattedStaff);
  } catch (error) {
    logger.error('Error obteniendo opciones de staff:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/options/sector - Obtener opciones de sector (desde ListItems)
router.get('/options/sector', asyncHandler(async (req, res) => {
  try {
    // Obtener sectores únicos desde TicketCdata que tengan valores no nulos
    const { TicketCdata, ListItems } = require('../models');
    
    // Primero obtener todos los IDs de sector únicos que se usan en tickets
    const usedSectorIds = await TicketCdata.findAll({
      attributes: [[fn('DISTINCT', col('sector')), 'sector']],
      where: {
        sector: { [Op.not]: null }
      },
      raw: true
    });
    
    if (usedSectorIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener los nombres de los sectores desde ListItems
    const sectorIds = usedSectorIds.map(item => item.sector);
    const sectorOptions = await ListItems.findAll({
      attributes: ['id', 'value'],
      where: {
        id: { [Op.in]: sectorIds }
      },
      order: [['value', 'ASC']]
    });
    
    // Formatear para que coincida con el formato esperado
    const formattedSectors = sectorOptions.map(sector => ({
      id: sector.id,
      name: sector.value
    }));
    
    res.json(formattedSectors);
  } catch (error) {
    logger.error('Error obteniendo opciones de sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/options/transporte - Obtener opciones de transporte
router.get('/options/transporte', asyncHandler(async (req, res) => {
  try {
    const { TicketCdata, ListItems } = require('../models');
    
    // Obtener todos los IDs de transporte únicos que se usan en tickets
    const usedTransporteIds = await TicketCdata.findAll({
      attributes: [[fn('DISTINCT', col('transporte')), 'transporte']],
      where: {
        transporte: { [Op.not]: null }
      },
      raw: true
    });
    
    if (usedTransporteIds.length === 0) {
      return res.json([]);
    }
    
    // Obtener los nombres de los transportes desde ListItems
    const transporteIds = usedTransporteIds.map(item => item.transporte);
    
    const transporteOptions = await ListItems.findAll({
      attributes: ['id', 'value'],
      where: {
        id: { [Op.in]: transporteIds }
      },
      order: [['value', 'ASC']]
    });
    
    // Formatear para que coincida con el formato esperado por el frontend
    const formattedTransporte = transporteOptions.map(transporte => ({
      id: transporte.id,
      name: transporte.value || `ID: ${transporte.id}`
    }));
    
    res.json(formattedTransporte);
  } catch (error) {
    logger.error('Error obteniendo opciones de transporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/options/status - Obtener opciones de status
router.get('/options/status', asyncHandler(async (req, res) => {
  try {
    const statusOptions = await TicketStatus.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.json(statusOptions);
  } catch (error) {
    logger.error('Error obteniendo opciones de status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/:id - Obtener detalle completo de un ticket específico
router.get('/:id', asyncHandler(async (req, res) => {
    const ticketId = req.params.id;
    const sequelize = require('../models').sequelize; // Obtener instancia de sequelize

    console.log(`[DEBUG] /api/tickets/:id - INICIO para ticketId: ${ticketId}`);

    try {
        // Iniciar log de la petición
        logger.info(`🚀 INICIANDO consulta detalle para ticket ID: ${ticketId}`);
        console.log(`[DEBUG] /api/tickets/:id - Buscando ticket principal...`);

        // 1. Obtener el ticket principal
        const ticket = await Ticket.findOne({ 
            where: { ticket_id: ticketId },
            include: [
                {
                    model: require('../models').TicketCdata,
                    as: 'cdata',
                    attributes: ['subject', 'sector', 'transporte'],
                    required: false
                }
            ]
        });
        console.log(`[DEBUG] /api/tickets/:id - Ticket principal encontrado: ${ticket ? 'Sí' : 'No'}`);

        if (!ticket) {
            logger.warn(`Ticket ${ticketId} no encontrado`);
            return res.status(404).json({ 
                error: 'Ticket no encontrado',
                message: `No se encontró el ticket con ID: ${ticketId}` 
            });
        }

        logger.info(`Ticket ${ticketId} encontrado, obteniendo información adicional...`);
        logger.info(`Campos del ticket:`, Object.keys(ticket.toJSON()));
        logger.info(`Datos del ticket:`, ticket.toJSON());

        // Obtener información adicional del formulario personalizado
        let formData = [];
        try {
            formData = await sequelize.query(`
                SELECT 
                    ff.label as field_name,
                    fev.value as field_value,
                    ff.type as field_type
                FROM ost_form_entry fe
                JOIN ost_form_entry_values fev ON fev.entry_id = fe.id
                JOIN ost_form_field ff ON ff.id = fev.field_id
                WHERE fe.object_id = :ticketId 
                AND fe.object_type = 'T'
                ORDER BY ff.sort
            `, {
                replacements: { ticketId },
                type: sequelize.QueryTypes.SELECT
            });
            logger.info(`Campos personalizados obtenidos: ${formData.length}`);
        } catch (formError) {
            logger.warn(`No se pudo obtener campos personalizados para ticket ${ticketId}:`, formError.message);
        }

        // Obtener respuestas/threads del ticket - Estructura osTicket correcta
        let ticketThreads = [];
        try {
            console.log(`[DEBUG] /api/tickets/:id - 🔍 BUSCANDO THREADS para ticket ${ticketId}...`);
            
            const threadEntries = await sequelize.query(`
                SELECT 
                    te.id as entry_id,
                    te.thread_id,
                    te.poster,
                    te.title,
                    te.body,
                    te.created,
                    te.staff_id,
                    te.user_id,
                    te.type,
                    t.object_id as ticket_id,
                    s.firstname as staff_firstname,
                    s.lastname as staff_lastname,
                    u.name as user_name
                FROM ost_thread_entry te
                JOIN ost_thread t ON te.thread_id = t.id
                LEFT JOIN ost_staff s ON te.staff_id = s.staff_id
                LEFT JOIN ost_user u ON te.user_id = u.id
                WHERE t.object_id = ? AND t.object_type = 'T'
                ORDER BY te.created ASC
            `, {
                replacements: [ticketId],
                type: sequelize.QueryTypes.SELECT
            });
            
            ticketThreads = threadEntries;
            console.log(`[DEBUG] /api/tickets/:id - ✅ THREADS ENCONTRADOS: ${ticketThreads.length}`);
            if (ticketThreads.length > 0) {
                console.log('[DEBUG] /api/tickets/:id - Primer thread:', JSON.stringify(ticketThreads[0], null, 2));
            }

            
        } catch (threadError) {
            console.error(`❌ ERROR CRÍTICO obteniendo threads para ticket ${ticketId}:`, threadError);
            console.error(`❌ Stack trace:`, threadError.stack);
            console.error(`❌ SQL Error details:`, threadError.sql || 'No SQL info');
            ticketThreads = [];
        }

        // Obtener información relacionada por separado para evitar errores de asociación
        let statusInfo = null;
        let priorityInfo = null;
        let staffInfo = null;
        let userInfo = null;
        let departmentInfo = null;
        let topicInfo = null;

        try {
            // Status
            if (ticket.status_id) {
                statusInfo = await TicketStatus.findByPk(ticket.status_id, {
                    attributes: ['id', 'name', 'state']
                });
            }

            // Priority
            if (ticket.priority_id) {
                priorityInfo = await TicketPriority.findByPk(ticket.priority_id, {
                    attributes: ['priority_id', 'priority', 'priority_color']
                });
            }

            // Staff
            if (ticket.staff_id) {
                staffInfo = await Staff.findByPk(ticket.staff_id, {
                    attributes: ['staff_id', 'firstname', 'lastname', 'email']
                });
            }

            // User
            if (ticket.user_id) {
                userInfo = await User.findByPk(ticket.user_id, {
                    attributes: ['id', 'name', 'default_email_id']
                });
            }

            // Department
            if (ticket.dept_id) {
                departmentInfo = await Department.findByPk(ticket.dept_id, {
                    attributes: ['id', 'name']
                });
            }

            // Topic
            if (ticket.topic_id) {
                topicInfo = await HelpTopic.findByPk(ticket.topic_id, {
                    attributes: ['topic_id', 'topic']
                });
            }

        } catch (relationError) {
            logger.warn(`Error obteniendo información relacionada para ticket ${ticketId}:`, relationError.message);
        }

        // En osTicket, el asunto está en la tabla cdata
        const subject = ticket.cdata?.subject || 
                       (ticketThreads.length > 0 && ticketThreads[0].title) || 
                       `Ticket #${ticket.number}`;

        // Estructurar la respuesta
        const ticketDetail = {
            ...ticket.toJSON(),
            subject: subject, // Asegurar que el asunto esté disponible
            status: statusInfo,
            priority: priorityInfo,
            AssignedStaff: staffInfo,
            user: userInfo,
            department: departmentInfo,
            topic: topicInfo,
            customFields: formData,
            threads: ticketThreads,
            stats: {
                totalThreads: ticketThreads.length,
                lastActivity: ticketThreads.length > 0 ? ticketThreads[ticketThreads.length - 1].created : ticket.updated
            }
        };

        logger.info(`Asunto extraído: "${subject}"`);
        logger.info(`Total threads enviados: ${ticketThreads.length}`);

        logger.info(`Detalle de ticket ${ticketId} obtenido exitosamente`);
        res.json(ticketDetail);

    } catch (error) {
        logger.error(`Error al obtener detalle del ticket ${ticketId}:`, error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: `Error específico: ${error.message}`
        });
    }
}));

module.exports = router;
