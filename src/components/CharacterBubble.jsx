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

// ─── Prof. Axioma — guía del Escape Room Matemático ────────────────────────
const PROFAxiomaAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    {/* Fondo oscuro de mazmorra */}
    <circle cx="26" cy="26" r="26" fill="#0d150d"/>
    {/* Pelaje salvaje hacia arriba */}
    <path d="M15 20 C14 11 18 5 21 7 C21 13 20 17 19 19" fill="#2d3a10"/>
    <path d="M37 20 C38 11 34 5 31 7 C31 13 32 17 33 19" fill="#2d3a10"/>
    <path d="M21 9 C24 4 28 4 31 9" fill="#3a4a12"/>
    <path d="M17 15 C19 8 22 5 24 7" fill="#3a4a12"/>
    <path d="M35 15 C33 8 30 5 28 7" fill="#3a4a12"/>
    {/* Cabeza */}
    <ellipse cx="26" cy="30" rx="10" ry="11" fill="#c89060"/>
    {/* Frente / raíz del cabello */}
    <ellipse cx="26" cy="20.5" rx="10" ry="5.5" fill="#2d3a10"/>
    {/* Gafas redondas amber */}
    <circle cx="21.5" cy="28.5" r="4" stroke="#f0a500" strokeWidth="1.5" fill="rgba(240,165,0,.06)"/>
    <circle cx="30.5" cy="28.5" r="4" stroke="#f0a500" strokeWidth="1.5" fill="rgba(240,165,0,.06)"/>
    <line x1="25.5" y1="28.5" x2="26.5" y2="28.5" stroke="#f0a500" strokeWidth="1.1"/>
    <line x1="17.5" y1="27.5" x2="15.5" y2="26.5" stroke="#f0a500" strokeWidth="1.1"/>
    <line x1="34.5" y1="27.5" x2="36.5" y2="26.5" stroke="#f0a500" strokeWidth="1.1"/>
    {/* Ojos */}
    <circle cx="21.5" cy="28.5" r="1.8" fill="#1a0a05"/>
    <circle cx="30.5" cy="28.5" r="1.8" fill="#1a0a05"/>
    <circle cx="22" cy="28" r=".55" fill="white" opacity=".8"/>
    <circle cx="31" cy="28" r=".55" fill="white" opacity=".8"/>
    {/* Nariz */}
    <ellipse cx="26" cy="32" rx="1.1" ry=".75" fill="#a07050" opacity=".5"/>
    {/* Sonrisa entusiasta */}
    <path d="M21.5 35.5 Q26 39.5 30.5 35.5" stroke="#a07050" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    {/* Moñito amber */}
    <polygon points="22.5,40 26,43 22.5,46" fill="#c0a000"/>
    <polygon points="29.5,40 26,43 29.5,46" fill="#c0a000"/>
    <circle cx="26" cy="43" r="2" fill="#f0a500"/>
    {/* Llave — prop del escape room */}
    <circle cx="40" cy="37.5" r="3.5" stroke="#f0a500" strokeWidth="1.5" fill="none" opacity=".85"/>
    <line x1="43" y1="37.5" x2="48" y2="37.5" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
    <line x1="46" y1="37.5" x2="46" y2="40" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
    <line x1="48" y1="37.5" x2="48" y2="40" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
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

const ESCAPE_CHARACTERS = {
  prof: {
    name: 'PROF. AXIOMA',
    Avatar: PROFAxiomaAvatar,
    defaultLine: '¡Resuelve el acertijo y la puerta se abrira! Cada concepto es una clave.',
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
// Soporta temas 'detective' (Vera Clío) y 'escape-room' (Prof. Axioma).
export const CharacterFloat = ({ moduleCharacterLine }) => {
  const theme = useStore(s => {
    const id = s.enrolledCourseId
    return (s.courses || []).find(c => c.id === id)?.theme || null
  })
  const [open, setOpen] = React.useState(false)
  const [hasBeenOpened, setHasBeenOpened] = React.useState(false)

  const isDetective  = theme === 'detective'
  const isEscapeRoom = theme === 'escape-room'
  const isActive     = isDetective || isEscapeRoom

  React.useEffect(() => {
    if (!isActive) return
    const t = setTimeout(() => { setOpen(true); setHasBeenOpened(true) }, 800)
    return () => clearTimeout(t)
  }, [theme, moduleCharacterLine, isActive])

  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setOpen(false), 6000)
    return () => clearTimeout(t)
  }, [open, moduleCharacterLine])

  if (!isActive) return null

  // Config según tema
  const config = isEscapeRoom
    ? {
        char: ESCAPE_CHARACTERS.prof,
        bgCard: 'rgba(10,18,10,.96)',
        borderCard: 'rgba(240,165,0,.3)',
        nameColor: '#f0a500',
        textColor: '#d8ccaa',
        bgAvatar: '#0d150d',
        borderAvatar: open ? '#f0a500' : 'rgba(240,165,0,.4)',
        shadowAvatar: open ? '0 0 16px rgba(240,165,0,.5)' : '0 4px 16px rgba(0,0,0,.7)',
        animAvatar: 'er-idle-prof 3.5s ease-in-out infinite',
        dotBg: '#f0a500',
        dotBorder: '#080e08',
        dotAnim: 'er-pulse-amber 1.5s ease-in-out infinite',
        revealAnim: 'er-reveal .35s ease both',
        bgBubbleBorder: '#080e08',
      }
    : {
        char: CHARACTERS.vera,
        bgCard: '#1C1A16',
        borderCard: 'rgba(212,160,23,.3)',
        nameColor: '#D4A017',
        textColor: '#EDE8DC',
        bgAvatar: '#1C1A16',
        borderAvatar: open ? '#D4A017' : 'rgba(212,160,23,.4)',
        shadowAvatar: open ? '0 0 16px rgba(212,160,23,.5)' : '0 4px 16px rgba(0,0,0,.7)',
        animAvatar: 'det-idle-vera 3s ease-in-out infinite',
        dotBg: '#D4A017',
        dotBorder: '#0A0A0F',
        dotAnim: 'det-pulse-amber 1.5s ease-in-out infinite',
        revealAnim: 'det-reveal .35s ease both',
        bgBubbleBorder: '#0A0A0F',
      }

  const { char } = config
  const line = moduleCharacterLine || char.defaultLine

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 16, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
      pointerEvents: 'none',
    }}>
      {open && (
        <div style={{
          maxWidth: 280, background: config.bgCard,
          border: `1px solid ${config.borderCard}`,
          borderRadius: '12px 12px 12px 2px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,.8)',
          animation: config.revealAnim,
          pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
            color: config.nameColor, marginBottom: 4 }}>{char.name}</div>
          <div style={{ fontSize: 12, color: config.textColor, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{line}"
          </div>
        </div>
      )}

      <div
        onClick={() => { setOpen(o => !o); setHasBeenOpened(true) }}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          border: `2px solid ${config.borderAvatar}`,
          background: config.bgAvatar, overflow: 'hidden', cursor: 'pointer',
          boxShadow: config.shadowAvatar,
          transition: 'all .3s ease',
          animation: config.animAvatar,
          pointerEvents: 'auto', flexShrink: 0,
        }}
        title={`${char.name} — clic para escuchar`}
      >
        <char.Avatar />
      </div>

      {!hasBeenOpened && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: config.dotBg, border: `2px solid ${config.bgBubbleBorder}`,
          animation: config.dotAnim,
        }} />
      )}
    </div>
  )
}

export default CharacterBubble
