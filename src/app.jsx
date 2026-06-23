import React from 'react'
import { useStore, nav } from './store/store.jsx'
import { getActiveCourseTheme } from './store/store.jsx'
import { applySavedTheme, applyLightOnly } from './lib/theme.js'
import { NotifManager } from './components/ui.jsx'
import DetectiveAmbient from './components/DetectiveAmbient.jsx'
import EscapeRoomAmbient from './components/EscapeRoomAmbient.jsx'
import LabAmbient from './components/LabAmbient.jsx'
import TimeTravelAmbient from './components/TimeTravelAmbient.jsx'
import { OnboardingModal } from './components/Onboarding.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

// ---- PWA Install Prompt (solo móvil, solo cuando el navegador lo dispara) ----
const PWAInstallPrompt = () => {
  const [prompt, setPrompt] = React.useState(null)
  const [dismissed, setDismissed] = React.useState(
    () => !!sessionStorage.getItem('pwa-dismissed')
  )

  React.useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else handleDismiss()
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  if (!prompt || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9000,
      background: 'var(--white)', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,.18)', border: '1.5px solid var(--orange-pale)',
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeUp .35s var(--ease-out)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gradient-orange)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>E</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Instalar Experia</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Accede más rápido desde tu pantalla de inicio</div>
      </div>
      <button onClick={handleDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: 'var(--subtle)', padding: '4px 6px', lineHeight: 1, flexShrink: 0 }}
        aria-label="Cerrar">×</button>
      <button onClick={handleInstall}
        style={{ background: 'var(--orange)', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px',
          borderRadius: 8, fontFamily: 'var(--font)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Instalar
      </button>
    </div>
  )
}

// Páginas con carga diferida — cada rol solo descarga lo que necesita
const LandingPage           = React.lazy(() => import('./pages/landing.jsx'))
const LoginPage             = React.lazy(() => import('./pages/login.jsx'))
const LearningMap           = React.lazy(() => import('./pages/map.jsx'))
const LessonView            = React.lazy(() => import('./pages/lesson.jsx'))
const ChallengeView         = React.lazy(() => import('./pages/challenges.jsx'))
const ProfilePage           = React.lazy(() => import('./pages/profile.jsx'))
const StudentProductUpload  = React.lazy(() => import('./pages/Grid.jsx'))
const InstructorDashboard   = React.lazy(() => import('./pages/InstructorDashboard.jsx'))
const InstructorRouteEditor = React.lazy(() => import('./pages/InstructorRouteEditor.jsx'))
const AdminAnalytics        = React.lazy(() => import('./pages/AdminAnalytics.jsx'))
const AdminCourses          = React.lazy(() => import('./pages/AdminCourses.jsx'))
const InstructorStudentView = React.lazy(() => import('./pages/InstructorStudentView.jsx'))

// Nuevas páginas extraídas
const AreaSelection         = React.lazy(() => import('./pages/AreaSelection.jsx'))
const CourseSelection       = React.lazy(() => import('./pages/CourseSelection.jsx'))
const GamesPage             = React.lazy(() => import('./pages/games.jsx'))
const InstructorStatsPage   = React.lazy(() => import('./pages/InstructorStats.jsx'))
const SchoolsAdminPage      = React.lazy(() => import('./pages/AdminSchools.jsx'))
const AdminPage             = React.lazy(() => import('./pages/AdminUsers.jsx'))
const ForumPage             = React.lazy(() => import('./pages/forum.jsx'))
const CertPage              = React.lazy(() => import('./pages/CertPage.jsx'))

const PageSpinner = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 14, animation: 'fadeIn .3s ease' }}>
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--border)',
        borderRadius: '50%' }} />
      <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent',
        borderTopColor: 'var(--orange)', borderRightColor: 'var(--orange-light)',
        borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  </div>
)

