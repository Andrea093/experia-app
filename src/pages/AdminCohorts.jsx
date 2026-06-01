import React from 'react'
import { useStore, AREAS } from '../store/store.jsx'
import { useMobile, Btn, Modal, PlusIc, EditIc, TrashIc, ClockIc, UsersIc } from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XS } from '../store/store.jsx'

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-CO',
  { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const daysLeft = (deadline) => {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Cohort form ───────────────────────────────────────────────
const CohortForm = ({ initial = {}, onSave, onCancel }) => {
  const [form, setForm] = React.useState({
    name: initial.name || '',
    area: initial.area || '',
    deadline: initial.deadline ? initial.deadline.slice(0,16) : '',
    notes: initial.notes || '',
  })
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState('')

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('El nombre es obligatorio'); return }
    setSaving(true)
    const payload = {
      name:     form.name.trim(),
      area:     form.area || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      notes:    form.notes.trim() || null,
    }
    if (initial.id) {
      const { error } = await supabase.from('cohorts').update(payload).eq('id', initial.id)
      if (error) { setErr(error.message); setSaving(false); return }
      XS.set(s => ({ cohorts: (s.cohorts||[]).map(c => c.id === initial.id ? { ...c, ...payload } : c) }))
    } else {
      const { data, error } = await supabase.from('cohorts').insert(payload).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      XS.set(s => ({ cohorts: [...(s.cohorts||[]), data] }))
    }
    setSaving(false)
    onSave()
  }

  const inp = (hasErr) => ({
    width:'100%', padding:'10px 14px', borderRadius:10, boxSizing:'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
          Nombre de la cohorte <span style={{ color:'var(--error)' }}>*</span>
        </label>
        <input value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setErr('')}}
          placeholder="Ej: Cohorte 2025-1" style={inp(!!err)} autoFocus />
        {err && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{err}</p>}
      </div>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
          Área (dejar vacío = todas las áreas)
        </label>
        <select value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} style={inp(false)}>
          <option value="">— Todas las áreas —</option>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
          Fecha límite de entrega
        </label>
        <input type="datetime-local" value={form.deadline}
          onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={inp(false)} />
      </div>
      <div>
        <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
          Notas internas (opcional)
        </label>
        <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
          rows={2} placeholder="Grupo piloto, primer semestre..." style={{ ...inp(false), resize:'vertical' }} />
      </div>
      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        <Btn variant="secondary" full onClick={onCancel}>Cancelar</Btn>
        <Btn variant="gradient" full disabled={saving} onClick={handleSave}>
          {saving ? 'Guardando...' : initial.id ? 'Guardar cambios' : 'Crear cohorte'}
        </Btn>
      </div>
    </div>
  )
}

