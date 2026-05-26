// ============================================================
//  useTheme.js — Persiste preferencia 'light' | 'dark' en
//  localStorage y aplica data-theme en <html>.
//  Default: 'light'. Si no hay preferencia guardada, respeta
//  prefers-color-scheme del sistema.
// ============================================================

import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'tec-theme'

function readInitial() {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
