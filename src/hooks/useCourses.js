// ============================================================
//  useCourses.js — JavaScript (React Custom Hook)
//  Estado y persistencia de cursos/talleres. CRUD completo.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { COURSES_STORAGE_KEY, DEFAULT_COURSES } from '../data/courses.js'

function loadCourses() {
  try {
    const raw = localStorage.getItem(COURSES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : structuredClone(DEFAULT_COURSES)
  } catch {
    return structuredClone(DEFAULT_COURSES)
  }
}

export function useCourses() {
  const [courses, setCourses] = useState(loadCourses)

  useEffect(() => {
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses))
  }, [courses])

  const addCourse = useCallback((form) => {
    const newCourse = {
      id:          'c' + Date.now(),
      name:        form.name        || 'Nuevo curso',
      short:       form.short       || form.name?.slice(0, 20) || 'Curso',
      type:        form.type        || 'curso',
      platform:    form.platform    || 'TEC Digital',
      start:       form.start       || '',
      end:         form.end         || '',
      capacity:    Number(form.capacity) || 30,
      price:       form.price       || '0',
      modalidad:   form.modalidad   || 'Asincrónico',
      code:        form.code        || '',
      description: form.description || '',
      active:      true,
    }
    setCourses(prev => [...prev, newCourse])
    return newCourse
  }, [])

  const updateCourse = useCallback((id, form) => {
    setCourses(prev => prev.map(c =>
      c.id === id ? { ...c, ...form, capacity: Number(form.capacity) || c.capacity } : c
    ))
  }, [])

  /** Elimina el curso y lo quita de todos los participantes */
  const deleteCourse = useCallback((id, setParticipants) => {
    setCourses(prev => prev.filter(c => c.id !== id))
    if (setParticipants) {
      setParticipants(prev =>
        prev.map(p => ({ ...p, courses: p.courses.filter(cid => cid !== id) }))
      )
    }
  }, [])

  const toggleActive = useCallback((id) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }, [])

  return { courses, addCourse, updateCourse, deleteCourse, toggleActive }
}
