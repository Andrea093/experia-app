import React from 'react'
import { useStore, AREAS, loadCourses, createCourse, updateCourse, deleteCourse, toggleCourseForInstitution, setInstitutionCourseExpiry, loadCourseModules } from '../store/store.jsx'
import { useMobile, PlusIc, TrashIc, EditIc, CheckIc, XIc, Btn, Modal, ChecklistDropdown, ImageUploader, FileUploader } from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'

// Pista descriptiva por tema inmersivo (se muestra al seleccionarlo en el form).
const THEME_HINTS = {
  detective: '🕵️ Los estudiantes inscritos verán la experiencia noir: paleta ámbar/negro, animaciones de lluvia, personaje Vera Clío y sello ARCHIVADO al completar módulos.',
  'escape-room': '🔐 Ambiente de sala de escape: candados, mecanismos y la metáfora de abrir puertas con el pensamiento matemático. Ideal para el curso de Matemáticas.',
  lab: '🔬 Ambiente de laboratorio científico: probetas, burbujas y método científico. Ideal para el curso de Ciencias Naturales.',
  'time-travel': '⏳ Ambiente de viaje en el tiempo: portal temporal, personaje Prof. Kronos y recorrido por épocas. Ideal para el curso de Ciencias Sociales.',
}

// ── Formulario de curso ──────────────────────────────────────
const CourseForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = React.useState({
    name: initial?.name || '',
    description: initial?.description || '',
    color: initial?.color || '#E8732C',
    coverImage: initial?.cover_image || '',
    areaId: initial?.area_id || '',
    theme: initial?.theme || '',
  })
  const [saving, setSaving] = React.useState(false)
  const [error, setError]   = React.useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = { padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'var(--white)' }
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const result = await onSave(form)
      if (result === false) setError('Error al guardar. Verifica que las migraciones de BD estén aplicadas.')
    } catch (e) {
      setError(e.message || 'Error desconocido')
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Nombre del curso *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Liderazgo Educativo" style={inp} />
      </div>
      <div>
        <label style={lbl}>Descripción</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
          placeholder="Describe el objetivo y contenido del curso..."
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Color de identidad</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{form.color}</span>
          </div>
        </div>
        <div style={{ flex: 2 }}>
          <label style={lbl}>URL imagen de portada</label>
          <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)}
            placeholder="https://..." style={inp} />
        </div>
      </div>
      <div>
        <label style={lbl}>Área de formación (opcional)</label>
        <select value={form.areaId} onChange={e => set('areaId', e.target.value)} style={inp}>
          <option value="">— Multi-área / Sin filtro —</option>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
        </select>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          Si el curso es para un área específica, los módulos se filtran automáticamente por área del docente.
        </p>
      </div>
      <div>
        <label style={lbl}>🎨 Tema visual inmersivo</label>
        <select value={form.theme} onChange={e => set('theme', e.target.value)} style={inp}>
          <option value="">— Estándar (sin tema especial) —</option>
          <option value="detective">🕵️ Detectives de Texto — Lenguaje / Lectura Crítica</option>
          <option value="escape-room">🔐 Sala de Escape — Matemáticas</option>
          <option value="lab">🔬 Laboratorio de Ciencias Naturales — Ciencias</option>
          <option value="time-travel">⏳ Viajeros del Tiempo — Ciencias Sociales</option>
        </select>
        {THEME_HINTS[form.theme] && (
          <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(212,160,23,.08)', border: '1px solid rgba(212,160,23,.3)',
            fontSize: 12, color: '#D4A017' }}>
            {THEME_HINTS[form.theme]}
          </div>
        )}
      </div>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: 'var(--error)', marginBottom: 4 }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="gradient" disabled={saving || !form.name.trim()} onClick={handleSave}>
          {saving ? '⏳ Guardando...' : initial ? '💾 Actualizar' : '✅ Crear curso'}
        </Btn>
      </div>
    </div>
  )
}

// ── Alcance de un módulo: transversal (todas las áreas) o área específica ──
const areaById = (id) => AREAS.find(a => a.id === id)
const scopeLabel = (areaId) => {
  if (!areaId) return '🌐 Transversal'
  const a = areaById(areaId)
  return a ? `${a.icon} ${a.name}` : areaId
}
const scopeColor = (areaId) => {
  if (!areaId) return '#4F46E5' // índigo = transversal
  return areaById(areaId)?.color || 'var(--muted)'
}

