// backend/models/List.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

class List extends Model {}

List.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // Add other fields from ost_list table if needed
}, {
  sequelize,
  modelName: 'List',
  tableName: 'ost_list',
  timestamps: false // osTicket tables usually don't have createdAt/updatedAt
});

module.exports = List;
