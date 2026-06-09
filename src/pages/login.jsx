import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { XS, nav } from '../store/store.jsx'
import { loadStudentSession } from '../lib/loadStudentSession.js'
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
      const progress = null; // Legacy fallback handled inside loadStudentSession

      let page = 'map';
      if (profile.role === 'instructor') page = 'instructor-dashboard';
      if (profile.role === 'admin')      page = 'admin-dashboard';

      let xp = progress?.xp || 0;
      let completed = progress?.completed || [];
      let badges = progress?.badges || [];
      let enrolledCourseId = null;
      let courseModules = [];
      let allEnrollments = [];

      if (profile.role === 'student') {
        const studentSess = await loadStudentSession(data.user.id, profile.area || null);
        xp             = studentSess.xp;
        completed      = studentSess.completed;
        badges         = studentSess.badges;
        enrolledCourseId = studentSess.enrolledCourseId;
        courseModules  = studentSess.courseModules;
        allEnrollments = studentSess.allEnrollments;
      }

      XS.set({
        isLoggedIn: true,
        user: { id: data.user.id, name: profile.name, email: profile.email, avatar: profile.avatar, role: profile.role },
        page,
        xp, completed, badges,
        enrolledCourseId, courseModules,
        allEnrollments: profile.role === 'student' ? allEnrollments : [],
        notifications: [], selectedArea: profile.area || null, nodeId: null,
      });
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'var(--font)',
    outline: 'none', transition: 'border-color .2s', background: 'var(--white)',
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: isMobile ? 'auto' : 'hidden',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      {/* Left panel — decorative (hidden on mobile) */}
      {!isMobile && <div style={{
        flex: '0 0 45%', background: 'var(--gradient)', position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 60, overflow: 'hidden',
      }}>
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
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
            Bienvenido a<br/>Experia
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', lineHeight: 1.6, maxWidth: 360 }}>
            Tu plataforma de formación en Diseño Centrado en Experiencias. Inicia sesión para continuar tu recorrido formativo.
          </p>
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
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .5s .15s ease both' }}>
          <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Iniciar sesión</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: isMobile ? 20 : 32 }}>
            Ingresa tus credenciales para acceder a la plataforma
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Correo electrónico
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="docente@ceinfes.com"
                onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={pass}
                  onChange={e => setPass(e.target.value)} placeholder="••••••"
                  onFocus={e => e.target.style.borderColor = 'var(--orange)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
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
                background: '#FEF2F2', color: 'var(--error)', fontSize: 13, fontWeight: 500,
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
