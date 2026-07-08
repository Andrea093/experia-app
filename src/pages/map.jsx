import React from 'react'
import {
  useStore, nav, completeNode, AREAS, BADGES, LEVELS,
  getStudentModules, getRouteModules, findModule,
  calcLevel, xpForNext, xpProgress, nodeStatus, progressPct, isRouteComplete,
  gradeTotal, gradeMax, switchCourse, hashFor, isBaseCourse, getCourseCertConfig,
} from '../store/store.jsx'

const hrefForMod = (mod) => {
  if (!mod) return '#'
  if (mod.type === 'certificate') return '#/course-cert'
  if (mod.type === 'final_delivery') return '#/grid'
  if (mod.type === 'lesson') return hashFor('lesson', mod.id)
  return hashFor('challenge', mod.id)
}
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger,
} from '../components/ui.jsx'
import { FirstStepsCard } from '../components/Onboarding.jsx'
// =============================================
// EXPERIA — Learning Map (responsive + optimized)
// =============================================

const NODE_ICONS = {
  lesson: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <BookIc s={24} c="#fff"/>,
  challenge: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <ZapIc s={22} c="#fff"/>,
  evaluation: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <TrophyIc s={22} c="#fff"/>,
  final_delivery: (status) => status === 'completed' ? <CheckIc s={24} c="#fff"/> : <AwardIc s={22} c="#fff"/>,
  certificate: (status) => status === 'completed' ? <AwardIc s={24} c="#fff"/> : <LockIc s={22} c="#fff"/>,
};

const NODE_COLORS = {
  completed: { bg: 'var(--success)', border: '#0F766E', shadow: '0 4px 16px rgba(13,148,136,.35)' },
  available: { bg: 'var(--orange)', border: 'var(--orange)', shadow: '0 4px 16px rgba(232,115,44,.4)' },
  locked: { bg: 'var(--subtle)', border: 'var(--border)', shadow: 'none' },
};
// El nodo del certificado usa su propia paleta dorada cuando ya está
// disponible (en vez del naranja/verde genérico), para distinguirlo como
// un hito especial y no un módulo más.
const CERT_NODE_COLORS = {
  completed: { bg: '#C9A227', border: '#9A7B1E', shadow: '0 4px 16px rgba(201,162,39,.45)' },
  locked: NODE_COLORS.locked,
};

const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL', certificate: 'CERTIFICADO' };
const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: 'var(--orange)', final_delivery: 'var(--success)', certificate: '#C9A227' };

