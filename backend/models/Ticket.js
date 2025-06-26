const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ticket = sequelize.define('Ticket', {
    ticket_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
        // FK to ost_user
    },
    status_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
        // FK to ost_ticket_status
    },
    dept_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
        // FK to ost_department
    },
    staff_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false // DB: NOT NULL, Default: 0
        // FK to ost_staff
    },
    team_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false // DB: NOT NULL, Default: 0
        // FK to ost_team
    },
    sla_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false // DB: NOT NULL, Default: 0
        // FK to ost_sla
    },
    topic_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false // DB: NOT NULL, Default: 0
        // FK to ost_help_topic
    },

    source: {
        type: DataTypes.STRING(32), // Examples: 'Web', 'Email', 'Phone', 'API', 'Other'
        allowNull: false
    },
    isoverdue: {
        type: DataTypes.BOOLEAN, // TINYINT(1) in MySQL
        allowNull: false,
        defaultValue: 0
    },
    isanswered: {
        type: DataTypes.BOOLEAN, // TINYINT(1) in MySQL
        allowNull: false,
        defaultValue: 0
    },
    duedate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    closed: {
        type: DataTypes.DATE,
        allowNull: true
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
    tableName: 'ost_ticket', // Especifica el nombre exacto de la tabla en la BD de osTicket
    timestamps: false,      // Deshabilita los timestamps automáticos de Sequelize (createdAt, updatedAt)
                            // ya que osTicket maneja sus propias columnas 'created' y 'updated'.
    underscored: true,
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

// Las asociaciones con otros modelos (User, TicketStatus, Department, Staff, etc.)
// se definirán más adelante, después de crear esos modelos.
// Ejemplo:
// Ticket.belongsTo(models.User, { foreignKey: 'user_id' });
// Ticket.belongsTo(models.TicketStatus, { foreignKey: 'status_id' });

module.exports = Ticket;