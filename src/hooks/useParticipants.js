// ============================================================
//  useParticipants.js — Hook de participantes
//  Si Supabase está configurado: lee/escribe tablas
//    `participants`, `participant_courses`, `participant_tags`.
//  Si no: fallback localStorage.
//  API pública intacta:
//    { participants, setParticipants, addParticipant,
//      updateParticipant, deleteParticipant, toggleAccess,
//      renewAccess, importParticipants }
//
//  Mapeo DB ↔ app:
//    participant.courses[] (IDs de cursos)  ←  participant_courses
//    participant.tags[]    (IDs de tags)    ←  participant_tags
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEY, DEFAULT_PARTICIPANTS } from '../data/constants.js'
import { isExpired, todayISO } from '../utils/time.js'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const PARTICIPANT_SELECT =
  'id,name,email,phone,status,payment,access,fecha,notes,' +
  'participant_courses(course_id),participant_tags(tag_id)'

function fromDb(row) {
  if (!row) return null
  return {
    id:      row.id,
    name:    row.name,
    email:   row.email ?? '',
    phone:   row.phone ?? '',
    status:  row.status,
    payment: row.payment,
    access:  row.access,
    fecha:   row.fecha ?? '',
    notes:   row.notes ?? '',
    courses: (row.participant_courses || []).map(x => x.course_id),
    tags:    (row.participant_tags    || []).map(x => x.tag_id),
  }
}

function baseFromForm(form) {
  return {
    name:    form.name ?? null,
    email:   form.email ?? null,
    phone:   form.phone ?? null,
    status:  form.status  ?? 'activo',
    payment: form.payment ?? 'pendiente',
    access:  form.access ?? false,
    fecha:   form.fecha || null,
    notes:   form.notes ?? null,
  }
}

async function syncRelations(participantId, courses, tags) {
  // Borra y reinserta. Volumen chico, OK.
  if (Array.isArray(courses)) {
    await supabase.from('participant_courses').delete().eq('participant_id', participantId)
    if (courses.length) {
      const rows = courses.map(cid => ({ participant_id: participantId, course_id: cid }))
      const { error } = await supabase.from('participant_courses').insert(rows)
      if (error) console.error('[useParticipants] syncRelations courses', error)
    }
  }
  if (Array.isArray(tags)) {
    await supabase.from('participant_tags').delete().eq('participant_id', participantId)
    if (tags.length) {
      const rows = tags.map(tid => ({ participant_id: participantId, tag_id: tid }))
      const { error } = await supabase.from('participant_tags').insert(rows)
      if (error) console.error('[useParticipants] syncRelations tags', error)
    }
  }
}

async function fetchOne(id) {
  const { data, error } = await supabase
    .from('participants').select(PARTICIPANT_SELECT).eq('id', id).single()
  if (error) { console.error('[useParticipants] fetchOne', error); return null }
  return fromDb(data)
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_PARTICIPANTS)
  } catch {
    return structuredClone(DEFAULT_PARTICIPANTS)
  }
}

function applyAutoRevoke(list) {
  return list.map(p =>
    p.access && isExpired(p.fecha) ? { ...p, access: false } : p
  )
}

