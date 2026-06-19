import React from 'react'
import { useStore } from '../store/store.jsx'

// Avatares SVG inline — sin dependencias externas
const VERAAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Fondo */}
    <circle cx="26" cy="26" r="26" fill="#1C1A16"/>
    {/* Sombrero de detective */}
    <ellipse cx="26" cy="18" rx="13" ry="3.5" fill="#2A2420"/>
    <rect x="17" y="10" width="18" height="10" rx="4" fill="#2A2420"/>
    <rect x="14" y="17" width="24" height="3" rx="1.5" fill="#3A3028"/>
    {/* Cara */}
    <ellipse cx="26" cy="30" rx="9" ry="10" fill="#C8956A"/>
    {/* Cabello oscuro */}
    <path d="M17 28 Q26 20 35 28" fill="#1A1208"/>
    {/* Ojos */}
    <ellipse cx="22.5" cy="29" rx="1.8" ry="2" fill="#1A1208"/>
    <ellipse cx="29.5" cy="29" rx="1.8" ry="2" fill="#1A1208"/>
    <circle cx="23" cy="28.5" r=".6" fill="white" opacity=".7"/>
    <circle cx="30" cy="28.5" r=".6" fill="white" opacity=".7"/>
    {/* Nariz */}
    <ellipse cx="26" cy="32" rx="1.2" ry=".8" fill="#A87050" opacity=".6"/>
    {/* Boca — expresión seria con una comisura levantada */}
    <path d="M23 35 Q26 36.5 29 35" stroke="#A87050" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {/* Lupa — accesorio icónico */}
    <circle cx="38" cy="40" r="4.5" stroke="#D4A017" strokeWidth="1.8" fill="none" opacity=".9"/>
    <line x1="41.5" y1="43.5" x2="44" y2="46" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" opacity=".9"/>
    {/* Cuello y solapa */}
    <path d="M18 40 Q22 38 26 42 Q30 38 34 40 Q32 48 26 50 Q20 48 18 40Z" fill="#2A2420"/>
    <path d="M22 40 L26 44 L30 40" stroke="#3A3028" strokeWidth=".8" fill="none"/>
  </svg>
)

const REXAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Fondo */}
    <circle cx="26" cy="26" r="26" fill="#1C1A16"/>
    {/* Orejas caídas */}
    <ellipse cx="13" cy="22" rx="5" ry="9" fill="#8B6914" transform="rotate(-15 13 22)"/>
    <ellipse cx="39" cy="22" rx="5" ry="9" fill="#8B6914" transform="rotate(15 39 22)"/>
    <ellipse cx="13" cy="22" rx="3" ry="6.5" fill="#C4924A" opacity=".5" transform="rotate(-15 13 22)"/>
    <ellipse cx="39" cy="22" rx="3" ry="6.5" fill="#C4924A" opacity=".5" transform="rotate(15 39 22)"/>
    {/* Cara */}
    <ellipse cx="26" cy="30" rx="12" ry="11" fill="#C4924A"/>
    {/* Hocico */}
    <ellipse cx="26" cy="35" rx="6" ry="4.5" fill="#D4A86A"/>
    {/* Ojos grandes y expresivos */}
    <ellipse cx="21" cy="27" rx="3" ry="3.2" fill="#1A1208"/>
    <ellipse cx="31" cy="27" rx="3" ry="3.2" fill="#1A1208"/>
    <circle cx="22" cy="26" r="1" fill="white" opacity=".8"/>
    <circle cx="32" cy="26" r="1" fill="white" opacity=".8"/>
    {/* Nariz */}
    <ellipse cx="26" cy="32" rx="2.5" ry="1.8" fill="#1A1208"/>
    {/* Boca */}
    <path d="M23 35 Q26 38 29 35" stroke="#8B5A2A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {/* Corbata de detective */}
    <rect x="23.5" y="39" width="5" height="8" rx="2" fill="#8B1A1A"/>
    <polygon points="26,39 23.5,42 28.5,42" fill="#C0392B"/>
    {/* Libretas */}
    <rect x="33" y="36" width="8" height="10" rx="2" fill="#2A2420" transform="rotate(10 33 36)"/>
    <line x1="34" y1="40" x2="40" y2="39" stroke="#D4A017" strokeWidth=".8" opacity=".6" transform="rotate(10 37 40)"/>
    <line x1="34" y1="42" x2="40" y2="41" stroke="#D4A017" strokeWidth=".8" opacity=".4" transform="rotate(10 37 41)"/>
  </svg>
)

