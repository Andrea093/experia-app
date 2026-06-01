import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './app.jsx'
import { supabase } from './lib/supabaseClient.js'
import { XS, doLogout } from './store/store.jsx'

// Restaurar sesión de Supabase al arrancar
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session) {
    const [{ data: profile }, { data: institutions }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('institutions').select('*').order('name'),
    ])
    if (profile) {
      let page = 'map'
      if (profile.role === 'instructor') page = 'instructor-dashboard'
      if (profile.role === 'admin')      page = 'admin-dashboard'
      XS.set({
        isLoggedIn: true,
        user: { name: profile.name, email: profile.email, avatar: profile.avatar, role: profile.role },
        page,
        xp: 0, completed: [], badges: [], notifications: [],
        selectedArea: profile.area || null, nodeId: null,
        institutions: institutions || [],
      })
    }
  }
})

// Mantener sincronizado con cambios de sesión (tab cruzado, expiración)
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') doLogout()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
