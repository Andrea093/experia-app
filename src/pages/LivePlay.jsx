import React from 'react'
import { Btn, Confetti } from '../components/ui.jsx'
import {
  joinLiveSession, submitLiveAnswer, fetchSession, fetchParticipants,
  subscribeSession, subscribeParticipants, unsubscribe,
} from '../lib/liveClient.js'
import { primeAudio, isMuted, toggleMute, sCorrect, sWrong, sTick, sPodium } from '../lib/sound.js'
// =============================================
// EXPERIA — Modo Aula en Vivo · Estudiante (página pública, sin login)
// Acceso: /#/live  o  /#/live/<PIN>
// =============================================

const OPT_COLORS = ['#E8732C', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444']
const SS_KEY = 'experia:live-participant'

const codeFromHash = () => {
  const m = window.location.hash.match(/#\/live\/?([A-Za-z0-9]+)?/)
  return m && m[1] ? m[1] : ''
}

const Center = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20, background: 'var(--bg, #F9FAFB)', fontFamily: 'var(--font)' }}>
    <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
  </div>
)

// ---------- Formulario de ingreso ----------
const JoinForm = ({ onJoined }) => {
  const [code, setCode]       = React.useState(codeFromHash())
  const [nombre, setNombre]   = React.useState('')
  const [apellido, setApe]    = React.useState('')
  const [correo, setCorreo]   = React.useState('')
  const [salon, setSalon]     = React.useState('')
  const [busy, setBusy]       = React.useState(false)
  const [err, setErr]         = React.useState('')

  const inp = { padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'var(--white)' }
  const lbl = { fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }

  const submit = async () => {
    if (!code.trim()) { setErr('Ingresa el PIN'); return }
    if (!nombre.trim()) { setErr('El nombre es obligatorio'); return }
    setErr(''); setBusy(true); primeAudio() // desbloquea audio dentro del gesto
    try {
      const p = await joinLiveSession({ code: code.trim(), nombre, apellido, correo, salon })
      try { sessionStorage.setItem(SS_KEY, JSON.stringify({ participant: p.id, session: p.session_id, nombre: p.nombre })) } catch (_) {}
      onJoined(p)
    } catch (e) {
      setErr(e.message || 'No se pudo unir a la sesión')
    } finally { setBusy(false) }
  }

  return (
    <Center>
      <div style={{ background: 'var(--white)', borderRadius: 20, padding: '28px 24px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 40 }}>🎮</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 4px' }}>Aula en Vivo</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Ingresa el PIN y tus datos para participar</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>PIN de la sesión *</label>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" placeholder="------"
              style={{ ...inp, textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: 800 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Apellido</label><input value={apellido} onChange={e => setApe(e.target.value)} style={inp} /></div>
          </div>
          <div><label style={lbl}>Correo</label><input value={correo} onChange={e => setCorreo(e.target.value)} type="email" style={inp} /></div>
          <div><label style={lbl}>Salón</label><input value={salon} onChange={e => setSalon(e.target.value)} placeholder="Ej: 9B" style={inp} /></div>
          {err && <p style={{ fontSize: 13, color: 'var(--error)', margin: 0, fontWeight: 600 }}>{err}</p>}
          <Btn variant="gradient" size="lg" full disabled={busy} onClick={submit}>
            {busy ? 'Entrando…' : 'Entrar 🚀'}
          </Btn>
        </div>
      </div>
    </Center>
  )
}

// ---------- Cuenta regresiva ----------
const Countdown = ({ startedAt, limit }) => {
  const [left, setLeft] = React.useState(limit)
  const lastTick = React.useRef(null)
  React.useEffect(() => {
    if (!startedAt) return
    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const l = Math.max(0, Math.ceil(limit - elapsed))
      setLeft(l)
      if (l > 0 && l <= 5 && lastTick.current !== l) { lastTick.current = l; sTick() }
    }
    tick(); const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startedAt, limit])
  const pct = Math.max(0, Math.min(100, (left / limit) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 6, transition: 'width .25s linear',
          background: left <= 5 ? 'var(--error)' : 'var(--orange)' }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: left <= 5 ? 'var(--error)' : 'var(--dark)', minWidth: 28, textAlign: 'right' }}>{left}</span>
    </div>
  )
}

