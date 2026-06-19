import React from 'react'
import { useStore } from '../store/store.jsx'

// Capa ambiental inmersiva del tema Detective.
// Solo se monta cuando el curso activo tiene theme='detective'.
// Renderiza efectos de movimiento sobre toda la pantalla (sin bloquear clics).

// Genera N gotas de lluvia con posiciones y tiempos aleatorios pero estables
const RAIN_DROPS = Array.from({ length: 60 }, (_, i) => ({
  left: (i * 17 + (i * i * 7) % 100) % 100,        // distribución pseudo-aleatoria
  delay: ((i * 13) % 40) / 10,                      // 0–4s
  duration: 0.6 + ((i * 7) % 10) / 10,              // 0.6–1.6s
  height: 40 + ((i * 11) % 60),                     // 40–100px
  opacity: 0.08 + ((i * 5) % 20) / 100,             // 0.08–0.28
}))

// Partículas de polvo flotando en el haz de luz
const DUST = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 23 + 7) % 100,
  top: (i * 31 + 11) % 100,
  delay: ((i * 19) % 80) / 10,
  duration: 8 + ((i * 7) % 12),
  size: 2 + ((i * 3) % 4),
}))

export const DetectiveAmbient = () => {
  const theme = useStore(s => {
    const id = s.enrolledCourseId
    return (s.courses || []).find(c => c.id === id)?.theme || null
  })
  if (theme !== 'detective') return null

  return (
    <div className="det-ambient" aria-hidden="true">
      {/* Viñeta con parpadeo de lámpara */}
      <div className="det-amb-vignette" />

      {/* Linterna que recorre la pantalla */}
      <div className="det-amb-searchlight" />

      {/* Lluvia */}
      <div className="det-amb-rain">
        {RAIN_DROPS.map((d, i) => (
          <span key={i} className="det-amb-drop" style={{
            left: `${d.left}%`,
            height: `${d.height}px`,
            opacity: d.opacity,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }} />
        ))}
      </div>

      {/* Polvo flotante */}
      <div className="det-amb-dust">
        {DUST.map((p, i) => (
          <span key={i} className="det-amb-mote" style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
        ))}
      </div>

      {/* Haz de escaneo horizontal */}
      <div className="det-amb-scan" />

      {/* Grano de película */}
      <div className="det-amb-grain" />
    </div>
  )
}

export default DetectiveAmbient
