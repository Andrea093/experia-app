import React from 'react'
import { useStore } from '../store/store.jsx'

// ── 90 estrellas titilando en el espacio ─────────────────────────────────────
const STARS = Array.from({ length: 90 }, (_, i) => ({
  left:     (i * 17 + (i * i * 7)  % 100) % 100,
  top:      (i * 23 + (i * i * 11) % 100) % 100,
  size:     0.8 + ((i * 3) % 3),
  delay:    ((i * 11) % 60) / 10,
  duration: 2 + ((i * 7) % 5),
  color:    i % 4 === 0 ? '#c9a227' : i % 4 === 1 ? '#5b8dd9' : i % 4 === 2 ? '#a855f7' : '#e8dcc8',
}))

// ── Partículas cósmicas orbitando ────────────────────────────────────────────
const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  left:     (i * 29 + 7)  % 100,
  top:      (i * 37 + 13) % 100,
  delay:    ((i * 13) % 70) / 10,
  duration: 8 + ((i * 7) % 10),
  size:     1.5 + ((i * 2) % 3),
  color:    i % 3 === 0 ? 'rgba(201,162,39,.7)' : i % 3 === 1 ? 'rgba(91,141,217,.7)' : 'rgba(168,85,247,.6)',
}))

// ── Grietas temporales (destellos diagonales) ─────────────────────────────────
const RIFTS = [
  { top: '12%', left:  '8%',  angle: -38, delay: 0,   dur: 9   },
  { top: '20%', right: '6%',  angle:  28, delay: 3.8, dur: 7   },
  { top: '55%', left:  '3%',  angle: -52, delay: 6.5, dur: 8   },
  { top: '42%', right: '5%',  angle:  35, delay: 2.1, dur: 10  },
  { top: '78%', left:  '18%', angle: -22, delay: 5.0, dur: 7.5 },
  { top: '68%', right: '14%', angle:  48, delay: 1.3, dur: 9   },
]

// ── Portales de gusano ───────────────────────────────────────────────────────
const PORTALS = [
  { top: '3%',   right: '3%',  size: 220, dur: 6  },
  { bottom: '3%', left: '1%', size: 160, dur: 8  },
  { top: '38%',  left: '48%', size:  90, dur: 10 },
]

// ── Relojes flotantes ────────────────────────────────────────────────────────
const CLOCKS = [
  { top: '8%',  left: '6%',   size: 100, op: 0.10, hSpd: 60,  mSpd: 10,  sSpd: 1   },
  { top: '60%', right: '8%',  size: 140, op: 0.07, hSpd: 42,  mSpd: 7,   sSpd: 0.7 },
  { top: '30%', right: '18%', size:  72, op: 0.12, hSpd: 80,  mSpd: 13,  sSpd: 1.3 },
  { bottom:'10%',left: '30%', size:  56, op: 0.09, hSpd: 50,  mSpd: 8.5, sSpd: 0.9 },
]

// ── Componente: Portal de Gusano ─────────────────────────────────────────────
const WormholePortal = ({ top, right, bottom, left, size, dur }) => (
  <div style={{
    position: 'absolute', width: size, height: size,
    top, right, bottom, left, pointerEvents: 'none',
  }}>
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '1px solid rgba(91,141,217,.55)',
        opacity: 0,
        animation: `tt-portal-ring ${dur}s ease-out ${i * (dur / 5)}s infinite`,
      }} />
    ))}
    {/* Núcleo del portal */}
    <div style={{
      position: 'absolute', inset: '28%', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(91,141,217,.18) 0%, rgba(168,85,247,.08) 60%, transparent 100%)',
      animation: `tt-portal-core ${dur * 0.6}s ease-in-out infinite`,
    }} />
  </div>
)

