import React from 'react'
import { Confetti, RichText, QuestionText, useMobile, ZoomImg } from './ui.jsx'
import {
  submitLiveAnswer, fetchSession, fetchParticipants, fetchAnswerCounts,
  subscribeSession, subscribeParticipants, unsubscribe, openFocusReporter,
} from '../lib/liveClient.js'
import { sCorrect, sWrong, sTick, sPodium, sBell, sSend, sTimeout, sSuspense, SUSPENSE_MS, primeAudio } from '../lib/sound.js'
import { optionOrder, liveSeed } from '../lib/liveShuffle.js'
import { reactCharacter } from '../store/store.jsx'

// El avatar del estudiante (kit de DiceBear, ~250 KB) va en su propio chunk y
// solo se descarga cuando hay avatar que mostrar — es decir, en la Clase en Vivo
// Guiada. La página pública del PIN no pasa `avatar` y nunca lo carga.
const LiveAvatar = React.lazy(() => import('./LiveAvatar.jsx'))
const MyAvatar = ({ cfg, size, expression }) => (cfg
  ? <React.Suspense fallback={null}><LiveAvatar cfg={cfg} size={size} expression={expression} /></React.Suspense>
  : null)
const LiveResults = React.lazy(() => import('./LiveResults.jsx'))
// Competencia · tema · dificultad (arrastra la guía Saber: chunk aparte).
const QuestionMetaChips = React.lazy(() => import('./LiveQuestionMeta.jsx'))
const MetaChips = ({ area, question }) => (area
  ? <React.Suspense fallback={null}><QuestionMetaChips area={area} question={question} /></React.Suspense>
  : null)
// =============================================
// EXPERIA — Modo Aula en Vivo: ciclo de pregunta/revelado/explicación,
// repetido pregunta por pregunta, y podio al final. El ranking parcial va
// debajo del revelado/explicación (oct 2026), no como fase propia: la fase
// `leaderboard` se quitó en sep 2026 porque competía con la explicación.
// Compartido entre la página pública del estudiante (LivePlay.jsx) y la
// Clase en Vivo Guiada (GuidedClassView.jsx). Sirve tanto para quiz
// (con respuesta correcta y puntaje) como para poll/encuesta (sin
// respuesta correcta: muestra distribución en vivo en vez de acierto/error).
//
// Nov 2026 (testeo con docentes):
//  - Confirmar la respuesta antes de enviarla ("¿Estás seguro…?"): al tocar
//    el tutor para cerrarlo, varios marcaron opciones sin querer.
//  - Reloj visible (min:seg) y campana a los 10 s.
//  - Aviso al empezar cada ronda: el ritmo lo marca el profesor.
//  - Opciones en orden barajado (lib/liveShuffle.js): la correcta del banco
//    cae casi siempre en la B.
//  - Imágenes y tablas se amplían en la misma pantalla (antes abrían otra
//    pestaña y el estudiante "se salía").
//  - Competencia, tema y dificultad de la pregunta.
//  - Redoble antes del podio y ranking completo (antes solo el top 5).
// =============================================

export const OPT_COLORS = ['#E8732C', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444']
const letter = (pos) => String.fromCharCode(65 + pos)

// Opciones con imagen (gráficas, tablas): fondo blanco fijo, porque las
// imágenes vienen dibujadas sobre blanco y los temas de curso son oscuros.
// Se amplían al tocarlas (sin contar como respuesta).
export const OptionImage = ({ src, maxHeight = 170 }) => src ? (
  <ZoomImg src={src} style={{ display: 'block', maxWidth: '100%', maxHeight, objectFit: 'contain',
    borderRadius: 8, background: '#fff', padding: 4 }} />
) : null
// Con imágenes, las opciones van en rejilla: 2 columnas si caben, 1 en celular.
export const optionsLayout = (optionImages, gap) => (optionImages || []).some(Boolean)
  ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap }
  : { display: 'flex', flexDirection: 'column', gap }
