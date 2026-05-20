// ============================================================
//  ColorPicker.jsx — React JSX
//  Selector visual de color con puntos clicables.
// ============================================================

import { TAG_COLORS } from '../data/tags.js'

export function ColorPicker({ selected, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
      {TAG_COLORS.map(c => (
        <div key={c.id} onClick={() => onChange(c.id)} title={c.id}
          style={{
            width: 18, height: 18, borderRadius:'50%',
            background: c.dot, cursor:'pointer',
            outline: selected === c.id ? `2px solid ${c.dot}` : 'none',
            outlineOffset: 2, transition:'all .15s',
          }}/>
      ))}
    </div>
  )
}
