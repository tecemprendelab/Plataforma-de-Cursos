// ============================================================
//  CertificatesView.jsx — Módulo de generación de certificados
//  Requiere backend Flask corriendo en CERT_API (ver abajo)
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTemplates } from '../hooks/useTemplates.js'

const CERT_API = 'https://plataforma-de-cursos-1-l606.onrender.com'

const TODAY_ES = (() => {
  const d = new Date()
  const m = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
             'septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${m[d.getMonth()]} de ${d.getFullYear()}`
})()

const BUILT_IN_TEMPLATES = [
  { id: 'classic', file: 'template_classic.svg', name: 'Clásico' },
  { id: 'modern',  file: 'template_modern.svg',  name: 'Moderno' },
]

function useDebounce(fn, delay) {
  const t = useRef(null)
  return useCallback((...args) => {
    clearTimeout(t.current)
    t.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

/* ── Atoms ──────────────────────────────────────────────────── */

function CertAlert({ type, msg, onDismiss }) {
  if (!msg) return null
  const s = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }[type] || 'bg-blue-50 border-blue-200 text-blue-800'
  const icons = { success:'check_circle', error:'error', info:'info' }
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm mt-3 ${s}`}>
      <span className="material-symbols-outlined mt-0.5 shrink-0" style={{fontSize:16}}>{icons[type]||'info'}</span>
      <span className="flex-1 leading-relaxed">{msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 ml-1">
          <span className="material-symbols-outlined" style={{fontSize:14}}>close</span>
        </button>
      )}
    </div>
  )
}

function CertDropZone({ accept, title, subtitle, icon, file, onFile }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()
  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
        ${file
          ? 'border-green-400 bg-green-50'
          : drag
            ? 'border-orange-400 bg-orange-50/30'
            : 'border-stone-300 bg-amber-50 hover:border-orange-400'}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = '' }} />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-green-600" style={{fontSize:20}}>check_circle</span>
          <span className="text-sm font-medium text-green-700 truncate max-w-[200px]">{file.name}</span>
          <button onClick={e => { e.stopPropagation(); onFile(null) }} className="ml-1 text-stone-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined" style={{fontSize:16}}>close</span>
          </button>
        </div>
      ) : (
        <>
          <span className="material-symbols-outlined text-orange-400 text-3xl mb-2 block">{icon}</span>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </>
      )}
    </div>
  )
}

function CertFormatToggle({ value, onChange }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-stone-200">
      {[{v:'pdf',icon:'picture_as_pdf',label:'PDF'},{v:'png',icon:'image',label:'PNG'}].map(f => (
        <button key={f.v} onClick={() => onChange(f.v)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors
            ${value === f.v ? 'bg-gray-900 text-amber-50' : 'bg-white text-stone-500 hover:bg-stone-50'}`}>
          <span className="material-symbols-outlined" style={{fontSize:14}}>{f.icon}</span>{f.label}
        </button>
      ))}
    </div>
  )
}

function ConfidenceBadge({ level }) {
  const map = {
    alta:  { cls:'bg-green-100 text-green-800 border-green-300',   icon:'verified' },
    media: { cls:'bg-yellow-100 text-yellow-800 border-yellow-300', icon:'help' },
    baja:  { cls:'bg-red-100 text-red-700 border-red-300',          icon:'warning' },
  }
  const s = map[level] || map.media
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      <span className="material-symbols-outlined" style={{fontSize:12}}>{s.icon}</span>
      Confianza {level}
    </span>
  )
}

/* ── Pestaña Individual ─────────────────────────────────────── */

