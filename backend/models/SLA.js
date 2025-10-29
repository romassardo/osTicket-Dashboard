const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SLA = sequelize.define(
  'SLA',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'name'
    },
    grace_period: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'grace_period',
      comment: 'Período de gracia en horas para cumplir el SLA'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notes'
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created'
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated'
    }
  },
  {
    tableName: 'ost_sla',
    timestamps: false,
    freezeTableName: true
  }
);

module.exports = SLA;
