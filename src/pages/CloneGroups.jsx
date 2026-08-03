import React from 'react'
import {
  useStore, loadCloneGroups, saveCloneGroup, deleteCloneGroup,
  loadCloneGroupStudents, saveCloneGroupStudents,
  loadCloneAttendance, loadCloneEffectiveness,
  loadCloneUnitPlan, saveCloneUnitPlan,
} from '../store/store.jsx'
import { useMobile, Btn, Modal, Skeleton } from '../components/ui.jsx'
import { PageHead, EmptyState, Pill, RowMenu } from '../components/adminUI.jsx'
import { inp, lbl, card, fmtFecha, readSheet, parsePct } from '../components/cloneShared.jsx'
import { fmtPct, colorEfectividad } from '../lib/effectiveness.js'

// ── Grupos y listados — MODO CLON, lado del TUTOR (piloto temporal, 0051) ───
// El tutor clon crea un grupo por docente (sus alumnos de colegio) y le carga el
// listado por Excel. El docente NO edita el listado: solo marca asistencia sobre
// él y registra la tabla de efectividad.
//
// El tutor además ve, en modo lectura, las actas y las tablas que sus docentes
// van produciendo — es la evidencia del piloto. La RLS de 0051 le da select pero
// nunca write sobre esos dos documentos.

const emptyForm = () => ({ id: null, name: '', grade: '', teacherId: '', institutionId: '', courseId: '' })

// ── Modal de listado de alumnos ────────────────────────────────────────────
const RosterModal = ({ group, onSaved }) => {
  const [people, setPeople] = React.useState([])
  const [loaded, setLoaded] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg]       = React.useState('')
  const fileRef = React.useRef(null)

  React.useEffect(() => {
    let alive = true
    loadCloneGroupStudents(group.id).then(({ rows }) => {
      if (!alive) return
      setPeople(rows.map(r => ({ full_name: r.full_name, document: r.document || '', email: r.email || '' })))
      setLoaded(true)
    })
    return () => { alive = false }
  }, [group.id])

  const importar = async (file) => {
    setMsg('')
    try {
      const rows = await readSheet(file)
      const parsed = rows.map(n => {
        const nombre   = (n['nombre'] || n['nombres'] || n['nombre completo'] || n['name'] || '').toString().trim()
        const apellido = (n['apellido'] || n['apellidos'] || '').toString().trim()
        return {
          full_name: [nombre, apellido].filter(Boolean).join(' ').trim(),
          document: (n['documento'] || n['cedula'] || n['identificacion'] || n['cc'] || '').toString().trim(),
          email: (n['correo'] || n['email'] || '').toString().trim().toLowerCase(),
        }
      }).filter(p => p.full_name)
      if (!parsed.length) {
        setMsg('⚠️ No se encontró ninguna fila con nombre. Revisa que haya una columna "Nombre".')
        return
      }
      setPeople(parsed)
      setMsg(`📄 ${parsed.length} alumno${parsed.length !== 1 ? 's' : ''} leído${parsed.length !== 1 ? 's' : ''} — aún sin guardar`)
    } catch (e) { setMsg('⚠️ ' + (e.message || 'No se pudo leer el archivo')) }
  }

  const guardar = async () => {
    setSaving(true); setMsg('')
    const { error, count } = await saveCloneGroupStudents(group.id, people)
    setSaving(false)
    if (error) { setMsg('⚠️ ' + error); return }
    setMsg(`✅ Listado guardado (${count} alumnos)`)
    onSaved?.(count)
  }

  const plantilla = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nombre', 'Documento', 'Correo'],
      ['María García', '1023456789', 'maria@colegio.edu.co'],
      ['Carlos Ruiz', '1098765432', ''],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos')
    XLSX.writeFile(wb, `listado_${group.name}.xlsx`)
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 14 }}>
        Alumnos de colegio del grupo <strong>{group.name}</strong>. No son usuarios de la
        plataforma: es la lista sobre la que el docente marca asistencia.
        Columnas: <strong>Nombre</strong> (obligatoria), Documento y Correo.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>📤 Subir Excel</Btn>
        <Btn variant="ghost" size="sm" onClick={plantilla}>⬇ Plantilla</Btn>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
      </div>

      {loaded && (
        <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--border)',
          borderRadius: 10, marginBottom: 12 }}>
          {people.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic', padding: 14, margin: 0 }}>
              Sin alumnos cargados todavía.
            </p>
          ) : people.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 12px',
              borderBottom: i < people.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--subtle)', minWidth: 22 }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--dark)', flex: 1, minWidth: 0 }}>{p.full_name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.document}</span>
            </div>
          ))}
        </div>
      )}

      {msg && (
        <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12,
          color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{msg}</p>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
        Guardar <strong>reemplaza</strong> el listado del grupo. Las actas ya diligenciadas no
        cambian: cada una guarda su propia copia de los asistentes.
      </p>

      <Btn variant="gradient" full disabled={saving} onClick={guardar}>
        {saving ? '⏳ Guardando…' : '💾 Guardar listado'}
      </Btn>
    </div>
  )
}

