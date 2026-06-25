import React from 'react'

// ── Burbujas en 4 corrientes (como 4 tubos de ensayo hirviendo) ──────────────
const STREAM_CENTERS = [7, 28, 58, 88]
const BUBBLES = STREAM_CENTERS.flatMap((cx, si) =>
  Array.from({ length: 13 }, (_, i) => ({
    left:     cx + (-4 + ((i * 7 + si * 13) % 8)),
    delay:    (si * 0.7 + i * 0.45) % 8,
    duration: 4 + ((i * 3 + si) % 7),
    size:     3 + ((i * 4 + si * 2) % 12),
    opacity:  0.22 + ((i * 5 + si) % 28) / 100,
    drift1:   -8 + ((i * 11 + si * 3) % 16),
    drift2:    4 + ((i * 7  + si * 5) % 12) * (si % 2 === 0 ? -1 : 1),
  }))
)

// ── Orbes de energía flotando por toda la pantalla ───────────────────────────
const ORBS = Array.from({ length: 28 }, (_, i) => ({
  left:     (i * 31 + 5)  % 100,
  top:      (i * 37 + 15) % 100,
  delay:    ((i * 13) % 60) / 10,
  duration: 6 + ((i * 7) % 10),
  size:     2 + ((i * 3) % 4),
  color:    i % 3 === 0 ? '#7b2fff' : i % 3 === 1 ? '#00d4ff' : '#00ff88',
}))

// ── Posiciones de chispas eléctricas ─────────────────────────────────────────
const SPARKS = [
  { top: '12%', left:  '6%',  delay: 0,   dur: 7  },
  { top: '8%',  right: '8%',  delay: 2.8, dur: 5.5 },
  { top: '45%', left:  '3%',  delay: 5.2, dur: 8  },
  { top: '38%', right: '4%',  delay: 1.5, dur: 6.5 },
  { top: '72%', left:  '12%', delay: 3.7, dur: 4.8 },
  { top: '65%', right: '10%', delay: 6.1, dur: 7  },
]

// ── Átomo con 3 órbitas de electrones ────────────────────────────────────────
const AtomGroup = ({ size, opacity, style }) => {
  const cx = size / 2
  const ew  = size            // ellipse width
  const eh  = size * 0.32     // ellipse height
  const eTop = cx - eh / 2

  const orbits = [
    { rot: 0,   color: '#00ff88', dur: size / 8,  rev: false },
    { rot: 60,  color: '#00d4ff', dur: size / 6,  rev: true  },
    { rot: 120, color: '#7b2fff', dur: size / 10, rev: false },
  ]

  return (
    <div style={{ position: 'absolute', width: size, height: size, opacity, pointerEvents: 'none', ...style }}>
      {/* Núcleo brillante */}
      <div style={{
        position: 'absolute', width: 10, height: 10, borderRadius: '50%',
        top: cx - 5, left: cx - 5,
        background: 'radial-gradient(circle, #fff 0%, #00ff88 55%, transparent 100%)',
        boxShadow: '0 0 10px #00ff88, 0 0 22px rgba(0,255,136,.5)',
      }} />
      {orbits.map((o, i) => (
        /* Capa estática de rotación inicial */
        <div key={i} style={{ position: 'absolute', inset: 0, transform: `rotate(${o.rot}deg)` }}>
          {/* Div animado (orbita) */}
          <div style={{
            position: 'absolute', inset: 0,
            animation: `lab-orbit ${o.dur}s linear infinite${o.rev ? ' reverse' : ''}`,
            transformOrigin: 'center',
          }}>
            {/* Elipse de la órbita */}
            <div style={{
              position: 'absolute',
              width: ew, height: eh, top: eTop, left: 0,
              borderRadius: '50%', border: `1px solid ${o.color}`,
              opacity: 0.55,
            }} />
            {/* Electrón en el extremo izquierdo */}
            <div style={{
              position: 'absolute', width: 5, height: 5, borderRadius: '50%',
              top: cx - 2.5, left: -2.5,
              background: o.color, boxShadow: `0 0 6px ${o.color}, 0 0 14px ${o.color}55`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Rayo eléctrico (zig-zag CSS clip-path) ───────────────────────────────────
const Spark = ({ style, delay, dur }) => (
  <div style={{
    position: 'absolute', width: 3, height: 90,
    background: 'linear-gradient(to bottom, transparent 0%, #00ff88 20%, #7b2fff 60%, transparent 100%)',
    clipPath: 'polygon(40% 0%, 100% 28%, 30% 42%, 80% 60%, 10% 78%, 60% 88%, 20% 100%)',
    opacity: 0, pointerEvents: 'none',
    animation: `lab-spark ${dur}s ease-in-out ${delay}s infinite`,
    ...style,
  }} />
)

export const LabAmbient = () => {
  return (
    <div className="lab-ambient" aria-hidden="true">
      {/* Viñeta verde de laboratorio */}
      <div className="lab-amb-vignette" />

      {/* Cuadrícula holográfica */}
      <div className="lab-amb-grid" />

      {/* Rayo escáner horizontal */}
      <div className="lab-amb-scan" />

      {/* Átomos con órbitas */}
      <AtomGroup size={130} opacity={0.06} style={{ top: '6%',  left: '2%'   }} />
      <AtomGroup size={200} opacity={0.04} style={{ top: '55%', right: '1%'  }} />
      <AtomGroup size={90}  opacity={0.07} style={{ top: '25%', right: '14%' }} />
      <AtomGroup size={160} opacity={0.035} style={{ bottom: '-20px', left: '35%' }} />

      {/* Chispas eléctricas */}
      {SPARKS.map((s, i) => (
        <Spark key={i}
          style={{ top: s.top, left: s.left, right: s.right }}
          delay={s.delay} dur={s.dur}
        />
      ))}

      {/* Burbujas de 4 corrientes */}
      <div className="lab-amb-bubbles">
        {BUBBLES.map((b, i) => (
          <span key={i} className="lab-amb-bubble" style={{
            left:  `${b.left}%`,
            width:  `${b.size}px`,
            height: `${b.size}px`,
            opacity: b.opacity,
            animationDelay:    `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            '--d1': `${b.drift1}px`,
            '--d2': `${b.drift2}px`,
          }} />
        ))}
      </div>

      {/* Orbes de energía flotantes */}
      <div className="lab-amb-orbs">
        {ORBS.map((o, i) => (
          <span key={i} className="lab-amb-orb" style={{
            left:  `${o.left}%`,
            top:   `${o.top}%`,
            width:  `${o.size}px`,
            height: `${o.size}px`,
            background: o.color,
            boxShadow: `0 0 ${o.size * 3}px ${o.color}`,
            animationDelay:    `${o.delay}s`,
            animationDuration: `${o.duration}s`,
          }} />
        ))}
      </div>

      {/* Partícula de humo/vapor en la base */}
      <div className="lab-amb-vapor" />
    </div>
  )
}

export default LabAmbient
