// ============================================================
//  ParticipantsView.jsx — React JSX (actualizado con courses dinámicos)
// ============================================================

import { useState }     from 'react'
import { isExpired, isWarning, daysLeft, getAccessDays } from '../utils/time.js'
import { TimerBadge, AccessBar, Avatar }  from './UI.jsx'
import { TagPill }      from './TagPill.jsx'
import { getTagColor }  from '../data/tags.js'
import ParticipantModal from './ParticipantModal.jsx'

export default function ParticipantsView({
  participants, courses, tags,
  onAdd, onUpdate, onDelete, onToggleAccess, setView,
}) {
  const [search,       setSearch]       = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTag,    setFilterTag]    = useState('all')
  const [sortBy,       setSortBy]       = useState('fecha_desc')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)

  const filtered = participants
    .filter(p => {
      const days = getAccessDays(p, courses)
      const q = search.toLowerCase()
      const matchQ = !q || p.name.toLowerCase().includes(q)
        || p.email.toLowerCase().includes(q) || p.phone.includes(q)
      const matchC = filterCourse === 'all' || p.courses.includes(filterCourse)
      const matchT = filterTag    === 'all' || (p.tags||[]).includes(filterTag)
      const matchS = filterStatus === 'all'
        || (filterStatus === 'activo'    && p.status === 'activo')
        || (filterStatus === 'inactivo'  && p.status === 'inactivo')
        || (filterStatus === 'acceso'    && p.access)
        || (filterStatus === 'sinacceso' && !p.access)
        || (filterStatus === 'expirado'  && isExpired(p.fecha, days))
        || (filterStatus === 'warning'   && isWarning(p.fecha, days))
      return matchQ && matchC && matchT && matchS
    })
    .sort((a, b) => {
      if (sortBy === 'fecha_asc') return a.fecha.localeCompare(b.fecha)
      if (sortBy === 'nombre')    return a.name.localeCompare(b.name)
      if (sortBy === 'expiry')    return daysLeft(a.fecha, getAccessDays(a, courses)) - daysLeft(b.fecha, getAccessDays(b, courses))
      return b.fecha.localeCompare(a.fecha)
    })

  const openNew  = ()  => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (p) => { setEditTarget(p);    setModalOpen(true) }
  const handleSave = form => {
    editTarget ? onUpdate(editTarget.id, form) : onAdd(form)
    setModalOpen(false)
  }

  const shortName = cid => courses.find(c => c.id === cid)?.short || cid

  return (
    <div>
      {modalOpen && (
        <ParticipantModal
          participant={editTarget}
          courses={courses}
          tags={tags}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div className="page-header">
        <div>
          <h2 className="h1">Participantes</h2>
          <p className="text-muted" style={{ fontSize:13, marginTop:3 }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-orange" onClick={openNew}>
          <i className="ti ti-plus"/> Nuevo participante
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-row" style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <input className="finput" placeholder="Buscar nombre, correo, teléfono..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:200 }}/>
        <select className="finput" style={{ width:'auto' }}
          value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="all">Todos los cursos</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}
        </select>
        <select className="finput" style={{ width:'auto' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="acceso">Con acceso</option>
          <option value="sinacceso">Sin acceso</option>
          <option value="expirado">Expirados</option>
          <option value="warning">Por vencer</option>
        </select>
        <select className="finput" style={{ width:'auto' }}
          value={filterTag} onChange={e => setFilterTag(e.target.value)}>
          <option value="all">Todas las etiquetas</option>
          {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="finput" style={{ width:'auto' }}
          value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="fecha_desc">Más recientes</option>
          <option value="fecha_asc">Más antiguos</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="expiry">Por vencer primero</option>
        </select>
      </div>

      {/* Chip de etiqueta activa */}
      {filterTag !== 'all' && (() => {
        const t = tags.find(x => x.id === filterTag)
        if (!t) return null
        const c = getTagColor(t.color)
        return (
          <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
            <span className="text-sm text-muted">Filtrando por:</span>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
              borderRadius:20, fontSize:11, fontWeight:500,
              background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot }}/>
              {t.name}
              <button onClick={() => setFilterTag('all')}
                style={{ background:'none', border:'none', cursor:'pointer', color:c.text,
                  fontSize:10, padding:0, marginLeft:2, display:'flex', alignItems:'center' }}>
                <i className="ti ti-x" style={{ fontSize:9 }}/>
              </button>
            </span>
          </div>
        )
      })()}

      {/* Tabla — desktop */}
      <div className="card ttable-responsive">
        <table className="ttable">
          <thead>
            <tr>
              <th style={{ width:'22%' }}>Participante</th>
              <th style={{ width:'16%' }}>Cursos</th>
              <th style={{ width:'22%' }}>Tiempo de acceso</th>
              <th style={{ width:'20%' }}>Etiquetas</th>
              <th style={{ width:'10%' }}>Estado</th>
              <th style={{ width:'10%' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(p => {
              const days = getAccessDays(p, courses)
              const exp   = p.access && isExpired(p.fecha, days)
              const warn  = p.access && isWarning(p.fecha, days)
              const ptags = tags.filter(t => (p.tags||[]).includes(t.id))
              return (
                <tr key={p.id} className={exp ? 'row-exp' : warn ? 'row-warn' : ''}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <Avatar name={p.name} variant={exp ? 'red' : warn ? 'warn' : 'cream'}/>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.name}
                        </div>
                        <div className="text-xs text-muted" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-muted" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.courses.map(shortName).join(', ')}
                  </td>
                  <td>
                    {p.access ? <AccessBar fecha={p.fecha} days={days}/> : <span className="text-sm text-muted">Sin acceso</span>}
                  </td>
                  <td>
                    {ptags.length
                      ? <div style={{ display:'flex', flexWrap:'wrap' }}>{ptags.map(t => <TagPill key={t.id} tag={t} small/>)}</div>
                      : <span className="text-xs text-muted" style={{ fontStyle:'italic' }}>Sin etiquetas</span>}
                  </td>
                  <td><TimerBadge fecha={p.fecha} access={p.access} days={days}/></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn-icon" onClick={() => openEdit(p)} title="Editar">
                        <i className="ti ti-edit"/> Editar
                      </button>
                      <button className="btn-icon" onClick={() => setView(`profile_${p.id}`)} title="Perfil">
                        <i className="ti ti-user"/>
                      </button>
                      <button className={`btn-icon${p.access ? ' orange' : ''}`}
                        onClick={() => onToggleAccess(p.id)}>
                        <i className="ti ti-key"/>
                      </button>
                      <button className="btn-icon danger"
                        onClick={() => { if (confirm('¿Eliminar?')) onDelete(p.id) }}>
                        <i className="ti ti-trash"/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--gray)' }}>
                  No se encontraron participantes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — móvil */}
      <div className="card-stack">
        {filtered.length ? filtered.map(p => {
          const days = getAccessDays(p, courses)
          const exp   = p.access && isExpired(p.fecha, days)
          const warn  = p.access && isWarning(p.fecha, days)
          const ptags = tags.filter(t => (p.tags||[]).includes(t.id))
          return (
            <div key={p.id} className={`pcard ${exp ? 'row-exp' : warn ? 'row-warn' : ''}`}>
              <div className="pcard-head">
                <Avatar name={p.name} variant={exp ? 'red' : warn ? 'warn' : 'cream'}/>
                <div className="pcard-id">
                  <div className="pname">{p.name}</div>
                  <div className="pemail">{p.email}</div>
                </div>
                <TimerBadge fecha={p.fecha} access={p.access} days={days}/>
              </div>

              {p.access && (
                <div className="pcard-section">
                  <span className="pcard-label">Tiempo de acceso</span>
                  <AccessBar fecha={p.fecha} days={days}/>
                </div>
              )}

              {p.courses.length > 0 && (
                <div className="pcard-section">
                  <span className="pcard-label">Cursos</span>
                  <div style={{ fontSize:12, color:'var(--gray)' }}>
                    {p.courses.map(shortName).join(', ')}
                  </div>
                </div>
              )}

              {ptags.length > 0 && (
                <div className="pcard-section">
                  <span className="pcard-label">Etiquetas</span>
                  <div style={{ display:'flex', flexWrap:'wrap' }}>
                    {ptags.map(t => <TagPill key={t.id} tag={t} small/>)}
                  </div>
                </div>
              )}

              <div className="pcard-actions">
                <button className="btn-icon" onClick={() => openEdit(p)}>
                  <i className="ti ti-edit"/> Editar
                </button>
                <button className="btn-icon" onClick={() => setView(`profile_${p.id}`)}>
                  <i className="ti ti-user"/> Perfil
                </button>
                <button className={`btn-icon${p.access ? ' orange' : ''}`}
                  onClick={() => onToggleAccess(p.id)}>
                  <i className="ti ti-key"/> {p.access ? 'Revocar' : 'Acceso'}
                </button>
                <button className="btn-icon danger"
                  onClick={() => { if (confirm('¿Eliminar?')) onDelete(p.id) }}>
                  <i className="ti ti-trash"/>
                </button>
              </div>
            </div>
          )
        }) : (
          <div className="card" style={{ padding:32, textAlign:'center', color:'var(--gray)' }}>
            No se encontraron participantes
          </div>
        )}
      </div>
    </div>
  )
}
