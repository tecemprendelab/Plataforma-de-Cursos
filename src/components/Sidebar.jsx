// ============================================================
//  Sidebar.jsx — React JSX
// ============================================================

import { isExpired, needsExamReminder } from '../utils/time.js'

const NAV = [
  { section:'Principal' },
  { id:'dashboard',    icon:'ti-layout-dashboard', label:'Dashboard'          },
  { id:'participants', icon:'ti-users',            label:'Participantes'       },
  { section:'Programas' },
  { id:'courses',      icon:'ti-book',             label:'Cursos y Talleres'   },
  { section:'Accesos' },
  { id:'access',       icon:'ti-key',              label:'Control de Accesos', badge:'exp'    },
  { id:'reminders',    icon:'ti-mail',             label:'Recordatorios',      badge:'remind' },
  { section:'Organización' },
  { id:'tags',         icon:'ti-tags',             label:'Etiquetas'           },
  { section:'Herramientas' },
  { id:'import',       icon:'ti-camera-ai',        label:'Importar con IA'    },
  { id:'export',       icon:'ti-download',         label:'Exportar datos'      },
]

export default function Sidebar({ view, setView, participants }) {
  const expCount    = participants.filter(p => isExpired(p.fecha)).length
  const remindCount = participants.filter(p => p.access && needsExamReminder(p.fecha)).length
  const activeBase  = view.startsWith('profile_') ? 'participants' : view

  return (
    <aside style={{ width:220, background:'var(--black)', minHeight:'100vh',
      display:'flex', flexDirection:'column', padding:'24px 0',
      flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
      <div style={{ padding:'0 20px 28px' }}>
        <div style={{ width:36, height:36, background:'var(--orange)', borderRadius:8,
          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
          <span style={{ color:'#fff', fontFamily:'var(--font-display)', fontSize:15 }}>T</span>
        </div>
        <div style={{ color:'var(--cream)', fontFamily:'var(--font-display)', fontSize:15, lineHeight:1.2 }}>
          TEC Emprende Lab
        </div>
        <div style={{ color:'var(--gray)', fontSize:11, marginTop:3 }}>Panel de gestión</div>
      </div>
      <div style={{ padding:'0 10px', flex:1 }}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} style={{ padding:'8px 12px 4px', fontSize:10, fontWeight:600,
              letterSpacing:1, color:'#4A4540', textTransform:'uppercase', marginTop: i > 0 ? 4 : 0 }}>
              {item.section}
            </div>
          )
          const isActive = activeBase === item.id
          const badge    = item.badge === 'exp' ? expCount : item.badge === 'remind' ? remindCount : 0
          return (
            <div key={item.id} onClick={() => setView(item.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                borderRadius:8, cursor:'pointer', marginBottom:2,
                background: isActive ? 'var(--orange)' : 'transparent',
                transition:'all .15s', color: isActive ? '#fff' : 'var(--gray)',
                fontSize:13, fontWeight: isActive ? 500 : 400 }}>
              <i className={`ti ${item.icon}`} style={{ fontSize:15 }}/>
              {item.label}
              {badge > 0 && <span className="notif-dot">{badge}</span>}
            </div>
          )
        })}
      </div>
      <div style={{ padding:'16px 20px', borderTop:'1px solid var(--black-2)',
        fontSize:11, color:'var(--gray)' }}>
        v4.2 · TEC Emprende Lab
      </div>
    </aside>
  )
}
