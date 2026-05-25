// ============================================================
//  time.js — JavaScript
//  Funciones puras de cálculo de tiempo y fechas.
//  No dependen de React ni de ningún otro módulo.
//  Fácilmente testeables de forma aislada.
// ============================================================

export { ACCESS_DAYS, WARN_DAYS, EXAM_WARN } from '../data/constants.js'
import { ACCESS_DAYS, WARN_DAYS, EXAM_WARN } from '../data/constants.js'

    const _now = new Date()
  const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate())

  function parseLocal(fechaStr) {
    const [y, m, d] = fechaStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

/**
 * Días transcurridos desde una fecha de ingreso.
 * @param {string} fechaStr - Formato ISO 'YYYY-MM-DD'
 */
export function daysElapsed(fechaStr) {
  return Math.floor((TODAY - parseLocal(fechaStr)) / 86_400_000)
}

/** Días restantes de acceso (mín. 0) */
export function daysLeft(fechaStr) {
  return Math.max(0, ACCESS_DAYS - daysElapsed(fechaStr))
}

/** Porcentaje consumido del período de acceso (0-100) */
export function accessPct(fechaStr) {
  return Math.min(100, Math.round(daysElapsed(fechaStr) / ACCESS_DAYS * 100))
}

/** true si el período de 45 días ya expiró */
export function isExpired(fechaStr) {
  return daysElapsed(fechaStr) >= ACCESS_DAYS
}

/** true si quedan ≤ WARN_DAYS días (pero aún no expiró) */
export function isWarning(fechaStr) {
  const d = daysLeft(fechaStr)
  return d > 0 && d <= WARN_DAYS
}

/** true si está dentro de la ventana de recordatorio de prueba */
export function needsExamReminder(fechaStr) {
  const d = daysLeft(fechaStr)
  return d > 0 && d <= EXAM_WARN && !isExpired(fechaStr)
}

/** Formatea fecha ISO a string legible en español (CR) */
export function fmtDate(str) {
  if (!str) return '—'
  return new Date(str + 'T12:00:00').toLocaleDateString('es-CR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Fecha en que expira el acceso de un participante */
export function expiryDate(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00')
  d.setDate(d.getDate() + ACCESS_DAYS)
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Fecha límite para realizar la prueba (ACCESS_DAYS - EXAM_WARN) */
export function examDeadlineDate(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00')
  d.setDate(d.getDate() + ACCESS_DAYS - EXAM_WARN)
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

