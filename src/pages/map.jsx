import React from 'react'
import {
  useStore, nav, completeNode, AREAS, BADGES, LEVELS,
  getStudentModules, getRouteModules, findModule,
  calcLevel, xpForNext, xpProgress, nodeStatus, progressPct, isRouteComplete,
  gradeTotal, gradeMax,
} from '../store/store.jsx'
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
// EXPERIA — Learning Map (responsive + optimized)
// =============================================

const NODE_ICONS = {
  lesson: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <BookIc s={24} c="#fff"/>,
  challenge: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <ZapIc s={22} c="#fff"/>,
  evaluation: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <TrophyIc s={22} c="#fff"/>,
  final_delivery: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <AwardIc s={22} c="#fff"/>,
};

const NODE_COLORS = {
  completed: { bg: 'var(--success)', border: '#0D9668', shadow: '0 4px 16px rgba(16,185,129,.35)' },
  available: { bg: 'var(--orange)', border: 'var(--orange)', shadow: '0 4px 16px rgba(232,115,44,.4)' },
  locked: { bg: 'var(--subtle)', border: 'var(--border)', shadow: 'none' },
};

const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL' };
const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: 'var(--orange)', final_delivery: 'var(--success)' };

// --- Desktop: Node circle ---
const MapNode = React.memo(({ mod, status, index, onClick }) => {
  const [hov, setHov] = React.useState(false);
  const colors = NODE_COLORS[status];
  const isActive = status === 'available';
  const nodeSize = 72;

  return (
    <div onClick={() => status !== 'locked' && onClick(mod)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', cursor: status === 'locked' ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: `fadeUp .4s ${index * 80}ms ease both`,
      }}>
      {isActive && (
        <div style={{ position: 'absolute', top: -28, background: 'var(--dark)', color: '#fff',
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: 1, animation: 'float 2s ease-in-out infinite', whiteSpace: 'nowrap' }}>AQUÍ</div>
      )}
      {isActive && (
        <div style={{ position: 'absolute', width: nodeSize, height: nodeSize, borderRadius: '50%',
          border: '3px solid var(--orange)', animation: 'nodePing 2s ease-out infinite' }} />
      )}
      <div style={{
        width: nodeSize, height: nodeSize, borderRadius: '50%',
        background: colors.bg, border: `3px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hov && status !== 'locked' ? 'var(--sh-lg)' : colors.shadow,
        transform: hov && status !== 'locked' ? 'scale(1.08)' : 'scale(1)',
        transition: 'all .25s ease',
      }}>
        {status === 'locked' ? <LockIc s={26} c="#fff" /> : (NODE_ICONS[mod.type] || NODE_ICONS.lesson)(status)}
      </div>
    </div>
  );
});

// --- Desktop: Card beside node ---
const MapCard = React.memo(({ mod, status, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={() => status !== 'locked' && onClick(mod)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--white)', borderRadius: 16, padding: '18px 22px',
        border: status === 'available' ? '2px solid var(--orange-pale)' :
                status === 'completed' ? '2px solid #D1FAE5' : '1px solid var(--border)',
        cursor: status === 'locked' ? 'default' : 'pointer',
        width: 280, transition: 'all .25s ease',
        transform: hov && status !== 'locked' ? 'translateY(-2px)' : 'none',
        boxShadow: hov && status !== 'locked' ? 'var(--sh-lg)' : 'var(--sh-sm)',
        opacity: status === 'locked' ? .55 : 1,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type],
          background: mod.type === 'lesson' ? 'var(--orange-bg)' : 'var(--purple-bg)',
          padding: '3px 8px', borderRadius: 4, letterSpacing: .8,
        }}>{TYPE_LABELS[mod.type] || 'MÓDULO'}</span>
        {status === 'completed' && <CheckIc s={14} c="var(--success)" />}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4, lineHeight: 1.3 }}>{mod.title}</h4>
      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{mod.desc}</p>
      {status === 'available' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--orange)' }}>
          Comenzar <ChevRIc s={14} c="var(--orange)" />
        </div>
      )}
      {status === 'completed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
          Completado · +{mod.xp} XP
          <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>· Clic para revisar</span>
        </div>
      )}
    </div>
  );
});

// --- Mobile: Linear list item ---
const MobileModuleRow = React.memo(({ mod, status, onClick }) => {
  const colors = NODE_COLORS[status];
  const isActive = status === 'available';
  return (
    <div onClick={() => status !== 'locked' && onClick(mod)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        borderRadius: 16, background: 'var(--white)',
        border: isActive ? '2px solid var(--orange-pale)' : status === 'completed' ? '2px solid #D1FAE5' : '1px solid var(--border)',
        cursor: status === 'locked' ? 'default' : 'pointer',
        opacity: status === 'locked' ? .55 : 1,
        transition: 'all .2s',
        position: 'relative',
      }}>
      {isActive && (
        <div style={{ position: 'absolute', top: -8, left: 16, background: 'var(--orange)', color: '#fff',
          fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>SIGUIENTE</div>
      )}
      <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: colors.bg, border: `2px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: colors.shadow,
      }}>
        {status === 'locked' ? <LockIc s={20} c="#fff" /> : NODE_ICONS[mod.type](status)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type],
          textTransform: 'uppercase', letterSpacing: .8, marginBottom: 2 }}>{TYPE_LABELS[mod.type]}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.3 }}>{mod.title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>+{mod.xp} XP</div>
      </div>
      {status === 'available' && <ChevRIc s={18} c="var(--orange)" />}
      {status === 'completed' && <CheckIc s={18} c="var(--success)" />}
      {status === 'locked' && <LockIc s={16} c="var(--subtle)" />}
    </div>
  );
});

