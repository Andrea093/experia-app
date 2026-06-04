import React from 'react'
import { useStore, AREAS, getStudentModules, saveRouteConfig } from '../store/store.jsx'
import {
  useMobile,
  ChevRIc, XIc, PlusIc, TrashIc, EditIc, GripIc, CheckIc,
  Btn, Modal,
} from '../components/ui.jsx'

const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN' }
const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#10B981' }
const TYPE_BG    = { lesson: 'var(--orange-bg)', challenge: 'var(--purple-bg)', evaluation: '#D1FAE5' }

const PAIR_COLORS = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B','#EC4899']

// ---- Matching Editor Modal ----
const MatchingEditorModal = ({ open, mod, onClose, onSave }) => {
  const [pairs, setPairs] = React.useState([])

  React.useEffect(() => {
    if (open && mod) {
      setPairs(mod.matchPairs?.length
        ? mod.matchPairs.map(p => ({ ...p }))
        : Array.from({ length: 4 }, (_, i) => ({ id: i + 1, concept: '', def: '', color: PAIR_COLORS[i] }))
      )
    }
  }, [open, mod])

  const update = (id, key, val) => setPairs(p => p.map(x => x.id === id ? { ...x, [key]: val } : x))
  const addPair = () => setPairs(p => [...p, { id: Date.now(), concept: '', def: '', color: PAIR_COLORS[p.length % PAIR_COLORS.length] }])
  const remove  = (id) => setPairs(p => p.filter(x => x.id !== id))
  const cycleColor = (id) => {
    setPairs(p => p.map(x => {
      if (x.id !== id) return x
      const idx = PAIR_COLORS.indexOf(x.color)
      return { ...x, color: PAIR_COLORS[(idx + 1) % PAIR_COLORS.length] }
    }))
  }

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title={`Editar pares: ${mod?.title || ''}`} width={600}>
      <div style={{ maxHeight: '60vh', overflow: 'auto', paddingRight: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 8, padding: '0 2px' }}>
          {['', 'Concepto', 'Definición', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{h}</span>
          ))}
        </div>
        {pairs.map((pair, i) => (
          <div key={pair.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 1fr 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div onClick={() => cycleColor(pair.id)} title="Clic para cambiar color"
              style={{ width: 14, height: 14, borderRadius: '50%', background: pair.color, cursor: 'pointer', flexShrink: 0 }} />
            <input value={pair.concept} onChange={e => update(pair.id, 'concept', e.target.value)}
              placeholder={`Concepto ${i + 1}`} style={inp} />
            <input value={pair.def} onChange={e => update(pair.id, 'def', e.target.value)}
              placeholder={`Definición ${i + 1}`} style={inp} />
            <button onClick={() => remove(pair.id)} disabled={pairs.length <= 2}
              style={{ width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: pairs.length <= 2 ? .3 : 1 }}>
              <XIc s={13} c="var(--error)" />
            </button>
          </div>
        ))}
        <button onClick={addPair}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, marginTop: 8,
            border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
          <PlusIc s={13} c="var(--orange)" /> Agregar par
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" full onClick={() => onSave({ matchPairs: pairs })}>Guardar cambios</Btn>
      </div>
    </Modal>
  )
}

