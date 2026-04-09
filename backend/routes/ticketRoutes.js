const express = require('express');
const { Op, fn, col } = require('sequelize');
const models = require('../models');
const { Ticket, User, Department, Staff, Organization, TicketStatus, TicketPriority, HelpTopic, SLA, TicketCdata, ListItems, sequelize: db } = models;
const logger = require('../utils/logger');

// Cache módulo-nivel: field_ids de campos de formulario (no cambian en runtime)
let _cachedTpSolicitudFieldId = null;
let _cachedSectorFieldId = null;

async function getSectorFieldId() {
    if (_cachedSectorFieldId !== null) return _cachedSectorFieldId;
    const rows = await db.query(
        "SELECT id AS field_id FROM ost_form_field WHERE name = 'sector' LIMIT 1",
        { type: db.QueryTypes.SELECT }
    );
    _cachedSectorFieldId = rows.length > 0 ? rows[0].field_id : null;
    if (_cachedSectorFieldId) logger.info(`Sector field_id cacheado: ${_cachedSectorFieldId}`);
    return _cachedSectorFieldId;
}

async function getTpSolicitudFieldId() {
    if (_cachedTpSolicitudFieldId !== null) return _cachedTpSolicitudFieldId;
    const rows = await db.query(
        "SELECT id AS field_id FROM ost_form_field WHERE name LIKE '%tpsolicitud%' OR name LIKE '%TPSolicitud%' OR label LIKE '%TPSolicitud%' OR label LIKE '%Tipo de Solicitud%' LIMIT 1",
        { type: db.QueryTypes.SELECT }
    );
    _cachedTpSolicitudFieldId = rows.length > 0 ? rows[0].field_id : null;
    if (_cachedTpSolicitudFieldId) {
        logger.info(`TPSolicitud field_id cacheado: ${_cachedTpSolicitudFieldId}`);
    }
    return _cachedTpSolicitudFieldId;
}

const router = express.Router();

// Middleware para manejo de errores asíncrono
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Helper: Construir ORDER BY para Sequelize a partir de params del frontend
async function buildOrder(sortBy, sortDir, models) {
    const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
    const { Staff, User, TicketCdata } = models;

    // Subconsulta reutilizable para campos de formulario dinámico
    const fevSubquery = (fieldId) => db.literal(
        `(SELECT fev.value FROM ost_form_entry_values fev ` +
        `JOIN ost_form_entry fe ON fe.id = fev.entry_id ` +
        `WHERE fe.object_id = \`Ticket\`.\`ticket_id\` ` +
        `AND fe.object_type = 'T' AND fev.field_id = ${fieldId} LIMIT 1)`
    );

    switch (sortBy) {
        case 'number':  return [['number', dir]];
        case 'created': return [['created', dir]];
        case 'agente':  return [[{ model: Staff, as: 'AssignedStaff' }, 'firstname', dir], ['created', 'DESC']];
        case 'usuario': return [[{ model: User, as: 'user' }, 'name', dir], ['created', 'DESC']];
        case 'subject': return [[{ model: TicketCdata, as: 'cdata' }, 'subject', dir], ['created', 'DESC']];
        case 'sector': {
            const fieldId = await getSectorFieldId();
            if (!fieldId) return [['created', 'DESC']];
            return [[fevSubquery(fieldId), dir], ['created', 'DESC']];
        }
        case 'requestType': {
            const fieldId = await getTpSolicitudFieldId();
            if (!fieldId) return [['created', 'DESC']];
            return [[fevSubquery(fieldId), dir], ['created', 'DESC']];
        }
        default:        return [['created', 'DESC']];
    }
}

