// ============================================================
//  useTemplates.js — Hook de plantillas SVG para certificados
//
//  Si Supabase está configurado:
//    - Lee la tabla `svg_templates`
//    - Sube el archivo SVG al bucket `certificate-templates`
//    - Guarda metadata en la tabla
//  Si no: fallback a estado en memoria (las 2 plantillas built-in)
//
//  Tabla esperada en Supabase:
//    CREATE TABLE svg_templates (
//      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//      name        text NOT NULL,
//      file_name   text NOT NULL,
//      style       text DEFAULT 'Personalizado',
//      course      text DEFAULT 'Todos los programas',
//      tags        text[] DEFAULT '{}',
//      colors      text[] DEFAULT '{}',
//      name_id     text DEFAULT 'recipient_name',
//      date_id     text DEFAULT 'issue_date',
//      storage_path text,          -- ruta en el bucket
//      is_builtin  boolean DEFAULT false,
//      created_at  timestamptz DEFAULT now()
//    );
//
//  Bucket en Supabase Storage: certificate-templates (público)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const CERT_API = 'https://plataforma-de-cursos-1-l606.onrender.com'
const BUCKET   = 'certificate-templates'

// Plantillas built-in (siempre presentes, SVG se carga desde el backend)
const BUILTIN_TEMPLATES = [
  {
    id: 'builtin-classic', name: 'Clásico Dorado', file_name: 'template_classic.svg',
    style: 'Institucional', course: 'Todos los programas',
    colors: ['#C9A227','#8B1A1A','#2C1810'],
    tags: ['horizontal','clásico','dorado','institucional'],
    name_id: 'recipient_name', date_id: 'issue_date',
    is_builtin: true, created_at: '2026-01-10',
  },
  {
    id: 'builtin-modern', name: 'Moderno Oscuro', file_name: 'template_modern.svg',
    style: 'Contemporáneo', course: 'Todos los programas',
    colors: ['#0D1B2A','#00C9FF','#92FE9D'],
    tags: ['horizontal','moderno','oscuro','tech'],
    name_id: 'recipient_name', date_id: 'issue_date',
    is_builtin: true, created_at: '2026-01-10',
  },
]

function fromDb(row) {
  return {
    id:           row.id,
    name:         row.name,
    file_name:    row.file_name,
    style:        row.style        ?? 'Personalizado',
    course:       row.course       ?? 'Todos los programas',
    colors:       row.colors       ?? ['#666666'],
    tags:         row.tags         ?? ['personalizado'],
    name_id:      row.name_id      ?? 'recipient_name',
    date_id:      row.date_id      ?? 'issue_date',
    storage_path: row.storage_path ?? null,
    is_builtin:   row.is_builtin   ?? false,
    created_at:   row.created_at   ?? '',
    svgContent:   null,   // se carga aparte
  }
}

