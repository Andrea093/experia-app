import React from 'react'
import { PlusIc, XIc, CheckIc, ChevRIc, ArrowLIc, ArrowRIc, Btn, Modal, ImageUploader, RichInput } from '../ui.jsx'

const QuizCreatorModal = ({ open, initial, onClose, onSave, variant = 'quiz' }) => {
  const isPoll = variant === 'poll'
  const [title, setTitle]   = React.useState('')
  const [desc, setDesc]     = React.useState('')
  const [task, setTask]     = React.useState('')
  const [xp, setXp]         = React.useState(100)
  const [questions, setQs]  = React.useState([])
  const [correctMsg, setCorrectMsg]     = React.useState('')
  const [incorrectMsg, setIncorrectMsg] = React.useState('')
  const [passingScore, setPassingScore] = React.useState(60)
  const [maxAttempts, setMaxAttempts]   = React.useState('')
  const [passMsg, setPassMsg]           = React.useState('')
  const [failMsg, setFailMsg]           = React.useState('')
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
      setQs(initial?.questions || [{ id: 1, question: '', options: ['', '', '', ''], ...(isPoll ? {} : { correct: 0 }) }])
      setCorrectMsg(initial?.correctMessage || '')
      setIncorrectMsg(initial?.incorrectMessage || '')
      setPassingScore(initial?.passingScore ?? 60)
      setMaxAttempts(initial?.maxAttempts != null ? String(initial.maxAttempts) : '')
      setPassMsg(initial?.passMessage || '')
      setFailMsg(initial?.failMessage || '')
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

  const [advOpen, setAdvOpen] = React.useState({}) // id -> bool (opciones avanzadas abiertas)
  const toggleAdv = (id) => setAdvOpen(o => ({ ...o, [id]: !o[id] }))

  const addQ = () => setQs(q => [...q, { id: Date.now(), question: '', options: ['', '', '', ''], ...(isPoll ? {} : { correct: 0 }) }])
  const removeQ = (id) => setQs(q => q.filter(x => x.id !== id))
  const updateQ = (id, key, val) => setQs(q => q.map(x => x.id === id ? { ...x, [key]: val } : x))
  const dupQ = (id) => setQs(q => {
    const i = q.findIndex(x => x.id === id); if (i < 0) return q
    const copy = { ...q[i], id: Date.now(), options: [...q[i].options], optionImages: [...(q[i].optionImages || [])] }
    return [...q.slice(0, i + 1), copy, ...q.slice(i + 1)]
  })
  const moveQ = (id, dir) => setQs(q => {
    const i = q.findIndex(x => x.id === id); const j = i + dir
    if (i < 0 || j < 0 || j >= q.length) return q
    const next = [...q];[next[i], next[j]] = [next[j], next[i]]; return next
  })
  const updateOpt = (qId, optIdx, val) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const opts = [...x.options]; opts[optIdx] = val
    return { ...x, options: opts }
  }))
  // Imagen por opción (opción visual). '' para quitarla.
  const updateOptImg = (qId, optIdx, url) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const imgs = [...(x.optionImages || [])]; imgs[optIdx] = url
    return { ...x, optionImages: imgs }
  }))

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if (!questions.length) { setErr('Agrega al menos una pregunta'); return }
    // Una opción es válida si tiene texto O una imagen (opciones visuales).
    const incomplete = questions.find(q => !q.question.trim() || q.options.some((o, i) => !o.trim() && !(q.optionImages?.[i])))
    if (incomplete) { setErr('Completa todas las preguntas y opciones (texto o imagen en cada opción)'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100, questions: cleanQuestions(), passage: buildPassage(), type: 'challenge', ctype: isPoll ? 'poll' : 'quiz',
      ...(isPoll ? {} : {
        correctMessage: correctMsg.trim(), incorrectMessage: incorrectMsg.trim(),
        passingScore: Math.min(100, Math.max(0, Number(passingScore) || 0)),
        maxAttempts: (maxAttempts === '' || Number(maxAttempts) <= 0) ? null : Math.floor(Number(maxAttempts)),
        passMessage: passMsg.trim(), failMessage: failMsg.trim(),
      }) })
  }

  // Limpia campos opcionales vacíos y normaliza números antes de guardar
  const cleanQuestions = () => questions.map(q => {
    const out = { id: q.id, question: q.question.trim(), options: q.options }
    if (!isPoll) out.correct = q.correct
    if (q.image) {
      out.image = q.image
      if (q.imageHeight) out.imageHeight = Number(q.imageHeight)
      if (q.imagePosition) out.imagePosition = q.imagePosition   // before | between | after
      // 'between' parte la pregunta en dos: `question` (antes) + `questionAfter` (después de la imagen)
      if (q.imagePosition === 'between' && q.questionAfter?.trim()) out.questionAfter = q.questionAfter.trim()
    }
    // Imágenes por opción (opciones visuales): array alineado por índice, '' donde no hay
    const optImgs = q.optionImages || []
    if (optImgs.some(u => u)) out.optionImages = q.options.map((_, i) => optImgs[i] || '')
    if (!isPoll && q.explanation?.trim()) out.explanation = q.explanation.trim()
    if (!isPoll && q.explanationImage) out.explanationImage = q.explanationImage
    if (q.timeLimit) out.timeLimit = Number(q.timeLimit)
    if (!isPoll && q.points) out.points = Number(q.points)
    if (q.difficulty) out.difficulty = q.difficulty
    return out
  })

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const advLbl = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }

  return (
    <Modal open={open} onClose={onClose}
      title={isPoll ? (initial ? 'Editar encuesta en vivo' : 'Crear encuesta en vivo') : (initial ? 'Editar reto Quiz' : 'Crear reto Quiz')}
      width={600}>
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
        {!isPoll && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje de acierto (opcional)</label>
              <input value={correctMsg} onChange={e => setCorrectMsg(e.target.value)} placeholder="✓ ¡Correcto!" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje de error (opcional)</label>
              <input value={incorrectMsg} onChange={e => setIncorrectMsg(e.target.value)} placeholder="✗ Respuesta correcta:" style={inp} />
            </div>
          </div>
        )}

        {/* ── Resultado final: qué ve el estudiante al terminar el quiz ── */}
        {!isPoll && (
          <div style={{ padding: '14px', borderRadius: 12, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', display: 'block', marginBottom: 10 }}>
              🏁 Resultado final (al terminar todas las preguntas)
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Puntaje mínimo para aprobar (%)</label>
                <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min={0} max={100} style={{ ...inp, width: 110 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Intentos permitidos</label>
                <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} min={1} placeholder="∞ ilimitados" style={{ ...inp, width: 130 }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 10px' }}>Si no se alcanza el mínimo, el estudiante no puede continuar. Deja "Intentos" vacío para ilimitados; al agotarlos, se le pide acudir al tutor para reiniciar.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje si aprueba (opcional)</label>
                <textarea value={passMsg} onChange={e => setPassMsg(e.target.value)} rows={2} placeholder="¡Excelente trabajo! Aprobaste la evaluación." style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje si no aprueba (opcional)</label>
                <textarea value={failMsg} onChange={e => setFailMsg(e.target.value)} rows={2} placeholder="Aún no alcanzas el puntaje mínimo. ¡Sigue practicando!" style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 0' }}>Los campos vacíos usan el mensaje por defecto (mostrado como ejemplo).</p>
          </div>
        )}

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
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    Pregunta {qi + 1}
                    {q.difficulty && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: q.difficulty === 'dificil' ? '#FEE2E2' : q.difficulty === 'facil' ? '#DCFCE7' : '#FEF3C7',
                      color: q.difficulty === 'dificil' ? 'var(--error)' : q.difficulty === 'facil' ? 'var(--success)' : '#B45309' }}>
                      {q.difficulty === 'dificil' ? 'Difícil' : q.difficulty === 'facil' ? 'Fácil' : 'Media'}</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['up', -1, '↑'], ['down', 1, '↓']].map(([k, dir, sym]) => (
                      <button key={k} onClick={() => moveQ(q.id, dir)} disabled={dir < 0 ? qi === 0 : qi === questions.length - 1} title={dir < 0 ? 'Subir' : 'Bajar'}
                        style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)',
                          fontSize: 14, fontWeight: 700, color: 'var(--muted)', opacity: (dir < 0 ? qi === 0 : qi === questions.length - 1) ? .3 : 1 }}>{sym}</button>
                    ))}
                    <button onClick={() => dupQ(q.id)} title="Duplicar"
                      style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlusIc s={13} c="var(--muted)" />
                    </button>
                    <button onClick={() => removeQ(q.id)} disabled={questions.length <= 1} title="Eliminar"
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: questions.length <= 1 ? .3 : 1 }}>
                      <XIc s={13} c="var(--error)" />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <RichInput multiline rows={2} value={q.question} onChange={v => updateQ(q.id, 'question', v)}
                    placeholder="Escribe la pregunta aquí… (párrafos largos; usa la barra para negrilla y color)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {q.options.map((opt, oi) => {
                    const optImg = q.optionImages?.[oi] || ''
                    return (
                    <div key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {isPoll ? (
                        <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-alt)', marginTop: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                      ) : (
                        <button onClick={() => updateQ(q.id, 'correct', oi)} title="Marcar como correcta"
                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 8,
                            background: q.correct === oi ? 'var(--success)' : 'var(--bg-alt)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {q.correct === oi
                            ? <CheckIc s={13} c="#fff" />
                            : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{String.fromCharCode(65 + oi)}</span>}
                        </button>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <RichInput value={opt} onChange={v => updateOpt(q.id, oi, v)}
                          placeholder={`Opción ${String.fromCharCode(65 + oi)}${!isPoll && q.correct === oi ? ' (correcta)' : ''}${optImg ? ' — texto opcional' : ''}`}
                          style={{ border: !isPoll && q.correct === oi ? '1.5px solid var(--success)' : '1.5px solid var(--border)' }} />
                        {optImg ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={optImg} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                            <button onClick={() => updateOptImg(q.id, oi, '')} title="Quitar imagen"
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <XIc s={12} c="var(--error)" />
                            </button>
                          </div>
                        ) : (
                          <ImageUploader label="🖼️ Imagen de la opción (opcional)" compact onUploaded={url => updateOptImg(q.id, oi, url)} />
                        )}
                      </div>
                    </div>
                  )})}
                </div>
                {!isPoll && <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>Haz clic en el círculo para marcar la opción correcta. Cada opción puede llevar texto, imagen, o ambos.</p>}

                {/* ── Opciones avanzadas por pregunta ── */}
                <button onClick={() => toggleAdv(q.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 0', border: 'none',
                    background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>
                  <span style={{ display: 'inline-block', transform: advOpen[q.id] ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                    <ChevRIc s={13} c="var(--purple)" />
                  </span>
                  ⚙️ Opciones avanzadas {(q.image || (!isPoll && q.explanation)) ? '•' : ''}
                </button>

                {advOpen[q.id] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px dashed var(--border)' }}>
                    {/* Imagen de la pregunta */}
                    <div>
                      <label style={advLbl}>Imagen de la pregunta (opcional)</label>
                      {q.image && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <img src={q.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Alto máx px</label>
                            <input type="number" value={q.imageHeight || ''} onChange={e => updateQ(q.id, 'imageHeight', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                            <button onClick={() => { updateQ(q.id, 'image', ''); updateQ(q.id, 'imageHeight', ''); updateQ(q.id, 'imagePosition', '') }} title="Quitar"
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <XIc s={12} c="var(--error)" />
                            </button>
                          </div>
                          {/* Posición de la imagen respecto a la pregunta */}
                          <label style={advLbl}>Posición de la imagen</label>
                          <select value={q.imagePosition || 'before'} onChange={e => updateQ(q.id, 'imagePosition', e.target.value)} style={{ ...inp, fontSize: 12, marginBottom: 6 }}>
                            <option value="before">Antes de la pregunta (arriba)</option>
                            <option value="between">En medio del texto de la pregunta</option>
                            <option value="after">Después de las opciones (abajo)</option>
                          </select>
                          {q.imagePosition === 'between' && (
                            <div style={{ marginTop: 4 }}>
                              <label style={advLbl}>Segunda parte de la pregunta (va DESPUÉS de la imagen)</label>
                              <RichInput multiline rows={2} value={q.questionAfter || ''} onChange={v => updateQ(q.id, 'questionAfter', v)}
                                placeholder="Continúa aquí el texto de la pregunta que va debajo de la imagen…" />
                              <p style={{ fontSize: 10, color: 'var(--subtle)', margin: '4px 0 0' }}>El cuadro principal de arriba es la primera parte; esto va después de la imagen.</p>
                            </div>
                          )}
                        </>
                      )}
                      <ImageUploader label={q.image ? 'Reemplazar imagen' : 'Subir imagen'} compact onUploaded={url => updateQ(q.id, 'image', url)} />
                    </div>

                    {/* Explicación (no aplica a encuestas: no hay respuesta correcta que explicar) */}
                    {!isPoll && (
                      <div>
                        <label style={advLbl}>Explicación (se muestra al estudiante después de responder)</label>
                        <textarea value={q.explanation || ''} onChange={e => updateQ(q.id, 'explanation', e.target.value)} rows={3}
                          placeholder="Explica por qué la respuesta correcta es la correcta…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
                        <div style={{ marginTop: 6 }}>
                          {q.explanationImage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <img src={q.explanationImage} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                              <button onClick={() => updateQ(q.id, 'explanationImage', '')} title="Quitar"
                                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <XIc s={12} c="var(--error)" />
                              </button>
                            </div>
                          )}
                          <ImageUploader label={q.explanationImage ? 'Reemplazar imagen' : 'Imagen de la explicación (opcional)'} compact onUploaded={url => updateQ(q.id, 'explanationImage', url)} />
                        </div>
                      </div>
                    )}

                    {/* Metadatos para el modo en vivo */}
                    <div style={{ display: 'grid', gridTemplateColumns: isPoll ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={advLbl}>Tiempo (s)</label>
                        <input type="number" value={q.timeLimit || ''} onChange={e => updateQ(q.id, 'timeLimit', e.target.value)} placeholder="20" min={5} style={{ ...inp, fontSize: 12 }} />
                      </div>
                      {!isPoll && (
                        <div>
                          <label style={advLbl}>Puntos</label>
                          <input type="number" value={q.points || ''} onChange={e => updateQ(q.id, 'points', e.target.value)} placeholder="1000" min={0} style={{ ...inp, fontSize: 12 }} />
                        </div>
                      )}
                      <div>
                        <label style={advLbl}>Dificultad</label>
                        <select value={q.difficulty || ''} onChange={e => updateQ(q.id, 'difficulty', e.target.value)} style={{ ...inp, fontSize: 12 }}>
                          <option value="">—</option>
                          <option value="facil">Fácil</option>
                          <option value="media">Media</option>
                          <option value="dificil">Difícil</option>
                        </select>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--subtle)', margin: 0 }}>⏱️ Tiempo{!isPoll && ' y puntos'} se usará{!isPoll && 'n'} en el Modo Aula en Vivo (contra reloj).</p>
                  </div>
                )}
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
