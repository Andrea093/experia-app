import React from 'react'
import { useStore } from '../store/store.jsx'
import { getCharacter, getCharacterLine } from '../lib/characters.jsx'

// =============================================================================
// CharacterFloat — guía flotante del curso temático (esquina inferior izquierda)
// -----------------------------------------------------------------------------
// Data-driven desde src/lib/characters.jsx: el personaje, su paleta y sus
// diálogos vienen del registro por tema. Reacciona a eventos del estudiante
// mediante el store (`charReaction`), disparado con reactCharacter(context).
//   - Al entrar a un curso con tema → saludo 'idle'.
//   - Al acertar/fallar un reto, completar módulo, etc. → frase contextual.
// Se monta una sola vez de forma global (app.jsx). Si el curso no tiene tema
// o el tema no tiene personaje en el registro, no renderiza nada.
// =============================================================================

const selectActiveTheme = (s) =>
  (s.courses || []).find(c => c.id === s.enrolledCourseId)?.theme || null

export const CharacterFloat = () => {
  const theme = useStore(selectActiveTheme)
  const reaction = useStore(s => s.charReaction)
  const char = theme ? getCharacter(theme) : null

  const [open, setOpen] = React.useState(false)
  const [line, setLine] = React.useState(null)
  const [seen, setSeen] = React.useState(false)

  // Saludo idle al entrar a un curso con tema (o al cambiar de tema).
  React.useEffect(() => {
    if (!char) { setOpen(false); return }
    setLine(getCharacterLine(theme, 'idle'))
    setSeen(false)
    const t = setTimeout(() => { setOpen(true); setSeen(true) }, 800)
    return () => clearTimeout(t)
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reacción a un evento del estudiante (correct/wrong/moduleComplete/…).
  React.useEffect(() => {
    if (!char || !reaction) return
    const l = reaction.line || getCharacterLine(theme, reaction.context)
    if (!l) return
    setLine(l); setOpen(true); setSeen(true)
  }, [reaction?.ts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-cerrar la burbuja tras unos segundos.
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 6000)
    return () => clearTimeout(t)
  }, [open, line])

  if (!char) return null
  const ui = char.ui

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      pointerEvents: 'none',
    }}>
      {open && line && (
        <div style={{
          maxWidth: 280, background: ui.bgCard,
          border: `1px solid ${ui.borderCard}`,
          borderRadius: '12px 12px 12px 2px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,.8)',
          animation: ui.revealAnim,
          pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
            color: ui.nameColor, marginBottom: 4 }}>{char.name}</div>
          <div style={{ fontSize: 12, color: ui.textColor, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{line}"
          </div>
        </div>
      )}

      <div
        onClick={() => { setOpen(o => !o); setSeen(true) }}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          border: `2px solid ${open ? ui.borderActive : ui.borderIdle}`,
          background: ui.bgAvatar, overflow: 'hidden', cursor: 'pointer',
          boxShadow: open ? ui.glow : ui.glowIdle,
          transition: 'all .3s ease',
          animation: ui.animAvatar,
          pointerEvents: 'auto', flexShrink: 0,
        }}
        title={`${char.name} — clic para escuchar`}
      >
        <char.Avatar />
      </div>

      {!seen && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: ui.dotBg, border: `2px solid ${ui.dotBorder}`,
          animation: ui.dotAnim,
        }} />
      )}
    </div>
  )
}

export default CharacterFloat
