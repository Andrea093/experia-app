import React from 'react'
import { nav } from '../store/store.jsx'
import { useMobile, LogoImg, ArrowRIc, Btn } from '../components/ui.jsx'
// =============================================
// EXPERIA — Landing Page
// =============================================

const LandingPage = () => {
  const [scrollY, setScrollY] = React.useState(0);
  const ref = React.useRef(null);
  const isMobile = useMobile();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setScrollY(el.scrollTop), 16); };
    el.addEventListener('scroll', h, { passive: true });
    return () => { el.removeEventListener('scroll', h); clearTimeout(t); };
  }, []);

  const features = [
    { icon: '🧭', title: 'Aprendizaje Experiencial', desc: 'Vive el DCE a través de retos, simulaciones y actividades inmersivas que transforman tu práctica.' },
    { icon: '🎮', title: 'Gamificación Avanzada', desc: 'Avanza por niveles, desbloquea insignias y acumula puntos mientras construyes nuevas competencias.' },
    { icon: '🗺️', title: 'Mapa Interactivo', desc: 'Recorre tu ruta formativa de manera visual y personalizada, desbloqueando nuevos desafíos.' },
    { icon: '🏗️', title: 'Construcción Guiada', desc: 'Diseña tu propio producto pedagógico con herramientas interactivas y retroalimentación.' },
  ];

  const stats = [
    { num: '5', label: 'Módulos formativos' },
    { num: '8+', label: 'Retos interactivos' },
    { num: '∞', label: 'Posibilidades pedagógicas' },
  ];

  return (
    <div ref={ref} style={{ height: '100vh', overflow: 'auto', background: 'var(--white)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 40px', height: 64,
        background: scrollY > 20 ? 'var(--glass-bg)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'var(--glass-blur)' : 'none',
        WebkitBackdropFilter: scrollY > 20 ? 'var(--glass-blur)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrollY > 20 ? 'var(--sh-sm)' : 'none',
        transition: 'all .3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <LogoImg h={36} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={() => nav('login')}>Iniciar sesión</Btn>
          <Btn variant="primary" size="sm" onClick={() => nav('login')}>Comenzar</Btn>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: isMobile ? '56px 20px 72px' : '80px 40px 100px', textAlign: 'center',
        background: 'var(--gradient)', backgroundSize: '180% 180%',
        animation: 'gradientShift 16s ease infinite', minHeight: isMobile ? 420 : 540,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240,
          borderRadius: '50%', background: 'rgba(255,255,255,.06)', animation: 'heroFloat 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -60, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,.04)', animation: 'heroFloat 10s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', top: '22%', left: '14%', width: 70, height: 70,
          borderRadius: 18, transform: 'rotate(18deg)', background: 'rgba(255,255,255,.05)',
          animation: 'heroFloat 12s ease-in-out infinite 1s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, animation: 'fadeUp .7s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 'var(--r-full)',
            background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.25)',
            color: '#fff', fontSize: isMobile ? 11 : 13, fontWeight: 600, marginBottom: 16, letterSpacing: .5,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5EEAD4',
              boxShadow: '0 0 8px #5EEAD4', display: 'inline-block' }} />
            PLATAFORMA FORMATIVA · CEINFES
          </div>
          <h1 style={{
            fontSize: isMobile ? 28 : 48, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: isMobile ? 14 : 20,
          }}>
            Diseño Centrado en Experiencias para la Transformación Educativa
          </h1>
          <p style={{
            fontSize: isMobile ? 14 : 18, color: 'rgba(255,255,255,.85)', lineHeight: 1.6,
            maxWidth: 580, margin: isMobile ? '0 auto 24px' : '0 auto 36px',
          }}>
            Una experiencia formativa innovadora para fortalecer las competencias pedagógicas de los docentes del siglo XXI.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Btn variant="white" size={isMobile ? 'md' : 'lg'} onClick={() => nav('login')}>
              Comenzar recorrido <ArrowRIc s={16} />
            </Btn>
            {!isMobile && (
              <Btn variant="outline" size="lg" onClick={() => nav('login')}
                style={{ color: '#fff', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.4)' }}>
                Conocer más
              </Btn>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        display: 'flex', justifyContent: 'center', gap: isMobile ? 28 : 48, padding: isMobile ? '28px 20px' : '48px 40px',
        animation: 'fadeUp .6s .2s ease both', flexWrap: 'wrap',
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div className="gradient-text" style={{ fontSize: isMobile ? 32 : 40, fontWeight: 800 }}>{s.num}</div>
            <div style={{ fontSize: isMobile ? 12 : 14, color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: isMobile ? '32px 16px 48px' : '60px 40px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 48 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>
            Una nueva forma de formarse
          </h2>
          <p style={{ fontSize: isMobile ? 13 : 16, color: 'var(--muted)', maxWidth: 520, margin: '0 auto' }}>
            Abandona los cursos tradicionales. Vive una experiencia de aprendizaje diseñada para transformar tu práctica docente.
          </p>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: isMobile ? 12 : 24,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: 28, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
              background: 'var(--white)',
              transition: 'transform .3s var(--ease-out), box-shadow .3s var(--ease-out), border-color .3s var(--ease-out)',
              animation: `fadeUp .5s ${i * 80 + 200}ms ease both`,
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = 'var(--sh-lg), 0 0 0 1px rgba(232,115,44,.18)';
              e.currentTarget.style.borderColor = 'var(--orange-pale)';
              const tile = e.currentTarget.firstChild;
              if (tile) { tile.style.transform = 'scale(1.08) rotate(-4deg)'; }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
              const tile = e.currentTarget.firstChild;
              if (tile) { tile.style.transform = 'none'; }
            }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, fontSize: 30, marginBottom: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--gradient-soft)', border: '1px solid rgba(232,115,44,.12)',
                transition: 'transform .3s var(--ease-spring)' }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--dark)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        margin: isMobile ? '0 16px 48px' : '0 40px 80px', padding: isMobile ? '36px 20px' : '56px 40px', borderRadius: 'var(--r-xl)',
        background: 'var(--gradient)', backgroundSize: '180% 180%',
        animation: 'gradientShift 16s ease infinite', textAlign: 'center',
        boxShadow: 'var(--sh-purple)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12, position: 'relative' }}>
          ¿Listo para transformar tu práctica docente?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.8)', marginBottom: 28, position: 'relative' }}>
          Únete a la comunidad de docentes que ya están diseñando experiencias educativas memorables.
        </p>
        <Btn variant="white" size="lg" onClick={() => nav('login')} style={{ position: 'relative' }}>
          Comenzar ahora <ArrowRIc s={18} />
        </Btn>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 40px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 12
          }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-sec)' }}>CEINFES · Experia</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>© 2026 CEINFES. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