export const cardStyle = { background: 'var(--white)', borderRadius: 20, padding: '24px 22px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }
// En celular la tarjeta pierde margen interno para que el texto use el ancho.
const cardMobile = { ...cardStyle, borderRadius: 16, padding: '16px 14px' }

// Mientras la pregunta está abierta el puntaje ya cambió en el servidor (se
// suma al enviar), así que mostrarlo en vivo adelantaría si acertaste. Se
// congela la lista hasta el revelado — mismo criterio que el sonido.
export const useFrozenParts = (parts, frozen) => {
  const ref = React.useRef(parts)
  if (!frozen || !ref.current?.length) ref.current = parts
  return ref.current
}

export const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Reloj de la pregunta. `big`: el del estudiante — min:seg grande y pegado
// arriba de la tarjeta mientras baja por el texto. Suena una campana al
// quedar 10 s (solo si la pregunta dura más de 10 s y el reloj PASA por ahí:
// quien entra con menos tiempo no la oye de golpe) y un tic en los últimos 5.
export const Countdown = ({ startedAt, limit, big = false }) => {
  const [left, setLeft] = React.useState(limit)
  const lastTick = React.useRef(null)
  const bellFor = React.useRef(null)
  React.useEffect(() => {
    if (!startedAt) return
    let prev = null
    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const l = Math.max(0, Math.ceil(limit - elapsed))
      setLeft(l)
      if (limit > 10 && l <= 10 && l > 0 && prev !== null && prev > 10 && bellFor.current !== startedAt) {
        bellFor.current = startedAt; sBell()
      }
      if (l > 0 && l <= 5 && lastTick.current !== l) { lastTick.current = l; sTick() }
      prev = l
    }
    tick(); const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startedAt, limit])
  const pct = Math.max(0, Math.min(100, (left / limit) * 100))
  const warn = left <= 10
  const bar = (
    <div style={{ flex: 1, height: big ? 10 : 8, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', borderRadius: 6, transition: 'width .25s linear',
        background: warn ? 'var(--error)' : 'var(--orange)' }} />
    </div>
  )
  if (!big) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {bar}
      <span style={{ fontSize: 16, fontWeight: 800, color: warn ? 'var(--error)' : 'var(--dark)', minWidth: 44, textAlign: 'right' }}>{fmtClock(left)}</span>
    </div>
  )
  return (
    <div role="timer" aria-live={warn ? 'assertive' : 'off'} style={{ position: 'sticky', top: 0, zIndex: 5, margin: '-4px -4px 14px', padding: '8px 10px',
      borderRadius: 14, background: warn ? '#FEF2F2' : 'var(--white)', border: `1.5px solid ${warn ? 'var(--error)' : 'var(--border)'}`,
      boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, animation: warn && left > 0 ? 'clockPulse 1s ease infinite' : 'none' }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">{warn ? '🔔' : '⏱️'}</span>
        <span style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: warn ? '#B91C1C' : 'var(--dark)' }}>{fmtClock(left)}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
          color: warn ? '#B91C1C' : 'var(--muted)' }}>{left === 0 ? 'Se acabó el tiempo' : warn ? '¡Quedan pocos segundos!' : 'Tiempo para responder'}</div>
        {bar}
      </div>
    </div>
  )
}

export const Ranking = ({ list, meId, offset = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {list.map((p, j) => {
      const i = j + offset
      const mine = p.id === meId
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: mine ? 'var(--orange-bg)' : 'var(--bg)', border: mine ? '1.5px solid var(--orange)' : '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, minWidth: 26 }}>{medal}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--dark)', lineHeight: 1.3, overflowWrap: 'anywhere' }}>{p.nombre} {p.apellido || ''}{mine ? ' (tú)' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)', flexShrink: 0 }}>{p.score}</span>
        </div>
      )
    })}
  </div>
)

