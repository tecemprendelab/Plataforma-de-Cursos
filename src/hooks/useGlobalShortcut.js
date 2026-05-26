// ============================================================
//  useGlobalShortcut.js — Escucha keydown global y dispara
//  callback cuando coincide la combinación.
//
//  shortcut = { key: 'k', meta?: true, ctrl?: true, shift?: true, alt?: true }
//  Si pasás meta:true Y ctrl:true, basta con que uno de los dos
//  esté presionado (cubre Mac ⌘K y Windows/Linux Ctrl+K).
// ============================================================

import { useEffect } from 'react'

export function useGlobalShortcut(shortcut, handler) {
  useEffect(() => {
    if (!shortcut || typeof handler !== 'function') return

    const onKey = (e) => {
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) return
      const needMetaOrCtrl = shortcut.meta || shortcut.ctrl
      if (needMetaOrCtrl && !(e.metaKey || e.ctrlKey)) return
      if (shortcut.shift && !e.shiftKey) return
      if (shortcut.alt   && !e.altKey)   return
      e.preventDefault()
      handler(e)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut.key, shortcut.meta, shortcut.ctrl, shortcut.shift, shortcut.alt, handler])
}
