import React from 'react'
import { useStore } from '../store/store.jsx'
import { LiveQuestionView } from './LiveQuestionView.jsx'
import { LessonBody } from '../pages/lesson.jsx'

// Envoltorio de layout de la vista guiada (ocupa toda la pantalla, sin
// sidebar/header — el profesor controla el avance, el estudiante no navega).
const Shell = ({ children }) => (
  <div style={{ minHeight: '100vh', overflow: 'auto', background: 'var(--bg)' }}>
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>{children}</div>
  </div>
)

const LiveBadge = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20,
    background: 'var(--orange-bg)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
    <span style={{ animation: 'glow 2s ease infinite' }}>🔴</span> Clase en vivo — tu profesor controla el avance
  </div>
)

// Vista de la Clase en Vivo Guiada para el estudiante: reemplaza por completo
// la navegación normal (map/lesson/challenge) mientras está unido a una sesión
// activa. Renderiza el mismo módulo que ve el profesor en cada momento.
const GuidedClassView = ({ guided }) => {
  const { session, participant } = guided
  const courseModules = useStore(s => s.courseModules) || []
  const currentMod = courseModules.find(m => m.id === session?.module_id)

  if (!session || !participant) return null

  // Sesión finalizada: LiveQuestionView muestra el podio con confeti; app.jsx
  // detecta status==='ended' y saca al estudiante de vuelta al mapa normal.
  if (session.status === 'ended') {
    return <LiveQuestionView participant={participant} Wrap={Shell} />
  }

  // Módulo interactivo (quiz o encuesta en vivo): reusa el ciclo ya construido.
  if (currentMod?.type === 'challenge' && (currentMod.ctype === 'quiz' || currentMod.ctype === 'poll')) {
    return <LiveQuestionView participant={participant} Wrap={Shell} />
  }

  // Lección de lectura: mismo contenido que ve el profesor, en modo solo-lectura.
  if (currentMod?.type === 'lesson') {
    return (
      <Shell>
        <LiveBadge />
        <LessonBody mod={currentMod} />
      </Shell>
    );
  }

  // Cualquier otro caso (aún sin módulo asignado, entrega final, u otro tipo
  // de reto no sincrónico): pantalla de espera — el profesor sigue en un
  // momento; este contenido no requiere participación en vivo.
  return (
    <Shell>
      <LiveBadge />
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>
          {currentMod?.title || 'Esperando a que tu profesor comience'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
          {currentMod ? 'Este contenido no es sincrónico — tu profesor continuará en un momento.' : 'Un momento, tu profesor está iniciando la clase…'}
        </p>
      </div>
    </Shell>
  );
}

export default GuidedClassView
