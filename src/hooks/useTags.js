// ============================================================
//  useTags.js — JavaScript (React Custom Hook)
//  Estado y persistencia de etiquetas libres.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_TAGS, TAGS_STORAGE_KEY } from '../data/tags.js'

function loadTags() {
  try {
    const raw = localStorage.getItem(TAGS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_TAGS)
  } catch {
    return structuredClone(DEFAULT_TAGS)
  }
}

export function useTags() {
  const [tags, setTags] = useState(loadTags)

  useEffect(() => {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags))
  }, [tags])

  const addTag = useCallback((name, color) => {
    setTags(prev => [...prev, { id: 't' + Date.now(), name, color }])
  }, [])

  const editTag = useCallback((id, name, color) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, name, color } : t))
  }, [])

  /** Elimina la etiqueta y la quita de todos los participantes */
  const deleteTag = useCallback((id, setParticipants) => {
    setTags(prev => prev.filter(t => t.id !== id))
    setParticipants(prev =>
      prev.map(p => ({ ...p, tags: (p.tags || []).filter(tid => tid !== id) }))
    )
  }, [])

  return { tags, addTag, editTag, deleteTag }
}
