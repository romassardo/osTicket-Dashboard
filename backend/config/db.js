const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Las variables de entorno ya deberían estar cargadas por dotenv en server.js
// Si este archivo se usara de forma independiente, se necesitaría:
// require('dotenv').config({ path: '../.env' }); // Ajustar ruta si es necesario

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, // Puerto por defecto de MySQL si no se especifica
    dialect: 'mysql',
    logging: (sql) => {
      logger.info(`[SEQUELIZE QUERY] ${sql}`);
    }, // Forzar el logging de SQL para depuración
    dialectOptions: {
      // debug: true, // Habilitar logs de depuración para mysql2
      // Opciones específicas del dialecto MySQL si son necesarias
      // Por ejemplo, para problemas de autenticación con versiones más nuevas de MySQL:
      // authPlugin: 'mysql_native_password'
    },
    pool: { // Configuración optimizada del pool de conexiones para mejor performance
      max: 20, // Aumentado: Máximo número de conexiones en el pool
      min: 5, // Mínimo número de conexiones mantenidas activas
      acquire: 60000, // Aumentado: Tiempo máximo para obtener una conexión
      idle: 300000, // Aumentado: 5 minutos antes de liberar conexión inactiva
      evict: 60000 // Nuevo: Revisar conexiones inactivas cada minuto
    }
  }
);

// Opcional: Probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    logger.error('No se pudo conectar a la base de datos:', error);
  }
}

// testConnection(); // Puedes descomentar esto temporalmente para probar al iniciar la app, pero luego coméntalo o muévelo.

module.exports = sequelize;
