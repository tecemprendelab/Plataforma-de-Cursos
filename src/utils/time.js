// ============================================================
//  time.js — JavaScript
//  Funciones puras de cálculo de tiempo y fechas.
//  No dependen de React ni de ningún otro módulo.
//
//  Modelo: expiración = fecha_ingreso + accessDays
//  Todas las funciones aceptan un segundo parámetro opcional
//  `days` (días de acceso del curso). Si no se pasa, se usa
//  el valor global ACCESS_DAYS como respaldo.
// ============================================================

export { ACCESS_DAYS, WARN_DAYS, EXAM_WARN } from '../data/constants.js'
import { ACCESS_DAYS, WARN_DAYS, EXAM_WARN } from '../data/constants.js'

const _now = new Date()
const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate())

function parseLocal(fechaStr) {
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Calcula la fecha de expiración como objeto Date */
function expiryAsDate(fechaStr, days) {
  const d = parseLocal(fechaStr)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Días transcurridos desde una fecha de ingreso.
 * Puede ser negativo si la fecha es futura.
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 */
export function daysElapsed(fechaStr) {
  return Math.round((TODAY - parseLocal(fechaStr)) / 86_400_000)
}

/**
 * Días restantes hasta la expiración (mín. 0).
 * Calculado como: fecha_expiración - hoy
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function daysLeft(fechaStr, days = ACCESS_DAYS) {
  const expiry = expiryAsDate(fechaStr, days)
  return Math.max(0, Math.round((expiry - TODAY) / 86_400_000))
}

/**
 * Porcentaje consumido del período de acceso (0-100).
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function accessPct(fechaStr, days = ACCESS_DAYS) {
  const elapsed = daysElapsed(fechaStr)
  return Math.min(100, Math.max(0, Math.round(elapsed / days * 100)))
}

/**
 * true si el período de acceso ya expiró.
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function isExpired(fechaStr, days = ACCESS_DAYS) {
  return TODAY >= expiryAsDate(fechaStr, days)
}

/**
 * true si quedan ≤ WARN_DAYS días (pero aún no expiró).
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function isWarning(fechaStr, days = ACCESS_DAYS) {
  const left = daysLeft(fechaStr, days)
  return left > 0 && left <= WARN_DAYS
}

/**
 * true si está dentro de la ventana de recordatorio de prueba.
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function needsExamReminder(fechaStr, days = ACCESS_DAYS) {
  const left = daysLeft(fechaStr, days)
  return left > 0 && left <= EXAM_WARN && !isExpired(fechaStr, days)
}

/** Formatea fecha ISO a string legible en español (CR) */
export function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-CR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/**
 * Fecha en que expira el acceso de un participante.
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function expiryDate(fechaStr, days = ACCESS_DAYS) {
  return expiryAsDate(fechaStr, days).toLocaleDateString('es-CR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Fecha límite para realizar la prueba (días de acceso - EXAM_WARN).
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 * @param {number} [days]   - Días de acceso del curso (por defecto ACCESS_DAYS)
 */
export function examDeadlineDate(fechaStr, days = ACCESS_DAYS) {
  const d = parseLocal(fechaStr)
  d.setDate(d.getDate() + days - EXAM_WARN)
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Fecha de hoy en formato ISO */
export function todayISO() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Resuelve los días de acceso para un participante según sus cursos.
 * Si el participante está inscrito en más de un curso, se usa el máximo.
 * Si ningún curso tiene accessDays definido, se usa ACCESS_DAYS global.
 *
 * @param {object} participant - Objeto participante (debe tener .courses = [id, ...])
 * @param {Array}  courses     - Lista de todos los cursos disponibles
 * @returns {number}
 */
export function getAccessDays(participant, courses = []) {
  if (!participant?.courses?.length || !courses.length) return ACCESS_DAYS
  const enrolled = courses.filter(c => participant.courses.includes(c.id))
  if (!enrolled.length) return ACCESS_DAYS
  const max = Math.max(...enrolled.map(c => Number(c.accessDays) || ACCESS_DAYS))
  return max
}
