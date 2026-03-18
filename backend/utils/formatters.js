/**
 * Funciones de formateo compartidas para el backend
 * Extraídas de slaRoutes.js para eliminar duplicación (DRY)
 */

/**
 * Formatea horas hábiles a formato legible "Xd HH:MM" o "Xh XXm"
 * @param {number} horas - Horas hábiles
 * @returns {string}
 */
function formatHorasHabiles(horas) {
  if (!horas) return '0h 00m';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h >= 24) {
    const dias = Math.floor(h / 24);
    const horasRestantes = h % 24;
    return `${dias}d ${String(horasRestantes).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Formatea diferencia SLA en texto descriptivo
 * @param {number} horas - Diferencia en horas (positivo = cumplió antes, negativo = se pasó)
 * @returns {string}
 */
function formatDiferenciaSLA(horas) {
  if (horas === null || horas === undefined) return 'Sin datos';
  const horasAbs = Math.abs(horas);
  if (horas >= 0) {
    return `Cumplió ${horasAbs.toFixed(1)}h antes`;
  }
  return `Se pasó ${horasAbs.toFixed(1)}h`;
}

/**
 * Formatea segundos a formato legible "Xd HH:MM"
 * @param {number} seconds - Tiempo en segundos
 * @returns {string}
 */
function formatTime(seconds) {
  if (!seconds) return '0d 00:00';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Formatea tiempo de primera respuesta
 * @param {string|Date} fechaCreacion 
 * @param {string|Date} fechaRespuesta 
 * @returns {string}
 */
function formatPrimeraRespuesta(fechaCreacion, fechaRespuesta) {
  if (!fechaRespuesta) return 'Sin respuesta';
  const diffSeconds = Math.floor((new Date(fechaRespuesta) - new Date(fechaCreacion)) / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

module.exports = {
  formatHorasHabiles,
  formatDiferenciaSLA,
  formatTime,
  formatPrimeraRespuesta
};
