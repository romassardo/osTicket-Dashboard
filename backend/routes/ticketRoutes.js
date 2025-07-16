// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const { Ticket, User, TicketStatus, Department, Staff, TicketCdata, List, ListItems, HelpTopic, Organization, sequelize } = require('../models'); // Import sequelize for Op
const { Op } = require('sequelize'); // Assuming models are exported from ../models/index.js
const logger = require('../utils/logger');

// GET all tickets
router.get('/', async (req, res, next) => {
  try {
    // Filtros dinámicos, búsqueda y paginación
    const { statuses, priority_id, startDate, endDate, search, page, limit, organization, staff, transporte, sector } = req.query;

    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    // Paginación - simplificada para manejar límites altos
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const offset = (currentPage - 1) * itemsPerPage;
    
    // Para exportación, si el límite es muy alto (>1000), consideramos que quiere todos los registros
    const isExportRequest = itemsPerPage > 1000;

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

    if (sector) {
      const sectorId = parseInt(sector, 10);
      if (!isNaN(sectorId)) {
        whereTicketCondition['$cdata.sector$'] = sectorId;
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

    // OPTIMIZACIÓN: Configuración de consulta optimizada para eliminar queries N+1
    const baseInclude = [
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
        attributes: ['id', 'name', 'state'],
        required: false
      },
      {
        model: Staff,
        as: 'AssignedStaff',
        attributes: ['staff_id', 'firstname', 'lastname'],
        required: false
      },
      {
        model: TicketCdata,
        as: 'cdata',
        attributes: ['subject', 'sector', 'transporte'],
        include: [
          {
            model: ListItems,
            as: 'TransporteName',
            attributes: ['id', 'value'],
            required: false
          },
          {
            model: ListItems,
            as: 'SectorName',
            attributes: ['id', 'value'],
            required: false
          }
        ],
        required: false
      },
      departmentInclude
    ];

    // OPTIMIZACIÓN: Separar conteo de datos para mejor performance
    let result;
    if (!isExportRequest) {
      // Consulta optimizada para conteo - incluir TicketCdata solo si hay filtro de transporte
      const countInclude = [
        {
          model: User,
          as: 'user',
          attributes: [],
          where: Object.keys(whereUserCondition).length > 0 ? whereUserCondition : null,
          required: true
        },
        {
          model: Department,
          as: 'department',
          where: { name: { [Op.in]: allowedDepartmentNames } },
          attributes: [],
          required: true
        }
      ];

      // BUGFIX: Agregar TicketCdata si hay filtro de transporte o sector
      if (transporte || sector) {
        countInclude.push({
          model: TicketCdata,
          as: 'cdata',
          attributes: [],
          required: false
        });
      }

      const countQuery = {
        where: whereTicketCondition,
        include: countInclude,
        distinct: true
      };

      // Consulta optimizada para datos
      const dataQuery = {
        where: whereTicketCondition,
        include: baseInclude,
        order: [['created', 'DESC']],
        limit: itemsPerPage,
        offset: offset,
        subQuery: false
      };

      // Ejecutar ambas consultas en paralelo
      const [totalCount, rows] = await Promise.all([
        Ticket.count(countQuery),
        Ticket.findAll(dataQuery)
      ]);

      // Post-procesamiento: Obtener nombres de transporte y sector de forma eficiente
      const ticketIds = rows.map(ticket => ticket.ticket_id);
      const transporteMap = new Map();
      const sectorMap = new Map();

      if (ticketIds.length > 0) {
        try {
          // MÉTODO 1: Intentar con asociaciones Sequelize
          const cdataWithTransportes = await TicketCdata.findAll({
            where: { ticket_id: { [Op.in]: ticketIds } },
            include: [
              {
                model: ListItems,
                as: 'TransporteName',
                attributes: ['id', 'value'],
                required: false
              },
              {
                model: ListItems,
                as: 'SectorName',
                attributes: ['id', 'value'],
                required: false
              }
            ],
            attributes: ['ticket_id', 'transporte', 'sector']
          });

          // Crear mapas para lookups eficientes
          cdataWithTransportes.forEach(cdata => {
            if (cdata.TransporteName) {
              transporteMap.set(cdata.ticket_id, cdata.TransporteName.value);
            }
            if (cdata.SectorName) {
              sectorMap.set(cdata.ticket_id, cdata.SectorName.value);
            }
          });

          logger.info(`📊 NORMAL: TransporteMap size: ${transporteMap.size}, SectorMap size: ${sectorMap.size}`);

          // MÉTODO 2: Si el Método 1 falló, usar consulta SQL directa como fallback
          if (transporteMap.size === 0 && sectorMap.size === 0) {
            logger.warn('📊 FALLBACK: Usando consulta SQL directa para obtener nombres');
            
            const transporteQuery = `
              SELECT tc.ticket_id, li.value as transporte_name
              FROM ost_ticket__cdata tc
              INNER JOIN ost_list_items li ON tc.transporte = li.id
              WHERE tc.ticket_id IN (${ticketIds.join(',')}) AND tc.transporte IS NOT NULL
            `;

            const sectorQuery = `
              SELECT tc.ticket_id, li.value as sector_name  
              FROM ost_ticket__cdata tc
              INNER JOIN ost_list_items li ON tc.sector = li.id
              WHERE tc.ticket_id IN (${ticketIds.join(',')}) AND tc.sector IS NOT NULL
            `;

            const [transporteResults, sectorResults] = await Promise.all([
              sequelize.query(transporteQuery, { type: sequelize.QueryTypes.SELECT }),
              sequelize.query(sectorQuery, { type: sequelize.QueryTypes.SELECT })
            ]);

            // Poblar mapas desde resultados SQL directos
            transporteResults.forEach(result => {
              transporteMap.set(result.ticket_id, result.transporte_name);
            });

            sectorResults.forEach(result => {
              sectorMap.set(result.ticket_id, result.sector_name);
            });

            logger.info(`📊 FALLBACK: TransporteMap size: ${transporteMap.size}, SectorMap size: ${sectorMap.size}`);
          }

        } catch (error) {
          logger.error('📊 ERROR en post-procesamiento:', error);
        }
      }

      // Agregar nombres de transporte y sector a los resultados
      rows.forEach(ticket => {
        if (ticket.cdata) {
          ticket.cdata.dataValues.transporteName = transporteMap.get(ticket.ticket_id) || null;
          ticket.cdata.dataValues.sectorName = sectorMap.get(ticket.ticket_id) || null;
        }
      });

      const totalPages = Math.ceil(totalCount / itemsPerPage);

      res.json({
        data: rows,
        pagination: {
          total_items: totalCount,
          total_pages: totalPages,
          current_page: currentPage,
          items_per_page: itemsPerPage
        }
      });
    } else {
      // OPTIMIZACIÓN: Para exportación, usar consulta simplificada
      const exportQuery = {
        where: whereTicketCondition,
        include: baseInclude,
        order: [['created', 'DESC']],
        subQuery: false
      };

      const rows = await Ticket.findAll(exportQuery);

      // Post-procesamiento para exportación
      const ticketIds = rows.map(ticket => ticket.ticket_id);
      const transporteMap = new Map();
      const sectorMap = new Map();

      logger.info(`📊 DEBUG EXPORTACIÓN: Procesando ${ticketIds.length} tickets para exportación`);

      if (ticketIds.length > 0) {
        try {
          // MÉTODO 1: Intentar con asociaciones Sequelize
          const cdataWithTransportes = await TicketCdata.findAll({
            where: { ticket_id: { [Op.in]: ticketIds } },
            include: [
              {
                model: ListItems,
                as: 'TransporteName',
                attributes: ['id', 'value'],
                required: false
              },
              {
                model: ListItems,
                as: 'SectorName',
                attributes: ['id', 'value'],
                required: false
              }
            ],
            attributes: ['ticket_id', 'transporte', 'sector']
          });

          logger.info(`📊 DEBUG EXPORTACIÓN: Encontrados ${cdataWithTransportes.length} registros de cdata`);

          cdataWithTransportes.forEach(cdata => {
            logger.info(`📊 DEBUG EXPORTACIÓN: Ticket ${cdata.ticket_id} - transporte: ${cdata.transporte}, TransporteName: ${cdata.TransporteName?.value || 'null'}`);
            
            if (cdata.TransporteName) {
              transporteMap.set(cdata.ticket_id, cdata.TransporteName.value);
            }
            if (cdata.SectorName) {
              sectorMap.set(cdata.ticket_id, cdata.SectorName.value);
            }
          });

          logger.info(`📊 DEBUG EXPORTACIÓN: TransporteMap size: ${transporteMap.size}`);

          // MÉTODO 2: Si el Método 1 falló, usar consulta SQL directa como fallback
          if (transporteMap.size === 0 && sectorMap.size === 0) {
            logger.warn('📊 EXPORTACIÓN FALLBACK: Usando consulta SQL directa para obtener nombres');
            
            const transporteQuery = `
              SELECT tc.ticket_id, li.value as transporte_name
              FROM ost_ticket__cdata tc
              INNER JOIN ost_list_items li ON tc.transporte = li.id
              WHERE tc.ticket_id IN (${ticketIds.join(',')}) AND tc.transporte IS NOT NULL
            `;

            const sectorQuery = `
              SELECT tc.ticket_id, li.value as sector_name  
              FROM ost_ticket__cdata tc
              INNER JOIN ost_list_items li ON tc.sector = li.id
              WHERE tc.ticket_id IN (${ticketIds.join(',')}) AND tc.sector IS NOT NULL
            `;

            const [transporteResults, sectorResults] = await Promise.all([
              sequelize.query(transporteQuery, { type: sequelize.QueryTypes.SELECT }),
              sequelize.query(sectorQuery, { type: sequelize.QueryTypes.SELECT })
            ]);

            // Poblar mapas desde resultados SQL directos
            transporteResults.forEach(result => {
              transporteMap.set(result.ticket_id, result.transporte_name);
            });

            sectorResults.forEach(result => {
              sectorMap.set(result.ticket_id, result.sector_name);
            });

            logger.info(`📊 EXPORTACIÓN FALLBACK: TransporteMap size: ${transporteMap.size}, SectorMap size: ${sectorMap.size}`);
          }

        } catch (error) {
          logger.error('📊 ERROR en post-procesamiento de exportación:', error);
        }
      }

      rows.forEach(ticket => {
        if (ticket.cdata) {
          const transporteName = transporteMap.get(ticket.ticket_id) || null;
          const sectorName = sectorMap.get(ticket.ticket_id) || null;
          
          ticket.cdata.dataValues.transporteName = transporteName;
          ticket.cdata.dataValues.sectorName = sectorName;
          
          logger.info(`📊 DEBUG EXPORTACIÓN: Ticket ${ticket.ticket_id} - Final transporteName: ${transporteName}`);
        }
      });
      
      res.json({
        data: rows,
        pagination: {
          total_items: rows.length,
          total_pages: 1,
          current_page: 1,
          items_per_page: rows.length
        }
      });
    }
  } catch (error) {
    logger.error('Error in GET /api/tickets:', error);
    next(error);
  }
});

// GET ticket count
router.get('/count', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const allowedDepartmentNames = ['Soporte Informatico', 'Soporte IT'];

    logger.info(`Count endpoint called with dates: ${startDate} - ${endDate}`);

    const replacements = {};
    let whereDateClause = "";

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      whereDateClause = "AND t.created BETWEEN :startDate AND :endDate";
      replacements.startDate = start;
      replacements.endDate = end;
      
      logger.info(`Date filter applied: ${start.toISOString()} - ${end.toISOString()}`);
    }

    // Query 1: Obtener estadísticas por estado para el rango de fechas (o todos los tiempos si no hay fecha)
    const dateStatsQuery = `
        SELECT
            ts.state,
            ts.name AS statusName,
            COUNT(t.ticket_id) AS statusCount
        FROM ost_ticket t
        JOIN ost_department d ON t.dept_id = d.id
        JOIN ost_ticket_status ts ON t.status_id = ts.id
        WHERE
            d.name IN ('Soporte Informatico', 'Soporte IT')
            ${whereDateClause}
        GROUP BY ts.name, ts.state
        ORDER BY ts.name;
    `;

    // Query 2: Obtener el conteo total de tickets abiertos de todos los tiempos
    const totalOpenQuery = `
        SELECT COUNT(*) as totalOpenCount
        FROM ost_ticket t
        JOIN ost_department d ON t.dept_id = d.id
        JOIN ost_ticket_status ts ON t.status_id = ts.id
        WHERE
            d.name IN ('Soporte Informatico', 'Soporte IT')
            AND ts.state = 'open';
    `;
    
    logger.info('Executing count queries...');
    
    const [dateStatsResults, totalOpenResult] = await Promise.all([
      sequelize.query(dateStatsQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(totalOpenQuery, {
        type: sequelize.QueryTypes.SELECT
      })
    ]);
    
    logger.info(`Date stats results count: ${dateStatsResults?.length || 0}`);
    logger.info(`Total open result: ${JSON.stringify(totalOpenResult)}`);
    
    // BUGFIX: Corregir acceso a resultado de la consulta SQL
    const totalOpenCount = totalOpenResult[0]?.totalOpenCount || 0;
    
    let totalInDateRange = 0;
    let openInDateRange = 0;
    let closedInDateRange = 0;
    const byStatus = {};

    if (dateStatsResults && Array.isArray(dateStatsResults)) {
      dateStatsResults.forEach(row => {
          const count = parseInt(row.statusCount, 10);
          totalInDateRange += count;
          if (row.state === 'open') {
              openInDateRange += count;
          } else if (row.state === 'closed') {
              closedInDateRange += count;
          }
          byStatus[row.statusName] = (byStatus[row.statusName] || 0) + count;
      });
    }

    const result = {
      totalInDateRange: totalInDateRange,
      openInDateRange: openInDateRange,
      closedInDateRange: closedInDateRange,
      byStatus,
      totalOpen: parseInt(totalOpenCount, 10),
    };

    logger.info(`Count result: ${JSON.stringify(result)}`);
    res.json(result);

  } catch (error) {
    logger.error('Error in GET /api/tickets/count:', error);
    logger.error('Error stack:', error.stack);
    next(error);
  }
});

