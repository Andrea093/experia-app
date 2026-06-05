import React from 'react'
import {
  useStore, XS, nav, doLogout, selectArea, changeArea,
  createAccount, deleteAccount, changeAccountArea,
  bulkCreateAccounts, createInstitution, updateInstitution, deleteInstitution,
  dismissStudentMessage, resetStudentProgress,
  assignInstructorInstitution, removeInstructorInstitution, assignRouteToInstitution,
  AREAS, BADGES, INITIAL_INSTITUTIONS,
  getStudentModules, findModule, nodeStatus,
  calcLevel, gradeTotal, gradeMax,
} from './store/store.jsx'
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger,
} from './components/ui.jsx'
import { supabase } from './lib/supabaseClient.js'

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
const InstructorStudentView = React.lazy(() => import('./pages/InstructorStudentView.jsx'))

const PageSpinner = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--orange)',
      borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
  </div>
)
// =============================================
// EXPERIA — App Shell (responsive + optimized)
// =============================================

// ---- Area Selection Page ----
const AreaSelection = () => {
  const selectedArea = useStore(s => s.selectedArea);
  const [hovArea, setHovArea] = React.useState(null);
  const [pendingArea, setPendingArea] = React.useState(null);
  const isMobile = useMobile();
  if (selectedArea) { nav('map'); return null; }
  const pending = AREAS.find(a => a.id === pendingArea);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: isMobile ? 20 : 40, background: 'var(--bg)', overflow: 'auto' }}>
      <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: isMobile ? 24 : 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>C</div>
            <span style={{ fontWeight: 800, fontSize: 19, color: 'var(--dark)' }}>ceinfes<span style={{ color: 'var(--orange)' }}>.</span></span>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'var(--dark)', marginBottom: 10, lineHeight: 1.2 }}>
            Elige tu área de aprendizaje
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
            Selecciona <strong>una sola área</strong> para personalizar tu ruta formativa en DCE.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 10 : 14, marginBottom: 24 }}>
          {AREAS.map(area => {
            const isHov = hovArea === area.id;
            return (
              <button key={area.id} onClick={() => setPendingArea(area.id)}
                onMouseEnter={() => setHovArea(area.id)} onMouseLeave={() => setHovArea(null)}
                style={{
                  padding: isMobile ? '20px 12px' : '28px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: isHov ? area.bg : 'var(--white)',
                  boxShadow: isHov ? `0 8px 24px ${area.color}25` : 'var(--sh-sm)',
                  transition: 'all .25s ease', transform: isHov ? 'translateY(-4px)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  outline: isHov ? `2px solid ${area.color}` : '2px solid transparent',
                }}>
                <span style={{ fontSize: isMobile ? 28 : 36 }}>{area.icon}</span>
                <span style={{ fontSize: isMobile ? 12 : 15, fontWeight: 700, color: area.color }}>{area.name}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--subtle)' }}>Puedes cambiar tu área más adelante desde tu perfil.</p>
      </div>

      <Modal open={!!pendingArea} onClose={() => setPendingArea(null)} title="Confirmar selección" width={400}>
        {pending && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 44 }}>{pending.icon}</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)', marginTop: 12, marginBottom: 8 }}>{pending.name}</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              ¿Confirmas esta área como tu ruta formativa? Podrás cambiarla más adelante desde tu perfil.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" full onClick={() => setPendingArea(null)}>Cancelar</Btn>
              <Btn variant="primary" full onClick={() => { selectArea(pendingArea); setPendingArea(null); }}>Confirmar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ---- Sidebar ----
const Sidebar = React.memo(({ mobileOpen, onMobileClose }) => {
  const page = useStore(s => s.page);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const user = useStore(s => s.user);
  const selectedArea = useStore(s => s.selectedArea);
  const isMobile = useMobile();
  if (!isLoggedIn || !user) return null;

  const role = user.role;
  const area = AREAS.find(a => a.id === selectedArea);

  const studentItems = [
    { key: 'map', label: 'Mi formación', icon: <MapIc s={19} />, active: ['map','lesson','challenge'] },
    { key: 'games', label: 'Juegos', icon: <GameIc s={19} />, active: ['games'] },
    { key: 'grid', label: 'Entrega final', icon: <FileIc s={19} />, active: ['grid'] },
    { key: 'profile', label: 'Perfil', icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const instructorItems = [
    { key: 'instructor-dashboard', label: 'Entregas',     icon: <FileIc s={19} />, active: ['instructor-dashboard'] },
    { key: 'instructor-stats',     label: 'Estadísticas', icon: <BarIc s={19} />,  active: ['instructor-stats'] },
    { key: 'instructor-route',     label: 'Ruta',         icon: <MapIc s={19} />,  active: ['instructor-route'] },
    { key: 'profile',              label: 'Perfil',       icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const adminItems = [
    { key: 'admin-dashboard',  label: 'Usuarios',   icon: <UsersIc s={19} />, active: ['admin-dashboard'] },
    { key: 'admin-schools',    label: 'Colegios',   icon: <SchoolIc s={19} />, active: ['admin-schools'] },
    { key: 'admin-analytics',  label: 'Analítica',  icon: <BarIc s={19} />,   active: ['admin-analytics'] },
    { key: 'admin-cohorts',    label: 'Cohortes',   icon: <ClockIc s={19} />, active: ['admin-cohorts'] },
    { key: 'profile',          label: 'Perfil',     icon: <UserIc s={19} />,  active: ['profile'] },
  ];
  const items = role === 'instructor' ? instructorItems : role === 'admin' ? adminItems : studentItems;

  const handleNav = (key) => {
    nav(key);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <aside style={{
      width: 'var(--sidebar-w)', height: '100%', background: 'var(--white)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center', padding: '20px 22px 16px' }}>
        <LogoImg h={28} />
        {isMobile && (
          <button onClick={onMobileClose} style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIc s={18} c="var(--muted)" />
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ padding: '8px 12px', borderRadius: 8,
          background: role === 'admin' ? '#EDE9FE' : role === 'instructor' ? '#D1FAE5' : 'var(--purple-bg)',
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            color: role === 'admin' ? '#7C3AED' : role === 'instructor' ? 'var(--success)' : 'var(--purple)' }}>
            {role === 'admin' ? 'Administrador' : role === 'instructor' ? 'Instructor' : 'Estudiante'}
          </span>
          {area && role === 'student' && (
            <span style={{ fontSize: 10, color: area.color, fontWeight: 600 }}>· {area.icon} {area.name}</span>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) => {
          const isActive = (item.active || [item.key]).includes(page);
          return (
            <button key={i} onClick={() => handleNav(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                border: 'none', cursor: 'pointer', background: isActive ? 'var(--orange-bg)' : 'transparent',
                color: isActive ? 'var(--orange)' : 'var(--text-sec)', fontFamily: 'var(--font)',
                fontSize: 14, fontWeight: isActive ? 600 : 500, transition: 'all .15s', textAlign: 'left', width: '100%',
                minHeight: 44 }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--bg-alt)')}
              onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
              {item.icon}{item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={doLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', background: 'transparent',
          color: 'var(--muted)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, transition: 'color .2s',
          textAlign: 'left', minHeight: 44 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
          <LogOutIc s={16} /> Cerrar sesión
        </button>
        <div style={{ fontSize: 9, color: 'var(--subtle)', textAlign: 'center', marginTop: 6, letterSpacing: .3 }}>
          {/* eslint-disable-next-line no-undef */}
          v{new Date(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div onClick={onMobileClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2999,
            backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease',
          }} />
        )}
        <div style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 3000,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: mobileOpen ? 'var(--sh-xl)' : 'none',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
});

// ---- Header ----
const Header = React.memo(({ onMenuClick }) => {
  const user = useStore(s => s.user);
  const xp = useStore(s => s.xp);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const studentMessages = useStore(s => s.studentMessages);
  const isMobile = useMobile();
  const [showNotifs, setShowNotifs] = React.useState(false);
  if (!isLoggedIn || !user) return null;
  const level = calcLevel(xp);

  const myUnread = user.role === 'student'
    ? (studentMessages || []).filter(m => m.toEmail === user.email && !m.read)
    : [];

  React.useEffect(() => {
    if (!showNotifs) return;
    const close = () => setShowNotifs(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showNotifs]);

  return (
    <header style={{ height: 'var(--header-h)', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px 0 24px', gap: 12,
      borderBottom: '1px solid var(--border)', background: 'var(--white)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{
            background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MenuIc s={20} c="var(--text)" />
          </button>
        )}
        {isMobile && <LogoImg h={28} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: 'var(--dark)' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {user.role === 'instructor' ? 'Instructor' : `Nivel ${level} · ${xp} pts`}
          </div>
        </div>

        {/* Notification bell — students only */}
        {user.role === 'student' && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowNotifs(o => !o); }}
              style={{ position: 'relative', background: myUnread.length > 0 ? 'var(--orange-bg)' : 'var(--bg-alt)',
                border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'background .2s' }}>
              <span style={{ fontSize: 17 }}>🔔</span>
              {myUnread.length > 0 && (
                <span style={{ position: 'absolute', top: -3, right: -3, width: 17, height: 17,
                  borderRadius: '50%', background: 'var(--error)', color: '#fff', fontSize: 9,
                  fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--white)' }}>
                  {myUnread.length}
                </span>
              )}
            </button>

            {showNotifs && (
              <div onClick={e => e.stopPropagation()}
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320,
                  background: 'var(--white)', borderRadius: 14, border: '1px solid var(--border)',
                  boxShadow: 'var(--sh-xl)', zIndex: 1000, overflow: 'hidden',
                  animation: 'fadeUp .2s ease' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Notificaciones</span>
                  {myUnread.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      background: 'var(--orange-bg)', color: 'var(--orange)' }}>
                      {myUnread.length} nueva{myUnread.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {myUnread.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                    Sin notificaciones nuevas
                  </div>
                ) : (
                  <div style={{ maxHeight: 380, overflow: 'auto' }}>
                    {myUnread.map(msg => {
                      const isReturn = msg.type === 'return';
                      const isGraded = msg.type === 'graded';
                      const isApproved = msg.type === 'approved';
                      const msgLabel = isApproved ? '✅ ¡Tu entrega fue aprobada!'
                        : isGraded ? '📝 Tu instructor calificó tu entrega'
                        : '↩️ Tu instructor devolvió tu entrega';
                      const msgBg = isApproved ? '#F0FDF4' : isGraded ? '#EFF6FF' : 'var(--orange-50)';
                      return (
                        <div key={msg.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: msgBg }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{msgLabel}</div>
                            <span style={{ fontSize: 10, color: 'var(--subtle)', whiteSpace: 'nowrap', flexShrink: 0 }}>{msg.date}</span>
                          </div>
                          {(isGraded || isApproved) && msg.feedback && (
                            <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 10,
                              padding: '8px 10px', borderRadius: 8, background: 'var(--white)', border: '1px solid var(--border)',
                              fontStyle: 'italic' }}>
                              "{msg.feedback}"
                            </p>
                          )}
                          {isReturn && msg.returnNotes && (
                            <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 10,
                              padding: '8px 10px', borderRadius: 8, background: 'var(--white)', border: '1px solid var(--border)',
                              fontStyle: 'italic' }}>
                              "{msg.returnNotes}"
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => { dismissStudentMessage(msg.id); nav('grid'); setShowNotifs(false); }}
                              style={{ fontSize: 12, fontWeight: 700, color: isApproved ? 'var(--success)' : 'var(--orange)',
                                background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}>
                              {isApproved ? 'Ver certificado →' : isGraded ? 'Ver calificación →' : 'Ver y corregir →'}
                            </button>
                            <button onClick={() => dismissStudentMessage(msg.id)}
                              style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none',
                                cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}>
                              Marcar leída
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ width: 36, height: 36, borderRadius: '50%',
          background: user.role === 'instructor' ? 'var(--success)' : 'var(--orange)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
          overflow: 'hidden' }}
          onClick={() => nav('profile')}>
          {user.avatar?.startsWith('http')
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.avatar}
        </div>
        {!isMobile && (
          <button onClick={doLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            borderRadius: 6, display: 'flex', minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <LogOutIc s={18} c="var(--muted)" />
          </button>
        )}
      </div>
    </header>
  );
});

// ---- Games overview ----
const GamesPage = () => {
  const completed = useStore(s => s.completed);
  const selectedArea = useStore(s => s.selectedArea);
  const isMobile = useMobile();
  const studentModules = React.useMemo(() => getStudentModules(selectedArea), [selectedArea]);
  const challenges = React.useMemo(() => studentModules.filter(m => m.type === 'challenge' || m.type === 'evaluation'), [studentModules]);
  const typeIcons = { dragdrop: '🧩', empathy: '🗺️', simulation: '🎭', matching: '🔗', designlab: '🏗️' };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Juegos y evaluaciones</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Retos interactivos para poner a prueba lo aprendido</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 16 }}>
        {challenges.map((ch) => {
          const status = nodeStatus(ch.id, completed, selectedArea);
          return (
            <div key={ch.id} onClick={() => status !== 'locked' && nav('challenge', ch.id)}
              style={{ padding: isMobile ? '18px' : '24px', borderRadius: 16, background: 'var(--white)',
                border: status === 'available' ? '2px solid var(--orange-pale)' : status === 'completed' ? '2px solid #D1FAE5' : '1px solid var(--border)',
                cursor: status === 'locked' ? 'default' : 'pointer', opacity: status === 'locked' ? .5 : 1, transition: 'all .25s',
                display: isMobile ? 'flex' : 'block', alignItems: isMobile ? 'center' : undefined, gap: isMobile ? 14 : 0 }}
              onMouseEnter={e => status !== 'locked' && !isMobile && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.transform = 'none')}>
              <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: isMobile ? 0 : 12, flexShrink: 0 }}>
                {status === 'locked' ? '🔒' : (typeIcons[ch.ctype] || '🏆')}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-bg)',
                  padding: '3px 8px', borderRadius: 4, letterSpacing: .8, display: 'inline-block', marginBottom: 6 }}>{ch.subtitle}</span>
                <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{ch.title}</h3>
                {!isMobile && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{ch.desc}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: isMobile ? 4 : 12 }}>
                  <ZapIc s={14} c="var(--orange)" />
                  <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>+{ch.xp} XP</span>
                  {status === 'completed' && <CheckIc s={14} c="var(--success)" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================
// INSTRUCTOR STATS
// =============================================
const InstructorStatsPage = () => {
  const submissions = useStore(s => s.submissions);
  const attempts = useStore(s => s.challengeAttempts);
  const [activeArea, setActiveArea] = React.useState('all');
  const [expandedChallenge, setExpandedChallenge] = React.useState(null);
  const isMobile = useMobile();

  const graded = React.useMemo(() => submissions.filter(s => s.grade), [submissions]);
  const avgScore = React.useMemo(() => graded.length > 0
    ? Math.round(graded.reduce((a, s) => a + gradeTotal(s.grade), 0) / graded.length) : 0, [graded]);
  const filteredAttempts = React.useMemo(() =>
    activeArea === 'all' ? attempts : attempts.filter(a => a.area === activeArea), [attempts, activeArea]);

  const attemptCountByArea = React.useMemo(() => {
    const map = {};
    AREAS.forEach(a => { map[a.id] = 0; });
    attempts.forEach(att => { if (map[att.area] !== undefined) map[att.area]++; });
    return map;
  }, [attempts]);

  const byChallengeList = React.useMemo(() => {
    const byChallengeMap = {};
    filteredAttempts.forEach(a => {
      if (!byChallengeMap[a.challengeId]) byChallengeMap[a.challengeId] = [];
      byChallengeMap[a.challengeId].push(a);
    });
    return Object.entries(byChallengeMap).map(([cId, atts]) => {
      const mod = findModule(cId);
      const avgPct = atts.length > 0 ? Math.round(atts.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / atts.length) : 0;
      const qMap = {};
      atts.forEach(att => {
        att.questions.forEach(q => {
          if (!qMap[q.q]) qMap[q.q] = { q: q.q, total: 0, correct: 0 };
          qMap[q.q].total++;
          if (q.correct) qMap[q.q].correct++;
        });
      });
      const questions = Object.values(qMap).map(q => ({ ...q, pct: Math.round((q.correct / q.total) * 100) })).sort((a, b) => a.pct - b.pct);
      return { id: cId, mod, atts, avgPct, questions };
    });
  }, [filteredAttempts]);

  const hardestQuestions = React.useMemo(() => {
    const allQMap = {};
    filteredAttempts.forEach(att => {
      att.questions.forEach(q => {
        if (!allQMap[q.q]) allQMap[q.q] = { q: q.q, total: 0, correct: 0, challengeId: att.challengeId, area: att.area };
        allQMap[q.q].total++;
        if (q.correct) allQMap[q.q].correct++;
      });
    });
    return Object.values(allQMap).map(q => ({ ...q, pct: Math.round((q.correct / q.total) * 100) }))
      .filter(q => q.total >= 1).sort((a, b) => a.pct - b.pct).slice(0, 10);
  }, [filteredAttempts]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Estadísticas Detalladas</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Análisis de desempeño por reto y por pregunta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 160}px, 1fr))`, gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Entregas totales', value: submissions.length, color: 'var(--purple)' },
          { label: 'Calificadas', value: graded.length, color: 'var(--success)' },
          { label: 'Promedio rúbrica', value: avgScore + '/' + gradeMax(), color: 'var(--orange)' },
          { label: 'Intentos de retos', value: filteredAttempts.length, color: 'var(--warn)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveArea('all')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
          background: activeArea === 'all' ? 'var(--dark)' : 'var(--bg-alt)', color: activeArea === 'all' ? '#fff' : 'var(--muted)' }}>
          Todas
        </button>
        {AREAS.map(a => {
          const count = attemptCountByArea[a.id] ?? 0;
          return (
            <button key={a.id} onClick={() => setActiveArea(a.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
              background: activeArea === a.id ? a.color + '18' : 'var(--bg-alt)', color: activeArea === a.id ? a.color : 'var(--muted)' }}>
              {a.icon} {isMobile ? '' : a.name + ' '}({count})
            </button>
          );
        })}
      </div>

      <div style={{ padding: '24px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Preguntas con más errores</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Ordenadas de menor a mayor acierto.</p>
        {hardestQuestions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>No hay datos aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hardestQuestions.map((q, i) => {
              const area = AREAS.find(a => a.id === q.area);
              const barColor = q.pct >= 75 ? 'var(--success)' : q.pct >= 50 ? 'var(--warn)' : 'var(--error)';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 36, textAlign: 'right' }}>{q.pct}%</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-alt)', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', borderRadius: 4, width: q.pct + '%', background: barColor }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {area && <span style={{ fontSize: 12 }}>{area.icon}</span>}
                      <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--dark)', fontWeight: 500 }}>{q.q}</span>
                      <span style={{ fontSize: 10, color: 'var(--subtle)' }}>({q.correct}/{q.total})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Detalle por reto</h3>
        {byChallengeList.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>No hay intentos registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byChallengeList.map(ch => {
              const isExpanded = expandedChallenge === ch.id;
              return (
                <div key={ch.id} style={{ borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <button onClick={() => setExpandedChallenge(isExpanded ? null : ch.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px',
                      border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', textAlign: 'left' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: ch.avgPct >= 75 ? '#D1FAE5' : ch.avgPct >= 50 ? '#FEF3C7' : '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                      color: ch.avgPct >= 75 ? 'var(--success)' : ch.avgPct >= 50 ? 'var(--warn)' : 'var(--error)' }}>
                      {ch.avgPct}%
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.mod?.title || ch.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ch.atts.length} intentos · Promedio {ch.avgPct}%</div>
                    </div>
                    <ChevRIc s={18} c="var(--muted)" />
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, margin: '16px 0 10px' }}>
                        Intentos por estudiante
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {ch.atts.map((att, ai) => (
                          <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange-bg)', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>
                              {att.studentName.charAt(0)}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.studentName}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: att.score / att.maxScore >= .75 ? 'var(--success)' : 'var(--warn)', whiteSpace: 'nowrap' }}>
                              {att.score}/{att.maxScore}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
                        Preguntas — tasa de acierto
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ch.questions.map((q, qi) => {
                          const barColor = q.pct >= 75 ? 'var(--success)' : q.pct >= 50 ? 'var(--warn)' : 'var(--error)';
                          return (
                            <div key={qi}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                                <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--dark)', fontWeight: 500, flex: 1 }}>{q.q}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>{q.pct}%</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, width: q.pct + '%', background: barColor }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '24px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Entregas por área</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AREAS.map(area => {
            const areaSubs = submissions.filter(s => s.area === area.id);
            const areaGraded = areaSubs.filter(s => s.grade);
            const pct = submissions.length > 0 ? Math.round(areaSubs.length / submissions.length * 100) : 0;
            return (
              <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{area.icon}</span>
                {!isMobile && <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600, minWidth: 180 }}>{area.name}</span>}
                <div style={{ flex: 1, height: 20, borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, width: pct + '%', background: area.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)', minWidth: 50, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {areaSubs.length} ({areaGraded.length})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================
// BULK UPLOAD MODAL
// =============================================
const BulkUploadModal = ({ open, onClose }) => {
  const accounts = useStore(s => s.accounts);
  const [step, setStep] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [importCount, setImportCount] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef();
  const isMobile = useMobile();

  const nrm = (str) => str.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!jsonRows.length) { alert('El archivo está vacío.'); return; }

        const parsed = jsonRows.map(row => {
          const n = {};
          Object.keys(row).forEach(k => { n[nrm(k)] = row[k]; });
          return {
            nombre: (n['nombre'] || n['name'] || '').toString().trim(),
            email: (n['email'] || n['correo'] || '').toString().trim().toLowerCase(),
            contrasena: (n['contrasena'] || n['password'] || n['pass'] || n['clave'] || '').toString().trim(),
            rol: (n['rol'] || n['role'] || 'student').toString().trim().toLowerCase(),
            area: (n['area'] || n['area de formacion'] || '').toString().trim().toLowerCase(),
            institucion: (n['institucion'] || n['colegio'] || n['institucion educativa'] || '').toString().trim(),
          };
        }).filter(r => r.nombre || r.email);

        const seenEmails = new Set(accounts.map(a => a.email));
        const processed = parsed.map((row, i) => {
          const roleNorm = row.rol === 'estudiante' ? 'student' : row.rol;
          const role = ['student', 'instructor'].includes(roleNorm) ? roleNorm : 'student';
          const areaMatch = AREAS.find(a => a.id === row.area || nrm(a.name) === nrm(row.area));
          const area = areaMatch?.id || null;
          const errors = [];
          if (!row.nombre) errors.push('Nombre requerido');
          if (!row.email || !row.email.includes('@')) errors.push('Email inválido');
          else if (seenEmails.has(row.email)) errors.push('Email ya existe');
          if (!row.contrasena || row.contrasena.length < 4) errors.push('Contraseña mínimo 4 caracteres');
          if (role === 'student' && !area) errors.push('Área inválida');
          if (!errors.some(er => er.includes('Email')) && row.email) seenEmails.add(row.email);
          return { ...row, _i: i + 1, _errors: errors, _valid: errors.length === 0, _role: role, _area: area };
        });
        setRows(processed);
        setStep(2);
      } catch (err) { alert('Error al leer el archivo. Verifica que sea Excel o CSV válido.'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nombre', 'Email', 'Contraseña', 'Rol', 'Área', 'Institución'],
      ['María García', 'maria@colegio.com', 'pass1234', 'student', 'lectura', 'IED San Francisco'],
      ['Carlos Ruiz', 'carlos@colegio.com', 'pass1234', 'student', 'matematicas', 'Liceo Los Andes'],
      ['Ana López', 'ana@colegio.com', 'pass1234', 'instructor', '', 'IED San Francisco'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'plantilla_usuarios_experia.xlsx');
  };

  const handleImport = () => {
    const valid = rows.filter(r => r._valid);
    bulkCreateAccounts(valid.map(r => ({ name: r.nombre, email: r.email, pass: r.contrasena, role: r._role, area: r._area, institution: r.institucion })));
    setImportCount(valid.length);
    setStep(3);
  };

  const handleClose = () => {
    setStep(1); setRows([]); setImportCount(0); setDragOver(false);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const validRows = rows.filter(r => r._valid);
  const invalidRows = rows.filter(r => !r._valid);

  return (
    <Modal open={open} onClose={handleClose} title="Carga Masiva de Usuarios" width={700}>
      {/* Steps indicator */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
        {['Subir archivo','Revisar datos','Completado'].map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, background: step >= i+1 ? 'var(--gradient)' : 'var(--bg-alt)',
                color: step >= i+1 ? '#fff' : 'var(--muted)' }}>{i+1}</div>
              <span style={{ fontSize:10, fontWeight:600, color: step >= i+1 ? 'var(--orange)' : 'var(--subtle)', whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:2, background: step > i+1 ? 'var(--orange)' : 'var(--border)', margin:'0 6px 18px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:8 }}>Columnas requeridas en el archivo:</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {['Nombre','Email','Contraseña','Rol','Área','Institución'].map(col => (
                <span key={col} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6,
                  background:'var(--white)', border:'1px solid var(--border)', color:'var(--purple-deep)' }}>{col}</span>
              ))}
            </div>
            <p style={{ fontSize:12, color:'var(--subtle)', lineHeight:1.5 }}>
              <strong>Rol:</strong> student · instructor &nbsp;|&nbsp; <strong>Área:</strong> lectura · ciudadanas · ingles · matematicas · ciencias
            </p>
          </div>
          <button onClick={downloadTemplate}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10,
              border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text-sec)',
              fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:20, transition:'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            📥 Descargar plantilla Excel
          </button>
          <label style={{ display:'block', cursor:'pointer' }}>
            <div style={{ padding:'36px 24px', borderRadius:14, textAlign:'center', transition:'all .2s', cursor:'pointer',
              border: `2px dashed ${dragOver ? 'var(--orange)' : 'var(--border)'}`,
              background: dragOver ? 'var(--orange-bg)' : 'var(--bg)' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) processFile(f); }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
              <p style={{ fontSize:14, fontWeight:700, color:'var(--dark)', marginBottom:4 }}>
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p style={{ fontSize:12, color:'var(--muted)' }}>Soporta .xlsx, .xls y .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={e => { const f = e.target.files[0]; if(f) processFile(f); }}
              style={{ display:'none' }} />
          </label>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <div style={{ flex:1, padding:'12px 16px', borderRadius:10, background:'#D1FAE5', border:'1px solid #6EE7B7' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--success)' }}>{validRows.length}</div>
              <div style={{ fontSize:12, color:'var(--success)', fontWeight:600 }}>Válidos — se crearán</div>
            </div>
            <div style={{ flex:1, padding:'12px 16px', borderRadius:10,
              background: invalidRows.length > 0 ? '#FEE2E2' : 'var(--bg)',
              border: `1px solid ${invalidRows.length > 0 ? '#FCA5A5' : 'var(--border)'}` }}>
              <div style={{ fontSize:22, fontWeight:800, color: invalidRows.length > 0 ? 'var(--error)' : 'var(--subtle)' }}>{invalidRows.length}</div>
              <div style={{ fontSize:12, color: invalidRows.length > 0 ? 'var(--error)' : 'var(--subtle)', fontWeight:600 }}>Con errores — se omitirán</div>
            </div>
          </div>

          <div style={{ maxHeight:280, overflow:'auto', borderRadius:10, border:'1px solid var(--border)', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)', position:'sticky', top:0 }}>
                  {['#','Nombre','Email','Rol','Área','Institución','Estado'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'var(--muted)',
                      textAlign:'left', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap',
                      textTransform:'uppercase', letterSpacing:.7 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const area = AREAS.find(a => a.id === row._area);
                  return (
                    <tr key={row._i} style={{ borderBottom:'1px solid var(--border)', background: row._valid ? 'transparent' : '#FFF5F5' }}>
                      <td style={{ padding:'7px 10px', color:'var(--subtle)' }}>{row._i}</td>
                      <td style={{ padding:'7px 10px', fontWeight:600, color:'var(--dark)' }}>{row.nombre||'—'}</td>
                      <td style={{ padding:'7px 10px', color:'var(--muted)', fontSize:11 }}>{row.email||'—'}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ padding:'2px 7px', borderRadius:4, fontWeight:700, fontSize:10,
                          background: row._role === 'student' ? 'var(--orange-bg)' : '#D1FAE5',
                          color: row._role === 'student' ? 'var(--orange)' : 'var(--success)' }}>
                          {row._role === 'student' ? 'Estudiante' : 'Instructor'}
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px', color: area ? area.color : 'var(--subtle)', fontWeight:500 }}>
                        {area ? `${area.icon} ${isMobile ? '' : area.name}` : '—'}
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--muted)', fontSize:11 }}>{row.institucion||'—'}</td>
                      <td style={{ padding:'7px 10px' }}>
                        {row._valid
                          ? <span style={{ fontSize:10, fontWeight:700, color:'var(--success)', background:'#D1FAE5', padding:'2px 7px', borderRadius:4 }}>✓ OK</span>
                          : <span title={row._errors.join('\n')} style={{ fontSize:10, fontWeight:700, color:'var(--error)', background:'#FEE2E2', padding:'2px 7px', borderRadius:4, cursor:'help', whiteSpace:'nowrap' }}>✗ Error</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 && (
            <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'#FFFBEB', border:'1px solid #FDE68A' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--warn)', marginBottom:6 }}>Errores encontrados:</p>
              {invalidRows.slice(0,3).map(row => (
                <p key={row._i} style={{ fontSize:11, color:'var(--text-sec)', lineHeight:1.5 }}>
                  <strong>Fila {row._i}:</strong> {row._errors.join(' · ')}
                </p>
              ))}
              {invalidRows.length > 3 && <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>…y {invalidRows.length - 3} más.</p>}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep(1); setRows([]); if(fileRef.current) fileRef.current.value=''; }}
              style={{ padding:'10px 18px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--white)',
                color:'var(--text-sec)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cambiar archivo
            </button>
            <Btn variant="gradient" full disabled={validRows.length === 0} onClick={handleImport}>
              Importar {validRows.length} usuario{validRows.length !== 1 ? 's' : ''}
            </Btn>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div style={{ textAlign:'center', padding:'24px 0' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h3 style={{ fontSize:22, fontWeight:800, color:'var(--dark)', marginBottom:8 }}>¡Importación exitosa!</h3>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:28, lineHeight:1.6 }}>
            Se crearon <strong style={{ color:'var(--orange)' }}>{importCount} usuarios</strong> en la plataforma.
          </p>
          <Btn variant="gradient" onClick={handleClose}>Listo</Btn>
        </div>
      )}
    </Modal>
  );
};

// =============================================
// SCHOOLS ADMIN PAGE
// =============================================
const SchoolsAdminPage = () => {
  const institutions = useStore(s => s.institutions || INITIAL_INSTITUTIONS);
  const accounts = useStore(s => s.accounts);
  const isMobile = useMobile();
  const [search, setSearch] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  const studentsByInst = React.useMemo(() => {
    const map = {};
    accounts.filter(a => a.role === 'student').forEach(a => {
      if (a.institution) map[a.institution] = (map[a.institution] || 0) + 1;
    });
    return map;
  }, [accounts]);

  const totalStudents = React.useMemo(() => accounts.filter(a => a.role === 'student').length, [accounts]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return institutions.filter(i => !q || i.name.toLowerCase().includes(q));
  }, [institutions, search]);

  const inputSt = (hasErr) => ({
    width:'100%', padding:'10px 14px', borderRadius:10, boxSizing:'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)',
  });

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNameError('Nombre requerido'); return; }
    if (institutions.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Ya existe una institución con ese nombre'); return;
    }
    createInstitution(trimmed);
    setNewName(''); setNameError(''); setShowCreate(false);
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateInstitution(editId, editName.trim());
    setEditId(null); setEditName('');
  };

  return (
    <div style={{ height:'100%', overflow:'auto', WebkitOverflowScrolling:'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'var(--dark)', marginBottom:4 }}>Gestión de Colegios</h2>
        <p style={{ fontSize:14, color:'var(--muted)' }}>Administra las instituciones educativas de la plataforma</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Colegios registrados', value:institutions.length, color:'var(--purple)' },
          { label:'Docentes registrados', value:totalStudents, color:'var(--orange)' },
        ].map((s,i) => (
          <div key={i} style={{ padding:'14px 18px', borderRadius:14, background:'var(--white)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + create */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:'1 1 200px', position:'relative', minWidth:180 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar institución..."
            style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:10, border:'1.5px solid var(--border)',
              fontFamily:'var(--font)', fontSize:13, outline:'none', boxSizing:'border-box', background:'var(--white)', transition:'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <Btn variant="gradient" onClick={() => setShowCreate(true)}>
          <PlusIc s={16} c="#fff" /> Nueva institución
        </Btn>
      </div>

      {/* Institution list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:14,
            background:'var(--white)', borderRadius:14, border:'1px solid var(--border)' }}>
            {search ? 'No se encontraron instituciones.' : 'No hay instituciones registradas. Crea la primera.'}
          </div>
        )}
        {filtered.map(inst => {
          const count = studentsByInst[inst.name] || 0;
          return (
            <div key={inst.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px',
              borderRadius:14, background:'var(--white)', border:'1px solid var(--border)', transition:'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-sm)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ width:46, height:46, borderRadius:12, background:'var(--purple-bg)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                🏫
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--dark)', marginBottom:2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inst.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>
                  {count} docente{count !== 1 ? 's' : ''} registrado{count !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => { setEditId(inst.id); setEditName(inst.name); }}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:8,
                    border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text-sec)',
                    cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                  <EditIc s={13} c="var(--muted)" />{isMobile ? '' : ' Editar'}
                </button>
                <button onClick={() => setDeleteConfirm(inst)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:8,
                    border:'1.5px solid var(--error)', background:'none', color:'var(--error)',
                    cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                  <TrashIc s={13} c="var(--error)" />{isMobile ? '' : ' Eliminar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewName(''); setNameError(''); }} title="Nueva institución educativa" width={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Nombre de la institución
            </label>
            <input value={newName} onChange={e => { setNewName(e.target.value); setNameError(''); }}
              placeholder="Ej: IED San Francisco" style={inputSt(!!nameError)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            {nameError && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{nameError}</p>}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setShowCreate(false); setNewName(''); setNameError(''); }}>Cancelar</Btn>
            <Btn variant="gradient" full onClick={handleCreate}>Crear institución</Btn>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editId} onClose={() => { setEditId(null); setEditName(''); }} title="Editar institución" width={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Nombre de la institución
            </label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Nombre de la institución" style={inputSt(false)}
              onKeyDown={e => e.key === 'Enter' && handleEditSave()} autoFocus />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setEditId(null); setEditName(''); }}>Cancelar</Btn>
            <Btn variant="gradient" full disabled={!editName.trim()} onClick={handleEditSave}>Guardar cambios</Btn>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar institución" width={400}>
        {deleteConfirm && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <p style={{ fontSize:14, color:'var(--text-sec)', lineHeight:1.6, marginBottom:8 }}>
              ¿Eliminar <strong>{deleteConfirm.name}</strong>?
            </p>
            {(studentsByInst[deleteConfirm.name] || 0) > 0 && (
              <div style={{ fontSize:12, color:'#92400E', padding:'10px 14px', borderRadius:10,
                background:'#FEF3C7', border:'1px solid #FDE68A', marginBottom:12, textAlign:'left' }}>
                ⚠️ Hay <strong>{studentsByInst[deleteConfirm.name]}</strong> docente(s) asociados. Sus cuentas <strong>no</strong> se eliminarán.
              </div>
            )}
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" full onClick={() => setDeleteConfirm(null)}>Cancelar</Btn>
              <Btn variant="danger" full onClick={() => { deleteInstitution(deleteConfirm.id); setDeleteConfirm(null); }}>Eliminar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// =============================================
// ADMIN PANEL
// =============================================
// ---- Instructor Assignment Panel ----
const InstructorAssignmentPanel = () => {
  const accounts              = useStore(s => s.accounts);
  const institutions          = useStore(s => s.institutions || []);
  const instructorInstitutions = useStore(s => s.instructorInstitutions || []);
  const namedRoutes           = useStore(s => s.namedRoutes || []);

  const instructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor'), [accounts]);

  const [selectedInstructor, setSelectedInstructor] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const assignedIds = React.useMemo(() =>
    instructorInstitutions.filter(ii => ii.instructor_id === selectedInstructor).map(ii => ii.institution_id),
    [instructorInstitutions, selectedInstructor]
  );

  const toggleInstitution = async (instId) => {
    if (!selectedInstructor) return;
    setSaving(true);
    if (assignedIds.includes(instId)) {
      await removeInstructorInstitution(selectedInstructor, instId);
    } else {
      await assignInstructorInstitution(selectedInstructor, instId);
    }
    setSaving(false);
  };

  const inputSt = { width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--border)', fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)', boxSizing:'border-box' };

  return (
    <div style={{ padding:'20px 24px', borderRadius:16, background:'var(--white)', border:'1px solid var(--border)', marginBottom:24 }}>
      <h3 style={{ fontSize:16, fontWeight:800, color:'var(--dark)', marginBottom:4 }}>🏫 Asignación de Instructores a Colegios</h3>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>Define qué colegios puede gestionar cada instructor.</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
        {/* Selector instructor */}
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Instructor</label>
          <select value={selectedInstructor} onChange={e => setSelectedInstructor(e.target.value)} style={inputSt}>
            <option value="">— Selecciona un instructor —</option>
            {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>)}
          </select>
          {selectedInstructor && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--dark)', marginBottom:8 }}>Colegios asignados:</div>
              {institutions.length === 0 && <p style={{ fontSize:12, color:'var(--muted)' }}>No hay colegios registrados.</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {institutions.map(inst => {
                  const checked = assignedIds.includes(inst.id);
                  return (
                    <label key={inst.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10,
                      border: checked ? '1.5px solid var(--success)' : '1px solid var(--border)',
                      background: checked ? '#F0FDF4' : 'var(--bg)', cursor:'pointer', transition:'all .15s' }}>
                      <input type="checkbox" checked={checked} disabled={saving} onChange={() => toggleInstitution(inst.id)}
                        style={{ accentColor:'var(--success)', width:16, height:16 }} />
                      <span style={{ fontSize:13, fontWeight: checked ? 600 : 400, color:'var(--dark)' }}>{inst.name}</span>
                      {checked && <CheckIc s={14} c="var(--success)" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Resumen por instructor */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Resumen</div>
          {instructors.length === 0 && <p style={{ fontSize:12, color:'var(--muted)' }}>No hay instructores.</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {instructors.map(instr => {
              const ids = instructorInstitutions.filter(ii => ii.instructor_id === instr.id).map(ii => ii.institution_id);
              const names = ids.map(id => institutions.find(i => i.id === id)?.name).filter(Boolean);
              return (
                <div key={instr.id} style={{ padding:'10px 14px', borderRadius:10, background:'var(--bg-alt)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:3 }}>{instr.name}</div>
                  {names.length === 0
                    ? <span style={{ fontSize:11, color:'var(--subtle)' }}>Sin colegios asignados</span>
                    : <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {names.map(n => <span key={n} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'#D1FAE5', color:'var(--success)', fontWeight:600 }}>{n}</span>)}
                      </div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rutas por colegio */}
      {namedRoutes.length > 0 && (
        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:'var(--dark)', marginBottom:12 }}>📚 Rutas de formación guardadas</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {namedRoutes.map(route => {
              const area = AREAS.find(a => a.id === route.area);
              const inst = institutions.find(i => i.id === route.institution_id);
              return (
                <div key={route.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderRadius:10, background:'var(--bg-alt)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:18 }}>{area?.icon || '📖'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)' }}>{route.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{area?.name || route.area}</div>
                  </div>
                  <select defaultValue={route.institution_id || ''}
                    onChange={async e => { await assignRouteToInstitution(route.id, e.target.value || null); }}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:12, outline:'none', background:'var(--white)' }}>
                    <option value="">— Sin colegio —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  {inst && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600 }}>{inst.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPage = () => {
  const accounts = useStore(s => s.accounts);
  const institutions = useStore(s => s.institutions || INITIAL_INSTITUTIONS);
  const isMobile = useMobile();

  // --- Create form ---
  const [showCreate, setShowCreate] = React.useState(false);
  const [showBulk, setShowBulk] = React.useState(false);
  const [form, setForm] = React.useState({ name:'', email:'', pass:'', role:'student', area:'', institution:'' });
  const [errors, setErrors] = React.useState({});
  const [created, setCreated] = React.useState(false);

  // --- Recordatorios ---
  const [sendingReminders, setSendingReminders] = React.useState(false);
  const [reminderResult, setReminderResult] = React.useState(null);
  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-reminders', {});
      if (error) setReminderResult({ ok: false, msg: error.message });
      else setReminderResult({ ok: true, msg: `✅ ${data?.sent ?? 0} recordatorio${data?.sent !== 1 ? 's' : ''} enviado${data?.sent !== 1 ? 's' : ''} de ${data?.total ?? 0} docentes inactivos` });
    } catch (e) {
      setReminderResult({ ok: false, msg: e.message });
    }
    setSendingReminders(false);
    setTimeout(() => setReminderResult(null), 6000);
  };

  // --- Delete ---
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  // --- Reset progress ---
  const [resetConfirm, setResetConfirm] = React.useState(null);
  const [resetting, setResetting] = React.useState(false);
  const handleResetProgress = async () => {
    if (!resetConfirm) return;
    setResetting(true);
    await resetStudentProgress(resetConfirm.id, resetConfirm.email);
    setResetting(false);
    setResetConfirm(null);
  };

  // --- Edit area ---
  const [editAreaEmail, setEditAreaEmail] = React.useState(null);
  const [editAreaValue, setEditAreaValue] = React.useState('');

  // --- Filter / Search ---
  const [search, setSearch] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('all');

  const roleColor = { student:'var(--orange)', instructor:'var(--success)', admin:'var(--purple)' };
  const roleLabel = { student:'Estudiante', instructor:'Instructor', admin:'Admin' };
  const roleBg    = { student:'var(--orange-bg)', instructor:'#D1FAE5', admin:'var(--purple-bg)' };

  // Filtered + searched accounts
  const visibleAccounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(a => {
      if (filterRole !== 'all' && a.role !== filterRole) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.institution || '').toLowerCase().includes(q)
      );
    });
  }, [accounts, filterRole, search]);

  const students    = React.useMemo(() => accounts.filter(a => a.role === 'student'), [accounts]);
  const instructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor'), [accounts]);

  const inputSt = (hasErr) => ({
    width:'100%', padding:'10px 14px', borderRadius:10, boxSizing:'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)',
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email inválido';
    if (accounts.some(a => a.email === form.email.trim())) e.email = 'Este email ya existe';
    if (!form.pass || form.pass.length < 4) e.pass = 'Mínimo 4 caracteres';
    if (form.role === 'student' && !form.institution) e.institution = 'La institución es obligatoria para estudiantes';
    if (form.role === 'student' && !form.area) e.area = 'El área es obligatoria para estudiantes';
    return e;
  };

  const handleCreate = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    createAccount(form.name.trim(), form.email.trim(), form.pass, form.role, form.area || null, form.institution.trim() || '');
    setCreated(true);
    setTimeout(() => setCreated(false), 2500);
    setShowCreate(false);
    setForm({ name:'', email:'', pass:'', role:'student', area:'', institution:'' });
    setErrors({});
  };

  const handleEditArea = () => {
    if (!editAreaEmail || !editAreaValue) return;
    changeAccountArea(editAreaEmail, editAreaValue);
    setEditAreaEmail(null);
    setEditAreaValue('');
  };

  const openEditArea = (acc) => {
    setEditAreaEmail(acc.email);
    setEditAreaValue(acc.area || '');
  };

  return (
    <div style={{ height:'100%', overflow:'auto', WebkitOverflowScrolling:'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'var(--dark)', marginBottom:4 }}>Gestión de Usuarios</h2>
          <p style={{ fontSize:14, color:'var(--muted)' }}>Crea, busca y administra cuentas de la plataforma</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          <button onClick={handleSendReminders} disabled={sendingReminders}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10,
              border:'1.5px solid var(--purple)', background: sendingReminders ? 'var(--purple-bg)' : 'var(--white)',
              color:'var(--purple)', fontFamily:'var(--font)', fontSize:13, fontWeight:600,
              cursor: sendingReminders ? 'not-allowed' : 'pointer', transition:'all .2s', opacity: sendingReminders ? .7 : 1 }}>
            {sendingReminders ? '⏳ Enviando...' : '📧 Enviar recordatorios'}
          </button>
          {reminderResult && (
            <div style={{ fontSize:12, fontWeight:600, padding:'6px 12px', borderRadius:8, maxWidth:280, textAlign:'right',
              background: reminderResult.ok ? '#D1FAE5' : '#FEE2E2',
              color: reminderResult.ok ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${reminderResult.ok ? '#6EE7B7' : '#FCA5A5'}` }}>
              {reminderResult.msg}
            </div>
          )}
        </div>
      </div>

      {created && (
        <div style={{ padding:'12px 18px', borderRadius:12, background:'#D1FAE5', border:'1px solid #6EE7B7',
          marginBottom:16, display:'flex', alignItems:'center', gap:10, animation:'fadeUp .3s ease' }}>
          <CheckIc s={18} c="var(--success)" />
          <span style={{ fontSize:14, fontWeight:600, color:'var(--success)' }}>Cuenta creada exitosamente</span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Estudiantes',  value:students.length,    color:'var(--orange)' },
          { label:'Instructores', value:instructors.length, color:'var(--success)' },
          { label:'Total cuentas',value:accounts.length,    color:'var(--purple)' },
        ].map((s,i) => (
          <div key={i} style={{ padding:'14px 18px', borderRadius:14, background:'var(--white)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter row */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ flex:'1 1 200px', position:'relative', minWidth:180 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o institución..."
            style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:10, border:'1.5px solid var(--border)',
              fontFamily:'var(--font)', fontSize:13, outline:'none', boxSizing:'border-box',
              background:'var(--white)', transition:'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {/* Role filter */}
        <div style={{ display:'flex', gap:6 }}>
          {[
            { key:'all',        label:`Todos (${accounts.length})` },
            { key:'student',    label:`Estudiantes (${students.length})` },
            { key:'instructor', label:`Instructores (${instructors.length})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterRole(f.key)}
              style={{ padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer',
                fontFamily:'var(--font)', fontSize:12, fontWeight:600, whiteSpace:'nowrap',
                background: filterRole === f.key ? 'var(--dark)' : 'var(--bg-alt)',
                color: filterRole === f.key ? '#fff' : 'var(--muted)', transition:'all .2s' }}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Action buttons */}
        <Btn variant="secondary" onClick={() => setShowBulk(true)}>
          <UploadIc s={16} c="var(--text-sec)" /> Carga masiva
        </Btn>
        <Btn variant="gradient" onClick={() => setShowCreate(true)}>
          <PlusIc s={16} c="#fff" /> Nueva cuenta
        </Btn>
      </div>

      {/* Accounts table */}
      <div style={{ borderRadius:14, border:'1px solid var(--border)', background:'var(--white)',
        overflow:'hidden', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
          <thead>
            <tr style={{ background:'var(--bg-alt)' }}>
              {['Usuario','Email','Institución','Rol','Área','Acciones'].map(h => (
                <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'var(--muted)',
                  textTransform:'uppercase', letterSpacing:.8, textAlign:'left',
                  borderBottom:'1.5px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleAccounts.length === 0 && (
              <tr><td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'var(--muted)', fontSize:14 }}>
                No se encontraron cuentas con ese criterio.
              </td></tr>
            )}
            {visibleAccounts.map(acc => {
              const area = AREAS.find(a => a.id === acc.area);
              const isAdmin = acc.role === 'admin';
              const isStudent = acc.role === 'student';
              return (
                <tr key={acc.email} style={{ borderBottom:'1px solid var(--border)', transition:'background .15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0,
                        background: roleBg[acc.role], display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, color: roleColor[acc.role] }}>{acc.avatar}</div>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>{acc.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'var(--muted)' }}>{acc.email}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'var(--purple-deep)', fontWeight:500 }}>
                    {acc.institution ? `🏫 ${acc.institution}` : <span style={{ color:'var(--subtle)' }}>—</span>}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6,
                      background: roleBg[acc.role], color: roleColor[acc.role], whiteSpace:'nowrap' }}>
                      {roleLabel[acc.role]}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {area ? (
                      <span style={{ fontSize:12, color: area.color, fontWeight:600, whiteSpace:'nowrap' }}>
                        {area.icon} {area.name}
                      </span>
                    ) : (
                      <span style={{ fontSize:12, color:'var(--subtle)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {isAdmin ? (
                      <span style={{ fontSize:11, color:'var(--subtle)' }}>—</span>
                    ) : (
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {isStudent && (
                          <button onClick={() => openEditArea(acc)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8,
                              border:'1.5px solid var(--orange)', background:'var(--orange-bg)', color:'var(--orange)',
                              cursor:'pointer', fontFamily:'var(--font)', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                            <EditIc s={12} c="var(--orange)" /> Área
                          </button>
                        )}
                        {isStudent && (
                          <button onClick={() => setResetConfirm(acc)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8,
                              border:'1.5px solid var(--purple)', background:'var(--purple-bg)', color:'var(--purple)',
                              cursor:'pointer', fontFamily:'var(--font)', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                            🔄 Progreso
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm(acc.email)}
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8,
                            border:'1.5px solid var(--error)', background:'none', color:'var(--error)',
                            cursor:'pointer', fontFamily:'var(--font)', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                          <TrashIc s={12} c="var(--error)" /> Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }} title="Crear nueva cuenta" width={480}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Nombre completo</label>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder="Ej: María García" style={inputSt(errors.name)} />
            {errors.name && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.name}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Correo electrónico</label>
            <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
              placeholder="usuario@ceinfes.com" type="email" style={inputSt(errors.email)} />
            {errors.email && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.email}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Contraseña</label>
            <input value={form.pass} onChange={e => setForm(f=>({...f,pass:e.target.value}))}
              placeholder="Mínimo 4 caracteres" style={inputSt(errors.pass)} />
            {errors.pass && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.pass}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Rol</label>
            <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value,area:'',institution:''}))}
              style={inputSt(false)}>
              <option value="student">Estudiante</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Institución educativa{form.role === 'student' && <span style={{ color:'var(--error)' }}> *</span>}
            </label>
            {institutions.length === 0 ? (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A',
                fontSize:13, color:'#92400E', lineHeight:1.5 }}>
                ⚠️ No hay instituciones registradas. Ve a <strong>Colegios</strong> y crea una institución primero.
              </div>
            ) : (
              <select value={form.institution} onChange={e => setForm(f=>({...f,institution:e.target.value}))}
                style={inputSt(!!errors.institution)}>
                <option value="">— Seleccionar institución —</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            )}
            {errors.institution && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.institution}</p>}
          </div>
          {form.role === 'student' && (
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
                Área de formación <span style={{ color:'var(--error)' }}>*</span>
              </label>
              <select value={form.area} onChange={e => setForm(f=>({...f,area:e.target.value}))}
                style={inputSt(errors.area)}>
                <option value="">— Seleccionar área —</option>
                {AREAS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
              {errors.area && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.area}</p>}
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setShowCreate(false); setErrors({}); }}>Cancelar</Btn>
            <Btn variant="gradient" full
              disabled={form.role === 'student' && institutions.length === 0}
              onClick={handleCreate}>Crear cuenta</Btn>
          </div>
        </div>
      </Modal>

      {/* Edit area modal */}
      <Modal open={!!editAreaEmail} onClose={() => setEditAreaEmail(null)} title="Cambiar área del estudiante" width={420}>
        {editAreaEmail && (() => {
          const acc = accounts.find(a => a.email === editAreaEmail);
          return acc ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10,
                background:'var(--bg-alt)', marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--orange-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'var(--orange)' }}>
                  {acc.avatar}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--dark)' }}>{acc.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{acc.email}</div>
                </div>
              </div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:10 }}>
                Selecciona la nueva área de formación:
              </label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                {AREAS.map(a => {
                  const isCurrent = a.id === (editAreaValue || acc.area);
                  return (
                    <button key={a.id} onClick={() => setEditAreaValue(a.id)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12,
                        border: isCurrent ? `2px solid ${a.color}` : '1.5px solid var(--border)',
                        background: isCurrent ? a.bg : 'var(--white)', cursor:'pointer',
                        fontFamily:'var(--font)', transition:'all .2s', textAlign:'left' }}
                      onMouseEnter={e => !isCurrent && (e.currentTarget.style.borderColor = a.color)}
                      onMouseLeave={e => !isCurrent && (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <span style={{ fontSize:22 }}>{a.icon}</span>
                      <span style={{ fontSize:14, fontWeight:600, color: isCurrent ? a.color : 'var(--dark)', flex:1 }}>{a.name}</span>
                      {isCurrent && <CheckIc s={16} c={a.color} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <Btn variant="secondary" full onClick={() => setEditAreaEmail(null)}>Cancelar</Btn>
                <Btn variant="gradient" full disabled={!editAreaValue || editAreaValue === acc.area} onClick={handleEditArea}>
                  Guardar cambio
                </Btn>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar cuenta" width={400}>
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <p style={{ fontSize:14, color:'var(--text-sec)', marginBottom:8, lineHeight:1.6 }}>
            ¿Eliminar la cuenta de <strong>{deleteConfirm}</strong>?
          </p>
          <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Esta acción no se puede deshacer.</p>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" full onClick={() => setDeleteConfirm(null)}>Cancelar</Btn>
            <Btn variant="danger" full onClick={() => { deleteAccount(deleteConfirm); setDeleteConfirm(null); }}>
              Eliminar
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Reset progress modal */}
      <Modal open={!!resetConfirm} onClose={() => setResetConfirm(null)} title="Resetear progreso" width={420}>
        {resetConfirm && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>🔄</div>
            <p style={{ fontSize:14, color:'var(--text-sec)', marginBottom:8, lineHeight:1.6 }}>
              ¿Resetear todo el progreso de <strong>{resetConfirm.name}</strong>?
            </p>
            <div style={{ padding:'12px 16px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A', marginBottom:16, textAlign:'left' }}>
              <p style={{ fontSize:12, color:'#92400E', lineHeight:1.6, margin:0 }}>
                ⚠️ Se eliminarán sus <strong>módulos completados</strong>, <strong>XP</strong>, <strong>insignias</strong>, <strong>entregas</strong> e <strong>intentos de retos</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" full onClick={() => setResetConfirm(null)}>Cancelar</Btn>
              <Btn variant="danger" full disabled={resetting} onClick={handleResetProgress}>
                {resetting ? '⏳ Reseteando...' : 'Resetear progreso'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      <BulkUploadModal open={showBulk} onClose={() => setShowBulk(false)} />

      <InstructorAssignmentPanel />
    </div>
  );
};

// ---- Main App ----
const App = () => {
  const page = useStore(s => s.page);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const nodeId = useStore(s => s.nodeId);
  const user = useStore(s => s.user);
  const selectedArea = useStore(s => s.selectedArea);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [studentView, setStudentView] = React.useState(null);

  // Close mobile sidebar on page change
  React.useEffect(() => { setMobileSidebarOpen(false); }, [page]);

  if (page === 'landing' && !isLoggedIn) return <React.Suspense fallback={null}><LandingPage /></React.Suspense>;
  if (page === 'login'   && !isLoggedIn) return <React.Suspense fallback={null}><LoginPage /></React.Suspense>;
  if (!isLoggedIn) { setTimeout(() => nav('landing'), 0); return null; }

  const role = user?.role;
  if (role === 'student' && !selectedArea) return <AreaSelection />;

  const fullPages = ['lesson', 'challenge'];
  const isFullPage = fullPages.includes(page);

  const renderPage = () => {
    if (role === 'admin') {
      switch (page) {
        case 'admin-dashboard':  return <AdminPage />;
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
