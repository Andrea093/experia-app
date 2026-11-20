import React from 'react'
import { fetchMyLiveResults } from '../lib/liveClient.js'
import { summarizeLiveResults } from '../lib/saberGuide.js'
// =============================================
// EXPERIA — Modo Aula en Vivo: lo que acertó el estudiante al terminar la clase,
// en total y por competencia. Va en su propio chunk (lazy desde LiveQuestionView)
// porque arrastra la guía Saber, y la página pública del PIN debe seguir liviana.
//
// Nov 2026: en el testeo varios estudiantes vieron "No pudimos cargar tus
// resultados". Ahora: (1) reintenta solo, con espera creciente — la RPC puede
// fallar justo en el cambio de fase o con la red del colegio; (2) si sigue
// fallando, muestra los resultados que el propio dispositivo fue anotando en
// cada revelado (`fallbackItems`, de LiveQuestionView); (3) solo si tampoco
// hay eso, un aviso amable con "Reintentar", sin hablar de errores.
// =============================================

const RETRY_MS = [1500, 3000, 6000]

const CompetenciaRow = ({ label, correct, total }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 5 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--dark)', lineHeight: 1.35 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--dark)', whiteSpace: 'nowrap' }}>{correct} de {total}</span>
    </div>
    <div style={{ height: 8, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(correct / total) * 100}%`, borderRadius: 6, background: 'var(--purple)' }} />
    </div>
  </div>
)

// `moduleId`: solo esa ronda (el profesor la cerró y la clase sigue). Sin él, toda la clase.
const LiveResults = ({ sessionId, participant, cardStyle, moduleId = null, fallbackItems = null }) => {
  const [items, setItems] = React.useState(null)
  const [failed, setFailed] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    let alive = true, timer = null
    const run = (n) => fetchMyLiveResults({ session: sessionId, participant: participant.id, token: participant.claim_token })
      .then(r => { if (alive) { setItems(r); setFailed(false) } })
      .catch((e) => {
        if (!alive) return
        if (n < RETRY_MS.length) timer = setTimeout(() => run(n + 1), RETRY_MS[n])
        else { console.warn('[live] resultados no disponibles:', e?.message || e); setFailed(true) }
      })
    setFailed(false)
    run(0)
    return () => { alive = false; clearTimeout(timer) }
  }, [sessionId, participant.id, participant.claim_token, attempt])

  const card = { ...cardStyle, marginTop: 16, animation: 'fadeUp .4s ease both' }
  const fallback = (fallbackItems || []).filter(i => !moduleId || i.module_id === moduleId)
  const data = items || (failed && fallback.length ? fallback : null)

  if (!data && failed) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>🎯 Tus resultados</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 12px' }}>Estamos terminando de contar tus respuestas.</p>
      <button onClick={() => setAttempt(a => a + 1)} style={{ minHeight: 40, padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
        background: 'var(--white)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
        Ver mis resultados
      </button>
    </div>
  )
  if (!data) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Cargando tus resultados…</p>
    </div>
  )

  const scope = moduleId ? 'esta ronda' : 'esta clase'
  const title = moduleId ? '🎯 Tus resultados en esta ronda' : '🎯 Tus resultados'
  const { total, answered, correct, groups, other } = summarizeLiveResults(moduleId ? data.filter(i => i.module_id === moduleId) : data)
  if (!total) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>En {scope} no se alcanzaron a responder preguntas.</p>
    </div>
  )

  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.2 }}>
        {correct} de {total} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>{total === 1 ? 'pregunta correcta' : 'preguntas correctas'}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>Solo cuentan las preguntas que se alcanzaron a hacer en {scope}.</p>
      {answered < total && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
          {total - answered === 1 ? 'Una pregunta quedó sin responder.' : `${total - answered} preguntas quedaron sin responder.`}
        </p>
      )}
      {groups.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Por competencia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(g => (
              <React.Fragment key={g.area}>
                {groups.length > 1 && <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dark)' }}>{g.label}</div>}
                {g.rows.map(r => <CompetenciaRow key={r.id} label={r.label} correct={r.correct} total={r.total} />)}
              </React.Fragment>
            ))}
            {other && <CompetenciaRow label="Otras preguntas" correct={other.correct} total={other.total} />}
          </div>
        </div>
      )}
      {!items && (
        <p style={{ fontSize: 11.5, color: 'var(--subtle)', margin: '12px 0 0' }}>
          Conteo de este dispositivo. Los resultados completos quedan en «Mis clases en vivo».
        </p>
      )}
    </div>
  )
}

export default LiveResults
