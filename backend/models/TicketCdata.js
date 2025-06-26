// backend/models/TicketCdata.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ajusta la ruta si es diferente

const TicketCdata = sequelize.define('TicketCdata', {
  ticket_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'ost_ticket', // Nombre de la tabla referenciada
      key: 'ticket_id'
    }
  },
  subject: {
    type: DataTypes.TEXT, // O STRING(255) si es más apropiado, TEXT permite más longitud
    allowNull: true // O false si el asunto siempre es requerido
  },
  sector: { // Corresponde al campo personalizado con field_id=36, name='sector'
    type: DataTypes.STRING(255), // Ajustar el tipo y longitud si es necesario
    allowNull: true // Los campos personalizados pueden no estar llenos
  },
  transporte: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
  // Aquí se podrían añadir otros campos de la tabla ost_ticket__cdata si son necesarios
}, {
  tableName: 'ost_ticket__cdata',
  timestamps: false, // ost_ticket__cdata no suele tener timestamps propios
  underscored: true, // Asumiendo que las columnas en la BD usan snake_case
  engine: 'InnoDB',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

module.exports = TicketCdata;
