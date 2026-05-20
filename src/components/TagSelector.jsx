// ============================================================
//  TagSelector.jsx — React JSX
//  Selector múltiple de etiquetas para el modal de participante.
// ============================================================

import { getTagColor } from '../data/tags.js'

export function TagSelector({ tags, selected, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, color:'#8A8070', marginBottom:8 }}>
        Etiquetas
      </label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        {tags.map(t => {
          const active = selected.includes(t.id)
          const c = getTagColor(t.color)
          return (
            <span key={t.id} onClick={() => onChange(t.id)}
              style={{
                display:'inline-flex', alignItems:'center', gap:5,
                padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:500,
                cursor:'pointer', transition:'all .15s', userSelect:'none',
                background: active ? c.bg      : '#F2EBD9',
                border:     `1px solid ${active ? c.border : '#D4C8B0'}`,
                color:      active ? c.text    : '#8A8070',
              }}>
              {active && <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot }}/>}
              {t.name}
              {active && <i className="ti ti-check" style={{ fontSize:9, marginLeft:2 }}/>}
            </span>
          )
        })}
        {tags.length === 0 && (
          <span style={{ fontSize:12, color:'#8A8070' }}>
            No hay etiquetas. Creálas en la sección "Etiquetas".
          </span>
        )}
      </div>
    </div>
  )
}