// ---- Quiz Creator Modal ----
const QuizCreatorModal = ({ open, initial, onClose, onSave }) => {
  const [title, setTitle]   = React.useState('')
  const [desc, setDesc]     = React.useState('')
  const [task, setTask]     = React.useState('')
  const [xp, setXp]         = React.useState(100)
  const [questions, setQs]  = React.useState([])
  const [err, setErr]       = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 100)
      setQs(initial?.questions || [{ id: 1, question: '', options: ['', '', '', ''], correct: 0 }])
      setErr('')
    }
  }, [open, initial])

  const addQ = () => setQs(q => [...q, { id: Date.now(), question: '', options: ['', '', '', ''], correct: 0 }])
  const removeQ = (id) => setQs(q => q.filter(x => x.id !== id))
  const updateQ = (id, key, val) => setQs(q => q.map(x => x.id === id ? { ...x, [key]: val } : x))
  const updateOpt = (qId, optIdx, val) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const opts = [...x.options]; opts[optIdx] = val
    return { ...x, options: opts }
  }))

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if (!questions.length) { setErr('Agrega al menos una pregunta'); return }
    const incomplete = questions.find(q => !q.question.trim() || q.options.some(o => !o.trim()))
    if (incomplete) { setErr('Completa todas las preguntas y opciones'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100, questions, type: 'challenge', ctype: 'quiz' })
  }

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar reto Quiz' : 'Crear reto Quiz'} width={600}>
      <div style={{ maxHeight: '72vh', overflow: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="Ej: Evaluación de conceptos clave" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} style={inp} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Resumen para el mapa de aprendizaje" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción al estudiante</label>
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Responde todas las preguntas y confirma cada respuesta" style={inp} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 12 }}>
            Preguntas ({questions.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, qi) => (
              <div key={q.id} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Pregunta {qi + 1}</span>
                  <button onClick={() => removeQ(q.id)} disabled={questions.length <= 1}
                    style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: questions.length <= 1 ? .3 : 1 }}>
                    <XIc s={13} c="var(--error)" />
                  </button>
                </div>
                <input value={q.question} onChange={e => updateQ(q.id, 'question', e.target.value)}
                  placeholder="Escribe la pregunta aquí..." style={{ ...inp, marginBottom: 10 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQ(q.id, 'correct', oi)}
                        title="Marcar como correcta"
                        style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                          background: q.correct === oi ? 'var(--success)' : 'var(--bg-alt)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {q.correct === oi
                          ? <CheckIc s={13} c="#fff" />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{String.fromCharCode(65 + oi)}</span>}
                      </button>
                      <input value={opt} onChange={e => updateOpt(q.id, oi, e.target.value)}
                        placeholder={`Opción ${String.fromCharCode(65 + oi)}${q.correct === oi ? ' (correcta)' : ''}`}
                        style={{ ...inp, border: q.correct === oi ? '1.5px solid var(--success)' : '1.5px solid var(--border)' }} />
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>Haz clic en el círculo para marcar la opción correcta</p>
              </div>
            ))}
          </div>
          <button onClick={addQ}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, marginTop: 12,
              border: '1.5px dashed var(--purple)', background: 'var(--purple-bg)', color: 'var(--purple)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600 }}>
            <PlusIc s={14} c="var(--purple)" /> Agregar pregunta
          </button>
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleSave}>{initial ? 'Guardar cambios' : 'Crear reto'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---- Add Extra Modal ----
const AddExtraModal = ({ open, onClose, onAdd }) => {
  const [type, setType]   = React.useState('video')
  const [title, setTitle] = React.useState('')
  const [url, setUrl]     = React.useState('')
  const [text, setText]   = React.useState('')
  const [err, setErr]     = React.useState('')

  const reset = () => { setType('video'); setTitle(''); setUrl(''); setText(''); setErr('') }
  const handleClose = () => { reset(); onClose() }

  const handleAdd = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if (type === 'video' && !url.trim()) { setErr('La URL del video es obligatoria'); return }
    if (type === 'text' && !text.trim()) { setErr('El contenido es obligatorio'); return }
    onAdd({ type, title: title.trim(), url: url.trim(), text: text.trim() })
    reset()
  }

  const inp = (hasErr) => ({
    width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)',
  })

  return (
    <Modal open={open} onClose={handleClose} title="Agregar recurso extra" width={440}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 8 }}>Tipo de recurso</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'video', label: '🎬 Video YouTube' }, { id: 'text', label: '📝 Texto / Nota' }].map(opt => (
              <button key={opt.id} onClick={() => { setType(opt.id); setErr('') }}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all .15s',
                  background: type === opt.id ? 'var(--orange)' : 'var(--bg-alt)',
                  color: type === opt.id ? '#fff' : 'var(--muted)' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Título del recurso</label>
          <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }}
            placeholder="Ej: Video complementario sobre DCE" style={inp(err && !title)} autoFocus />
        </div>

        {type === 'video' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>URL de YouTube</label>
            <input value={url} onChange={e => { setUrl(e.target.value); setErr('') }}
              placeholder="https://www.youtube.com/watch?v=..." style={inp(err && !url)} />
          </div>
        )}

        {type === 'text' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Contenido</label>
            <textarea value={text} onChange={e => { setText(e.target.value); setErr('') }}
              placeholder="Escribe aquí el texto adicional para los estudiantes..."
              rows={4}
              style={{ ...inp(err && !text), resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        )}

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Btn variant="secondary" full onClick={handleClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleAdd}>Agregar recurso</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---- Custom Module Modal ----
const SECTION_TYPES = [
  { id: 'intro',   label: '📖 Introducción',  icon: '📖' },
  { id: 'text',    label: '📄 Texto',          icon: '📄' },
  { id: 'callout', label: '💡 Destacado',      icon: '💡' },
  { id: 'video',   label: '🎬 Video YouTube',  icon: '🎬' },
]

const CustomModuleModal = ({ open, initial, onClose, onSave, extraActions }) => {
  const [title, setTitle]     = React.useState('')
  const [desc, setDesc]       = React.useState('')
  const [task, setTask]       = React.useState('')
  const [xp, setXp]           = React.useState(50)
  const [sections, setSections] = React.useState([])
  const [err, setErr]         = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 50)
      setSections(initial?.content || [])
      setErr('')
    }
  }, [open, initial])

  const addSection = (type) => {
    const defaults = {
      intro:   { type: 'intro',   title: '', text: '' },
      text:    { type: 'text',    title: '', text: '' },
      callout: { type: 'callout', title: '', text: '', icon: '💡' },
      video:   { type: 'video',   title: '', url: '', desc: '' },
    }
    setSections(s => [...s, { ...defaults[type], _id: Date.now() }])
  }

  const updateSection = (idx, key, val) => setSections(s => s.map((sec, i) => i === idx ? { ...sec, [key]: val } : sec))
  const removeSection = (idx) => setSections(s => s.filter((_, i) => i !== idx))
  const moveSection   = (idx, dir) => {
    const next = [...sections]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSections(next)
  }

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 50, content: sections })
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar módulo' : 'Crear módulo personalizado'} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflow: 'auto', paddingRight: 4 }}>

        {/* Basic info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }}
              placeholder="Ej: Innovación en el Aula" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} max={500} style={inp} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Resumen del módulo para el mapa de aprendizaje" style={inp} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción para el estudiante (¿Qué debe hacer?)</label>
          <input value={task} onChange={e => setTask(e.target.value)}
            placeholder="Ej: Lee todo el contenido y completa la lección" style={inp} />
        </div>

        {/* Sections */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 10 }}>Contenido del módulo</label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((sec, idx) => (
              <div key={sec._id || idx} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    {SECTION_TYPES.find(t => t.id === sec.type)?.label || sec.type}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === 0 ? .3 : 1 }}>↑</button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === sections.length - 1 ? .3 : 1 }}>↓</button>
                    <button onClick={() => removeSection(idx)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2' }}>
                      <XIc s={12} c="var(--error)" />
                    </button>
                  </div>
                </div>

                {sec.type !== 'video' && (
                  <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                    placeholder="Título de esta sección" style={{ ...inp, marginBottom: 8 }} />
                )}

                {(sec.type === 'intro' || sec.type === 'text') && (
                  <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                    placeholder="Escribe el contenido..." rows={3}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                )}

                {sec.type === 'callout' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
                    <input value={sec.icon} onChange={e => updateSection(idx, 'icon', e.target.value)}
                      placeholder="💡" style={inp} />
                    <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                      placeholder="Texto destacado..." rows={2}
                      style={{ ...inp, resize: 'vertical' }} />
                  </div>
                )}

                {sec.type === 'video' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del video" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.url} onChange={e => updateSection(idx, 'url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..." style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción opcional del video" style={inp} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add section buttons */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {SECTION_TYPES.map(t => (
              <button key={t.id} onClick={() => addSection(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                  border: '1.5px dashed var(--border)', background: 'var(--white)', color: 'var(--text-sec)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}>
                <PlusIc s={12} c="currentColor" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
          {extraActions}
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Crear módulo'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

// ---- Main Editor ----
const InstructorRouteEditor = () => {
  const routeConfigs = useStore(s => s.routeConfigs)
  const isMobile = useMobile()
  const [activeArea, setActiveArea] = React.useState(AREAS[0].id)
  const [moduleList, setModuleList] = React.useState([])
  const [customModules, setCustomModules] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [dragIdx, setDragIdx] = React.useState(null)
  const [overIdx, setOverIdx] = React.useState(null)
  const [expandedExtras, setExpandedExtras] = React.useState({})
  const [showAddExtra, setShowAddExtra] = React.useState(null)
  const [showAddModule, setShowAddModule] = React.useState(false)
  const [editingModule, setEditingModule] = React.useState(null)
  const [editingBaseModule, setEditingBaseModule] = React.useState(null)
  const [editingMatching, setEditingMatching] = React.useState(null)
  const [editingQuiz, setEditingQuiz] = React.useState(null)
  const [showQuizCreator, setShowQuizCreator] = React.useState(false)

  // Load config for selected area
  React.useEffect(() => {
    const defaults = getStudentModules(activeArea)
    const config = routeConfigs?.[activeArea]

    if (config?.modules?.length) {
      const cm = {}
      config.modules.forEach(mc => { cm[mc.id] = mc })
      const sorted = [...defaults]
        .sort((a, b) => (cm[a.id]?.order ?? 999) - (cm[b.id]?.order ?? 999))
        .map(m => ({
          ...m,
          enabled: cm[m.id]?.enabled !== false,
          extras: cm[m.id]?.extras || [],
          ...(cm[m.id]?.override || {}),
          override: cm[m.id]?.override || null,
        }))
      setModuleList(sorted)
    } else {
      setModuleList(defaults.map(m => ({ ...m, enabled: true, extras: [] })))
    }
    setCustomModules(config?.customModules || [])
    setExpandedExtras({})
  }, [activeArea, routeConfigs])

  // Drag & drop
  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    setModuleList(next)
    setDragIdx(null); setOverIdx(null)
  }

  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))

  const addExtra = (moduleId, extra) => {
    const e = { id: 'ext_' + Date.now(), ...extra }
    setModuleList(l => l.map(m => m.id === moduleId ? { ...m, extras: [...(m.extras || []), e] } : m))
    setCustomModules(l => l.map(m => m.id === moduleId ? { ...m, extras: [...(m.extras || []), e] } : m))
  }
  const removeExtra = (moduleId, extraId) => {
    setModuleList(l => l.map(m => m.id === moduleId ? { ...m, extras: (m.extras || []).filter(e => e.id !== extraId) } : m))
    setCustomModules(l => l.map(m => m.id === moduleId ? { ...m, extras: (m.extras || []).filter(e => e.id !== extraId) } : m))
  }

  const addCustomModule  = (mod) => setCustomModules(l => [...l, { id: 'custom_' + Date.now(), ...mod, enabled: true, extras: [], order: moduleList.length + l.length }])
  const saveEditedModule = (mod) => setCustomModules(l => l.map(m => m.id === editingModule.id ? { ...m, ...mod } : m))
  const deleteCustom     = (id) => setCustomModules(l => l.filter(m => m.id !== id))

  const saveMatchingOverride = (override) => {
    setModuleList(l => l.map(m => m.id === editingMatching.id
      ? { ...m, ...override, override: { ...(m.override || {}), ...override } }
      : m
    ))
    setEditingMatching(null)
  }

  const saveQuizCustom = (mod) => {
    if (editingQuiz) {
      setCustomModules(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
      setEditingQuiz(null)
    } else {
      setCustomModules(l => [...l, { id: 'quiz_' + Date.now(), ...mod, enabled: true, extras: [], order: moduleList.length + l.length }])
      setShowQuizCreator(false)
    }
  }

  const saveBaseModuleOverride = (mod) => {
    const { title, desc, task, xp, content } = mod
    setModuleList(l => l.map(m => m.id === editingBaseModule.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } }
      : m
    ))
    setEditingBaseModule(null)
  }

  const clearOverride = (modId) => {
    const original = getStudentModules(activeArea).find(m => m.id === modId)
    if (!original) return
    setModuleList(l => l.map(m => m.id === modId
      ? { ...m, title: original.title, desc: original.desc, task: original.task, xp: original.xp, content: original.content, override: null }
      : m
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    const modulesConfig = moduleList.map((m, i) => ({
      id: m.id, enabled: m.enabled, order: i, extras: m.extras || [],
      ...(m.override ? { override: m.override } : {}),
    }))
    await saveRouteConfig(activeArea, modulesConfig, customModules)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeCount = moduleList.filter(m => m.enabled).length

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Editor de Ruta de Formación</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Personaliza el orden, contenido y módulos de cada área</p>
        </div>
        <Btn variant={saved ? 'secondary' : 'gradient'} disabled={saving} onClick={handleSave}>
          {saving ? '⏳ Guardando...' : saved ? '✅ Guardado' : '💾 Guardar cambios'}
        </Btn>
      </div>

      {/* Area tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {AREAS.map(area => (
          <button key={area.id} onClick={() => setActiveArea(area.id)}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, transition: 'all .2s',
              background: activeArea === area.id ? area.color : 'var(--bg-alt)',
              color: activeArea === area.id ? '#fff' : 'var(--muted)' }}>
            {area.icon} {!isMobile && area.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Module list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
              Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => {
              const isExpanded = expandedExtras[mod.id]
              const isOver = overIdx === i
              return (
                <div key={mod.id}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{ borderRadius: 14, background: mod.enabled ? 'var(--white)' : 'var(--bg)',
                    border: isOver ? '2px dashed var(--orange)' : mod.enabled ? '1px solid var(--border)' : '1px dashed var(--border)',
                    opacity: dragIdx === i ? .4 : mod.enabled ? 1 : .55, transition: 'all .15s' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                    <GripIc s={16} c="var(--subtle)" />
                    <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: TYPE_BG[mod.type] || 'var(--bg-alt)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type] || 'var(--muted)' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                        background: TYPE_BG[mod.type] || 'var(--bg-alt)', color: TYPE_COLORS[mod.type] || 'var(--muted)',
                        textTransform: 'uppercase', letterSpacing: .8, marginRight: 6 }}>
                        {TYPE_LABELS[mod.type] || 'MÓDULO'}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: mod.enabled ? 'var(--dark)' : 'var(--subtle)' }}>
                        {mod.title}
                      </span>
                      {mod.override && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
                          background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>
                          EDITADO
                        </span>
                      )}
                    </div>
                    {(mod.extras?.length > 0) && (
                      <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, flexShrink: 0 }}>
                        +{mod.extras.length}
                      </span>
                    )}
                    {/* Edit button — lesson vs challenge */}
                    {mod.type === 'lesson' && (
                      <button onClick={() => setEditingBaseModule(mod)}
                        title="Editar contenido del módulo"
                        style={{ background: mod.override ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                          width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <EditIc s={13} c={mod.override ? 'var(--orange)' : 'var(--muted)'} />
                      </button>
                    )}
                    {mod.type === 'challenge' && mod.ctype === 'matching' && (
                      <button onClick={() => setEditingMatching(mod)}
                        title="Editar pares de conceptos"
                        style={{ background: mod.override?.matchPairs ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
                          width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <EditIc s={13} c={mod.override?.matchPairs ? 'var(--orange)' : 'var(--muted)'} />
                      </button>
                    )}
                    <button onClick={() => setExpandedExtras(e => ({ ...e, [mod.id]: !e[mod.id] }))}
                      style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26,
                        borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'transform .2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                      <ChevRIc s={14} c="var(--muted)" />
                    </button>
                    {/* Toggle */}
                    <div onClick={() => toggleEnabled(mod.id)}
                      style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
                        background: mod.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', left: mod.enabled ? 20 : 2, transition: 'left .2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </div>
                  </div>

                  {/* Extras panel */}
                  {isExpanded && (
                    <div style={{ padding: '0 14px 14px 44px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, margin: '10px 0 8px' }}>Recursos adicionales</p>
                      {!(mod.extras?.length) && <p style={{ fontSize: 12, color: 'var(--subtle)', fontStyle: 'italic', marginBottom: 8 }}>Ninguno aún</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {(mod.extras || []).map(extra => (
                          <div key={extra.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                            borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 14 }}>{extra.type === 'video' ? '🎬' : '📝'}</span>
                            <span style={{ fontSize: 12, color: 'var(--dark)', fontWeight: 500, flex: 1,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra.title}</span>
                            <button onClick={() => removeExtra(mod.id, extra.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                              <XIc s={13} c="var(--error)" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowAddExtra(mod.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                          border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
                          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
                        <PlusIc s={13} c="var(--orange)" /> Agregar recurso
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Custom modules */}
          {customModules.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>
                Módulos personalizados ({customModules.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customModules.map(mod => {
                  const isExpanded = expandedExtras[mod.id]
                  return (
                    <div key={mod.id} style={{ borderRadius: 14, background: 'var(--white)', border: '2px solid #D1FAE5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>✨</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#D1FAE5',
                            color: 'var(--success)', textTransform: 'uppercase', letterSpacing: .8, marginRight: 6 }}>PERSONALIZADO</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{mod.title}</span>
                        </div>
                        {mod.ctype === 'quiz'
                          ? <button onClick={() => setEditingQuiz(mod)}
                              style={{ background: 'var(--purple-bg)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EditIc s={14} c="var(--purple)" />
                            </button>
                          : <button onClick={() => setEditingModule(mod)}
                              style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <EditIc s={14} c="var(--muted)" />
                            </button>
                        }
                        <button onClick={() => setExpandedExtras(e => ({ ...e, [mod.id]: !e[mod.id] }))}
                          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
                          <ChevRIc s={14} c="var(--muted)" />
                        </button>
                        <button onClick={() => deleteCustom(mod.id)}
                          style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrashIc s={13} c="var(--error)" />
                        </button>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #D1FAE5' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, margin: '10px 0 8px' }}>Recursos adicionales</p>
                          {!(mod.extras?.length) && <p style={{ fontSize: 12, color: 'var(--subtle)', fontStyle: 'italic', marginBottom: 8 }}>Ninguno aún</p>}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {(mod.extras || []).map(extra => (
                              <div key={extra.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 14 }}>{extra.type === 'video' ? '🎬' : '📝'}</span>
                                <span style={{ fontSize: 12, color: 'var(--dark)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{extra.title}</span>
                                <button onClick={() => removeExtra(mod.id, extra.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                  <XIc s={13} c="var(--error)" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setShowAddExtra(mod.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
                            <PlusIc s={13} c="var(--orange)" /> Agregar recurso
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add buttons */}
          <button onClick={() => setShowQuizCreator(true)}
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12,
              border: '2px dashed var(--purple)', background: 'var(--purple-bg)', color: 'var(--purple)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--purple-bg)'}>
            <PlusIc s={18} c="var(--purple)" /> Crear reto Quiz
          </button>

          {/* Add custom module button */}
          <button onClick={() => setShowAddModule(true)}
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12,
              border: '2px dashed var(--success)', background: '#F0FDF4', color: 'var(--success)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#D1FAE5'}
            onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
        </div>

        {/* Right: tips */}
        <div style={{ padding: '20px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 14 }}>Cómo usar el editor</h4>
          {[
            { icon: '⋮⋮', text: 'Arrastra los módulos para cambiar el orden en que los estudiantes los ven.' },
            { icon: '🟢', text: 'Usa el toggle para activar o desactivar módulos específicos.' },
            { icon: '🎬', text: 'Agrega videos de YouTube o notas de texto como recursos extra.' },
            { icon: '✨', text: 'Crea módulos completamente nuevos con tu propio contenido.' },
            { icon: '💾', text: 'Guarda siempre los cambios para que se apliquen a los estudiantes.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <p style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              Los cambios afectan a todos los estudiantes del área seleccionada.
            </p>
          </div>
        </div>
      </div>

      <MatchingEditorModal
        open={!!editingMatching}
        mod={editingMatching}
        onClose={() => setEditingMatching(null)}
        onSave={saveMatchingOverride}
      />
      <QuizCreatorModal
        open={showQuizCreator || !!editingQuiz}
        initial={editingQuiz}
        onClose={() => { setShowQuizCreator(false); setEditingQuiz(null) }}
        onSave={saveQuizCustom}
      />

      {/* Edit base module */}
      <CustomModuleModal
        open={!!editingBaseModule}
        initial={editingBaseModule}
        extraActions={editingBaseModule?.override ? (
          <Btn variant="secondary" onClick={() => { clearOverride(editingBaseModule.id); setEditingBaseModule(null) }}>
            Restablecer original
          </Btn>
        ) : null}
        onClose={() => setEditingBaseModule(null)}
        onSave={saveBaseModuleOverride}
      />

      <AddExtraModal
        open={!!showAddExtra}
        onClose={() => setShowAddExtra(null)}
        onAdd={extra => { addExtra(showAddExtra, extra); setShowAddExtra(null) }}
      />
      <CustomModuleModal
        open={showAddModule || !!editingModule}
        initial={editingModule}
        onClose={() => { setShowAddModule(false); setEditingModule(null) }}
        onSave={mod => {
          if (editingModule) saveEditedModule(mod)
          else addCustomModule(mod)
          setShowAddModule(false); setEditingModule(null)
        }}
      />
    </div>
  )
}

export default InstructorRouteEditor