// GET /api/tickets - Ruta principal para la tabla de tickets
router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, search, status, statuses, staff, sector, transporte, sla, requestType, startDate, endDate, sortBy, sortDir } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    let where = {};
    
    // Filtros específicos - manejar tanto estado único como múltiples estados
    if (statuses && statuses !== 'all') {
        const statusArray = statuses.split(',').map(s => s.trim()).filter(s => s !== '');
        where.status_id = { [Op.in]: statusArray };
    } else if (status && status !== 'all') {
        where.status_id = status;
    }
    if (staff && staff !== 'all') {
        where.staff_id = staff;
    }
    if (sector && sector !== 'all') {
        where['$cdata.sector$'] = sector;
    }
    if (transporte && transporte !== 'all') {
        where['$cdata.transporte$'] = transporte;
    }
    if (sla && sla !== 'all') {
        const slaId = parseInt(sla, 10);
        if (!Number.isNaN(slaId)) {
            where.sla_id = slaId;
        } else {
            logger.warn(`Filtro SLA ignorado: valor no numérico -> ${sla}`);
        }
    }
    
    // Filtro por tipo de solicitud (TPSolicitud) - field_id cacheado al inicio
    if (requestType && requestType !== 'all') {
        const fieldId = await getTpSolicitudFieldId();
        if (fieldId) {
            const matchingTickets = await db.query(`
                SELECT fe.object_id AS ticket_id
                FROM ost_form_entry_values fev
                INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
                WHERE fe.object_type = 'T' AND fev.field_id = :fieldId
                  AND fev.value LIKE :pattern
            `, {
                replacements: { fieldId, pattern: `%${requestType}%` },
                type: db.QueryTypes.SELECT
            });
            const ids = matchingTickets.map(r => r.ticket_id);
            where.ticket_id = { ...(where.ticket_id || {}), [Op.in]: ids.length > 0 ? ids : [0] };
        }
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
        
        logger.debug(`Filtro fechas - Campo: ${dateField}, Start: ${start.toISOString()}, End: ${end.toISOString()}`);
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
        
        where[dateField] = { [Op.lte]: end };
    }
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        where[Op.or] = [
            { number: { [Op.like]: searchTerm } },
            { '$cdata.subject$': { [Op.like]: searchTerm } },
            { '$user.name$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.firstname$': { [Op.like]: searchTerm } },
            { '$AssignedStaff.lastname$': { [Op.like]: searchTerm } }
        ];
    }
    
    const { count, rows } = await Ticket.findAndCountAll({
        where,
        include: [
            { model: TicketStatus, as: 'status', attributes: ['name'] },
            { model: SLA, as: 'sla', attributes: ['id', 'name', 'grace_period'], required: false },
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
                model: TicketCdata,
                as: 'cdata',
                attributes: ['subject', 'sector', 'transporte'],
                required: false,
                include: [
                    {
                        model: ListItems,
                        as: 'SectorName',
                        attributes: ['id', 'value'],
                        required: false
                    },
                    {
                        model: ListItems,
                        as: 'TransporteName',
                        attributes: ['id', 'value'],
                        required: false
                    }
                ]
            }
        ],
        limit: parseInt(limit, 10),
        offset,
        order: await buildOrder(sortBy, sortDir, models),
        subQuery: false,
        distinct: true
    });

    logger.debug(`Consulta completada - Total: ${count}, Devolviendo: ${rows.length}`);

    // Enriquecer con Tipo de Solicitud (TPSolicitud)
    const enrichedRows = await enrichWithRequestType(rows, db);

    res.json({
        tickets: enrichedRows,
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
    const { page = 1, limit = 100, search, month, year, status, priority, department, sla, team, topic, location, staff, sector, transporte, requestType, startDate, endDate, sortBy, sortDir } = req.query;

    const parsedLimit = Math.min(parseInt(limit, 10) || 100, 20000); // tope de seguridad
    const parsedPage  = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    let where = {};
    // Incluir asociaciones para obtener nombres legibles
    let include = [
        {
            model: TicketStatus,
            as: 'status',
            attributes: ['id', 'name']
        },
        {
            model: SLA,
            as: 'sla',
            attributes: ['id', 'name', 'grace_period'],
            required: false
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
            model: TicketCdata,
            as: 'cdata',
            attributes: ['subject', 'sector', 'transporte'],
            required: false,
            include: [
                {
                    model: ListItems,
                    as: 'SectorName',
                    attributes: ['id', 'value'],
                    required: false
                },
                {
                    model: ListItems,
                    as: 'TransporteName',
                    attributes: ['id', 'value'],
                    required: false
                }
            ]
        }
    ];

    // Habilitar búsqueda ampliada por número, asunto, usuario y staff
    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        where[Op.or] = [
            { number: { [Op.like]: searchTerm } },
            { '$cdata.subject$': { [Op.like]: searchTerm } },
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
    if (sla && sla !== 'all') {
        const slaId = parseInt(sla, 10);
        if (!Number.isNaN(slaId)) {
            where.sla_id = slaId;
        }
    }
    // Filtro por tipo de solicitud (TPSolicitud) - field_id cacheado
    if (requestType && requestType !== 'all') {
        const fieldId = await getTpSolicitudFieldId();
        if (fieldId) {
            const matchingTickets = await db.query(`
                SELECT fe.object_id AS ticket_id
                FROM ost_form_entry_values fev
                INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
                WHERE fe.object_type = 'T' AND fev.field_id = :fieldId
                  AND fev.value LIKE :pattern
            `, {
                replacements: { fieldId, pattern: `%${requestType}%` },
                type: db.QueryTypes.SELECT
            });
            const ids = matchingTickets.map(r => r.ticket_id);
            where.ticket_id = { ...(where.ticket_id || {}), [Op.in]: ids.length > 0 ? ids : [0] };
        }
    }

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
        const { count, rows } = await Ticket.findAndCountAll({
            where,
            include,
            limit: parsedLimit,
            offset,
            order: await buildOrder(sortBy, sortDir, models),
            subQuery: false,
            distinct: true,
        });

        logger.info(`/reports: ${count} tickets encontrados, devolviendo ${rows.length}`);

        // Enriquecer con Tipo de Solicitud (TPSolicitud)
        const enrichedRows = await enrichWithRequestType(rows, db);

        return res.status(200).json({
            tickets: enrichedRows,
            pagination: {
                total_items: count,
                total_pages: Math.ceil(count / parsedLimit),
                current_page: parsedPage,
                per_page: parsedLimit
            }
        });

    } catch (error) {
        logger.error(`/reports error: ${error.message}`);
        return res.status(500).json({
            message: 'Error interno del servidor al procesar la solicitud de reportes.',
            error: error.message
        });
    }
});