// ---------- Vista de juego ----------
const PlayView = ({ participant }) => {
  const [session, setSession]   = React.useState(null)
  const [parts, setParts]       = React.useState([])
  const [myAnswers, setMy]      = React.useState({}) // index -> answerIndex
  const [feedback, setFeedback] = React.useState(null) // {is_correct, points}
  const [sending, setSending]   = React.useState(false)

  React.useEffect(() => {
    let chS, chP
    const reloadP = () => fetchParticipants(participant.session_id).then(setParts)
    const resync = () => { fetchSession(participant.session_id).then(s => s && setSession(s)); reloadP() }
    resync()
    chS = subscribeSession(participant.session_id, s => setSession(s))
    chP = subscribeParticipants(participant.session_id, reloadP)
    // Red de seguridad ante caídas de realtime
    const poll = setInterval(resync, 7000)
    const onVis = () => { if (document.visibilityState === 'visible') resync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsubscribe(chS); unsubscribe(chP); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [participant.session_id])

  // Resetea el feedback al abrir una nueva pregunta
  React.useEffect(() => { setFeedback(null) }, [session?.current_index, session?.phase === 'question'])

  // Sonido en el revelado (no al enviar, para no adelantar el resultado) + podio
  const prevPhase = React.useRef(null)
  React.useEffect(() => {
    if (!session) return
    if (session.phase !== prevPhase.current) {
      if (session.phase === 'reveal') {
        const correct = session.current_reveal?.correct
        const mine = myAnswers[session.current_index]
        if (mine !== undefined) (mine === correct ? sCorrect() : sWrong())
      } else if (session.phase === 'podium') sPodium()
      prevPhase.current = session.phase
    }
  }, [session?.phase, session?.current_index]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <Center><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Conectando…</p></Center>

  const idx = session.current_index
  const q = (session.questions || [])[idx] || {}
  const options = q.options || []
  const myAns = myAnswers[idx]
  const me = parts.find(p => p.id === participant.id)
  const myRank = parts.findIndex(p => p.id === participant.id) + 1

  const answer = async (i) => {
    if (myAns !== undefined || sending) return
    setSending(true); setMy(m => ({ ...m, [idx]: i }))
    try {
      const r = await submitLiveAnswer({ session: session.id, participant: participant.id, index: idx, answer: i })
      setFeedback(r)
    } catch (e) {
      setMy(m => { const n = { ...m }; delete n[idx]; return n }) // permite reintentar si falló
      setFeedback({ error: e.message })
    } finally { setSending(false) }
  }

  // ----- Render por fase -----
  if (session.phase === 'lobby') return (
    <Center><div style={card}>
      <div style={{ fontSize: 40, textAlign: 'center' }}>✅</div>
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '10px 0 6px' }}>¡Estás dentro!</h2>
      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Hola <b>{me?.nombre || participant.nombre}</b>. Espera a que el profesor inicie…</p>
      <p style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: 13, marginTop: 10 }}>{parts.length} participante(s) conectado(s)</p>
    </div></Center>
  )

  if (session.phase === 'podium' || session.status === 'ended') {
    const top = parts.slice(0, 5)
    return (
      <Center><Confetti /><div style={card}>
        <div style={{ fontSize: 44, textAlign: 'center' }}>🏆</div>
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 16px' }}>Resultados finales</h2>
        <Ranking list={top} meId={participant.id} />
        <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', borderRadius: 12, background: 'var(--orange-bg)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
          <b style={{ color: 'var(--orange)' }}>#{myRank} · {me?.score || 0} pts</b>
        </div>
      </div></Center>
    )
  }

  if (session.phase === 'leaderboard') return (
    <Center><div style={card}>
      <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 14 }}>Tabla de posiciones</h2>
      <Ranking list={parts.slice(0, 8)} meId={participant.id} />
      <p style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: 13, marginTop: 14 }}>Espera la siguiente pregunta…</p>
    </div></Center>
  )

  if (session.phase === 'reveal' || session.phase === 'explanation') {
    const correct = session.current_reveal?.correct
    const wasRight = myAns === correct
    return (
      <Center><div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pregunta {idx + 1}</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.4 }}>{q.question}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt, i) => {
            const isCorrect = i === correct, isMine = i === myAns
            return (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                border: `2px solid ${isCorrect ? 'var(--success)' : isMine ? 'var(--error)' : 'var(--border)'}`,
                background: isCorrect ? '#F0FDFA' : isMine ? '#FEF2F2' : 'var(--white)', color: 'var(--dark)',
                display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff',
                  fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String.fromCharCode(65 + i)}</span>
                {opt}{isCorrect && ' ✓'}{isMine && !isCorrect && ' ✗'}
              </div>
            )
          })}
        </div>
        {myAns === undefined
          ? <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>No respondiste a tiempo.</p>
          : <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: 700, color: wasRight ? 'var(--success)' : 'var(--error)' }}>
              {wasRight ? `✓ ¡Correcto! +${feedback?.points ?? ''} pts` : '✗ Respuesta incorrecta'}
            </p>}
        {session.phase === 'explanation' && (session.current_reveal?.explanation || session.current_reveal?.explanationImage) && (
          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💡 Explicación</div>
            {session.current_reveal.explanation && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{session.current_reveal.explanation}</p>}
            {session.current_reveal.explanationImage && <img src={session.current_reveal.explanationImage} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 10, marginTop: 10 }} />}
          </div>
        )}
      </div></Center>
    )
  }

  // phase === 'question'
  const answered = myAns !== undefined
  return (
    <Center><div style={card}>
      <Countdown startedAt={session.question_started_at} limit={q.time_limit_s || session.time_limit_s || 20} />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        Pregunta {idx + 1} de {session.total_questions}
      </div>
      {q.image && <img src={q.image} alt="" style={{ width: '100%', maxHeight: q.imageHeight || 220, objectFit: 'contain', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' }} />}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.4 }}>{q.question}</h3>
      {answered ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 34 }}>📨</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>¡Respuesta enviada!</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Espera a que el profesor muestre los resultados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => answer(i)} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 14, cursor: 'pointer',
                border: 'none', background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff', textAlign: 'left',
                fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, boxShadow: 'var(--sh-md)', opacity: sending ? .7 : 1 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.25)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      )}
      {me && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--subtle)', marginTop: 14 }}>Tu puntaje: <b style={{ color: 'var(--orange)' }}>{me.score} pts</b> · #{myRank}</p>}
    </div></Center>
  )
}

