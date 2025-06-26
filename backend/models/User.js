const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    org_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false // DB: NOT NULL
        // FK to ost_organization table
    },
    default_email_id: {
        type: DataTypes.INTEGER, // In osTicket schema, this is often INT, not UNSIGNED
        allowNull: false // DB: NOT NULL
        // FK to ost_user_email table
    },
    status: {
        type: DataTypes.INTEGER(8).UNSIGNED, // Corresponds to int(8) unsigned in osTicket for status flags
        allowNull: false,
        defaultValue: 0 // Default status, e.g., active/registered
    },
    name: {
        // The 'name' might be stored directly, or in a related cdata table, or split into first/last.
        // For now, we'll define it as a string. This can be adjusted if needed.
        type: DataTypes.STRING(128),
        allowNull: false // DB: NOT NULL
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
    tableName: 'ost_user', // Especifica el nombre exacto de la tabla en la BD de osTicket
    timestamps: false,     // osTicket maneja sus propias columnas 'created' y 'updated'.
    underscored: true,     // Asume que los nombres de columna en la BD usan guion bajo (snake_case)
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

// Las asociaciones con otros modelos (Ticket, Organization, UserEmail)
// se definirán más adelante, después de crear esos modelos.
// Ejemplo:
// User.hasMany(models.Ticket, { foreignKey: 'user_id' });
// User.belongsTo(models.Organization, { foreignKey: 'org_id' });

module.exports = User;