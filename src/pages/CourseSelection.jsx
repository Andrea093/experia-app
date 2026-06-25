import React from 'react'
import { useStore, nav, enrollInCourse } from '../store/store.jsx'
import { useMobile, LogoImg, Btn } from '../components/ui.jsx'

const CourseSelection = () => {
  const courses            = useStore(s => s.courses || []);
  const userCourses        = useStore(s => s.userCourses || []);
  const user               = useStore(s => s.user);
  const isMobile           = useMobile();
  const [pending, setPending]   = React.useState(null);
  const [enrolling, setEnrolling] = React.useState(false);

  // Cursos disponibles: activos globalmente + asignados a ESTE usuario (acceso estricto)
  const availableCourses = React.useMemo(() => {
    const allowed = new Set(
      userCourses.filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id)
    );
    return courses.filter(c => c.is_active && allowed.has(c.id));
  }, [courses, userCourses, user]);

  const handleConfirm = async () => {
    if (!pending) return;
    setEnrolling(true);
    await enrollInCourse(pending.id);
    setEnrolling(false);
    nav('map');
  };

  if (availableCourses.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)', padding: 32 }}>
        <span style={{ fontSize: 48 }}>📚</span>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>Sin cursos disponibles</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', maxWidth: 360 }}>
          Tu institución aún no tiene cursos habilitados. Contacta a tu instructor o administrador.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: isMobile ? 20 : 48, background: 'var(--bg)', overflow: 'auto' }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
            <LogoImg h={32} />
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>
            Elige tu curso
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Selecciona la ruta de formación en la que quieres inscribirte.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {availableCourses.map(course => (
            <button key={course.id} onClick={() => setPending(course)}
              style={{ padding: '24px 20px', borderRadius: 18, border: `2px solid ${pending?.id === course.id ? (course.color || 'var(--orange)') : 'var(--border)'}`,
                background: pending?.id === course.id ? (course.color || 'var(--orange)') + '12' : 'var(--white)',
                cursor: 'pointer', textAlign: 'left', transition: 'all .2s', fontFamily: 'var(--font)',
                boxShadow: pending?.id === course.id ? `0 8px 24px ${course.color || 'var(--orange)'}25` : 'var(--sh-sm)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: (course.color || 'var(--orange)') + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>
                {course.cover_image ? <img src={course.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : '📖'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>{course.name}</div>
              {course.description && <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{course.description}</div>}
            </button>
          ))}
        </div>

        {pending && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Btn variant="secondary" onClick={() => setPending(null)}>Cancelar</Btn>
            <Btn variant="gradient" disabled={enrolling} onClick={handleConfirm}>
              {enrolling ? '⏳ Inscribiendo...' : `Inscribirme en "${pending.name}"`}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseSelection;
