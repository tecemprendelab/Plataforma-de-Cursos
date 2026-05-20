// ============================================================
//  TagsView.jsx — React JSX
//  Gestor completo de etiquetas: crear, editar, eliminar,
//  estadísticas de uso y alerta de participantes sin etiquetar.
// ============================================================

import { useState } from 'react'
import { getTagColor } from '../data/tags.js'
import { TagPill }     from './TagPill.jsx'
import { ColorPicker } from './ColorPicker.jsx'

export default function TagsView({ tags, participants, onAdd, onEdit, onDelete }) {
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState('orange')
  const [editId,    setEditId]    = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editColor, setEditColor] = useState('orange')

  const startEdit = t => { setEditId(t.id); setEditName(t.name); setEditColor(t.color) }
  const saveEdit  = () => { onEdit(editId, editName, editColor); setEditId(null) }

  const tagStats = [...tags]
    .map(t => ({ ...t, count: participants.filter(p => (p.tags||[]).includes(t.id)).length }))
    .sort((a,b) => b.count - a.count)

  const sinEtiqueta = participants.filter(p => !p.tags || p.tags.length === 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h1">Etiquetas</h2>
          <p className="text-muted" style={{ fontSize:13, marginTop:3 }}>
            Clasificá participantes con etiquetas libres y colores personalizados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{tags.length}</div>
          <div className="stat-label">Etiquetas activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'var(--orange)' }}>
            {participants.filter(p => p.tags?.length > 0).length}
          </div>
          <div className="stat-label">Participantes etiquetados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color:'var(--gray)' }}>{sinEtiqueta.length}</div>
          <div className="stat-label">Sin etiquetas</div>
        </div>
      </div>

      {/* Crear nueva etiqueta */}
      <div className="card card-padded" style={{ marginBottom:16 }}>
        <div style={{ fontWeight:500, fontSize:13, marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-tag" style={{ fontSize:14, color:'var(--orange)' }}/> Nueva etiqueta
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:180 }}>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:4 }}>Nombre</label>
            <input className="finput" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="ej. Becado, VIP, Empresa..."
              onKeyDown={e => {
                if (e.key === 'Enter' && newName.trim()) { onAdd(newName.trim(), newColor); setNewName('') }
              }}/>
          </div>
          <div>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:4 }}>Color</label>
            <ColorPicker selected={newColor} onChange={setNewColor}/>
          </div>
          <button className="btn btn-orange"
            onClick={() => { if (newName.trim()) { onAdd(newName.trim(), newColor); setNewName('') } }}>
            <i className="ti ti-plus"/> Crear etiqueta
          </button>
        </div>
        {newName && (
          <div style={{ marginTop:10 }}>
            <span className="text-sm text-muted" style={{ marginRight:8 }}>Vista previa:</span>
            <TagPill tag={{ id:'prev', name:newName, color:newColor }}/>
          </div>
        )}
      </div>

      {/* Lista con uso */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ padding:'10px 14px', background:'var(--cream-2)',
          fontSize:11, fontWeight:600, color:'var(--gray)', letterSpacing:.5 }}>
          ETIQUETAS ACTIVAS ({tags.length})
        </div>
        {tags.length === 0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--gray)', fontSize:13 }}>
            No hay etiquetas. Creá la primera arriba.
          </div>
        )}
        {tagStats.map(t => {
          const pct = Math.round(t.count / Math.max(participants.length, 1) * 100)
          const c   = getTagColor(t.color)
          return (
            <div key={t.id} style={{ padding:'12px 14px', borderTop:'1px solid var(--cream-2)' }}>
              {editId === t.id ? (
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="finput" style={{ minWidth:150, width:'auto' }}/>
                  <ColorPicker selected={editColor} onChange={setEditColor}/>
                  <TagPill tag={{ id:'ep', name:editName, color:editColor }}/>
                  <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
                    <button className="btn btn-orange btn-sm" onClick={saveEdit}>
                      <i className="ti ti-check"/> Guardar
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <TagPill tag={t}/>
                      <span className="text-sm text-muted">
                        {t.count} participante{t.count !== 1 ? 's' : ''} ({pct}%)
                      </span>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-icon" onClick={() => startEdit(t)}>
                        <i className="ti ti-edit"/> Editar
                      </button>
                      <button className="btn-icon danger"
                        onClick={() => onDelete(t.id)}
                        title="Eliminar etiqueta">
                        <i className="ti ti-trash"/>
                      </button>
                    </div>
                  </div>
                  <div className="pbar-wrap">
                    <div style={{ width:`${pct}%`, height:5, borderRadius:20,
                      background:c.dot, transition:'width .4s' }}/>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Participantes sin etiquetas */}
      {sinEtiqueta.length > 0 && (
        <div className="alert alert-orange">
          <div className="alert-title">
            <i className="ti ti-alert-triangle"/> {sinEtiqueta.length} participante{sinEtiqueta.length !== 1 ? 's' : ''} sin etiquetas
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {sinEtiqueta.map(p => (
              <span key={p.id} style={{ fontSize:11, padding:'3px 10px', borderRadius:20,
                background:'var(--cream-3)', color:'var(--gray)' }}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
