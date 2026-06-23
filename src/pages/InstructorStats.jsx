import React from 'react'
import { useStore, AREAS, findModule, gradeTotal, gradeMax } from '../store/store.jsx'
import { useMobile, UsersIc, CheckIc, ClockIc, ZapIc, ChevRIc, BarIc } from '../components/ui.jsx'

const InstructorStatsPage = () => {
  const submissions = useStore(s => s.submissions);
  const attempts = useStore(s => s.challengeAttempts);
  const [activeArea, setActiveArea] = React.useState('all');
  const [expandedChallenge, setExpandedChallenge] = React.useState(null);
  const isMobile = useMobile();

  const graded = React.useMemo(() => submissions.filter(s => s.grade), [submissions]);
  const avgScore = React.useMemo(() => graded.length > 0
    ? Math.round(graded.reduce((a, s) => a + gradeTotal(s.grade), 0) / graded.length) : 0, [graded]);
  const filteredAttempts = React.useMemo(() =>
    activeArea === 'all' ? attempts : attempts.filter(a => a.area === activeArea), [attempts, activeArea]);

  const attemptCountByArea = React.useMemo(() => {
    const map = {};
    AREAS.forEach(a => { map[a.id] = 0; });
    attempts.forEach(att => { if (map[att.area] !== undefined) map[att.area]++; });
    return map;
  }, [attempts]);

  const byChallengeList = React.useMemo(() => {
    const byChallengeMap = {};
    filteredAttempts.forEach(a => {
      if (!byChallengeMap[a.challengeId]) byChallengeMap[a.challengeId] = [];
      byChallengeMap[a.challengeId].push(a);
    });
    return Object.entries(byChallengeMap).map(([cId, atts]) => {
      const mod = findModule(cId);
      const avgPct = atts.length > 0 ? Math.round(atts.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / atts.length) : 0;
      const qMap = {};
      atts.forEach(att => {
        att.questions.forEach(q => {
          if (!qMap[q.q]) qMap[q.q] = { q: q.q, total: 0, correct: 0 };
          qMap[q.q].total++;
          if (q.correct) qMap[q.q].correct++;
        });
      });
      const questions = Object.values(qMap).map(q => ({ ...q, pct: Math.round((q.correct / q.total) * 100) })).sort((a, b) => a.pct - b.pct);
      return { id: cId, mod, atts, avgPct, questions };
    });
  }, [filteredAttempts]);

  const hardestQuestions = React.useMemo(() => {
    const allQMap = {};
    filteredAttempts.forEach(att => {
      att.questions.forEach(q => {
        if (!allQMap[q.q]) allQMap[q.q] = { q: q.q, total: 0, correct: 0, challengeId: att.challengeId, area: att.area };
        allQMap[q.q].total++;
        if (q.correct) allQMap[q.q].correct++;
      });
    });
    return Object.values(allQMap).map(q => ({ ...q, pct: Math.round((q.correct / q.total) * 100) }))
      .filter(q => q.total >= 1).sort((a, b) => a.pct - b.pct).slice(0, 10);
  }, [filteredAttempts]);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Estadísticas Detalladas</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Análisis de desempeño por reto y por pregunta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 160}px, 1fr))`, gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Entregas totales', value: submissions.length, color: 'var(--purple)' },
          { label: 'Calificadas', value: graded.length, color: 'var(--success)' },
          { label: 'Promedio rúbrica', value: avgScore + '/' + gradeMax(), color: 'var(--orange)' },
          { label: 'Intentos de retos', value: filteredAttempts.length, color: 'var(--warn)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveArea('all')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
          background: activeArea === 'all' ? 'var(--dark)' : 'var(--bg-alt)', color: activeArea === 'all' ? '#fff' : 'var(--muted)' }}>
          Todas
        </button>
        {AREAS.map(a => {
          const count = attemptCountByArea[a.id] ?? 0;
          return (
            <button key={a.id} onClick={() => setActiveArea(a.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600,
              background: activeArea === a.id ? a.color + '18' : 'var(--bg-alt)', color: activeArea === a.id ? a.color : 'var(--muted)' }}>
              {a.icon} {isMobile ? '' : a.name + ' '}({count})
            </button>
          );
        })}
      </div>

      <div style={{ padding: '24px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Preguntas con más errores</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Ordenadas de menor a mayor acierto.</p>
        {hardestQuestions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>No hay datos aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hardestQuestions.map((q, i) => {
              const area = AREAS.find(a => a.id === q.area);
              const barColor = q.pct >= 75 ? 'var(--success)' : q.pct >= 50 ? 'var(--warn)' : 'var(--error)';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 36, textAlign: 'right' }}>{q.pct}%</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-alt)', overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', borderRadius: 4, width: q.pct + '%', background: barColor }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {area && <span style={{ fontSize: 12 }}>{area.icon}</span>}
                      <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--dark)', fontWeight: 500 }}>{q.q}</span>
                      <span style={{ fontSize: 10, color: 'var(--subtle)' }}>({q.correct}/{q.total})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Detalle por reto</h3>
        {byChallengeList.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>No hay intentos registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {byChallengeList.map(ch => {
              const isExpanded = expandedChallenge === ch.id;
              return (
                <div key={ch.id} style={{ borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <button onClick={() => setExpandedChallenge(isExpanded ? null : ch.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px',
                      border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', textAlign: 'left' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: ch.avgPct >= 75 ? '#CCFBF1' : ch.avgPct >= 50 ? '#FEF3C7' : '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                      color: ch.avgPct >= 75 ? 'var(--success)' : ch.avgPct >= 50 ? 'var(--warn)' : 'var(--error)' }}>
                      {ch.avgPct}%
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.mod?.title || ch.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ch.atts.length} intentos · Promedio {ch.avgPct}%</div>
                    </div>
                    <ChevRIc s={18} c="var(--muted)" />
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, margin: '16px 0 10px' }}>
                        Intentos por estudiante
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {ch.atts.map((att, ai) => (
                          <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--orange-bg)', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>
                              {att.studentName.charAt(0)}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.studentName}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: att.score / att.maxScore >= .75 ? 'var(--success)' : 'var(--warn)', whiteSpace: 'nowrap' }}>
                              {att.score}/{att.maxScore}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
                        Preguntas — tasa de acierto
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ch.questions.map((q, qi) => {
                          const barColor = q.pct >= 75 ? 'var(--success)' : q.pct >= 50 ? 'var(--warn)' : 'var(--error)';
                          return (
                            <div key={qi}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                                <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--dark)', fontWeight: 500, flex: 1 }}>{q.q}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>{q.pct}%</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, width: q.pct + '%', background: barColor }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: '24px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Entregas por área</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AREAS.map(area => {
            const areaSubs = submissions.filter(s => s.area === area.id);
            const areaGraded = areaSubs.filter(s => s.grade);
            const pct = submissions.length > 0 ? Math.round(areaSubs.length / submissions.length * 100) : 0;
            return (
              <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{area.icon}</span>
                {!isMobile && <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600, minWidth: 180 }}>{area.name}</span>}
                <div style={{ flex: 1, height: 20, borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, width: pct + '%', background: area.color }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--dark)', minWidth: 50, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {areaSubs.length} ({areaGraded.length})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstructorStatsPage;
