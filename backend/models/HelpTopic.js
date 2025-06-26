// backend/models/HelpTopic.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HelpTopic = sequelize.define('HelpTopic', {
    topic_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    topic: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    topic_pid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    isactive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    ispublic: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    noautoresp: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    priority_id: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sla_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    page_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sequence_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    topic_page_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'ost_help_topic',
    timestamps: false
  });

  // Definición de las asociaciones cuando el modelo es inicializado
  HelpTopic.associate = (models) => {
    // HelpTopic pertenece a un Department
    HelpTopic.belongsTo(models.Department, {
      foreignKey: 'dept_id'
    });

    // HelpTopic pertenece a una TicketPriority
    HelpTopic.belongsTo(models.TicketPriority, {
      foreignKey: 'priority_id'
    });

    // HelpTopic pertenece a un Staff (como ApprovedStaff)
    HelpTopic.belongsTo(models.Staff, {
      foreignKey: 'staff_id',
      as: 'ApprovedStaff'
    });

    // HelpTopic tiene muchos Tickets
    HelpTopic.hasMany(models.Ticket, {
      foreignKey: 'topic_id'
    });
  };

  return HelpTopic;
};