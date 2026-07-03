import React from 'react'
import {
  useStore, AREAS, BADGES, ALL_MODULES, RUBRIC_CRITERIA, getStudentModules,
  gradeTotal, gradeMax, calcLevel, xpForNext, nav,
  setWorkshopAccess, setWorkshopAccessBulk,
} from '../store/store.jsx'
import {
  useMobile, CheckIc, ClockIc, ZapIc, AwardIc, XIc,
  ProgressBar, ProgressRing, BadgeCard, Modal, Btn,
} from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { InstructorDashboard } from './Grid.jsx'

// ── Active students (presencia en tiempo real) ─────────────
export function ActiveStudents() {
  const accounts = useStore(s => s.accounts)
  const role     = useStore(s => s.user?.role)
  const [active, setActive] = React.useState([])

  const institutions           = useStore(s => s.institutions || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])

  const load = React.useCallback(async () => {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('profiles')
      .select('email, name, avatar, current_module, last_seen, area, institution_id')
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

  // Solo el admin puede ver esta sección
  if (role !== 'admin') return null

  if (active.length === 0) return (
    <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--bg)',
      border:'1px solid var(--border)', marginBottom:20,
      display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--subtle)' }} />
      <span style={{ fontSize:13, color:'var(--muted)' }}>Sin docentes activos en este momento</span>
    </div>
  )

  // Agrupar por área
  const byArea = {}
  active.forEach(s => {
    const key = s.area || '__sin_area__'
    if (!byArea[key]) byArea[key] = []
    byArea[key].push(s)
  })

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)',
          animation:'pulse 2s infinite', boxShadow:'0 0 0 0 rgba(16,185,129,.4)' }} />
        <style>{`@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}`}</style>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--success)' }}>
          {active.length} docente{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''} ahora
        </span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {Object.entries(byArea).map(([areaKey, students]) => {
          const area = AREAS.find(a => a.id === areaKey)
          return (
            <div key={areaKey}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1,
                color: area?.color || 'var(--muted)', marginBottom:6 }}>
                {area ? `${area.icon} ${area.name}` : 'Sin área asignada'}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {students.map(s => {
                  const min = minutesAgo(s.last_seen)
                  const isUrl = s.avatar?.startsWith('http')
                  return (
                    <div key={s.email} style={{ display:'flex', alignItems:'center', gap:8,
                      padding:'8px 14px', borderRadius:20, background:'var(--white)',
                      border:'1.5px solid var(--success)', fontSize:12 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--success)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                        {isUrl
                          ? <img src={s.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : (s.name?.charAt(0) || '?')}
                      </div>
                      <span style={{ fontWeight:600, color:'var(--dark)' }}>{s.name}</span>
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
        <div style={{ width:48, height:48, borderRadius:'50%', flexShrink:0, overflow:'hidden',
          background: area?.bg || 'var(--orange-bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:800, color: area?.color || 'var(--orange)' }}>
          {(student.avatar || '').startsWith('http')
            ? <img src={student.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : (student.avatar || student.name?.charAt(0))}
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
                  background: done ? '#F0FDFA' : 'var(--bg)',
                  border: `1px solid ${done ? '#99F6E4' : 'var(--border)'}` }}>
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
          background: latestSub.status === 'approved' ? '#F0FDFA' : 'var(--bg)',
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

// ── Historial de entregas aprobadas ────────────────────────
const InstructorHistorial = ({ onStudentClick }) => {
  const allSubmissions         = useStore(s => s.submissions)
  const user                   = useStore(s => s.user)
  const storeInstitutions      = useStore(s => s.institutions || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const accounts               = useStore(s => s.accounts || [])
  const isMobile = useMobile()

  const submissions = React.useMemo(() => {
    if (user?.role === 'admin') return allSubmissions
    const assignedIds = instructorInstitutions
      .filter(ii => ii.instructor_id === user?.id)
      .map(ii => ii.institution_id)
    if (assignedIds.length === 0) return allSubmissions
    const assignedNames = assignedIds
      .map(id => storeInstitutions.find(i => i.id === id)?.name)
      .filter(Boolean)
    return allSubmissions.filter(s => assignedNames.includes(s.studentInstitution))
  }, [allSubmissions, user, instructorInstitutions, storeInstitutions])

  const approved = React.useMemo(() =>
    [...submissions.filter(s => s.status === 'approved')]
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  [submissions])

  const [search, setSearch]         = React.useState('')
  const [debSearch, setDebSearch]   = React.useState('')
  const [dateFrom, setDateFrom]     = React.useState('')
  const [dateTo, setDateTo]         = React.useState('')
  const [filterInst, setFilterInst] = React.useState('all')
  const [filterArea, setFilterArea] = React.useState('all')
  const [detailSub, setDetailSub]   = React.useState(null)

  React.useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const institutions = React.useMemo(() => {
    const set = new Set(approved.map(s => s.studentInstitution || 'Sin institución'))
    return [...set].filter(Boolean).sort()
  }, [approved])

  const filtered = React.useMemo(() => approved.filter(s => {
    if (filterInst !== 'all' && (s.studentInstitution || 'Sin institución') !== filterInst) return false
    if (filterArea !== 'all' && s.area !== filterArea) return false
    if (debSearch) {
      const q = debSearch.toLowerCase()
      if (!s.studentName?.toLowerCase().includes(q) && !s.studentEmail?.toLowerCase().includes(q)) return false
    }
    if (dateFrom && s.date < dateFrom) return false
    if (dateTo   && s.date > dateTo)   return false
    return true
  }), [approved, filterInst, filterArea, debSearch, dateFrom, dateTo])

  const hasFilters = debSearch || dateFrom || dateTo || filterInst !== 'all' || filterArea !== 'all'
  const clearFilters = () => { setSearch(''); setDebSearch(''); setDateFrom(''); setDateTo(''); setFilterInst('all'); setFilterArea('all') }

  const chipBtn = (active, color, onClick, children) => (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)',
      fontSize: 12, fontWeight: 600, transition: 'all .15s',
      border: active ? `1.5px solid ${color}` : '1px solid var(--border)',
      background: active ? color + '18' : 'var(--bg)',
      color: active ? color : 'var(--muted)',
    }}>{children}</button>
  )

  const detailStudent = detailSub
    ? (accounts.find(a => a.email === detailSub.studentEmail) ||
        { name: detailSub.studentName, email: detailSub.studentEmail, area: detailSub.area, avatar: null })
    : null

  const inp = { padding: '8px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)' }

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '16px 16px 40px' : '0 24px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Historial de calificados</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          {approved.length} entrega{approved.length !== 1 ? 's' : ''} aprobada{approved.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      {/* Filters panel */}
      <div style={{ padding: 16, borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Search + dates */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            style={{ ...inp, flex: '1 1 200px', minWidth: 0 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Desde</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inp, width: 'auto' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Hasta</span>
            <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ ...inp, width: 'auto' }} />
          </div>
        </div>

        {/* Institution chips */}
        {institutions.length > 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>Institución</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {chipBtn(filterInst === 'all', 'var(--dark)', () => setFilterInst('all'), 'Todas')}
              {institutions.map(inst => chipBtn(filterInst === inst, 'var(--purple)', () => setFilterInst(inst), `🏫 ${inst}`))}
            </div>
          </div>
        )}

        {/* Area chips */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>Área</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {chipBtn(filterArea === 'all', 'var(--dark)', () => setFilterArea('all'), 'Todas')}
            {AREAS.map(a => chipBtn(filterArea === a.id, a.color, () => setFilterArea(a.id), `${a.icon} ${a.name}`))}
          </div>
        </div>

        {hasFilters && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={clearFilters} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)' }}>
              × Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {hasFilters && (
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} de {approved.length}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)', fontSize: 14, background: 'var(--white)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          {hasFilters ? 'No hay resultados con estos filtros.' : 'Aún no hay entregas aprobadas.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(sub => {
            const area  = AREAS.find(a => a.id === sub.area)
            const total = gradeTotal(sub.grade)
            const max   = gradeMax()
            const pct   = max > 0 ? Math.round((total / max) * 100) : 0
            const scoreColor = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warn)' : 'var(--error)'
            return (
              <div key={sub.id} onClick={() => setDetailSub(sub)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--success)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: area?.bg || 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: area?.color || 'var(--orange)' }}>
                  {sub.studentName?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.studentName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sub.studentEmail}{sub.studentInstitution ? ` · 🏫 ${sub.studentInstitution}` : ''}
                  </div>
                </div>
                {!isMobile && area && (
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: area.bg, fontSize: 11, fontWeight: 700, color: area.color, flexShrink: 0 }}>
                    {area.icon} {area.name}
                  </div>
                )}
                {!isMobile && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0, minWidth: 80, textAlign: 'right' }}>
                    {sub.date || '—'}
                  </div>
                )}
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 56 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor }}>{total}/{max}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{pct}%</div>
                </div>
                <span style={{ color: 'var(--border)', fontSize: 20, flexShrink: 0 }}>›</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detailSub} onClose={() => setDetailSub(null)} title={detailSub?.studentName || ''} width={560}>
        {detailSub && (() => {
          const area  = AREAS.find(a => a.id === detailSub.area)
          const total = gradeTotal(detailSub.grade)
          const max   = gradeMax()
          const pct   = max > 0 ? Math.round((total / max) * 100) : 0
          return (
            <div>
              {/* Student header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-alt)', marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, background: area?.bg || 'var(--orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: area?.color || 'var(--orange)' }}>
                  {detailSub.studentName?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>{detailSub.studentName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{detailSub.studentEmail}</div>
                  {detailSub.studentInstitution && (
                    <div style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600, marginTop: 2 }}>🏫 {detailSub.studentInstitution}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warn)' : 'var(--error)' }}>
                    {total}/{max}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>✅ Aprobado · {detailSub.date}</div>
                </div>
              </div>

              {/* Rubric breakdown */}
              {detailSub.grade && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Desglose de calificación</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {RUBRIC_CRITERIA.map(cr => {
                      const val = detailSub.grade[cr.key] || 0
                      const p   = (val / 5) * 100
                      const c   = p >= 80 ? 'var(--success)' : p >= 60 ? 'var(--warn)' : 'var(--error)'
                      return (
                        <div key={cr.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{cr.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{val}/5</span>
                          </div>
                          <ProgressBar pct={p} h={6} color={c} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {detailSub.feedback && (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDFA', border: '1px solid #99F6E4', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>Retroalimentación del instructor</div>
                  <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.6 }}>{detailSub.feedback}</p>
                </div>
              )}

              {/* View profile */}
              {onStudentClick && detailStudent && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Btn variant="secondary" size="sm" onClick={() => { setDetailSub(null); onStudentClick(detailStudent) }}>
                    Ver perfil del docente →
                  </Btn>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// ── Default export: página con tabs Pendientes / Historial ──
// ── Habilitar producto final tras el taller (individual + masiva) ──────────
const WorkshopAccessPanel = () => {
  const accounts       = useStore(s => s.accounts || [])
  const courses        = useStore(s => s.courses || [])
  const workshopAccess = useStore(s => s.workshopAccess || [])
  const user           = useStore(s => s.user)
  const institutions   = useStore(s => s.institutions || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const isMobile = useMobile()

  const isAdmin = user?.role === 'admin'
  // Colegios del instructor (admin: todos)
  const myInstitutionIds = React.useMemo(() => {
    if (isAdmin) return null // null = todos
    const ids = instructorInstitutions.filter(ii => ii.instructor_id === user?.id).map(ii => ii.institution_id)
    if (ids.length) return new Set(ids)
    return new Set(user?.institution_id ? [user.institution_id] : [])
  }, [isAdmin, instructorInstitutions, user])

  // Cursos que usan taller (los únicos donde tiene sentido habilitar)
  const workshopCourses = React.useMemo(
    () => courses.filter(c => c.is_active && !c.parent_course_id && c.requires_workshop),
    [courses]
  )
  const [courseId, setCourseId] = React.useState('')
  React.useEffect(() => {
    if (!courseId && workshopCourses.length) setCourseId(workshopCourses[0].id)
  }, [workshopCourses]) // eslint-disable-line react-hooks/exhaustive-deps

  // Estudiantes de mis colegios (admin: todos)
  const students = React.useMemo(() => accounts.filter(a =>
    a.role === 'student' && (myInstitutionIds === null || myInstitutionIds.has(a.institution_id))
  ), [accounts, myInstitutionIds])

  const enabledSet = React.useMemo(() => new Set(
    workshopAccess.filter(w => w.course_id === courseId && w.enabled).map(w => w.student_id)
  ), [workshopAccess, courseId])

  const [sel, setSel] = React.useState(new Set())
  const [busy, setBusy] = React.useState(false)
  React.useEffect(() => { setSel(new Set()) }, [courseId])

  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleOne = async (id, next) => { await setWorkshopAccess(id, courseId, next) }
  const bulk = async (next) => {
    if (!sel.size || !courseId) return
    setBusy(true); await setWorkshopAccessBulk([...sel], courseId, next); setBusy(false); setSel(new Set())
  }

  if (!workshopCourses.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
        Ningún curso tiene activado el <strong>taller presencial</strong>. Un administrador lo activa en
        <em> Cursos → 🎓 Requiere taller</em>. Solo esos cursos gatean la entrega final.
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '16px' : '20px 24px' }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
        Marca a los estudiantes que asistieron al taller para habilitarles el tramo final (producto). Solo los habilitados podrán entregarlo.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <select value={courseId} onChange={e => setCourseId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, background: 'var(--white)' }}>
          {workshopCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {sel.size > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sel.size} seleccionado{sel.size !== 1 ? 's' : ''}</span>
            <Btn variant="gradient" size="sm" disabled={busy} onClick={() => bulk(true)}>✅ Habilitar</Btn>
            <Btn variant="secondary" size="sm" disabled={busy} onClick={() => bulk(false)}>🔒 Bloquear</Btn>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {students.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No hay estudiantes en tu colegio.</div>
        )}
        {students.map(st => {
          const on = enabledSet.has(st.id)
          return (
            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
              background: 'var(--white)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={sel.has(st.id)} onChange={() => toggleSel(st.id)}
                style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.email}{st.institution ? ` · ${st.institution}` : ''}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--success)' : 'var(--subtle)' }}>
                {on ? 'Habilitado' : 'Bloqueado'}
              </span>
              <div onClick={() => toggleOne(st.id, !on)}
                style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                  background: on ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  left: on ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const InstructorStudentViewPage = ({ studentView, setStudentView }) => {
  const [tab, setTab] = React.useState('pending')
  const submissions   = useStore(s => s.submissions)
  const isMobile      = useMobile()

  const pendingCount  = submissions.filter(s => !s.status || s.status === 'pending' || s.status === 'returned').length
  const historialCount = submissions.filter(s => s.status === 'approved').length

  const tabBtn = (id, label, count, activeColor) => {
    const active = tab === id
    return (
      <button onClick={() => setTab(id)} style={{
        padding: isMobile ? '10px 16px' : '12px 24px',
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
        fontSize: isMobile ? 13 : 14, fontWeight: 600,
        background: 'none', transition: 'all .15s',
        borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
        marginBottom: -2, color: active ? activeColor : 'var(--muted)',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        {label}
        {count > 0 && (
          <span style={{ background: active ? activeColor : 'var(--border)', color: active ? '#fff' : 'var(--muted)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ActiveStudents />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--white)', flexShrink: 0, paddingLeft: isMobile ? 16 : 24 }}>
        {tabBtn('pending',   '📋 Pendientes', pendingCount,  'var(--orange)')}
        {tabBtn('historial', '📚 Historial',  historialCount, 'var(--success)')}
        {tabBtn('taller',    '🎓 Taller',     0,             'var(--purple)')}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'pending' ? (
          <InstructorDashboard onStudentClick={setStudentView} />
        ) : tab === 'historial' ? (
          <InstructorHistorial onStudentClick={setStudentView} />
        ) : (
          <WorkshopAccessPanel />
        )}
      </div>

      <Modal open={!!studentView} onClose={() => setStudentView(null)} title={studentView?.name || ''} width={600}>
        <StudentProgressModal student={studentView} onClose={() => setStudentView(null)} />
      </Modal>
    </div>
  )
}

export default InstructorStudentViewPage
