import React from 'react'
import { useStore, nav, calcLevel, doLogout, dismissStudentMessage } from '../store/store.jsx'
import { useTheme } from '../lib/theme.js'
import { useMobile, LogoImg, MenuIc, BellIc, SunIc, MoonIc, CheckIc, ClockIc, LogOutIc } from './ui.jsx'

const Header = React.memo(({ onMenuClick }) => {
  const user = useStore(s => s.user);
  const xp = useStore(s => s.xp);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const studentMessages = useStore(s => s.studentMessages);
  const isMobile = useMobile();
  const [showNotifs, setShowNotifs] = React.useState(false);
  const { theme, toggle } = useTheme();
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
      borderBottom: '1px solid var(--border)', flexShrink: 0,
      background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)', zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isMobile && (
          <button onClick={onMenuClick} aria-label="Abrir menú" style={{
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

        {/* Toggle modo claro/oscuro */}
        <button onClick={toggle}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 36, height: 36, minHeight: 36, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, transform .2s var(--ease-spring)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08) rotate(-12deg)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          {theme === 'dark' ? <SunIc s={17} c="var(--warn)" /> : <MoonIc s={17} c="var(--muted)" />}
        </button>

        {/* Notification bell — students only */}
        {user.role === 'student' && (
          <div style={{ position: 'relative' }}>
            <button
               onClick={e => { e.stopPropagation(); setShowNotifs(o => !o); }}
              aria-label={`Notificaciones${myUnread.length > 0 ? ` (${myUnread.length} sin leer)` : ''}`}
              style={{ position: 'relative', background: myUnread.length > 0 ? 'var(--orange-bg)' : 'var(--bg-alt)',
                border: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'background .2s, transform .2s var(--ease-spring)',
                animation: myUnread.length > 0 ? 'glow 2.4s ease infinite' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <BellIc s={17} c={myUnread.length > 0 ? 'var(--orange)' : 'var(--muted)'} />
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
                      const msgBg = isApproved ? 'var(--success-bg)' : isGraded ? 'var(--info-bg)' : 'var(--orange-50)';
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

        <button aria-label="Ver perfil" style={{ width: 36, height: 36, minHeight: 36, borderRadius: '50%', border: 'none', padding: 0,
          background: user.role === 'instructor' ? 'var(--success)' : 'var(--gradient-orange)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0,
          overflow: 'hidden', boxShadow: '0 0 0 2px var(--white), 0 0 0 3.5px var(--border)',
          transition: 'box-shadow .2s, transform .2s var(--ease-spring)' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--white), 0 0 0 3.5px var(--orange)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--white), 0 0 0 3.5px var(--border)'; e.currentTarget.style.transform = 'none'; }}
          onClick={() => nav('profile')}>
          {user.avatar?.startsWith('http')
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.avatar}
        </button>
        {!isMobile && (
          <button onClick={doLogout} aria-label="Cerrar sesión" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            borderRadius: 6, display: 'flex', minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <LogOutIc s={18} c="var(--muted)" />
          </button>
        )}
      </div>
    </header>
  );
});

export default Header;
