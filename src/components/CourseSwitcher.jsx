import React from 'react'
import { useStore, nav, switchCourse, isBaseCourse } from '../store/store.jsx'
import { useMobile, CheckIc } from './ui.jsx'

// =============================================
// Selector de sala en la cabecera: el estudiante siempre ve en qué curso está y
// puede cambiarlo desde cualquier página. Con un solo curso no se pinta, porque
// no hay nada que cambiar. La última sala elegida se recuerda (switchCourse →
// profiles.last_course_id, 0085).
// =============================================

// Páginas donde cambiar de sala saca al estudiante de lo que está haciendo.
const IN_ACTIVITY = new Set(['lesson', 'challenge', 'grid'])

const CourseSwitcher = React.memo(() => {
  const courses    = useStore(s => s.courses);
  const userCourses = useStore(s => s.userCourses);
  const userId     = useStore(s => s.user?.id);
  const currentId  = useStore(s => s.enrolledCourseId);
  const page       = useStore(s => s.page);
  const isMobile   = useMobile();
  const [open, setOpen]           = React.useState(false);
  const [switching, setSwitching] = React.useState(null);
  const [err, setErr]             = React.useState('');

  // Mismo criterio que el selector del mapa y que "Elige tu curso": cursos base
  // con acceso activo en user_courses.
  const options = React.useMemo(() => {
    const active = new Set((userCourses || []).filter(uc => uc.user_id === userId && uc.is_active).map(uc => uc.course_id));
    return (courses || []).filter(c => isBaseCourse(c) && active.has(c.id));
  }, [courses, userCourses, userId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = () => setOpen(false);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!currentId || options.length < 2) return null;
  const current = (courses || []).find(c => c.id === currentId);

  const choose = async (course) => {
    if (switching) return;
    if (course.id === currentId) { setOpen(false); return; }
    if (IN_ACTIVITY.has(page) && !window.confirm(`Vas a salir de esta actividad para entrar a «${course.name}». ¿Continuar?`)) return;
    setSwitching(course.id); setErr('');
    try {
      await switchCourse(course.id);
      setOpen(false);
      nav('map');
    } catch (e) {
      setErr('No se pudo cambiar de sala. Inténtalo de nuevo.');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-haspopup="true" aria-expanded={open}
        aria-label={`Estás en ${current?.name || 'tu curso'}. Cambiar de sala`}
        title="Cambiar de sala"
        style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 40, maxWidth: isMobile ? 'min(42vw, 170px)' : 340,
          padding: '4px 10px 4px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left',
          border: '1.5px solid var(--orange)', background: 'var(--orange-bg)' }}>
        <span style={{ minWidth: 0, display: 'block' }}>
          {!isMobile && <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--muted)', lineHeight: 1.2 }}>Estás en</span>}
          <span style={{ display: 'block', fontSize: isMobile ? 12 : 13, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.25,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current?.name || 'Tu curso'}
          </span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 11, color: 'var(--orange)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>

      {open && (
        <div onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', left: 0, top: 'calc(100% + 8px)', width: isMobile ? 'calc(100vw - 72px)' : 360, maxWidth: 360,
            background: 'var(--white)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--sh-xl)',
            zIndex: 1000, overflow: 'hidden', animation: 'fadeUp .2s ease' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 800, color: 'var(--dark)' }}>
            Cambiar de sala
          </div>
          <div style={{ maxHeight: 'min(60vh, 380px)', overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(c => {
              const active = c.id === currentId;
              return (
                <button key={c.id} onClick={() => choose(c)} disabled={!!switching}
                  aria-current={active ? 'true' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '9px 12px', borderRadius: 10,
                    cursor: switching ? 'wait' : 'pointer', textAlign: 'left', fontFamily: 'var(--font)', border: 'none',
                    background: active ? 'var(--orange-bg)' : 'transparent', opacity: switching && switching !== c.id ? .55 : 1 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: active ? 800 : 600, color: 'var(--dark)', lineHeight: 1.3 }}>{c.name}</span>
                  {switching === c.id
                    ? <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Entrando…</span>
                    : active && <span style={{ flexShrink: 0, display: 'flex' }}><CheckIc s={16} c="var(--orange)" /></span>}
                </button>
              );
            })}
          </div>
          {err && <div role="alert" style={{ padding: '0 16px 12px', fontSize: 12, fontWeight: 600, color: 'var(--error)' }}>{err}</div>}
        </div>
      )}
    </div>
  );
});

export default CourseSwitcher;
