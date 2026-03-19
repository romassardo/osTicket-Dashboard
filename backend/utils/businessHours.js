/**
 * Utilidad para calcular horas hábiles
 * 
 * Horario laboral: Lunes a Viernes, 8:30 a 17:30 (9 horas/día)
 * Excluye: Sábados, Domingos y Feriados argentinos
 */

const { sequelize } = require('../models');
const logger = require('./logger');

// Configuración del horario laboral
const WORK_START_HOUR = 8;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 17;
const WORK_END_MINUTE = 30;
const HOURS_PER_DAY = 9; // 8:30 a 17:30 = 9 horas

// Cache de feriados (se recarga cada hora)
let feriadosCache = null;
let feriadosCacheTime = null;
let feriadosLoadingPromise = null; // Evita race condition en llamadas concurrentes
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

/**
 * Carga los feriados desde la base de datos
 * Schedule ID 4: Feriados recurrentes (yearly)
 * Schedule ID 7: Feriados específicos 2025/2026
 */
async function cargarFeriados() {
  // Verificar cache
  if (feriadosCache && feriadosCacheTime && (Date.now() - feriadosCacheTime < CACHE_DURATION_MS)) {
    return feriadosCache;
  }

  // Si ya hay una carga en curso, esperar esa misma promesa (evita N queries concurrentes)
  if (feriadosLoadingPromise) {
    return feriadosLoadingPromise;
  }

  feriadosLoadingPromise = _cargarFeriadosInterno();
  try {
    const result = await feriadosLoadingPromise;
    return result;
  } finally {
    feriadosLoadingPromise = null;
  }
}

async function _cargarFeriadosInterno() {
  try {
    const query = `
      SELECT 
        se.id,
        se.schedule_id,
        se.name,
        se.repeats,
        se.starts_on,
        se.day,
        se.month
      FROM ost_schedule_entry se
      WHERE se.schedule_id IN (4, 7)
    `;
    
    const feriados = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });

    // Procesar feriados
    const feriadosProcesados = {
      recurrentes: [], // {day, month} - se repiten cada año
      especificos: []  // {date} - fechas específicas
    };

    for (const f of feriados) {
      if (f.repeats === 'yearly' && f.day && f.month) {
        feriadosProcesados.recurrentes.push({
          day: f.day,
          month: f.month,
          nombre: f.name
        });
      } else if (f.repeats === 'never' && f.starts_on) {
        // Fecha específica
        const fecha = new Date(f.starts_on);
        feriadosProcesados.especificos.push({
          year: fecha.getFullYear(),
          month: fecha.getMonth() + 1,
          day: fecha.getDate(),
          nombre: f.name
        });
      }
    }

    feriadosCache = feriadosProcesados;
    feriadosCacheTime = Date.now();
    
    logger.info(`📅 Feriados cargados: ${feriadosProcesados.recurrentes.length} recurrentes, ${feriadosProcesados.especificos.length} específicos`);
    
    return feriadosProcesados;
  } catch (error) {
    logger.error('❌ Error cargando feriados:', error);
    return { recurrentes: [], especificos: [] };
  }
}

/**
 * Verifica si una fecha es feriado
 * @param {Date} fecha 
 * @param {Object} feriados - Objeto con feriados recurrentes y específicos
 * @returns {boolean}
 */
