import React from 'react'
import {
  useStore, INITIAL_INSTITUTIONS, AREAS,
  createInstitution, updateInstitution, deleteInstitution, setInstitutionActive,
  toggleCourseForInstitution, setInstitutionCourseExpiry,
  assignInstructorInstitution, removeInstructorInstitution, loadInstructorInstitutions,
  setAccountActive, isBaseCourse
} from '../store/store.jsx'
import { useMobile, Btn, PlusIc, TrashIc, CheckIc, Modal } from '../components/ui.jsx'
import {
  PageHead, StatsRow, SearchInput, Pill, EmptyState, UserAvatar,
  usePaged, Pagination, Drawer, DrawerTabs, inputStyle
} from '../components/adminUI.jsx'

// Un estudiante pertenece al colegio por institution_id; las cuentas antiguas
// sin id se resuelven por nombre (mismo criterio que el resto de la app).
const belongsTo = (acc, inst) =>
  acc.institution_id ? acc.institution_id === inst.id : (acc.institution || '') === inst.name

const daysUntil = (iso) => Math.ceil((new Date(iso) - new Date()) / 86_400_000)

// ── Selector de vigencia (indefinido / hasta una fecha) ──────
const ExpiryPicker = ({ initial, saving, onSave, onCancel, confirmLabel = 'Guardar' }) => {
  const [mode, setMode] = React.useState(initial ? 'date' : 'indef')
  const [date, setDate] = React.useState(initial ? initial.slice(0, 10) : '')
  const today = new Date().toISOString().slice(0, 10)
  const canSave = mode === 'indef' || !!date
  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>Vigencia del curso para este colegio</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: mode === 'date' ? 8 : 12 }}>
        <Btn variant={mode === 'indef' ? 'gradient' : 'secondary'} size="sm" full onClick={() => setMode('indef')}>♾️ Indefinido</Btn>
        <Btn variant={mode === 'date' ? 'gradient' : 'secondary'} size="sm" full onClick={() => setMode('date')}>📅 Hasta una fecha</Btn>
      </div>
      {mode === 'date' && (
        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle(false), marginBottom: 12 }} />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" size="sm" full onClick={onCancel}>Cancelar</Btn>
        <Btn variant="gradient" size="sm" full disabled={!canSave || saving}
          onClick={() => onSave(mode === 'indef' ? null : new Date(date + 'T23:59:59').toISOString())}>
          {saving ? 'Guardando…' : confirmLabel}
        </Btn>
      </div>
    </div>
  )
}

