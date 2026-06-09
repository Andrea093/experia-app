import React from 'react'
import { useStore, getStudentModules, nodeStatus, nav } from '../store/store.jsx'
import { useMobile, CheckIc, ZapIc } from '../components/ui.jsx'

const GamesPage = () => {
  const completed      = useStore(s => s.completed);
  const selectedArea   = useStore(s => s.selectedArea);
  const courseModules  = useStore(s => s.courseModules);
  const enrolledCourseId = useStore(s => s.enrolledCourseId);
  const isMobile = useMobile();
  const studentModules = React.useMemo(
    () => (enrolledCourseId && courseModules.length > 0) ? courseModules : getStudentModules(selectedArea),
    [enrolledCourseId, courseModules, selectedArea]
  );
  const challenges = React.useMemo(() => studentModules.filter(m => m.type === 'challenge' || m.type === 'evaluation'), [studentModules]);
  const typeIcons = { dragdrop: '🧩', empathy: '🗺️', simulation: '🎭', matching: '🔗', designlab: '🏗️' };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Juegos y evaluaciones</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Retos interactivos para poner a prueba lo aprendido</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? 12 : 16 }}>
        {challenges.map((ch) => {
          const status = nodeStatus(ch.id, completed, selectedArea, enrolledCourseId ? studentModules : null);
          return (
            <div key={ch.id} onClick={() => status !== 'locked' && nav('challenge', ch.id)}
              style={{ padding: isMobile ? '18px' : '24px', borderRadius: 16, background: 'var(--white)',
                border: status === 'available' ? '2px solid var(--orange-pale)' : status === 'completed' ? '2px solid #D1FAE5' : '1px solid var(--border)',
                cursor: status === 'locked' ? 'default' : 'pointer', opacity: status === 'locked' ? .5 : 1, transition: 'all .25s',
                display: isMobile ? 'flex' : 'block', alignItems: isMobile ? 'center' : undefined, gap: isMobile ? 14 : 0 }}
              onMouseEnter={e => status !== 'locked' && !isMobile && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.transform = 'none')}>
              <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: isMobile ? 0 : 12, flexShrink: 0 }}>
                {status === 'locked' ? '🔒' : (typeIcons[ch.ctype] || '🏆')}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', background: 'var(--purple-bg)',
                  padding: '3px 8px', borderRadius: 4, letterSpacing: .8, display: 'inline-block', marginBottom: 6 }}>{ch.subtitle}</span>
                <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{ch.title}</h3>
                {!isMobile && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{ch.desc}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: isMobile ? 4 : 12 }}>
                  <ZapIc s={14} c="var(--orange)" />
                  <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>+{ch.xp} XP</span>
                  {status === 'completed' && <CheckIc s={14} c="var(--success)" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamesPage;