// =============================================
// EXPERIA — App Shell (responsive + optimized)
// =============================================
const App = () => {
  const page           = useStore(s => s.page);
  const isLoggedIn     = useStore(s => s.isLoggedIn);
  const nodeId         = useStore(s => s.nodeId);
  const user           = useStore(s => s.user);
  const selectedArea   = useStore(s => s.selectedArea);
  const hasCourses     = useStore(s => (s.courses || []).some(c => c.is_active));
  const enrolledCourse = useStore(s => s.enrolledCourseId);
  const courses        = useStore(s => s.courses);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Aplica el tema visual inmersivo del curso activo en el elemento raíz.
  // Solo cuando el estudiante está logueado y dentro de su curso — nunca en login/landing.
  React.useEffect(() => {
    const root = document.documentElement;
    const theme = isLoggedIn ? getActiveCourseTheme() : null;
    if (theme) {
      root.setAttribute('data-course-theme', theme);
    } else {
      root.removeAttribute('data-course-theme');
    }
  }, [isLoggedIn, enrolledCourse, courses]);

  // El modo oscuro NUNCA debe aplicarse en la entrada pública (landing/login):
  // esas páginas siempre se ven en modo claro. Dentro de la app se respeta
  // la preferencia guardada por el usuario.
  React.useEffect(() => {
    const isPublicEntry = !isLoggedIn && (page === 'landing' || page === 'login');
    if (isPublicEntry) applyLightOnly();
    else applySavedTheme();
  }, [page, isLoggedIn]);
  const [studentView, setStudentView] = React.useState(null);

  React.useEffect(() => { setMobileSidebarOpen(false); }, [page]);

  if (page === 'landing' && !isLoggedIn) return <React.Suspense fallback={null}><LandingPage /></React.Suspense>;
  if (page === 'login'   && !isLoggedIn) return <React.Suspense fallback={null}><LoginPage /></React.Suspense>;
  // Verificación pública de certificado — no requiere autenticación
  if (page === 'cert') return <React.Suspense fallback={<PageSpinner />}><CertPage /></React.Suspense>;
  if (!isLoggedIn) { setTimeout(() => nav('landing'), 0); return null; }

  const role = user?.role;
  // Guard estudiante: si hay cursos en BD y no está inscrito → selección de curso
  if (role === 'student' && hasCourses && !enrolledCourse) return <React.Suspense fallback={<PageSpinner />}><CourseSelection /></React.Suspense>;
  // Guard legado: sin cursos en BD y sin área → selección de área
  if (role === 'student' && !hasCourses && !selectedArea) return <React.Suspense fallback={<PageSpinner />}><AreaSelection /></React.Suspense>;

  const fullPages = ['lesson', 'challenge'];
  const isFullPage = fullPages.includes(page);

  const renderPage = () => {
    if (role === 'admin') {
      switch (page) {
        case 'admin-dashboard':  return <AdminPage />;
        case 'admin-courses':    return <AdminCourses />;
        case 'admin-schools':    return <SchoolsAdminPage />;
        case 'admin-analytics':  return <AdminAnalytics />;
        case 'forum':            return <ForumPage />;
        case 'profile':          return <ProfilePage />;
        default:                 return <AdminPage />;
      }
    }
    if (role === 'instructor') {
      switch (page) {
        case 'instructor-dashboard':
          return (
            <InstructorStudentView
              studentView={studentView}
              setStudentView={setStudentView}
            />
          );
        case 'instructor-stats': return <InstructorStatsPage />;
        case 'instructor-route': return <InstructorRouteEditor />;
        case 'forum':            return <ForumPage />;
        case 'profile':          return <ProfilePage />;
        default:                 return <InstructorDashboard />;
      }
    }
    switch (page) {
      case 'map':      return <LearningMap />;
      case 'lesson':   return <LessonView />;
      case 'challenge':return <ChallengeView />;
      case 'games':    return <GamesPage />;
      case 'grid':     return <StudentProductUpload />;
      case 'forum':    return <ForumPage />;
      case 'profile':  return <ProfilePage />;
      default:         return <LearningMap />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <DetectiveAmbient />
      <EscapeRoomAmbient />
      <LabAmbient />
      <TimeTravelAmbient />
      <NotifManager />
      <PWAInstallPrompt />
      {/* Bienvenida: solo estudiantes que no han visto el onboarding (flag en profiles) */}
      {role === 'student' && user?.onboarded === false && <OnboardingModal />}
      {!isFullPage && (
        <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!isFullPage && <Header onMenuClick={() => setMobileSidebarOpen(o => !o)} />}
        <main id="main-content" tabIndex="-1" className="page-enter" style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)', outline: 'none' }} key={page + (nodeId || '')}>
          <React.Suspense fallback={<PageSpinner />}>
            {renderPage()}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
