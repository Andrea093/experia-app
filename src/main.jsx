import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './app.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { supabase } from './lib/supabaseClient.js'
import { XS, useStore, doLogout, loadRouteConfigs, loadInstructorInstitutions, loadCourses, loadUserCourses, applyInitialHash, getAccessBlockReason } from './store/store.jsx'
import { mapSubmission, mapAttempt } from './lib/mappers.js'
import { loadStudentSession } from './lib/loadStudentSession.js'
import { isSessionExpired, clearIdleActivity, markActivity } from './lib/idleTimeout.js'

// Wrapper que pasa el page actual como resetKey al ErrorBoundary
const PagedErrorBoundary = ({ children }) => {
  const page = useStore(s => s.page);
  return <ErrorBoundary resetKey={page}>{children}</ErrorBoundary>;
};

const SESSION_TIMEOUT_MS  = 20_000
const SLOW_LOAD_THRESHOLD =  5_000
const VERY_SLOW_THRESHOLD = 12_000

const root = ReactDOM.createRoot(document.getElementById('root'))

const Loading = () => {
  const [slow, setSlow] = React.useState(false)
  const [verySlow, setVerySlow] = React.useState(false)

  React.useEffect(() => {
    const t1 = setTimeout(() => setSlow(true), SLOW_LOAD_THRESHOLD)
    const t2 = setTimeout(() => setVerySlow(true), VERY_SLOW_THRESHOLD)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:18, background:'var(--bg, #F9FAFB)' }}>
      <img src="/logo-ceinfes.png" alt="CEINFES" className="logo-img" style={{ width:150, height:'auto',
        animation:'logoPulse 1.8s ease-in-out infinite' }} />
      <div style={{ width:36, height:36, border:'3px solid var(--border, #E5E7EB)', borderTopColor:'#EC671A',
        borderRightColor:'#F59E33', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <span style={{ fontSize:13, color:'var(--subtle, #9CA3AF)', fontFamily:"'Inter', sans-serif" }}>Cargando...</span>
      {slow && !verySlow && (
        <span style={{ fontSize:12, color:'var(--subtle, #9CA3AF)', fontFamily:"'Inter', sans-serif", maxWidth:260, textAlign:'center' }}>
          Conectando con el servidor, puede tomar unos segundos...
        </span>
      )}
      {verySlow && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'var(--muted, #6B7280)', fontFamily:"'Inter', sans-serif" }}>
            Tardando más de lo esperado.
          </span>
          <button onClick={() => window.location.reload()}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer',
              background:'#EC671A', color:'#fff', fontSize:13, fontWeight:600,
              fontFamily:"'Inter', sans-serif" }}>
            Recargar página
          </button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes logoPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.65;transform:scale(.97)}}`}</style>
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

  // Cierre por inactividad: si la sesión guardada lleva demasiado tiempo
  // inactiva (incluyendo navegador cerrado), no la restauramos.
  if (isSessionExpired()) {
    clearIdleActivity()
    await supabase.auth.signOut()
    return
  }
  // Sesión válida: refrescar el marcador de actividad para esta visita.
  markActivity()

  const [profileRes, institutionsRes, cohortsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase.from('institutions').select('*').order('name'),
    supabase.from('cohorts').select('*').order('created_at'),
  ])

  const profile = profileRes.data
  if (!profile) return

  // Bloqueo de acceso: cuenta o institución desactivada por el admin.
  const blockReason = await getAccessBlockReason(profile, institutionsRes.data || [])
  if (blockReason) { await supabase.auth.signOut(); return }

  let page = 'map'
  if (profile.role === 'instructor') page = 'instructor-dashboard'
  if (profile.role === 'admin')      page = 'admin-dashboard'

  let accounts = [], submissions = [], challengeAttempts = []
  let xp = 0, completed = [], badges = [], allEnrollments = []

  if (profile.role === 'admin' || profile.role === 'instructor') {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const isInstructor = profile.role === 'instructor'
    const profilesQuery = isInstructor && profile.institution_id
      ? supabase.from('profiles').select('*').eq('institution_id', profile.institution_id).order('name')
      : supabase.from('profiles').select('*').order('name').limit(500)
    const [{ data: profilesData }, { data: subsData }, { data: attemptsData }] = await Promise.all([
      profilesQuery,
      supabase.from('submissions').select('*').gte('created_at', THIRTY_DAYS_AGO).order('created_at', { ascending: false }).limit(300),
      supabase.from('challenge_attempts').select('*').gte('created_at', THIRTY_DAYS_AGO).order('created_at', { ascending: false }).limit(300),
    ])
    const allProfiles = profilesData || []
    const instById = {}
    ;(institutionsRes.data || []).forEach(i => { instById[i.id] = i.name })
    accounts = allProfiles.map(p => ({
      id: p.id, email: p.email, name: p.name, avatar: p.avatar,
      role: p.role, area: p.area || null,
      institution: instById[p.institution_id] || '',
      institution_id: p.institution_id || null,
      cohort_id: p.cohort_id || null,
      is_active: p.is_active !== false,
      pass: '',
    }))
    submissions       = (subsData     || []).map(s => mapSubmission(s, allProfiles, instById))
    challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, allProfiles))
  }

  if (profile.role === 'student') {
    const me = [{ id: session.user.id, ...profile }]
    const [{ data: subsData }, { data: attemptsData }, studentSess] = await Promise.all([
      supabase.from('submissions').select('*').eq('student_id', session.user.id).limit(100),
      supabase.from('challenge_attempts').select('*').eq('student_id', session.user.id).limit(200),
      loadStudentSession(session.user.id, profile.area || null, profile.institution_id || null),
    ])
    submissions       = (subsData     || []).map(s => mapSubmission(s, me))
    challengeAttempts = (attemptsData || []).map(a => mapAttempt(a, me))
    xp             = studentSess.xp
    completed      = studentSess.completed
    badges         = studentSess.badges
    allEnrollments = studentSess.allEnrollments || []
    if (studentSess.enrolledCourseId) {
      XS.set({ courseModules: studentSess.courseModules, enrolledCourseId: studentSess.enrolledCourseId })
    }
  }

  loadRouteConfigs()
  // courses + userCourses determinan el guard de "selección de curso". Marcamos
  // coursesLoaded solo cuando AMBAS terminan, para que App no decida la ruta del
  // estudiante con datos a medias (eso causaba el parpadeo curso/onboarding).
  Promise.all([loadCourses(), loadUserCourses()])
    .catch(err => console.error('loadCourses/loadUserCourses:', err))
    .finally(() => XS.set({ coursesLoaded: true }))
  if (profile.role === 'admin' || profile.role === 'instructor') loadInstructorInstitutions()

  // Suscripción en tiempo real: cuando el instructor guarda una ruta,
  // todos los estudiantes conectados reciben el cambio automáticamente
  const realtimeFilter = profile.institution_id
    ? { event: '*', schema: 'public', table: 'route_configs', filter: `institution_id=eq.${profile.institution_id}` }
    : { event: '*', schema: 'public', table: 'route_configs' }
  supabase.channel('route-configs-changes')
    .on('postgres_changes', realtimeFilter, () => { loadRouteConfigs() })
    .subscribe()

  XS.set({
    isLoggedIn: true,
    user: { id: session.user.id, name: profile.name, email: profile.email,
            avatar: profile.avatar, role: profile.role,
            institution_id: profile.institution_id || null,
            // ?? true: si la migración 0009 no está aplicada, no molestar con onboarding
            onboarded: profile.onboarded ?? true,
            onboardingBonus: profile.onboarding_bonus ?? true },
    page, xp, completed, badges, notifications: [],
    selectedArea: profile.area || null, nodeId: null,
    institutions: institutionsRes.data || [],
    cohorts: cohortsRes.data || [],
    accounts, submissions, challengeAttempts,
    allEnrollments,
  })

  // Deep link: si la URL trae #/pagina, navegar allí tras restaurar sesión
  applyInitialHash()
}

// Sincronizar cierre de sesión desde otras pestañas
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') doLogout()
})

root.render(<Loading />)

// Si restoreSession tarda más de 20s en total, renderiza igual (usuario no logueado → landing)
withTimeout(restoreSession(), SESSION_TIMEOUT_MS)
  .catch(err => { if (err.message !== 'timeout') console.error('restoreSession:', err) })
  .finally(() => {
    root.render(
      <React.StrictMode>
        <PagedErrorBoundary>
          <App />
        </PagedErrorBoundary>
      </React.StrictMode>
    )
  })