// ── Panel de módulos de un curso ─────────────────────────────
const CourseModulesPanel = ({ course, onClose }) => {
  const [modules, setModules] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [showAdd, setShowAdd] = React.useState(false)
  const [editMod, setEditMod] = React.useState(null)
  const [saving, setSaving] = React.useState(false)
  const [scopeFilter, setScopeFilter] = React.useState('all') // 'all' | 'transversal' | <areaId>

  const loadModules = React.useCallback(async () => {
    const { data } = await supabase.from('course_modules')
      .select('*').eq('course_id', course.id).order('"order"')
    setModules(data || [])
    setLoading(false)
  }, [course.id])

  React.useEffect(() => { loadModules() }, [loadModules])

  const [opError, setOpError] = React.useState('')

  const toggleEnabled = async (mod) => {
    setOpError('')
    const { error } = await supabase.from('course_modules')
      .update({ is_enabled: !mod.is_enabled }).eq('id', mod.id)
    if (error) { setOpError('Error al actualizar módulo: ' + error.message); return; }
    setModules(ms => ms.map(m => m.id === mod.id ? { ...m, is_enabled: !m.is_enabled } : m))
  }

  const deleteModule = async (id) => {
    setOpError('')
    const { error } = await supabase.from('course_modules').delete().eq('id', id)
    if (error) { setOpError('Error al eliminar módulo: ' + error.message); return; }
    setModules(ms => ms.filter(m => m.id !== id))
  }

  const saveModule = async (form) => {
    setSaving(true)
    setOpError('')
    const payload = { ...form, area_id: form.area_id || null }
    let error
    if (editMod) {
      ({ error } = await supabase.from('course_modules')
        .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editMod.id))
    } else {
      const maxOrder = modules.reduce((max, m) => Math.max(max, m.order || 0), 0)
      ;({ error } = await supabase.from('course_modules')
        .insert({ ...payload, course_id: course.id, order: maxOrder + 1 }))
    }
    if (error) { setOpError('Error al guardar: ' + error.message); setSaving(false); return; }
    await loadModules()
    setSaving(false)
    setShowAdd(false)
    setEditMod(null)
  }

  const typeColor = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#0D9488', final_delivery: '#0EA5E9' }
  const typeLabel = { lesson: 'LECCIÓN', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL' }

  // Áreas que realmente tienen módulos en este curso (para no llenar de chips vacíos)
  const usedAreaIds = AREAS.filter(a => modules.some(m => m.area_id === a.id)).map(a => a.id)
  const hasTransversal = modules.some(m => !m.area_id)
  const visibleModules = modules.filter(m =>
    scopeFilter === 'all' ? true
    : scopeFilter === 'transversal' ? !m.area_id
    : m.area_id === scopeFilter
  )
  const defaultAreaForNew = scopeFilter === 'all' || scopeFilter === 'transversal' ? '' : scopeFilter

  const FilterChip = ({ id, label, color }) => {
    const active = scopeFilter === id
    return (
      <button onClick={() => setScopeFilter(id)}
        style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${active ? color : 'var(--border)'}`,
          background: active ? color + '1A' : 'var(--white)', cursor: 'pointer',
          fontSize: 12, fontWeight: active ? 700 : 500, color: active ? color : 'var(--muted)',
          fontFamily: 'var(--font)', transition: 'all .15s' }}>
        {label}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>{course.name}</h3>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {scopeFilter === 'all'
              ? `${modules.length} módulos`
              : `${visibleModules.length} de ${modules.length} módulos · ${scopeLabel(scopeFilter === 'transversal' ? null : scopeFilter)}`}
          </span>
        </div>
        <Btn variant="gradient" size="sm" onClick={() => setShowAdd(true)}><PlusIc s={14} c="#fff" /> Agregar módulo</Btn>
      </div>

      {/* Filtro por alcance: transversal o por área */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <FilterChip id="all" label={`Todos (${modules.length})`} color="var(--dark)" />
        {hasTransversal && <FilterChip id="transversal" label={`🌐 Transversal (${modules.filter(m => !m.area_id).length})`} color="#4F46E5" />}
        {usedAreaIds.map(aid => {
          const a = areaById(aid)
          return <FilterChip key={aid} id={aid} label={`${a.icon} ${a.name} (${modules.filter(m => m.area_id === aid).length})`} color={a.color} />
        })}
      </div>

      {opError && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 12, color: 'var(--error)', marginBottom: 8 }}>
          ⚠️ {opError}
        </div>
      )}
      {(showAdd || editMod) && (
        <ModuleForm initial={editMod} defaultArea={editMod ? '' : defaultAreaForNew}
          onSave={saveModule} saving={saving} onCancel={() => { setShowAdd(false); setEditMod(null) }} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Cargando...</div>
      ) : modules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--subtle)', border: '2px dashed var(--border)', borderRadius: 12 }}>
          Sin módulos aún. Agrega el primero.
        </div>
      ) : visibleModules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--subtle)', border: '2px dashed var(--border)', borderRadius: 12 }}>
          No hay módulos {scopeFilter === 'transversal' ? 'transversales' : `del área ${areaById(scopeFilter)?.name || ''}`} aún.
          Usa “Agregar módulo” para crear uno con este alcance.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
          {visibleModules.map((mod, i) => (
            <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderRadius: 10, background: mod.is_enabled ? 'var(--bg)' : '#F9FAFB',
              border: `1px solid ${mod.is_enabled ? 'var(--border)' : '#E5E7EB'}`,
              opacity: mod.is_enabled ? 1 : 0.6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtle)', minWidth: 20 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{mod.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    background: (typeColor[mod.type] || 'var(--muted)') + '20', color: typeColor[mod.type] || 'var(--muted)' }}>
                    {typeLabel[mod.type] || mod.type}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                    background: scopeColor(mod.area_id) + '1A', color: scopeColor(mod.area_id) }}>
                    {scopeLabel(mod.area_id)}
                  </span>
                  {mod.attachments?.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>📎 {mod.attachments.length} adjunto{mod.attachments.length !== 1 ? 's' : ''}</span>
                  )}
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>⚡ {mod.xp} XP</span>
                </div>
              </div>
              <button onClick={() => toggleEnabled(mod)}
                style={{ padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: mod.is_enabled ? '#CCFBF1' : '#FEE2E2', color: mod.is_enabled ? 'var(--success)' : 'var(--error)' }}>
                {mod.is_enabled ? 'Activo' : 'Inactivo'}
              </button>
              <button onClick={() => setEditMod(mod)}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EditIc s={13} c="var(--muted)" />
              </button>
              <button onClick={() => deleteModule(mod.id)}
                style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrashIc s={13} c="var(--error)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Editor de bloques de contenido de lección ────────────────
const BLOCK_TYPES = [
  { type: 'intro',    label: 'Introducción',  icon: '📝' },
  { type: 'text',     label: 'Texto',         icon: '📄' },
  { type: 'callout',  label: 'Destacado',     icon: '💡' },
  { type: 'concepts', label: 'Conceptos',     icon: '🗂️' },
  { type: 'video',    label: 'Video',         icon: '🎬' },
  { type: 'embed',    label: 'Embed (Genially, etc.)', icon: '🧩' },
  { type: 'image',    label: 'Imagen',        icon: '🖼️' },
  { type: 'checklist', label: 'Checklist',    icon: '✅' },
  { type: 'download', label: 'Material descargable', icon: '📄' },
  { type: 'compare',  label: 'Comparación',   icon: '⚖️' },
]

const emptyBlock = (type) => {
  switch (type) {
    case 'intro':    return { type, title: '', text: '' }
    case 'text':     return { type, title: '', text: '' }
    case 'callout':  return { type, icon: '💡', title: '', text: '' }
    case 'concepts': return { type, title: '', items: [{ t: '', d: '' }] }
    case 'video':    return { type, title: '', desc: '', url: '' }
    case 'embed':    return { type, title: '', desc: '', url: '' }
    case 'image':    return { type, title: '', url: '', caption: '', height: '' }
    case 'checklist': return { type, title: '', desc: '', items: [{ t: '' }] }
    case 'download': return { type, title: '', desc: '', url: '', filename: '', filesize: '' }
    case 'compare':  return { type, title: '', label: '', trad: '', dce: '' }
    default:         return { type, title: '', text: '' }
  }
}

const BlockEditor = ({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const inp  = { padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'var(--white)' }
  const ta   = { ...inp, resize: 'vertical', lineHeight: 1.5 }
  const lbl  = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }
  const info = BLOCK_TYPES.find(b => b.type === block.type) || { label: block.type, icon: '📄' }

  const set = (k, v) => onChange({ ...block, [k]: v })
  const setItem = (i, k, v) => {
    const items = [...(block.items || [])]
    items[i] = { ...items[i], [k]: v }
    onChange({ ...block, items })
  }
  const addItem  = () => onChange({ ...block, items: [...(block.items || []), { t: '', d: '' }] })
  const delItem  = (i) => onChange({ ...block, items: (block.items || []).filter((_, j) => j !== i) })

  return (
    <div style={{ borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--white)', marginBottom: 8, overflow: 'hidden' }}>
      {/* Header del bloque */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 15 }}>{info.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)', flex: 1 }}>{info.label}</span>
        <button onClick={onMoveUp}   disabled={isFirst}  style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: isFirst ? 'default' : 'pointer', background: 'none', fontSize: 13, opacity: isFirst ? .3 : 1 }}>↑</button>
        <button onClick={onMoveDown} disabled={isLast}   style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: isLast  ? 'default' : 'pointer', background: 'none', fontSize: 13, opacity: isLast  ? .3 : 1 }}>↓</button>
        <button onClick={onDelete} style={{ width: 24, height: 24, borderRadius: 5, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XIc s={11} c="var(--error)" />
        </button>
      </div>

      {/* Campos según tipo */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(block.type === 'intro' || block.type === 'text') && (
          <>
            <div><label style={lbl}>Título</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Título de la sección" /></div>
            <div><label style={lbl}>Texto</label><textarea value={block.text || ''} onChange={e => set('text', e.target.value)} rows={3} style={ta} placeholder="Contenido..." /></div>
          </>
        )}
        {block.type === 'callout' && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 80 }}><label style={lbl}>Ícono</label><input value={block.icon || ''} onChange={e => set('icon', e.target.value)} style={inp} placeholder="💡" /></div>
              <div style={{ flex: 1 }}><label style={lbl}>Título</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Nota destacada" /></div>
            </div>
            <div><label style={lbl}>Texto</label><textarea value={block.text || ''} onChange={e => set('text', e.target.value)} rows={2} style={ta} placeholder="Mensaje importante..." /></div>
          </>
        )}
        {block.type === 'concepts' && (
          <>
            <div><label style={lbl}>Título de la sección</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Ej: Pilares del DCE" /></div>
            <label style={lbl}>Conceptos</label>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <input value={item.t || ''} onChange={e => setItem(i, 't', e.target.value)} style={{ ...inp, width: 140, flexShrink: 0 }} placeholder="Nombre" />
                <input value={item.d || ''} onChange={e => setItem(i, 'd', e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Descripción" />
                <button onClick={() => delItem(i)} style={{ width: 26, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XIc s={10} c="var(--error)" />
                </button>
              </div>
            ))}
            <button onClick={addItem} style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 7, border: '1.5px dashed var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--muted)' }}>+ Agregar concepto</button>
          </>
        )}
        {block.type === 'video' && (
          <>
            <div><label style={lbl}>Título</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Ej: Video introductorio" /></div>
            <div><label style={lbl}>URL del video (YouTube, Vimeo…)</label><input value={block.url || ''} onChange={e => set('url', e.target.value)} style={inp} placeholder="https://www.youtube.com/watch?v=..." /></div>
            <div><label style={lbl}>Descripción (opcional)</label><input value={block.desc || ''} onChange={e => set('desc', e.target.value)} style={inp} placeholder="Instrucción para el estudiante" /></div>
          </>
        )}
        {block.type === 'embed' && (
          <>
            <div><label style={lbl}>Título</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Ej: Recurso interactivo" /></div>
            <div><label style={lbl}>URL del embed (Genially, Canva, H5P…)</label><input value={block.url || ''} onChange={e => set('url', e.target.value)} style={inp} placeholder="https://view.genially.com/..." /></div>
            <div><label style={lbl}>Descripción (opcional)</label><input value={block.desc || ''} onChange={e => set('desc', e.target.value)} style={inp} placeholder="Instrucción para el estudiante" /></div>
          </>
        )}
        {block.type === 'image' && (
          <>
            <div><label style={lbl}>Título (opcional)</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Título de la imagen" /></div>
            <div>
              <label style={lbl}>Imagen</label>
              {block.url && <img src={block.url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }} />}
              <ImageUploader label={block.url ? 'Reemplazar imagen' : 'Subir imagen'} compact onUploaded={url => set('url', url)} />
            </div>
            <div><label style={lbl}>Pie de foto (opcional)</label><input value={block.caption || ''} onChange={e => set('caption', e.target.value)} style={inp} placeholder="Descripción breve de la imagen" /></div>
            <div style={{ width: 140 }}><label style={lbl}>Alto máx (px, opcional)</label><input type="number" value={block.height || ''} onChange={e => set('height', e.target.value)} style={inp} placeholder="420" /></div>
          </>
        )}
        {block.type === 'checklist' && (
          <>
            <div><label style={lbl}>Título de la sección (opcional)</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Ej: Antes de continuar" /></div>
            <div><label style={lbl}>Descripción (opcional)</label><input value={block.desc || ''} onChange={e => set('desc', e.target.value)} style={inp} placeholder="Instrucción o contexto para el estudiante" /></div>
            <label style={lbl}>Pasos</label>
            {(block.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={item.t || ''} onChange={e => setItem(i, 't', e.target.value)} style={{ ...inp, flex: 1 }} placeholder={`Paso ${i + 1}`} />
                <button onClick={() => delItem(i)} style={{ width: 26, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XIc s={10} c="var(--error)" />
                </button>
              </div>
            ))}
            <button onClick={addItem} style={{ alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 7, border: '1.5px dashed var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--muted)' }}>+ Agregar paso</button>
          </>
        )}
        {block.type === 'download' && (
          <>
            <div><label style={lbl}>Título (opcional)</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Título del material" /></div>
            <div><label style={lbl}>Descripción (opcional)</label><input value={block.desc || ''} onChange={e => set('desc', e.target.value)} style={inp} placeholder="Instrucción para el estudiante" /></div>
            <div>
              <label style={lbl}>Archivo</label>
              {block.url && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>📎 {block.filename}</div>}
              <FileUploader label={block.url ? 'Reemplazar archivo' : 'Subir archivo'} compact
                onUploaded={({ url, name, size }) => { set('url', url); set('filename', name); set('filesize', size) }} />
            </div>
          </>
        )}
        {block.type === 'compare' && (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><label style={lbl}>Título</label><input value={block.title || ''} onChange={e => set('title', e.target.value)} style={inp} placeholder="Título de comparación" /></div>
              <div style={{ width: 140 }}><label style={lbl}>Etiqueta del tema</label><input value={block.label || ''} onChange={e => set('label', e.target.value)} style={inp} placeholder="Ej: Clase de Historia" /></div>
            </div>
            <div><label style={lbl}>Enfoque tradicional</label><textarea value={block.trad || ''} onChange={e => set('trad', e.target.value)} rows={2} style={ta} placeholder="Cómo se hace tradicionalmente..." /></div>
            <div><label style={lbl}>Enfoque DCE / nuevo</label><textarea value={block.dce || ''} onChange={e => set('dce', e.target.value)} rows={2} style={ta} placeholder="Cómo se hace con el nuevo enfoque..." /></div>
          </>
        )}
      </div>
    </div>
  )
}

const LessonContentEditor = ({ content, onChange }) => {
  const addBlock = (type) => onChange([...(content || []), emptyBlock(type)])
  const updateBlock = (i, block) => { const c = [...content]; c[i] = block; onChange(c) }
  const deleteBlock = (i) => onChange(content.filter((_, j) => j !== i))
  const moveBlock = (i, dir) => {
    const c = [...content]
    const j = i + dir
    if (j < 0 || j >= c.length) return
    ;[c[i], c[j]] = [c[j], c[i]]
    onChange(c)
  }

  return (
    <div>
      {(content || []).length === 0 ? (
        <div style={{ padding: '12px', borderRadius: 10, border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--subtle)', fontSize: 13, marginBottom: 8 }}>
          Sin bloques aún. Agrega el primero con los botones de abajo.
        </div>
      ) : (
        (content || []).map((block, i) => (
          <BlockEditor key={i} block={block}
            onChange={b => updateBlock(i, b)}
            onDelete={() => deleteBlock(i)}
            onMoveUp={() => moveBlock(i, -1)}
            onMoveDown={() => moveBlock(i, 1)}
            isFirst={i === 0} isLast={i === content.length - 1} />
        ))
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {BLOCK_TYPES.map(bt => (
          <button key={bt.type} onClick={() => addBlock(bt.type)}
            style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px dashed var(--border)', background: 'var(--bg)',
              cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {bt.icon} {bt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Formulario de módulo ─────────────────────────────────────
const ModuleForm = ({ initial, defaultArea = '', onSave, saving, onCancel }) => {
  const [form, setForm] = React.useState({
    title: initial?.title || '',
    subtitle: initial?.subtitle || '',
    description: initial?.description || '',
    type: initial?.type || 'lesson',
    challenge_type: initial?.challenge_type || '',
    xp: initial?.xp || 100,
    area_id: initial?.area_id || defaultArea || '',
    content: initial?.content || [],
    attachments: initial?.attachments || [],
    character_line: initial?.character_line || '',
  })
  const [uploading, setUploading] = React.useState(false)
  const fileRef = React.useRef(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'var(--white)' }
  const lbl = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { alert('Máximo 20 MB por archivo'); return }
    setUploading(true)
    const path = `course-attachments/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert: false })
    if (error) { console.error('upload:', error); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path)
    const attachment = { name: file.name, url: publicUrl, type: file.type, size: file.size }
    set('attachments', [...form.attachments, attachment])
    setUploading(false)
  }

  const removeAttachment = (idx) => set('attachments', form.attachments.filter((_, i) => i !== idx))

  return (
    <div style={{ padding: '16px', borderRadius: 12, border: '2px dashed var(--orange)', background: 'var(--orange-bg)', marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Título del módulo *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Introducción al Liderazgo" style={inp} />
        </div>
        <div>
          <label style={lbl}>Subtítulo</label>
          <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Módulo 1, Reto…" style={inp} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>🕵️ Línea del personaje (Vera Clío — solo en tema Detective)</label>
          <input value={form.character_line} onChange={e => set('character_line', e.target.value)}
            placeholder='Ej: "Detective, este texto guarda una mentira. Tu misión: encuéntrarla."'
            style={inp} />
        </div>
        <div>
          <label style={lbl}>XP</label>
          <input type="number" value={form.xp} onChange={e => set('xp', Number(e.target.value))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Tipo</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} style={inp}>
            <option value="lesson">Lección</option>
            <option value="challenge">Reto</option>
            <option value="evaluation">Evaluación</option>
            <option value="final_delivery">Entrega Final</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Tipo de reto</label>
          <select value={form.challenge_type} onChange={e => set('challenge_type', e.target.value)} style={inp} disabled={form.type !== 'challenge' && form.type !== 'evaluation'}>
            <option value="">— Ninguno —</option>
            <option value="dragdrop">Ordenar elementos</option>
            <option value="empathy">Mapa de empatía</option>
            <option value="simulation">Simulación</option>
            <option value="matching">Conectar conceptos</option>
            <option value="designlab">Lab de diseño</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Alcance del módulo</label>
          <select value={form.area_id} onChange={e => set('area_id', e.target.value)} style={inp}>
            <option value="">🌐 Transversal — todas las áreas</option>
            {AREAS.map(a => <option key={a.id} value={a.id}>{a.icon} Solo {a.name}</option>)}
          </select>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>
            {form.area_id
              ? `Solo lo verán docentes del área ${areaById(form.area_id)?.name || form.area_id}.`
              : 'Transversal: aparece para los docentes de todas las áreas.'}
          </p>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Descripción</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            style={{ ...inp, resize: 'vertical' }} placeholder="Descripción breve del módulo..." />
        </div>
      </div>

      {/* Editor de contenido (solo lecciones) */}
      {form.type === 'lesson' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...lbl, marginBottom: 8, color: 'var(--orange)' }}>📋 Contenido de la lección ({(form.content || []).length} bloque{(form.content || []).length !== 1 ? 's' : ''})</label>
          <LessonContentEditor content={form.content} onChange={v => set('content', v)} />
        </div>
      )}

      {/* Adjuntos */}
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>📎 Archivos adjuntos (PDF, videos, imágenes — máx 20 MB)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {form.attachments.map((att, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 8, background: 'var(--white)', border: '1px solid var(--border)', fontSize: 12 }}>
              <a href={att.url} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', fontWeight: 600, textDecoration: 'none' }}>
                {att.name}
              </a>
              <button onClick={() => removeAttachment(i)}
                style={{ width: 16, height: 16, border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <XIc s={10} c="var(--error)" />
              </button>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mp3" />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px dashed var(--border)', background: 'var(--white)',
            cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--muted)' }}>
          {uploading ? '⏳ Subiendo...' : '+ Subir archivo'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" size="sm" onClick={onCancel}>Cancelar</Btn>
        <Btn variant="gradient" size="sm" disabled={saving || !form.title.trim()} onClick={() => onSave(form)}>
          {saving ? 'Guardando...' : initial ? 'Actualizar' : 'Agregar'}
        </Btn>
      </div>
    </div>
  )
}

// ── Vista previa del mapa de un curso ───────────────────────
const TYPE_COLORS_P = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: 'var(--orange)', final_delivery: '#0D9488' }
const TYPE_LABELS_P = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL' }
const NODE_BG_P = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: 'var(--orange)', final_delivery: '#0D9488' }

