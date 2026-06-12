import React from 'react'
import { useStore, getStudentModules, nodeStatus, nav, hashFor } from '../store/store.jsx'
import { useMobile, CheckIc, ZapIc, StarIc } from '../components/ui.jsx'

const GamesPage = () => {
  const completed        = useStore(s => s.completed);
  const selectedArea     = useStore(s => s.selectedArea);
  const courseModules    = useStore(s => s.courseModules);
  const enrolledCourseId = useStore(s => s.enrolledCourseId);
  const challengeAttempts = useStore(s => s.challengeAttempts);
  const isMobile = useMobile();

  const studentModules = React.useMemo(
    () => (enrolledCourseId && courseModules.length > 0) ? courseModules : getStudentModules(selectedArea),
    [enrolledCourseId, courseModules, selectedArea]
  );

  const challenges = React.useMemo(
    () => studentModules.filter(m => m.type === 'challenge' || m.type === 'evaluation'),
    [studentModules]
  );

  // Best score per challenge (highest score ratio)
  const bestScores = React.useMemo(() => {
    const map = {};
    (challengeAttempts || []).forEach(a => {
      if (!a.module_id) return;
      const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : null;
      if (pct === null) return;
      if (map[a.module_id] === undefined || pct > map[a.module_id]) map[a.module_id] = pct;
    });
    return map;
  }, [challengeAttempts]);

  const typeIcons = {
    dragdrop:   '🧩',
    empathy:    '🗺️',
    simulation: '🎭',
    matching:   '🔗',
    designlab:  '🏗️',
    quiz:       '❓',
  };

  const typeLabels = {
    dragdrop:   'Arrastra y ordena',
    empathy:    'Mapa de empatía',
    simulation: 'Simulación',
    matching:   'Conecta conceptos',
    designlab:  'Lab de diseño',
    quiz:       'Pregunta rápida',
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
          Juegos y evaluaciones
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Retos interactivos para poner a prueba lo aprendido</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: isMobile ? 12 : 16,
      }}>
        {challenges.map((ch) => {
          const status = nodeStatus(ch.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
          const isLocked = status === 'locked';
          const isDone   = status === 'completed';
          const score    = bestScores[ch.id];
          const href     = !isLocked ? hashFor('challenge', ch.id) : undefined;
          const El       = isLocked ? 'div' : 'a';

          const handleClick = (e) => {
            if (isLocked) return;
            if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) return;
            e.preventDefault();
            nav('challenge', ch.id);
          };

          return (
            <El
              key={ch.id}
              href={href}
              onClick={handleClick}
              style={{
                padding: isMobile ? '18px' : '24px',
                borderRadius: 16,
                background: 'var(--white)',
                border: isDone
                  ? '2px solid #D1FAE5'
                  : status === 'available'
                  ? '2px solid var(--orange-pale)'
                  : '1px solid var(--border)',
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all .25s',
                display: isMobile ? 'flex' : 'block',
                alignItems: isMobile ? 'center' : undefined,
                gap: isMobile ? 14 : 0,
                textDecoration: 'none',
                color: 'inherit',
              }}
              onMouseEnter={e => { if (!isLocked && !isMobile) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { if (!isMobile) e.currentTarget.style.transform = 'none'; }}
            >
              {/* Icon */}
              <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: isMobile ? 0 : 10, flexShrink: 0 }}>
                {isLocked ? '🔒' : (typeIcons[ch.ctype] || '🏆')}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: 'var(--purple)',
                    background: 'var(--purple-bg)', padding: '3px 8px',
                    borderRadius: 4, letterSpacing: 0.8, display: 'inline-block',
                  }}>
                    {typeLabels[ch.ctype] || ch.subtitle}
                  </span>
                  {isDone && score !== undefined && (
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--error)',
                      background: score >= 80 ? 'var(--success-bg)' : score >= 50 ? 'var(--warn-bg)' : 'var(--error-bg)',
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {score}%
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
                  {ch.title}
                </h3>

                {!isMobile && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{ch.desc}</p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: isMobile ? 4 : 0 }}>
                  <ZapIc s={14} c="var(--orange)" />
                  <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>+{ch.xp} XP</span>
                  {isDone && <CheckIc s={14} c="var(--success)" />}
                  {isDone && score !== undefined && score < 80 && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>· Inténtalo de nuevo</span>
                  )}
                </div>
              </div>
            </El>
          );
        })}
      </div>
    </div>
  );
};

export default GamesPage;
