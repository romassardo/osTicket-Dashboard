const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ListItems = sequelize.define('ListItems', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  list_id: {
    type: DataTypes.INTEGER,
    field: 'list_id'
  },
  status: {
    type: DataTypes.INTEGER,
    field: 'status'
  },
  value: {
    type: DataTypes.STRING,
    field: 'value'
  },
  extra: {
    type: DataTypes.STRING,
    field: 'extra'
  }
}, {
  tableName: 'ost_list_items',
  timestamps: false
});

module.exports = ListItems;
