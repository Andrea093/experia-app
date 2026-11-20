// =============================================
// EXPERIA — Sonidos del Modo Aula en Vivo (sin archivos, Web Audio API)
// Todo se sintetiza: no hay descargas. Respeta la preferencia de silencio en
// localStorage. El AudioContext se crea tras un gesto del usuario (clic de
// Entrar/Iniciar/responder): los navegadores no dejan sonar antes.
//
// Nov 2026 (testeo con docentes): sonidos más reconocibles para el ambiente de
// juego — acierto con fanfarria corta, error suave (no castiga), campana cuando
// quedan 10 s, redoble de expectativa antes del ranking/podio.
// =============================================
const MUTE_KEY = 'experia:live-muted'
let ctx = null

const getCtx = () => {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch (_) {} }
  return ctx
}
export const isMuted = () => { try { return localStorage.getItem(MUTE_KEY) === '1' } catch (_) { return false } }
export const toggleMute = () => {
  const m = !isMuted()
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0') } catch (_) {}
  return m
}
// Debe llamarse desde un manejador de evento (clic) para desbloquear el audio
export const primeAudio = () => { const c = getCtx(); if (c && c.state === 'suspended') c.resume() }

const ready = () => {
  if (isMuted()) return null
  const c = getCtx(); if (!c) return null
  if (c.state === 'suspended') c.resume()
  return c
}

// Tono con envolvente: ataque corto y caída exponencial. `at` = segundos desde ahora.
const tone = (freq, { dur = 0.12, type = 'sine', vol = 0.15, at = 0, slideTo = null } = {}) => {
  const c = ready(); if (!c) return
  try {
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    const t = c.currentTime + at
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(c.destination)
    o.start(t); o.stop(t + dur + 0.02)
  } catch (_) {}
}

// Ruido filtrado (tambor / platillo).
let noiseBuf = null
const noise = ({ dur = 0.08, vol = 0.12, at = 0, freq = 900, q = 0.8, type = 'bandpass' } = {}) => {
  const c = ready(); if (!c) return
  try {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 1, c.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    src.buffer = noiseBuf
    f.type = type; f.frequency.value = freq; f.Q.value = q
    const t = c.currentTime + at
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f); f.connect(g); g.connect(c.destination)
    src.start(t); src.stop(t + dur + 0.02)
  } catch (_) {}
}

// Acierto: arpegio mayor ascendente + destello agudo.
export const sCorrect = () => {
  ;[523, 659, 784].forEach((f, i) => tone(f, { dur: 0.16, type: 'triangle', vol: 0.16, at: i * 0.08 }))
  tone(1046, { dur: 0.35, type: 'triangle', vol: 0.14, at: 0.24 })
  tone(2093, { dur: 0.25, type: 'sine', vol: 0.05, at: 0.3 })
}
// Error: dos notas que bajan, suaves (no regaña).
export const sWrong = () => {
  tone(330, { dur: 0.22, type: 'sawtooth', vol: 0.06, slideTo: 300 })
  tone(262, { dur: 0.38, type: 'sawtooth', vol: 0.06, at: 0.2, slideTo: 220 })
}
// Sin respuesta a tiempo: un "tic-toc" corto.
export const sTimeout = () => { tone(880, { dur: 0.06, vol: 0.08 }); tone(660, { dur: 0.08, vol: 0.08, at: 0.12 }) }
export const sTick    = () => tone(440, { dur: 0.05, vol: 0.07 })
export const sStart   = () => { tone(523, { dur: 0.1 }); tone(700, { dur: 0.12, at: 0.1 }) }
export const sReveal  = () => { tone(440, { dur: 0.08 }); tone(587, { dur: 0.1, at: 0.08 }); tone(784, { dur: 0.14, at: 0.17 }) }
// Respuesta enviada: "pop" corto.
export const sSend    = () => tone(620, { dur: 0.09, type: 'sine', vol: 0.12, slideTo: 900 })

// Campana: quedan 10 s. Parciales inarmónicos con caída larga, dos golpes.
export const sBell = () => {
  ;[0, 0.45].forEach(at => {
    tone(1318, { dur: 1.1, type: 'sine', vol: 0.12, at })
    tone(1318 * 2.76, { dur: 0.6, type: 'sine', vol: 0.03, at })
    tone(1318 * 5.4, { dur: 0.3, type: 'sine', vol: 0.015, at })
  })
}

// Redoble de expectativa (~2,4 s) que acelera y remata con platillo. Devuelve
// la duración en ms, para mostrar el ranking justo al terminar.
export const SUSPENSE_MS = 2600
export const sSuspense = () => {
  let t = 0, gap = 0.14
  while (t < 2.2) {
    noise({ dur: 0.07, vol: 0.10 + t * 0.03, at: t, freq: 220, q: 1.2 })
    t += gap; gap = Math.max(0.045, gap * 0.9)
  }
  noise({ dur: 0.9, vol: 0.12, at: 2.3, freq: 6000, q: 0.5, type: 'highpass' })
  tone(196, { dur: 0.5, type: 'triangle', vol: 0.12, at: 2.3 })
  return SUSPENSE_MS
}

// Podio: fanfarria.
export const sPodium  = () => {
  ;[523, 659, 784, 1046].forEach((f, i) => tone(f, { dur: 0.22, type: 'triangle', vol: 0.15, at: i * 0.13 }))
  tone(1318, { dur: 0.6, type: 'triangle', vol: 0.13, at: 0.55 })
}
