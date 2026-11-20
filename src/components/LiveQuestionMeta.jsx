import React from 'react'
import { evidenceInfo } from '../lib/saberGuide.js'
import { DIFFICULTY } from '../lib/questionBankMeta.js'
import { tipForCompetencia } from '../lib/strategyTips.js'
import TOPICS from '../lib/questionTopics.json'
// =============================================
// EXPERIA — Qué evalúa la pregunta en la Clase en Vivo (nov 2026)
// Competencia · tema · dificultad, para el estudiante y el profesor, y el tip
// de estrategia que ve SOLO el profesor al mostrar la respuesta.
// Va en su propio chunk (lazy en la vista del estudiante) porque arrastra la
// guía Saber: la página pública del PIN no lo descarga.
//
// - Competencia: sale de la `evidencia` de la pregunta + el área de la ronda.
// - Tema: del mapa generado por scripts/build-temas.mjs (no todas lo tienen).
// - Dificultad: la del banco. ⚠️ Provisional salvo Ciencias Sociales (§14).
// =============================================

export const liveQuestionMeta = (area, q) => {
  const info = area && q?.evidencia ? evidenceInfo(area, q.evidencia) : null
  return {
    competencia: info?.competencia || null,
    afirmacion: info?.afirmacion || null,
    tema: (q?.id && TOPICS[q.id]) || '',
    dificultad: DIFFICULTY[q?.difficulty] || null,
  }
}

const chip = (dark) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
  lineHeight: 1.35, maxWidth: '100%', background: dark ? 'rgba(255,255,255,.12)' : 'var(--bg)',
  color: dark ? '#fff' : 'var(--text-sec)', border: dark ? '1px solid rgba(255,255,255,.18)' : '1px solid var(--border)',
})

// `dark`: escenario oscuro de la presentación del profesor.
export const QuestionMetaChips = ({ area, question, dark = false, style }) => {
  const m = liveQuestionMeta(area, question)
  if (!m.competencia && !m.tema && !m.dificultad) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, ...style }}>
      {m.competencia && <span style={chip(dark)} title={m.afirmacion ? `Afirmación ${m.afirmacion.n}: ${m.afirmacion.text}` : undefined}>🎯 <span style={{ opacity: .75 }}>Competencia:</span> {m.competencia.label}</span>}
      {m.tema && <span style={chip(dark)}>📚 <span style={{ opacity: .75 }}>Tema:</span> {m.tema}</span>}
      {m.dificultad && (
        <span style={{ ...chip(dark), background: m.dificultad.bg, color: m.dificultad.fg, border: 'none' }}>
          📶 Dificultad: {m.dificultad.label}
        </span>
      )}
    </div>
  )
}

// Tip de estrategia para el profesor al revelar la respuesta.
export const StrategyTip = ({ area, question, dark = false, compact = false }) => {
  const m = liveQuestionMeta(area, question)
  const tip = tipForCompetencia(m.competencia?.id)
  return (
    <div style={{ marginTop: 14, padding: compact ? '10px 14px' : '14px 18px', borderRadius: 14,
      background: dark ? '#FFF7ED' : 'var(--orange-bg)', color: '#1A1A2E', borderLeft: '6px solid #EC671A',
      animation: 'fadeUp .4s ease both' }}>
      <div style={{ fontSize: compact ? 11 : 12.5, fontWeight: 900, color: '#C2410C', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        🧭 Tip para el profesor · {tip.title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4,
        fontSize: compact ? 13.5 : 'clamp(14px, 1.3vw, 20px)', lineHeight: 1.5, color: dark ? '#1A1A2E' : 'var(--text-sec)' }}>
        {tip.steps.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      {!dark && <div style={{ fontSize: 11, color: '#9A3412', marginTop: 6, opacity: .8 }}>No aparece en los dispositivos de los estudiantes.</div>}
    </div>
  )
}

export default QuestionMetaChips
