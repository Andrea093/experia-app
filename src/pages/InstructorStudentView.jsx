import React from 'react'
import {
  useStore, AREAS, BADGES, ALL_MODULES, getStudentModules,
  gradeTotal, gradeMax, calcLevel, xpForNext,
} from '../store/store.jsx'
import {
  useMobile, CheckIc, ClockIc, ZapIc, AwardIc, XIc,
  ProgressBar, ProgressRing, BadgeCard, Modal,
} from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'

// ── Active students (presencia en tiempo real) ─────────────
export function ActiveStudents() {
  const accounts = useStore(s => s.accounts)
  const [active, setActive] = React.useState([])

  const load = React.useCallback(async () => {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString() // últimos 10 min
    const { data } = await supabase
      .from('profiles')
      .select('email, name, avatar, current_module, last_seen, area')
      .eq('role', 'student')
      .gte('last_seen', since)
      .order('last_seen', { ascending: false })
    setActive(data || [])
  }, [])

  // Cargar al montar y suscribirse a cambios en tiempo real
  React.useEffect(() => {
    load()
    const channel = supabase.channel('presence-tracker')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'role=eq.student' },
        () => load()
      )
      .subscribe()
    const interval = setInterval(load, 30_000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [load])

  const isMobile = useMobile()

  const minutesAgo = (iso) => {
    if (!iso) return null
    return Math.floor((Date.now() - new Date(iso)) / 60000)
  }

  if (active.length === 0) return (
    <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--bg)',
      border:'1px solid var(--border)', marginBottom:20,
      display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--subtle)' }} />
      <span style={{ fontSize:13, color:'var(--muted)' }}>
        Sin docentes activos en este momento
      </span>
    </div>
  )

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)',
          animation:'pulse 2s infinite', boxShadow:'0 0 0 0 rgba(16,185,129,.4)' }} />
        <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}`}</style>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>
          {active.length} docente{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''} ahora
        </span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {active.map(s => {
          const area = AREAS.find(a => a.id === s.area)
          const min  = minutesAgo(s.last_seen)
          return (
            <div key={s.email} style={{ display:'flex', alignItems:'center', gap:8,
              padding:'8px 14px', borderRadius:20, background:'var(--white)',
              border:'1.5px solid var(--success)', fontSize:12 }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--success)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {s.avatar || s.name?.charAt(0)}
              </div>
              <span style={{ fontWeight:600, color:'var(--dark)' }}>{s.name}</span>
              {area && <span style={{ color:area.color }}>{area.icon}</span>}
              {min !== null && (
                <span style={{ color:'var(--muted)', fontSize:10 }}>
                  {min === 0 ? 'ahora' : `${min}m`}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Student progress modal ─────────────────────────────────
export function StudentProgressModal({ student, onClose }) {
  const submissions     = useStore(s => s.submissions)
  const attempts        = useStore(s => s.challengeAttempts)
  const [progress, setProgress] = React.useState(null)
  const isMobile = useMobile()

  React.useEffect(() => {
    if (!student) return
    supabase.from('profiles').select('id')
      .eq('email', student.email).single()
      .then(async ({ data: prof }) => {
        if (!prof) return
        const [{ data: prog }] = await Promise.all([
          supabase.from('progress').select('*').eq('user_id', prof.id).single(),
        ])
        setProgress(prog)
      })
  }, [student?.email])

  if (!student) return null

  const area       = AREAS.find(a => a.id === student.area)
  const mySubs     = submissions.filter(s => s.studentEmail === student.email)
  const myAttempts = attempts.filter(a => a.studentEmail === student.email)
  const latestSub  = mySubs[0]

  const completed  = progress?.completed || []
  const xp         = progress?.xp || 0
  const badges     = progress?.badges || []
  const modules    = area ? getStudentModules(student.area) : []
  const donePct    = modules.length > 0
    ? Math.round((completed.filter(id => modules.find(m => m.id === id)).length / modules.length) * 100)
    : 0
  const level      = calcLevel(xp)

  const statusColor = { approved:'var(--success)', pending:'var(--warn)', returned:'#F59E0B', graded:'#3B82F6' }
  const statusLabel = { approved:'Aprobado ✅', pending:'Pendiente ⏳', returned:'Devuelta ↩️', graded:'Calificado' }

  return (
    <div>
      {/* Header del estudiante */}
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
        borderRadius:12, background:'var(--bg-alt)', marginBottom:20 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', flexShrink:0,
          background: area?.bg || 'var(--orange-bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:800, color: area?.color || 'var(--orange)' }}>
          {student.avatar || student.name?.charAt(0)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--dark)' }}>{student.name}</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>{student.email}</div>
          {area && <div style={{ fontSize:12, color:area.color, fontWeight:600, marginTop:2 }}>
            {area.icon} {area.name}
          </div>}
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:11, color:'var(--muted)' }}>Nivel</div>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--orange)' }}>{level}</div>
          <div style={{ fontSize:11, color:'var(--muted)' }}>{xp} XP</div>
        </div>
      </div>

      {/* Progreso global */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>Progreso de la ruta</span>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--orange)' }}>{donePct}%</span>
        </div>
        <ProgressBar pct={donePct} h={10} color="var(--orange)" />
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>
          {completed.filter(id => modules.find(m => m.id === id)).length} de {modules.length} actividades completadas
        </div>
      </div>

      {/* Módulos */}
      {modules.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:10 }}>
            Detalle por actividad
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflow:'auto' }}>
            {modules.map(m => {
              const done = completed.includes(m.id)
              const att  = myAttempts.find(a => a.challengeId === m.id)
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'8px 12px', borderRadius:8,
                  background: done ? '#F0FDF4' : 'var(--bg)',
                  border: `1px solid ${done ? '#BBF7D0' : 'var(--border)'}` }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>
                    {done ? '✅' : m.type === 'challenge' ? '🎯' : '📖'}
                  </span>
                  <span style={{ fontSize:12, fontWeight:done ? 600 : 400,
                    color: done ? 'var(--success)' : 'var(--text-sec)', flex:1 }}>
                    {m.subtitle} · {m.title}
                  </span>
                  {att && (
                    <span style={{ fontSize:11, fontWeight:700,
                      color: att.score/att.maxScore >= .75 ? 'var(--success)' : 'var(--warn)' }}>
                      {Math.round(att.score/att.maxScore*100)}%
                    </span>
                  )}
                  {!done && !att && <ClockIc s={14} c="var(--border)" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Entrega */}
      {latestSub && (
        <div style={{ padding:'14px 16px', borderRadius:12,
          background: latestSub.status === 'approved' ? '#F0FDF4' : 'var(--bg)',
          border:`1.5px solid ${statusColor[latestSub.status] || 'var(--border)'}`,
          marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)',
            textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>
            Producto final
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>
              {statusLabel[latestSub.status] || 'Sin estado'}
            </span>
            {latestSub.grade && (
              <span style={{ fontSize:13, fontWeight:700, color:statusColor[latestSub.status] }}>
                {gradeTotal(latestSub.grade)}/{gradeMax()} pts
              </span>
            )}
          </div>
          {latestSub.feedback && (
            <p style={{ fontSize:12, color:'var(--text-sec)', fontStyle:'italic',
              marginTop:6, lineHeight:1.5 }}>"{latestSub.feedback}"</p>
          )}
        </div>
      )}

      {/* Insignias */}
      {badges.length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:10 }}>
            Insignias obtenidas
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {Object.keys(BADGES).map(bid => (
              <BadgeCard key={bid} bid={bid} earned={badges.includes(bid)} size="sm" />
            ))}
          </div>
        </div>
      )}

      {!progress && (
        <div style={{ textAlign:'center', padding:'24px', color:'var(--muted)', fontSize:13 }}>
          Este docente aún no ha iniciado su ruta formativa.
        </div>
      )}
    </div>
  )
}