function CertIndividual({ participants, galleryTplPick, onGalleryConsumed }) {
  const { templates, loadSvgContent } = useTemplates()
  const [templateName,    setTemplateName]    = useState('template_classic.svg')
  const [svgFile,         setSvgFile]         = useState(null)
  const [nameId,          setNameId]          = useState('recipient_name')
  const [dateId,          setDateId]          = useState('issue_date')
  const [recipient,       setRecipient]       = useState('')
  const [date,            setDate]            = useState(TODAY_ES)
  const [fmt,             setFmt]             = useState('pdf')
  const [detectedIds,     setDetectedIds]     = useState([])
  const [loading,         setLoading]         = useState(false)
  const [alert,           setAlert]           = useState(null)
  const [previewSvg,      setPreviewSvg]      = useState(null)
  const [previewLoading,  setPreviewLoading]  = useState(false)
  const [errors,          setErrors]          = useState({})

  useEffect(() => {
    if (!galleryTplPick) return
    if (galleryTplPick._file) {
      setSvgFile(galleryTplPick._file)
      setTemplateName(null)
    } else {
      setTemplateName(galleryTplPick.file)
      setSvgFile(null)
    }
    if (galleryTplPick.ids?.name) setNameId(galleryTplPick.ids.name)
    if (galleryTplPick.ids?.date) setDateId(galleryTplPick.ids.date)
    if (onGalleryConsumed) onGalleryConsumed()
  }, [galleryTplPick])

  const doPreview = useCallback(async (tpl, file, rcp, dt, nId, dId) => {
    if (!tpl && !file) return
    const form = new FormData()
    if (file) form.append('file', file); else form.append('template_name', tpl)
    if (rcp) form.append('recipient_name', rcp)
    if (dt)  form.append('issue_date', dt)
    if (nId) form.append('name_field_id', nId)
    if (dId) form.append('date_field_id', dId)
    setPreviewLoading(true)
    try {
      const r = await fetch(`${CERT_API}/api/preview`, { method:'POST', body:form })
      if (r.ok) setPreviewSvg(await r.text())
    } catch(_) {}
    finally { setPreviewLoading(false) }
  }, [])

  const debouncedPreview = useDebounce(doPreview, 380)
  useEffect(() => { debouncedPreview(templateName, svgFile, recipient, date, nameId, dateId) },
    [templateName, svgFile, recipient, date, nameId, dateId])

  const parseIds = async (file) => {
    const doc = new DOMParser().parseFromString(await file.text(), 'image/svg+xml')
    setDetectedIds(Array.from(doc.querySelectorAll('text[id]')).map(el => ({
      id: el.getAttribute('id'), text: el.textContent.trim().slice(0, 30),
    })))
  }

  const selectTemplate = async (val) => {
    if (!val) { setTemplateName(null); setSvgFile(null); return }
    // Plantilla built-in
    const builtin = BUILT_IN_TEMPLATES.find(t => t.file === val)
    if (builtin) {
      setTemplateName(val); setSvgFile(null)
      try {
        const r = await fetch(`${CERT_API}/api/templates/${val}`)
        if (r.ok) {
          const txt = await r.text()
          parseIds(new File([new Blob([txt], {type:'image/svg+xml'})], val))
        }
      } catch(_) {}
      return
    }
    // Plantilla custom de Supabase
    const tpl = templates.find(t => t.id === val)
    if (tpl) {
      const svgText = await loadSvgContent(tpl)
      if (svgText) {
        const file = new File([svgText], tpl.file_name, { type: 'image/svg+xml' })
        setSvgFile(file); setTemplateName(null)
        parseIds(file)
        if (tpl.name_id) setNameId(tpl.name_id)
        if (tpl.date_id) setDateId(tpl.date_id)
      }
    }
  }

  const validate = () => {
    const e = {}
    if (!recipient.trim() || recipient.trim().length < 2) e.recipient = 'Nombre demasiado corto'
    if (!date.trim() || date.trim().length < 4) e.date = 'Ingresa una fecha válida'
    setErrors(e); return Object.keys(e).length === 0
  }

  const generate = async () => {
    if (!validate()) return
    if (!templateName && !svgFile) { setAlert({type:'error',msg:'Seleccioná una plantilla primero.'}); return }
    setLoading(true); setAlert(null)
    const form = new FormData()
    if (svgFile) form.append('file', svgFile); else form.append('template_name', templateName)
    form.append('recipient_name', recipient.trim())
    form.append('issue_date', date.trim())
    form.append('name_field_id', nameId.trim())
    form.append('date_field_id', dateId.trim())
    form.append('output_format', fmt)
    try {
      const r = await fetch(`${CERT_API}/api/generate`, { method:'POST', body:form })
      if (!r.ok) { const d = await r.json(); setAlert({type:'error',msg:d.error||'Error al generar.'}); return }
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `certificado_${recipient.trim().replace(/\s+/g,'_')}.${fmt}`
      a.click(); URL.revokeObjectURL(a.href)
      setAlert({type:'success',msg:`¡Certificado generado para ${recipient.trim()}!`})
    } catch(e) { setAlert({type:'error',msg:`Error: ${e.message}`}) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex gap-5">
      {/* Left: form */}
      <div className="w-[340px] shrink-0 space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Plantilla</p>
          <select
            value={svgFile ? '' : (templateName || '')}
            onChange={e => selectTemplate(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3">
            <option value="">— Seleccionar plantilla —</option>
            <optgroup label="Plantillas predefinidas">
              {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.file}>{t.name}</option>)}
            </optgroup>
            {templates.filter(t => !t.is_builtin).length > 0 && (
              <optgroup label="Mis plantillas">
                {templates.filter(t => !t.is_builtin).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            )}
          </select>

          {participants.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-stone-500 mb-1.5">Seleccionar participante</p>
              <select onChange={e => { const p = participants.find(x => x.id === e.target.value); if (p) setRecipient(p.name) }}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="">— Elegir de la lista —</option>
                {participants.filter(p => p.status === 'activo').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <CertDropZone accept=".svg" title="SVG propio (opcional)" subtitle="Arrastrá o hacé clic"
            icon="upload_file" file={svgFile}
            onFile={f => { setSvgFile(f); if (f) { setTemplateName(null); parseIds(f) } else setDetectedIds([]) }} />
        </div>

        {detectedIds.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">IDs detectados</p>
            <p className="text-xs text-stone-400 mb-1">Nombre →</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {detectedIds.map(({id, text}) => (
                <button key={id} onClick={() => setNameId(id)} title={text}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono border transition-all
                    ${nameId === id ? 'bg-gray-900 text-amber-50 border-gray-900' : 'border-stone-200 text-stone-600 hover:border-orange-400'}`}>
                  {id}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400 mb-1">Fecha →</p>
            <div className="flex flex-wrap gap-1.5">
              {detectedIds.map(({id, text}) => (
                <button key={id} onClick={() => setDateId(id)} title={text}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono border transition-all
                    ${dateId === id ? 'bg-gray-900 text-amber-50 border-gray-900' : 'border-stone-200 text-stone-600 hover:border-orange-400'}`}>
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Datos del certificado</p>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Nombre del participante</label>
            <input value={recipient}
              onChange={e => { setRecipient(e.target.value); setErrors(p => ({...p, recipient:''})) }}
              placeholder="Ej: María González Rojas"
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400
                ${errors.recipient ? 'border-red-400' : 'border-stone-200'}`} />
            {errors.recipient && <p className="text-xs text-red-500 mt-1">{errors.recipient}</p>}
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Fecha de otorgación</label>
            <input value={date}
              onChange={e => { setDate(e.target.value); setErrors(p => ({...p, date:''})) }}
              placeholder="22 de mayo de 2026"
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400
                ${errors.date ? 'border-red-400' : 'border-stone-200'}`} />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1.5">Formato</label>
            <CertFormatToggle value={fmt} onChange={setFmt} />
          </div>
          <button onClick={generate} disabled={loading || (!templateName && !svgFile)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:16}}>refresh</span>Procesando…</>
              : <><span className="material-symbols-outlined" style={{fontSize:16}}>download</span>Generar y descargar</>}
          </button>
          <CertAlert type={alert?.type} msg={alert?.msg} onDismiss={() => setAlert(null)} />
        </div>
      </div>

      {/* Right: live preview */}
      <div className="flex-1 bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <span className="text-sm font-medium text-stone-600">Vista previa en tiempo real</span>
          <div className="flex items-center gap-1.5">
            {previewLoading
              ? <><span className="material-symbols-outlined text-orange-400 animate-spin" style={{fontSize:14}}>refresh</span><span className="text-xs text-stone-400">Actualizando…</span></>
              : <><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /><span className="text-xs text-stone-400">Actualizado</span></>}
          </div>
        </div>
        <div className="flex-1 bg-stone-50 p-6 flex items-start justify-center overflow-auto">
          {previewSvg
            ? <div className={`bg-white rounded shadow-md w-full max-w-2xl transition-opacity ${previewLoading ? 'opacity-50' : 'opacity-100'}`}
                dangerouslySetInnerHTML={{ __html: previewSvg.replace(/<svg/, '<svg style="display:block;width:100%;height:auto"') }} />
            : <div className="flex flex-col items-center justify-center h-48 text-stone-300 gap-3">
                <span className="material-symbols-outlined text-5xl">workspace_premium</span>
                <p className="text-sm">Seleccioná una plantilla para ver la vista previa</p>
              </div>}
        </div>
      </div>
    </div>
  )
}

/* ── Pestaña Lote CSV ───────────────────────────────────────── */

function CertBatch({ participants = [], courses = [] }) {
  const { templates, loadSvgContent } = useTemplates()
  const [templateName,   setTemplateName]   = useState(null)
  const [svgFile,        setSvgFile]        = useState(null)
  const [csvFile,        setCsvFile]        = useState(null)
  const [csvMeta,        setCsvMeta]        = useState(null)
  const [nameId,         setNameId]         = useState('recipient_name')
  const [dateId,         setDateId]         = useState('issue_date')
  const [fmt,            setFmt]            = useState('pdf')
  const [loading,        setLoading]        = useState(false)
  const [progress,       setProgress]       = useState(0)
  const [alert,          setAlert]          = useState(null)
  const [result,         setResult]         = useState(null)
  const [filterCourse,   setFilterCourse]   = useState('')
  const [filterStatus,   setFilterStatus]   = useState('activo')
  const [filterPayment,  setFilterPayment]  = useState('pagado')
  const [certDate,       setCertDate]       = useState(TODAY_ES)
  const [globalDate,     setGlobalDate]     = useState('')

  const filteredParticipants = participants.filter(p => {
    const matchCourse  = !filterCourse  || (p.courses || []).includes(filterCourse)
    const matchStatus  = !filterStatus  || p.status  === filterStatus
    const matchPayment = !filterPayment || p.payment === filterPayment
    return matchCourse && matchStatus && matchPayment
  })

  const applyFilters = () => {
    if (!filteredParticipants.length) return
    const lines = ['nombre,fecha', ...filteredParticipants.map(p => `"${p.name}","${certDate}"`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    handleCsvFile(new File([blob], 'participantes_filtrados.csv', { type: 'text/csv' }))
  }

  const handleCsvFile = async (file) => {
    if (!file) { setCsvFile(null); setCsvMeta(null); return }
    setCsvFile(file)
    const lines = (await file.text()).trim().split('\n').filter(l => l.trim())
    setCsvMeta({ rows: lines.length - 1, header: lines[0] })
  }

  const downloadSample = () => {
    const csv = `nombre,fecha\nMaría González Rojas,${TODAY_ES}\nCarlos Méndez Alvarado,${TODAY_ES}\nLaura Jiménez Vega,${TODAY_ES}`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = 'ejemplo_participantes.csv'; a.click()
  }

  const generate = async () => {
    if (!templateName && !svgFile) { setAlert({type:'error',msg:'Seleccioná una plantilla SVG primero.'}); return }
    if (!csvFile) { setAlert({type:'error',msg:'Cargá un archivo CSV con los participantes.'}); return }
    setLoading(true); setAlert(null); setResult(null); setProgress(10)
    const form = new FormData()
    if (svgFile) form.append('file', svgFile); else form.append('template_name', templateName)
    form.append('csv_file', csvFile)
    form.append('name_field_id', nameId.trim())
    form.append('date_field_id', dateId.trim())
    form.append('output_format', fmt)
    if (globalDate.trim()) form.append('global_date', globalDate.trim())
    try {
      setProgress(30)
      const r = await fetch(`${CERT_API}/api/generate/batch`, { method:'POST', body:form })
      setProgress(85)
      if (!r.ok) {
        let errMsg = 'Error al generar el lote.'
        try { const d = await r.json(); errMsg = d.error || errMsg } catch(_) {}
        setAlert({type:'error',msg:errMsg})
        return
      }
      const generated = r.headers.get('X-Generated-Count') || '?'
      const errCount  = r.headers.get('X-Error-Count') || '0'
      const total     = r.headers.get('X-Total-Count') || '?'
      const blob = await r.blob()
      if (blob.size < 100) { setAlert({type:'error',msg:'El archivo descargado parece estar vacío. Revisá la consola del servidor.'}); return }
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'certificados_lote.zip'
      a.click()
      URL.revokeObjectURL(a.href)
      setProgress(100)
      setResult({generated, errors: errCount, total})
      const errNote = Number(errCount) > 0 ? ` (${errCount} con errores — incluidos en el ZIP como .txt)` : ''
      setAlert({type:'success',msg:`✓ ${generated} de ${total} certificados generados y descargados${errNote}.`})
    } catch(e) {
      if (e.name === 'TypeError' && e.message.includes('fetch')) {
        setAlert({type:'error',msg:'No se puede conectar con el servidor. Verificá que esté activo.'})
      } else {
        setAlert({type:'error',msg:`Error inesperado: ${e.message}`})
      }
    }
    finally { setLoading(false); setTimeout(() => setProgress(0), 2000) }
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-7 space-y-4">
        {participants.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Filtrar participantes</p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Curso / taller</label>
                <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Todos</option>
                  {courses.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.short || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Estado</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Todos</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Pago</label>
                <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">Todos</option>
                  <option value="pagado">Pagado</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">Fecha del certificado</label>
              <input value={certDate} onChange={e => setCertDate(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="22 de mayo de 2026" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className={`text-xs font-semibold ${filteredParticipants.length ? 'text-gray-700' : 'text-stone-400'}`}>
                {filteredParticipants.length} participante{filteredParticipants.length !== 1 ? 's' : ''} coinciden
              </span>
              <button onClick={applyFilters} disabled={!filteredParticipants.length}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined" style={{fontSize:14}}>group</span>
                Usar estos {filteredParticipants.length}
              </button>
            </div>
          </div>
        )}
        <CertDropZone accept=".csv" title="Arrastrá tu archivo CSV aquí"
          subtitle="Columnas requeridas: nombre, fecha — límite 200 registros"
          icon="upload_file" file={csvFile} onFile={handleCsvFile} />

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Requisitos del archivo</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[{col:'nombre',ej:'Juan Pérez'},{col:'fecha',ej:TODAY_ES}].map(c => (
              <div key={c.col} className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                <p className="text-xs text-stone-400 mb-0.5">Columna requerida</p>
                <p className="text-sm font-bold font-mono text-gray-900">{c.col}</p>
                <p className="text-xs text-stone-400 italic mt-0.5">Ej: {c.ej}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mb-2">También acepta: <code>name</code>, <code>participante</code>, <code>date</code>, <code>issue_date</code></p>
          <button onClick={downloadSample} className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:underline">
            <span className="material-symbols-outlined" style={{fontSize:14}}>download</span> Descargar CSV de ejemplo
          </button>
        </div>

        {csvMeta && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs text-stone-400">Filas detectadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{csvMeta.rows}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 overflow-hidden">
              <p className="text-xs text-stone-400">Encabezado CSV</p>
              <p className="text-xs font-mono text-stone-600 mt-1 truncate">{csvMeta.header}</p>
            </div>
          </div>
        )}
      </div>

      <div className="col-span-5 space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Plantilla SVG</p>
          <select value={templateName||''} onChange={async e => {
              const val = e.target.value
              if (!val) { setTemplateName(null); setSvgFile(null); return }
              // Plantilla built-in
              const builtin = BUILT_IN_TEMPLATES.find(t => t.file === val)
              if (builtin) { setTemplateName(val); setSvgFile(null); return }
              // Plantilla custom de Supabase — cargar SVG como File
              const tpl = templates.find(t => t.id === val)
              if (tpl) {
                const svgText = await loadSvgContent(tpl)
                if (svgText) {
                  setSvgFile(new File([svgText], tpl.file_name, { type: 'image/svg+xml' }))
                  setTemplateName(null)
                }
              }
            }}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3">
            <option value="">— Seleccionar plantilla —</option>
            <optgroup label="Plantillas predefinidas">
              {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.file}>{t.name}</option>)}
            </optgroup>
            {templates.filter(t => !t.is_builtin).length > 0 && (
              <optgroup label="Mis plantillas">
                {templates.filter(t => !t.is_builtin).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <CertDropZone accept=".svg" title="O subir SVG propio" subtitle="Opcional"
            icon="upload_file" file={svgFile} onFile={f => { setSvgFile(f); if (f) setTemplateName(null) }} />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">Mapeo de campos</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">ID → Nombre</label>
              <input value={nameId} onChange={e => setNameId(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">ID → Fecha</label>
              <input value={dateId} onChange={e => setDateId(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs font-mono bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-stone-500 mb-1">
              Fecha para todos <span className="text-stone-400 font-normal">(sobreescribe la del CSV)</span>
            </label>
            <input value={globalDate} onChange={e => setGlobalDate(e.target.value)}
              placeholder={`Ej: ${TODAY_ES}`}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <label className="block text-xs text-stone-500 mb-1.5">Formato</label>
          <CertFormatToggle value={fmt} onChange={setFmt} />
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{fontSize:18}}>folder_zip</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-900">{csvMeta ? `${csvMeta.rows} registros` : 'Sin CSV cargado'}</p>
              <p className="text-xs text-orange-700">{(templateName||svgFile) ? 'Plantilla lista ✓' : 'Falta seleccionar plantilla'}</p>
            </div>
          </div>
          {progress > 0 && (
            <div className="h-1.5 rounded-full bg-orange-200 overflow-hidden mb-3">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{width:`${progress}%`}} />
            </div>
          )}
          <button onClick={generate} disabled={loading || (!templateName && !svgFile) || !csvFile}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 disabled:opacity-40 transition-colors">
            {loading
              ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:16}}>refresh</span>Procesando…</>
              : <><span className="material-symbols-outlined" style={{fontSize:16}}>folder_zip</span>Generar ZIP</>}
          </button>
        </div>

        {result && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600">Generados</p>
              <p className="text-2xl font-bold text-green-800">{result.generated}</p>
            </div>
            <div className={`${Number(result.errors) > 0 ? 'bg-red-50 border-red-200' : 'bg-stone-50 border-stone-200'} border rounded-xl p-3 text-center`}>
              <p className={`text-xs ${Number(result.errors) > 0 ? 'text-red-600' : 'text-stone-400'}`}>Errores</p>
              <p className={`text-2xl font-bold ${Number(result.errors) > 0 ? 'text-red-700' : 'text-gray-700'}`}>{result.errors}</p>
            </div>
          </div>
        )}
        <CertAlert type={alert?.type} msg={alert?.msg} onDismiss={() => setAlert(null)} />
      </div>
    </div>
  )
}

/* ── Pestaña Analizar SVG ───────────────────────────────────── */

function CertAnalyze({ aiAvailable }) {
  const [file,      setFile]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [alert,     setAlert]     = useState(null)
  const [elements,  setElements]  = useState(null)
  const [mapping,   setMapping]   = useState({ name:'', date:'' })
  const [aiSug,     setAiSug]     = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const analyze = async () => {
    if (!file) { setAlert({type:'error',msg:'Seleccioná un archivo SVG primero.'}); return }
    setLoading(true); setAlert(null); setElements(null); setAiSug(null); setConfirmed(false)
    const form = new FormData(); form.append('file', file)
    try {
      const r = await fetch(`${CERT_API}/api/analyze`, { method:'POST', body:form })
      const d = await r.json()
      if (!r.ok) { setAlert({type:'error',msg:d.error}); return }
      setElements(d.elements)
      if (d.elements.length > 0) setMapping({ name: d.elements[0]?.id||'', date: d.elements[1]?.id||d.elements[0]?.id||'' })
      if (!d.elements.length) setAlert({type:'info',msg:'No se encontraron elementos <text> con id en este SVG.'})
    } catch(e) { setAlert({type:'error',msg:e.message}) }
    finally { setLoading(false) }
  }

  const suggestWithAI = async () => {
    if (!file) return
    setAiLoading(true); setAiSug(null); setAlert(null)
    const form = new FormData(); form.append('file', file)
    try {
      const r = await fetch(`${CERT_API}/api/ai/mapeo`, { method:'POST', body:form })
      const d = await r.json()
      if (!r.ok) { setAlert({type:'error',msg:d.error}); return }
      setAiSug(d); setMapping({ name:d.name_id, date:d.date_id })
      setAlert({type:'success',msg:'Claude analizó la plantilla y sugirió el mapeo. Revisalo y confirmá.'})
    } catch(e) { setAlert({type:'error',msg:e.message}) }
    finally { setAiLoading(false) }
  }

  const idOptions = elements?.map(e => e.id) || []

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-8 space-y-4">
        <CertDropZone accept=".svg" title="Arrastrá tu archivo SVG aquí" subtitle="o hacé clic para seleccionar"
          icon="cloud_upload" file={file}
          onFile={f => { setFile(f); setElements(null); setAiSug(null); setConfirmed(false) }} />

        <div className="flex flex-wrap gap-2">
          <button onClick={analyze} disabled={!file||loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-amber-50 text-sm font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-colors">
            {loading
              ? <><span className="material-symbols-outlined text-sm animate-spin" style={{fontSize:15}}>refresh</span>Analizando…</>
              : <><span className="material-symbols-outlined text-sm" style={{fontSize:15}}>search</span>Analizar SVG</>}
          </button>
          {aiAvailable && (
            <button onClick={suggestWithAI} disabled={!elements||aiLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 hover:brightness-110 transition-all">
              {aiLoading
                ? <><span className="material-symbols-outlined animate-spin" style={{fontSize:15}}>refresh</span>Consultando Claude…</>
                : <><span className="material-symbols-outlined" style={{fontSize:15}}>auto_awesome</span>Sugerir con IA</>}
            </button>
          )}
          {!aiAvailable && elements && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-400">
              <span className="material-symbols-outlined" style={{fontSize:14}}>key_off</span>
              Configurá <code className="mx-1">ANTHROPIC_API_KEY</code> para activar sugerencia IA
            </div>
          )}
        </div>

        <CertAlert type={alert?.type} msg={alert?.msg} onDismiss={() => setAlert(null)} />

        {aiSug && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-600" style={{fontSize:18}}>auto_awesome</span>
                <span className="text-sm font-bold text-violet-800">Sugerencia de Claude</span>
              </div>
              <ConfidenceBadge level={aiSug.confidence} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{l:'ID → Nombre',v:aiSug.name_id},{l:'ID → Fecha',v:aiSug.date_id}].map(x => (
                <div key={x.l} className="bg-white rounded-lg p-2.5 border border-violet-200">
                  <p className="text-xs text-violet-500 mb-0.5">{x.l}</p>
                  <p className="font-mono text-sm font-bold text-violet-900">{x.v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2 border border-violet-100">
              <span className="material-symbols-outlined text-violet-400 shrink-0 mt-0.5" style={{fontSize:14}}>comment</span>
              <p className="text-xs text-violet-700 leading-relaxed">{aiSug.justification}</p>
            </div>
          </div>
        )}

        {elements && elements.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Elementos detectados</span>
              <span className="text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full font-semibold">{elements.length} nodos &lt;text&gt;</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  {['ID Elemento','Contenido','X','Y','Tamaño'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {elements.map((el, i) => {
                  const isName = aiSug?.name_id === el.id
                  const isDate = aiSug?.date_id === el.id
                  return (
                    <tr key={el.id} className={`transition-colors ${isName||isDate ? 'bg-violet-50/50' : i%2===0 ? 'bg-white' : 'bg-stone-50/40'} hover:bg-amber-50/30`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-gray-900">{el.id}</span>
                          {isName && <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">nombre ✨</span>}
                          {isDate && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">fecha ✨</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs italic text-stone-500 max-w-[120px] truncate">{el.text||'—'}</td>
                      <td className="px-4 py-2.5 text-xs text-stone-500">{el.x||'—'}</td>
                      <td className="px-4 py-2.5 text-xs text-stone-500">{el.y||'—'}</td>
                      <td className="px-4 py-2.5 text-xs text-stone-500">{el.font_size ? `${el.font_size}px` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="col-span-4 space-y-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 sticky top-4">
          <p className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-stone-400" style={{fontSize:18}}>alt_route</span>
            Mapeo de campos
          </p>
          <p className="text-xs text-stone-500 mb-4 leading-relaxed">
            Asigná los IDs del SVG a los campos del sistema.
            {aiSug && <span className="text-violet-600 font-medium"> Claude completó el mapeo.</span>}
          </p>
          <div className="space-y-3 mb-5">
            {[{l:'Nombre del participante',k:'name'},{l:'Fecha de emisión',k:'date'}].map(({l, k}) => (
              <div key={k}>
                <label className="block text-xs text-stone-500 mb-1">{l}</label>
                <select value={mapping[k]} onChange={e => setMapping(p => ({...p, [k]:e.target.value}))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm bg-amber-50 focus:outline-none focus:ring-2 focus:ring-orange-400
                    ${aiSug?.[`${k}_id`] === mapping[k] ? 'border-violet-300' : 'border-stone-200'}`}>
                  <option value="">— Seleccionar ID —</option>
                  {idOptions.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-stone-100">
            <button onClick={() => { if (mapping.name && mapping.date) setConfirmed(true) }}
              disabled={!mapping.name || !mapping.date}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-amber-50 text-sm font-bold rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">
              <span className="material-symbols-outlined" style={{fontSize:16}}>check_circle</span>
              Confirmar mapeo
            </button>
            {confirmed && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-semibold text-green-800 flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined" style={{fontSize:14}}>task_alt</span>¡Mapeo confirmado!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[{l:'Nombre',v:mapping.name},{l:'Fecha',v:mapping.date}].map(x => (
                    <div key={x.l} className="bg-white rounded p-2 border border-green-100">
                      <p className="text-xs text-stone-400">{x.l}</p>
                      <p className="font-mono text-xs font-bold text-gray-900 truncate">{x.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-amber-50 border border-stone-200 rounded-xl p-4 flex gap-2.5">
          <i className="ti ti-bulb text-orange-400 text-base shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-gray-800 mb-1">Tip de diseño</p>
            <p className="text-xs text-stone-500 leading-relaxed">En Inkscape o Illustrator, asigná un ID único a cada texto desde el panel "Propiedades del objeto" (Ctrl+Shift+O).</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Tabla de referencia de campos SVG ──────────────────────── */

const FIELD_REFERENCE = [
  { id:'recipient_name', csv:'nombre / cédula TSE', desc:'Nombre del participante' },
  { id:'issue_date',     csv:'fecha',               desc:'Fecha de emisión' },
  { id:'course_name_1',  csv:'tipo_curso',           desc:'"Taller de" / "Curso de"' },
  { id:'course_name_2',  csv:'nombre_curso',         desc:'Nombre del curso/taller' },
  { id:'hours_issue',    csv:'horas',                desc:'Total de horas' },
  { id:'date_issue_1',   csv:'fecha_inicio',         desc:'Fecha de inicio' },
  { id:'date_issue_2',   csv:'fecha_fin',            desc:'Fecha de fin' },
]

function CertFieldsReference() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 border border-stone-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400" style={{fontSize:16}}>table_chart</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Referencia de campos SVG
          </span>
          <span className="text-xs text-stone-400">— IDs que el backend reconoce y sus columnas CSV</span>
        </div>
        <span className="material-symbols-outlined text-stone-400 transition-transform"
          style={{fontSize:16, transform: open ? 'rotate(180deg)' : 'rotate(0deg)'}}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50">
              <tr>
                {['Campo SVG (id=)', 'Columna CSV sugerida', 'Descripción'].map(h => (
                  <th key={h} className="px-4 py-2.5 font-semibold uppercase tracking-wider text-stone-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {FIELD_REFERENCE.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/40'}>
                  <td className="px-4 py-2.5">
                    <code className="font-mono font-semibold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{row.id}</code>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-stone-600">{row.csv}</td>
                  <td className="px-4 py-2.5 text-stone-500">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Vista principal ────────────────────────────────────────── */

export default function CertificatesView({ participants, courses = [], galleryTplPick, onGalleryConsumed }) {
  const [certTab,     setCertTab]     = useState('individual')
  const [apiOk,       setApiOk]       = useState(null)
  const [aiAvailable, setAiAvailable] = useState(false)

  useEffect(() => {
    fetch(`${CERT_API}/api/health`)
      .then(r => r.ok ? setApiOk(true) : setApiOk(false))
      .catch(() => setApiOk(false))
    fetch(`${CERT_API}/api/ai/status`)
      .then(r => r.ok ? r.json() : {available:false})
      .then(d => setAiAvailable(d.available))
      .catch(() => {})
  }, [])

  const tabs = [
    { id:'individual', icon:'person',      label:'Individual'   },
    { id:'batch',      icon:'upload_file', label:'Lote CSV'     },
    { id:'analyze',    icon:'search',      label:'Analizar SVG' },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--black)', display:'flex', alignItems:'center', gap:8 }}>
            <span className="material-symbols-outlined text-orange-500">workspace_premium</span>
            Generador de Certificados
          </h2>
          <p style={{ fontSize:13, color:'var(--gray)', marginTop:4 }}>Emití certificados digitales para los participantes de los programas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
            ${apiOk === true  ? 'bg-green-50 border-green-200 text-green-700'
            : apiOk === false ? 'bg-red-50 border-red-200 text-red-600'
            :                   'bg-stone-100 border-stone-200 text-stone-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${apiOk === true ? 'bg-green-500' : apiOk === false ? 'bg-red-500' : 'bg-stone-400'}`} />
            {apiOk === null ? 'Verificando…' : apiOk ? 'API activa' : 'API no disponible'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
            ${aiAvailable ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-stone-100 border-stone-200 text-stone-400'}`}>
            <span className="material-symbols-outlined" style={{fontSize:13}}>{aiAvailable ? 'auto_awesome' : 'key_off'}</span>
            {aiAvailable ? 'Claude activo' : 'IA inactiva'}
          </div>
        </div>
      </div>

      {apiOk === false && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="material-symbols-outlined" style={{fontSize:16}}>warning</span>
          El servidor Flask no está disponible. Ejecutá{' '}
          <code className="mx-1 bg-red-100 px-1.5 py-0.5 rounded font-mono">cd backend && python3 app.py</code> para iniciarlo.
        </div>
      )}

      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setCertTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${certTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-stone-500 hover:text-gray-700'}`}>
            <span className="material-symbols-outlined" style={{fontSize:16}}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <CertFieldsReference />

      {certTab === 'individual' && <CertIndividual participants={participants} galleryTplPick={galleryTplPick} onGalleryConsumed={onGalleryConsumed} />}
      {certTab === 'batch'      && <CertBatch participants={participants} courses={courses} />}
      {certTab === 'analyze'    && <CertAnalyze aiAvailable={aiAvailable} />}
    </div>
  )
}
