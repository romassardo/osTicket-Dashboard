const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TicketStatus = sequelize.define('TicketStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
    defaultValue: '', // Coincide con el 'Default: ' vacío de la estructura
  },
  state: {
    type: DataTypes.STRING(16),
    allowNull: true, // 'YES' para Nulo
  },
  mode: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  flags: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  sort: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  properties: {
    type: DataTypes.TEXT,
    allowNull: false, // Aunque el default es 'null', la columna es NOT NULL. El contenido será texto, a menudo JSON.
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'ost_ticket_status', // Nombre exacto de la tabla en la BD
  timestamps: true, // Habilita timestamps gestionados por Sequelize
  createdAt: 'created',   // Mapea la columna 'created' de la BD a 'createdAt' de Sequelize
  updatedAt: 'updated',   // Mapea la columna 'updated' de la BD a 'updatedAt' de Sequelize
  underscored: true,      // Si las columnas de la BD usan snake_case (como created_at), esto ayuda. En este caso, 'created' y 'updated' son nombres directos.
                          // Lo mantenemos por si otros modelos lo necesitan y para consistencia, aunque aquí no es estrictamente necesario para 'created'/'updated'.
});

module.exports = TicketStatus;
