import React from 'react'
import { useStore, AREAS, gradeTotal, gradeMax } from '../store/store.jsx'
import { useMobile, BarIc, UsersIc, CheckIc, ClockIc, TrophyIc, ZapIc } from '../components/ui.jsx'

// ── Mini bar chart ────────────────────────────────────────────
const Bar = ({ label, value, max, color, icon, sub }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon && <span>{icon}</span>}{label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {value}{sub ? ` ${sub}` : ''}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-alt)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 5, background: color, width: pct + '%',
          transition: 'width .8s ease' }} />
      </div>
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────────
const Stat = ({ label, value, color, icon }) => (
  <div style={{ padding: '18px 20px', borderRadius: 14, background: 'var(--white)',
    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
    </div>
  </div>
)

// ── Donut chart (CSS) ─────────────────────────────────────────
const Donut = ({ segments, size = 120 }) => {
  let offset = 0
  const r = 40, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * c
        const el = (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dasharray .8s ease' }}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

export default function AdminAnalytics() {
  const accounts       = useStore(s => s.accounts)
  const submissions    = useStore(s => s.submissions)
  const attempts       = useStore(s => s.challengeAttempts)
  const institutions   = useStore(s => s.institutions)
  const isMobile       = useMobile()

  const students    = accounts.filter(a => a.role === 'student')
  const instructors = accounts.filter(a => a.role === 'instructor')

  // Submissions stats
  const approved  = submissions.filter(s => s.status === 'approved')
  const pending   = submissions.filter(s => s.status === 'pending' || !s.status)
  const returned  = submissions.filter(s => s.status === 'returned')
  const graded    = submissions.filter(s => s.grade && s.status !== 'approved')

  const avgGrade  = approved.length
    ? Math.round(approved.reduce((a, s) => a + gradeTotal(s.grade), 0) / approved.length)
    : 0

  // Completion by area
  const byArea = AREAS.map(a => {
    const areaStudents = students.filter(st => st.area === a.id)
    const approved     = submissions.filter(s => s.area === a.id && s.status === 'approved').length
    return { ...a, students: areaStudents.length, approved }
  })

  // By institution
  const byInst = institutions.map(inst => ({
    ...inst,
    students: students.filter(s => s.institution === inst.name).length,
    approved: submissions.filter(s =>
      students.find(st => st.email === s.studentEmail)?.institution === inst.name
      && s.status === 'approved'
    ).length,
  })).filter(i => i.students > 0)

  // Challenge avg score
  const challengeAvg = attempts.length
    ? Math.round(attempts.reduce((a, t) => a + (t.score / t.maxScore) * 100, 0) / attempts.length)
    : 0

  // Donut segments for submission status
  const total = submissions.length || 1
  const donutSegs = [
    { pct: Math.round(approved.length / total * 100),  color: 'var(--success)' },
    { pct: Math.round(graded.length   / total * 100),  color: '#3B82F6' },
    { pct: Math.round(returned.length / total * 100),  color: 'var(--warn)' },
    { pct: Math.round(pending.length  / total * 100),  color: 'var(--border)' },
  ]

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>
          Dashboard de Analítica
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Visión global del desempeño de la plataforma
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 180}px, 1fr))`, gap: 12, marginBottom: 28 }}>
        <Stat label="Docentes registrados" value={students.length}    color="var(--orange)"  icon="👩‍🏫" />
        <Stat label="Instructores"          value={instructors.length} color="var(--success)" icon="🎓" />
        <Stat label="Instituciones"         value={institutions.length} color="var(--purple)" icon="🏫" />
        <Stat label="Entregas aprobadas"    value={approved.length}    color="var(--success)" icon="✅" />
        <Stat label="Intentos de retos"     value={attempts.length}    color="var(--warn)"    icon="⚡" />
        <Stat label="Promedio rúbrica"      value={`${avgGrade}/${gradeMax()}`} color="var(--orange)" icon="📊" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Completion by area */}
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
            Completitud por área
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            Docentes con proyecto aprobado / total en el área
          </p>
          {byArea.map(a => (
            <Bar key={a.id} label={`${a.icon} ${a.name}`}
              value={a.approved} max={Math.max(a.students, 1)}
              color={a.color}
              sub={`/ ${a.students}`}
            />
          ))}
        </div>

        {/* Status de entregas + donut */}
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 20 }}>
            Estado de entregas
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20, justifyContent: 'center' }}>
            <Donut segments={donutSegs} size={140} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Aprobadas',  value: approved.length,  color: 'var(--success)' },
                { label: 'Calificadas', value: graded.length,   color: '#3B82F6' },
                { label: 'Devueltas',  value: returned.length,  color: 'var(--warn)' },
                { label: 'Pendientes', value: pending.length,   color: 'var(--muted)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color, marginLeft: 'auto' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg)',
            border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Promedio en retos</div>
            <div style={{ fontSize: 24, fontWeight: 800,
              color: challengeAvg >= 75 ? 'var(--success)' : challengeAvg >= 50 ? 'var(--warn)' : 'var(--error)' }}>
              {challengeAvg}%
            </div>
          </div>
        </div>
      </div>

      {/* By institution */}
      {byInst.length > 0 && (
        <div style={{ padding: 24, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
            Desempeño por institución
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            Proyectos aprobados sobre total de docentes
          </p>
          {byInst.map(inst => (
            <Bar key={inst.id} icon="🏫" label={inst.name}
              value={inst.approved} max={Math.max(inst.students, 1)}
              color="var(--purple)"
              sub={`aprobados / ${inst.students} docentes`}
            />
          ))}
        </div>
      )}

      {submissions.length === 0 && attempts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)', fontSize: 14,
          background: 'var(--white)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          Los datos aparecerán aquí cuando los docentes comiencen su formación.
        </div>
      )}
    </div>
  )
}
