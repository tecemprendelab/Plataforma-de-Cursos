// ============================================================
//  supabase.js — Cliente singleton de Supabase
//  Lee VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY del entorno.
//  Si faltan, el cliente queda null y la app corre en modo
//  legacy (localStorage). Útil mientras migramos los hooks.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession:   true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null

export const isSupabaseConfigured = supabase !== null
