const { Sequelize } = require('sequelize');

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
    logging: false, // Desactiva los logs de Sequelize en la consola. Cambia a console.log para ver las consultas SQL.
    dialectOptions: {
      // debug: true, // Habilitar logs de depuración para mysql2
      // Opciones específicas del dialecto MySQL si son necesarias
      // Por ejemplo, para problemas de autenticación con versiones más nuevas de MySQL:
      // authPlugin: 'mysql_native_password'
    },
    pool: { // Configuración opcional del pool de conexiones
      max: 5, // Máximo número de conexiones en el pool
      min: 0, // Mínimo número de conexiones en el pool
      acquire: 30000, // Tiempo máximo, en milisegundos, que el pool intentará obtener una conexión antes de lanzar un error
      idle: 10000 // Tiempo máximo, en milisegundos, que una conexión puede estar inactiva antes de ser liberada
    }
  }
);

// Opcional: Probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

// testConnection(); // Puedes descomentar esto temporalmente para probar al iniciar la app, pero luego coméntalo o muévelo.

module.exports = sequelize;
