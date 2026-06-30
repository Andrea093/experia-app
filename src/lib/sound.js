// =============================================
// EXPERIA — Sonidos del Modo Aula en Vivo (sin archivos, Web Audio API)
// Beeps sintetizados. Respeta una preferencia de silencio en localStorage.
// El AudioContext se crea tras un gesto del usuario (clic de Entrar/Iniciar).
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

const beep = (freq, dur = 0.12, type = 'sine', vol = 0.15) => {
  if (isMuted()) return
  const c = getCtx(); if (!c) return
  if (c.state === 'suspended') c.resume()
  try {
    const o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.value = freq
    o.connect(g); g.connect(c.destination)
    const t = c.currentTime
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.start(t); o.stop(t + dur)
  } catch (_) {}
}

export const sCorrect = () => { beep(660, 0.1); setTimeout(() => beep(880, 0.16), 90) }
export const sWrong   = () => beep(196, 0.22, 'square', 0.12)
export const sTick    = () => beep(440, 0.05, 'sine', 0.07)
export const sStart   = () => { beep(523, 0.1); setTimeout(() => beep(700, 0.12), 100) }
export const sReveal  = () => { beep(440, 0.08); setTimeout(() => beep(587, 0.1), 80); setTimeout(() => beep(784, 0.14), 170) }
export const sPodium  = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 130)) }