export function useTemplates() {
  const [templates,  setTemplates]  = useState(BUILTIN_TEMPLATES.map(t => ({...t, svgContent: null})))
  const [loading,    setLoading]    = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState(null)

  // ── Cargar desde Supabase ──────────────────────────────────
  const loadFromDb = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('svg_templates')
        .select('*')
        .eq('is_builtin', false)
        .order('created_at', { ascending: false })

      if (err) throw err

      const custom = (data || []).map(fromDb)
      setTemplates([
        ...BUILTIN_TEMPLATES.map(t => ({...t, svgContent: null})),
        ...custom,
      ])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFromDb() }, [loadFromDb])

  // ── Cargar SVG content de una plantilla ───────────────────
  const loadSvgContent = useCallback(async (tpl) => {
    if (tpl.svgContent) return tpl.svgContent

    // Built-in: cargar desde el backend Flask
    if (tpl.is_builtin) {
      try {
        const form = new FormData()
        form.append('template_name', tpl.file_name)
        const r = await fetch(`${CERT_API}/api/preview`, { method: 'POST', body: form })
        if (r.ok) return await r.text()
      } catch (_) {}
      return null
    }

    // Custom: cargar desde Supabase Storage
    if (tpl.storage_path && isSupabaseConfigured) {
      try {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(tpl.storage_path)
        const r = await fetch(data.publicUrl)
        if (r.ok) return await r.text()
      } catch (_) {}
    }
    return null
  }, [])

  // ── Subir nuevo SVG ───────────────────────────────────────
  const uploadTemplate = useCallback(async (file, meta = {}) => {
    if (!file || !file.name.endsWith('.svg')) {
      setError('Solo se aceptan archivos .svg')
      return null
    }
    setUploading(true)
    setError(null)

    try {
      const svgText = await file.text()

      // Detectar IDs automáticamente via backend
      let name_id = 'recipient_name'
      let date_id = 'issue_date'
      try {
        const form = new FormData(); form.append('file', file)
        const r = await fetch(`${CERT_API}/api/analyze`, { method: 'POST', body: form })
        if (r.ok) {
          const { elements = [] } = await r.json()
          const nameEl = elements.find(e => /name|nombre|participante/i.test(e.id)) || elements[0]
          const dateEl = elements.find(e => /date|fecha/i.test(e.id))             || elements[1] || elements[0]
          if (nameEl) name_id = nameEl.id
          if (dateEl) date_id = dateEl.id
        }
      } catch (_) {}

      const newTpl = {
        id:       'local-' + Date.now(),
        name:     meta.name || file.name.replace('.svg','').replace(/[-_]/g,' '),
        file_name: file.name,
        style:    meta.style  || 'Personalizado',
        course:   meta.course || 'Todos los programas',
        colors:   meta.colors || ['#666666'],
        tags:     meta.tags   || ['personalizado','subido'],
        name_id,
        date_id,
        storage_path: null,
        is_builtin:   false,
        created_at:   new Date().toISOString().split('T')[0],
        svgContent:   svgText,
        _file:        file,    // referencia local para uso inmediato
      }

      // Si Supabase está configurado: subir al storage y guardar metadata
      if (isSupabaseConfigured) {
        const storagePath = `templates/${Date.now()}_${file.name}`

        // 1. Subir archivo al bucket
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { contentType: 'image/svg+xml', upsert: false })

        if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`)

        // 2. Guardar metadata en la tabla
        const { data: row, error: insertErr } = await supabase
          .from('svg_templates')
          .insert({
            name:         newTpl.name,
            file_name:    newTpl.file_name,
            style:        newTpl.style,
            course:       newTpl.course,
            colors:       newTpl.colors,
            tags:         newTpl.tags,
            name_id:      newTpl.name_id,
            date_id:      newTpl.date_id,
            storage_path: storagePath,
            is_builtin:   false,
          })
          .select()
          .single()

        if (insertErr) throw new Error(`DB: ${insertErr.message}`)

        const saved = { ...fromDb(row), svgContent: svgText }
        setTemplates(ts => [...ts, saved])
        return saved
      } else {
        // Sin Supabase: solo en memoria
        setTemplates(ts => [...ts, newTpl])
        return newTpl
      }
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  // ── Eliminar plantilla ────────────────────────────────────
  const deleteTemplate = useCallback(async (id) => {
    const tpl = templates.find(t => t.id === id)
    if (!tpl || tpl.is_builtin) return

    if (isSupabaseConfigured) {
      // Borrar del storage
      if (tpl.storage_path) {
        await supabase.storage.from(BUCKET).remove([tpl.storage_path])
      }
      // Borrar de la tabla
      await supabase.from('svg_templates').delete().eq('id', id)
    }

    setTemplates(ts => ts.filter(t => t.id !== id))
  }, [templates])

  // ── Actualizar SVG content en el estado ──────────────────
  const setSvgContent = useCallback((id, content) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, svgContent: content } : t))
  }, [])

  return {
    templates,
    loading,
    uploading,
    error,
    uploadTemplate,
    deleteTemplate,
    loadSvgContent,
    setSvgContent,
    reload: loadFromDb,
  }
}