// ── Modal del plan de unidades del libro (0052) ────────────────────────────
// Lo que el tutor define aquí es exactamente lo que el docente ve en el módulo
// `clone_dashboard` de su ruta: el orden de las unidades del libro físico y los
// ejes articuladores de cada una. El docente NO lo edita (RLS de 0052).
const splitEjes = (str) => (str || '').split(/[,;|]/).map(e => e.trim()).filter(Boolean)

const emptyUnit = () => ({ title: '', ejes: [], notes: '', coverage: null, priority: null, level: '' })

const UnitPlanModal = ({ group, onSaved }) => {
  const [bookTitle, setBookTitle] = React.useState('')
  const [intro, setIntro]         = React.useState('')
  const [units, setUnits]         = React.useState([])
  const [loaded, setLoaded]       = React.useState(false)
  const [saving, setSaving]       = React.useState(false)
  const [msg, setMsg]             = React.useState('')
  const fileRef = React.useRef(null)

  React.useEffect(() => {
    let alive = true
    loadCloneUnitPlan(group.id).then(({ plan }) => {
      if (!alive) return
      setBookTitle(plan?.book_title || '')
      setIntro(plan?.intro || '')
      setUnits((plan?.units || []).map(u => ({
        title: u.title || '', ejes: u.ejes || [], notes: u.notes || '',
        coverage: u.coverage ?? null, priority: u.priority ?? null, level: u.level || '',
      })))
      setLoaded(true)
    })
    return () => { alive = false }
  }, [group.id])

  const setUnit = (i, key, val) => setUnits(u => u.map((x, j) => j === i ? { ...x, [key]: val } : x))
  const addUnit = () => setUnits(u => [...u, emptyUnit()])
  const delUnit = (i) => setUnits(u => u.filter((_, j) => j !== i))
  // El orden del array ES el orden en que el docente trabaja las unidades.
  const move = (i, dir) => setUnits(u => {
    const j = i + dir
    if (j < 0 || j >= u.length) return u
    const c = [...u]; [c[i], c[j]] = [c[j], c[i]]; return c
  })

  const importar = async (file) => {
    setMsg('')
    try {
      const rows = await readSheet(file)
      const parsed = rows.map(n => ({
        title: (n['unidad'] || n['titulo'] || n['nombre'] || n['tema'] || '').toString().trim(),
        ejes: splitEjes((n['ejes'] || n['ejes articuladores'] || n['eje'] || '').toString()),
        notes: (n['notas'] || n['nota'] || n['indicaciones'] || n['observaciones'] || '').toString().trim(),
        coverage: parsePct(n['cobertura'] ?? n['cobertura diagnostica']),
        priority: parsePct(n['prioridad'] ?? n['puntaje de prioridad'] ?? n['puntaje']),
        level: (n['nivel'] || n['nivel de prioridad'] || n['clasificacion'] || '').toString().trim(),
      })).filter(u => u.title)
      if (!parsed.length) {
        setMsg('⚠️ No se encontró ninguna fila con unidad. Revisa que haya una columna "Unidad".')
        return
      }
      setUnits(parsed)
      setMsg(`📄 ${parsed.length} unidad${parsed.length !== 1 ? 'es' : ''} leída${parsed.length !== 1 ? 's' : ''} — aún sin guardar`)
    } catch (e) { setMsg('⚠️ ' + (e.message || 'No se pudo leer el archivo')) }
  }

  // Las celdas de porcentaje se escriben como FRACCIÓN con formato '0,0%', que
  // es como Excel las maneja de forma nativa: así el tutor puede editarlas sin
  // pensar y `parsePct` las vuelve a leer igual (0.076 → 7,6 %).
  const plantilla = async () => {
    const XLSX = await import('xlsx')
    const pct = (v) => ({ v, t: 'n', z: '0.0%' })
    const ws = XLSX.utils.aoa_to_sheet([
      ['Unidad', 'Cobertura', 'Prioridad', 'Nivel', 'Ejes', 'Notas'],
      ['Unidad 1. La materia y sus propiedades', pct(0.276), pct(0.076), 'Alta',
        'Pensamiento crítico, Vida saludable', 'Trabajar antes de la salida pedagógica'],
      ['Unidad 2. Tabla periódica y enlace químico', pct(0.10), pct(0.044), 'Media', 'Inclusión', ''],
      ['Unidad 3. Estequiometría y gases', pct(0.118), pct(0.001), 'Baja', '', ''],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Unidades')
    XLSX.writeFile(wb, `plan_unidades_${group.name}.xlsx`)
  }

  const guardar = async () => {
    setSaving(true); setMsg('')
    const { error, count } = await saveCloneUnitPlan({ groupId: group.id, bookTitle, intro, units })
    setSaving(false)
    if (error) {
      setMsg('⚠️ ' + error + (/clone_unit_plans/.test(error)
        ? ' — si dice que la tabla no existe, falta correr la migración 0052 en Supabase.' : ''))
      return
    }
    setMsg(`✅ Plan guardado (${count} unidades). Tu docente ya lo ve en su ruta.`)
    onSaved?.(count)
  }

  const rowInp = { ...inp, padding: '7px 10px', fontSize: 13 }

  if (!loaded) return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1, 2, 3].map(i => <Skeleton key={i} h={40} />)}
  </div>

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 14 }}>
        Orden en que <strong>{group.name}</strong> debe trabajar las unidades del libro físico y los
        ejes articuladores de cada una. El docente lo ve de solo lectura en el último módulo de su ruta.
        Si cargas <strong>cobertura</strong> y <strong>prioridad</strong>, verá además la gráfica de
        barras con las unidades más prioritarias.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={lbl}>Libro</label>
          <input value={bookTitle} onChange={e => setBookTitle(e.target.value)}
            placeholder="Ej. Matemáticas 9 — Serie Evolución" style={inp} />
        </div>
        <div>
          <label style={lbl}>Indicaciones generales</label>
          <textarea value={intro} onChange={e => setIntro(e.target.value)} rows={2}
            placeholder="Ej. Trabajar una unidad por semana, empezando por la 3."
            style={{ ...inp, resize: 'vertical', fontFamily: 'var(--font)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>📤 Subir Excel</Btn>
        <Btn variant="ghost" size="sm" onClick={plantilla}>⬇ Plantilla</Btn>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflow: 'auto',
        marginBottom: 12 }}>
        {units.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic', margin: 0 }}>
            Sin unidades todavía. Agrégalas una a una o sube el Excel.
          </p>
        ) : units.map((u, i) => (
          <div key={i} style={{ ...card, padding: '10px 12px', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)', minWidth: 18 }}>{i + 1}</span>
              <input value={u.title} onChange={e => setUnit(i, 'title', e.target.value)}
                placeholder="Unidad del libro" style={{ ...rowInp, flex: 1 }} />
              <button onClick={() => move(i, -1)} disabled={i === 0} title="Subir"
                style={{ background: 'var(--bg-alt)', border: 'none', borderRadius: 7, width: 26, height: 26,
                  cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? .4 : 1 }}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === units.length - 1} title="Bajar"
                style={{ background: 'var(--bg-alt)', border: 'none', borderRadius: 7, width: 26, height: 26,
                  cursor: i === units.length - 1 ? 'default' : 'pointer', opacity: i === units.length - 1 ? .4 : 1 }}>↓</button>
              <button onClick={() => delUnit(i)} title="Eliminar"
                style={{ background: '#FEE2E2', border: 'none', borderRadius: 7, width: 26, height: 26,
                  cursor: 'pointer', color: 'var(--error)' }}>✕</button>
            </div>
            {/* Los dos porcentajes se capturan como número (27,6), no como
                fracción: el campo dice "%" al lado y es lo que el tutor lee. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
              <input type="number" step="0.1" value={u.coverage ?? ''}
                onChange={e => setUnit(i, 'coverage', e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder="Cobertura %" title="Cobertura diagnóstica (%)" style={rowInp} />
              <input type="number" step="0.1" value={u.priority ?? ''}
                onChange={e => setUnit(i, 'priority', e.target.value === '' ? null : parseFloat(e.target.value))}
                placeholder="Prioridad %" title="Puntaje de prioridad (%)" style={rowInp} />
              <input value={u.level} onChange={e => setUnit(i, 'level', e.target.value)}
                placeholder="Nivel" title="Nivel de prioridad: Alta, Media, Baja…" style={rowInp} />
            </div>
            <input value={(u.ejes || []).join(', ')} onChange={e => setUnit(i, 'ejes', splitEjes(e.target.value))}
              placeholder="Ejes articuladores, separados por coma" style={{ ...rowInp, marginBottom: 6 }} />
            <input value={u.notes} onChange={e => setUnit(i, 'notes', e.target.value)}
              placeholder="Notas para el docente (opcional)" style={rowInp} />
          </div>
        ))}
      </div>

      <Btn variant="secondary" size="sm" onClick={addUnit} style={{ marginBottom: 12 }}>+ Agregar unidad</Btn>

      {msg && (
        <p style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12,
          color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{msg}</p>
      )}

      <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
        Guardar <strong>reemplaza</strong> el plan del grupo. Las unidades sin título se descartan.
      </p>

      <Btn variant="gradient" full disabled={saving} onClick={guardar}>
        {saving ? '⏳ Guardando…' : '💾 Guardar plan'}
      </Btn>
    </div>
  )
}

// ── Modal de evidencia del grupo (solo lectura) ────────────────────────────
const EvidenceModal = ({ group }) => {
  const [loading, setLoading] = React.useState(true)
  const [actas, setActas]     = React.useState([])
  const [tablas, setTablas]   = React.useState([])

  React.useEffect(() => {
    let alive = true
    Promise.all([loadCloneAttendance(group.id), loadCloneEffectiveness(group.id)])
      .then(([a, t]) => {
        if (!alive) return
        setActas(a.rows); setTablas(t.rows); setLoading(false)
      })
    return () => { alive = false }
  }, [group.id])

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1, 2, 3].map(i => <Skeleton key={i} h={40} />)}
  </div>

  const sec = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .8,
    color: 'var(--muted)', margin: '0 0 8px' }

  return (
    <div>
      <p style={sec}>Actas de asistencia</p>
      {actas.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic', marginBottom: 20 }}>
          El docente todavía no ha registrado ninguna sesión.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {actas.map(a => {
            const total = (a.entries || []).length
            const pres  = (a.entries || []).filter(e => e.present).length
            return (
              <div key={a.id} style={{ ...card, padding: '9px 12px', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{fmtFecha(a.session_date)}</span>
                {a.topic && <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, minWidth: 0 }}>{a.topic}</span>}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{pres}/{total} asistieron</span>
                <Pill tone={a.status === 'final' ? 'success' : 'muted'}>
                  {a.status === 'final' ? 'Cerrada' : 'Borrador'}
                </Pill>
              </div>
            )
          })}
        </div>
      )}

      <p style={sec}>Tablas de efectividad</p>
      {tablas.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic', margin: 0 }}>
          Sin tablas registradas todavía.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tablas.map(t => {
            // `summary` es la foto calculada al guardar (lib/effectiveness.js).
            const ses = t.summary?.efectividadSesion
            return (
              <div key={t.id} style={{ ...card, padding: '9px 12px', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{fmtFecha(t.session_date)}</span>
                {t.title && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.title}</span>}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 15, fontWeight: 900, color: colorEfectividad(ses) }}>
                  {fmtPct(ses ?? null)}
                </span>
                <Pill tone={t.status === 'final' ? 'success' : 'muted'}>
                  {t.status === 'final' ? 'Cerrada' : 'Borrador'}
                </Pill>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────
const CloneGroupsPage = () => {
  const user                   = useStore(s => s.user)
  const accounts               = useStore(s => s.accounts || [])
  const institutions           = useStore(s => s.institutions || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const courses                = useStore(s => s.courses || [])
  const isMobile = useMobile()

  const [groups, setGroups]   = React.useState([])
  const [counts, setCounts]   = React.useState({})   // groupId → nº de alumnos
  const [planCounts, setPlanCounts] = React.useState({}) // groupId → nº de unidades del plan
  const [loading, setLoading] = React.useState(true)
  const [error, setError]     = React.useState('')

  const [form, setForm]       = React.useState(null)   // null = modal cerrado
  const [rosterGroup, setRosterGroup] = React.useState(null)
  const [eviGroup, setEviGroup]       = React.useState(null)
  const [planGroup, setPlanGroup]     = React.useState(null)
  const [busy, setBusy]       = React.useState(false)
  const [formErr, setFormErr] = React.useState('')

  // Mismos colegios que el editor de ruta: los asignados, o el del perfil.
  const myInstitutions = React.useMemo(() => {
    const assigned = instructorInstitutions
      .filter(ii => ii.instructor_id === user?.id)
      .map(ii => institutions.find(i => i.id === ii.institution_id))
      .filter(Boolean)
    if (assigned.length) return assigned
    if (user?.institution_id) {
      const inst = institutions.find(i => i.id === user.institution_id)
      return inst ? [inst] : []
    }
    return institutions   // admin o instructor sin asignación: todos
  }, [instructorInstitutions, institutions, user])

  // Docentes candidatos: los estudiantes visibles (la RLS ya acota por colegio).
  // Los que están en modo clon van primero y marcados: son los del piloto.
  const docentes = React.useMemo(() => accounts
    .filter(a => a.role === 'student' && a.id)
    .sort((a, b) => (b.ui_variant === 'clone') - (a.ui_variant === 'clone')
      || (a.name || '').localeCompare(b.name || '')), [accounts])

  const reload = React.useCallback(async () => {
    setLoading(true)
    const { groups: rows, error: e } = await loadCloneGroups()
    setGroups(rows); setError(e || '')
    // Conteo de alumnos y de unidades del plan por grupo (dos consultas por
    // grupo; en el piloto los grupos son pocos y así el tutor ve de un vistazo
    // qué le falta cargar).
    const entries = await Promise.all(rows.map(async g => {
      const [{ rows: st }, { plan }] = await Promise.all([
        loadCloneGroupStudents(g.id), loadCloneUnitPlan(g.id),
      ])
      return [g.id, st.length, (plan?.units || []).length]
    }))
    setCounts(Object.fromEntries(entries.map(([id, n]) => [id, n])))
    setPlanCounts(Object.fromEntries(entries.map(([id, , n]) => [id, n])))
    setLoading(false)
  }, [])

  React.useEffect(() => { reload() }, [reload])

  const abrirNuevo = () => {
    setFormErr('')
    setForm({ ...emptyForm(), institutionId: myInstitutions.length === 1 ? myInstitutions[0].id : '' })
  }

  const abrirEdicion = (g) => {
    setFormErr('')
    setForm({ id: g.id, name: g.name, grade: g.grade || '', teacherId: g.teacher_id,
      institutionId: g.institution_id || '', courseId: g.course_id || '' })
  }

  const guardar = async () => {
    setBusy(true); setFormErr('')
    const { error: e } = await saveCloneGroup(form)
    setBusy(false)
    if (e) { setFormErr(e); return }
    setForm(null)
    reload()
  }

  const eliminar = async (g) => {
    if (!window.confirm(
      `¿Eliminar el grupo "${g.name}"? Se borran también su listado, sus actas de asistencia y sus tablas de efectividad.`)) return
    const { error: e } = await deleteCloneGroup(g.id)
    if (e) { setError(e); return }
    reload()
  }

  const nombreDocente = (id) => accounts.find(a => a.id === id)?.name || '—'
  const nombreColegio = (id) => institutions.find(i => i.id === id)?.name || '—'

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <PageHead
        title="Grupos y listados"
        subtitle="Piloto: un grupo por docente con sus alumnos de colegio. El docente marca la asistencia y registra la tabla de efectividad sobre este listado.">
        <Btn variant="gradient" size="sm" onClick={abrirNuevo}>+ Nuevo grupo</Btn>
      </PageHead>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--error)', fontWeight: 600, marginBottom: 14 }}>⚠️ {error}</p>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} h={56} />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon="👥" title="Aún no hay grupos"
          desc="Crea un grupo por cada docente del piloto y cárgale el listado de sus alumnos.">
          <Btn variant="gradient" size="sm" onClick={abrirNuevo}>+ Nuevo grupo</Btn>
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups.map(g => (
            <div key={g.id} style={{ ...card, padding: '12px 16px', display: 'flex',
              alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 160, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>
                  {g.name}{g.grade ? <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {g.grade}</span> : null}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  👤 {nombreDocente(g.teacher_id)} · 🏫 {nombreColegio(g.institution_id)}
                </div>
              </div>
              <Pill tone={counts[g.id] ? 'success' : 'muted'} onClick={() => setRosterGroup(g)}
                title="Cargar o revisar el listado de alumnos">
                📋 {counts[g.id] ?? 0} alumnos
              </Pill>
              <Pill tone={planCounts[g.id] ? 'success' : 'muted'} onClick={() => setPlanGroup(g)}
                title="Orden de las unidades del libro y ejes articuladores">
                📚 {planCounts[g.id] ?? 0} unidades
              </Pill>
              <Btn variant="ghost" size="sm" onClick={() => setEviGroup(g)}>📊 Evidencia</Btn>
              <RowMenu items={[
                { icon: '📋', label: 'Listado de alumnos', onClick: () => setRosterGroup(g) },
                { icon: '📚', label: 'Plan de unidades del libro', onClick: () => setPlanGroup(g) },
                { icon: '📊', label: 'Actas y efectividad', onClick: () => setEviGroup(g) },
                { icon: '✏️', label: 'Editar grupo', onClick: () => abrirEdicion(g) },
                { icon: '🗑️', label: 'Eliminar', danger: true, onClick: () => eliminar(g) },
              ]} />
            </div>
          ))}
        </div>
      )}

      {/* ── Crear / editar grupo ── */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar grupo' : 'Nuevo grupo'} width={480}>
        {form && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Nombre del grupo *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. 11-A" style={inp} autoFocus />
              </div>
              <div>
                <label style={lbl}>Grado</label>
                <input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  placeholder="Ej. Once" style={inp} />
              </div>
            </div>

            <label style={lbl}>Docente responsable *</label>
            <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              style={{ ...inp, marginBottom: 12 }}>
              <option value="">Elige el docente…</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}{d.ui_variant === 'clone' ? ' — modo clon' : ''}{d.institution ? ` · ${d.institution}` : ''}
                </option>
              ))}
            </select>
            {!docentes.length && (
              <p style={{ fontSize: 12, color: 'var(--warn, #D97706)', marginTop: -6, marginBottom: 12 }}>
                No hay estudiantes visibles para asignar como docentes.
              </p>
            )}

            <label style={lbl}>Colegio</label>
            <select value={form.institutionId} onChange={e => setForm(f => ({ ...f, institutionId: e.target.value }))}
              style={{ ...inp, marginBottom: 12 }}>
              <option value="">— Sin colegio —</option>
              {myInstitutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>

            <label style={lbl}>Curso (opcional)</label>
            <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              style={{ ...inp, marginBottom: 16 }}>
              <option value="">— Ninguno —</option>
              {courses.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {formErr && (
              <p style={{ fontSize: 12.5, color: 'var(--error)', fontWeight: 600, marginBottom: 12 }}>⚠️ {formErr}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" full onClick={() => setForm(null)}>Cancelar</Btn>
              <Btn variant="gradient" full disabled={busy} onClick={guardar}>
                {busy ? '⏳ Guardando…' : 'Guardar'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Listado de alumnos ── */}
      <Modal open={!!rosterGroup} onClose={() => setRosterGroup(null)} title="Listado de alumnos" width={560}>
        {rosterGroup && (
          <RosterModal group={rosterGroup}
            onSaved={(count) => setCounts(c => ({ ...c, [rosterGroup.id]: count }))} />
        )}
      </Modal>

      {/* ── Plan de unidades del libro (lo ve el docente en su módulo 5) ── */}
      <Modal open={!!planGroup} onClose={() => setPlanGroup(null)}
        title={planGroup ? `Plan de unidades · ${planGroup.name}` : ''} width={620}>
        {planGroup && (
          <UnitPlanModal group={planGroup}
            onSaved={(count) => setPlanCounts(c => ({ ...c, [planGroup.id]: count }))} />
        )}
      </Modal>

      {/* ── Evidencia del grupo ── */}
      <Modal open={!!eviGroup} onClose={() => setEviGroup(null)}
        title={eviGroup ? `Evidencia · ${eviGroup.name}` : ''} width={560}>
        {eviGroup && <EvidenceModal group={eviGroup} />}
      </Modal>
    </div>
  )
}

export default CloneGroupsPage
