import React from 'react'
import {
  useStore, nav, completeNode, findModule, findModuleInConfig, AREAS, BADGES, LEVELS,
  getStudentModules, nodeStatus, calcLevel, getActiveCourseTheme,
} from '../store/store.jsx'
import { CharacterFloat } from '../components/CharacterBubble.jsx'
import ThemeCelebration from '../components/ThemeCelebration.jsx'
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger,
} from '../components/ui.jsx'
// =============================================
// EXPERIA — Lesson Viewer
// =============================================

// Tarjeta de evidencia: click para revelar contenido oculto
const RevealSection = ({ section, delay }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
      {section.title && (
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={`ls-reveal-trigger${open ? ' open' : ''}`}
        aria-expanded={open}
      >
        <span className="ls-reveal-icon">{open ? '🔓' : (section.icon || '🔒')}</span>
        <span className="ls-reveal-label">{open ? (section.openLabel || 'Ocultar') : (section.label || 'Revelar contenido')}</span>
        <span className="ls-reveal-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="ls-reveal-body">
          {section.items?.map((item, i) => (
            <div key={i} className="ls-reveal-item" style={{ animationDelay: `${i * 60}ms` }}>
              {item.t && <div className="ls-reveal-item-title">{item.t}</div>}
              {item.d && <div className="ls-reveal-item-desc">{item.d}</div>}
            </div>
          ))}
          {section.text && <p className="ls-reveal-text">{section.text}</p>}
        </div>
      )}
    </div>
  );
};

