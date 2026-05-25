// ============================================================
//  RemindersView.jsx — React JSX
// ============================================================
import { needsExamReminder, daysLeft, examDeadlineDate, expiryDate, getAccessDays } from '../utils/time.js'

import { AccessBar, Badge } from './UI.jsx'
import { buildReminderEmail, openEmailClient, copyEmailToClipboard } from '../utils/email.js'
import { useState } from 'react'
import { Modal } from './UI.jsx'

function EmailModal({ participant, onClose }) {
  const em = buildReminderEmail(participant)
  return (
    <Modal onClose={onClose} width={640}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <h3 className="h2"><i className="ti ti-mail" style={{color:'var(--orange)',marginRight:8}}/>Correo recordatorio</h3>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray)',fontSize:18}}><i className="ti ti-x"/></button>
      </div>
      <div className="email-preview">
        <div className="email-subject">Asunto: {em.subject}</div>
        <div className="text-sm text-muted" style={{marginBottom:8}}><b>Para:</b> {em.to} &nbsp;|&nbsp; <b>De:</b> {em.from}</div>
        <pre style={{whiteSpace:'pre-wrap',fontFamily:'var(--font-body)',fontSize:13,lineHeight:1.7}}>{em.body}</pre>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button className="btn btn-ghost" onClick={() => copyEmailToClipboard(participant).then(() => alert('Copiado al portapapeles'))}><i className="ti ti-copy"/> Copiar</button>
        <button className="btn btn-orange" onClick={() => { openEmailClient(participant); onClose() }}><i className="ti ti-mail-forward"/> Abrir en correo</button>
      </div>
    </Modal>
  )
}

export default function RemindersView({ participants, courses = [], setView }) {
  const [previewId, setPreviewId] = useState(null)
  const pending = participants.filter(p => p.access && needsExamReminder(p.fecha, getAccessDays(p, courses)))
  const previewP = previewId ? participants.find(x => x.id === previewId) : null

  return (
    <div>
      {previewP && <EmailModal participant={previewP} onClose={() => setPreviewId(null)}/>}
      <div className="page-header"><div><h2 className="h1">Recordatorios</h2><p className="text-muted" style={{fontSize:13,marginTop:3}}>Participantes que deben realizar su prueba esta semana</p></div></div>

      {pending.length === 0
        ? <div className="alert alert-green"><i className="ti ti-check"/> No hay recordatorios pendientes por ahora.</div>
        : pending.map(p => {
          const days = getAccessDays(p, courses)
          const courseNames = p.courses.map(id => courses.find(c => c.id === id)?.short || id).join(', ')
          return (
            <div key={p.id} className="card" style={{padding:20,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <div style={{fontWeight:500,fontSize:14}}>{p.name}</div>
                  <div className="text-xs text-muted">{p.email} · {courseNames}</div>
                </div>
                <Badge type="orange"><i className="ti ti-clock" style={{fontSize:11,verticalAlign:-1,marginRight:3}}/>{daysLeft(p.fecha, days)}d para expirar</Badge>
              </div>
              <AccessBar fecha={p.fecha} days={days}/>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:10,fontSize:12,color:'var(--gray)'}}>
                <span>Prueba antes del: <b style={{color:'var(--black)'}}>{examDeadlineDate(p.fecha, days)}</b></span>
                <span>· Acceso expira: <b style={{color:'var(--orange-d)'}}>{expiryDate(p.fecha, days)}</b></span>
              </div>
              <div style={{marginTop:14,display:'flex',gap:8}}>
                <button className="btn btn-orange btn-sm" onClick={() => setPreviewId(p.id)}><i className="ti ti-mail-forward"/> Ver correo y enviar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setView(`profile_${p.id}`)}><i className="ti ti-user"/> Ver perfil</button>
              </div>
            </div>
          )
        })}
    </div>
  )
}
