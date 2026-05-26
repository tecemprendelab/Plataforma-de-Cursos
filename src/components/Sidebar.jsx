// ============================================================
//  Sidebar.jsx — React JSX
// ============================================================

import { isExpired, needsExamReminder, getAccessDays } from '../utils/time.js'

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
  { id:'import',       icon:'ti-file-spreadsheet', label:'Importar CSV'        },
  { id:'export',       icon:'ti-download',         label:'Exportar datos'      },
  { section:'Certificados' },
  { id:'certificates', icon:'ti-certificate',      label:'Certificados'        },
  { id:'gallery',      icon:'ti-photo',             label:'Galería SVG'         },
]

export default function Sidebar({ view, setView, participants, courses = [], userEmail, onSignOut, open, onClose, theme, onToggleTheme }) {
  const expCount    = participants.filter(p => isExpired(p.fecha, getAccessDays(p, courses))).length
  const remindCount = participants.filter(p => p.access && needsExamReminder(p.fecha, getAccessDays(p, courses))).length
  const activeBase  = view.startsWith('profile_') ? 'participants' : view
  const isDark      = theme === 'dark'

  const handleNav = (id) => {
    setView(id)
    if (onClose) onClose()
  }

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose}/>}
      <aside className={`sidebar${open ? ' open' : ''}`}
        style={{ width:220, background:'var(--sidebar-bg)', minHeight:'100vh',
          display:'flex', flexDirection:'column', padding:'24px 0',
          flexShrink:0, position:'fixed', top:0, left:0, height:'100vh', overflowY:'auto', zIndex:10 }}>
        <div style={{ padding:'0 20px 28px', display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ width:36, height:36, background:'var(--orange)', borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
              <span style={{ color:'#fff', fontFamily:'var(--font-display)', fontSize:15 }}>T</span>
            </div>
            <div style={{ color:'var(--sidebar-text)', fontFamily:'var(--font-display)', fontSize:15, lineHeight:1.2 }}>
              TEC Emprende Lab
            </div>
            <div style={{ color:'var(--gray)', fontSize:11, marginTop:3 }}>Panel de gestión</div>
          </div>
          {onToggleTheme && (
            <button onClick={onToggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              style={{ background:'transparent', border:'1px solid #3A332B', color:'var(--sidebar-text)',
                borderRadius:8, padding:'6px 8px', cursor:'pointer', fontSize:14, lineHeight:1,
                display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`}/>
            </button>
          )}
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
              <div key={item.id} onClick={() => handleNav(item.id)}
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
        {userEmail && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid #3A332B',
            display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1, minWidth:0, color:'var(--sidebar-text)', fontSize:12,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={userEmail}>
              {userEmail}
            </div>
            <button onClick={onSignOut} title="Cerrar sesión"
              style={{ background:'transparent', border:'1px solid #3A332B', color:'var(--gray)',
                borderRadius:6, padding:'4px 8px', fontSize:11, cursor:'pointer' }}>
              Salir
            </button>
          </div>
        )}
        <div style={{ padding:'16px 20px', borderTop:'1px solid #3A332B',
          fontSize:11, color:'var(--gray)' }}>
          v4.2 · TEC Emprende Lab
        </div>
      </aside>
    </>
  )
}
