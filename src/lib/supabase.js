// ============================================================
//  supabase.js — Cliente singleton de Supabase
//  Lee VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY del entorno.
//  Si faltan, el cliente queda null y la app corre en modo
//  legacy (localStorage). Útil mientras migramos los hooks.
//
//  fetch envuelto: reintenta cuando PostgREST devuelve PGRST303
//  ("JWT issued at future") por desfase de reloj entre el auth
//  de Supabase y PostgREST. El error suele resolverse en menos
//  de 2 segundos.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

async function fetchWithJwtRetry(input, init) {
  const maxAttempts = 3
  let lastRes
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastRes = await fetch(input, init)
    if (lastRes.status !== 401) return lastRes
    try {
      const body = await lastRes.clone().json()
      if (body?.code !== 'PGRST303') return lastRes
    } catch {
      return lastRes
    }
    if (attempt === maxAttempts - 1) return lastRes
    await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
  }
  return lastRes
}

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchWithJwtRetry },
    })
  : null

export const isSupabaseConfigured = supabase !== null
