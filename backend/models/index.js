const sequelize = require('../config/db');
const { Sequelize } = require('sequelize'); // Importar Sequelize clase

// Importar modelos
const User = require('./User');
const Ticket = require('./Ticket');
const TicketStatus = require('./TicketStatus');
const Department = require('./Department');
const Staff = require('./Staff');
const Organization = require('./Organization');
const TicketPriority = require('./TicketPriority');
const helpTopicFactory = require('./HelpTopic');
const TicketCdata = require('./TicketCdata'); // Importa directamente el modelo
const ListItems = require('./ListItems'); // Modelo para los nombres de los sectores
const List = require('./List');
const HelpTopic = helpTopicFactory(sequelize); // HelpTopic sí es una fábrica

const db = {
  sequelize,
  Sequelize, // Exportar la clase Sequelize
  User,
  Ticket,
  TicketStatus,
  Department,
  Staff,
  Organization,
  TicketPriority,
  HelpTopic,
  TicketCdata,
  ListItems,
  List,
  models: {
    User,
    Ticket,
    TicketStatus,
    Department,
    Staff,
    Organization,
    TicketPriority,
    HelpTopic,
    TicketCdata,
    ListItems,
    List,
  }
};

// --- Definir Asociaciones ---

// Ticket <-> User
// Un Ticket pertenece a un User (creador). FK: Ticket.user_id -> User.id
Ticket.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });
User.hasMany(Ticket, { foreignKey: 'user_id', sourceKey: 'id', as: 'tickets' });

// Ticket <-> Staff (asignado)
// Un Ticket puede ser asignado a un Staff. FK: Ticket.staff_id -> Staff.staff_id
Ticket.belongsTo(Staff, { foreignKey: 'staff_id', targetKey: 'staff_id', as: 'AssignedStaff' });
Staff.hasMany(Ticket, { foreignKey: 'staff_id', sourceKey: 'staff_id', as: 'AssignedTickets' });

// Ticket <-> Department
// Un Ticket pertenece a un Department. FK: Ticket.dept_id -> Department.id
Ticket.belongsTo(Department, { foreignKey: 'dept_id', targetKey: 'id', as: 'department' });
Department.hasMany(Ticket, { foreignKey: 'dept_id', sourceKey: 'id', as: 'tickets' });

// Ticket <-> TicketStatus
// Un Ticket tiene un TicketStatus. FK: Ticket.status_id -> TicketStatus.id
Ticket.belongsTo(TicketStatus, { foreignKey: 'status_id', targetKey: 'id', as: 'status' });
TicketStatus.hasMany(Ticket, { foreignKey: 'status_id', sourceKey: 'id', as: 'tickets' });

// User <-> Organization
// Un User puede pertenecer a una Organization. FK: User.org_id -> Organization.id
User.belongsTo(Organization, { foreignKey: 'org_id', targetKey: 'id' });
Organization.hasMany(User, { foreignKey: 'org_id', sourceKey: 'id', as: 'users' });

// Staff <-> Department
// Un Staff pertenece a un Department. FK: Staff.dept_id -> Department.id
Staff.belongsTo(Department, { foreignKey: 'dept_id', targetKey: 'id', as: 'department' });
Department.hasMany(Staff, { foreignKey: 'dept_id', sourceKey: 'id' });


// Relaciones a través de HelpTopic
Ticket.belongsTo(HelpTopic, { foreignKey: 'topic_id', targetKey: 'topic_id' });
HelpTopic.hasMany(Ticket, { foreignKey: 'topic_id', sourceKey: 'topic_id' });
HelpTopic.belongsTo(TicketPriority, { foreignKey: 'priority_id', targetKey: 'priority_id' });
TicketPriority.hasMany(HelpTopic, { foreignKey: 'priority_id', sourceKey: 'priority_id' });

// Ticket <-> TicketCdata  // <--- NUEVA ASOCIACIÓN
// Un Ticket tiene datos adicionales en TicketCdata. FK: TicketCdata.ticket_id -> Ticket.ticket_id
Ticket.hasOne(TicketCdata, { foreignKey: 'ticket_id', sourceKey: 'ticket_id', as: 'cdata' });
TicketCdata.belongsTo(Ticket, { foreignKey: 'ticket_id', targetKey: 'ticket_id' });

// TicketCdata <-> ListItems (para el campo 'sector')
// El campo 'sector' en TicketCdata es el ID de un item en ListItems.
TicketCdata.belongsTo(ListItems, { foreignKey: 'sector', targetKey: 'id', as: 'SectorName' });

// TicketCdata <-> ListItems (para el campo 'transporte')
// El campo 'transporte' en TicketCdata es el ID de un item en ListItems.
TicketCdata.belongsTo(ListItems, { foreignKey: 'transporte', targetKey: 'id', as: 'TransporteName' });


// Opcional: Sincronizar modelos (mejor hacerlo en server.js al iniciar)
// db.sequelize.sync({ alter: true }).then(() => {
//   console.log('Base de datos y tablas sincronizadas!');
// });

module.exports = db;
