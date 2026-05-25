import { isExpired, isWarning, fmtDate, getAccessDays } from '../utils/time.js'
import { StatCard, AccessBar, TimerBadge, Avatar } from './UI.jsx'

export default function Dashboard({ participants, courses, setView }) {
  const today    = new Date().toLocaleDateString('es-CR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
  const activos  = participants.filter(p=>p.status==='activo').length
  const conAcc   = participants.filter(p=>p.access).length
  const expired  = participants.filter(p=>p.access&&isExpired(p.fecha, getAccessDays(p, courses))).length
  const warning  = participants.filter(p=>p.access&&isWarning(p.fecha, getAccessDays(p, courses))).length
  const recent   = [...participants].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,6)
  const activeCourses = courses.filter(c=>c.active)

  return (
    <div>
      <div className="page-header">
        <div><h2 className="h1">Dashboard</h2><p className="text-muted" style={{fontSize:13,marginTop:3}}>Resumen · {today}</p></div>
      </div>
      <div className="stats-grid">
        <StatCard num={participants.length} label="Total participantes"/>
        <StatCard num={activos}  label="Activos"/>
        <StatCard num={conAcc}   label="Con acceso"/>
        <StatCard num={warning}  label="Expiran ≤7 días"   accent="var(--orange)"/>
        <StatCard num={expired}  label="Accesos expirados" accent="var(--orange-d)"/>
      </div>
      {expired>0&&<div className="alert alert-red"><div className="alert-title"><i className="ti ti-lock"/> {expired} acceso{expired!==1?'s':''} expirado{expired!==1?'s':''} — revocados automáticamente</div><p className="text-sm text-muted">Podés renovarlos desde Control de Accesos.</p></div>}
      {warning>0&&<div className="alert alert-orange"><div className="alert-title"><i className="ti ti-clock"/> {warning} participante{warning!==1?'s':''} con acceso por vencer</div><p className="text-sm text-muted">Enviá el recordatorio de prueba desde Recordatorios.</p></div>}
      <h3 className="h3" style={{marginBottom:14}}>Cursos y talleres activos</h3>
      <div className="grid-2col" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:12,marginBottom:24}}>
        {activeCourses.map(c=>{
          const enr=participants.filter(p=>p.courses.includes(c.id)).length
          const pct=Math.round(enr/c.capacity*100)
          return(
            <div key={c.id} className="card" style={{padding:'14px 16px'}}>
              <div style={{fontWeight:500,marginBottom:3}}>{c.short}</div>
              <div className="text-xs text-muted" style={{marginBottom:6}}>{fmtDate(c.start)} → {fmtDate(c.end)} · {c.modalidad}</div>
              <div className="text-xs text-muted" style={{marginBottom:5}}>{enr}/{c.capacity} inscritos · {c.accessDays ?? 45}d de acceso</div>
              <div className="pbar-wrap"><div className="pbar pbar-green" style={{width:`${pct}%`}}/></div>
            </div>
          )
        })}
        {activeCourses.length===0&&<div className="card" style={{padding:20,color:'var(--gray)',fontSize:13,gridColumn:'1/-1'}}>No hay cursos activos. <button onClick={()=>setView('courses')} style={{background:'none',border:'none',color:'var(--orange)',cursor:'pointer',fontSize:13,fontFamily:'inherit',textDecoration:'underline'}}>Crear uno</button>.</div>}
      </div>
      <h3 className="h3" style={{marginBottom:12}}>Actividad reciente</h3>
      <div className="card">
        {recent.map((p,i)=>{
          const days = getAccessDays(p, courses)
          return (
            <div key={p.id} onClick={()=>setView(`profile_${p.id}`)}
              className="recent-row"
              style={{display:'flex',alignItems:'center',padding:'10px 16px',borderTop:i>0?'1px solid var(--cream-2)':'none',gap:12,cursor:'pointer',flexWrap:'wrap'}}>
              <Avatar name={p.name} variant={isExpired(p.fecha,days)?'red':isWarning(p.fecha,days)?'warn':'cream'}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:500,fontSize:13}}>{p.name}</div>
                <div className="text-xs text-muted" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.email}</div>
              </div>
              <div style={{flex:'0 1 160px',minWidth:0,width:'min(160px,35vw)'}}><AccessBar fecha={p.fecha} compact days={days}/></div>
              <TimerBadge fecha={p.fecha} access={p.access} days={days}/>
            </div>
          )
        })}
      </div>
    </div>
  )
}
