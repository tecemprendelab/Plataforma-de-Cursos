// ============================================================
//  TagPill.jsx — React JSX
//  Pill visual de una etiqueta. Reutilizable en toda la app.
// ============================================================

import { getTagColor } from '../data/tags.js'

export function TagPill({ tag, onRemove, small = false }) {
  if (!tag) return null
  const c = getTagColor(tag.color)
  return (
    <span style={{
      display:'inline-flex', alignItems:'center',
      gap: small ? 4 : 5,
      padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 20,
      fontSize: small ? 10 : 11,
      fontWeight: 500,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      marginRight: 4, marginBottom: 4,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width:small?6:7, height:small?6:7, borderRadius:'50%', background:c.dot, flexShrink:0 }}/>
      {tag.name}
      {onRemove && (
        <button onClick={onRemove}
          style={{ background:'none', border:'none', cursor:'pointer', padding:0,
            color:c.text, fontSize:10, display:'flex', alignItems:'center', marginLeft:2, opacity:.7 }}>
          <i className="ti ti-x" style={{ fontSize:9 }}/>
        </button>
      )}
    </span>
  )
}
