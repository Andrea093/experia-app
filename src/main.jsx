import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './app.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { supabase } from './lib/supabaseClient.js'
import { XS, doLogout, loadRouteConfigs } from './store/store.jsx'
import { mapSubmission, mapAttempt } from './lib/mappers.js'

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => {
  const [slow, setSlow] = React.useState(false)
  const [verySlow, setVerySlow] = React.useState(false)

  React.useEffect(() => {
    const t1 = setTimeout(() => setSlow(true), 5000)
    const t2 = setTimeout(() => setVerySlow(true), 12000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:16, background:'#F9FAFB' }}>
      <div style={{ width:40, height:40, border:'3px solid #E5E7EB', borderTopColor:'#E8732C',
        borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <span style={{ fontSize:13, color:'#9CA3AF', fontFamily:"'DM Sans', sans-serif" }}>Cargando...</span>
      {slow && !verySlow && (
        <span style={{ fontSize:12, color:'#9CA3AF', fontFamily:"'DM Sans', sans-serif", maxWidth:260, textAlign:'center' }}>
          Conectando con el servidor, puede tomar unos segundos...
        </span>
      )}
      {verySlow && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'#6B7280', fontFamily:"'DM Sans', sans-serif" }}>
            Tardando más de lo esperado.
          </span>
          <button onClick={() => window.location.reload()}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer',
              background:'#E8732C', color:'#fff', fontSize:13, fontWeight:600,
              fontFamily:"'DM Sans', sans-serif" }}>
            Recargar página
          </button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// Timeout helper: rechaza si la promesa tarda más de ms milisegundos
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])

async function restoreSession() {
  const { data: { session }, error: sessErr } = await withTimeout(
    supabase.auth.getSession(), 10000
  ).catch(() => ({ data: { session: null }, error: new Error('timeout') }))

  if (!session) return

  const [profileRes, institutionsRes, cohortsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase.from('institutions').select('*').order('name'),
    supabase.from('cohorts').select('*').order('created_at'),
  ])

  const profile = profileRes.data
  if (!profile) return

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
    const instById = {}
    ;(institutionsRes.data || []).forEach(i => { instById[i.id] = i.name })
    accounts = allProfiles.map(p => ({
      id: p.id, email: p.email, name: p.name, avatar: p.avatar,
      role: p.role, area: p.area || null,
      institution: instById[p.institution_id] || '',
      pass: '',
    }))
    submissions       = (subsData     || []).map(s => mapSubmission(s, allProfiles, instById))
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

  loadRouteConfigs()
  XS.set({
    isLoggedIn: true,
    user: { id: session.user.id, name: profile.name, email: profile.email,
            avatar: profile.avatar, role: profile.role },
    page, xp, completed, badges, notifications: [],
    selectedArea: profile.area || null, nodeId: null,
    institutions: institutionsRes.data || [],
    cohorts: cohortsRes.data || [],
    accounts, submissions, challengeAttempts,
  })
}

// Sincronizar cierre de sesión desde otras pestañas
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') doLogout()
})

root.render(<Loading />)

// Si restoreSession tarda más de 20s en total, renderiza igual (usuario no logueado → landing)
withTimeout(restoreSession(), 20000)
  .catch(err => { if (err.message !== 'timeout') console.error('restoreSession:', err) })
  .finally(() => {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    )
  })