// GET /api/tickets/stats - DEPRECATED: getTicketCounts fue removida; usar /api/tickets/count
router.get('/stats', asyncHandler(async (req, res) => {
    res.status(410).json({
        error: 'Endpoint deprecado',
        message: 'Usar /api/tickets/count para obtener estadísticas de tickets'
    });
}));

// REMOVED: /stats/by-transport — referenced undefined Location model
// Transport data is now served via /stats/tickets-by-transport in statsRoutes.js

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

    // Ejecutar statusCounts y totalPendingCount en paralelo (de 3 queries seriales → 2 paralelas)
    const [statusCounts, totalPendingCount] = await Promise.all([
        // Conteos por estado (de estos se deriva totalTickets sumando)
        Ticket.findAll({
            attributes: [
                'status_id',
                [fn('COUNT', col('ticket_id')), 'count']
            ],
            include: [
                { model: TicketStatus, as: 'status', attributes: ['name'] },
                departmentInclude
            ],
            where,
            group: ['status_id', 'status.id'],
            raw: false
        }),
        // Total acumulado pendiente (sin filtro de fecha — siempre es "todos los abiertos")
        Ticket.count({
            include: [
                {
                    model: TicketStatus,
                    as: 'status',
                    where: { name: { [Op.notIn]: ['Resuelto', 'Cerrado'] } }
                },
                departmentInclude
            ]
        })
    ]);

    // Procesar conteos por estado
    let openTickets = 0;
    let closedTickets = 0;
    let pendingTickets = 0;
    const byStatus = {};
    
    let totalTickets = 0;
    statusCounts.forEach(item => {
        const statusName = item.status?.name?.toLowerCase() || '';
        const count = parseInt(item.dataValues.count) || 0;

        totalTickets += count;

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

// REMOVED: /export route — referenced undefined Team, Location, Topic models
// Export functionality should be reimplemented using existing models

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

    logger.info(`Se encontraron ${formattedStats.length} sectores con tickets`);
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
    // 1 sola query con subquery en lugar de 2 queries separadas
    const sectorOptions = await ListItems.findAll({
      attributes: ['id', 'value'],
      where: {
        id: {
          [Op.in]: db.literal('(SELECT DISTINCT sector FROM ost_ticket__cdata WHERE sector IS NOT NULL)')
        }
      },
      order: [['value', 'ASC']]
    });

    res.json(sectorOptions.map(s => ({ id: s.id, name: s.value })));
  } catch (error) {
    logger.error('Error obteniendo opciones de sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/options/transporte - Obtener opciones de transporte
router.get('/options/transporte', asyncHandler(async (req, res) => {
  try {
    // 1 sola query con subquery en lugar de 2 queries separadas
    const transporteOptions = await ListItems.findAll({
      attributes: ['id', 'value'],
      where: {
        id: {
          [Op.in]: db.literal('(SELECT DISTINCT transporte FROM ost_ticket__cdata WHERE transporte IS NOT NULL)')
        }
      },
      order: [['value', 'ASC']]
    });

    res.json(transporteOptions.map(t => ({ id: t.id, name: t.value || `ID: ${t.id}` })));
  } catch (error) {
    logger.error('Error obteniendo opciones de transporte:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}));

// GET /api/tickets/options/sla - Obtener opciones de SLA
// Simplificado: devuelve todos los SLA definidos en la tabla ost_sla
router.get('/options/sla', asyncHandler(async (req, res) => {
  logger.info('[DEBUG] /api/tickets/options/sla - Handler iniciado');
  try {
    const slaOptions = await SLA.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    logger.info(`[DEBUG] /api/tickets/options/sla - Query ejecutada, registros crudos: ${slaOptions.length}`);

    const formattedSla = slaOptions.map(sla => ({
      id: sla.id,
      name: sla.name
    }));

    logger.info(`[DEBUG] /api/tickets/options/sla - SLAs formateados: ${formattedSla.length}`);
    res.json(formattedSla);
  } catch (error) {
    logger.error('❌ Error obteniendo opciones de SLA (stack):', error.stack);
    logger.error('Error obteniendo opciones de SLA:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
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

// Helper: Obtener TPSolicitud (Tipo de Solicitud) para un array de tickets
// Hace un batch query y mergea el resultado en cada ticket
async function enrichWithRequestType(tickets, sequelizeInst) {
    if (!tickets || tickets.length === 0) return tickets;

    const ticketIds = tickets.map(t => t.ticket_id || t.dataValues?.ticket_id).filter(Boolean);
    if (ticketIds.length === 0) return tickets;

    try {
        // Usar field_id cacheado (evita 1 query por cada llamada a enrichWithRequestType)
        const fieldId = await getTpSolicitudFieldId();
        if (!fieldId) return tickets;

        // Batch query para todos los tickets de la página
        const values = await db.query(`
            SELECT fe.object_id AS ticket_id, fev.value AS raw_val
            FROM ost_form_entry_values fev
            INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
            WHERE fe.object_type = 'T'
              AND fev.field_id = :fieldId
              AND fe.object_id IN (:ticketIds)
              AND fev.value IS NOT NULL AND fev.value != ''
        `, {
            replacements: { fieldId, ticketIds },
            type: db.QueryTypes.SELECT
        });

        // Parsear JSON values → mapa ticket_id → nombre
        const parseValue = (raw) => {
            if (!raw) return null;
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'object' && parsed !== null) {
                    const vals = Object.values(parsed);
                    return vals.length > 0 ? String(vals[0]) : null;
                }
                return String(parsed);
            } catch { return String(raw); }
        };

        const map = {};
        for (const v of values) {
            map[v.ticket_id] = parseValue(v.raw_val);
        }

        // Mergear en tickets (funciona con objetos Sequelize y plain objects)
        return tickets.map(t => {
            const id = t.ticket_id || t.dataValues?.ticket_id;
            const plain = typeof t.toJSON === 'function' ? t.toJSON() : t;
            plain.requestType = map[id] || null;
            return plain;
        });
    } catch (err) {
        logger.error('Error enriching tickets with requestType:', err.message);
        return tickets;
    }
}

// GET /api/tickets/options/requestType - Obtener opciones de Tipo de Solicitud
router.get('/options/requestType', asyncHandler(async (req, res) => {
    try {
        // Usar field_id cacheado
        const fieldId = await getTpSolicitudFieldId();
        if (!fieldId) return res.json([]);

        const rows = await db.query(`
            SELECT DISTINCT fev.value AS raw_val
            FROM ost_form_entry_values fev
            INNER JOIN ost_form_entry fe ON fev.entry_id = fe.id
            INNER JOIN ost_ticket t ON fe.object_id = t.ticket_id
            INNER JOIN ost_department d ON t.dept_id = d.id
            WHERE fe.object_type = 'T'
              AND fev.field_id = :fieldId
              AND fev.value IS NOT NULL AND fev.value != ''
              AND d.name IN ('Soporte Informatico', 'Soporte IT')
        `, {
            replacements: { fieldId },
            type: db.QueryTypes.SELECT
        });

        // Parsear y deduplicar
        const seen = new Set();
        const options = [];
        for (const r of rows) {
            let name = r.raw_val;
            try {
                const parsed = JSON.parse(name);
                if (typeof parsed === 'object' && parsed !== null) {
                    name = String(Object.values(parsed)[0] || '');
                }
            } catch { /* plain string */ }
            if (name && !seen.has(name)) {
                seen.add(name);
                options.push({ id: name, name });
            }
        }
        options.sort((a, b) => a.name.localeCompare(b.name));
        res.json(options);
    } catch (error) {
        logger.error('Error obteniendo opciones de requestType:', error.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}));

// GET /api/tickets/:id - Obtener detalle completo de un ticket específico
router.get('/:id', asyncHandler(async (req, res) => {
    const ticketId = req.params.id;
    try {
        logger.info(`Consultando detalle para ticket ID: ${ticketId}`);

        // 1. Obtener el ticket principal
        const ticket = await Ticket.findOne({
            where: { ticket_id: ticketId },
            include: [
                {
                    model: TicketCdata,
                    as: 'cdata',
                    attributes: ['subject', 'sector', 'transporte'],
                    required: false
                }
            ]
        });

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
            logger.debug(`Threads encontrados para ticket ${ticketId}: ${ticketThreads.length}`);
            
        } catch (threadError) {
            logger.error(`Error obteniendo threads para ticket ${ticketId}:`, threadError.message);
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