const card = { background: 'var(--white)', borderRadius: 20, padding: '24px 22px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }

const Ranking = ({ list, meId }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {list.map((p, i) => {
      const mine = p.id === meId
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: mine ? 'var(--orange-bg)' : 'var(--bg)', border: mine ? '1.5px solid var(--orange)' : '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, minWidth: 26 }}>{medal}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{p.nombre} {p.apellido || ''}{mine ? ' (tú)' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>{p.score}</span>
        </div>
      )
    })}
  </div>
)

// Botón flotante de silencio (persistente en localStorage)
const MuteFab = () => {
  const [muted, setMuted] = React.useState(isMuted())
  return (
    <button onClick={() => setMuted(toggleMute())} title={muted ? 'Activar sonido' : 'Silenciar'}
      style={{ position: 'fixed', top: 14, right: 14, zIndex: 9000, width: 40, height: 40, borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: 18,
        boxShadow: 'var(--sh-md)', fontFamily: 'var(--font)' }}>
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

const LivePlay = () => {
  const [participant, setParticipant] = React.useState(null)

  // Reanuda si ya se había unido (refresco de página)
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.participant && saved?.session) setParticipant({ id: saved.participant, session_id: saved.session, nombre: saved.nombre })
      }
    } catch (_) {}
  }, [])

  return (
    <>
      <MuteFab />
      {!participant ? <JoinForm onJoined={setParticipant} /> : <PlayView participant={participant} />}
    </>
  )
}

export default LivePlay
