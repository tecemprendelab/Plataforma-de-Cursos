// ============================================================
//  useParticipants.js — JavaScript (React Custom Hook)
//  Estado global, persistencia localStorage, CRUD completo.
//  Incluye soporte para el campo tags[] por participante.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEY, DEFAULT_PARTICIPANTS } from '../data/constants.js'
import { isExpired, todayISO } from '../utils/time.js'

function loadFromStorage() {
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
    applyAutoRevoke(loadFromStorage())
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants))
  }, [participants])

  const addParticipant = useCallback((form) => {
    setParticipants(prev => [...prev, {
      id:     'p' + Date.now(),
      ...form,
      tags:   form.tags   || [],
      notes:  form.notes  || '',
      fecha:  form.fecha  || todayISO(),
    }])
  }, [])

  const updateParticipant = useCallback((id, form) => {
    setParticipants(prev =>
      prev.map(p => p.id === id ? { ...p, ...form, tags: form.tags || p.tags || [] } : p)
    )
  }, [])

  const deleteParticipant = useCallback((id) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
  }, [])

  const toggleAccess = useCallback((id) => {
    setParticipants(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        return p.access
          ? { ...p, access: false }
          : { ...p, access: true, fecha: todayISO() }
      })
    )
  }, [])

  const renewAccess = useCallback((id) => {
    setParticipants(prev =>
      prev.map(p => p.id === id ? { ...p, access: true, fecha: todayISO() } : p)
    )
  }, [])

  const importParticipants = useCallback((list) => {
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
