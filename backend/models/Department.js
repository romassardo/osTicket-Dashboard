const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  pid: { // Parent ID (for sub-departments)
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  tpl_id: { // Template ID
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  sla_id: { // SLA ID
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  schedule_id: { // Business Hours Schedule ID
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  email_id: { // Email ID
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  autoresp_email_id: { // Auto-response Email ID
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  manager_id: { // Manager (Staff ID)
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  flags: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: '',
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ispublic: {
    type: DataTypes.BOOLEAN, // tinyint(1) unsigned can be mapped to BOOLEAN
    allowNull: false,
    defaultValue: true,
  },
  group_membership: { // Corresponds to 'Department Members' setting in osTicket
    type: DataTypes.BOOLEAN, // tinyint(1)
    allowNull: false,
    defaultValue: false,
  },
  ticket_auto_response: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  message_auto_response: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  path: { // Path for parent departments, e.g., /support/billing
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: '/',
  },
  updated: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'ost_department',
  timestamps: true,
  createdAt: 'created',
  updatedAt: 'updated',
  underscored: true, // Asumiendo que las claves foráneas podrían ser snake_case en otros modelos
});

module.exports = Department;
