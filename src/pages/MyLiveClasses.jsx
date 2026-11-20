import React from 'react'
import { RichText, QuestionText, ZoomImg, useMobile } from '../components/ui.jsx'
import { fetchMyLiveHistory } from '../lib/liveClient.js'
import { QuestionMetaChips } from '../components/LiveQuestionMeta.jsx'
import { LivePassage } from '../components/LiveQuestionView.jsx'
// =============================================
// EXPERIA — "Mis clases en vivo" del estudiante (nov 2026, 0088)
// Cada clase en vivo terminada queda guardada para repasar: qué preguntas se
// hicieron, cuáles respondió bien y cuáles mal, la respuesta correcta y la
// explicación. Disponible hasta antes de la Prueba Saber según el calendario
// del colegio (B → 31 de marzo, A → 30 de junio); lo filtra el servidor
// (live_my_history). Las opciones se muestran en su orden original: en la
// clase se barajaron, por eso se marca el TEXTO elegido, no la letra.
// =============================================

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const fmtShort = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

const ReviewQuestion = ({ item, n }) => {
  const q = item.question || {}
  const [showPassage, setShowPassage] = React.useState(false)
  const tone = !item.answered ? { bg: 'var(--bg)', bd: 'var(--border)', fg: 'var(--muted)', label: '⏱ Sin responder' }
    : item.correct ? { bg: '#F0FDFA', bd: 'var(--success)', fg: '#0F766E', label: '✓ Correcta' }
    : { bg: '#FEF2F2', bd: 'var(--error)', fg: '#B91C1C', label: '✗ Incorrecta' }
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--white)', border: `1.5px solid ${tone.bd}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>Pregunta {n}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: tone.bg, color: tone.fg }}>{tone.label}</span>
      </div>
      <QuestionMetaChips area={item.bank} question={q} />
      {q.passage && (
        <>
          <button onClick={() => setShowPassage(v => !v)}
            style={{ marginBottom: 8, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, color: 'var(--purple)' }}>
            📖 {showPassage ? 'Ocultar el texto' : `Ver el texto${q.passage.title ? `: ${q.passage.title}` : ''}`}
          </button>
          {showPassage && <LivePassage passage={q.passage} maxHeight="50vh" />}
        </>
      )}
      {q.image && <div style={{ marginBottom: 10 }}><ZoomImg src={q.image} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10, background: '#fff', border: '1px solid var(--border)' }} /></div>}
      {q.question
        ? <QuestionText as="p" style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.45, margin: '0 0 10px' }}>{q.question}</QuestionText>
        : <p style={{ fontSize: 13, color: 'var(--muted)' }}>Esta pregunta ya no está en la ruta.</p>}
      {q.questionAfter && <RichText as="p" style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 10px' }}>{q.questionAfter}</RichText>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(q.options || []).map((opt, i) => {
          const isCorrect = i === q.correct, isMine = item.answered && i === item.answer
          return (
            <div key={i} style={{ padding: '9px 12px', borderRadius: 10, fontSize: 14,
              border: `1.5px solid ${isCorrect ? 'var(--success)' : isMine ? 'var(--error)' : 'var(--border)'}`,
              background: isCorrect ? '#F0FDFA' : isMine ? '#FEF2F2' : 'var(--white)',
              color: (isCorrect || isMine) ? '#1A1A2E' : 'var(--dark)' }}>
              {q.optionImages?.[i] && <ZoomImg src={q.optionImages[i]} style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'contain', background: '#fff', borderRadius: 6 }} />}
              <RichText>{opt}</RichText>
              {(isCorrect || isMine) && (
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, marginTop: 3, color: isCorrect ? '#0F766E' : '#B91C1C' }}>
                  {isCorrect && isMine ? '✓ Tu respuesta · correcta' : isCorrect ? '✓ Respuesta correcta' : '✗ Tu respuesta'}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {q.explanation && (
        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>💡 Explicación</div>
          <RichText as="p" style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.65, margin: 0 }}>{q.explanation}</RichText>
        </div>
      )}
    </div>
  )
}

const SessionCard = ({ s, defaultOpen }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  const [onlyWrong, setOnlyWrong] = React.useState(false)
  const items = s.items || []
  const right = items.filter(i => i.correct).length
  const shown = onlyWrong ? items.filter(i => !i.correct) : items
  // Agrupar por módulo (primera ronda, ronda final…)
  const groups = []
  shown.forEach(it => {
    const g = groups.find(x => x.id === it.module_id)
    g ? g.items.push(it) : groups.push({ id: it.module_id, title: it.module_title || 'Preguntas', items: [it] })
  })
  let n = 0
  return (
    <div style={{ borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', border: 'none', background: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--orange-bg)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎮</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{s.title || s.course_name || 'Clase en vivo'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, textTransform: 'capitalize' }}>{fmtDate(s.ended_at)}</div>
          {s.available_until && <div style={{ fontSize: 11.5, color: 'var(--subtle)', marginTop: 2 }}>Disponible para repasar hasta el {fmtShort(s.available_until)}</div>}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--dark)' }}>{right}/{items.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>correctas · {s.score} pts</div>
        </div>
        <span aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▶</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length > right && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-sec)', cursor: 'pointer' }}>
              <input type="checkbox" checked={onlyWrong} onChange={e => setOnlyWrong(e.target.checked)} />
              Ver solo las que fallé o no respondí ({items.length - right})
            </label>
          )}
          {groups.map(g => (
            <React.Fragment key={g.id || 'x'}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange)', marginTop: 4 }}>{g.title}</div>
              {g.items.map(it => <ReviewQuestion key={`${it.module_id}|${it.question_index}`} item={it} n={++n} />)}
            </React.Fragment>
          ))}
          {!items.length && <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>En esta clase no se alcanzaron a hacer preguntas.</p>}
        </div>
      )}
    </div>
  )
}

const MyLiveClasses = () => {
  const isMobile = useMobile()
  const [list, setList] = React.useState(null)
  const [error, setError] = React.useState(false)
  const load = React.useCallback(() => {
    setError(false)
    fetchMyLiveHistory().then(setList).catch(e => { console.warn('[live] historial:', e?.message || e); setError(true) })
  }, [])
  React.useEffect(() => { load() }, [load])

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '16px 14px 60px' : '24px 24px 60px' }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: 'var(--dark)', margin: '0 0 6px' }}>🎮 Mis clases en vivo</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.55 }}>
          Repasa las preguntas de tus clases en vivo: cuáles acertaste, cuáles no, la respuesta correcta y su explicación.
          Quedan disponibles hasta antes de tu Prueba Saber.
        </p>
        {error ? (
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 10px' }}>Tus clases se están preparando.</p>
            <button onClick={load} style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--white)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--dark)' }}>Intentar de nuevo</button>
          </div>
        ) : list === null ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cargando…</p>
        ) : list.length === 0 ? (
          <div style={{ padding: '32px 20px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>📭</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '8px 0 4px' }}>Aún no tienes clases para repasar</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Cuando participes en una clase en vivo y tu profesor la finalice, aparecerá aquí.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {list.map((s, i) => <SessionCard key={s.session_id} s={s} defaultOpen={i === 0} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyLiveClasses
