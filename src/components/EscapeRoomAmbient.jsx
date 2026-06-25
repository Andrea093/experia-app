import React from 'react'

// Embers que suben (al revés que la lluvia detective)
const EMBERS = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 23 + (i * i * 11) % 100) % 100,
  delay: ((i * 17) % 60) / 10,
  duration: 3 + ((i * 7) % 9),
  size: 2 + ((i * 3) % 4),
  drift: -15 + ((i * 13) % 30),
}))

// Engranajes matemáticos de fondo
const GEARS = [
  { size: 260, top: -80, right: -60, duration: 90, opacity: 0.035, reverse: false },
  { size: 140, bottom: 40, left: -30, duration: 55, opacity: 0.045, reverse: true },
  { size: 100, top: '38%', right: '8%', duration: 70, opacity: 0.035, reverse: false },
  { size: 190, bottom: -90, right: '25%', duration: 100, opacity: 0.03, reverse: true },
  { size: 80, top: '15%', left: '12%', duration: 45, opacity: 0.04, reverse: false },
]

const GearSVG = ({ size, opacity, duration, reverse, top, right, bottom, left }) => {
  const c = size / 2
  const teeth = 10
  const outerR = c * 0.9
  const innerR = c * 0.62
  const holeR  = c * 0.24
  const toothW = c * 0.19

  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true"
      style={{
        position: 'absolute', width: size, height: size, opacity,
        pointerEvents: 'none',
        animation: `er-gear-spin ${duration}s linear infinite${reverse ? ' reverse' : ''}`,
        top, right, bottom, left,
      }}>
      {Array.from({ length: teeth }, (_, i) => (
        <rect key={i}
          x={c - toothW / 2} y={c - outerR}
          width={toothW} height={outerR - innerR + 6}
          rx={3} fill="#f0a500"
          transform={`rotate(${(i / teeth) * 360} ${c} ${c})`}
        />
      ))}
      <circle cx={c} cy={c} r={innerR} fill="#f0a500" />
      <circle cx={c} cy={c} r={holeR} fill="#080e08" />
    </svg>
  )
}

export const EscapeRoomAmbient = () => {
  return (
    <div className="er-ambient" aria-hidden="true">
      {/* Viñeta de mazmorra */}
      <div className="er-amb-vignette" />

      {/* Brillos de antorcha en las esquinas */}
      <div className="er-amb-torch er-amb-torch-tl" />
      <div className="er-amb-torch er-amb-torch-tr" />
      <div className="er-amb-torch er-amb-torch-bl" />
      <div className="er-amb-torch er-amb-torch-br" />

      {/* Brasas que suben */}
      <div className="er-amb-embers">
        {EMBERS.map((e, i) => (
          <span key={i} className="er-amb-ember" style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size * 1.8}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            '--drift': `${e.drift}px`,
          }} />
        ))}
      </div>

      {/* Neblina en el piso */}
      <div className="er-amb-fog" />
      <div className="er-amb-fog er-amb-fog-2" />

      {/* Engranajes matemáticos */}
      <div className="er-amb-gears">
        {GEARS.map((g, i) => <GearSVG key={i} {...g} />)}
      </div>

      {/* Líneas de escaneo (cámara de seguridad) */}
      <div className="er-amb-scan" />

      {/* Parpadeo de luz general */}
      <div className="er-amb-flicker" />
    </div>
  )
}

export default EscapeRoomAmbient
