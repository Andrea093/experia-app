import React from 'react'

// Aviso a estudiantes cuando el profesor lanzó una Clase en Vivo Guiada para
// su curso. Unirse es decisión del estudiante — no se auto-une.
const GuidedSessionBanner = ({ session, onJoin }) => {
  const [joining, setJoining] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(null) // guarda el id de sesión descartada

  if (!session || dismissed === session.id) return null

  const handleJoin = async () => {
    setJoining(true)
    try { await onJoin() } catch (_) { /* el estudiante puede reintentar */ }
    finally { setJoining(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      background: 'var(--gradient-orange)', color: '#fff', flexShrink: 0 }}>
      <span style={{ fontSize: 18, animation: 'glow 2s ease infinite' }}>🔴</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
        Tu profesor inició una clase en vivo{session.title ? `: ${session.title}` : ''} — únete para seguirla en tiempo real.
      </span>
      <button onClick={handleJoin} disabled={joining}
        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#fff', color: 'var(--orange)',
          fontWeight: 700, fontSize: 13, cursor: joining ? 'default' : 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}>
        {joining ? 'Uniendo…' : 'Unirme'}
      </button>
      <button onClick={() => setDismissed(session.id)} aria-label="Ocultar aviso"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
        ✕
      </button>
    </div>
  )
}

export default GuidedSessionBanner
