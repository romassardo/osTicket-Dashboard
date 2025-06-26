const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Staff = sequelize.define('Staff', {
  staff_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  dept_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  role_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  username: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    defaultValue: '',
  },
  firstname: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  lastname: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  passwd: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  backend: {
    type: DataTypes.STRING(32),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(24),
    allowNull: false,
    defaultValue: '',
  },
  phone_ext: {
    type: DataTypes.STRING(6),
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING(24),
    allowNull: false,
    defaultValue: '',
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: false, // La BD dice NOT NULL, aunque el default es NULL, lo que es contradictorio.
                      // Sequelize requiere un valor si allowNull es false.
                      // Asumiremos que debe tener un valor, quizás vacío.
  },
  lang: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  timezone: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
  locale: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isactive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isadmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isvisible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  onvacation: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  assigned_only: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  show_assigned_tickets: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  change_passwd: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  max_page_size: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  auto_refresh_rate: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  default_signature_type: {
    type: DataTypes.ENUM('none', 'mine', 'dept'),
    allowNull: false,
    defaultValue: 'none',
  },
  default_paper_size: {
    type: DataTypes.ENUM('Letter', 'Legal', 'Ledger', 'A4', 'A3'),
    allowNull: false,
    defaultValue: 'Letter',
  },
  extra: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  permissions: { // Podría ser JSON, pero TEXT es seguro
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lastlogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwdreset: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updated: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'ost_staff',
  timestamps: true,
  createdAt: 'created',
  updatedAt: 'updated',
  // Sequelize no maneja 'lastlogin' o 'passwdreset' automáticamente como timestamps.
  // Se tratarán como campos de fecha normales.
  underscored: true, 
});

module.exports = Staff;
