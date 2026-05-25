// ============================================================
//  GalleryView.jsx — Galería de plantillas SVG para certificados
// ============================================================

import { useState, useEffect, useRef } from 'react'

const CERT_API = 'https://plataforma-de-cursos-1-l606.onrender.com'

const SVG_GALLERY = [
  {
    id: 'g1', name: 'Clásico Dorado',  file: 'template_classic.svg',
    course: 'Todos los programas',      style: 'Institucional',
    colors: ['#C9A227','#8B1A1A','#2C1810'],
    tags:   ['horizontal','clásico','dorado','institucional'],
    ids:    { name:'recipient_name', date:'issue_date' },
    added:  '2026-01-10',
  },
  {
    id: 'g2', name: 'Moderno Oscuro',  file: 'template_modern.svg',
    course: 'Todos los programas',      style: 'Contemporáneo',
    colors: ['#0D1B2A','#00C9FF','#92FE9D'],
    tags:   ['horizontal','moderno','oscuro','tech'],
    ids:    { name:'recipient_name', date:'issue_date' },
    added:  '2026-01-10',
  },
]

function ColorDot({ color }) {
  return (
    <span title={color} style={{
      display:'inline-block', width:12, height:12, borderRadius:'50%',
      background:color, border:'1px solid rgba(0,0,0,0.1)',
    }} />
  )
}