const CourseMapPreview = ({ course }) => {
  const [modules, setModules] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    supabase.from('course_modules')
      .select('*').eq('course_id', course.id).eq('is_enabled', true).order('"order"')
      .then(({ data }) => { setModules(data || []); setLoading(false) })
  }, [course.id])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Cargando vista previa…</div>
  if (modules.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--subtle)' }}>Este curso no tiene módulos activos.</div>

  const nodeSpacing = 160
  const mapW = 680
  const mapH = modules.length * nodeSpacing + 80
  const getX = (i) => i % 2 === 0 ? mapW * 0.38 : mapW * 0.62
  const getY = (i) => 40 + i * nodeSpacing

  return (
    <div style={{ overflowY: 'auto', maxHeight: '65vh', paddingBottom: 16 }}>
      <div style={{ padding: '12px 20px 16px', borderRadius: 12, background: 'var(--gradient)', color: '#fff', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .75, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Vista previa del estudiante</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{course.name}</div>
        <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>{modules.length} módulos en la ruta</div>
      </div>
      <div style={{ position: 'relative', width: mapW, maxWidth: '100%', height: mapH, margin: '0 auto' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {modules.slice(0, -1).map((_, i) => {
            const x1 = getX(i), y1 = getY(i)
            const x2 = getX(i + 1), y2 = getY(i + 1)
            const my = (y1 + y2) / 2
            return (
              <path key={i} d={`M${x1},${y1 + 28} C${x1},${my} ${x2},${my} ${x2},${y2 - 28}`}
                fill="none" stroke="var(--border)" strokeWidth={3} strokeLinecap="round" strokeDasharray="8 6" />
            )
          })}
        </svg>
        {modules.map((mod, i) => {
          const x = getX(i), y = getY(i)
          const onLeft = i % 2 !== 0
          const bg = NODE_BG_P[mod.type] || 'var(--orange)'
          return (
            <div key={mod.id} style={{ position: 'absolute', left: x - 28, top: y - 28, display: 'flex', alignItems: 'center', gap: 16, flexDirection: onLeft ? 'row-reverse' : 'row' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: bg, border: `3px solid ${bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                {mod.type === 'lesson' ? '📖' : mod.type === 'challenge' ? '⚡' : mod.type === 'evaluation' ? '🏆' : '🎯'}
              </div>
              <div style={{ background: 'var(--white)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--border)', width: 230, boxShadow: 'var(--sh-sm)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: TYPE_COLORS_P[mod.type] || 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>{TYPE_LABELS_P[mod.type] || 'MÓDULO'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.3, marginBottom: 4 }}>{mod.title}</div>
                {mod.description && <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{mod.description}</div>}
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>⚡ {mod.xp} XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Formulario de vigencia (fecha de vencimiento por colegio) ──
const ExpiryForm = ({ instName, initialExpiresAt, saving, onSave, onCancel }) => {
  const [mode, setMode] = React.useState(initialExpiresAt ? 'date' : 'indef')
  const [date, setDate] = React.useState(initialExpiresAt ? initialExpiresAt.slice(0, 10) : '')
  const canSave = mode === 'indef' || !!date
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14 }}>
        ¿Hasta cuándo estará habilitado este curso para <strong>{instName}</strong>? Al vencer la fecha, el curso se inhabilita automáticamente para el colegio.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Btn variant={mode === 'indef' ? 'gradient' : 'secondary'} size="sm" full onClick={() => setMode('indef')}>♾️ Indefinido</Btn>
        <Btn variant={mode === 'date' ? 'gradient' : 'secondary'} size="sm" full onClick={() => setMode('date')}>📅 Hasta una fecha</Btn>
      </div>
      {mode === 'date' && (
        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }} />
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: mode === 'indef' ? 14 : 0 }}>
        <Btn variant="secondary" full onClick={onCancel}>Cancelar</Btn>
        <Btn variant="gradient" full disabled={!canSave || saving}
          onClick={() => onSave(mode === 'indef' ? null : new Date(date + 'T23:59:59').toISOString())}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Btn>
      </div>
    </div>
  )
}

// ── Página principal del gestor de cursos ────────────────────
const AdminCourses = () => {
  const courses          = useStore(s => s.courses || [])
  // Solo cursos base: los forks de tutor (parent_course_id != null) no se gestionan
  // desde aquí — el tutor los edita en su editor de ruta y se aplican solos por colegio.
  const defaultCourses   = React.useMemo(() => courses.filter(c => !c.parent_course_id), [courses])
  const institutions     = useStore(s => s.institutions || [])
  const institutionCourses = useStore(s => s.institutionCourses || [])
  const isMobile         = useMobile()

  const [showCreate, setShowCreate]   = React.useState(false)
  const [editCourse, setEditCourse]   = React.useState(null)
  const [modsCourse, setModsCourse]   = React.useState(null)
  const [previewCourse, setPreviewCourse] = React.useState(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState(null)
  const [togglingId, setTogglingId]   = React.useState(null)
  const [addingFD, setAddingFD]       = React.useState(null)
  const [enrollMsg, setEnrollMsg]     = React.useState(null)
  // { courseId, instId, instName, currentExpiresAt, mode: 'enable'|'edit' }
  const [expiryPrompt, setExpiryPrompt] = React.useState(null)
  const [savingExpiry, setSavingExpiry] = React.useState(false)

  const handleAddFinalDelivery = async (course) => {
    setAddingFD(course.id)
    const { data: existing } = await supabase.from('course_modules')
      .select('id').eq('course_id', course.id).eq('type', 'final_delivery').maybeSingle()
    if (!existing) {
      const { data: mods } = await supabase.from('course_modules')
        .select('order').eq('course_id', course.id).order('"order"', { ascending: false }).limit(1)
      const nextOrder = (mods?.[0]?.order ?? 0) + 1
      await supabase.from('course_modules').insert({
        course_id: course.id,
        type: 'final_delivery',
        title: 'Entrega Final',
        subtitle: 'Producto de cierre',
        description: 'Sube tu rejilla pedagógica y la pregunta de tu área de formación.',
        xp: 300,
        order: nextOrder,
        is_enabled: true,
        challenge_data: {},
        content: [],
      })
    }
    setAddingFD(null)
  }

  const handleCreate = async (form) => {
    await createCourse({ name: form.name, description: form.description, color: form.color, coverImage: form.coverImage, areaId: form.areaId || null, theme: form.theme || null })
    setShowCreate(false)
  }

  const handleUpdate = async (form) => {
    await updateCourse(editCourse.id, { name: form.name, description: form.description, color: form.color, cover_image: form.coverImage, area_id: form.areaId || null, theme: form.theme || null })
    setEditCourse(null)
  }

  const handleDelete = async () => {
    await deleteCourse(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleToggleGlobal = async (course) => {
    setTogglingId(course.id)
    await updateCourse(course.id, { is_active: !course.is_active })
    setTogglingId(null)
  }

  const handleToggleInstitution = async (courseId, instId, currentActive, expiresAt = null) => {
    const enabling = !currentActive
    setEnrollMsg(enabling ? { loading: true } : null)
    const res = await toggleCourseForInstitution(courseId, instId, enabling, expiresAt)
    if (enabling) {
      const n = res?.count ?? 0
      setEnrollMsg({ text: n > 0
        ? `✅ ${n} estudiante${n !== 1 ? 's' : ''} del colegio inscrito${n !== 1 ? 's' : ''} automáticamente`
        : 'Curso habilitado. El colegio no tiene estudiantes para inscribir.' })
      setTimeout(() => setEnrollMsg(null), 5000)
    }
  }

  const isCourseActiveForInst = (courseId, instId) => {
    const ic = institutionCourses.find(r => r.course_id === courseId && r.institution_id === instId)
    return ic ? ic.is_active : false
  }

  const handleSaveExpiry = async (expiresAt) => {
    if (!expiryPrompt) return
    setSavingExpiry(true)
    if (expiryPrompt.mode === 'enable') {
      await handleToggleInstitution(expiryPrompt.courseId, expiryPrompt.instId, false, expiresAt)
    } else {
      await setInstitutionCourseExpiry(expiryPrompt.courseId, expiryPrompt.instId, expiresAt)
    }
    setSavingExpiry(false)
    setExpiryPrompt(null)
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '16px 12px 48px' : '24px 24px 60px', background: 'var(--bg)' }}>
      {enrollMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
          padding: '12px 20px', borderRadius: 12, background: 'var(--white)', border: '1px solid var(--success-border, #5EEAD4)',
          boxShadow: 'var(--sh-lg)', fontSize: 13, fontWeight: 600, color: 'var(--dark)', maxWidth: 420, textAlign: 'center' }}>
          {enrollMsg.loading ? '⏳ Inscribiendo estudiantes…' : enrollMsg.text}
        </div>
      )}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>📚 Gestor de Cursos</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Crea y administra rutas de formación. Habilítalas por institución.</p>
          </div>
          <Btn variant="gradient" onClick={() => setShowCreate(true)}><PlusIc s={15} c="#fff" /> Nuevo curso</Btn>
        </div>

        {/* Modal crear */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo curso" width={540}>
          <CourseForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>

        {/* Modal editar */}
        <Modal open={!!editCourse} onClose={() => setEditCourse(null)} title="Editar curso" width={540}>
          {editCourse && <CourseForm initial={editCourse} onSave={handleUpdate} onCancel={() => setEditCourse(null)} />}
        </Modal>

        {/* Modal módulos */}
        <Modal open={!!modsCourse} onClose={() => setModsCourse(null)} title="Módulos del curso" width={820}>
          {modsCourse && <CourseModulesPanel course={modsCourse} onClose={() => setModsCourse(null)} />}
        </Modal>

        {/* Modal vista previa */}
        <Modal open={!!previewCourse} onClose={() => setPreviewCourse(null)} title="Vista previa del mapa" width={780}>
          {previewCourse && <CourseMapPreview course={previewCourse} />}
        </Modal>

        {/* Modal vigencia (fecha de vencimiento por colegio) */}
        <Modal open={!!expiryPrompt} onClose={() => setExpiryPrompt(null)} title="Vigencia del curso" width={380}>
          {expiryPrompt && (
            <ExpiryForm
              instName={expiryPrompt.instName}
              initialExpiresAt={expiryPrompt.currentExpiresAt}
              saving={savingExpiry}
              onSave={handleSaveExpiry}
              onCancel={() => setExpiryPrompt(null)}
            />
          )}
        </Modal>

        {/* Modal confirmar eliminar */}
        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="¿Eliminar curso?" width={400}>
          {deleteConfirm && (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', marginBottom: 16 }}>
                Se eliminará <strong>{deleteConfirm.name}</strong> y todos sus módulos. Esta acción no se puede deshacer.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" full onClick={() => setDeleteConfirm(null)}>Cancelar</Btn>
                <Btn variant="danger" full onClick={handleDelete}>Eliminar</Btn>
              </div>
            </div>
          )}
        </Modal>

        {/* Lista de cursos — solo cursos base (sin las copias/forks de los tutores,
            parent_course_id != null). Asignar un fork a un colegio matriculaba a
            todos sus estudiantes en la copia, generando cursos duplicados en su selector. */}
        {defaultCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 16, border: '2px dashed var(--border)', background: 'var(--white)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>Sin cursos aún</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Crea el primer curso para empezar a estructurar rutas de formación.</p>
            <Btn variant="gradient" onClick={() => setShowCreate(true)}>Crear primer curso</Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {defaultCourses.map(course => (
              <div key={course.id} style={{ borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Header del curso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  borderLeft: `5px solid ${course.color || '#E8732C'}` }}>
                  {course.cover_image && (
                    <img src={course.cover_image} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  {!course.cover_image && (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: (course.color || '#E8732C') + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📖</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>{course.name}</div>
                    {course.description && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{course.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* Toggle global */}
                    <button onClick={() => handleToggleGlobal(course)} disabled={togglingId === course.id}
                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: course.is_active ? '#CCFBF1' : '#FEE2E2',
                        color: course.is_active ? 'var(--success)' : 'var(--error)' }}>
                      {course.is_active ? '✅ Activo' : '❌ Inactivo'}
                    </button>
                    {/* Requiere taller presencial: gatea la entrega final tras el taller */}
                    <button onClick={() => updateCourse(course.id, { requires_workshop: !course.requires_workshop })}
                      title="Si se activa, la entrega final se habilita por estudiante tras el taller presencial (el tutor la activa)."
                      style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: course.requires_workshop ? '#EDE9FE' : 'var(--bg-alt)',
                        color: course.requires_workshop ? 'var(--purple)' : 'var(--muted)' }}>
                      {course.requires_workshop ? '🎓 Requiere taller' : '🎓 Sin taller'}
                    </button>
                    <Btn variant="secondary" size="sm" onClick={() => setModsCourse(course)}>📋 Módulos</Btn>
                    <Btn variant="secondary" size="sm" onClick={() => setPreviewCourse(course)}>👁 Vista previa</Btn>
                    <Btn variant="secondary" size="sm" disabled={addingFD === course.id}
                      onClick={() => handleAddFinalDelivery(course)}>
                      {addingFD === course.id ? '...' : '🎯 Entrega Final'}
                    </Btn>
                    <Btn variant="secondary" size="sm" onClick={() => setEditCourse(course)}><EditIc s={13} c="var(--muted)" /></Btn>
                    <Btn variant="secondary" size="sm" onClick={() => setDeleteConfirm(course)}><TrashIc s={13} c="var(--error)" /></Btn>
                  </div>
                </div>

                {/* Asignación por institución */}
                <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Habilitar para instituciones
                  </div>
                  {(() => {
                    const enabledCount = institutions.filter(i => isCourseActiveForInst(course.id, i.id)).length
                    return (
                      <ChecklistDropdown
                        label={enabledCount === 0
                          ? 'Ninguna institución'
                          : `${enabledCount} de ${institutions.length} institucion${institutions.length !== 1 ? 'es' : ''}`}
                        items={institutions.map(i => ({ id: i.id, label: i.name }))}
                        stateOf={it => isCourseActiveForInst(course.id, it.id) ? 'all' : 'none'}
                        onToggle={(it, next) => {
                          if (next) {
                            setExpiryPrompt({ courseId: course.id, instId: it.id, instName: it.label, currentExpiresAt: null, mode: 'enable' })
                          } else {
                            handleToggleInstitution(course.id, it.id, true)
                          }
                        }}
                        emptyText="No hay instituciones registradas."
                        width={280}
                      />
                    )
                  })()}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {institutions.filter(i => isCourseActiveForInst(course.id, i.id)).map(i => {
                      const ic = institutionCourses.find(r => r.course_id === course.id && r.institution_id === i.id)
                      const isExpired = !!ic?.expires_at && new Date(ic.expires_at) < new Date()
                      return (
                        <button key={i.id}
                          onClick={() => setExpiryPrompt({ courseId: course.id, instId: i.id, instName: i.name, currentExpiresAt: ic?.expires_at || null, mode: 'edit' })}
                          title="Click para cambiar la fecha de vigencia"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                            padding: '3px 9px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: isExpired ? '#FEE2E2' : '#CCFBF1', color: isExpired ? 'var(--error)' : 'var(--success)' }}>
                          <CheckIc s={11} c={isExpired ? 'var(--error)' : 'var(--success)'} /> {i.name}
                          {ic?.expires_at
                            ? ` · ${isExpired ? 'venció' : 'vence'} ${new Date(ic.expires_at).toLocaleDateString('es-CO')}`
                            : ' · indefinido'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCourses
