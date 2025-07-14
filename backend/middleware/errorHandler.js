// backend/middleware/errorHandler.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('ERROR DETECTADO:', err); // Loguear el error completo en el servidor

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Ha ocurrido un error inesperado en el servidor.';
  let errors = err.errors || undefined; // Para errores de validación de Sequelize

  // Manejo específico para errores de Sequelize
  if (err instanceof Sequelize.ValidationError) {
    statusCode = 400; // Bad Request
    message = 'Error de validación.';
    errors = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    statusCode = 409; // Conflict
    message = 'Error de restricción única. Ya existe un registro con esos datos.';
    errors = err.errors.map(e => ({ field: e.path, message: e.message, value: e.value }));
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    statusCode = 400; // Bad Request o 409 Conflict dependiendo del contexto
    message = 'Error de clave foránea. Uno de los recursos relacionados no existe o la operación viola una restricción.';
  } else if (err instanceof Sequelize.DatabaseError) { // Errores más genéricos de la BD
    statusCode = 500;
    message = 'Error en la base de datos.';
    // No exponer err.original al cliente en producción por seguridad
  }

  // Si es un error personalizado con statusCode, usarlo
  if (err.isCustomError) {
    // Ya se deberían haber seteado statusCode y message
  }
  
  // En entorno de desarrollo, podrías querer enviar más detalles
  const responseError = {
    message,
    ...(errors && { errors }), // Incluir 'errors' solo si existe
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Stack trace solo en desarrollo
  };

  res.status(statusCode).json(responseError);
};

module.exports = errorHandler;
