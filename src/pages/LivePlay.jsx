import React from 'react'
import { Btn } from '../components/ui.jsx'
import { LiveQuestionView } from '../components/LiveQuestionView.jsx'
import { joinLiveSession } from '../lib/liveClient.js'
import { primeAudio, isMuted, toggleMute } from '../lib/sound.js'
// =============================================
// EXPERIA — Modo Aula en Vivo · Estudiante (página pública, sin login)
// Acceso: /#/live  o  /#/live/<PIN>
// El ciclo de pregunta/revelado/leaderboard/podio vive en LiveQuestionView
// (compartido con la Clase en Vivo Guiada de estudiantes logueados).
// =============================================

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
      try { sessionStorage.setItem(SS_KEY, JSON.stringify({ participant: p.id, session: p.session_id, nombre: p.nombre, token: p.claim_token })) } catch (_) {}
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
        if (saved?.participant && saved?.session) setParticipant({ id: saved.participant, session_id: saved.session, nombre: saved.nombre, claim_token: saved.token })
      }
    } catch (_) {}
  }, [])

  return (
    <>
      <MuteFab />
      {!participant ? <JoinForm onJoined={setParticipant} /> : <LiveQuestionView participant={participant} Wrap={Center} />}
    </>
  )
}

export default LivePlay
