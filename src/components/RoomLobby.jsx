import React from 'react'
import { useStore, nav, switchCourse, isBaseCourse, closeRoomLobby, markRoomChosen } from '../store/store.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { GUIDED_MAX_AGE_HOURS } from '../lib/liveClient.js'
import { useMobile, LogoImg } from './ui.jsx'

// =============================================
// Sala de entrada: el estudiante con más de un curso la ve apenas ingresa, para
// que nadie tenga que descubrir por su cuenta que existen otras salas. Con un
// solo curso no aparece. Si un profesor tiene una clase en vivo en alguna de sus
// salas, esa sala sale de primera y resaltada: la búsqueda del banner solo mira
// la sala actual, así que sin esto la clase pasaría inadvertida.
// =============================================

const THEME_ICON = { detective: '🕵️', 'escape-room': '🔐', lab: '🧪', 'time-travel': '⏳' }
const CHECK_LIVE_MS = 15000

const RoomLobby = () => {
  const courses     = useStore(s => s.courses);
  const userCourses = useStore(s => s.userCourses);
  const user        = useStore(s => s.user);
  const currentId   = useStore(s => s.enrolledCourseId);
  const canGoBack   = useStore(s => s.roomLobbyOpen);
  const isMobile    = useMobile();
  const [progress, setProgress] = React.useState({});
  const [liveIds, setLiveIds]   = React.useState(new Set());
  const [entering, setEntering] = React.useState(null);
  const [err, setErr]           = React.useState('');

  const rooms = React.useMemo(() => {
    const active = new Set((userCourses || []).filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id));
    return (courses || []).filter(c => isBaseCourse(c) && active.has(c.id));
  }, [courses, userCourses, user?.id]);
  const roomIds = rooms.map(r => r.id).join();

  React.useEffect(() => {
    if (!user?.id || !roomIds) return;
    let alive = true;
    const ids = roomIds.split(',');
    supabase.from('course_progress').select('course_id,completed').eq('user_id', user.id).in('course_id', ids)
      .then(({ data }) => {
        if (alive) setProgress(Object.fromEntries((data || []).map(p => [p.course_id, (p.completed || []).length])));
      });

    // La clase vive en la copia del colegio cuando existe: se busca en ambas.
    const checkLive = async () => {
      let toBase = Object.fromEntries(ids.map(id => [id, id]));
      if (user.institution_id) {
        const { data: forks } = await supabase.from('courses').select('id,parent_course_id')
          .in('parent_course_id', ids).eq('institution_id', user.institution_id).eq('is_active', true);
        (forks || []).forEach(f => { toBase[f.id] = f.parent_course_id; });
      }
      const since = new Date(Date.now() - GUIDED_MAX_AGE_HOURS * 3600 * 1000).toISOString();
      const { data: sessions } = await supabase.from('live_sessions').select('course_id')
        .in('course_id', Object.keys(toBase)).neq('status', 'ended').gte('created_at', since);
      if (alive) setLiveIds(new Set((sessions || []).map(s => toBase[s.course_id])));
    };
    checkLive().catch(() => {});
    const timer = setInterval(() => checkLive().catch(() => {}), CHECK_LIVE_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [user?.id, user?.institution_id, roomIds]);

  const ordered = [...rooms].sort((a, b) =>
    (liveIds.has(b.id) - liveIds.has(a.id)) || ((b.id === currentId) - (a.id === currentId)));

  const enter = async (room) => {
    if (entering) return;
    setEntering(room.id); setErr('');
    try {
      if (room.id !== currentId) await switchCourse(room.id);
      markRoomChosen();
      nav('map');
    } catch (e) {
      setErr('No se pudo entrar a esa sala. Inténtalo de nuevo.');
      setEntering(null);
    }
  };

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto', padding: isMobile ? '24px 16px' : '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 22 : 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><LogoImg h={32} /></div>
          <h1 style={{ fontSize: isMobile ? 23 : 30, fontWeight: 800, color: 'var(--dark)', margin: '0 0 8px' }}>
            {firstName ? `${firstName}, ¿a` : '¿A'} qué sala vas a entrar hoy?
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            Elige la sala que te indicó tu profesor. Tu avance se guarda en cada una y podrás cambiar cuando quieras.
          </p>
        </div>

        {err && <p role="alert" style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--error)', margin: '0 0 12px' }}>{err}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ordered.map(room => {
            const isLive = liveIds.has(room.id);
            const isCurrent = room.id === currentId;
            const done = progress[room.id] || 0;
            return (
              <button key={room.id} onClick={() => enter(room)} disabled={!!entering}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 84, padding: isMobile ? 14 : '16px 20px',
                  borderRadius: 16, textAlign: 'left', fontFamily: 'var(--font)', cursor: entering ? 'wait' : 'pointer',
                  background: 'var(--white)', boxShadow: 'var(--sh-sm, none)',
                  border: `2px solid ${isLive ? 'var(--error)' : isCurrent ? 'var(--orange)' : 'var(--border)'}`,
                  opacity: entering && entering !== room.id ? .55 : 1, transition: 'border-color .15s, transform .15s' }}>
                <span aria-hidden="true" style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 14, fontSize: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-alt)' }}>
                  {THEME_ICON[room.theme] || '📘'}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {isLive && (
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#fff', background: '#B91C1C', padding: '2px 8px', borderRadius: 20, marginBottom: 4 }}>
                      🔴 Clase en vivo ahora
                    </span>
                  )}
                  <span style={{ display: 'block', fontSize: isMobile ? 15 : 16.5, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.3 }}>{room.name}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
                    {isCurrent ? 'Aquí quedaste la última vez · ' : ''}
                    {done > 0 ? `${done} ${done === 1 ? 'módulo completado' : 'módulos completados'}` : 'Sin empezar'}
                  </span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>
                  {entering === room.id ? 'Entrando…' : 'Entrar →'}
                </span>
              </button>
            );
          })}
        </div>

        {canGoBack && (
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button onClick={closeRoomLobby}
              style={{ minHeight: 40, padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 700, color: 'var(--muted)' }}>
              ← Volver sin cambiar de sala
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