// --- Main Learning Map ---
const LearningMap = () => {
  const completed       = useStore(s => s.completed);
  const xp              = useStore(s => s.xp);
  const selectedArea    = useStore(s => s.selectedArea);
  const routeConfigs    = useStore(s => s.routeConfigs);
  const courseModules   = useStore(s => s.courseModules);
  const enrolledCourseId = useStore(s => s.enrolledCourseId);
  const courses         = useStore(s => s.courses);
  const isMobile = useMobile();

  // Si el estudiante tiene un curso inscrito en BD → usa courseModules, si no usa legacy
  const studentModules = React.useMemo(() => {
    if (enrolledCourseId && courseModules.length > 0) return courseModules;
    return getRouteModules(selectedArea, routeConfigs);
  }, [enrolledCourseId, courseModules, selectedArea, routeConfigs]);

  const enrolledCourse = React.useMemo(
    () => courses.find(c => c.id === enrolledCourseId),
    [courses, enrolledCourseId]
  );

  const level = React.useMemo(() => calcLevel(xp), [xp]);
  const pct = React.useMemo(
    () => progressPct(completed, selectedArea, enrolledCourseId ? studentModules : null),
    [completed, selectedArea, studentModules, enrolledCourseId]
  );

  const handleNodeClick = React.useCallback((mod) => {
    const status = nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
    if (status === 'locked') return;
    if (mod.type === 'final_delivery') nav('grid');
    else if (mod.type === 'lesson') nav('lesson', mod.id);
    else nav('challenge', mod.id);
  }, [completed, selectedArea, studentModules, enrolledCourseId]);

  // Desktop layout constants
  const nodeSpacing = 180;
  const mapHeight = studentModules.length * nodeSpacing + 120;
  const mapWidth = 800;

  const getNodePos = React.useCallback((mod, i) => ({
    x: (mod.pos.x / 100) * mapWidth,
    y: 60 + i * nodeSpacing,
  }), []);

  const genPath = React.useCallback((p1, p2) => {
    const my = (p1.y + p2.y) / 2;
    return `M${p1.x},${p1.y + 36} C${p1.x},${my} ${p2.x},${my} ${p2.x},${p2.y - 36}`;
  }, []);

  // ---- MOBILE VIEW ----
  if (isMobile) {
    return (
      <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 0 40px' }}>
        {/* Compact hero */}
        <div style={{
          margin: '12px 16px 20px', padding: '20px 20px', borderRadius: 16,
          background: 'var(--gradient)', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>{enrolledCourse?.name || 'Tu Ruta DCE'}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Mapa de aprendizaje</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatChip icon={<ProgressRing pct={pct} size={22} sw={2.5} color="rgba(255,255,255,.9)" />} label="Progreso" value={pct + '%'} />
            <StatChip icon={<ZapIc s={16} c="var(--orange-light)" />} label="XP" value={xp} />
            <StatChip icon={<TargetIc s={16} c="var(--orange-light)" />} label="Nivel" value={level} />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)' }}>Progreso de la ruta</span>
            <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <ProgressBar pct={pct} h={6} color="var(--orange)" />
        </div>

        {/* Linear module list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {studentModules.map((mod, i) => {
            const status = nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
            return (
              <MobileModuleRow key={mod.id} mod={mod} status={status} onClick={handleNodeClick} />
            );
          })}
        </div>
      </div>
    );
  }

  // ---- DESKTOP VIEW (original zigzag) ----
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 0 40px' }}>
      {/* Hero banner */}
      <div style={{
        margin: '0 24px 24px', padding: '28px 32px', borderRadius: 20,
        background: 'var(--gradient)', color: '#fff', position: 'relative', overflow: 'hidden',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 24, animation: 'fadeUp .5s ease',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.7)',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{enrolledCourse?.name || 'Tu Ruta DCE'}</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Mapa de aprendizaje</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', maxWidth: 400 }}>
            Avanza por cada lección y desbloquea retos para construir tu rol como docente-diseñador.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
          <StatChip icon={<ProgressRing pct={pct} size={28} sw={3} color="rgba(255,255,255,.9)" />} label="Progreso" value={pct + '%'} />
          <StatChip icon={<ZapIc s={18} c="var(--orange-light)" />} label="XP" value={xp} />
          <StatChip icon={<TargetIc s={18} c="var(--orange-light)" />} label="Nivel" value={level} />
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', width: mapWidth, maxWidth: '100%', height: mapHeight, margin: '0 auto' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {studentModules.slice(0, -1).map((mod, i) => {
            const p1 = getNodePos(mod, i);
            const p2 = getNodePos(studentModules[i + 1], i + 1);
            const s1 = nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
            const active = s1 === 'completed';
            return (
              <path key={i} d={genPath(p1, p2)}
                fill="none" stroke={active ? 'var(--success)' : 'var(--border)'}
                strokeWidth={3} strokeLinecap="round"
                strokeDasharray={active ? 'none' : '8 6'}
                style={{ transition: 'stroke .4s ease' }} />
            );
          })}
        </svg>

        {studentModules.map((mod, i) => {
          const pos = getNodePos(mod, i);
          const status = nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
          const cardOnLeft = mod.side === 'left' || (mod.pos?.x || 50) > 50;
          return (
            <div key={mod.id} style={{
              position: 'absolute', left: pos.x - 36, top: pos.y - 36,
              display: 'flex', alignItems: 'center', gap: 20,
              flexDirection: cardOnLeft ? 'row-reverse' : 'row',
            }}>
              <MapNode mod={mod} status={status} index={i} onClick={handleNodeClick} />
              <div style={{ animation: `${cardOnLeft ? 'slideL' : 'slideR'} .4s ${i * 80 + 100}ms ease both` }}>
                <MapCard mod={mod} status={status} onClick={handleNodeClick} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningMap;
