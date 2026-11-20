// =============================================
// EXPERIA — Orden de las opciones en la Clase en Vivo (nov 2026)
// En el banco la respuesta correcta cae casi siempre en la B (Lectura crítica
// 91 de 160, Biología 35 de 55): en el testeo los estudiantes notaron que
// "siempre es la misma". Aquí se baraja el ORDEN EN QUE SE MUESTRAN las
// opciones, sin tocar los datos:
//   - El orden sale de una semilla (sesión + módulo + pregunta), así el
//     profesor (proyección y panel) y todos los estudiantes ven las mismas
//     letras en el mismo lugar, y una recarga no lo cambia.
//   - El servidor sigue calificando por el índice ORIGINAL: al responder se
//     envía `order[posición]`, y el revelado/conteos se traducen de vuelta.
//   - No se baraja si una opción depende del orden ("todas las anteriores",
//     "A y B"…). Sin migración ni SQL.
// Funciones PURAS.
// =============================================

const ORDER_DEPENDENT = /anterior(es)?\b|ninguna de|todas las|ambas|\b[A-E]\s*\)?\s*y\s*\(?\s*[A-E]\b|\bopci[oó]n(es)?\s+[A-E]\b/i

const hash = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
const rng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// order[posición mostrada] = índice original de la opción.
export const optionOrder = (seedKey, options = []) => {
  const n = options.length
  const identity = Array.from({ length: n }, (_, i) => i)
  if (n < 2 || !seedKey || options.some(o => ORDER_DEPENDENT.test(String(o || '')))) return identity
  const r = rng(hash(String(seedKey)))
  const a = [...identity]
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

export const liveSeed = (session, index) => (session?.id ? `${session.id}|${session.module_id || ''}|${index}` : '')

// Índice original → posición mostrada (para el revelado y los conteos).
export const shownPos = (order, original) => (original == null ? original : order.indexOf(original))
