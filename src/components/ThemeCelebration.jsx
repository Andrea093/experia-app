import React from 'react'

// ============================================================
// ThemeCelebration — Celebración épica a pantalla completa al
// completar un módulo. Cada tema tiene su propia explosión visual.
// Se monta ~2.4s y luego llama onDone. No bloquea clics.
// ============================================================

const THEMES = {
  detective: {
    emblem: '🔍',
    banner: 'CASO RESUELTO',
    sub: 'Evidencia confirmada',
    colors: ['#f0a500', '#ffd45e', '#d8ccaa', '#ffffff'],
    ring: 'rgba(240,165,0,.55)',
    bannerBg: '#f0a500',
    bannerText: '#0a0a0f',
    subColor: 'rgba(240,165,0,.85)',
    shape: 'rect',
    flash: true,
  },
  'escape-room': {
    emblem: '🔓',
    banner: '¡PUERTA ABIERTA!',
    sub: 'Acertijo descifrado',
    colors: ['#f0a500', '#00c853', '#ffd45e', '#ffffff'],
    ring: 'rgba(240,165,0,.6)',
    bannerBg: '#f0a500',
    bannerText: '#080e08',
    subColor: 'rgba(0,200,83,.9)',
    shape: 'spark',
    flash: false,
  },
  lab: {
    emblem: '⚗️',
    banner: '¡EXPERIMENTO LOGRADO!',
    sub: 'Reacción estable',
    colors: ['#00ff88', '#00d4ff', '#7b2fff', '#ffffff'],
    ring: 'rgba(0,255,136,.55)',
    bannerBg: 'linear-gradient(135deg,#00c853,#00ff88)',
    bannerText: '#04140e',
    subColor: 'rgba(0,212,255,.9)',
    shape: 'bubble',
    flash: false,
  },
  'time-travel': {
    emblem: '⏳',
    banner: '¡ÉPOCA DESBLOQUEADA!',
    sub: 'Salto temporal completado',
    colors: ['#c9a227', '#5b8dd9', '#a855f7', '#e8dcc8'],
    ring: 'rgba(91,141,217,.6)',
    bannerBg: 'linear-gradient(135deg,#9a7808,#c9a227)',
    bannerText: '#030510',
    subColor: 'rgba(168,85,247,.9)',
    shape: 'star',
    flash: false,
  },
}

// Genera N partículas con trayectoria radial estable por montaje
const makeParticles = (n, colors) =>
  Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * 360 + (i * 37) % 25
    const dist = 130 + ((i * 53) % 190)
    const rad = (angle * Math.PI) / 180
    return {
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      color: colors[i % colors.length],
      size: 7 + ((i * 5) % 12),
      delay: ((i * 17) % 30) / 100,
      dur: 0.9 + ((i * 7) % 8) / 10,
      rot: (i * 47) % 360,
    }
  })

const ParticleShape = ({ shape, p }) => {
  const base = {
    position: 'absolute', left: '50%', top: '50%',
    width: p.size, height: p.size, color: p.color,
    '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--rot': `${p.rot}deg`,
    animation: `cel-particle 1.5s cubic-bezier(.15,.7,.3,1) ${p.delay}s both`,
  }
  if (shape === 'bubble') {
    return <span style={{ ...base, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, #fff, ${p.color} 60%, transparent)`,
      boxShadow: `0 0 ${p.size}px ${p.color}` }} />
  }
  if (shape === 'star') {
    return <span style={{ ...base, background: p.color,
      clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
      boxShadow: `0 0 ${p.size}px ${p.color}` }} />
  }
  if (shape === 'spark') {
    return <span style={{ ...base, borderRadius: 2,
      width: 3, height: p.size * 1.6, background: `linear-gradient(${p.color}, transparent)`,
      boxShadow: `0 0 ${p.size}px ${p.color}` }} />
  }
  // rect (detective) — pedacitos de papel/evidencia
  return <span style={{ ...base, borderRadius: 2, background: p.color,
    boxShadow: `0 0 ${p.size / 2}px ${p.color}88` }} />
}

export const ThemeCelebration = ({ theme, onDone }) => {
  const cfg = THEMES[theme]
  const particles = React.useState(() => makeParticles(28, cfg ? cfg.colors : ['#E8732C']))[0]

  React.useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])

  if (!cfg) return null

  return (
    <div className="cel-root" aria-hidden="true">
      {/* Backdrop oscuro radial */}
      <div className="cel-backdrop" />

      {/* Destellos blancos (solo detective: flashes de cámara) */}
      {cfg.flash && <div className="cel-flash" />}

      {/* Onda expansiva */}
      <div className="cel-ring" style={{ borderColor: cfg.ring }} />
      <div className="cel-ring cel-ring-2" style={{ borderColor: cfg.ring }} />

      {/* Halo de luz */}
      <div className="cel-halo" style={{
        background: `radial-gradient(circle, ${cfg.ring} 0%, transparent 65%)`,
      }} />

      {/* Partículas radiales */}
      <div className="cel-burst">
        {particles.map((p, i) => <ParticleShape key={i} shape={cfg.shape} p={p} />)}
      </div>

      {/* Emblema central */}
      <div className="cel-center">
        <div className="cel-emblem">{cfg.emblem}</div>
        <div className="cel-banner" style={{
          background: cfg.bannerBg, color: cfg.bannerText,
        }}>{cfg.banner}</div>
        <div className="cel-sub" style={{ color: cfg.subColor }}>{cfg.sub}</div>
      </div>
    </div>
  )
}

export default ThemeCelebration