function SvgPreviewCard({ tpl, onSelect, onPreview, selected }) {
  return (
    <div
      onClick={() => onSelect(tpl)}
      className={`bg-white border-2 rounded-2xl overflow-hidden transition-all cursor-pointer group
        ${selected ? 'border-orange-500 shadow-lg shadow-orange-100' : 'border-stone-200 hover:border-orange-300 hover:shadow-md'}`}
    >
      <div className="relative bg-stone-100 overflow-hidden" style={{aspectRatio:'1.414/1'}}>
        {tpl.svgContent ? (
          <div
            className="w-full h-full"
            style={{transform:'scale(0.45)', transformOrigin:'top left', width:'222%', pointerEvents:'none'}}
            dangerouslySetInnerHTML={{ __html: tpl.svgContent.replace(/<svg/, '<svg style="display:block;width:100%;height:auto"') }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-300">
            <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            <span className="text-xs">Sin vista previa</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={e => { e.stopPropagation(); onPreview(tpl) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 text-xs font-semibold rounded-lg shadow-lg hover:bg-orange-50 transition-colors">
            <span className="material-symbols-outlined" style={{fontSize:14}}>zoom_in</span>
            Ver completo
          </button>
        </div>
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-white" style={{fontSize:14}}>check</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">{tpl.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">{tpl.style}</p>
          </div>
          <div className="flex gap-1 mt-0.5">
            {tpl.colors.map(c => <ColorDot key={c} color={c} />)}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-mono">id:{tpl.ids.name}</span>
          <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-mono">id:{tpl.ids.date}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {tpl.tags.map(tag => (
            <span key={tag} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SvgFullModal({ tpl, onClose, onUse }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tpl.name}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{tpl.file}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onUse(tpl)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
              <span className="material-symbols-outlined" style={{fontSize:16}}>workspace_premium</span>
              Usar esta plantilla
            </button>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-lg hover:bg-stone-100">
              <span className="material-symbols-outlined" style={{fontSize:18}}>close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-stone-50 flex items-center justify-center">
          {tpl.svgContent ? (
            <div className="bg-white rounded-xl shadow-md w-full max-w-3xl"
              dangerouslySetInnerHTML={{ __html: tpl.svgContent.replace(/<svg/, '<svg style="display:block;width:100%;height:auto"') }} />
          ) : (
            <div className="flex flex-col items-center gap-3 text-stone-300 py-20">
              <span className="material-symbols-outlined text-6xl">image_not_supported</span>
              <p className="text-sm">Vista previa no disponible</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50">
          <div className="flex flex-wrap gap-6 text-xs text-stone-500">
            <span><strong className="text-gray-700">Estilo:</strong> {tpl.style}</span>
            <span><strong className="text-gray-700">ID nombre:</strong> <code className="font-mono bg-stone-100 px-1 rounded">{tpl.ids.name}</code></span>
            <span><strong className="text-gray-700">ID fecha:</strong> <code className="font-mono bg-stone-100 px-1 rounded">{tpl.ids.date}</code></span>
            <span><strong className="text-gray-700">Agregada:</strong> {tpl.added}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GalleryView({ onUseCertificate }) {
  const [templates,    setTemplates]    = useState(SVG_GALLERY)
  const [search,       setSearch]       = useState('')
  const [filterStyle,  setFilterStyle]  = useState('all')
  const [selectedId,   setSelectedId]   = useState(null)
  const [previewTpl,   setPreviewTpl]   = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [loadingIds,   setLoadingIds]   = useState(new Set())
  const fileRef = useRef()

  useEffect(() => {
    templates.forEach(tpl => {
      if (!tpl.svgContent) fetchPreview(tpl.id, tpl.file)
    })
  }, [])

  const fetchPreview = async (id, filename) => {
    setLoadingIds(s => new Set([...s, id]))
    try {
      const form = new FormData()
      form.append('template_name', filename)
      const r = await fetch(`${CERT_API}/api/preview`, { method:'POST', body:form })
      if (r.ok) {
        const svg = await r.text()
        setTemplates(ts => ts.map(t => t.id === id ? {...t, svgContent:svg} : t))
      }
    } catch(_) {}
    finally { setLoadingIds(s => { const ns = new Set(s); ns.delete(id); return ns }) }
  }

  const handleUpload = async (file) => {
    if (!file || !file.name.endsWith('.svg')) return
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const r = await fetch(`${CERT_API}/api/analyze`, { method:'POST', body:form })
      const d = await r.json()

      const form2 = new FormData(); form2.append('file', file)
      const r2 = await fetch(`${CERT_API}/api/preview`, { method:'POST', body:form2 })
      const svgContent = r2.ok ? await r2.text() : null

      const nameEl = d.elements?.find(e => /name|nombre|participante/i.test(e.id)) || d.elements?.[0]
      const dateEl = d.elements?.find(e => /date|fecha/i.test(e.id)) || d.elements?.[1] || d.elements?.[0]

      const newTpl = {
        id:    'g' + Date.now(),
        name:  file.name.replace('.svg','').replace(/[-_]/g,' '),
        file:  file.name,
        course:'Personalizado',
        style: 'Personalizado',
        colors:['#666666'],
        tags:  ['personalizado','subido'],
        ids:   { name: nameEl?.id||'', date: dateEl?.id||'' },
        svgContent,
        added: new Date().toISOString().split('T')[0],
        _file: file,
      }
      setTemplates(ts => [...ts, newTpl])
    } catch(e) { console.error(e) }
    finally { setUploading(false) }
  }

  const styles  = ['all', ...new Set(templates.map(t => t.style))]
  const filtered = templates.filter(t => {
    const q = search.toLowerCase()
    return (filterStyle === 'all' || t.style === filterStyle)
      && (!q || t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q)))
  })

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--black)' }}>
            Galería de Plantillas
          </h2>
          <p style={{ fontSize:13, color:'var(--gray)', marginTop:4 }}>Explorá y administrá las plantillas SVG disponibles</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <input ref={fileRef} type="file" accept=".svg" className="hidden"
            onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = '' }} />
          <button onClick={() => fileRef.current.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:border-orange-300 hover:text-orange-600 disabled:opacity-40 transition-colors bg-white">
            {uploading
              ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:16}}>refresh</span>Procesando…</>
              : <><span className="material-symbols-outlined" style={{fontSize:16}}>upload_file</span>Subir SVG</>}
          </button>
          {selectedId && (
            <button onClick={() => onUseCertificate(templates.find(t => t.id === selectedId))}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
              <span className="material-symbols-outlined" style={{fontSize:16}}>workspace_premium</span>
              Usar seleccionada
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" style={{fontSize:16}}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o etiqueta…"
            className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
          {styles.map(s => (
            <button key={s} onClick={() => setFilterStyle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize
                ${filterStyle === s ? 'bg-white text-gray-900 shadow-sm' : 'text-stone-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 rounded-xl text-xs text-stone-500">
          <span className="material-symbols-outlined" style={{fontSize:14}}>grid_view</span>
          {filtered.length} plantilla{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-4">
          <span className="material-symbols-outlined text-6xl">photo_library</span>
          <p className="text-sm">No hay plantillas que coincidan con la búsqueda</p>
          <button onClick={() => { setSearch(''); setFilterStyle('all') }} className="text-xs text-orange-600 hover:underline">Limpiar filtros</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(tpl => (
          <SvgPreviewCard key={tpl.id}
            tpl={{ ...tpl, svgContent: loadingIds.has(tpl.id) ? null : tpl.svgContent }}
            selected={selectedId === tpl.id}
            onSelect={t => setSelectedId(t.id === selectedId ? null : t.id)}
            onPreview={t => setPreviewTpl(t)}
          />
        ))}
      </div>

      {selectedId && (() => {
        const t = templates.find(x => x.id === selectedId)
        return (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 bg-gray-900 text-amber-50 rounded-2xl shadow-xl z-40 text-sm">
            <span className="material-symbols-outlined text-orange-400" style={{fontSize:18}}>workspace_premium</span>
            <span className="font-medium">{t.name}</span>
            <span className="text-stone-400">·</span>
            <code className="font-mono text-xs text-stone-400">{t.file}</code>
            <button onClick={() => onUseCertificate(t)}
              className="ml-2 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors">
              Usar →
            </button>
            <button onClick={() => setSelectedId(null)} className="text-stone-500 hover:text-stone-300 ml-1">
              <span className="material-symbols-outlined" style={{fontSize:16}}>close</span>
            </button>
          </div>
        )
      })()}

      {previewTpl && (
        <SvgFullModal tpl={previewTpl} onClose={() => setPreviewTpl(null)}
          onUse={t => { setPreviewTpl(null); onUseCertificate(t) }} />
      )}
    </div>
  )
}
