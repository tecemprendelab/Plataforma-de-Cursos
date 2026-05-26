// ============================================================
//  CommandPalette.jsx — Modal de búsqueda global (Ctrl/Cmd+K).
//  Busca en participantes, cursos, etiquetas y vistas, y dispara
//  la acción correspondiente al seleccionar.
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import { NAV } from './Sidebar.jsx'

const MAX_RESULTS = 8

// Vistas estáticas derivadas del NAV del Sidebar (filtra encabezados).
const VIEW_ITEMS = NAV.filter(n => !n.section).map(n => ({
  kind:  'view',
  id:    n.id,
  label: n.label,
  icon:  n.icon,
}))

export default function CommandPalette({ open, onClose, participants, courses, tags, setView }) {
  const [q, setQ]             = useState('')
  const [activeIdx, setIdx]   = useState(0)
  const inputRef              = useRef(null)

  // Reset al abrir
  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 0) }
  }, [open])

  const results = useMemo(() => {
    if (!open) return []
    const query = q.trim().toLowerCase()

    const part = participants
      .filter(p => !query
        || p.name?.toLowerCase().includes(query)
        || p.email?.toLowerCase().includes(query)
        || (p.cedula && String(p.cedula).toLowerCase().includes(query)))
      .slice(0, MAX_RESULTS)
      .map(p => ({
        kind:  'participant',
        id:    p.id,
        label: p.name,
        sub:   p.email,
        icon:  'ti-user',
        action: () => setView(`profile_${p.id}`),
      }))

    const cs = courses
      .filter(c => !query
        || c.name?.toLowerCase().includes(query)
        || c.short?.toLowerCase().includes(query))
      .slice(0, MAX_RESULTS)
      .map(c => ({
        kind:  'course',
        id:    c.id,
        label: c.short || c.name,
        sub:   c.name !== c.short ? c.name : `${c.capacity} cupos`,
        icon:  'ti-book',
        action: () => setView('courses'),
      }))

    const tg = (tags || [])
      .filter(t => !query || t.name?.toLowerCase().includes(query))
      .slice(0, MAX_RESULTS)
      .map(t => ({
        kind:  'tag',
        id:    t.id,
        label: t.name,
        sub:   'Etiqueta',
        icon:  'ti-tag',
        action: () => setView('participants'),
      }))

    const vs = VIEW_ITEMS
      .filter(v => !query || v.label.toLowerCase().includes(query))
      .map(v => ({
        kind:  'view',
        id:    v.id,
        label: v.label,
        sub:   'Ir a la vista',
        icon:  v.icon,
        action: () => setView(v.id),
      }))

    // Si no hay query, mostrar vistas primero. Si hay query, priorizar matches en orden: participantes, cursos, tags, vistas.
    return [...part, ...cs, ...tg, ...vs].slice(0, 20)
  }, [open, q, participants, courses, tags, setView])

  // Reset índice cuando cambia la lista
  useEffect(() => { setIdx(0) }, [q])

  const run = (item) => {
    if (!item) return
    item.action()
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx(i => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[activeIdx])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="overlay cmdk-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cmdk-box" role="dialog" aria-label="Búsqueda global">
        <div className="cmdk-input-wrap">
          <i className="ti ti-search cmdk-search-icon"/>
          <input ref={inputRef} className="cmdk-input"
            placeholder="Buscar participante, curso, etiqueta o vista…"
            value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}/>
          <kbd className="cmdk-kbd">Esc</kbd>
        </div>
        <ul className="cmdk-list">
          {results.length ? results.map((r, i) => (
            <li key={`${r.kind}-${r.id}`}
              className={`cmdk-item${i === activeIdx ? ' active' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => run(r)}>
              <i className={`ti ${r.icon} cmdk-icon`}/>
              <div className="cmdk-text">
                <div className="cmdk-label">{r.label}</div>
                {r.sub && <div className="cmdk-sub">{r.sub}</div>}
              </div>
              <span className="cmdk-kind">{labelOf(r.kind)}</span>
            </li>
          )) : (
            <li className="cmdk-empty">Sin resultados</li>
          )}
        </ul>
        <div className="cmdk-hint">
          <span><kbd className="cmdk-kbd">↑↓</kbd> navegar</span>
          <span><kbd className="cmdk-kbd">↵</kbd> abrir</span>
          <span><kbd className="cmdk-kbd">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}

function labelOf(kind) {
  return ({
    participant: 'Participante',
    course:      'Curso',
    tag:         'Etiqueta',
    view:        'Vista',
  })[kind] || ''
}
