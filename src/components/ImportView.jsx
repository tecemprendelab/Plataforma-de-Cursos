// ============================================================
//  ImportView.jsx — React JSX
//  Importación con IA. Usa cursos dinámicos para el match.
// ============================================================

import { useState, useRef } from 'react'

function matchCourseIds(courseNames, courses) {
  return (courseNames || []).map(name => {
    const n = name.toLowerCase()
    return courses.find(c =>
      c.name.toLowerCase().includes(n) ||
      c.short.toLowerCase().includes(n) ||
      n.includes(c.short.toLowerCase())
    )?.id || null
  }).filter(Boolean)
}

export default function ImportView({ courses, onImport }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [drag,    setDrag]    = useState(false)
  const fileRef = useRef()

  const processFile = async (file) => {
    if (!file) return
    setLoading(true); setResults(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64   = ev.target.result.split(',')[1]
      const mimeType = file.type || 'image/jpeg'
      try {
        const resp = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mimeType }),
        })
        const data   = await resp.json()
        const text   = data.content?.find(b => b.type==='text')?.text || '{}'
        const parsed = JSON.parse(text.replace(/```json|```/g,'').trim())
        setResults(parsed.participants || [])
      } catch { setResults([]) }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const confirmOne = (idx) => {
    const imp = results[idx]
    onImport([{ ...imp, courses: matchCourseIds(imp.courses, courses) }])
    setResults(prev => prev.filter((_,i) => i !== idx))
  }

  const confirmAll = () => {
    onImport(results.map(imp => ({ ...imp, courses: matchCourseIds(imp.courses, courses) })))
    setResults([])
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h1">Importar con IA</h2>
          <p className="text-muted" style={{fontSize:13,marginTop:3}}>
            Subí una captura de pantalla de un formulario de matrícula
          </p>
        </div>
      </div>

      <div className={`drop-area${drag?' drag':''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);processFile(e.dataTransfer.files[0])}}>
        <i className="ti ti-camera-ai" style={{fontSize:36,color:'var(--gray)',display:'block',marginBottom:10}}/>
        <div style={{fontWeight:500,fontSize:14,marginBottom:6}}>
          Arrastrá una imagen aquí o hacé clic para seleccionar
        </div>
        <div className="text-sm text-muted">
          Soporta JPG, PNG · La IA extrae nombre, correo, teléfono y curso
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
        onChange={e=>processFile(e.target.files[0])}/>

      {loading && (
        <div style={{textAlign:'center',padding:40,color:'var(--gray)'}}>
          <i className="ti ti-loader-2 spinner" style={{fontSize:32,color:'var(--orange)',display:'block',marginBottom:12}}/>
          <div style={{fontSize:14}}>Analizando imagen con IA...</div>
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 className="h3">{results.length} participante{results.length!==1?'s':''} detectado{results.length!==1?'s':''}</h3>
            <button className="btn btn-orange btn-sm" onClick={confirmAll}>
              <i className="ti ti-check-all"/> Importar todos
            </button>
          </div>
          {results.map((r,i) => (
            <div key={i} className="card" style={{padding:16,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:500,fontSize:14,marginBottom:4}}>{r.name||'Sin nombre'}</div>
                  <div className="text-sm text-muted">{r.email||'—'} · {r.phone||'—'}</div>
                  {r.courses?.length>0&&<div className="text-xs text-muted" style={{marginTop:2}}>Cursos: {r.courses.join(', ')}</div>}
                  {r.notes&&<div className="text-xs text-muted" style={{marginTop:4}}>Nota: {r.notes}</div>}
                </div>
                <div style={{display:'flex',gap:8,marginLeft:12}}>
                  <button className="btn btn-orange btn-sm" onClick={()=>confirmOne(i)}>
                    <i className="ti ti-user-plus"/> Agregar
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    onClick={()=>setResults(prev=>prev.filter((_,j)=>j!==i))}>
                    <i className="ti ti-x"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results && results.length===0 && !loading && (
        <div className="alert alert-green" style={{marginTop:16}}>
          <i className="ti ti-check"/> Todos los participantes han sido importados.
        </div>
      )}
    </div>
  )
}
