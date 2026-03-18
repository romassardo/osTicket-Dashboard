const rateLimit = require('express-rate-limit');

// General API rate limiter: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes, intente de nuevo en un minuto'
  }
});

// Stricter limiter for expensive SLA endpoints
const slaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes SLA, intente de nuevo en un minuto'
  }
});

module.exports = { apiLimiter, slaLimiter };
