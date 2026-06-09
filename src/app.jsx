import React from 'react'
import { useStore, nav } from './store/store.jsx'
import { NotifManager } from './components/ui.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

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
const AdminCohorts          = React.lazy(() => import('./pages/AdminCohorts.jsx'))
const AdminCourses          = React.lazy(() => import('./pages/AdminCourses.jsx'))
const InstructorStudentView = React.lazy(() => import('./pages/InstructorStudentView.jsx'))

// Nuevas páginas extraídas
const AreaSelection         = React.lazy(() => import('./pages/AreaSelection.jsx'))
const CourseSelection       = React.lazy(() => import('./pages/CourseSelection.jsx'))
const GamesPage             = React.lazy(() => import('./pages/games.jsx'))
const InstructorStatsPage   = React.lazy(() => import('./pages/InstructorStats.jsx'))
const SchoolsAdminPage      = React.lazy(() => import('./pages/AdminSchools.jsx'))
const AdminPage             = React.lazy(() => import('./pages/AdminUsers.jsx'))

const PageSpinner = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--orange)',
      borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [studentView, setStudentView] = React.useState(null);

  React.useEffect(() => { setMobileSidebarOpen(false); }, [page]);

  if (page === 'landing' && !isLoggedIn) return <React.Suspense fallback={null}><LandingPage /></React.Suspense>;
  if (page === 'login'   && !isLoggedIn) return <React.Suspense fallback={null}><LoginPage /></React.Suspense>;
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
        case 'admin-cohorts':    return <AdminCohorts />;
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
      case 'profile':  return <ProfilePage />;
      default:         return <LearningMap />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <NotifManager />
      {!isFullPage && (
        <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {!isFullPage && <Header onMenuClick={() => setMobileSidebarOpen(o => !o)} />}
        <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }} key={page + (nodeId || '')}>
          <React.Suspense fallback={<PageSpinner />}>
            {renderPage()}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