function esFeriado(fecha, feriados) {
  const day = fecha.getDate();
  const month = fecha.getMonth() + 1;
  const year = fecha.getFullYear();

  // Verificar feriados recurrentes
  for (const f of feriados.recurrentes) {
    if (f.day === day && f.month === month) {
      return true;
    }
  }

  // Verificar feriados específicos
  for (const f of feriados.especificos) {
    if (f.day === day && f.month === month && f.year === year) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si una fecha es día hábil (Lunes-Viernes, no feriado)
 * @param {Date} fecha 
 * @param {Object} feriados
 * @returns {boolean}
 */
function esDiaHabil(fecha, feriados) {
  const diaSemana = fecha.getDay(); // 0=Domingo, 6=Sábado
  
  // Excluir fines de semana
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }

  // Excluir feriados
  if (esFeriado(fecha, feriados)) {
    return false;
  }

  return true;
}

/**
 * Obtiene el inicio del horario laboral para una fecha dada
 * @param {Date} fecha 
 * @returns {Date}
 */
function getInicioHorarioLaboral(fecha) {
  const inicio = new Date(fecha);
  inicio.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
  return inicio;
}

/**
 * Obtiene el fin del horario laboral para una fecha dada
 * @param {Date} fecha 
 * @returns {Date}
 */
function getFinHorarioLaboral(fecha) {
  const fin = new Date(fecha);
  fin.setHours(WORK_END_HOUR, WORK_END_MINUTE, 0, 0);
  return fin;
}

/**
 * Ajusta una fecha al próximo momento hábil
 * Si está fuera del horario laboral, mueve al inicio del próximo día hábil
 * @param {Date} fecha 
 * @param {Object} feriados
 * @returns {Date}
 */
function ajustarAHorarioHabil(fecha, feriados) {
  let ajustada = new Date(fecha);
  
  // Si es fin de semana o feriado, mover al próximo día hábil
  while (!esDiaHabil(ajustada, feriados)) {
    ajustada.setDate(ajustada.getDate() + 1);
    ajustada.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
  }

  const inicioLaboral = getInicioHorarioLaboral(ajustada);
  const finLaboral = getFinHorarioLaboral(ajustada);

  // Si es antes del horario laboral, ajustar al inicio
  if (ajustada < inicioLaboral) {
    return inicioLaboral;
  }

  // Si es después del horario laboral, mover al próximo día hábil
  if (ajustada > finLaboral) {
    ajustada.setDate(ajustada.getDate() + 1);
    ajustada.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);
    // Buscar próximo día hábil
    while (!esDiaHabil(ajustada, feriados)) {
      ajustada.setDate(ajustada.getDate() + 1);
    }
    return ajustada;
  }

  return ajustada;
}

/**
 * Compara si dos fechas son el mismo día calendario
 */
function _mismaFecha(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

/**
 * Construye un Set de strings "YYYY-MM-DD" con todos los feriados en el rango de años dado.
 * Permite lookup O(1) en vez de iterar arrays.
 */
function _buildFeriadoSet(feriados, yearInicio, yearFin) {
  const set = new Set();
  for (let y = yearInicio; y <= yearFin; y++) {
    for (const f of feriados.recurrentes) {
      set.add(`${y}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`);
    }
  }
  for (const f of feriados.especificos) {
    set.add(`${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`);
  }
  return set;
}

/**
 * Verifica si una fecha (a medianoche) es día hábil usando el Set de feriados (O(1)).
 */
function _esDiaHabilRapido(fecha, feriadoSet) {
  const dow = fecha.getDay();
  if (dow === 0 || dow === 6) return false;
  const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  return !feriadoSet.has(key);
}

/**
 * Cuenta días hábiles entre dos fechas (ambas a medianoche, 'hasta' exclusivo).
 * Usa matemática de semanas completas + solo itera los días restantes (0-6) y feriados (~24).
 * O(1) para semanas + O(R) para remainder + O(F) para feriados, donde R<=6 y F~24.
 */
function _contarDiasHabiles(desde, hasta, feriadoSet) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDias = Math.round((hasta - desde) / msPerDay);
  if (totalDias <= 0) return 0;

  // Semanas completas: cada una tiene exactamente 5 días hábiles
  const fullWeeks = Math.floor(totalDias / 7);
  let weekdays = fullWeeks * 5;

  // Días restantes (máximo 6 iteraciones)
  const startDow = desde.getDay();
  const remainDays = totalDias % 7;
  for (let i = 0; i < remainDays; i++) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) {
      weekdays++;
    }
  }

  // Restar feriados que caen en días hábiles dentro del rango (~24 iteraciones max)
  for (const feriadoStr of feriadoSet) {
    const parts = feriadoStr.split('-');
    const fDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (fDate >= desde && fDate < hasta) {
      const dow = fDate.getDay();
      if (dow !== 0 && dow !== 6) {
        weekdays--;
      }
    }
  }

  return Math.max(0, weekdays);
}

/**
 * Calcula las horas hábiles entre dos fechas (OPTIMIZADO)
 * En vez de iterar día por día, usa matemática de semanas completas.
 * Complejidad: O(1) para el rango + O(F) para feriados (~24), vs O(D) anterior donde D=días.
 * @param {Date|string} fechaInicio - Fecha de inicio (created)
 * @param {Date|string} fechaFin - Fecha de fin (closed o NOW)
 * @returns {Promise<number>} - Horas hábiles transcurridas
 */
