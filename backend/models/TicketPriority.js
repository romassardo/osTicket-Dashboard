const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketPriority = sequelize.define('TicketPriority', {
  priority_id: {
    type: DataTypes.TINYINT, // tinyint(4)
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  priority: { // Nombre de la prioridad, ej: 'High', 'Low'
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
    defaultValue: '',
  },
  priority_desc: { // Descripción corta o etiqueta
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: '',
  },
  priority_color: { // Color hexadecimal, ej: '#FF0000'
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '',
  },
  priority_urgency: { // Nivel de urgencia, usado para ordenar
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  ispublic: { // Si la prioridad es visible públicamente
    type: DataTypes.BOOLEAN, // tinyint(1)
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'ost_ticket_priority',
  timestamps: false, // Esta tabla no tiene campos 'created' o 'updated'
  underscored: true, // Para consistencia, aunque no hay campos que lo necesiten aquí
});

module.exports = TicketPriority;
