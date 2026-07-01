import React from 'react'
import {
  useStore, AREAS, getScopeModules, TRANSVERSAL_AREA,
  saveRouteConfig, routeKey, publishRouteToCourse,
  forkCourseForInstitution, loadCourseForEditing, saveCourseModules,
} from '../store/store.jsx'
import { useMobile, ChevRIc, XIc, PlusIc, TrashIc, EditIc, GripIc, CheckIc, Btn, Modal } from '../components/ui.jsx'
import {
  TYPE_LABELS, TYPE_COLORS, TYPE_BG, CHALLENGE_TYPES,
  ChallengeEditorModal, QuizCreatorModal, CustomModuleModal,
  NewChallengeModal, RoutePreviewModal,
} from '../components/route-editor/index.js'

// Pestañas del modo DCE (fallback sin curso)
const TRANSVERSAL_SCOPE = { id: TRANSVERSAL_AREA, name: 'Transversal', icon: '🌐', color: '#4F46E5' }
const SCOPES = [TRANSVERSAL_SCOPE, ...AREAS]
const scopeName = (id) => SCOPES.find(s => s.id === id)?.name || id
const isTransversal = (id) => id === TRANSVERSAL_AREA

// ─── Módulo individual en la lista ───────────────────────────────────────────
const ModuleRow = ({ mod, idx, dragIdx, overIdx, isMobile,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDuplicate, onToggle, onDelete, showDelete }) => {
  const isOver = overIdx === idx
  return (
    <div draggable
      onDragStart={onDragStart} onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={onDrop} onDragEnd={onDragEnd}
      style={{
        borderRadius: 14,
        background: mod.enabled ? 'var(--white)' : 'var(--bg)',
        border: isOver ? '2px dashed var(--orange)' : mod.enabled ? '1px solid var(--border)' : '1px dashed var(--border)',
        opacity: dragIdx === idx ? .4 : mod.enabled ? 1 : .55,
        transition: 'all .15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
        <GripIc s={16} c="var(--subtle)" />
        <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
          background: TYPE_BG[mod.type] || 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type] || 'var(--muted)' }}>{idx + 1}</div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
            background: TYPE_BG[mod.type] || 'var(--bg-alt)', color: TYPE_COLORS[mod.type] || 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: .8 }}>{TYPE_LABELS[mod.type] || 'MÓDULO'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: mod.enabled ? 'var(--dark)' : 'var(--subtle)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
          {mod.override && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
              background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>EDITADO</span>
          )}
        </div>
        <button onClick={onEdit} title="Editar contenido"
          style={{ background: mod.override ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EditIc s={13} c={mod.override ? 'var(--orange)' : 'var(--muted)'} />
        </button>
        <button onClick={onDuplicate} title="Duplicar"
          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>⧉</button>
        {showDelete && (
          <button onClick={onDelete} title="Eliminar"
            style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrashIc s={13} c="var(--error)" />
          </button>
        )}
        <div onClick={onToggle}
          style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
            background: mod.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
          <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
            left: mod.enabled ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Modo Curso: edita los módulos reales de la copia del tutor ───────────────
const CourseEditor = ({ courseId, courseName: initialName, onBack }) => {
  const isMobile = useMobile()
  const courses  = useStore(s => s.courses || [])
  // El tema del curso (los forks copian el theme del padre) alimenta el preview temático.
  const courseTheme = React.useMemo(() => courses.find(c => c.id === courseId)?.theme || null, [courses, courseId])
  const [moduleList, setModuleList]     = React.useState([])
  const [loading, setLoading]           = React.useState(true)
  const [loadErr, setLoadErr]           = React.useState('')
  const [courseName, setCourseName]     = React.useState(initialName || '')
  const [saving, setSaving]             = React.useState(false)
  const [savedMsg, setSavedMsg]         = React.useState('')
  const [dragIdx, setDragIdx]           = React.useState(null)
  const [overIdx, setOverIdx]           = React.useState(null)
  const [editingModule, setEditingModule]       = React.useState(null)
  const [editingChallenge, setEditingChallenge] = React.useState(null)
  const [editingQuiz, setEditingQuiz]           = React.useState(null)
  const [showNewChallenge, setShowNewChallenge] = React.useState(false)
  const [showAddModule, setShowAddModule]       = React.useState(false)
  const [showPreview, setShowPreview]           = React.useState(false)

  React.useEffect(() => {
    setLoading(true); setLoadErr('')
    loadCourseForEditing(courseId).then(({ modules, error }) => {
      if (error) { setLoadErr(error); setLoading(false); return }
      setModuleList(modules)
      setLoading(false)
    })
  }, [courseId])

  // ─── drag & drop ───
  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setModuleList(next); setDragIdx(null); setOverIdx(null)
  }

  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  const deleteModule  = (id) => setModuleList(l => l.filter(m => m.id !== id))

  const duplicateModule = (mod) => {
    const dup = {
      ...mod,
      id: 'new_' + Date.now(),
      title: 'Copia — ' + mod.title,
      _dbRow: null,
    }
    setModuleList(l => [...l, dup])
  }

  // ─── edición de contenido ───
  const saveBaseModuleOverride = (data) => {
    const { title, desc, task, xp, content } = data
    setModuleList(l => l.map(m => m.id === editingModule?.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } } : m))
    setEditingModule(null)
  }

  const saveChallengeOverride = (override) => {
    if (override.__clearOverride) {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, override: null } : m))
    } else if (editingChallenge?.isNew) {
      setModuleList(l => [...l, {
        id: 'new_' + Date.now(), type: 'challenge',
        ctype: editingChallenge.ctype, enabled: true,
        _dbRow: null, ...override,
      }])
    } else {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, ...override, override: { ...(m.override || {}), ...override } } : m))
    }
    setEditingChallenge(null)
  }

  const saveQuizCustom = (mod) => {
    if (!editingQuiz?.id || editingQuiz?.isNew) {
      setModuleList(l => [...l, { id: 'new_' + Date.now(), enabled: true, _dbRow: null, ...mod }])
    } else {
      setModuleList(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
    }
    setEditingQuiz(null)
  }

  const handleNewChallenge = ({ ctype, title, desc, task, xp }) => {
    setShowNewChallenge(false)
    const template = { isNew: true, type: 'challenge', ctype, title, desc, task, xp }
    if (ctype === 'quiz') setEditingQuiz({ ...template, questions: [] })
    else setEditingChallenge(template)
  }

  const addFinalDelivery = () => {
    if (moduleList.some(m => m.type === 'final_delivery')) return
    setModuleList(l => [...l, {
      id: 'new_fd_' + Date.now(), type: 'final_delivery', ctype: null,
      title: 'Entrega Final', desc: 'Sube tu rejilla pedagógica.',
      task: '', xp: 300, enabled: true, _dbRow: null,
    }])
  }

  const addCustomModule = (mod) => {
    setModuleList(l => [...l, { id: 'new_' + Date.now(), enabled: true, _dbRow: null, ...mod }])
  }

  // ─── guardar ───
  const handleSave = async () => {
    setSaving(true); setSavedMsg('')
    const result = await saveCourseModules(courseId, moduleList, courseName)
    setSaving(false)
    if (result.error) { setSavedMsg('⚠️ ' + result.error); return }
    // Recarga para obtener los UUIDs reales de los módulos nuevos
    const { modules } = await loadCourseForEditing(courseId)
    setModuleList(modules)
    setSavedMsg('✅ Guardado correctamente')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const btnRow = (onClick, color, bg, hoverBg, icon, label) => ({
    onClick, onMouseEnter: e => e.currentTarget.style.background = hoverBg,
    onMouseLeave: e => e.currentTarget.style.background = bg,
    style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
      border: `2px dashed ${color}`, background: bg, color, cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' },
  })

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Cargando módulos…</div>
  if (loadErr) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)', fontSize: 14 }}>⚠️ {loadErr}</div>

  const activeCount = moduleList.filter(m => m.enabled).length

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} title="Volver"
            style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            ← Volver
          </button>
          <div>
            <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>Editar módulos del curso</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Esta es tu versión personal — los cambios solo aplican a tu colegio</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 13, fontWeight: 600, color: savedMsg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{savedMsg}</span>}
          <Btn variant="secondary" onClick={() => setShowPreview(true)}>👁 Vista previa</Btn>
          <Btn variant="gradient" disabled={saving} onClick={handleSave}>{saving ? '⏳ Guardando…' : '💾 Guardar cambios'}</Btn>
        </div>
      </div>

      {/* Nombre del curso */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
          Nombre personalizado del curso
        </label>
        <input value={courseName} onChange={e => setCourseName(e.target.value)}
          placeholder="Ej: Laboratorio — IED San Francisco"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Este nombre solo lo ves tú y tus estudiantes de este colegio</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
              Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => (
              <ModuleRow key={mod.id}
                mod={mod} idx={i} dragIdx={dragIdx} overIdx={overIdx} isMobile={isMobile}
                onDragStart={() => setDragIdx(i)}
                onDragOver={() => setOverIdx(i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                onEdit={() => {
                  if (mod.type === 'lesson' || mod.type === 'final_delivery') setEditingModule(mod)
                  else if (mod.ctype === 'quiz') setEditingQuiz(mod)
                  else setEditingChallenge(mod)
                }}
                onDuplicate={() => duplicateModule(mod)}
                onToggle={() => toggleEnabled(mod.id)}
                onDelete={() => deleteModule(mod.id)}
                showDelete={true}
              />
            ))}
          </div>

          <button {...btnRow(() => setShowNewChallenge(true), 'var(--purple)', 'var(--purple-bg)', '#EDE9FE')}>
            <PlusIc s={18} c="var(--purple)" /> Crear nuevo reto
          </button>
          <button {...btnRow(() => setShowAddModule(true), 'var(--success)', '#F0FDFA', '#CCFBF1')}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
          {!moduleList.some(m => m.type === 'final_delivery') && (
            <button {...btnRow(addFinalDelivery, 'var(--success)', '#CCFBF1', '#99F6E4')}>
              <PlusIc s={18} c="var(--success)" /> Agregar Entrega Final
            </button>
          )}
        </div>

        {/* Tips */}
        <div style={{ padding: 18, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo usar el editor</h4>
          {[
            { icon: '⋮⋮', text: 'Arrastra para cambiar el orden de los módulos.' },
            { icon: '✏️', text: 'Edita el contenido de cualquier módulo o reto.' },
            { icon: '⧉',  text: 'Duplica un módulo para reutilizarlo.' },
            { icon: '🗑️', text: 'Elimina módulos que no necesites.' },
            { icon: '🟢', text: 'Activa o desactiva módulos con el toggle.' },
            { icon: '💾', text: 'Guarda para que tus estudiantes vean los cambios.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: 10, borderRadius: 10, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <p style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              ✏️ Estás editando tu versión personal del curso. Los cambios solo afectan a los estudiantes de tu colegio.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewChallengeModal open={showNewChallenge} onClose={() => setShowNewChallenge(false)} onCreate={handleNewChallenge} />
      <ChallengeEditorModal open={!!editingChallenge} mod={editingChallenge} onClose={() => setEditingChallenge(null)} onSave={saveChallengeOverride} />
      <QuizCreatorModal open={!!editingQuiz} initial={editingQuiz?.isNew ? null : editingQuiz} onClose={() => setEditingQuiz(null)} onSave={saveQuizCustom} />
      <CustomModuleModal open={!!editingModule} initial={editingModule}
        onClose={() => setEditingModule(null)} onSave={saveBaseModuleOverride} />
      <CustomModuleModal open={showAddModule}
        onClose={() => setShowAddModule(false)}
        onSave={mod => { addCustomModule(mod); setShowAddModule(false) }} />
      <RoutePreviewModal open={showPreview} onClose={() => setShowPreview(false)}
        area={SCOPES[0]} moduleList={moduleList} customModules={[]} theme={courseTheme} />
    </div>
  )
}

// ─── Selector: colegio → curso → crear/abrir copia ───────────────────────────
const InstructorRouteEditor = () => {
  const routeConfigs           = useStore(s => s.routeConfigs)
  const namedRoutes            = useStore(s => s.namedRoutes)
  const institutions           = useStore(s => s.institutions)
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const institutionCourses     = useStore(s => s.institutionCourses || [])
  const courses                = useStore(s => s.courses || [])
  const userCourses            = useStore(s => s.userCourses || [])
  const user                   = useStore(s => s.user)
  const isMobile = useMobile()

  // Instituciones a las que este instructor está asignado.
  // Si no tiene ninguna asignada en instructor_institutions pero sí tiene
  // institution_id en su perfil, se usa esa como fallback (ej. instructores
  // creados antes de que existiera la tabla instructor_institutions).
  const myInstitutions = React.useMemo(() => {
    const assigned = instructorInstitutions
      .filter(ii => ii.instructor_id === user?.id)
      .map(ii => institutions.find(i => i.id === ii.institution_id))
      .filter(Boolean)
    if (assigned.length > 0) return assigned
    // fallback: institución del perfil
    if (user?.institution_id) {
      const inst = institutions.find(i => i.id === user.institution_id)
      return inst ? [inst] : []
    }
    return []
  }, [instructorInstitutions, institutions, user])

  // Si solo tiene una institución, pre-seleccionarla
  const [routeInstitution, setRouteInstitution] = React.useState(() =>
    myInstitutions.length === 1 ? myInstitutions[0].id : '')

  React.useEffect(() => {
    if (myInstitutions.length === 1 && !routeInstitution)
      setRouteInstitution(myInstitutions[0].id)
  }, [myInstitutions])

  // ── Modo curso (fork activo) ──
  const [activeFork, setActiveFork] = React.useState(null) // { id, name }

  // ── Modo DCE (fallback) ──
  const [activeArea, setActiveArea]       = React.useState(TRANSVERSAL_AREA)
  const [moduleList, setModuleList]       = React.useState([])
  const [customModules, setCustomModules] = React.useState([])
  const [saving, setSaving]               = React.useState(false)
  const [saved, setSaved]                 = React.useState(false)
  const [publishing, setPublishing]       = React.useState(false)
  const [publishResult, setPublishResult] = React.useState(null)
  const [routeName, setRouteName]         = React.useState('')
  const [dragIdx, setDragIdx]     = React.useState(null)
  const [overIdx, setOverIdx]     = React.useState(null)
  const [showAddModule, setShowAddModule]         = React.useState(false)
  const [editingModule, setEditingModule]         = React.useState(null)
  const [editingBaseModule, setEditingBaseModule] = React.useState(null)
  const [editingChallenge, setEditingChallenge]   = React.useState(null)
  const [editingQuiz, setEditingQuiz]             = React.useState(null)
  const [showNewChallenge, setShowNewChallenge]   = React.useState(false)
  const [showPreview, setShowPreview]             = React.useState(false)

  // ── Selector de curso (dentro del colegio) ──
  const [selectedCourseId, setSelectedCourseId] = React.useState('')
  const [forking, setForking]   = React.useState(false)
  const [forkErr, setForkErr]   = React.useState('')

  // Cursos que el instructor tiene acceso Y que están en la institución seleccionada
  const allowedCourseIds = React.useMemo(() =>
    new Set(userCourses.filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id)),
    [userCourses, user])

  const linkedCourses = React.useMemo(() => {
    if (!routeInstitution) return []
    return institutionCourses
      .filter(r => r.institution_id === routeInstitution && r.is_active)
      .map(r => courses.find(c => c.id === r.course_id))
      .filter(c => c && (allowedCourseIds.size === 0 || allowedCourseIds.has(c.id)) && !c.parent_course_id)
  }, [routeInstitution, institutionCourses, courses, allowedCourseIds])

  // Autoseleccionar si solo hay un curso
  React.useEffect(() => {
    if (linkedCourses.length === 1) setSelectedCourseId(linkedCourses[0].id)
    else setSelectedCourseId('')
    setForkErr('')
  }, [routeInstitution])

  const selectedCourse = linkedCourses.find(c => c.id === selectedCourseId) || null

  // ¿Ya existe una copia de este tutor para este colegio?
  const existingFork = React.useMemo(() => {
    if (!selectedCourseId || !routeInstitution || !user?.id) return null
    return courses.find(c =>
      c.parent_course_id === selectedCourseId &&
      c.institution_id === routeInstitution &&
      c.owner_id === user.id
    ) || null
  }, [courses, selectedCourseId, routeInstitution, user])

  const handleOpenFork = async (useExisting) => {
    if (useExisting && existingFork) {
      setActiveFork({ id: existingFork.id, name: existingFork.name })
      return
    }
    if (!selectedCourseId || !routeInstitution) return
    setForking(true); setForkErr('')
    const result = await forkCourseForInstitution(selectedCourseId, routeInstitution)
    setForking(false)
    if (result.error) { setForkErr(result.error); return }
    setActiveFork({ id: result.id, name: result.name })
  }

  // ── Modo DCE: carga de módulos por área ──
  React.useEffect(() => {
    if (activeFork) return
    const defaults = getScopeModules(activeArea)
    const key = routeKey(activeArea, routeInstitution || null)
    const globalKey = routeKey(activeArea, null)
    const config = routeConfigs?.[key] || routeConfigs?.[globalKey]
    if (config?.modules?.length) {
      const cm = {}
      config.modules.forEach(mc => { cm[mc.id] = mc })
      const sorted = [...defaults]
        .sort((a, b) => (cm[a.id]?.order ?? 999) - (cm[b.id]?.order ?? 999))
        .map(m => ({
          ...m, enabled: cm[m.id]?.enabled !== false,
          ...(cm[m.id]?.override || {}), override: cm[m.id]?.override || null,
        }))
      setModuleList(sorted)
    } else {
      setModuleList(defaults.map(m => ({ ...m, enabled: true })))
    }
    setCustomModules(config?.customModules || [])
    const namedRoute = namedRoutes.find(r => r.area === activeArea && r.institution_id === (routeInstitution || null))
    setRouteName(namedRoute?.name || scopeName(activeArea) || '')
  }, [activeArea, routeInstitution, routeConfigs, namedRoutes, activeFork])

  // ── Modo DCE: drag & drop ──
  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setModuleList(next); setDragIdx(null); setOverIdx(null)
  }
  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  const addCustomModule  = (mod) => setCustomModules(l => [...l, { id: 'custom_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
  const saveEditedModule = (mod) => setCustomModules(l => l.map(m => m.id === editingModule?.id ? { ...m, ...mod } : m))
  const deleteCustom     = (id)  => setCustomModules(l => l.filter(m => m.id !== id))

  const duplicateModule = (mod) => setCustomModules(l => [...l, {
    id: 'custom_' + Date.now(), title: 'Copia — ' + mod.title,
    desc: mod.desc || '', task: mod.task || '', xp: mod.xp || 0,
    type: mod.type || 'lesson', ctype: mod.ctype || null,
    content: mod.content ? [...mod.content] : [],
    questions: mod.questions ? [...mod.questions] : [],
    dragItems: mod.dragItems || mod.override?.dragItems,
    empathyCards: mod.empathyCards || mod.override?.empathyCards,
    matchPairs: mod.matchPairs || mod.override?.matchPairs,
    enabled: true, order: moduleList.length + l.length,
  }])

  const addFinalDelivery = () => {
    if (customModules.some(m => m.type === 'final_delivery')) return
    setCustomModules(l => [...l, {
      id: 'final_delivery_' + Date.now(), type: 'final_delivery', ctype: null,
      title: 'Entrega Final', desc: 'Sube tu rejilla pedagógica.',
      task: '', xp: 300, enabled: true, order: moduleList.length + l.length,
    }])
  }

  const saveChallengeOverride = (override) => {
    if (override.__clearOverride) {
      const original = getScopeModules(activeArea).find(m => m.id === editingChallenge?.id)
      if (original) setModuleList(l => l.map(m => m.id === editingChallenge.id ? { ...original, enabled: m.enabled, override: null } : m))
    } else if (editingChallenge?.isNew) {
      setCustomModules(l => [...l, { id: 'challenge_' + Date.now(), type: 'challenge', ctype: editingChallenge.ctype, ...override, enabled: true, order: moduleList.length + l.length }])
    } else {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, ...override, override: { ...(m.override || {}), ...override } } : m))
    }
    setEditingChallenge(null)
  }

  const saveQuizCustom = (mod) => {
    if (editingQuiz?.isNew || !editingQuiz?.id) setCustomModules(l => [...l, { id: 'quiz_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
    else setCustomModules(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
    setEditingQuiz(null)
  }

  const handleNewChallenge = ({ ctype, title, desc, task, xp }) => {
    setShowNewChallenge(false)
    const template = { isNew: true, type: 'challenge', ctype, title, desc, task, xp }
    if (ctype === 'quiz') setEditingQuiz({ ...template, questions: [] })
    else setEditingChallenge(template)
  }

  const saveBaseModuleOverride = (mod) => {
    const { title, desc, task, xp, content } = mod
    setModuleList(l => l.map(m => m.id === editingBaseModule?.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } } : m))
    setEditingBaseModule(null)
  }

  const clearOverride = (modId) => {
    const original = getScopeModules(activeArea).find(m => m.id === modId)
    if (!original) return
    setModuleList(l => l.map(m => m.id === modId
      ? { ...m, title: original.title, desc: original.desc, task: original.task, xp: original.xp, content: original.content, override: null } : m))
  }

  const linkedCourse = linkedCourses.find(c => c.id === selectedCourseId) || null

  const handlePublish = async () => {
    if (!linkedCourse) return
    setPublishing(true); setPublishResult(null)
    const result = await publishRouteToCourse(linkedCourse.id, activeArea, moduleList, customModules)
    setPublishing(false)
    setPublishResult(result.error ? { error: result.error } : { ok: true, count: result.count })
    if (!result.error) setTimeout(() => setPublishResult(null), 4000)
  }

  const handleSaveDCE = async () => {
    setSaving(true)
    const modulesConfig = moduleList.map((m, i) => ({ id: m.id, enabled: m.enabled, order: i, ...(m.override ? { override: m.override } : {}) }))
    const instId = routeInstitution || null
    const existingRoute = namedRoutes.find(r => r.area === activeArea && r.institution_id === instId)
    await saveRouteConfig(activeArea, modulesConfig, customModules, routeName || scopeName(activeArea), instId, existingRoute?.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeCount = moduleList.filter(m => m.enabled).length

  const btnRow = (onClick, color, bg, hoverBg) => ({
    onClick, onMouseEnter: e => e.currentTarget.style.background = hoverBg,
    onMouseLeave: e => e.currentTarget.style.background = bg,
    style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
      border: `2px dashed ${color}`, background: bg, color, cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' },
  })

  // ── Si hay un fork activo, renderiza el editor de curso ──
  if (activeFork) {
    return <CourseEditor courseId={activeFork.id} courseName={activeFork.name} onBack={() => setActiveFork(null)} />
  }

  // ── Vista principal: selector de colegio + curso, y modo DCE por área ──
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Editor de Ruta de Formación</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Elige un curso para personalizar su contenido, o edita la ruta DCE por área</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowPreview(true)}>👁 Vista previa</Btn>
            <Btn variant={saved ? 'secondary' : 'gradient'} disabled={saving} onClick={handleSaveDCE}>
              {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar ruta DCE'}
            </Btn>
          </div>
        </div>

        {/* ── Selector: colegio + curso ── */}
        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '2px solid var(--orange)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            📚 Personalizar un curso específico
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Colegio */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>🏫 Colegio</label>
              <select value={routeInstitution} onChange={e => { setRouteInstitution(e.target.value); setSelectedCourseId('') }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }}>
                <option value="">— Elige un colegio —</option>
                {myInstitutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
              </select>
            </div>
            {/* Curso */}
            {routeInstitution && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>📖 Curso</label>
                {linkedCourses.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No tienes cursos disponibles en este colegio.</p>
                ) : (
                  <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setForkErr('') }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }}>
                    <option value="">— Elige un curso —</option>
                    {linkedCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* CTA: abrir o crear copia */}
          {selectedCourse && (
            <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12,
              background: existingFork ? '#F0FDFA' : '#FFFBEB',
              border: `1.5px solid ${existingFork ? '#86EFAC' : '#FCD34D'}` }}>
              {existingFork ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>✅ Ya tienes una versión personalizada de "{selectedCourse.name}"</div>
                    <div style={{ fontSize: 12, color: '#115E59', marginTop: 2 }}>"{existingFork.name}" — solo visible para ti y tus estudiantes</div>
                  </div>
                  <Btn variant="gradient" onClick={() => handleOpenFork(true)}>✏️ Seguir editando</Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>📋 Crear mi versión de "{selectedCourse.name}"</div>
                    <div style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>
                      Se generará una copia completa del curso solo para ti y tu colegio. El original queda intacto.
                    </div>
                  </div>
                  <Btn variant="gradient" disabled={forking} onClick={() => handleOpenFork(false)}>
                    {forking ? '⏳ Creando copia…' : '✨ Crear mi versión'}
                  </Btn>
                </div>
              )}
              {forkErr && <p style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, marginTop: 8 }}>⚠️ {forkErr}</p>}
            </div>
          )}
        </div>

        {/* ── Separador modo DCE ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>o edita la ruta DCE por área</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* ── Colegio para ruta DCE ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              🏫 Colegio (la ruta DCE se guarda por colegio)
            </label>
            <select value={routeInstitution} onChange={e => setRouteInstitution(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid var(--orange)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box', fontWeight: 600 }}>
              <option value="">— Ruta global (sin colegio) —</option>
              {myInstitutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nombre de la ruta</label>
            <input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="Ej: Ruta DCE — Colegio San Francisco"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {routeInstitution && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FEF3E8', border: '1px solid var(--orange-pale)', fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>
                ✏️ Editando ruta exclusiva para este colegio
              </div>
            </div>
          )}
        </div>

        {/* Banner publicar al curso (modo DCE) */}
        {routeInstitution && linkedCourse && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#F0FDFA', border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>📚 Publicar ruta DCE al curso: {linkedCourse.name}</div>
              <div style={{ fontSize: 11, color: '#115E59', marginTop: 2 }}>Al publicar, los docentes inscritos verán los cambios al recargar</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button onClick={handlePublish} disabled={publishing}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: publishing ? 'wait' : 'pointer',
                  background: publishing ? '#86EFAC' : '#16A34A', color: '#fff', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700 }}>
                {publishing ? '⏳ Publicando...' : '🚀 Publicar al curso'}
              </button>
              {publishResult?.ok    && <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>✅ {publishResult.count} módulos publicados</span>}
              {publishResult?.error && <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600 }}>⚠️ {publishResult.error}</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs de área (modo DCE) ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {SCOPES.map((scope, idx) => (
          <React.Fragment key={scope.id}>
            <button onClick={() => setActiveArea(scope.id)}
              style={{ padding: '8px 16px', borderRadius: 10,
                border: isTransversal(scope.id) && activeArea !== scope.id ? `1.5px solid ${scope.color}` : 'none',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, transition: 'all .2s',
                background: activeArea === scope.id ? scope.color : 'var(--bg-alt)',
                color: activeArea === scope.id ? '#fff' : isTransversal(scope.id) ? scope.color : 'var(--muted)' }}>
              {scope.icon} {!isMobile && scope.name}
            </button>
            {idx === 0 && <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />}
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
        {isTransversal(activeArea)
          ? '🌐 Estos módulos se muestran a los estudiantes de TODAS las áreas.'
          : `Módulos específicos de ${scopeName(activeArea)}.`}
      </p>

      {/* Lista de módulos DCE */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}</h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => (
              <ModuleRow key={mod.id} mod={mod} idx={i} dragIdx={dragIdx} overIdx={overIdx} isMobile={isMobile}
                onDragStart={() => setDragIdx(i)} onDragOver={() => setOverIdx(i)}
                onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                onEdit={() => mod.type === 'lesson' ? setEditingBaseModule(mod) : setEditingChallenge(mod)}
                onDuplicate={() => duplicateModule(mod)}
                onToggle={() => toggleEnabled(mod.id)}
                onDelete={() => {}} showDelete={false}
              />
            ))}
          </div>
          {customModules.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>Personalizados ({customModules.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customModules.map(mod => (
                  <div key={mod.id} style={{ borderRadius: 14, background: 'var(--white)', border: mod.type === 'final_delivery' ? '2px solid #5EEAD4' : '2px solid var(--purple-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                      <span style={{ fontSize: 15 }}>{mod.type === 'final_delivery' ? '🎯' : '⚡'}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{mod.title}</span>
                      {mod.type !== 'final_delivery' && (
                        <button onClick={() => mod.ctype === 'quiz' ? setEditingQuiz(mod) : setEditingChallenge(mod)}
                          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EditIc s={14} c="var(--muted)" />
                        </button>
                      )}
                      <button onClick={() => deleteCustom(mod.id)}
                        style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrashIc s={13} c="var(--error)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button {...btnRow(() => setShowNewChallenge(true), 'var(--purple)', 'var(--purple-bg)', '#EDE9FE')}>
            <PlusIc s={18} c="var(--purple)" /> Crear nuevo reto
          </button>
          <button {...btnRow(() => setShowAddModule(true), 'var(--success)', '#F0FDFA', '#CCFBF1')}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
          {!customModules.some(m => m.type === 'final_delivery') && (
            <button {...btnRow(addFinalDelivery, 'var(--success)', '#CCFBF1', '#99F6E4')}>
              <PlusIc s={18} c="var(--success)" /> Agregar Entrega Final
            </button>
          )}
        </div>
        <div style={{ padding: 18, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo usar el editor</h4>
          {[
            { icon: '📚', text: 'Elige un curso arriba para crear tu versión personalizada.' },
            { icon: '⋮⋮', text: 'Arrastra para cambiar el orden de los módulos.' },
            { icon: '✏️', text: 'Edita el contenido de cualquier módulo o reto.' },
            { icon: '🟢', text: 'Activa o desactiva módulos con el toggle.' },
            { icon: '💾', text: 'Guarda para que tus estudiantes vean los cambios.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals modo DCE */}
      <NewChallengeModal open={showNewChallenge} onClose={() => setShowNewChallenge(false)} onCreate={handleNewChallenge} />
      <ChallengeEditorModal open={!!editingChallenge} mod={editingChallenge} onClose={() => setEditingChallenge(null)} onSave={saveChallengeOverride} />
      <QuizCreatorModal open={!!editingQuiz} initial={editingQuiz?.isNew ? null : editingQuiz} onClose={() => setEditingQuiz(null)} onSave={saveQuizCustom} />
      <CustomModuleModal open={!!editingBaseModule} initial={editingBaseModule}
        extraActions={editingBaseModule?.override ? (<Btn variant="secondary" onClick={() => { clearOverride(editingBaseModule.id); setEditingBaseModule(null) }}>Restablecer original</Btn>) : null}
        onClose={() => setEditingBaseModule(null)} onSave={saveBaseModuleOverride} />
      <CustomModuleModal open={showAddModule || !!editingModule} initial={editingModule}
        onClose={() => { setShowAddModule(false); setEditingModule(null) }}
        onSave={mod => { if (editingModule) saveEditedModule(mod); else addCustomModule(mod); setShowAddModule(false); setEditingModule(null) }} />
      <RoutePreviewModal open={showPreview} onClose={() => setShowPreview(false)}
        area={SCOPES.find(s => s.id === activeArea)} moduleList={moduleList} customModules={customModules} />
    </div>
  )
}

export default InstructorRouteEditor
