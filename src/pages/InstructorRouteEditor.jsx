import React from 'react'
import { useStore, AREAS, getScopeModules, TRANSVERSAL_AREA, saveRouteConfig, routeKey, publishRouteToCourse } from '../store/store.jsx'
import { useMobile, ChevRIc, XIc, PlusIc, TrashIc, EditIc, GripIc, CheckIc, Btn, Modal } from '../components/ui.jsx'

// Pestañas del editor: la transversal va primero (sus módulos aparecen en TODAS las áreas)
const TRANSVERSAL_SCOPE = { id: TRANSVERSAL_AREA, name: 'Transversal', icon: '🌐', color: '#4F46E5' }
const SCOPES = [TRANSVERSAL_SCOPE, ...AREAS]
const scopeName = (id) => SCOPES.find(s => s.id === id)?.name || id
const isTransversal = (id) => id === TRANSVERSAL_AREA
import {
  TYPE_LABELS, TYPE_COLORS, TYPE_BG, CHALLENGE_TYPES,
  ChallengeEditorModal,
  QuizCreatorModal,
  CustomModuleModal,
  NewChallengeModal,
  RoutePreviewModal,
} from '../components/route-editor/index.js'

const InstructorRouteEditor = () => {
  const routeConfigs  = useStore(s => s.routeConfigs)
  const namedRoutes   = useStore(s => s.namedRoutes)
  const institutions  = useStore(s => s.institutions)
  const institutionCourses = useStore(s => s.institutionCourses || [])
  const courses       = useStore(s => s.courses || [])
  const isMobile = useMobile()
  const [activeArea, setActiveArea] = React.useState(TRANSVERSAL_AREA)
  const [moduleList, setModuleList] = React.useState([])
  const [customModules, setCustomModules] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [publishResult, setPublishResult] = React.useState(null)
  const [routeName, setRouteName] = React.useState('')
  const [routeInstitution, setRouteInstitution] = React.useState('')
  const [dragIdx, setDragIdx] = React.useState(null)
  const [overIdx, setOverIdx] = React.useState(null)
  const [showAddModule, setShowAddModule] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState(null)
  const [editingBaseModule, setEditingBaseModule] = React.useState(null)
  const [editingChallenge, setEditingChallenge] = React.useState(null)
  const [editingQuiz, setEditingQuiz] = React.useState(null)
  const [showNewChallenge, setShowNewChallenge] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)

  React.useEffect(() => {
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
  }, [activeArea, routeInstitution, routeConfigs, namedRoutes])

  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setModuleList(next); setDragIdx(null); setOverIdx(null)
  }

  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))

  const addCustomModule  = (mod) => setCustomModules(l => [...l, { id: 'custom_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
  const saveEditedModule = (mod) => setCustomModules(l => l.map(m => m.id === editingModule.id ? { ...m, ...mod } : m))
  const deleteCustom     = (id) => setCustomModules(l => l.filter(m => m.id !== id))

  const duplicateModule = (mod) => {
    setCustomModules(l => [...l, {
      id: 'custom_' + Date.now(),
      title: 'Copia — ' + mod.title,
      desc: mod.desc || '', task: mod.task || '', xp: mod.xp || 0,
      type: mod.type || 'lesson', ctype: mod.ctype || null,
      content: mod.content ? [...mod.content] : [],
      questions: mod.questions ? [...mod.questions] : [],
      dragItems: mod.dragItems || mod.override?.dragItems,
      empathyCards: mod.empathyCards || mod.override?.empathyCards,
      simTree: mod.simTree || mod.override?.simTree,
      designSteps: mod.designSteps || mod.override?.designSteps,
      matchPairs: mod.matchPairs || mod.override?.matchPairs,
      enabled: true, order: moduleList.length + l.length,
    }])
  }

  const addFinalDelivery = () => {
    const already = customModules.some(m => m.type === 'final_delivery')
    if (already) return
    setCustomModules(l => [...l, {
      id: 'final_delivery_' + Date.now(),
      type: 'final_delivery', ctype: null,
      title: 'Entrega Final', desc: 'Sube tu rejilla pedagógica y la pregunta de tu área de formación.',
      task: 'Completa y sube los dos archivos requeridos para terminar tu ruta.',
      xp: 300, enabled: true, order: moduleList.length + l.length,
    }])
  }

  const saveChallengeOverride = (override) => {
    if (override.__clearOverride) {
      const original = getScopeModules(activeArea).find(m => m.id === editingChallenge?.id)
      if (original) setModuleList(l => l.map(m => m.id === editingChallenge.id ? { ...original, enabled: m.enabled, override: null } : m))
    } else if (editingChallenge?.isNew) {
      setCustomModules(l => [...l, {
        id: 'challenge_' + Date.now(), type: 'challenge',
        ctype: editingChallenge.ctype,
        ...override, enabled: true, order: moduleList.length + l.length,
      }])
    } else {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, ...override, override: { ...(m.override || {}), ...override } } : m
      ))
    }
    setEditingChallenge(null)
  }

  const saveQuizCustom = (mod) => {
    if (editingQuiz?.isNew || !editingQuiz?.id) {
      setCustomModules(l => [...l, { id: 'quiz_' + Date.now(), ...mod, enabled: true, order: moduleList.length + l.length }])
    } else {
      setCustomModules(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
    }
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
    setModuleList(l => l.map(m => m.id === editingBaseModule.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } } : m
    ))
    setEditingBaseModule(null)
  }

  const clearOverride = (modId) => {
    const original = getScopeModules(activeArea).find(m => m.id === modId)
    if (!original) return
    setModuleList(l => l.map(m => m.id === modId
      ? { ...m, title: original.title, desc: original.desc, task: original.task, xp: original.xp, content: original.content, override: null } : m
    ))
  }

  // Curso vinculado: curso activo asignado a la institución seleccionada (tabla institution_courses)
  const linkedCourse = React.useMemo(() => {
    if (!routeInstitution) return null
    const ic = institutionCourses.find(r => r.institution_id === routeInstitution && r.is_active)
    return ic ? courses.find(c => c.id === ic.course_id) || null : null
  }, [routeInstitution, institutionCourses, courses])

  const handlePublish = async () => {
    if (!linkedCourse) return
    setPublishing(true)
    setPublishResult(null)
    const result = await publishRouteToCourse(linkedCourse.id, activeArea, moduleList, customModules)
    setPublishing(false)
    setPublishResult(result.error ? { error: result.error } : { ok: true, count: result.count })
    if (!result.error) setTimeout(() => setPublishResult(null), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    const modulesConfig = moduleList.map((m, i) => ({
      id: m.id, enabled: m.enabled, order: i,
      ...(m.override ? { override: m.override } : {}),
    }))
    const instId = routeInstitution || null
    const existingRoute = namedRoutes.find(r => r.area === activeArea && r.institution_id === instId)
    await saveRouteConfig(
      activeArea, modulesConfig, customModules,
      routeName || scopeName(activeArea),
      instId,
      existingRoute?.id,
    )
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeCount = moduleList.filter(m => m.enabled).length

  const btnRow = (onClick, color, bg, hoverBg, icon, label) => ({
    onClick, onMouseEnter: e => e.currentTarget.style.background = hoverBg,
    onMouseLeave: e => e.currentTarget.style.background = bg,
    style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
      border: `2px dashed ${color}`, background: bg, color, cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' }
  })

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Editor de Ruta de Formación</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Personaliza el orden, contenido y módulos de cada área</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowPreview(true)}>👁 Vista previa</Btn>
            <Btn variant={saved ? 'secondary' : 'gradient'} disabled={saving} onClick={handleSave}>
              {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar cambios'}
            </Btn>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              🏫 Colegio (la ruta se guarda por colegio)
            </label>
            <select value={routeInstitution} onChange={e => setRouteInstitution(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid var(--orange)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box', fontWeight: 600 }}>
              <option value="">— Ruta global (sin colegio) —</option>
              {institutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>Nombre de la ruta</label>
            <input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="Ej: Ruta DCE — Colegio San Francisco"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {routeInstitution && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ padding: '6px 12px', borderRadius: 8, background: '#FEF3E8', border: '1px solid var(--orange)', fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>
                ✏️ Editando ruta exclusiva para este colegio
              </div>
            </div>
          )}
        </div>

        {/* Banner curso vinculado */}
        {routeInstitution && (
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10,
            background: linkedCourse ? '#F0FDF4' : '#FFFBEB',
            border: `1.5px solid ${linkedCourse ? '#86EFAC' : '#FCD34D'}`,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {linkedCourse ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>
                    📚 Curso vinculado: {linkedCourse.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                    Al publicar, los docentes inscritos verán los cambios al recargar
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={handlePublish} disabled={publishing}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: publishing ? 'wait' : 'pointer',
                      background: publishing ? '#86EFAC' : '#16A34A', color: '#fff',
                      fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, transition: 'all .2s' }}>
                    {publishing ? '⏳ Publicando...' : '🚀 Publicar al curso'}
                  </button>
                  {publishResult?.ok && (
                    <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                      ✅ {publishResult.count} módulos publicados
                    </span>
                  )}
                  {publishResult?.error && (
                    <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600 }}>
                      ⚠️ {publishResult.error}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#92400E' }}>
                ⚠️ Este colegio no tiene un curso activo asignado. El admin debe activar un curso para este colegio desde Cursos.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scope tabs: Transversal (todas las áreas) + cada área */}
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
          ? '🌐 Estos módulos se muestran a los estudiantes de TODAS las áreas. Edítalos una sola vez aquí.'
          : `Módulos específicos de ${scopeName(activeArea)}. Los módulos comunes (intro, empatía…) se editan en la pestaña 🌐 Transversal.`}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
              Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>

          {/* Base modules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => {
              const isOver = overIdx === i
              return (
                <div key={mod.id} draggable
                  onDragStart={() => setDragIdx(i)} onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                  onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{ borderRadius: 14, background: mod.enabled ? 'var(--white)' : 'var(--bg)',
                    border: isOver ? '2px dashed var(--orange)' : mod.enabled ? '1px solid var(--border)' : '1px dashed var(--border)',
                    opacity: dragIdx === i ? .4 : mod.enabled ? 1 : .55, transition: 'all .15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                    <GripIc s={16} c="var(--subtle)" />
                    <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: TYPE_BG[mod.type] || 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type] || 'var(--muted)' }}>{i + 1}</div>
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
                    <button onClick={() => mod.type === 'lesson' ? setEditingBaseModule(mod) : setEditingChallenge(mod)}
                      title="Editar contenido" style={{ background: mod.override ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                        width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EditIc s={13} c={mod.override ? 'var(--orange)' : 'var(--muted)'} />
                    </button>
                    <button onClick={() => duplicateModule(mod)} title="Duplicar"
                      style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                        width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>⧉</button>
                    <div onClick={() => toggleEnabled(mod.id)}
                      style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
                        background: mod.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        left: mod.enabled ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom modules */}
          {customModules.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
                Personalizados ({customModules.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customModules.map(mod => (
                  <div key={mod.id} style={{ borderRadius: 14, background: 'var(--white)',
                    border: mod.type === 'final_delivery' ? '2px solid #6EE7B7' : mod.type === 'challenge' ? '2px solid var(--purple-bg)' : '2px solid #D1FAE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{mod.type === 'final_delivery' ? '🎯' : mod.type === 'challenge' ? '⚡' : '✨'}</span>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                          background: mod.type === 'final_delivery' ? '#D1FAE5' : mod.type === 'challenge' ? 'var(--purple-bg)' : '#D1FAE5',
                          color: mod.type === 'final_delivery' ? '#059669' : mod.type === 'challenge' ? 'var(--purple)' : 'var(--success)',
                          textTransform: 'uppercase', letterSpacing: .8 }}>
                          {mod.type === 'final_delivery' ? 'ENTREGA FINAL' : mod.type === 'challenge' ? (CHALLENGE_TYPES.find(t => t.id === mod.ctype)?.label || 'Reto') : 'Módulo'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
                      </div>
                      {mod.type !== 'final_delivery' && (
                        <button
                          onClick={() => mod.ctype === 'quiz' ? setEditingQuiz(mod) : mod.type === 'challenge' ? setEditingChallenge(mod) : setEditingModule(mod)}
                          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EditIc s={14} c="var(--muted)" />
                        </button>
                      )}
                      {mod.type !== 'final_delivery' && (
                        <button onClick={() => duplicateModule(mod)} title="Duplicar"
                          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>⧉</button>
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

          {/* Action buttons */}
          <button {...btnRow(() => setShowNewChallenge(true), 'var(--purple)', 'var(--purple-bg)', '#EDE9FE')}>
            <PlusIc s={18} c="var(--purple)" /> Crear nuevo reto
          </button>
          <button {...btnRow(() => setShowAddModule(true), 'var(--success)', '#F0FDF4', '#D1FAE5')}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
          {!customModules.some(m => m.type === 'final_delivery') && (
            <button {...btnRow(addFinalDelivery, '#10B981', '#D1FAE5', '#A7F3D0')}>
              <PlusIc s={18} c="#10B981" /> Agregar Entrega Final
            </button>
          )}
        </div>

        {/* Right: tips */}
        <div style={{ padding: '18px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo usar el editor</h4>
          {[
            { icon: '⋮⋮', text: 'Arrastra para cambiar el orden de los módulos.' },
            { icon: '✏️', text: 'Edita el contenido de cualquier módulo o reto.' },
            { icon: '⧉',  text: 'Duplica un módulo o reto para reutilizarlo.' },
            { icon: '🟢', text: 'Activa o desactiva módulos con el toggle.' },
            { icon: '⚡', text: 'Crea retos nuevos de cualquier tipo desde cero.' },
            { icon: '✨', text: 'Crea módulos personalizados con tu contenido.' },
            { icon: '💾', text: 'Guarda para que los estudiantes vean los cambios.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '10px', borderRadius: 10,
            background: isTransversal(activeArea) ? '#EEF2FF' : 'var(--orange-bg)',
            border: `1px solid ${isTransversal(activeArea) ? '#C7D2FE' : 'var(--orange-pale)'}` }}>
            <p style={{ fontSize: 11, color: isTransversal(activeArea) ? '#4F46E5' : 'var(--orange)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              {isTransversal(activeArea)
                ? '🌐 Estos módulos transversales se muestran en TODAS las áreas. Editarlos aquí los cambia para todos los estudiantes.'
                : `Los cambios afectan a todos los estudiantes de ${scopeName(activeArea)}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewChallengeModal open={showNewChallenge} onClose={() => setShowNewChallenge(false)} onCreate={handleNewChallenge} />
      <ChallengeEditorModal open={!!editingChallenge} mod={editingChallenge} onClose={() => setEditingChallenge(null)} onSave={saveChallengeOverride} />
      <QuizCreatorModal open={!!editingQuiz} initial={editingQuiz?.isNew ? null : editingQuiz} onClose={() => setEditingQuiz(null)} onSave={saveQuizCustom} />
      <CustomModuleModal open={!!editingBaseModule} initial={editingBaseModule}
        extraActions={editingBaseModule?.override ? (
          <Btn variant="secondary" onClick={() => { clearOverride(editingBaseModule.id); setEditingBaseModule(null) }}>Restablecer original</Btn>
        ) : null}
        onClose={() => setEditingBaseModule(null)} onSave={saveBaseModuleOverride} />
      <CustomModuleModal open={showAddModule || !!editingModule} initial={editingModule}
        onClose={() => { setShowAddModule(false); setEditingModule(null) }}
        onSave={mod => { if (editingModule) saveEditedModule(mod); else addCustomModule(mod); setShowAddModule(false); setEditingModule(null) }} />
      <RoutePreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        area={SCOPES.find(s => s.id === activeArea)}
        moduleList={moduleList}
        customModules={customModules}
      />
    </div>
  )
}

export default InstructorRouteEditor