// --- Desktop: Node circle ---
const MapNode = React.memo(({ mod, status, index, onClick, courseTheme }) => {
  const [hov, setHov] = React.useState(false);
  const colors = mod.type === 'certificate' ? (CERT_NODE_COLORS[status] || CERT_NODE_COLORS.completed) : NODE_COLORS[status];
  const isActive = status === 'available';
  const nodeSize = 72;
  const isDoor    = courseTheme === 'escape-room';
  const isFlask   = courseTheme === 'lab';
  const isPortal  = courseTheme === 'time-travel';

  // Nodo portal temporal: círculo con glow cósmico
  const portalStyle = isPortal ? {
    width: nodeSize, height: nodeSize, borderRadius: '50%',
    background: status === 'completed'
      ? 'radial-gradient(circle at 50% 45%, rgba(201,162,39,.5) 0%, rgba(60,40,120,.5) 100%)'
      : status === 'available'
        ? 'radial-gradient(circle at 50% 45%, rgba(91,141,217,.55) 0%, rgba(40,20,100,.5) 100%)'
        : 'radial-gradient(circle at 50% 45%, rgba(20,15,50,.6) 0%, rgba(10,8,30,.8) 100%)',
    border: `3px solid ${status === 'completed' ? '#c9a227' : status === 'available' ? '#5b8dd9' : 'rgba(91,141,217,.15)'}`,
    boxShadow: status === 'available' ? '0 0 0 6px rgba(91,141,217,.08), 0 0 0 12px rgba(168,85,247,.04)' : 'none',
  } : null;

  // Forma de matraz: círculo con glow de laboratorio
  const flaskStyle = isFlask ? {
    width: nodeSize, height: nodeSize, borderRadius: '50%',
    background: status === 'completed'
      ? 'radial-gradient(circle at 50% 60%, rgba(0,212,255,.4) 0%, rgba(0,80,80,.6) 100%)'
      : status === 'available'
        ? 'radial-gradient(circle at 50% 60%, rgba(0,255,136,.5) 0%, rgba(0,80,40,.6) 100%)'
        : 'radial-gradient(circle at 50% 60%, rgba(0,50,30,.5) 0%, rgba(0,20,15,.7) 100%)',
    border: `3px solid ${status === 'completed' ? '#00d4ff' : status === 'available' ? '#00ff88' : 'rgba(0,255,136,.15)'}`,
  } : null;

  // Forma de puerta: arco en la parte superior
  const doorStyle = isDoor ? {
    width: 58, height: 80,
    borderRadius: '50% 50% 6px 6px',
    background: status === 'completed'
      ? 'linear-gradient(160deg,#005a25,#00c853)'
      : status === 'available'
        ? 'linear-gradient(160deg,#8a6000,#f0a500)'
        : 'linear-gradient(160deg,#1a2a1a,#2a3a2a)',
    border: `3px solid ${status === 'completed' ? '#00c853' : status === 'available' ? '#f0a500' : 'rgba(240,165,0,.15)'}`,
    boxShadow: status === 'completed'
      ? '0 0 20px rgba(0,200,83,.4)'
      : status === 'available'
        ? '0 0 24px rgba(240,165,0,.5), 0 0 48px rgba(240,165,0,.2)'
        : 'none',
  } : {
    width: nodeSize, height: nodeSize, borderRadius: '50%',
    background: colors.bg, border: `3px solid ${colors.border}`,
    boxShadow: hov && status !== 'locked' ? 'var(--sh-lg)' : colors.shadow,
  };

  return (
    <div onClick={() => status !== 'locked' && onClick(mod)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', cursor: status === 'locked' ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: `fadeUp .4s ${index * 80}ms ease both`,
      }}>
      {isActive && !isDoor && !isFlask && !isPortal && (
        <div style={{ position: 'absolute', top: -28, background: 'var(--dark)', color: '#fff',
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: 1, animation: 'float 2s ease-in-out infinite', whiteSpace: 'nowrap' }}>AQUÍ</div>
      )}
      {isActive && isDoor && (
        <div style={{ position: 'absolute', top: -28, background: '#f0a500', color: '#080e08',
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: 1, animation: 'float 2s ease-in-out infinite', whiteSpace: 'nowrap' }}>ABIERTA</div>
      )}
      {isActive && isFlask && (
        <div style={{ position: 'absolute', top: -28, background: '#00ff88', color: '#020c06',
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: 1, animation: 'float 2s ease-in-out infinite', whiteSpace: 'nowrap' }}>ANALIZAR</div>
      )}
      {isActive && isPortal && (
        <div style={{ position: 'absolute', top: -28, background: '#5b8dd9', color: '#030510',
          fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          letterSpacing: 1, animation: 'float 2s ease-in-out infinite', whiteSpace: 'nowrap' }}>VIAJAR</div>
      )}
      {isActive && (
        <div style={{
          position: 'absolute',
          width: nodeSize, height: nodeSize,
          borderRadius: isDoor ? '50% 50% 6px 6px' : '50%',
          border: `3px solid ${isDoor ? '#f0a500' : isFlask ? '#00ff88' : isPortal ? '#5b8dd9' : 'var(--orange)'}`,
          animation: 'nodePing 2s ease-out infinite',
        }} />
      )}
      {/* Anillos del portal temporal (solo en time-travel, nodo available) */}
      {isPortal && status === 'available' && [1, 2].map(r => (
        <div key={r} style={{
          position: 'absolute',
          width: nodeSize + r * 18, height: nodeSize + r * 18,
          borderRadius: '50%',
          border: '1px solid rgba(91,141,217,.25)',
          animation: `nodePing ${2 + r * 0.8}s ease-out ${r * 0.5}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}
      <div className={isDoor ? `er-door-node ${status}` : isFlask ? `lab-node ${status}` : isPortal ? `tt-node ${status}` : ''}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov && status !== 'locked' ? 'scale(1.08)' : 'scale(1)',
          transition: 'all .25s ease',
          ...(portalStyle || flaskStyle || doorStyle || {
            width: nodeSize, height: nodeSize, borderRadius: '50%',
            background: colors.bg, border: `3px solid ${colors.border}`,
            boxShadow: hov && status !== 'locked' ? 'var(--sh-lg)' : colors.shadow,
          }),
        }}>
        {status === 'locked'
          ? <LockIc s={isDoor ? 22 : 26} c={isDoor ? 'rgba(240,165,0,.4)' : '#fff'} />
          : (NODE_ICONS[mod.type] || NODE_ICONS.lesson)(status)}
      </div>
      {/* Marco de puerta decorativo */}
      {isDoor && (
        <div style={{
          position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
          width: 66, height: 6, borderRadius: '0 0 4px 4px',
          background: status === 'locked' ? 'rgba(240,165,0,.1)' : 'rgba(240,165,0,.3)',
          boxShadow: status !== 'locked' ? '0 2px 8px rgba(240,165,0,.2)' : 'none',
        }} />
      )}
    </div>
  );
});

// --- Desktop: Card beside node ---
const MapCard = React.memo(({ mod, status, onClick }) => {
  const [hov, setHov] = React.useState(false);
  const El = status === 'locked' ? 'div' : 'a';
  const handleClick = (e) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onClick(mod);
  };
  return (
    <El
      href={status !== 'locked' ? hrefForMod(mod) : undefined}
      onClick={status !== 'locked' ? handleClick : undefined}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--white)', borderRadius: 16, padding: '18px 22px',
        border: mod.type === 'certificate' && status === 'completed' ? '2px solid #EBD9A0' :
                status === 'available' ? '2px solid var(--orange-pale)' :
                status === 'completed' ? '2px solid #CCFBF1' : '1px solid var(--border)',
        cursor: status === 'locked' ? 'default' : 'pointer',
        width: 280, transition: 'all .25s ease',
        transform: hov && status !== 'locked' ? 'translateY(-2px)' : 'none',
        boxShadow: hov && status !== 'locked' ? 'var(--sh-lg)' : 'var(--sh-sm)',
        opacity: status === 'locked' ? .55 : 1,
        display: 'block', textDecoration: 'none', color: 'inherit',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type],
          background: mod.type === 'certificate' ? '#FDF6E3' : mod.type === 'lesson' ? 'var(--orange-bg)' : 'var(--purple-bg)',
          padding: '3px 8px', borderRadius: 4, letterSpacing: .8,
        }}>{TYPE_LABELS[mod.type] || 'MÓDULO'}</span>
        {status === 'completed' && mod.type !== 'certificate' && <CheckIc s={14} c="var(--success)" />}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4, lineHeight: 1.3,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mod.title}</h4>
      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{mod.desc}</p>
      {mod.type === 'certificate' ? (
        status === 'completed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: '#9A7B1E' }}>
            🎓 Ver certificado <ChevRIc s={14} c="#9A7B1E" />
          </div>
        )
      ) : (
        <>
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
        </>
      )}
    </El>
  );
});

// --- Mobile: Linear list item ---
const MobileModuleRow = React.memo(({ mod, status, onClick }) => {
  const isCert = mod.type === 'certificate';
  const colors = isCert ? (CERT_NODE_COLORS[status] || CERT_NODE_COLORS.completed) : NODE_COLORS[status];
  const isActive = status === 'available';
  const El = status === 'locked' ? 'div' : 'a';
  const handleClick = (e) => {
    if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    onClick(mod);
  };
  return (
    <El
      href={status !== 'locked' ? hrefForMod(mod) : undefined}
      onClick={status !== 'locked' ? handleClick : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        borderRadius: 16, background: 'var(--white)',
        border: isCert && status === 'completed' ? '2px solid #EBD9A0' :
                isActive ? '2px solid var(--orange-pale)' : status === 'completed' ? '2px solid #CCFBF1' : '1px solid var(--border)',
        cursor: status === 'locked' ? 'default' : 'pointer',
        opacity: status === 'locked' ? .55 : 1,
        transition: 'all .2s',
        position: 'relative', textDecoration: 'none', color: 'inherit',
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
        {!isCert && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>+{mod.xp} XP</div>}
        {isCert && status === 'completed' && <div style={{ fontSize: 11, color: '#9A7B1E', marginTop: 2, fontWeight: 600 }}>Disponible</div>}
      </div>
      {status === 'available' && <ChevRIc s={18} c="var(--orange)" />}
      {status === 'completed' && !isCert && <CheckIc s={18} c="var(--success)" />}
      {status === 'completed' && isCert && <ChevRIc s={18} c="#9A7B1E" />}
      {status === 'locked' && <LockIc s={16} c="var(--subtle)" />}
    </El>
  );
});

// --- Course Selector (shown when student has multiple enrollments) ---
const CourseSelector = ({ enrollments, courses, currentId, onSelect, switching = false }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        animation: 'fadeUp .3s ease',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
          Selecciona tu curso
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          Tienes inscripción en varios cursos. ¿Cuál quieres continuar?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enrollments.map(courseId => {
            const course = courses.find(c => c.id === courseId);
            const isActive = courseId === currentId;
            return (
              <button key={courseId}
                onClick={() => !switching && onSelect(courseId)}
                disabled={switching}
                style={{
                  padding: '16px 20px', borderRadius: 12,
                  cursor: switching ? 'wait' : 'pointer', textAlign: 'left',
                  border: isActive ? '2px solid var(--orange)' : '2px solid var(--border)',
                  background: isActive ? 'rgba(232,115,44,.06)' : 'var(--bg)',
                  transition: 'all .15s', opacity: switching && !isActive ? 0.5 : 1,
                }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 2 }}>
                  {course?.name || 'Curso sin nombre'}
                </div>
                {course?.area_id && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{course.area_id}</div>
                )}
                {isActive && !switching && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Activo
                  </div>
                )}
                {switching && isActive && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Cargando...</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Main Learning Map ---
const LearningMap = () => {
  const completed       = useStore(s => s.completed);
  const xp              = useStore(s => s.xp);
  const selectedArea    = useStore(s => s.selectedArea);
  const routeConfigs    = useStore(s => s.routeConfigs);
  const courseModules   = useStore(s => s.courseModules);
  const enrolledCourseId = useStore(s => s.enrolledCourseId);
  const courses         = useStore(s => s.courses);
  const userCourses     = useStore(s => s.userCourses);
  const user            = useStore(s => s.user);
  const isMobile = useMobile();
  const [showCourseSelector, setShowCourseSelector] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);

  // Cursos entre los que el estudiante puede cambiar: SOLO los que tiene con
  // acceso activo en user_courses (el gate estricto por usuario, que se llena por
  // colegio vía autoEnroll o por usuario desde AdminUsers). Coincide exactamente
  // con la pantalla "Elige tu curso" (CourseSelection). Antes se unían las
  // matrículas de course_enrollments, lo que colaba cursos viejos/forks/migraciones
  // que el colegio ya no tiene habilitados (mostraba cursos no inscritos).
  const switchableCourseIds = React.useMemo(() => {
    const activeAccess = new Set(
      (userCourses || []).filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id)
    );
    // isBaseCourse excluye los forks (copias por colegio): son reemplazos
    // transparentes del curso padre, nunca cursos seleccionables aparte.
    return (courses || []).filter(c => isBaseCourse(c) && activeAccess.has(c.id)).map(c => c.id);
  }, [userCourses, user, courses]);

  const handleCourseSelect = React.useCallback(async (id) => {
    setSwitching(true);
    await switchCourse(id);
    setSwitching(false);
    setShowCourseSelector(false);
  }, []);

  // Si el estudiante tiene un curso inscrito → usa courseModules (sistema BD).
  // Solo cae a legacy si NO está inscrito en ningún curso.
  const routeNotPublished = enrolledCourseId && courseModules.length === 0;
  const studentModules = React.useMemo(() => {
    if (enrolledCourseId) return courseModules; // puede ser [] si aún no publicaron
    return getRouteModules(selectedArea, routeConfigs);
  }, [enrolledCourseId, courseModules, selectedArea, routeConfigs]);

  const enrolledCourse = React.useMemo(
    () => courses.find(c => c.id === enrolledCourseId),
    [courses, enrolledCourseId]
  );

  // Certificado del curso: se resuelve sobre el curso EFECTIVO (el fork del
  // colegio si existe), que es donde el tutor lo configura desde el Editor de Ruta.
  const effectiveCourseId = useStore(s => s.effectiveCourseId);
  const effectiveCourse = React.useMemo(
    () => courses.find(c => c.id === (effectiveCourseId || enrolledCourseId)),
    [courses, effectiveCourseId, enrolledCourseId]
  );
  const courseCertConfig = React.useMemo(() => getCourseCertConfig(courses, effectiveCourse), [courses, effectiveCourse]);
  const isDetective   = enrolledCourse?.theme === 'detective';
  const isEscapeRoom  = enrolledCourse?.theme === 'escape-room';
  const isLab         = enrolledCourse?.theme === 'lab';
  const isTimeTravel  = enrolledCourse?.theme === 'time-travel';
  const courseTheme   = enrolledCourse?.theme || null;

  const level = React.useMemo(() => calcLevel(xp), [xp]);
  const pct = React.useMemo(
    () => progressPct(completed, selectedArea, enrolledCourseId ? studentModules : null),
    [completed, selectedArea, studentModules, enrolledCourseId]
  );

  // Nodo virtual del certificado: se agrega al FINAL de la ruta cuando el curso
  // lo tiene habilitado (courseCertConfig.enabled). Es puramente visual — no
  // vive en course_modules ni afecta completed[]/isRouteComplete/progressPct
  // (esos siguen calculándose solo sobre studentModules, los módulos reales).
  // Su estado ('locked'/'completed') se deriva directo de pct, no de nodeStatus.
  const certNode = React.useMemo(() => {
    if (!courseCertConfig.enabled) return null;
    const i = studentModules.length;
    return {
      id: '__certificate__', type: 'certificate', ctype: null,
      title: courseCertConfig.title || courseCertConfig._displayName || 'Certificado',
      desc: 'Se genera automáticamente al completar toda la ruta.',
      xp: 0, badge: null, req: [],
      pos: { x: i % 2 === 0 ? 38 : 62, y: i },
      side: i % 2 === 0 ? 'right' : 'left',
    };
  }, [courseCertConfig, studentModules.length]);

  const displayModules = React.useMemo(
    () => certNode ? [...studentModules, certNode] : studentModules,
    [studentModules, certNode]
  );

  const handleNodeClick = React.useCallback((mod) => {
    if (mod.type === 'certificate') {
      if (pct === 100) nav('course-cert');
      return;
    }
    const status = nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
    if (status === 'locked') return;
    if (mod.type === 'final_delivery') nav('grid');
    else if (mod.type === 'lesson') nav('lesson', mod.id);
    else nav('challenge', mod.id);
  }, [completed, selectedArea, studentModules, enrolledCourseId, pct]);

  // Estado a mostrar por nodo: el certificado no participa de nodeStatus
  // (no está en studentModules), así que se deriva directo de pct.
  const displayStatus = React.useCallback((mod) => {
    if (mod.type === 'certificate') return pct === 100 ? 'completed' : 'locked';
    return nodeStatus(mod.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
  }, [completed, selectedArea, studentModules, enrolledCourseId, pct]);

  // Desktop layout constants
  const nodeSpacing = 210;
  const mapHeight = displayModules.length * nodeSpacing + 120;
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
        {showCourseSelector && switchableCourseIds.length > 1 && (
          <CourseSelector
            enrollments={switchableCourseIds}
            courses={courses}
            currentId={enrolledCourseId}
            onSelect={handleCourseSelect}
            switching={switching}
          />
        )}
        {/* Compact hero */}
        <div style={{
          margin: '12px 16px 20px', padding: '20px 20px', borderRadius: 16,
          background: 'var(--gradient)', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100,
            borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{enrolledCourse?.name || 'Tu Ruta DCE'}</div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.4)',
                  background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Cambiar
              </button>
            )}
          </div>
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

        {/* Checklist primeros pasos (hasta reclamar el bonus) */}
        <div style={{ margin: '0 16px 16px' }}>
          <FirstStepsCard modules={studentModules} />
        </div>

        {/* Linear module list (incluye el nodo de certificado al final, si el curso lo tiene habilitado) */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {routeNotPublished && (
            <div style={{ padding: '20px 16px', borderRadius: 12, border: '2px dashed var(--border)',
              background: 'var(--bg)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Ruta en preparación</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tu instructor aún no ha publicado los módulos de tu ruta. Vuelve pronto.</div>
            </div>
          )}
          {displayModules.map((mod) => (
            <MobileModuleRow key={mod.id} mod={mod} status={displayStatus(mod)} onClick={handleNodeClick} />
          ))}
        </div>
      </div>
    );
  }

  // ---- DESKTOP VIEW (original zigzag) ----
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 0 40px' }}>
      {showCourseSelector && switchableCourseIds.length > 1 && (
        <CourseSelector
          enrollments={switchableCourseIds}
          courses={courses}
          currentId={enrolledCourseId}
          onSelect={async (id) => { await switchCourse(id); setShowCourseSelector(false); }}
        />
      )}
      {/* Hero banner */}
      {isTimeTravel ? (
        /* ── Hero: Línea del Tiempo (tema Ciencias Sociales) ── */
        <div style={{
          margin: '0 24px 24px', padding: '28px 32px', borderRadius: 20,
          background: 'linear-gradient(135deg, #02030d 0%, #060820 40%, #0b0f2e 100%)',
          border: '1px solid rgba(201,162,39,.18)',
          color: '#d4c8e8', position: 'relative', overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,.95), inset 0 1px 0 rgba(201,162,39,.07), 0 0 80px rgba(91,141,217,.03)',
        }}>
          {/* Reloj de fondo */}
          <div style={{ position: 'absolute', top: -30, right: -30, fontSize: 160,
            opacity: .035, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>🕰️</div>
          {/* Anillos del portal de fondo */}
          {[120, 180, 240].map((s, i) => (
            <div key={i} style={{
              position: 'absolute', width: s, height: s, borderRadius: '50%',
              border: '1px solid rgba(91,141,217,.08)',
              top: -s/2 + 40, right: -s/2 + 50,
              animation: `nodePing ${5 + i * 2}s ease-out ${i * 1.5}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
          {/* Sello "EN MISIÓN" */}
          <div style={{ position: 'absolute', top: 16, right: 20,
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
            color: '#c9a227', border: '1.5px solid rgba(201,162,39,.35)',
            padding: '3px 8px', borderRadius: 3, opacity: .75, transform: 'rotate(-2deg)' }}>
            VIAJE ACTIVO
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(201,162,39,.7)',
              textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>
              ⏳ {enrolledCourse?.name || 'Viajeros del Tiempo — Ciencias Sociales'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#d4c8e8',
              textShadow: '0 0 24px rgba(201,162,39,.2)' }}>
              Línea del Tiempo
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(212,200,232,.6)', maxWidth: 380, lineHeight: 1.6 }}>
              Cada módulo te transporta a una nueva época. Completa el viaje y regresa al presente con el conocimiento de la historia.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
            {/* Épocas exploradas */}
            <div style={{ background: 'rgba(201,162,39,.07)', border: '1px solid rgba(201,162,39,.2)',
              borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#c9a227',
                textShadow: '0 0 12px rgba(201,162,39,.4)' }}>
                {completed.filter(id => studentModules.find(m => m.id === id)).length}
                <span style={{ fontSize: 14, color: 'rgba(201,162,39,.35)' }}>/{studentModules.length}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(201,162,39,.6)',
                textTransform: 'uppercase', marginTop: 2 }}>Épocas exploradas</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(201,162,39,.06)', border: '1px solid rgba(201,162,39,.12)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d4c8e8' }}>{xp}</div>
                <div style={{ fontSize: 9, color: 'rgba(212,200,232,.4)', letterSpacing: 1 }}>XP</div>
              </div>
              <div style={{ background: 'rgba(91,141,217,.06)', border: '1px solid rgba(91,141,217,.12)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d4c8e8' }}>Nv.{level}</div>
                <div style={{ fontSize: 9, color: 'rgba(212,200,232,.4)', letterSpacing: 1 }}>ERA</div>
              </div>
            </div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(201,162,39,.3)',
                  background: 'rgba(201,162,39,.07)', color: 'rgba(201,162,39,.8)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Cambiar época
              </button>
            )}
          </div>
        </div>
      ) : isLab ? (
        /* ── Hero: Laboratorio de Ciencias ── */
        <div style={{
          margin: '0 24px 24px', padding: '28px 32px', borderRadius: 20,
          background: 'linear-gradient(135deg, #020c06 0%, #041408 40%, #071a0e 100%)',
          border: '1px solid rgba(0,255,136,.18)',
          color: '#c0f0d8', position: 'relative', overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,.9), inset 0 1px 0 rgba(0,255,136,.07), 0 0 60px rgba(0,255,136,.04)',
        }}>
          {/* Átomo decorativo de fondo */}
          <div style={{ position: 'absolute', top: -30, right: -30, fontSize: 160,
            opacity: .04, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>⚗️</div>
          {/* Sello "EXPERIMENTO ACTIVO" */}
          <div style={{ position: 'absolute', top: 16, right: 20,
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
            color: '#00ff88', border: '1.5px solid rgba(0,255,136,.35)',
            padding: '3px 8px', borderRadius: 3, opacity: .75, transform: 'rotate(-2deg)' }}>
            EXPERIMENTO ACTIVO
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(0,255,136,.7)',
              textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>
              🔬 {enrolledCourse?.name || 'Laboratorio de Ciencias Naturales'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#c0f0d8',
              textShadow: '0 0 24px rgba(0,255,136,.2)' }}>
              Mesa de Trabajo
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(192,240,216,.6)', maxWidth: 380, lineHeight: 1.6 }}>
              Cada módulo es un experimento. Observa, formula hipótesis, experimenta y concluye para avanzar al siguiente nivel.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
            {/* Muestras analizadas */}
            <div style={{ background: 'rgba(0,255,136,.08)', border: '1px solid rgba(0,255,136,.2)',
              borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 140 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#00ff88',
                textShadow: '0 0 12px rgba(0,255,136,.5)' }}>
                {completed.filter(id => studentModules.find(m => m.id === id)).length}
                <span style={{ fontSize: 14, color: 'rgba(0,255,136,.35)' }}>/{studentModules.length}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(0,255,136,.6)',
                textTransform: 'uppercase', marginTop: 2 }}>Experimentos completados</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.12)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#c0f0d8' }}>{xp}</div>
                <div style={{ fontSize: 9, color: 'rgba(192,240,216,.4)', letterSpacing: 1 }}>XP</div>
              </div>
              <div style={{ background: 'rgba(0,255,136,.06)', border: '1px solid rgba(0,255,136,.12)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#c0f0d8' }}>Nv.{level}</div>
                <div style={{ fontSize: 9, color: 'rgba(192,240,216,.4)', letterSpacing: 1 }}>GRADO</div>
              </div>
            </div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(0,255,136,.3)',
                  background: 'rgba(0,255,136,.07)', color: 'rgba(0,255,136,.8)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Cambiar lab
              </button>
            )}
          </div>
        </div>
      ) : isEscapeRoom ? (
        /* ── Hero: Sala de Escape (tema Matemáticas) ── */
        <div style={{
          margin: '0 24px 24px', padding: '28px 32px', borderRadius: 20,
          background: 'linear-gradient(135deg, #060a06 0%, #0d1a0d 40%, #101c0a 100%)',
          border: '1px solid rgba(240,165,0,.2)',
          color: '#d8ccaa', position: 'relative', overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,.85), inset 0 1px 0 rgba(240,165,0,.08)',
        }}>
          {/* Engranaje de fondo */}
          <div style={{ position: 'absolute', top: -40, right: -40, fontSize: 160,
            opacity: .04, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>⚙️</div>
          {/* Sello "MISIÓN ACTIVA" */}
          <div style={{ position: 'absolute', top: 16, right: 20,
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
            color: '#f0a500', border: '1.5px solid rgba(240,165,0,.35)',
            padding: '3px 8px', borderRadius: 3, opacity: .75, transform: 'rotate(2deg)' }}>
            MISIÓN ACTIVA
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(240,165,0,.7)',
              textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>
              🔐 {enrolledCourse?.name || 'Sala de Escape — Matemáticas'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#d8ccaa' }}>
              Panel de Control
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(216,204,170,.6)', maxWidth: 380, lineHeight: 1.6 }}>
              Cada módulo es una puerta cerrada. Resuelve el acertijo, abre la sala y avanza hacia la llave maestra.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
            {/* Puertas abiertas */}
            <div style={{ background: 'rgba(240,165,0,.08)', border: '1px solid rgba(240,165,0,.2)',
              borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f0a500' }}>
                {completed.filter(id => studentModules.find(m => m.id === id)).length}
                <span style={{ fontSize: 14, color: 'rgba(240,165,0,.4)' }}>/{studentModules.length}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(240,165,0,.6)',
                textTransform: 'uppercase', marginTop: 2 }}>Puertas abiertas</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(240,165,0,.08)', border: '1px solid rgba(240,165,0,.15)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d8ccaa' }}>{xp}</div>
                <div style={{ fontSize: 9, color: 'rgba(216,204,170,.4)', letterSpacing: 1 }}>XP</div>
              </div>
              <div style={{ background: 'rgba(240,165,0,.08)', border: '1px solid rgba(240,165,0,.15)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d8ccaa' }}>Nv.{level}</div>
                <div style={{ fontSize: 9, color: 'rgba(216,204,170,.4)', letterSpacing: 1 }}>RANGO</div>
              </div>
            </div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(240,165,0,.3)',
                  background: 'rgba(240,165,0,.08)', color: 'rgba(240,165,0,.8)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Cambiar sala
              </button>
            )}
          </div>
        </div>
      ) : isDetective ? (
        /* ── Hero: Tablero del Caso (tema Detective) ── */
        <div style={{
          margin: '0 24px 24px', padding: '28px 32px', borderRadius: 20,
          background: 'linear-gradient(125deg, #0A0806 0%, #1C1508 40%, #2A1E0A 100%)',
          border: '1px solid rgba(212,160,23,.25)',
          color: '#EDE8DC', position: 'relative', overflow: 'hidden',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 24, animation: 'det-reveal .6s ease',
          boxShadow: '0 8px 40px rgba(0,0,0,.8), inset 0 1px 0 rgba(212,160,23,.1)',
        }}>
          {/* Marca de agua: lupa */}
          <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 140,
            opacity: .04, userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>🔍</div>
          {/* Sello CASO ACTIVO */}
          <div style={{ position: 'absolute', top: 16, right: 20,
            fontSize: 9, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
            color: '#D4A017', border: '1.5px solid rgba(212,160,23,.4)',
            padding: '3px 8px', borderRadius: 3, opacity: .7, transform: 'rotate(2deg)' }}>
            CASO ACTIVO
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(212,160,23,.7)',
              textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>
              🕵️ {enrolledCourse?.name || 'Detectives de Texto'}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#EDE8DC' }}>
              Tablero de Investigación
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(237,232,220,.6)', maxWidth: 380, lineHeight: 1.6 }}>
              Cada módulo es una pista. Cada reto, una evidencia. Resuelve el caso completando todas las investigaciones.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
            {/* Evidencias recolectadas */}
            <div style={{ background: 'rgba(212,160,23,.08)', border: '1px solid rgba(212,160,23,.2)',
              borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#D4A017' }}>
                {completed.filter(id => studentModules.find(m => m.id === id)).length}
                <span style={{ fontSize: 14, color: 'rgba(212,160,23,.5)' }}>/{studentModules.length}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(212,160,23,.6)',
                textTransform: 'uppercase', marginTop: 2 }}>Evidencias</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(212,160,23,.08)', border: '1px solid rgba(212,160,23,.15)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#EDE8DC' }}>{xp}</div>
                <div style={{ fontSize: 9, color: 'rgba(237,232,220,.4)', letterSpacing: 1 }}>XP</div>
              </div>
              <div style={{ background: 'rgba(212,160,23,.08)', border: '1px solid rgba(212,160,23,.15)',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#EDE8DC' }}>Nv.{level}</div>
                <div style={{ fontSize: 9, color: 'rgba(237,232,220,.4)', letterSpacing: 1 }}>RANGO</div>
              </div>
            </div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(212,160,23,.3)',
                  background: 'rgba(212,160,23,.08)', color: 'rgba(212,160,23,.8)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Cambiar caso
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Hero estándar ── */
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <StatChip icon={<ProgressRing pct={pct} size={28} sw={3} color="rgba(255,255,255,.9)" />} label="Progreso" value={pct + '%'} />
              <StatChip icon={<ZapIc s={18} c="var(--orange-light)" />} label="XP" value={xp} />
              <StatChip icon={<TargetIc s={18} c="var(--orange-light)" />} label="Nivel" value={level} />
            </div>
            {switchableCourseIds.length > 1 && (
              <button onClick={() => setShowCourseSelector(true)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,.5)',
                  background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font)', backdropFilter: 'blur(4px)' }}>
                Cambiar curso
              </button>
            )}
          </div>
        </div>
      )}

      {/* Checklist primeros pasos (hasta reclamar el bonus) */}
      <div style={{ margin: '0 24px 24px' }}>
        <FirstStepsCard modules={studentModules} />
      </div>

      {/* Ruta no publicada aún */}
      {routeNotPublished && (
        <div style={{ maxWidth: 500, margin: '40px auto', padding: '32px 24px', borderRadius: 16,
          border: '2px dashed var(--border)', background: 'var(--white)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Ruta en preparación</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Tu instructor aún no ha publicado los módulos de tu ruta de formación.<br/>Vuelve pronto.
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ position: 'relative', width: mapWidth, maxWidth: '100%', height: mapHeight, margin: '0 auto' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {displayModules.slice(0, -1).map((mod, i) => {
            const p1 = getNodePos(mod, i);
            const p2 = getNodePos(displayModules[i + 1], i + 1);
            const active = displayStatus(mod) === 'completed';
            return (
              <path key={i} d={genPath(p1, p2)}
                fill="none" stroke={active ? 'var(--success)' : 'var(--border)'}
                strokeWidth={3} strokeLinecap="round"
                strokeDasharray={active ? 'none' : '8 6'}
                style={{ transition: 'stroke .4s ease' }} />
            );
          })}
        </svg>

        {displayModules.map((mod, i) => {
          const pos = getNodePos(mod, i);
          const status = displayStatus(mod);
          const cardOnLeft = mod.side === 'left' || (mod.pos?.x || 50) > 50;
          // Nodo y tarjeta anclados al MISMO pos.y con la MISMA técnica de
          // centrado (flex + height:0 + alignItems:center), para que sea
          // imposible que se desalineen entre sí: antes el nodo usaba
          // aritmética fija (pos.y - 36, mitad de sus 72px) y la tarjeta
          // "transform: translateY(-50%)" sobre su altura real renderizada
          // (variable según el largo del título/descripción) — dos métodos
          // distintos que podían quedar desfasados por 1-2px según el
          // contenido. Con height:0 + alignItems:center ambos se centran
          // exactamente sobre la misma línea horizontal (pos.y), sin
          // depender de la altura de ninguno de los dos.
          return (
            <React.Fragment key={mod.id}>
              <div style={{ position: 'absolute', left: pos.x - 36, top: pos.y, height: 0,
                width: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapNode mod={mod} status={status} index={i} onClick={handleNodeClick} courseTheme={courseTheme} />
              </div>
              <div style={{
                position: 'absolute', top: pos.y, height: 0, display: 'flex', alignItems: 'center',
                ...(cardOnLeft ? { left: pos.x - 56 - 280 } : { left: pos.x + 56 }),
                animation: `${cardOnLeft ? 'slideL' : 'slideR'} .4s ${i * 80 + 100}ms ease both`,
              }}>
                <MapCard mod={mod} status={status} onClick={handleNodeClick} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LearningMap;