// ── Assign students modal ────────────────────────────────────
const AssignModal = ({ cohort, onClose }) => {
  const accounts = useStore(s => s.accounts)
  const students = accounts.filter(a => a.role === 'student')
  const [search, setSearch] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [cohortStudents, setCohortStudents] = React.useState([])

  React.useEffect(() => {
    supabase.from('profiles').select('id,email').eq('cohort_id', cohort.id)
      .then(({ data }) => setCohortStudents((data||[]).map(p=>p.email)))
  }, [cohort.id])

  const toggle = async (email) => {
    const profile = await supabase.from('profiles').select('id').eq('email', email).single()
    if (!profile.data) return
    const newVal = cohortStudents.includes(email) ? null : cohort.id
    await supabase.from('profiles').update({ cohort_id: newVal }).eq('email', email)
    setCohortStudents(prev => newVal
      ? [...prev, email]
      : prev.filter(e => e !== email)
    )
  }

  const filtered = students.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const area = AREAS.find(a => a.id === cohort.area)

  return (
    <div>
      <div style={{ padding:'12px 16px', borderRadius:10, background:'var(--bg)',
        border:'1px solid var(--border)', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--dark)' }}>{cohort.name}</div>
        {area && <div style={{ fontSize:12, color:area.color }}>{area.icon} {area.name}</div>}
        {cohort.deadline && <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
          Límite: {fmtDate(cohort.deadline)}
        </div>}
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="Buscar docente..." style={{ width:'100%', padding:'9px 14px', borderRadius:10,
          border:'1.5px solid var(--border)', fontFamily:'var(--font)', fontSize:13, outline:'none',
          boxSizing:'border-box', marginBottom:12 }} />
      <div style={{ maxHeight:320, overflow:'auto', display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map(st => {
          const assigned = cohortStudents.includes(st.email)
          const stArea = AREAS.find(a=>a.id===st.area)
          return (
            <div key={st.email} onClick={()=>toggle(st.email)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                borderRadius:10, cursor:'pointer', transition:'all .15s',
                border: assigned ? '1.5px solid var(--orange)' : '1px solid var(--border)',
                background: assigned ? 'var(--orange-bg)' : 'var(--white)' }}>
              <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                background: assigned ? 'var(--orange)' : 'var(--bg-alt)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, color: assigned ? '#fff' : 'var(--muted)' }}>
                {st.avatar}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--dark)', overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{st.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>
                  {stArea ? `${stArea.icon} ${stArea.name}` : 'Sin área'} · {st.email}
                </div>
              </div>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                border: assigned ? 'none' : '2px solid var(--border)',
                background: assigned ? 'var(--orange)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {assigned && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13, padding:24 }}>
            No se encontraron docentes.
          </p>
        )}
      </div>
      <div style={{ marginTop:16, textAlign:'right' }}>
        <Btn variant="primary" onClick={onClose}>Listo</Btn>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function AdminCohorts() {
  const cohorts  = useStore(s => s.cohorts || [])
  const accounts = useStore(s => s.accounts)
  const isMobile = useMobile()
  const [showCreate, setShowCreate] = React.useState(false)
  const [editing,    setEditing]    = React.useState(null)
  const [assigning,  setAssigning]  = React.useState(null)
  const [delConfirm, setDelConfirm] = React.useState(null)

  const countMembers = (cohortId) =>
    accounts.filter(a => a.cohort_id === cohortId || a.cohort === cohortId).length

  const handleDelete = async (id) => {
    await supabase.from('cohorts').delete().eq('id', id)
    XS.set(s => ({ cohorts: (s.cohorts||[]).filter(c => c.id !== id) }))
    setDelConfirm(null)
  }

  return (
    <div style={{ height:'100%', overflow:'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom:20, display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'var(--dark)', marginBottom:4 }}>
            Cohortes y Fechas Límite
          </h2>
          <p style={{ fontSize:14, color:'var(--muted)' }}>
            Organiza docentes en grupos con plazos de entrega definidos
          </p>
        </div>
        <Btn variant="gradient" onClick={()=>setShowCreate(true)}>
          <PlusIc s={16} c="#fff" /> Nueva cohorte
        </Btn>
      </div>

      {cohorts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', background:'var(--white)',
          borderRadius:16, border:'1px solid var(--border)', color:'var(--muted)' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          <p style={{ fontSize:14 }}>No hay cohortes creadas. Crea la primera para organizar grupos con fechas límite.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {cohorts.map(c => {
            const days  = daysLeft(c.deadline)
            const area  = AREAS.find(a => a.id === c.area)
            const isExpired = days !== null && days < 0
            const isUrgent  = days !== null && days >= 0 && days <= 3
            return (
              <div key={c.id} style={{ padding:'18px 20px', borderRadius:14,
                background:'var(--white)', border:'1px solid var(--border)',
                borderLeft: isExpired ? '4px solid var(--error)' : isUrgent ? '4px solid var(--warn)' : '4px solid var(--orange)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--dark)', marginBottom:4 }}>
                      {c.name}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                      {area && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4,
                          background:area.color+'18', color:area.color, fontWeight:700 }}>
                          {area.icon} {area.name}
                        </span>
                      )}
                      {c.deadline && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:700,
                          background: isExpired ? '#FEE2E2' : isUrgent ? '#FEF3C7' : 'var(--bg-alt)',
                          color: isExpired ? 'var(--error)' : isUrgent ? 'var(--warn)' : 'var(--muted)' }}>
                          {isExpired ? '⚠️ Vencida' : `⏱ ${days}d restantes`} · {fmtDate(c.deadline)}
                        </span>
                      )}
                      {!c.deadline && (
                        <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4,
                          background:'var(--bg-alt)', color:'var(--subtle)', fontWeight:600 }}>
                          Sin fecha límite
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <div style={{ fontSize:12, color:'var(--muted)', fontStyle:'italic' }}>{c.notes}</div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={()=>setAssigning(c)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px',
                        borderRadius:8, border:'1.5px solid var(--orange)', background:'var(--orange-bg)',
                        color:'var(--orange)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600 }}>
                      <UsersIc s={13} c="var(--orange)" /> Asignar
                    </button>
                    <button onClick={()=>setEditing(c)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px',
                        borderRadius:8, border:'1.5px solid var(--border)', background:'var(--white)',
                        color:'var(--text-sec)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600 }}>
                      <EditIc s={13} c="var(--muted)" />
                    </button>
                    <button onClick={()=>setDelConfirm(c)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px',
                        borderRadius:8, border:'1.5px solid var(--error)', background:'none',
                        color:'var(--error)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600 }}>
                      <TrashIc s={13} c="var(--error)" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Nueva cohorte" width={480}>
        <CohortForm onSave={()=>setShowCreate(false)} onCancel={()=>setShowCreate(false)} />
      </Modal>

      <Modal open={!!editing} onClose={()=>setEditing(null)} title="Editar cohorte" width={480}>
        {editing && <CohortForm initial={editing}
          onSave={()=>setEditing(null)} onCancel={()=>setEditing(null)} />}
      </Modal>

      <Modal open={!!assigning} onClose={()=>setAssigning(null)}
        title="Asignar docentes a la cohorte" width={520}>
        {assigning && <AssignModal cohort={assigning} onClose={()=>setAssigning(null)} />}
      </Modal>

      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="Eliminar cohorte" width={400}>
        {delConfirm && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <p style={{ fontSize:14, color:'var(--text-sec)', marginBottom:24, lineHeight:1.6 }}>
              ¿Eliminar <strong>{delConfirm.name}</strong>?<br/>
              <span style={{ fontSize:12, color:'var(--muted)' }}>
                Los docentes asignados quedarán sin cohorte, pero sus datos no se borrarán.
              </span>
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" full onClick={()=>setDelConfirm(null)}>Cancelar</Btn>
              <Btn variant="danger" full onClick={()=>handleDelete(delConfirm.id)}>Eliminar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