// ── Componente: Reloj Flotante ────────────────────────────────────────────────
const ClockFace = ({ top, right, bottom, left, size, op, hSpd, mSpd, sSpd }) => {
  const r = size / 2
  const hand = (height, color, speed, width = 1.5) => ({
    position: 'absolute',
    width, height,
    background: color,
    left: r - width / 2,
    top: r - height,
    transformOrigin: '50% 100%',
    borderRadius: width,
    animation: `tt-clock-rot ${speed}s linear infinite`,
  })
  return (
    <div style={{
      position: 'absolute', width: size, height: size,
      top, right, bottom, left, opacity: op, pointerEvents: 'none',
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(201,162,39,.35)' }} />
      <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', border: '.5px solid rgba(201,162,39,.15)' }} />
      {/* Hora */}
      <div style={hand(r * 0.52, 'rgba(201,162,39,.75)', hSpd, 2)} />
      {/* Minutos */}
      <div style={hand(r * 0.70, 'rgba(91,141,217,.7)',  mSpd, 1.5)} />
      {/* Segundos */}
      <div style={hand(r * 0.82, 'rgba(168,85,247,.75)', sSpd, 1)} />
      {/* Centro */}
      <div style={{
        position: 'absolute', width: 5, height: 5, borderRadius: '50%',
        top: r - 2.5, left: r - 2.5,
        background: '#c9a227', boxShadow: '0 0 6px #c9a227',
      }} />
    </div>
  )
}

// ── Componente: Grieta Temporal ──────────────────────────────────────────────
const TemporalRift = ({ top, right, left, bottom, angle, delay, dur }) => (
  <div style={{ position: 'absolute', top, right, left, bottom, transform: `rotate(${angle}deg)`, pointerEvents: 'none' }}>
    <div style={{
      width: 260, height: 2,
      background: 'linear-gradient(to right, transparent 0%, #5b8dd9 25%, #c9a227 60%, #a855f7 85%, transparent 100%)',
      boxShadow: '0 0 10px rgba(91,141,217,.55), 0 0 20px rgba(201,162,39,.25)',
      opacity: 0,
      animation: `tt-rift ${dur}s ease-in-out ${delay}s infinite`,
    }} />
  </div>
)

export const TimeTravelAmbient = () => {
  const theme = useStore(s => {
    const id = s.enrolledCourseId
    return (s.courses || []).find(c => c.id === id)?.theme || null
  })
  if (theme !== 'time-travel') return null

  return (
    <div className="tt-ambient" aria-hidden="true">
      {/* Viñeta cósmica */}
      <div className="tt-amb-vignette" />

      {/* Nebulosas de fondo */}
      <div className="tt-amb-nebula tt-amb-nebula-1" />
      <div className="tt-amb-nebula tt-amb-nebula-2" />
      <div className="tt-amb-nebula tt-amb-nebula-3" />

      {/* Campo de estrellas */}
      <div className="tt-amb-stars">
        {STARS.map((s, i) => (
          <span key={i} className="tt-amb-star" style={{
            left:  `${s.left}%`,
            top:   `${s.top}%`,
            width:  `${s.size}px`,
            height: `${s.size}px`,
            background: s.color,
            animationDelay:    `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }} />
        ))}
      </div>

      {/* Portales de gusano */}
      {PORTALS.map((p, i) => <WormholePortal key={i} {...p} />)}

      {/* Relojes flotantes */}
      {CLOCKS.map((c, i) => <ClockFace key={i} {...c} />)}

      {/* Grietas temporales */}
      {RIFTS.map((r, i) => <TemporalRift key={i} {...r} />)}

      {/* Partículas cósmicas */}
      <div className="tt-amb-particles">
        {PARTICLES.map((p, i) => (
          <span key={i} className="tt-amb-particle" style={{
            left:  `${p.left}%`,
            top:   `${p.top}%`,
            width:  `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>

      {/* Línea de horizonte temporal */}
      <div className="tt-amb-horizon" />
    </div>
  )
}

export default TimeTravelAmbient