const CHARACTERS = {
  vera: {
    name: 'INSPECTORA VERA CLÍO',
    Avatar: VERAAvatar,
    defaultLine: 'El caso está abierto, detective. Cada palabra es una pista. Lee con cuidado.',
  },
  rex: {
    name: 'AGENTE REX',
    Avatar: REXAvatar,
    defaultLine: '¡Oye! No te preocupes, a mí también me costó. Vuelve a revisar la evidencia.',
  },
}

// ─── CharacterBubble ────────────────────────────────────────────
// Muestra al personaje con su burbuja de diálogo.
// Props:
//   character: 'vera' | 'rex'
//   text: string — línea de diálogo (si se omite, usa defaultLine)
//   style: objeto de estilo adicional para el wrapper
export const CharacterBubble = ({ character = 'vera', text, style }) => {
  const theme = useStore(s => {
    const id = s.enrolledCourseId
    return (s.courses || []).find(c => c.id === id)?.theme || null
  })
  if (theme !== 'detective') return null

  const char = CHARACTERS[character] || CHARACTERS.vera
  const line = text || char.defaultLine

  return (
    <div className="det-character-wrap" style={style}>
      <div className="det-character-avatar">
        <char.Avatar />
      </div>
      <div className="det-character-bubble">
        <div className="det-character-name">{char.name}</div>
        <div className="det-character-text">"{line}"</div>
      </div>
    </div>
  )
}

// ─── CharacterFloat ─────────────────────────────────────────────
// Versión flotante fija en esquina inferior izquierda.
// Aparece en lessons/challenges cuando el tema es detective.
// Toca al personaje para que "hable" (toggle del bubble).
export const CharacterFloat = ({ moduleCharacterLine }) => {
  const theme = useStore(s => {
    const id = s.enrolledCourseId
    return (s.courses || []).find(c => c.id === id)?.theme || null
  })
  const [open, setOpen] = React.useState(false)
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false)

  // Auto-abrir al montar por primera vez en cada módulo
  React.useEffect(() => {
    if (theme !== 'detective') return
    const t = setTimeout(() => {
      setOpen(true)
      setHasBeenOpened(true)
    }, 800)
    return () => clearTimeout(t)
  }, [theme, moduleCharacterLine])

  // Auto-cerrar después de 6 segundos
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 6000)
    return () => clearTimeout(t)
  }, [open, moduleCharacterLine])

  if (theme !== 'detective') return null

  const line = moduleCharacterLine || CHARACTERS.vera.defaultLine

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      pointerEvents: 'none',
    }}>
      {/* Burbuja de diálogo */}
      {open && (
        <div style={{
          maxWidth: 280, background: '#1C1A16',
          border: '1px solid rgba(212,160,23,.3)',
          borderRadius: '12px 12px 12px 2px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,.8)',
          animation: 'det-reveal .35s ease both',
          pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
            color: '#D4A017', marginBottom: 4 }}>INSPECTORA VERA CLÍO</div>
          <div style={{ fontSize: 12, color: '#EDE8DC', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{line}"
          </div>
        </div>
      )}

      {/* Avatar clickeable */}
      <div
        onClick={() => { setOpen(o => !o); setHasBeenOpened(true) }}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          border: `2px solid ${open ? '#D4A017' : 'rgba(212,160,23,.4)'}`,
          background: '#1C1A16', overflow: 'hidden', cursor: 'pointer',
          boxShadow: open ? '0 0 16px rgba(212,160,23,.5)' : '0 4px 16px rgba(0,0,0,.7)',
          transition: 'all .3s ease',
          animation: 'det-idle-vera 3s ease-in-out infinite',
          pointerEvents: 'auto',
          flexShrink: 0,
        }}
        title="Vera Clío — click para escuchar"
      >
        <VERAAvatar />
      </div>

      {/* Indicador de nuevo mensaje (punto ámbar parpadeante) */}
      {!hasBeenOpened && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: '#D4A017', border: '2px solid #0A0A0F',
          animation: 'det-pulse-amber 1.5s ease-in-out infinite',
        }} />
      )}
    </div>
  )
}

export default CharacterBubble