const LessonSection = React.memo(({ section, index }) => {
  const delay = index * 60;
  const isMobile = useMobile();

  if (section.type === 'intro') {
    return (
      <div style={{ marginBottom: 32, animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.3 }}>
          {section.title}
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-sec)', lineHeight: 1.8 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'callout') {
    return (
      <div style={{
        margin: '28px 0', padding: '20px 24px', borderRadius: 14,
        background: 'var(--purple-bg)', borderLeft: '4px solid var(--purple)',
        animation: `fadeUp .45s ${delay}ms ease both`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{section.icon || '💡'}</span>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--purple-deep)' }}>{section.title}</h4>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'concepts') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>{section.title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {section.items.map((item, i) => (
            <div key={i} style={{
              padding: '18px 20px', borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--white)', transition: 'all .2s',
              animation: `fadeUp .4s ${delay + i * 60}ms ease both`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange-pale)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <h5 style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)', marginBottom: 6 }}>{item.t}</h5>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'text') {
    return (
      <div style={{ margin: '28px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.8 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'video') {
    const videoId = section.url?.includes('youtube.com/watch?v=')
      ? section.url.split('v=')[1]?.split('&')[0]
      : section.url?.includes('youtu.be/')
        ? section.url.split('youtu.be/')[1]?.split('?')[0]
        : section.url;
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        {section.desc && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{section.desc}</p>
        )}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={section.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    );
  }

  if (section.type === 'image') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        <div className="ls-image-wrap">
          <img
            src={section.url}
            alt={section.caption || section.title || ''}
            style={{ width: '100%', borderRadius: 14, display: 'block',
              boxShadow: 'var(--sh-lg)', objectFit: 'cover',
              maxHeight: section.height || 420 }}
          />
          {section.caption && (
            <p className="ls-image-caption">{section.caption}</p>
          )}
          {/* Sello EVIDENCIA en tema detective — via CSS */}
          <div className="ls-image-badge" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (section.type === 'quote') {
    return (
      <div className="ls-quote" style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <span className="ls-quote-mark">"</span>
        <blockquote className="ls-quote-text">{section.text}</blockquote>
        {section.author && (
          <cite className="ls-quote-author">— {section.author}</cite>
        )}
      </div>
    );
  }

  if (section.type === 'steps') {
    return (
      <div style={{ margin: '36px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 className="ls-steps-title" style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 24 }}>{section.title}</h3>
        )}
        <div className="ls-steps">
          {(section.items || []).map((item, i) => (
            <div key={i} className="ls-step" style={{ animationDelay: `${delay + i * 120}ms` }}>
              <div className="ls-step-rail" aria-hidden="true">
                <div className="ls-step-node">
                  <span className="ls-step-icon">{item.icon || '•'}</span>
                  <span className="ls-step-index">{i + 1}</span>
                </div>
              </div>
              <div className="ls-step-body">
                {item.t && <div className="ls-step-title">{item.t}</div>}
                {item.d && <div className="ls-step-desc">{item.d}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'reveal') {
    return <RevealSection section={section} delay={delay} />;
  }

  if (section.type === 'compare') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{section.title}</h3>
        <span style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 500, display: 'block', marginBottom: 16 }}>
          {section.label}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={{
            padding: '18px 20px', borderRadius: 14, background: 'var(--error-bg)',
            border: '1px solid #FECACA',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 8 }}>Enfoque Tradicional</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{section.trad}</p>
          </div>
          <div style={{
            padding: '18px 20px', borderRadius: 14, background: 'var(--success-bg)',
            border: '1px solid #BBF7D0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 8 }}>Enfoque DCE</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{section.dce}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

const LessonView = () => {
  const nodeId = useStore(s => s.nodeId);
  const completed = useStore(s => s.completed);
  const selectedArea = useStore(s => s.selectedArea);
  const isMobile = useMobile();
  const mod = findModule(nodeId) || findModuleInConfig(nodeId);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const scrollRef = React.useRef(null);

  const isCompleted = completed.includes(nodeId);

  React.useEffect(() => {
    setProgress(0); setDone(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [nodeId]);

  // Track scroll progress
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100;
      setProgress(Math.min(100, Math.round(pct)));
      if (pct > 85) setDone(true);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [nodeId]);

  const courseTheme = getActiveCourseTheme();

  const handleComplete = () => {
    let routeNowComplete = false;
    if (!isCompleted) {
      completeNode(nodeId);
      setShowConfetti(true);
      const newCompleted = [...completed, nodeId];
      routeNowComplete = isRouteComplete(newCompleted, selectedArea);
    }
    setTimeout(() => nav(routeNowComplete ? 'grid' : 'map'), courseTheme ? 2300 : 1500);
  };

  if (!mod || !mod.content) {
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Contenido no disponible</p>
      <Btn variant="secondary" onClick={() => nav('map')} style={{ marginTop: 16 }}>
        <ArrowLIc s={16} /> Volver al mapa
      </Btn>
    </div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showConfetti && (courseTheme
        ? <ThemeCelebration theme={courseTheme} onDone={() => setShowConfetti(false)} />
        : <Confetti onDone={() => setShowConfetti(false)} />)}

      {/* Top progress bar */}
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'var(--orange)', width: progress + '%',
          transition: 'width .3s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        background: 'var(--white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => nav('map')} style={{
            background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLIc s={18} c="var(--text)" /></button>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase',
              letterSpacing: 1 }}>{mod.subtitle}</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>{mod.title}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{mod.xp} XP</span>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '20px 16px' : '32px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Hero */}
          <div style={{
            padding: '32px 28px', borderRadius: 16, background: 'var(--gradient)',
            marginBottom: 36, animation: 'fadeUp .5s ease',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)',
              textTransform: 'uppercase', letterSpacing: 1.5 }}>{mod.subtitle}</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 6 }}>{mod.title}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 8 }}>{mod.desc}</p>
          </div>

          {/* Task instruction */}
          {mod.task && (
            <div className="ls-task-box" style={{ marginBottom: 28, animation: 'fadeUp .4s ease' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
              <div>
                <div className="ls-task-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>¿Qué debes hacer?</div>
                <p className="ls-task-text" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{mod.task}</p>
              </div>
            </div>
          )}

          {/* Sections */}
          {mod.content.map((sec, i) => <LessonSection key={i} section={sec} index={i} />)}

          {/* Extras added by instructor */}
          {mod.extras?.length > 0 && (
            <div style={{ margin: '32px 0', padding: '20px 24px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📎</span> Recursos adicionales del instructor
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mod.extras.map((extra, i) => {
                  if (extra.type === 'video') {
                    const videoId = extra.url?.includes('youtube.com/watch?v=')
                      ? extra.url.split('v=')[1]?.split('&')[0]
                      : extra.url?.includes('youtu.be/')
                        ? extra.url.split('youtu.be/')[1]?.split('?')[0]
                        : extra.url;
                    return (
                      <div key={i}>
                        {extra.title && <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>{extra.title}</h4>}
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--sh-md)' }}>
                          <iframe key={videoId} src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                            title={extra.title || 'Video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      {extra.title && <h4 style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>{extra.title}</h4>}
                      <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{extra.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion */}
          <div style={{
            marginTop: 48, padding: '32px', borderRadius: 16, textAlign: 'center',
            background: done || isCompleted ? '#F0FDF4' : 'var(--bg-alt)',
            border: done || isCompleted ? '2px solid #BBF7D0' : '1px solid var(--border)',
            animation: 'fadeUp .4s ease both',
          }}>
            {isCompleted ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
                  ¡Lección completada!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                  Ya has completado esta lección. Puedes revisarla cuando quieras.
                </p>
                <Btn variant="secondary" onClick={() => nav('map')}>
                  Volver al mapa <ArrowRIc s={16} />
                </Btn>
              </>
            ) : done ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>
                  ¡Has llegado al final!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                  Completa esta lección para ganar {mod.xp} XP y desbloquear el siguiente reto.
                </p>
                <Btn variant="gradient" size="lg" onClick={handleComplete}>
                  Completar lección <CheckIc s={18} c="#fff" />
                </Btn>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📖</div>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                  Desplázate para leer todo el contenido y desbloquear el botón de completar.
                </p>
                <ProgressBar pct={progress} h={6} color="var(--orange)" />
                <span style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 6, display: 'block' }}>
                  {progress}% leído
                </span>
              </>
            )}
          </div>
          <div style={{ height: 80 }} />
        </div>
      </div>

      {/* Personaje flotante — solo visible en tema detective */}
      <CharacterFloat moduleCharacterLine={mod?.characterLine} />
    </div>
  );
};

export default LessonView;