export function useParticipants() {
  const [participants, setParticipants] = useState(() =>
    isSupabaseConfigured ? [] : applyAutoRevoke(loadLocal())
  )

  // Persistencia local en modo legacy
  useEffect(() => {
    if (isSupabaseConfigured) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants))
  }, [participants])

  // Fetch inicial desde Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.from('participants').select(PARTICIPANT_SELECT).order('name')
      .then(({ data, error }) => {
        if (error) console.error('[useParticipants] fetch', error)
        else setParticipants(applyAutoRevoke((data || []).map(fromDb)))
      })
  }, [])

  const addParticipant = useCallback(async (form) => {
    if (!isSupabaseConfigured) {
      setParticipants(prev => [...prev, {
        id:     'p' + Date.now(),
        ...form,
        tags:   form.tags   || [],
        notes:  form.notes  || '',
        fecha:  form.fecha  || todayISO(),
      }])
      return
    }
    const base = { ...baseFromForm(form), fecha: form.fecha || todayISO() }
    const { data, error } = await supabase.from('participants')
      .insert(base).select('id').single()
    if (error) { console.error('[useParticipants] add', error); return }
    await syncRelations(data.id, form.courses || [], form.tags || [])
    const fresh = await fetchOne(data.id)
    if (fresh) setParticipants(prev => [...prev, fresh])
  }, [])

  const updateParticipant = useCallback(async (id, form) => {
    if (!isSupabaseConfigured) {
      setParticipants(prev =>
        prev.map(p => p.id === id ? { ...p, ...form, tags: form.tags || p.tags || [] } : p)
      )
      return
    }
    const { error } = await supabase.from('participants')
      .update(baseFromForm(form)).eq('id', id)
    if (error) { console.error('[useParticipants] update', error); return }
    await syncRelations(id, form.courses, form.tags)
    const fresh = await fetchOne(id)
    if (fresh) setParticipants(prev => prev.map(p => p.id === id ? fresh : p))
  }, [])

  const deleteParticipant = useCallback(async (id) => {
    if (!isSupabaseConfigured) {
      setParticipants(prev => prev.filter(p => p.id !== id))
      return
    }
    const { error } = await supabase.from('participants').delete().eq('id', id)
    if (error) { console.error('[useParticipants] delete', error); return }
    setParticipants(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleAccess = useCallback(async (id) => {
    if (!isSupabaseConfigured) {
      setParticipants(prev =>
        prev.map(p => {
          if (p.id !== id) return p
          return p.access
            ? { ...p, access: false }
            : { ...p, access: true, fecha: todayISO() }
        })
      )
      return
    }
    const current = participants.find(p => p.id === id)
    if (!current) return
    const patch = current.access
      ? { access: false }
      : { access: true, fecha: todayISO() }
    const { error } = await supabase.from('participants')
      .update(patch).eq('id', id)
    if (error) { console.error('[useParticipants] toggleAccess', error); return }
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [participants])

  const renewAccess = useCallback(async (id) => {
    if (!isSupabaseConfigured) {
      setParticipants(prev =>
        prev.map(p => p.id === id ? { ...p, access: true, fecha: todayISO() } : p)
      )
      return
    }
    const patch = { access: true, fecha: todayISO() }
    const { error } = await supabase.from('participants')
      .update(patch).eq('id', id)
    if (error) { console.error('[useParticipants] renewAccess', error); return }
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }, [])

  const importParticipants = useCallback(async (list) => {
    if (!isSupabaseConfigured) {
      const newPs = list.map((imp, i) => ({
        id:      'p' + Date.now() + i,
        name:    imp.name    || 'Sin nombre',
        email:   imp.email   || '',
        phone:   imp.phone   || '',
        courses: imp.courses || [],
        tags:    imp.tags    || [],
        status:  'activo',
        payment: 'pendiente',
        access:  false,
        fecha:   todayISO(),
        notes:   imp.notes   || 'Importado con IA',
      }))
      setParticipants(prev => [...prev, ...newPs])
      return
    }
    // Inserción uno por uno para preservar relaciones N:N.
    const added = []
    for (const imp of list) {
      const base = {
        name:    imp.name || 'Sin nombre',
        email:   imp.email || null,
        phone:   imp.phone || null,
        status:  'activo',
        payment: 'pendiente',
        access:  false,
        fecha:   todayISO(),
        notes:   imp.notes || 'Importado con IA',
      }
      const { data, error } = await supabase.from('participants')
        .insert(base).select('id').single()
      if (error) { console.error('[useParticipants] import row', error); continue }
      await syncRelations(data.id, imp.courses || [], imp.tags || [])
      const fresh = await fetchOne(data.id)
      if (fresh) added.push(fresh)
    }
    if (added.length) setParticipants(prev => [...prev, ...added])
  }, [])

  return {
    participants,
    setParticipants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    toggleAccess,
    renewAccess,
    importParticipants,
  }
}
