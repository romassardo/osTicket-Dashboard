const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: '',
  },
  manager: { // En osTicket, esto parece ser un campo de texto libre, no una FK directa.
    type: DataTypes.STRING(16),
    allowNull: false,
    defaultValue: '',
  },
  status: { // Podría representar flags o un ID de estado.
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  domain: { // Usado para la auto-asignación de usuarios.
    type: DataTypes.STRING(256),
    allowNull: false,
    defaultValue: '',
  },
  extra: { // Para datos adicionales, a menudo JSON.
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // 'created' y 'updated' son timestamps.
  // Sequelize maneja 'createdAt' y 'updatedAt' automáticamente.
  // Si la BD ya tiene 'on update current_timestamp()' para 'updated', Sequelize lo respetará.
  // Si 'created' puede ser NULL y tiene un DEFAULT NULL, lo marcamos como allowNull: true
  created: {
    type: DataTypes.DATE, // Sequelize usa DataTypes.DATE para TIMESTAMP
    allowNull: true,    // Basado en 'Nulo: YES'
    defaultValue: DataTypes.NOW, // O podría ser null si la BD lo maneja
  },
  updated: {
    type: DataTypes.DATE,
    allowNull: true,    // Basado en 'Nulo: YES'
    // defaultValue: DataTypes.NOW, // Sequelize actualizará esto si timestamps: true
  }
}, {
  tableName: 'ost_organization',
  timestamps: true, // Esto le dirá a Sequelize que maneje createdAt y updatedAt.
                    // Sequelize intentará usar columnas llamadas 'createdAt' y 'updatedAt'.
                    // Necesitamos mapearlas a 'created' y 'updated'.
  createdAt: 'created',
  updatedAt: 'updated',
  underscored: true, // Aunque 'created' y 'updated' no son snake_case, es buena práctica si otras FKs lo son.
});

module.exports = Organization;