async function calcularHorasHabiles(fechaInicio, fechaFin) {
  const feriados = await cargarFeriados();
  
  let inicio = new Date(fechaInicio);
  let fin = new Date(fechaFin);

  // Si las fechas son inválidas, retornar 0
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return 0;
  }

  // Si inicio es posterior a fin, retornar 0
  if (inicio >= fin) {
    return 0;
  }

  // Ajustar inicio al horario hábil
  inicio = ajustarAHorarioHabil(inicio, feriados);
  
  // Si después del ajuste inicio >= fin, retornar 0
  if (inicio >= fin) {
    return 0;
  }

  // Build Set de feriados para lookup O(1)
  const feriadoSet = _buildFeriadoSet(feriados, inicio.getFullYear(), fin.getFullYear());

  // --- Caso: mismo día ---
  if (_mismaFecha(inicio, fin)) {
    const finLaboral = getFinHorarioLaboral(inicio);
    const finEfectivo = fin < finLaboral ? fin : finLaboral;
    if (inicio < finEfectivo) {
      return Math.round(((finEfectivo - inicio) / (1000 * 60 * 60)) * 100) / 100;
    }
    return 0;
  }

  let horasHabiles = 0;

  // --- 1. Primer día (parcial): desde inicio hasta fin de jornada ---
  const finDia1 = getFinHorarioLaboral(inicio);
  if (inicio < finDia1) {
    horasHabiles += (finDia1 - inicio) / (1000 * 60 * 60);
  }

  // --- 2. Días completos intermedios (optimizado con math de semanas) ---
  const dia2 = new Date(inicio);
  dia2.setDate(dia2.getDate() + 1);
  dia2.setHours(0, 0, 0, 0);

  const diaUltimo = new Date(fin);
  diaUltimo.setHours(0, 0, 0, 0);

  if (dia2 < diaUltimo) {
    const diasHabiles = _contarDiasHabiles(dia2, diaUltimo, feriadoSet);
    horasHabiles += diasHabiles * HOURS_PER_DAY;
  }

  // --- 3. Último día (parcial): desde inicio de jornada hasta fin ---
  const inicioUltDia = getInicioHorarioLaboral(fin);
  const finUltDia = getFinHorarioLaboral(fin);
  const finEfectivoUlt = fin < finUltDia ? fin : finUltDia;

  if (finEfectivoUlt > inicioUltDia && _esDiaHabilRapido(diaUltimo, feriadoSet)) {
    horasHabiles += (finEfectivoUlt - inicioUltDia) / (1000 * 60 * 60);
  }

  return Math.round(horasHabiles * 100) / 100;
}

/**
 * Calcula las horas hábiles restantes hasta que venza el SLA
 * @param {Date|string} fechaCreacion - Fecha de creación del ticket
 * @param {number} gracePeriodHoras - Período de gracia del SLA en horas
 * @returns {Promise<{horasTranscurridas: number, horasRestantes: number, porcentajeConsumido: number, vencido: boolean}>}
 */
async function calcularEstadoSLA(fechaCreacion, gracePeriodHoras) {
  const ahora = new Date();
  const horasTranscurridas = await calcularHorasHabiles(fechaCreacion, ahora);
  const horasRestantes = gracePeriodHoras - horasTranscurridas; // Negativo = excedido
  const porcentajeConsumido = gracePeriodHoras > 0 
    ? Math.round((horasTranscurridas / gracePeriodHoras) * 100 * 10) / 10 
    : 0;
  
  return {
    horasTranscurridas: Math.round(horasTranscurridas * 10) / 10,
    horasRestantes: Math.round(horasRestantes * 10) / 10,
    porcentajeConsumido,
    vencido: horasTranscurridas >= gracePeriodHoras
  };
}

/**
 * Verifica si un ticket cumplió el SLA (para tickets cerrados)
 * @param {Date|string} fechaCreacion 
 * @param {Date|string} fechaCierre 
 * @param {number} gracePeriodHoras 
 * @returns {Promise<{horasReales: number, cumplido: boolean, diferencia: number}>}
 */
async function verificarCumplimientoSLA(fechaCreacion, fechaCierre, gracePeriodHoras) {
  const horasReales = await calcularHorasHabiles(fechaCreacion, fechaCierre);
  const cumplido = horasReales <= gracePeriodHoras;
  const diferencia = gracePeriodHoras - horasReales; // Positivo = cumplió antes, Negativo = se pasó
  
  return {
    horasReales: Math.round(horasReales * 10) / 10,
    cumplido,
    diferencia: Math.round(diferencia * 10) / 10
  };
}

// Exportar funciones
module.exports = {
  calcularHorasHabiles,
  calcularEstadoSLA,
  verificarCumplimientoSLA,
  cargarFeriados,
  esDiaHabil,
  esFeriado,
  HOURS_PER_DAY,
  WORK_START_HOUR,
  WORK_START_MINUTE,
  WORK_END_HOUR,
  WORK_END_MINUTE
};
