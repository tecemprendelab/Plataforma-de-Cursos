// ============================================================
//  UI.jsx — React JSX
//  Componentes atómicos reutilizables: Badge, AccessBar,
//  StatCard, Toast, Avatar, Modal base.
//  Todos los componentes están documentados con JSDoc.
// ============================================================

import { useState, useEffect } from 'react'
import { accessPct, daysLeft, isExpired, isWarning, ACCESS_DAYS } from '../utils/time.js'

// Re-export constante para uso externo
export { ACCESS_DAYS }

// ── Badge ─────────────────────────────────────────────────
const BADGE_STYLES = {
  black:   { background: 'var(--black)',    color: 'var(--cream)' },
  orange:  { background: 'var(--orange)',   color: '#fff' },
  gray:    { background: 'var(--cream-3)',  color: 'var(--gray)' },
  red:     { background: 'var(--orange-d)', color: '#fff' },
  green:   { background: '#D1FAE5',         color: '#065F46' },
}

/** Etiqueta de estado con color semántico */
export function Badge({ type = 'gray', children }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.gray
  return (
    <span className="badge" style={s}>{children}</span>
  )
}

/** Badge que muestra el estado de acceso según tiempo */
export function TimerBadge({ fecha, access }) {
  if (!access)           return <Badge type="gray">Sin acceso</Badge>
  if (isExpired(fecha))  return <Badge type="red">Expirado</Badge>
  if (isWarning(fecha))  return <Badge type="orange">{daysLeft(fecha)}d restantes</Badge>
  return <Badge type="black">{daysLeft(fecha)}d restantes</Badge>
}

// ── AccessBar ─────────────────────────────────────────────
/**
 * Barra de progreso de 45 días con colores semánticos.
 * @param {string}  fecha   - ISO date string
 * @param {boolean} compact - Oculta etiquetas de texto
 */
export function AccessBar({ fecha, compact = false }) {
  const pct   = accessPct(fecha)
  const left  = daysLeft(fecha)
  const exp   = isExpired(fecha)
  const warn  = isWarning(fecha)

  const barClass = exp ? 'pbar pbar-exp' : warn ? 'pbar pbar-warn' : 'pbar pbar-green'
  const bgColor  = exp ? '#FBE8E3' : warn ? '#FEF3EB' : 'var(--green-l)'
  const txtColor = exp ? 'var(--orange-d)' : warn ? 'var(--orange)' : 'var(--green)'
  const label    = exp ? 'Expirado' : warn ? `Expira en ${left}d` : `${left} días restantes`

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
          <span style={{ color: txtColor, fontWeight: 500 }}>{label}</span>
          <span style={{ color: 'var(--gray)' }}>{pct}% de {ACCESS_DAYS}d</span>
        </div>
      )}
      <div className="pbar-wrap" style={{ background: bgColor }}>
        <div className={barClass} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────
/** Tarjeta de métrica con número grande */
export function StatCard({ num, label, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-num" style={accent ? { color: accent } : {}}>{num}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────
/** Círculo con iniciales del participante */
export function Avatar({ name, variant = 'cream' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`avatar av-${variant}`}>{initials}</div>
  )
}

// ── Toast ─────────────────────────────────────────────────
/** Notificación temporal en la esquina inferior derecha */
export function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onHide, 2400)
    return () => clearTimeout(t)
  }, [message, onHide])

  if (!message) return null
  return <div className="toast">{message}</div>
}

// ── Modal base ────────────────────────────────────────────
/** Envuelve contenido en el overlay de modal */
export function Modal({ onClose, children, width = 560 }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width }}>
        {children}
      </div>
    </div>
  )
}
