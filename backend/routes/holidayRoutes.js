'use strict';

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { invalidarCacheFeriados } = require('../utils/businessHours');
const logger = require('../utils/logger');

/**
 * Convierte el valor de starts_on (puede ser string o Date) a "YYYY-MM-DD"
 */
function toDateString(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  // MySQL devuelve strings tipo "2026-01-01 00:00:00" o "2026-01-01"
  return String(value).slice(0, 10);
}

/**
 * GET /api/holidays
 * Retorna todos los feriados de schedule_id 7 (fechas específicas)
 */
router.get('/', async (req, res, next) => {
  try {
    const holidays = await sequelize.query(
      `SELECT id, name, starts_on
       FROM ost_schedule_entry
       WHERE schedule_id = 7
       ORDER BY starts_on ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const formatted = holidays.map(h => ({
      id: h.id,
      name: h.name,
      date: toDateString(h.starts_on),
    }));

    res.json({ holidays: formatted });
  } catch (error) {
    logger.error('Error obteniendo feriados:', error.message || error);
    next(error);
  }
});

/**
 * POST /api/holidays
 * Agrega un nuevo feriado a schedule_id 7
 * Body: { name: string, date: "YYYY-MM-DD" }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, date } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "name" es requerido.' });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'El campo "date" debe tener formato YYYY-MM-DD.' });
    }

    const safeName = name.trim().slice(0, 60);

    const [insertId] = await sequelize.query(
      `INSERT INTO ost_schedule_entry (schedule_id, name, starts_on, ends_on, repeats, flags)
       VALUES (7, :name, :startsOn, :endsOn, 'never', 0)`,
      {
        replacements: {
          name: safeName,
          startsOn: `${date} 00:00:00`,
          endsOn: `${date} 23:59:59`,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    invalidarCacheFeriados();
    logger.info(`Feriado agregado: ${safeName} (${date}), id=${insertId}`);

    res.status(201).json({ id: insertId, name: safeName, date });
  } catch (error) {
    logger.error('Error agregando feriado:', error.message || error);
    next(error);
  }
});

/**
 * DELETE /api/holidays/:id
 * Elimina un feriado de schedule_id 7
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    // Para DELETE, Sequelize devuelve el número de filas afectadas directamente
    const affectedRows = await sequelize.query(
      `DELETE FROM ost_schedule_entry WHERE id = :id AND schedule_id = 7`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.DELETE,
      }
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Feriado no encontrado.' });
    }

    invalidarCacheFeriados();
    logger.info(`Feriado eliminado: id=${id}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error eliminando feriado:', error.message || error);
    next(error);
  }
});

module.exports = router;