// OPTIMIZACIÓN: GET unique values for 'transporte' field - consulta directa optimizada
router.get('/options/transporte', async (req, res, next) => {
  try {
    // OPTIMIZACIÓN: Consulta SQL directa para obtener transportes únicos sin cargar todos los tickets
    const transporteQuery = `
      SELECT DISTINCT li.id, li.value 
      FROM ost_list_items li
      INNER JOIN ost_ticket__cdata tc ON li.id = tc.transporte
      INNER JOIN ost_ticket t ON tc.ticket_id = t.ticket_id
      INNER JOIN ost_department d ON t.dept_id = d.id
      WHERE d.name IN ('Soporte Informatico', 'Soporte IT')
      AND li.value IS NOT NULL 
      AND li.value != ''
      ORDER BY li.value ASC
    `;

    const transporteResults = await sequelize.query(transporteQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    // Transformar resultados al formato esperado
    const transporteItems = transporteResults.map(item => ({
      id: parseInt(item.id, 10),
      value: item.value
    }));

    // Si no hay resultados, usar valores predeterminados
    if (transporteItems.length === 0) {
      logger.info("No transport items found. Using default values.");
      const defaultTransportes = [
        { id: 1, value: "Auto" },
        { id: 2, value: "Camioneta" },
        { id: 3, value: "Camión" },
        { id: 4, value: "Moto" },
        { id: 5, value: "Otro" }
      ];
      return res.json(defaultTransportes);
    }

    logger.info(`Found ${transporteItems.length} transport items using optimized query`);
    res.json(transporteItems);
  } catch (error) {
    logger.error(`Error fetching /options/transporte:`, error);
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
        logger.info(`Found ${data.length} organizations from /organizations/simple`);
        return res.json(data);
      }
    } catch (fetchError) {
      logger.warn(`Could not fetch from /organizations/simple: ${fetchError.message}`);
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
      logger.info(`Found ${organizations.length} organizations from direct query`);
      return res.json(organizations);
    }
    
    // Si no hay resultados, usar valores predeterminados
    logger.warn("No organizations found. Using default values.");
    return res.json([
      { id: 1, name: "Casa Central" },
      { id: 2, name: "Sucursal Norte" },
      { id: 3, name: "Sucursal Sur" },
      { id: 4, name: "Sucursal Este" },
      { id: 5, name: "Sucursal Oeste" }
    ]);
  } catch (error) {
    logger.error(`Error fetching /options/sector:`, error);
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
    logger.error('Error en /stats/by-agent:', error);
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
    logger.error('Error en /stats/tendencies:', error);
    next(error);
  }
});

module.exports = router;
