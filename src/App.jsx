// ============================================================
//  App.jsx — React JSX  v4.2
//  Orquesta participantes, cursos, etiquetas y todas las vistas.
//  El guard de sesión se hace afuera (App) y el contenido vive
//  en AuthenticatedApp para no romper Rules of Hooks.
// ============================================================

import { useState, useCallback } from 'react'
import { useParticipants }  from './hooks/useParticipants.js'
import { useTags }          from './hooks/useTags.js'
import { useCourses }       from './hooks/useCourses.js'
import { useAuth }          from './hooks/useAuth.js'
import Sidebar              from './components/Sidebar.jsx'
import Dashboard            from './components/Dashboard.jsx'
import ParticipantsView     from './components/ParticipantsView.jsx'
import ProfileView          from './components/ProfileView.jsx'
import CoursesView          from './components/CoursesView.jsx'
import AccessView           from './components/AccessView.jsx'
import RemindersView        from './components/RemindersView.jsx'
import TagsView             from './components/TagsView.jsx'
import ImportView           from './components/ImportView.jsx'
import ExportView           from './components/ExportView.jsx'
import LoginView            from './components/LoginView.jsx'
import { Toast }            from './components/UI.jsx'

export default function App() {
  const { user, loading, signIn, signOut, isSupabaseConfigured } = useAuth()

  if (isSupabaseConfigured && loading) {
    return <div className="login-shell"><div className="poppins-medium text-muted">Cargando…</div></div>
  }
  if (isSupabaseConfigured && !user) {
    return <LoginView onSignIn={signIn}/>
  }
  return <AuthenticatedApp user={user} onSignOut={signOut}/>
}

function AuthenticatedApp({ user, onSignOut }) {
  const [view,     setView]  = useState('dashboard')
  const [toastMsg, setToast] = useState('')
  const toast = useCallback(msg => setToast(msg), [])

  // ── Estado global ─────────────────────────────────────────
  const {
    participants, setParticipants,
    addParticipant, updateParticipant, deleteParticipant,
    toggleAccess, renewAccess, importParticipants,
  } = useParticipants()

  const { tags, addTag, editTag, deleteTag }         = useTags()
  const { courses, addCourse, updateCourse, deleteCourse, toggleActive } = useCourses()

  // ── Actualizar etiquetas de participante ──────────────────
  const updateParticipantTags = useCallback((pid, newTags) => {
    const p = participants.find(x => x.id === pid)
    if (p) updateParticipant(pid, { ...p, tags: newTags })
    toast('Etiquetas actualizadas ✓')
  }, [participants, updateParticipant])

  // ── Wrappers participantes ────────────────────────────────
  const handleAdd    = f      => { addParticipant(f);             toast('Participante agregado ✓')    }
  const handleUpdate = (id,f) => { updateParticipant(id,f);       toast('Participante actualizado ✓') }
  const handleDelete = id     => { deleteParticipant(id);         toast('Participante eliminado')     }
  const handleToggle = id     => {
    const p = participants.find(x => x.id === id)
    toggleAccess(id)
    toast(p?.access ? 'Acceso revocado' : 'Acceso activado ✓')
  }
  const handleRenew  = id     => { renewAccess(id);               toast('Acceso renovado ✓')         }
  const handleImport = list   => {
    importParticipants(list)
    toast(`${list.length} participante${list.length!==1?'s':''} importado${list.length!==1?'s':''} ✓`)
  }

  // ── Wrappers cursos ───────────────────────────────────────
  const handleAddCourse    = form    => { addCourse(form);              toast('Programa creado ✓')          }
  const handleUpdateCourse = (id,f)  => { updateCourse(id,f);           toast('Programa actualizado ✓')     }
  const handleDeleteCourse = id      => {
    const c = courses.find(x => x.id === id)
    if (!confirm(`¿Eliminar "${c?.name}"? Se quitará de todos los participantes.`)) return
    deleteCourse(id, setParticipants)
    toast('Programa eliminado')
  }
  const handleToggleActive = id      => { toggleActive(id);             toast('Estado actualizado ✓')       }

  // ── Wrappers etiquetas ────────────────────────────────────
  const handleAddTag    = (n,c) => { addTag(n,c);          toast(`Etiqueta "${n}" creada ✓`)    }
  const handleEditTag   = (id,n,c) => { editTag(id,n,c);   toast('Etiqueta actualizada ✓')      }
  const handleDeleteTag = id    => {
    const t = tags.find(x => x.id === id)
    if (!confirm(`¿Eliminar la etiqueta "${t?.name}"?`)) return
    deleteTag(id, setParticipants)
    toast('Etiqueta eliminada')
  }

  // ── Router ────────────────────────────────────────────────
  const shared = { participants, courses, tags, setView }

  const renderView = () => {
    if (view === 'dashboard')
      return <Dashboard {...shared}/>

    if (view === 'participants')
      return <ParticipantsView {...shared}
        onAdd={handleAdd} onUpdate={handleUpdate}
        onDelete={handleDelete} onToggleAccess={handleToggle}/>

    if (view.startsWith('profile_'))
      return <ProfileView id={view.replace('profile_','')} {...shared}
        onToggleAccess={handleToggle} onRenew={handleRenew}
        onUpdateTags={updateParticipantTags}/>

    if (view === 'courses')
      return <CoursesView {...shared}
        onAdd={handleAddCourse} onUpdate={handleUpdateCourse}
        onDelete={handleDeleteCourse} onToggleActive={handleToggleActive}/>

    if (view === 'access')
      return <AccessView {...shared}
        onToggleAccess={handleToggle} onRenew={handleRenew}/>

    if (view === 'reminders')
      return <RemindersView {...shared}/>

    if (view === 'tags')
      return <TagsView tags={tags} participants={participants}
        onAdd={handleAddTag} onEdit={handleEditTag} onDelete={handleDeleteTag}/>

    if (view === 'import')
      return <ImportView participants={participants} onImport={handleImport}/>

    if (view === 'export')
      return <ExportView participants={participants} courses={courses} tags={tags}/>

    return <Dashboard {...shared}/>
  }

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} participants={participants}
        userEmail={user?.email} onSignOut={onSignOut}/>
      <main className="main-content">{renderView()}</main>
      <Toast message={toastMsg} onHide={() => setToast('')}/>
    </div>
  )
}
