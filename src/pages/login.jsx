import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { XS, nav, loadSessionCatalogs, loadInstructorInstitutions, applyInitialHash, getAccessBlockReason } from '../store/store.jsx'
import { loadStaffData, loadStudentData } from '../lib/sessionData.js'
import {
  useMobile, LogoImg, LockIc, ArrowRIc, ArrowLIc, CheckIc, XIc, Btn,
} from '../components/ui.jsx'
// =============================================
// EXPERIA — Login Page
// =============================================

const LoginPage = () => {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const isMobile = useMobile();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !pass) { setError('Completa todos los campos'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setError('Correo o contraseña incorrectos'); setLoading(false); return; }

      const { data: profile, error: profErr } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profErr || !profile) { setError('No se encontró el perfil. Contacta al admin.'); setLoading(false); return; }

      // Bloqueo de acceso: cuenta o institución desactivada por el admin.
      const blockReason = await getAccessBlockReason(profile);
      if (blockReason) { await supabase.auth.signOut(); setError(blockReason); setLoading(false); return; }

      let page = 'map';
      if (profile.role === 'instructor') page = 'instructor-dashboard';
      if (profile.role === 'admin')      page = 'admin-dashboard';

      let xp = 0, completed = [], badges = [];
      let enrolledCourseId = null, effectiveCourseId = null, courseModules = [], allEnrollments = [], unlockedPresenceModules = [], quizAttempts = [];
      let accounts = [], submissions = [], challengeAttempts = [];
      let institutions = [], cohorts = [];

      if (profile.role === 'student') {
        const sd = await loadStudentData(data.user.id, profile);
        xp             = sd.xp;
        completed      = sd.completed;
        badges         = sd.badges;
        enrolledCourseId = sd.enrolledCourseId;
        effectiveCourseId = sd.effectiveCourseId;
        courseModules  = sd.courseModules;
        allEnrollments = sd.allEnrollments;
        unlockedPresenceModules = sd.unlockedPresenceModules || [];
        quizAttempts      = sd.quizAttempts || [];
        submissions       = sd.submissions;
        challengeAttempts = sd.challengeAttempts;
      }

      if (profile.role === 'admin' || profile.role === 'instructor') {
        const [{ data: institutionsData }, { data: cohortsData }] = await Promise.all([
          supabase.from('institutions').select('*').order('name'),
          supabase.from('cohorts').select('*').order('created_at'),
        ]);
        institutions = institutionsData || [];
        cohorts      = cohortsData      || [];
        const staff = await loadStaffData(profile, institutions);
        accounts          = staff.accounts;
        submissions       = staff.submissions;
        challengeAttempts = staff.challengeAttempts;
      }

      // Cargas comunes (rutas, cursos, accesos, taller) — compartidas con la
      // restauración de sesión de main.jsx vía loadSessionCatalogs.
      loadSessionCatalogs();
      if (profile.role === 'instructor') loadInstructorInstitutions();

      XS.set({
        isLoggedIn: true,
        user: { id: data.user.id, name: profile.name, email: profile.email, avatar: profile.avatar, role: profile.role,
                // institution_id igual que en restoreSession (main.jsx): sin él,
                // switchCourse no resuelve la copia del colegio hasta recargar.
                institution_id: profile.institution_id || null,
                onboarded: profile.onboarded ?? true,
                onboardingBonus: profile.onboarding_bonus ?? true },
        page,
        xp, completed, badges,
        enrolledCourseId, effectiveCourseId, courseModules,
        allEnrollments: profile.role === 'student' ? allEnrollments : [],
        unlockedPresenceModules: profile.role === 'student' ? unlockedPresenceModules : [],
        quizAttempts: profile.role === 'student' ? quizAttempts : [],
        notifications: [], selectedArea: profile.area || null, nodeId: null,
        accounts, submissions, challengeAttempts,
        institutions, cohorts,
      });
      // Respeta el deep link si el usuario llegó con #/pagina en la URL
      applyInitialHash();
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'var(--font)',
    outline: 'none', transition: 'border-color .2s, box-shadow .2s', background: 'var(--white)',
  };
  const focusInput = e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 4px rgba(232,115,44,.12)'; };
  const blurInput  = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: isMobile ? 'auto' : 'hidden',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      {/* Left panel — decorative (hidden on mobile) */}
      {!isMobile && <div style={{
        flex: '0 0 45%', background: 'var(--gradient)', backgroundSize: '180% 180%',
        animation: 'gradientShift 18s ease infinite', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 60, overflow: 'hidden',
      }}>
        {/* Patrón de puntos sutil */}
        <div style={{ position: 'absolute', inset: 0, opacity: .35,
          backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px' }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280,
          borderRadius: '50%', background: 'rgba(255,255,255,.06)', animation: 'heroFloat 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,.05)', animation: 'heroFloat 11s ease-in-out infinite 3s' }} />
        <div style={{ position: 'absolute', top: '30%', right: '20%', width: 100, height: 100,
          borderRadius: 20, transform: 'rotate(25deg)', background: 'rgba(255,255,255,.04)',
          animation: 'heroFloat 7s ease-in-out infinite 1s' }} />

        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp .6s ease' }}>
          <div style={{ marginBottom: 48 }}>
            <LogoImg h={40} onDark={true} />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            Bienvenido a<br/>Experia
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.78)', lineHeight: 1.6, maxWidth: 360, marginBottom: 36 }}>
            Tu plataforma de formación en Diseño Centrado en Evidencias. Inicia sesión para continuar tu recorrido formativo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Rutas formativas gamificadas', 'Retos interactivos y certificación', 'Seguimiento de progreso en tiempo real'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10,
                animation: `fadeUp .5s ${300 + i * 110}ms var(--ease-out) both` }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIc s={12} c="#fff" />
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Mobile hero strip */}
      {isMobile && (
        <div style={{ background: 'var(--gradient)', padding: '32px 20px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <LogoImg h={34} onDark={true} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Bienvenido a Experia</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>Formación Docente en DCE</p>
        </div>
      )}

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
        padding: isMobile ? '24px 20px 40px' : 40, background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 430, animation: 'fadeUp .5s .15s ease both',
          background: 'var(--white)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)',
          boxShadow: 'var(--sh-lg)', padding: isMobile ? '24px 20px' : '36px 36px 32px' }}>
          <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Iniciar sesión</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: isMobile ? 20 : 28 }}>
            Ingresa tus credenciales para acceder a la plataforma
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Correo electrónico
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="docente@ceinfes.com" autoComplete="email"
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={pass}
                  onChange={e => setPass(e.target.value)} placeholder="••••••" autoComplete="current-password"
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={inputStyle} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font)' }}>
                  {showPass ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-sm)',
                background: 'var(--error-bg)', color: 'var(--error)', fontSize: 13, fontWeight: 500,
                animation: 'shake .4s ease',
              }}>{error}</div>
            )}

            <Btn variant="primary" size="lg" full disabled={loading}
              style={{ marginTop: 4 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} />
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </Btn>
          </form>

          <button onClick={() => nav('landing')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13, marginTop: 20,
              fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 4,
            }}>
            <ArrowLIc s={14} /> Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
