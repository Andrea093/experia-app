import React from 'react'
import { PlusIc, XIc, CheckIc, Btn, Modal, ImageUploader } from '../ui.jsx'

const QuizCreatorModal = ({ open, initial, onClose, onSave }) => {
  const [title, setTitle]   = React.useState('')
  const [desc, setDesc]     = React.useState('')
  const [task, setTask]     = React.useState('')
  const [xp, setXp]         = React.useState(100)
  const [questions, setQs]  = React.useState([])
  const [err, setErr]       = React.useState('')
  // --- Passage (texto/imágenes de apoyo, opcional) ---
  const [pOn, setPOn]       = React.useState(false)
  const [pIntro, setPIntro] = React.useState('')
  const [pTitle, setPTitle] = React.useState('')
  const [pText, setPText]   = React.useState('')
  const [pSource, setPSrc]  = React.useState('')
  const [pImgs, setPImgs]   = React.useState([])

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 100)
      setQs(initial?.questions || [{ id: 1, question: '', options: ['', '', '', ''], correct: 0 }])
      setErr('')
      const ps = initial?.passage
      setPOn(!!ps)
      setPIntro(ps?.intro || '')
      setPTitle(ps?.title || '')
      setPText((ps?.paragraphs || []).join('\n\n'))
      setPSrc(ps?.source || '')
      setPImgs(ps?.images || [])
    }
  }, [open, initial])

  const addImg = (url) => setPImgs(l => [...l, { url, caption: '', width: 340, height: 420 }])
  const updImg = (i, k, v) => setPImgs(l => l.map((im, idx) => idx === i ? { ...im, [k]: v } : im))
  const rmImg  = (i) => setPImgs(l => l.filter((_, idx) => idx !== i))

  const buildPassage = () => {
    if (!pOn) return null
    const blocks = pText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
    const paragraphs = blocks.length > 1 ? blocks : pText.split('\n').map(s => s.trim()).filter(Boolean)
    const images = pImgs.filter(im => im.url).map(im => ({
      url: im.url,
      ...(im.caption ? { caption: im.caption } : {}),
      ...(im.width  ? { width:  Number(im.width)  } : {}),
      ...(im.height ? { height: Number(im.height) } : {}),
    }))
    const p = {}
    if (pIntro.trim())  p.intro = pIntro.trim()
    if (pTitle.trim())  p.title = pTitle.trim()
    if (paragraphs.length) p.paragraphs = paragraphs
    if (images.length) { p.images = images; p.imagesLayout = 'row' }
    if (pSource.trim()) p.source = pSource.trim()
    return Object.keys(p).length ? p : null
  }

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
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100, questions, passage: buildPassage(), type: 'challenge', ctype: 'quiz' })
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

        {/* ── Texto / imágenes de apoyo (passage) ── */}
        <div style={{ padding: '14px', borderRadius: 12, background: 'var(--purple-bg)', border: '1px solid var(--purple)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>
            <input type="checkbox" checked={pOn} onChange={e => setPOn(e.target.checked)} />
            Agregar texto o imágenes de apoyo (se muestran encima de las preguntas)
          </label>

          {pOn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <input value={pIntro} onChange={e => setPIntro(e.target.value)} placeholder="Instrucción (ej: DE ACUERDO CON EL SIGUIENTE TEXTO RESPONDE LAS PREGUNTAS 1 A 3)" style={inp} />
              <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Título del texto (opcional)" style={inp} />
              <textarea value={pText} onChange={e => setPText(e.target.value)} rows={6}
                placeholder="Pega aquí el texto de lectura. Separa los párrafos con una línea en blanco."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />

              {/* Imágenes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pImgs.map((im, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--border)' }}>
                    <img src={im.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input value={im.caption} onChange={e => updImg(i, 'caption', e.target.value)} placeholder="Pie de imagen (ej: Recuadro 1)" style={{ ...inp, fontSize: 12 }} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Ancho px</label>
                        <input type="number" value={im.width || ''} onChange={e => updImg(i, 'width', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Alto máx px</label>
                        <input type="number" value={im.height || ''} onChange={e => updImg(i, 'height', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                      </div>
                    </div>
                    <button onClick={() => rmImg(i)} title="Quitar imagen"
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <XIc s={13} c="var(--error)" />
                    </button>
                  </div>
                ))}
                <ImageUploader label="Subir imagen" compact onUploaded={addImg} />
              </div>

              <input value={pSource} onChange={e => setPSrc(e.target.value)} placeholder="Fuente / autor (opcional)" style={inp} />
            </div>
          )}
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
                      <button onClick={() => updateQ(q.id, 'correct', oi)} title="Marcar como correcta"
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

export default QuizCreatorModal
