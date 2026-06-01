import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './app.jsx'
import { supabase } from './lib/supabaseClient.js'
import { XS, doLogout } from './store/store.jsx'
import { mapSubmission, mapAttempt } from './lib/mappers.js'

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

      // Cargar datos según rol
      let accounts = [], submissions = [], challengeAttempts = [], allProfiles = []

      if (profile.role === 'admin' || profile.role === 'instructor') {
        const [
          { data: profilesData },
          { data: subsData },
          { data: attemptsData },
        ] = await Promise.all([
          supabase.from('profiles').select('*').order('name'),
          supabase.from('submissions').select('*').order('created_at', { ascending: false }),
          supabase.from('challenge_attempts').select('*').order('created_at', { ascending: false }),
        ])
        allProfiles = profilesData || []
        accounts = allProfiles.map(p => ({
          email: p.email, name: p.name, avatar: p.avatar,
          role: p.role, area: p.area || null, institution: '', pass: '',
        }))
        submissions = (subsData || []).map(s => mapSubmission(s, allProfiles))
        challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, allProfiles))
      }

      let xp = 0, completed = [], badges = []
      if (profile.role === 'student') {
        const [{ data: subsData }, { data: attemptsData }, { data: progressData }] = await Promise.all([
          supabase.from('submissions').select('*').eq('student_id', session.user.id),
          supabase.from('challenge_attempts').select('*').eq('student_id', session.user.id),
          supabase.from('progress').select('*').eq('user_id', session.user.id).single(),
        ])
        submissions = (subsData || []).map(s => mapSubmission(s, [{ id: session.user.id, ...profile }]))
        challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, [{ id: session.user.id, ...profile }]))
        xp        = progressData?.xp        || 0
        completed = progressData?.completed  || []
        badges    = progressData?.badges     || []
      }

      XS.set({
        isLoggedIn: true,
        user: { id: session.user.id, name: profile.name, email: profile.email, avatar: profile.avatar, role: profile.role },
        page,
        xp, completed, badges, notifications: [],
        selectedArea: profile.area || null, nodeId: null,
        institutions: institutions || [],
        accounts,
        submissions,
        challengeAttempts,
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
