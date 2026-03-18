const logger = require('../utils/logger');

/**
 * Middleware to validate and sanitize common query parameters
 * Used across ticket and SLA routes
 */
function validateQueryParams(req, res, next) {
  const { year, month, page, limit } = req.query;

  if (year !== undefined && year !== 'all') {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ error: 'Parámetro "year" inválido. Debe ser un número entre 2000 y 2100.' });
    }
    req.query.year = yearNum;
  }

  if (month !== undefined && month !== 'all' && month !== '') {
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Parámetro "month" inválido. Debe ser un número entre 1 y 12.' });
    }
    req.query.month = monthNum;
  }

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Parámetro "page" inválido. Debe ser un número mayor a 0.' });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({ error: 'Parámetro "limit" inválido. Debe ser un número entre 1 y 1000.' });
    }
    req.query.limit = limitNum;
  }

  next();
}

module.exports = { validateQueryParams };