// Escalafón: top 5 y, si hay más, "Ver ranking completo" (antes solo se veían
// los primeros 5 y el estudiante no sabía dónde estaban los demás).
export const FullRanking = ({ parts, meId, top = 5 }) => {
  const [all, setAll] = React.useState(false)
  const rank = parts.findIndex(p => p.id === meId) + 1
  const me = rank > 0 ? parts[rank - 1] : null
  const shown = all ? parts : parts.slice(0, top)
  return (
    <>
      <Ranking list={shown} meId={meId} />
      {!all && me && rank > top && (
        <div style={{ marginTop: 8 }}><Ranking list={[me]} meId={meId} offset={rank - 1} /></div>
      )}
      {parts.length > top && (
        <button type="button" onClick={() => setAll(a => !a)}
          style={{ width: '100%', marginTop: 8, padding: '8px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>
          {all ? 'Ver solo los primeros ▴' : `Ver ranking completo (${parts.length}) ▾`}
        </button>
      )}
    </>
  )
}

// Barra del estudiante: sus puntos, su puesto y en qué va la clase, siempre a
// la vista. "Ver ranking" despliega el escalafón (top 5 + completo).
export const LiveScoreBar = ({ parts, meId, phase, progress }) => {
  const isMobile = useMobile()
  const [open, setOpen] = React.useState(false)
  const list = useFrozenParts(parts, phase === 'question')
  const rank = list.findIndex(p => p.id === meId) + 1
  const me = rank > 0 ? list[rank - 1] : null
  const stat = (icon, value, label, color) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: 8, padding: isMobile ? '8px 4px' : '10px 14px',
      borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: isMobile ? 'center' : 'left' }}>
      {!isMobile && <span style={{ fontSize: 20 }}>{icon}</span>}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: isMobile ? .2 : .5,
          whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  )
  return (
    <div style={{ padding: isMobile ? 8 : 12, borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)',
      boxShadow: 'var(--sh-md)', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'stretch' }}>
        {stat('⭐', `${me?.score ?? 0}`, isMobile ? 'Puntos' : 'Mis puntos', 'var(--orange)')}
        {stat('🏆', rank ? `#${rank}` : '—', list.length ? `Puesto de ${list.length}` : 'Puesto', 'var(--dark)')}
        {progress && stat('📍', progress.value, progress.label, 'var(--dark)')}
      </div>
      {list.length > 0 && (
        <button type="button" onClick={() => setOpen(o => !o)}
          style={{ width: '100%', marginTop: 6, padding: '6px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, color: 'var(--orange)' }}>
          {open ? 'Ocultar ranking ▴' : '🏆 Ver ranking de la clase ▾'}
        </button>
      )}
      {open && (
        <div style={{ marginTop: 4, animation: 'fadeUp .3s ease both' }}>
          <FullRanking parts={list} meId={meId} />
          {phase === 'question' && (
            <p style={{ fontSize: 11.5, color: 'var(--subtle)', textAlign: 'center', margin: '8px 0 0' }}>
              Se actualiza cuando el profesor muestre los resultados.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Texto de lectura de la pregunta (rondas del banco, 0075). Va en una caja con
// scroll propio para que las opciones no queden enterradas debajo de un texto
// largo; las imágenes (infografías, caricaturas) se amplían en la misma
// pantalla — antes abrían otra pestaña.
export const LivePassage = ({ passage, maxHeight = '42vh' }) => {
  if (!passage) return null
  const { intro, title, paragraphs, images, source } = passage
  return (
    <div style={{ maxHeight, overflowY: 'auto', marginBottom: 14, padding: '14px 16px', borderRadius: 14,
      background: 'var(--bg)', border: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
      {intro && <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>{intro}</div>}
      {title && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{title}</div>}
      {(paragraphs || []).map((p, i) => (
        <p key={i} style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.65, margin: '0 0 10px' }}>{p}</p>
      ))}
      {(images || []).map((im, i) => (
        <div key={i} style={{ marginTop: 6 }}>
          <ZoomImg src={im.url} alt={im.caption || title || 'Imagen de apoyo'}
            style={{ width: '100%', objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' }} />
        </div>
      ))}
      {source && <p style={{ fontSize: 11.5, color: 'var(--subtle)', fontStyle: 'italic', margin: '8px 0 0' }}>{source}</p>}
    </div>
  )
}

// Momento en que el tutor da la pista: entre 5 y 10 s después de abrir la
// pregunta (15 % del tiempo). Antes llegaba a un cuarto o un tercio del tiempo
// y en las lecturas (2–3 min) muchos ya habían respondido: la pista no se veía.
// Compartido con el panel del profesor.
export const hintDelayMs = (limitS) => Math.min(10, Math.max(5, Math.round((limitS || 20) * 0.15))) * 1000

// Lo que dice el tutor al revelar cada pregunta. Varias versiones para que no
// suene siempre igual; {n} = nombre del estudiante.
const CHEERS = [
  '¡Excelente, {n}! Diste en el blanco. 🎯',
  '¡Muy bien, {n}! Esa era la respuesta.',
  '¡Correcto, {n}! Vas con todo, sigue así.',
  '¡Eso es, {n}! Leíste muy bien la pregunta.',
]
const ENCOURAGE = [
  'Casi, {n}. Cada error es una pista para la próxima. 💪',
  'No pasa nada, {n}: mira la explicación y vamos por la siguiente.',
  '¡Ánimo, {n}! La siguiente es tuya.',
  'Tranquila/o, {n}: equivocarse aquí es practicar. ¡Sigue intentándolo!',
]
const TIMEOUT = [
  '¡Se acabó el tiempo, {n}! En la siguiente, confía en tu primera idea. ⏱️',
  'Uy, {n}, el reloj nos ganó. ¡Vamos con toda en la siguiente!',
]
const pick = (list, n) => list[Math.floor(Math.random() * list.length)].replace('{n}', n || 'colega')
const REVEAL_HOLD_MS = 12000

// Pista escrita: SOLO para la página pública del PIN, que no tiene tutor. En
// la Clase en Vivo Guiada la pista la dice el personaje del curso (ver el
// efecto de `hintKey`), no va como texto en la tarjeta.
const HintCard = ({ hint }) => (
  <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--orange-bg)',
    borderLeft: '3px solid var(--orange)', animation: 'fadeUp .4s ease both' }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>💡 Pista del tutor</div>
    <RichText as="p" style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.55, margin: 0 }}>{hint}</RichText>
  </div>
)

// Reacción del avatar al resultado: salta y brilla al acertar (asombro →
// orgullo), se sacude y luego anima al fallar (tristeza → "uy, la próxima").
const SPARKS = [[-70, -50], [70, -55], [-90, 10], [90, 5], [-40, -85], [45, -88]]
const AvatarReaction = ({ cfg, result, size = 110 }) => {
  const [expr, setExpr] = React.useState(result === 'right' ? 'wow' : result === 'wrong' ? 'sad' : 'oops')
  React.useEffect(() => {
    if (result === 'timeout') return
    const t = setTimeout(() => setExpr(result === 'right' ? 'proud' : 'oops'), 1500)
    return () => clearTimeout(t)
  }, [result])
  if (!cfg) return null
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '6px 0 2px' }}>
      <div className="xp-react" style={{ animation: result === 'right' ? 'avatarJump 1s ease both' : result === 'wrong' ? 'avatarShake .8s ease both' : 'none' }}>
        <MyAvatar cfg={cfg} size={size} expression={expr} />
      </div>
      {result === 'right' && SPARKS.map(([dx, dy], i) => (
        <span key={i} aria-hidden="true" className="xp-react" style={{ position: 'absolute', left: '50%', top: '45%', fontSize: 20, pointerEvents: 'none',
          '--dx': `${dx}px`, '--dy': `${dy}px`, animation: `sparkleOut 1.1s ${i * 0.06}s ease-out both` }}>{i % 2 ? '⭐' : '✨'}</span>
      ))}
    </div>
  )
}

// Barras de distribución en vivo (encuestas, sin respuesta correcta).
const PollBars = ({ sessionId, moduleId, index, options, order, myAns }) => {
  const [counts, setCounts] = React.useState(null)
  React.useEffect(() => {
    let cancel = false
    const load = () => fetchAnswerCounts(sessionId, index, options.length, moduleId).then(c => { if (!cancel) setCounts(c) })
    load(); const id = setInterval(load, 2000)
    return () => { cancel = true; clearInterval(id) }
  }, [sessionId, moduleId, index, options.length])
  const total = (counts || []).reduce((a, c) => a + c, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {order.map((i, pos) => {
        const opt = options[i]
        const c = counts?.[i] || 0
        const pct = Math.round((c / total) * 100)
        return (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 12, border: `2px solid ${i === myAns ? 'var(--purple)' : 'var(--border)'}`, background: 'var(--white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>
              <span>{letter(pos)}. {opt}{i === myAns ? ' (tu respuesta)' : ''}</span>
              <span style={{ color: 'var(--muted)' }}>{c} · {pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', borderRadius: 6, background: 'var(--purple)', transition: 'width .3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Aviso al empezar cada ronda (una vez por módulo): el avance lo marca el
// profesor, así que no hay que apurarse ni quedarse esperando.
// Aviso al volver de otra pestaña/app con la pregunta abierta (sin responder).
const AwayNotice = ({ info, onClose }) => (
  <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 14, marginBottom: 12,
    background: '#FEF3C7', border: '1.5px solid #F59E0B', color: '#78350F', animation: 'fadeUp .25s ease both' }}>
    <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>👀</span>
    <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
      <b>Saliste de la clase {info.count > 1 ? `${info.count} veces` : ''} durante esta pregunta{info.ms >= 1000 ? ` (${Math.round(info.ms / 1000)} s)` : ''}.</b>{' '}
      Tu profesor ve cuándo alguien sale de la pestaña. Quédate aquí hasta enviar tu respuesta.
    </div>
    <button type="button" onClick={onClose} aria-label="Cerrar aviso"
      style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#78350F', padding: 2 }}>✕</button>
  </div>
)

const PaceNotice = ({ seconds, onClose }) => (
  <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 5500, background: 'rgba(15,15,20,.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
    <div style={{ maxWidth: 400, width: '100%', background: 'var(--white)', borderRadius: 20, padding: '26px 22px', textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,.3)', animation: 'modalIn .3s ease both' }}>
      <div style={{ fontSize: 38, marginBottom: 6 }}>⏱️</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', margin: '0 0 10px' }}>Antes de empezar</h3>
      <p style={{ fontSize: 14.5, color: 'var(--text-sec)', lineHeight: 1.6, margin: '0 0 18px' }}>
        El avance de las preguntas depende del docente. Tómate el tiempo estipulado por pregunta
        (<b>{fmtClock(seconds).replace(/^(\d+):00$/, '$1 min')}</b>) para responder, ya que todo el curso avanza al mismo ritmo.
      </p>
      <button type="button" onClick={onClose} autoFocus
        style={{ width: '100%', minHeight: 46, borderRadius: 12, border: 'none', background: 'var(--gradient-orange)', color: '#fff',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 800 }}>
        ¡Entendido!
      </button>
    </div>
  </div>
)

// Respuestas de esta pantalla, por si los resultados del servidor no cargan
// (LiveResults las usa como respaldo). Se guardan por sesión del navegador.
const localKey = (sessionId) => `experia:live-local:${sessionId}`
const readLocal = (sessionId) => { try { return JSON.parse(sessionStorage.getItem(localKey(sessionId)) || '{}') } catch (_) { return {} } }
const writeLocal = (sessionId, map) => { try { sessionStorage.setItem(localKey(sessionId), JSON.stringify(map)) } catch (_) {} }

// ---------- Ciclo de pregunta/revelado/explicación/podio ----------
// `avatar`: configuración del avatar del estudiante. Solo la pasa la Clase en
// Vivo Guiada (ahí hay sesión iniciada); en la página pública llega undefined y
// todo se ve exactamente como antes.
// `onEnded`: se dispara UNA sola vez cuando la sesión pasa a 'ended'. Solo la
// usa la página pública del PIN, para devolver al participante a Experia.
// `onExit`: botón "Volver a mi ruta" bajo los resultados. Solo la Clase en Vivo
// Guiada: el estudiante sale cuando termina de leerlos.
// `moduleQuestions`: preguntas del módulo tal como las tiene el estudiante en su
// ruta (solo la Clase en Vivo Guiada lo pasa). Si el snapshot de la sesión no
// trae el texto de lectura, la pista o la evidencia, se completan desde aquí —
// misma posición, mismo orden.
// `bankArea`: asignatura de la ronda (challenge_data.bank) — con ella se
// muestran competencia, tema y dificultad. Solo la vista guiada.
// `parts` (opcional): participantes ya suscritos por quien llama (la vista
// guiada, que también los usa para la barra de puntaje). Sin ella este
// componente se suscribe por su cuenta — es el caso de la página del PIN.
// `scoreBar`: pinta aquí la barra de puntos/puesto. La vista guiada la apaga
// porque la pone ella misma sobre todas sus pantallas (lecciones incluidas).
export const LiveQuestionView = ({ participant, Wrap, avatar = null, onEnded = null, moduleQuestions = null, bankArea = null, tutor = null, parts: partsProp = null, scoreBar = true, onExit = null }) => {
  const Center = Wrap || (({ children }) => <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>)
  const isMobile = useMobile()
  const card = isMobile ? cardMobile : cardStyle
  const [session, setSession]   = React.useState(null)
  const [ownParts, setParts]    = React.useState([])
  const parts = partsProp || ownParts
  const ownsParts = !partsProp
  const [myAnswers, setMy]      = React.useState({})
  const [feedback, setFeedback] = React.useState(null)
  const [sending, setSending]   = React.useState(false)
  const [chosen, setChosen]     = React.useState(null)   // opción elegida, pendiente de confirmar (índice original)
  const [paceSeen, setPaceSeen] = React.useState(() => new Set())
  const [suspense, setSuspense] = React.useState(false)

  React.useEffect(() => {
    let chS, chP
    const reloadP = () => { if (ownsParts) fetchParticipants(participant.session_id).then(setParts) }
    const resync = () => { fetchSession(participant.session_id).then(s => s && setSession(s)); reloadP() }
    resync()
    chS = subscribeSession(participant.session_id, s => setSession(s))
    if (ownsParts) chP = subscribeParticipants(participant.session_id, reloadP)
    const poll = setInterval(resync, 7000)
    const onVis = () => { if (document.visibilityState === 'visible') resync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsubscribe(chS); unsubscribe(chP); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [participant.session_id, ownsParts])

  React.useEffect(() => { setFeedback(null); setChosen(null) }, [session?.current_index, session?.phase === 'question'])
  // Las respuestas van por número de pregunta y cada módulo numera desde 0: sin
  // esto, dos rondas seguidas darían por respondidas las de la segunda.
  React.useEffect(() => { setMy({}) }, [session?.module_id])

  // Pista del tutor (rondas del banco): llega sola a un tercio del tiempo. El
  // tutor del curso la dice en su globo y queda escrita en la tarjeta. Se
  // calcula contra question_started_at (hora del servidor), así un estudiante
  // que entra tarde o recarga la ve en el mismo momento que los demás.
  const [hintShown, setHintShown] = React.useState(false)
  const withModuleData = (snap, i) => {
    const mq = moduleQuestions?.[i]
    if (!mq) return snap
    return { ...snap, passage: snap.passage || mq.passage, hint: snap.hint || mq.hint,
      questionAfter: snap.questionAfter || mq.questionAfter, optionImages: snap.optionImages || mq.optionImages,
      id: snap.id || mq.id, evidencia: snap.evidencia || mq.evidencia, difficulty: snap.difficulty || mq.difficulty }
  }
  const qNow = withModuleData((session?.questions || [])[session?.current_index] || {}, session?.current_index)
  const hintKey = session?.phase === 'question' ? `${session.current_index}|${session.question_started_at}` : null
  React.useEffect(() => {
    setHintShown(false)
    if (!hintKey || !qNow.hint || !session?.question_started_at) return
    const limit = qNow.time_limit_s || session.time_limit_s || 20
    const wait = new Date(session.question_started_at).getTime() + hintDelayMs(limit) - Date.now()
    const show = () => {
      setHintShown(true)
      reactCharacter('idle', '💡 Pista: ' + qNow.hint)
    }
    // Ya pasó el momento (entró tarde, o su reloj va adelantado respecto al
    // del servidor): el tutor la dice YA. Antes aquí solo se marcaba como
    // mostrada y el personaje nunca salía a decirla.
    if (wait <= 0) { show(); return }
    const t = setTimeout(show, wait)
    return () => clearTimeout(t)
  }, [hintKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fin de la clase → avisar una sola vez. El ref evita que el poll de 7 s y las
  // suscripciones realtime lo disparen en cada refresco de la sesión terminada.
  const avisadoFin = React.useRef(false)
  React.useEffect(() => {
    if (session?.status === 'ended' && !avisadoFin.current) {
      avisadoFin.current = true
      onEnded?.()
    }
  }, [session?.status, onEnded])

  // Redoble antes del ranking: al terminar la clase o la ronda, ~2,6 s de
  // expectativa y luego el podio con fanfarria. Una sola vez por pantalla.
  const isEnd = !!session && (session.phase === 'podium' || session.status === 'ended')
  const endKey = isEnd ? 'fin' : session?.phase === 'round_end' ? `ronda|${session.module_id}` : null
  const suspenseDone = React.useRef(new Set())
  React.useEffect(() => {
    if (!endKey || suspenseDone.current.has(endKey)) return
    suspenseDone.current.add(endKey)
    setSuspense(true)
    const ms = sSuspense() || SUSPENSE_MS
    const t = setTimeout(() => {
      setSuspense(false)
      sPodium()
      if (endKey === 'fin') reactCharacter('liveEnd')   // cierre: tutor + avatar conversan
    }, ms)
    return () => clearTimeout(t)
  }, [endKey])

  const prevPhase = React.useRef(null)
  React.useEffect(() => {
    if (!session) return
    if (session.phase !== prevPhase.current) {
      if (session.phase === 'reveal') {
        const correct = session.current_reveal?.correct
        const mine = myAnswers[session.current_index]
        const nombre = (participant.nombre || '').split(' ')[0]
        if (correct !== null && correct !== undefined) {
          // Respaldo local de resultados (si el servidor no responde al final).
          const q = qNow
          const map = readLocal(session.id)
          map[`${session.module_id}|${session.current_index}`] = {
            module_id: session.module_id, question_index: session.current_index, evidencia: q.evidencia || null,
            bank: bankArea || null, answered: mine !== undefined, correct: mine === correct,
          }
          writeLocal(session.id, map)
        }
        if (correct !== null && correct !== undefined && mine !== undefined) {
          const ok = mine === correct
          ok ? sCorrect() : sWrong()
          // El tutor del curso sale de cuerpo completo a felicitar o a dar
          // ánimo, y se queda ~12 s (antes ~5 s: se retiraba antes de que el
          // estudiante lo viera). En la página pública del PIN no hay curso
          // activo y reactCharacter no hace nada.
          reactCharacter(ok ? 'correct' : 'wrong', pick(ok ? CHEERS : ENCOURAGE, nombre), REVEAL_HOLD_MS)
        } else if (correct !== null && correct !== undefined) {
          sTimeout()
          reactCharacter('wrong', pick(TIMEOUT, nombre), REVEAL_HOLD_MS)
        }
      } else if (session.phase === 'explanation') {
        // El tutor lee en voz (globo) la explicación de la pregunta — el texto
        // completo sigue apareciendo también en la tarjeta de abajo, esto es
        // un refuerzo, no un reemplazo.
        const text = session.current_reveal?.explanation
        if (text) reactCharacter('idle', text)
      } else if (session.phase === 'lobby') {
        reactCharacter('liveStart') // el tutor recibe al estudiante en la sala
      }
      prevPhase.current = session.phase
    }
  }, [session?.phase, session?.current_index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Salidas de la pestaña: mientras la pregunta está abierta y sin responder,
  // si el estudiante deja la pestaña (o la app en el celular) se le avisa al
  // profesor por broadcast (sin tabla) y, al volver, se le muestra un aviso.
  const reporter = React.useRef(null)
  React.useEffect(() => {
    const r = openFocusReporter(participant.session_id)
    reporter.current = r
    return () => { reporter.current = null; r.close() }
  }, [participant.session_id])
  const [awayInfo, setAwayInfo] = React.useState(null)
  const focusKey = session?.phase === 'question' && session?.status !== 'ended' ? `${session.module_id}|${session.current_index}` : null
  const watching = !!focusKey && myAnswers[session?.current_index] === undefined
  React.useEffect(() => { setAwayInfo(null) }, [focusKey])
  React.useEffect(() => {
    if (!watching) return
    let awayAt = null, count = 0, total = 0
    const who = { pid: participant.id, name: [participant.nombre, participant.apellido].filter(Boolean).join(' ') || 'Estudiante', key: focusKey }
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (awayAt) return
        awayAt = Date.now()
        reporter.current?.send({ ...who, state: 'away' })
      } else if (awayAt) {
        const ms = Date.now() - awayAt
        awayAt = null; count += 1; total += ms
        reporter.current?.send({ ...who, state: 'back', ms })
        setAwayInfo({ count, ms: total })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [watching, focusKey, participant.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <Center><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Conectando…</p></Center>

  const idx = session.current_index
  const q = withModuleData((session.questions || [])[idx] || {}, idx)
  const options = q.options || []
  const order = optionOrder(liveSeed(session, idx), options)
  const posOf = (orig) => order.indexOf(orig)
  const myAns = myAnswers[idx]
  const me = parts.find(p => p.id === participant.id)
  const myRank = parts.findIndex(p => p.id === participant.id) + 1
  const limit = q.time_limit_s || session.time_limit_s || 20
  const bar = scoreBar && session.status !== 'ended' && (
    <LiveScoreBar parts={parts} meId={participant.id} phase={session.phase}
      progress={session.total_questions ? { value: `${Math.min(idx + 1, session.total_questions)}/${session.total_questions}`, label: 'Pregunta' } : null} />
  )
  const localItems = () => Object.values(readLocal(session.id))

  const answer = async (i) => {
    if (myAns !== undefined || sending) return
    setSending(true); setMy(m => ({ ...m, [idx]: i }))
    try {
      const r = await submitLiveAnswer({ session: session.id, participant: participant.id, index: idx, answer: i, token: participant.claim_token })
      setFeedback(r)
      sSend()
    } catch (e) {
      setMy(m => { const n = { ...m }; delete n[idx]; return n })
      setFeedback({ error: e.message })
    } finally { setSending(false) }
  }
  const choose = (orig) => { if (myAns !== undefined || sending) return; primeAudio(); setChosen(orig) }
  const confirmChoice = () => { const c = chosen; setChosen(null); if (c !== null) answer(c) }

  // El módulo cambió a una lección y quien nos monta aún no lo sabe: sin esto se
  // veía un instante una pregunta vacía ("Pregunta 1 de 0").
  if (session.phase === 'lesson') return (
    <Center>{bar}<p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Un momento…</p></Center>
  )

  if (session.phase === 'lobby') return (
    <Center>{bar}<div style={card}>
      {avatar
        ? <MyAvatar cfg={avatar} size={96} expression="happy" />
        : <div style={{ fontSize: 40, textAlign: 'center' }}>✅</div>}
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '10px 0 6px' }}>¡Estás dentro!</h2>
      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Hola <b>{me?.nombre || participant.nombre}</b>. Espera a que el profesor inicie…</p>
      <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'var(--orange-bg)', fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.55 }}>
        ⏱️ El avance de las preguntas depende del docente. Tómate el tiempo de cada pregunta
        (<b>{fmtClock(session.time_limit_s || limit).replace(/^(\d+):00$/, '$1 min')}</b>) para responder: todo el curso avanza al mismo ritmo.
      </div>
      <p style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: 13, marginTop: 10 }}>{parts.length} participante(s) conectado(s)</p>
    </div></Center>
  )

  // Redoble: pantalla de expectativa antes del ranking.
  if (suspense && (isEnd || session.phase === 'round_end')) return (
    <Center><div style={{ ...card, textAlign: 'center', padding: '48px 22px' }}>
      <div style={{ fontSize: 64, animation: 'clockPulse .35s ease infinite' }} aria-hidden="true">🥁</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--dark)', margin: '14px 0 6px' }}>Y los resultados son…</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>{isEnd ? 'Preparando el podio' : 'Contando los puntos de la ronda'}</p>
    </div></Center>
  )

  if (isEnd) {
    return (
      <Center><Confetti /><div style={card}>
        {!avatar
          ? <div style={{ fontSize: 44, textAlign: 'center' }}>🏆</div>
          : myRank > 0 && myRank <= 3
            ? <AvatarReaction cfg={avatar} result="right" size={116} />
            : <MyAvatar cfg={avatar} size={116} expression="proud" />}
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 16px' }}>Resultados finales</h2>
        <FullRanking parts={parts} meId={participant.id} />
        <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', borderRadius: 12, background: 'var(--orange-bg)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
          <b style={{ color: 'var(--orange)' }}>#{myRank} · {me?.score || 0} pts</b>
        </div>
      </div>
      <React.Suspense fallback={null}>
        <LiveResults key="clase" sessionId={session.id} participant={participant} cardStyle={card} fallbackItems={localItems()} />
      </React.Suspense>
      {onExit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={onExit} style={{ minHeight: 44, padding: '10px 22px', borderRadius: 12, border: 'none', background: 'var(--orange)',
            color: '#fff', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700 }}>
            Volver a mi ruta →
          </button>
        </div>
      )}
      {/* En la página del PIN, la barra fija de salida no debe tapar el final. */}
      {onEnded && <div style={{ height: 110 }} />}
      </Center>
    )
  }

  // El profesor cerró la ronda (a veces sin hacer todas las preguntas). La clase
  // sigue: aquí se espera a que él pase al siguiente paso de la secuencia.
  if (session.phase === 'round_end') return (
    <Center>{bar}<div style={card}>
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '0 0 4px' }}>🏁 Ronda terminada</h2>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>Tu profesor continuará con la clase en un momento.</p>
      <FullRanking parts={parts} meId={participant.id} />
      <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', borderRadius: 12, background: 'var(--orange-bg)' }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
        <b style={{ color: 'var(--orange)' }}>#{myRank} · {me?.score || 0} pts</b>
      </div>
    </div>
    <React.Suspense fallback={null}>
      <LiveResults key={session.module_id} sessionId={session.id} participant={participant} cardStyle={card} moduleId={session.module_id} fallbackItems={localItems()} />
    </React.Suspense>
    </Center>
  )

  if (session.phase === 'reveal' || session.phase === 'explanation') {
    const correct = session.current_reveal?.correct
    const isPoll = correct === null || correct === undefined
    const wasRight = myAns === correct
    return (
      <Center>{bar}<div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pregunta {idx + 1}</div>
        <MetaChips area={bankArea} question={q} />
        <QuestionText as="h3" style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.4 }}>{q.question}</QuestionText>
        {isPoll ? (
          <PollBars sessionId={session.id} moduleId={session.module_id} index={idx} options={options} order={order} myAns={myAns} />
        ) : (
          <div style={optionsLayout(q.optionImages, 8)}>
            {order.map((i, pos) => {
              const opt = options[i]
              const isCorrect = i === correct, isMine = i === myAns
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: `2px solid ${isCorrect ? 'var(--success)' : isMine ? 'var(--error)' : 'var(--border)'}`,
                  // El fondo de acierto/error es un tinte CLARO fijo (mint/rojo), a propósito
                  // igual en cualquier tema — así que el texto también debe ser un oscuro fijo.
                  // `var(--dark)` no sirve aquí: los temas de curso la invierten (queda clara,
                  // pensada para su propio fondo oscuro) y sobre este fondo claro se volvía
                  // casi invisible. Solo la opción neutra usa var(--dark)/var(--white), que sí
                  // se invierten juntas de forma consistente en los temas.
                  background: isCorrect ? '#F0FDFA' : isMine ? '#FEF2F2' : 'var(--white)',
                  color: (isCorrect || isMine) ? '#1A1A2E' : 'var(--dark)',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: OPT_COLORS[pos % OPT_COLORS.length], color: '#fff',
                    fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{letter(pos)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <OptionImage src={q.optionImages?.[i]} maxHeight={140} />
                    <RichText>{opt}</RichText>
                  </span>
                  {(isCorrect || isMine) && <span aria-label={isCorrect ? 'Correcta' : 'Incorrecta'} style={{ flexShrink: 0, fontSize: 16, fontWeight: 900, color: isCorrect ? '#0F766E' : '#B91C1C' }}>{isCorrect ? '✓' : '✗'}</span>}
                </div>
              )
            })}
          </div>
        )}
        {!isPoll && (myAns === undefined
          ? <>
              <AvatarReaction cfg={avatar} result="timeout" size={90} />
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>No respondiste a tiempo.</p>
            </>
          : <>
              {/* Tu personaje reacciona al resultado, igual que en el curso */}
              <AvatarReaction key={`${session.module_id}|${idx}`} cfg={avatar} result={wasRight ? 'right' : 'wrong'} />
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: wasRight ? 17 : 15, fontWeight: 800, color: wasRight ? 'var(--success)' : 'var(--error)',
                animation: 'fadeUp .4s ease both' }}>
                {wasRight ? `✓ ¡Correcto!${feedback?.points != null ? ` +${feedback.points} pts` : ''}` : `✗ Era la ${letter(posOf(correct))}. ¡La próxima es tuya!`}
              </p>
            </>)}
        {session.phase === 'explanation' && (session.current_reveal?.explanation || session.current_reveal?.explanationImage) && (
          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💡 Explicación</div>
            {/* RichText, igual que en `challenges.jsx`: respeta los saltos de
                línea e interpreta **negrilla** y {{#hex|color}}. Con un <p>
                plano, un análisis estructurado se aplastaba en un solo bloque
                y los asteriscos salían literales. */}
            {session.current_reveal.explanation && <RichText as="p" style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{session.current_reveal.explanation}</RichText>}
            {session.current_reveal.explanationImage && (
              <div style={{ marginTop: 10 }}>
                <ZoomImg src={session.current_reveal.explanationImage} style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 10 }} />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Ranking parcial: va DEBAJO del resultado y la explicación, nunca
          como pantalla aparte, para que no le quite el foco a entender la
          pregunta (por eso se quitó en sep 2026 la fase `leaderboard`). */}
      {!isPoll && parts.length > 0 && (
        <div style={{ ...card, marginTop: 16, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>🏆 Ranking de la clase</div>
          <FullRanking parts={parts} meId={participant.id} />
        </div>
      )}
      </Center>
    )
  }

  // phase === 'question'
  const answered = myAns !== undefined
  const showPace = !paceSeen.has(session.module_id)
  return (
    <Center>{bar}<div style={card}>
      {showPace && <PaceNotice seconds={limit} onClose={() => { primeAudio(); setPaceSeen(s => new Set(s).add(session.module_id)) }} />}
      <Countdown startedAt={session.question_started_at} limit={limit} big />
      {awayInfo && !answered && <AwayNotice info={awayInfo} onClose={() => setAwayInfo(null)} />}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        Pregunta {idx + 1} de {session.total_questions}
      </div>
      <MetaChips area={bankArea} question={q} />
      <LivePassage passage={q.passage} />
      {q.image && (
        <div style={{ marginBottom: 12 }}>
          <ZoomImg src={q.image} style={{ width: '100%', maxHeight: q.imageHeight || 320, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)', background: '#fff' }} />
        </div>
      )}
      {/* RichText: respeta los saltos de línea (tablas, pasos, ecuaciones) y la
          **negrilla** con que algunas preguntas resaltan palabras del texto. */}
      <QuestionText as="h3" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--dark)', marginBottom: q.questionAfter ? 8 : 16, lineHeight: 1.4 }}>{q.question}</QuestionText>
      {q.questionAfter && <RichText as="h3" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.4 }}>{q.questionAfter}</RichText>}
      {/* La pista la DICE el tutor del curso: el personaje se despliega desde
          su insignia (abajo a la derecha) con la pista en su globo. Solo sin
          tutor (página pública del PIN) queda como tarjeta de texto. */}
      {!tutor && q.hint && hintShown && <HintCard hint={q.hint} />}
      {answered ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {avatar
            ? <MyAvatar cfg={avatar} size={80} expression="idle" />
            : <div style={{ fontSize: 34 }}>📨</div>}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>¡Respuesta enviada! Elegiste la {letter(posOf(myAns))}.</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Espera a que el profesor muestre los resultados.</p>
        </div>
      ) : (
        <>
          <div style={optionsLayout(q.optionImages, 10)}>
            {order.map((i, pos) => {
              const opt = options[i]
              const isChosen = chosen === i
              const dim = chosen !== null && !isChosen
              return (
                <button key={i} onClick={() => choose(i)} disabled={sending} aria-pressed={isChosen}
                  style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, padding: isMobile ? '13px 12px' : '16px', borderRadius: 14, cursor: 'pointer',
                    border: 'none', background: OPT_COLORS[pos % OPT_COLORS.length], color: '#fff', textAlign: 'left',
                    fontFamily: 'var(--font)', fontSize: isMobile ? 15 : 16, fontWeight: 700, boxShadow: isChosen ? '0 0 0 4px var(--dark), var(--sh-md)' : 'var(--sh-md)',
                    opacity: sending ? .7 : dim ? .45 : 1, transform: isChosen ? 'scale(1.02)' : 'none', transition: 'opacity .15s, transform .15s' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.25)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{letter(pos)}</span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <OptionImage src={q.optionImages?.[i]} />
                    {opt && <RichText style={{ lineHeight: 1.4 }}>{opt}</RichText>}
                  </span>
                  {isChosen && <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>●</span>}
                </button>
              )
            })}
          </div>
          {/* Confirmación: la respuesta solo se envía al confirmar. Va pegada
              abajo para que en el celular se vea sin bajar. */}
          {chosen !== null && (
            <div role="alertdialog" aria-live="assertive" style={{ position: 'sticky', bottom: 8, zIndex: 6, marginTop: 14, padding: '14px 16px', borderRadius: 16,
              background: 'var(--white)', border: '2px solid var(--orange)', boxShadow: '0 10px 30px rgba(0,0,0,.18)', animation: 'fadeUp .25s ease both' }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', margin: '0 0 12px', textAlign: 'center' }}>
                ¿Estás seguro de que tu respuesta es la <span style={{ color: OPT_COLORS[posOf(chosen) % OPT_COLORS.length] }}>{letter(posOf(chosen))}</span>?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setChosen(null)}
                  style={{ flex: 1, minHeight: 46, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--white)', color: 'var(--dark)',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700 }}>↩ Cambiar</button>
                <button type="button" onClick={confirmChoice} disabled={sending}
                  style={{ flex: 1.4, minHeight: 46, borderRadius: 12, border: 'none', background: 'var(--success)', color: '#fff',
                    cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 800 }}>✓ Sí, enviar</button>
              </div>
            </div>
          )}
          {feedback?.error && <p style={{ fontSize: 13, color: 'var(--error)', textAlign: 'center', marginTop: 10 }}>No se pudo enviar: {feedback.error}. Intenta de nuevo.</p>}
        </>
      )}
    </div></Center>
  )
}