// ── Pestaña CURSOS: habilitar/deshabilitar cursos del colegio ──
const CoursesTab = ({ inst }) => {
  const courses = useStore(s => s.courses || [])
  const institutionCourses = useStore(s => s.institutionCourses || [])
  const userCourses = useStore(s => s.userCourses || [])
  const accounts = useStore(s => s.accounts)

  const baseCourses = React.useMemo(() => courses.filter(isBaseCourse), [courses])
  const students = React.useMemo(
    () => accounts.filter(a => a.role === 'student' && belongsTo(a, inst)),
    [accounts, inst]
  )
  const studentIds = React.useMemo(() => new Set(students.map(s => s.id).filter(Boolean)), [students])

  // { courseId, mode: 'enable' | 'edit' }
  const [expiryFor, setExpiryFor] = React.useState(null)
  const [busyId, setBusyId] = React.useState(null)
  const [msg, setMsg] = React.useState(null)

  const rowOf = (courseId) =>
    institutionCourses.find(r => r.course_id === courseId && r.institution_id === inst.id)

  const accessCount = (courseId) =>
    userCourses.filter(uc => uc.course_id === courseId && uc.is_active && studentIds.has(uc.user_id)).length

  const enable = async (courseId, expiresAt) => {
    setBusyId(courseId)
    setExpiryFor(null)
    const res = await toggleCourseForInstitution(courseId, inst.id, true, expiresAt)
    setBusyId(null)
    const n = res?.count ?? 0
    setMsg(n > 0
      ? `✅ Curso habilitado. ${n} docente${n !== 1 ? 's' : ''} del colegio inscrito${n !== 1 ? 's' : ''} automáticamente.`
      : '✅ Curso habilitado. El colegio no tiene docentes para inscribir.')
    setTimeout(() => setMsg(null), 5000)
  }

  const disable = async (courseId) => {
    setBusyId(courseId)
    setExpiryFor(null)
    await toggleCourseForInstitution(courseId, inst.id, false)
    setBusyId(null)
    setMsg('El curso se deshabilitó para el colegio. Las matrículas y el progreso existentes no se borran.')
    setTimeout(() => setMsg(null), 5000)
  }

  const saveExpiry = async (courseId, expiresAt) => {
    setBusyId(courseId)
    await setInstitutionCourseExpiry(courseId, inst.id, expiresAt)
    setBusyId(null)
    setExpiryFor(null)
  }

  if (baseCourses.length === 0) {
    return <EmptyState icon="📚" title="Sin cursos" desc="Crea cursos en el Gestor de Cursos para poder habilitarlos aquí." />
  }

  return (
    <div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>
        Al habilitar un curso, <strong>todos los docentes del colegio quedan inscritos automáticamente</strong>.
        Los docentes nuevos que se creen en el colegio también recibirán el curso.
      </p>
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--success-bg, #CCFBF1)',
          border: '1px solid var(--success-border, #5EEAD4)', fontSize: 12.5, color: 'var(--dark)', marginBottom: 12 }}>
          {msg}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {baseCourses.map(course => {
          const row = rowOf(course.id)
          const enabled = !!row?.is_active
          const isExpired = enabled && !!row?.expires_at && new Date(row.expires_at) < new Date()
          const soon = enabled && !isExpired && !!row?.expires_at && daysUntil(row.expires_at) <= 14
          const withAccess = enabled ? accessCount(course.id) : 0
          const globallyOff = course.is_active === false
          const busy = busyId === course.id
          return (
            <div key={course.id} style={{ borderRadius: 12, border: `1.5px solid ${enabled ? 'var(--success-border, #5EEAD4)' : 'var(--border)'}`,
              background: enabled ? 'var(--success-bg, #F0FDFA)' : 'var(--white)', padding: '12px 14px', opacity: busy ? .6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, background: (course.color || 'var(--orange)') + '22', overflow: 'hidden' }}>
                  {course.cover_image ? <img src={course.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📖'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {course.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
                    {globallyOff && <Pill tone="muted">curso inactivo global</Pill>}
                    {enabled && (
                      <Pill tone={isExpired ? 'error' : soon ? 'warn' : 'success'}
                        onClick={() => setExpiryFor({ courseId: course.id, mode: 'edit' })}
                        title="Click para cambiar la vigencia">
                        {row?.expires_at
                          ? `${isExpired ? '⛔ venció' : soon ? '⏳ vence' : '📅 vence'} ${new Date(row.expires_at).toLocaleDateString('es-CO')}`
                          : '♾️ vigencia indefinida'}
                      </Pill>
                    )}
                    {enabled && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                        {withAccess}/{students.length} docentes con acceso
                      </span>
                    )}
                  </div>
                </div>
                {enabled ? (
                  <Btn variant="secondary" size="sm" disabled={busy} onClick={() => disable(course.id)}>Deshabilitar</Btn>
                ) : (
                  <Btn variant="gradient" size="sm" disabled={busy || globallyOff}
                    onClick={() => setExpiryFor({ courseId: course.id, mode: 'enable' })}>
                    {busy ? '⏳' : 'Habilitar'}
                  </Btn>
                )}
              </div>
              {expiryFor?.courseId === course.id && (
                <ExpiryPicker
                  initial={expiryFor.mode === 'edit' ? row?.expires_at : null}
                  saving={busy}
                  confirmLabel={expiryFor.mode === 'enable' ? 'Habilitar curso' : 'Guardar'}
                  onCancel={() => setExpiryFor(null)}
                  onSave={(expiresAt) => expiryFor.mode === 'enable'
                    ? enable(course.id, expiresAt)
                    : saveExpiry(course.id, expiresAt)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Pestaña DOCENTES: los estudiantes del colegio ────────────
const TeachersTab = ({ inst }) => {
  const accounts = useStore(s => s.accounts)
  const [search, setSearch] = React.useState('')

  const students = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts
      .filter(a => a.role === 'student' && belongsTo(a, inst))
      .filter(a => !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
  }, [accounts, inst, search])

  const { paged, page, pages, setPage, total } = usePaged(students, 12)

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar docente..." style={{ marginBottom: 12 }} />
      {students.length === 0 ? (
        <EmptyState icon="👥" title={search ? 'Sin resultados' : 'Sin docentes'}
          desc={search ? 'Ningún docente coincide con la búsqueda.' : 'Este colegio aún no tiene docentes registrados. Créalos desde Gestión de Usuarios.'} />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paged.map(acc => {
              const area = AREAS.find(a => a.id === acc.area)
              const isActive = acc.is_active !== false
              return (
                <div key={acc.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, border: '1px solid var(--border)', background: 'var(--white)', opacity: isActive ? 1 : .55 }}>
                  <UserAvatar acc={acc} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.email}{area ? ` · ${area.icon} ${area.name}` : ''}
                    </div>
                  </div>
                  {!isActive && <Pill tone="error">Inactivo</Pill>}
                  {acc.id && (
                    <button onClick={() => setAccountActive(acc.id, !isActive)}
                      title={isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
                      style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)',
                        color: 'var(--text-sec)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {isActive ? '🚫 Desactivar' : '✅ Activar'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <Pagination page={page} pages={pages} setPage={setPage} total={total} label="docentes" />
        </>
      )}
    </div>
  )
}

// ── Pestaña INSTRUCTORES: quién gestiona este colegio ────────
const InstructorsTab = ({ inst }) => {
  const accounts = useStore(s => s.accounts)
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const [saving, setSaving] = React.useState(false)
  const [selectValue, setSelectValue] = React.useState('')

  const instructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor'), [accounts])
  const assignedIds = React.useMemo(
    () => instructorInstitutions.filter(ii => ii.institution_id === inst.id).map(ii => ii.instructor_id),
    [instructorInstitutions, inst.id]
  )
  const assigned = instructors.filter(i => assignedIds.includes(i.id))
  const available = instructors.filter(i => !assignedIds.includes(i.id))

  const add = async (instructorId) => {
    if (!instructorId) return
    setSaving(true)
    await assignInstructorInstitution(instructorId, inst.id)
    setSaving(false)
    setSelectValue('')
  }
  const remove = async (instructorId) => {
    setSaving(true)
    await removeInstructorInstitution(instructorId, inst.id)
    setSaving(false)
  }

  return (
    <div>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 14 }}>
        Los instructores asignados pueden ver y acompañar a los docentes de este colegio.
      </p>
      {instructors.length === 0 ? (
        <EmptyState icon="🧑‍🏫" title="Sin instructores" desc="Crea cuentas con rol instructor desde Gestión de Usuarios." />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {assigned.length === 0 && (
              <div style={{ padding: '14px 16px', borderRadius: 10, border: '2px dashed var(--border)',
                fontSize: 12.5, color: 'var(--subtle)', textAlign: 'center' }}>
                Este colegio no tiene instructores asignados.
              </div>
            )}
            {assigned.map(instr => (
              <div key={instr.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, border: '1.5px solid var(--success-border, #5EEAD4)', background: 'var(--success-bg, #F0FDFA)' }}>
                <UserAvatar acc={instr} size={32} bg="var(--success-bg, #CCFBF1)" color="var(--success)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{instr.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{instr.email}</div>
                </div>
                <button onClick={() => remove(instr.id)} disabled={saving}
                  style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--error)', background: 'none',
                    color: 'var(--error)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600 }}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
          {available.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                Asignar instructor
              </label>
              <select value={selectValue} disabled={saving} onChange={e => add(e.target.value)} style={inputStyle(false)}>
                <option value="">— Selecciona para asignar —</option>
                {available.map(i => <option key={i.id} value={i.id}>{i.name} ({i.email})</option>)}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Pestaña AJUSTES: renombrar, suspender, eliminar ──────────
const SettingsTab = ({ inst, studentCount, onDeleted }) => {
  const [name, setName] = React.useState(inst.name)
  const [saved, setSaved] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState(false)
  const isActive = inst.is_active !== false

  const saveName = () => {
    if (!name.trim() || name.trim() === inst.name) return
    updateInstitution(inst.id, name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
          Nombre de la institución
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle(false)}
            onKeyDown={e => e.key === 'Enter' && saveName()} />
          <Btn variant="gradient" size="sm" disabled={!name.trim() || name.trim() === inst.name} onClick={saveName}>
            {saved ? '✅' : 'Guardar'}
          </Btn>
        </div>
      </div>

      <div style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', flex: 1 }}>
            {isActive ? 'Colegio activo' : 'Colegio suspendido'}
          </span>
          <Pill tone={isActive ? 'success' : 'error'}>{isActive ? 'Activo' : 'Suspendido'}</Pill>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
          {isActive
            ? 'Al suspenderlo, todos sus usuarios quedan bloqueados en su próximo inicio de sesión (los admins no se bloquean).'
            : 'Los usuarios de este colegio están bloqueados. Reactívalo para devolverles el acceso.'}
        </p>
        <Btn variant={isActive ? 'secondary' : 'gradient'} size="sm" onClick={() => setInstitutionActive(inst.id, !isActive)}>
          {isActive ? '🚫 Suspender colegio' : '✅ Reactivar colegio'}
        </Btn>
      </div>

      <div style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid var(--error-bg, #FEE2E2)', background: 'var(--white)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>Zona de riesgo</div>
        {!deleteConfirm ? (
          <>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
              Eliminar el colegio no borra las cuentas de sus {studentCount} docente{studentCount !== 1 ? 's' : ''}, pero quedan sin colegio asignado.
            </p>
            <Btn variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}><TrashIc s={13} c="#fff" /> Eliminar colegio</Btn>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--text-sec)', lineHeight: 1.5, marginBottom: 10 }}>
              ¿Eliminar <strong>{inst.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" full onClick={() => setDeleteConfirm(false)}>Cancelar</Btn>
              <Btn variant="danger" size="sm" full onClick={() => { deleteInstitution(inst.id); onDeleted() }}>Sí, eliminar</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
const SchoolsAdminPage = () => {
  const institutions = useStore(s => s.institutions || INITIAL_INSTITUTIONS)
  const accounts = useStore(s => s.accounts)
  const institutionCourses = useStore(s => s.institutionCourses || [])
  const isMobile = useMobile()

  const [search, setSearch] = React.useState('')
  const [showCreate, setShowCreate] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [nameError, setNameError] = React.useState('')
  const [openId, setOpenId] = React.useState(null)
  const [tab, setTab] = React.useState('courses')

  // La asignación instructor↔colegio solo se carga en el bootstrap de sesión
  // restaurada; recargarla aquí garantiza datos frescos tras un login directo.
  React.useEffect(() => { loadInstructorInstitutions() }, [])

  const openInst = institutions.find(i => i.id === openId) || null

  const statsByInst = React.useMemo(() => {
    const map = {}
    institutions.forEach(inst => {
      map[inst.id] = {
        students: accounts.filter(a => a.role === 'student' && belongsTo(a, inst)).length,
        courses: institutionCourses.filter(r => r.institution_id === inst.id && r.is_active).length,
        expiring: institutionCourses.filter(r => r.institution_id === inst.id && r.is_active &&
          r.expires_at && daysUntil(r.expires_at) <= 14).length,
      }
    })
    return map
  }, [institutions, accounts, institutionCourses])

  const totalStudents = React.useMemo(() => accounts.filter(a => a.role === 'student').length, [accounts])
  const totalInstructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor').length, [accounts])
  const activeCount = institutions.filter(i => i.is_active !== false).length

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return institutions
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [institutions, search])

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) { setNameError('Nombre requerido'); return }
    if (institutions.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Ya existe una institución con ese nombre'); return
    }
    createInstitution(trimmed)
    setNewName(''); setNameError(''); setShowCreate(false)
  }

  const openDrawer = (inst, initialTab = 'courses') => {
    setOpenId(inst.id)
    setTab(initialTab)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <PageHead title="Gestión de Colegios"
        subtitle="Todo lo de un colegio en un solo lugar: cursos, docentes e instructores">
        <Btn variant="gradient" onClick={() => setShowCreate(true)}>
          <PlusIc s={16} c="#fff" /> Nueva institución
        </Btn>
      </PageHead>

      <StatsRow stats={[
        { label: 'Colegios', value: institutions.length, color: 'var(--purple)', icon: '🏫' },
        { label: 'Activos', value: activeCount, color: 'var(--success)' },
        { label: 'Docentes', value: totalStudents, color: 'var(--orange)' },
        { label: 'Instructores', value: totalInstructors, color: 'var(--success)' },
      ]} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar institución..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🏫"
          title={search ? 'Sin resultados' : 'Sin instituciones'}
          desc={search ? 'Ninguna institución coincide con la búsqueda.' : 'Crea la primera institución para empezar.'}>
          {!search && <Btn variant="gradient" onClick={() => setShowCreate(true)}>Crear institución</Btn>}
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(inst => {
            const st = statsByInst[inst.id] || { students: 0, courses: 0, expiring: 0 }
            const isActive = inst.is_active !== false
            return (
              <div key={inst.id} onClick={() => openDrawer(inst)}
                style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'box-shadow .2s, transform .15s', opacity: isActive ? 1 : .6 }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-sm)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--purple-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>🏫</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--dark)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
                    <div style={{ marginTop: 3, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {!isActive && <Pill tone="error">Suspendido</Pill>}
                      {st.expiring > 0 && <Pill tone="warn">⏳ {st.expiring} curso{st.expiring !== 1 ? 's' : ''} por vencer</Pill>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {[
                    { n: st.students, label: 'docentes', tab: 'teachers' },
                    { n: st.courses, label: 'cursos', tab: 'courses' },
                  ].map(x => (
                    <button key={x.label}
                      onClick={e => { e.stopPropagation(); openDrawer(inst, x.tab) }}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)' }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--dark)' }}>{x.n}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 5 }}>{x.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Panel de detalle del colegio */}
      <Drawer open={!!openInst} onClose={() => setOpenId(null)}
        title={openInst?.name} subtitle="Gestión del colegio"
        headerExtra={openInst && openInst.is_active === false ? <Pill tone="error" style={{ marginTop: 6 }}>Suspendido</Pill> : null}>
        {openInst && (
          <>
            <DrawerTabs active={tab} onChange={setTab} tabs={[
              { key: 'courses', label: '📚 Cursos' },
              { key: 'teachers', label: '👥 Docentes' },
              { key: 'instructors', label: '🧑‍🏫 Instructores' },
              { key: 'settings', label: '⚙️ Ajustes' },
            ]} />
            {tab === 'courses' && <CoursesTab key={openInst.id} inst={openInst} />}
            {tab === 'teachers' && <TeachersTab key={openInst.id} inst={openInst} />}
            {tab === 'instructors' && <InstructorsTab key={openInst.id} inst={openInst} />}
            {tab === 'settings' && (
              <SettingsTab key={openInst.id} inst={openInst}
                studentCount={statsByInst[openInst.id]?.students || 0}
                onDeleted={() => setOpenId(null)} />
            )}
          </>
        )}
      </Drawer>

      {/* Modal crear institución */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewName(''); setNameError('') }} title="Nueva institución educativa" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>
              Nombre de la institución
            </label>
            <input value={newName} onChange={e => { setNewName(e.target.value); setNameError('') }}
              placeholder="Ej: IED San Francisco" style={inputStyle(!!nameError)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            {nameError && <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{nameError}</p>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" full onClick={() => { setShowCreate(false); setNewName(''); setNameError('') }}>Cancelar</Btn>
            <Btn variant="gradient" full onClick={handleCreate}>Crear institución</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SchoolsAdminPage
