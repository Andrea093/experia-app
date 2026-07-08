import React from 'react'
import { useStore, nav, findModule, markOnboarded, claimOnboardingBonus } from '../store/store.jsx'
import { Modal, Btn, CheckIc, ZapIc, UserIc, BookIc } from './ui.jsx'
// =============================================
// EXPERIA — Onboarding
// 1) OnboardingModal: bienvenida en 3 pasos (primer ingreso del estudiante)
// 2) FirstStepsCard: checklist "Primeros pasos" con bonus de +50 XP
// =============================================

const STEPS = [
  {
    icon: '🧭',
    title: '¡Bienvenido a Experia!',
    text: 'Tu plataforma de formación docente. Aquí no tomas un curso tradicional: recorres un mapa de aprendizaje con lecciones, retos interactivos y actividades prácticas, en cursos cortos y rutas de formación pensadas para tu práctica en el aula.',
    bullets: ['Avanza a tu ritmo, módulo a módulo', 'Cada módulo desbloquea el siguiente', 'Tu progreso se guarda automáticamente'],
  },
  {
    icon: '⚡',
    title: 'Gana XP, sube de nivel',
    text: 'Cada lección y reto completado suma puntos de experiencia (XP). Acumula XP para subir de nivel y desbloquea insignias por tus logros.',
    bullets: ['XP por cada lección y reto', 'Insignias coleccionables por hitos', 'Certificado al completar tu ruta'],
  },
  {
    icon: '✅',
    title: 'Tus primeros pasos',
    text: 'Completa este checklist inicial y gana un bonus de +50 XP. Lo encontrarás en tu mapa de aprendizaje:',
    bullets: ['Sube tu foto de perfil', 'Termina tu primera lección', 'Supera tu primer reto'],
  },
]

const OnboardingModal = () => {
  const [step, setStep] = React.useState(0)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <Modal open onClose={markOnboarded} width={520}>
      <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
        {/* Ícono del paso */}
        <div key={step} style={{ width: 84, height: 84, borderRadius: 24, margin: '0 auto 20px',
          background: 'var(--gradient-soft)', border: '1px solid rgba(232,115,44,.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
          animation: 'badgePop .45s var(--ease-spring)' }}>
          {s.icon}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{s.title}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 18px' }}>
          {s.text}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 330, margin: '0 auto 24px' }}>
          {s.bullets.map((b, i) => (
            <div key={`${step}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              padding: '9px 14px', borderRadius: 10, background: 'var(--bg)',
              animation: `fadeUp .4s ${120 + i * 90}ms var(--ease-out) both` }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIc s={11} c="#fff" />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Indicador de pasos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 22 }}>
          {STEPS.map((_, i) => (
            <span key={i} onClick={() => setStep(i)} style={{ height: 7, borderRadius: 'var(--r-full)',
              width: i === step ? 26 : 7, cursor: 'pointer',
              background: i === step ? 'var(--gradient-orange)' : 'var(--border)',
              transition: 'width .3s var(--ease-out), background .3s' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0
            ? <Btn variant="secondary" onClick={() => setStep(p => p - 1)}>Atrás</Btn>
            : <Btn variant="ghost" onClick={markOnboarded}>Saltar</Btn>}
          {last
            ? <Btn onClick={markOnboarded}>¡Comenzar mi ruta! 🚀</Btn>
            : <Btn onClick={() => setStep(p => p + 1)}>Siguiente</Btn>}
        </div>
      </div>
    </Modal>
  )
}

// --- Checklist "Primeros pasos" (se muestra en el mapa hasta reclamar el bonus) ---
const FirstStepsCard = ({ modules = [] }) => {
  const user = useStore(st => st.user)
  const completed = useStore(st => st.completed)
  if (!user || user.role !== 'student' || user.onboardingBonus) return null

  const typeOf = (id) => (modules.find(m => m.id === id) || findModule(id))?.type
  const steps = [
    { id: 'photo', label: 'Sube tu foto de perfil', icon: <UserIc s={15} />, done: !!user.avatar?.startsWith('http'),
      action: () => nav('profile') },
    { id: 'lesson', label: 'Termina tu primera lección', icon: <BookIc s={15} />, done: completed.some(id => typeOf(id) === 'lesson') },
    { id: 'challenge', label: 'Supera tu primer reto', icon: <ZapIc s={15} />, done: completed.some(id => typeOf(id) === 'challenge') },
  ]
  const doneCount = steps.filter(st => st.done).length
  const allDone = doneCount === steps.length

  return (
    <div style={{ background: 'var(--white)', borderRadius: 16, padding: '18px 20px',
      border: allDone ? '1.5px solid var(--success)' : '1px solid var(--border)',
      boxShadow: 'var(--sh-sm)', animation: 'fadeUp .45s var(--ease-out)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚀</span>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--dark)' }}>Primeros pasos</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 'var(--r-full)',
            background: allDone ? 'var(--success-bg-strong)' : 'var(--orange-bg)',
            color: allDone ? 'var(--success)' : 'var(--orange)' }}>
            {doneCount}/{steps.length}
          </span>
        </div>
        {allDone
          ? <Btn size="sm" onClick={claimOnboardingBonus} style={{ animation: 'glow 2s ease infinite' }}>
              <ZapIc s={14} /> Reclamar +50 XP
            </Btn>
          : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Bonus: <strong style={{ color: 'var(--orange)' }}>+50 XP</strong></span>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {steps.map(st => (
          <button key={st.id} onClick={st.action || undefined} disabled={st.done || !st.action}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 10,
              border: '1px solid', cursor: st.action && !st.done ? 'pointer' : 'default',
              borderColor: st.done ? 'var(--success-bg-strong)' : 'var(--border)',
              background: st.done ? 'var(--success-bg)' : 'var(--bg)',
              color: st.done ? 'var(--success)' : 'var(--text-sec)',
              fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font)', minHeight: 36,
              textDecoration: st.done ? 'line-through' : 'none', transition: 'all .2s' }}>
            {st.done ? <CheckIc s={14} c="var(--success)" /> : st.icon}
            {st.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { OnboardingModal, FirstStepsCard }
