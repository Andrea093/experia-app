import { createClient } from '@supabase/supabase-js'

// La sesión se guarda en sessionStorage (no localStorage): así NO sobrevive al
// cierre del navegador/pestaña. Al reabrir la plataforma no hay sesión que
// restaurar y el usuario debe iniciar sesión de nuevo. El cierre por
// inactividad de 30 min (idleTimeout.js) sigue aplicando dentro de la pestaña.
// Fallback a localStorage por si sessionStorage no está disponible.
const authStorage =
  typeof window !== 'undefined' && window.sessionStorage
    ? window.sessionStorage
    : undefined

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
