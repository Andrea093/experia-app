import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './app.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { supabase } from './lib/supabaseClient.js'
import { XS, doLogout } from './store/store.jsx'
import { mapSubmission, mapAttempt } from './lib/mappers.js'

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => (
  <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
    flexDirection:'column', gap:16, background:'#F9FAFB' }}>
    <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#E8732C',
      borderRadius:'50%', animation:'spin .7s linear infinite' }} />
    <span style={{ fontSize:13, color:'#9CA3AF', fontFamily:"'DM Sans', sans-serif" }}>Cargando...</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const [{ data: profile }, { data: institutions }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('institutions').select('*').order('name'),
    ])

    if (profile) {
      let page = 'map'
      if (profile.role === 'instructor') page = 'instructor-dashboard'
      if (profile.role === 'admin')      page = 'admin-dashboard'

      let accounts = [], submissions = [], challengeAttempts = []
      let xp = 0, completed = [], badges = []

      if (profile.role === 'admin' || profile.role === 'instructor') {
        const [{ data: profilesData }, { data: subsData }, { data: attemptsData }] = await Promise.all([
          supabase.from('profiles').select('*').order('name'),
          supabase.from('submissions').select('*').order('created_at', { ascending: false }),
          supabase.from('challenge_attempts').select('*').order('created_at', { ascending: false }),
        ])
        const allProfiles = profilesData || []
        accounts = allProfiles.map(p => ({
          email: p.email, name: p.name, avatar: p.avatar,
          role: p.role, area: p.area || null, institution: '', pass: '',
        }))
        submissions      = (subsData     || []).map(s => mapSubmission(s, allProfiles))
        challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, allProfiles))
      }

      if (profile.role === 'student') {
        const me = [{ id: session.user.id, ...profile }]
        const [{ data: subsData }, { data: attemptsData }, { data: progressData }] = await Promise.all([
          supabase.from('submissions').select('*').eq('student_id', session.user.id),
          supabase.from('challenge_attempts').select('*').eq('student_id', session.user.id),
          supabase.from('progress').select('*').eq('user_id', session.user.id).single(),
        ])
        submissions       = (subsData     || []).map(s => mapSubmission(s, me))
        challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, me))
        xp        = progressData?.xp        || 0
        completed = progressData?.completed  || []
        badges    = progressData?.badges     || []
      }

      XS.set({
        isLoggedIn: true,
        user: { id: session.user.id, name: profile.name, email: profile.email,
                avatar: profile.avatar, role: profile.role },
        page, xp, completed, badges, notifications: [],
        selectedArea: profile.area || null, nodeId: null,
        institutions: institutions || [],
        accounts, submissions, challengeAttempts,
      })
    }
  }
}

// Sincronizar cierre de sesión desde otras pestañas
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') doLogout()
})

root.render(<Loading />)
restoreSession().finally(() => {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
})
