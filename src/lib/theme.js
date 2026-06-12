// =============================================
// EXPERIA — Gestión de tema (modo claro/oscuro + acento)
// La preferencia se guarda por dispositivo en localStorage y se aplica
// como data-attributes en <html>; index.html la aplica antes del primer
// paint para evitar flash. Todas las superficies consumen variables CSS,
// así que el cambio es instantáneo sin re-render.
// =============================================
import React from 'react'

const THEME_KEY = 'experia-theme'
const ACCENT_KEY = 'experia-accent'

// Acentos disponibles — colores CEINFES Brandbook. `preview` alimenta los swatches en Perfil.
export const ACCENTS = [
  { id: 'morado',    name: 'Morado Formación',    color: '#5E4F9C', preview: 'linear-gradient(125deg,#45397A,#5E4F9C 40%,#C0538A 70%,#EC671A)' },
  { id: 'azul',      name: 'Azul Pensamiento',     color: '#3A5BA7', preview: 'linear-gradient(125deg,#2B4485,#3A5BA7 40%,#9A5CB8 70%,#EC671A)' },
  { id: 'esmeralda', name: 'Verde Transformación', color: '#024B4E', preview: 'linear-gradient(125deg,#013738,#024B4E 40%,#8CCAAE 70%,#EC671A)' },
]

const safeGet = (key) => { try { return localStorage.getItem(key) } catch { return null } }
const safeSet = (key, value) => { try { localStorage.setItem(key, value) } catch { /* modo incógnito */ } }

// Evento interno para que todos los componentes que muestran el estado del
// tema (Header, Perfil) se re-rendericen juntos al cambiar la preferencia
const CHANGE_EVENT = 'experia-theme-change'
const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT))

export const getTheme = () =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

export const setTheme = (mode) => {
  if (mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
  safeSet(THEME_KEY, mode)
  notify()
}

export const toggleTheme = () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export const getAccent = () => safeGet(ACCENT_KEY) || 'morado'

export const setAccent = (id) => {
  if (!ACCENTS.some(a => a.id === id)) return
  if (id === 'morado') document.documentElement.removeAttribute('data-accent')
  else document.documentElement.setAttribute('data-accent', id)
  safeSet(ACCENT_KEY, id)
  notify()
}

// Hook de solo-lectura reactiva: el estado vive en el DOM/localStorage;
// esto re-renderiza el componente cuando cualquier parte de la app lo cambia.
export const useTheme = () => {
  const [, force] = React.useReducer(x => x + 1, 0)
  React.useEffect(() => {
    window.addEventListener(CHANGE_EVENT, force)
    return () => window.removeEventListener(CHANGE_EVENT, force)
  }, [])
  return {
    theme: getTheme(), accent: getAccent(),
    toggle: toggleTheme, setMode: setTheme, pickAccent: setAccent,
  }
}

// ── Alto contraste ──────────────────────────────────────────────────────────
const CONTRAST_KEY = 'experia-contrast'

export const getContrast = () =>
  document.documentElement.getAttribute('data-contrast') === 'alto' ? 'alto' : 'normal'

export const setContrast = (level) => {
  if (level === 'alto') document.documentElement.setAttribute('data-contrast', 'alto')
  else document.documentElement.removeAttribute('data-contrast')
  safeSet(CONTRAST_KEY, level)
  notify()
}

export const toggleContrast = () => {
  const next = getContrast() === 'alto' ? 'normal' : 'alto'
  setContrast(next)
  return next
}

export const useContrast = () => {
  const [, force] = React.useReducer(x => x + 1, 0)
  React.useEffect(() => {
    window.addEventListener(CHANGE_EVENT, force)
    return () => window.removeEventListener(CHANGE_EVENT, force)
  }, [])
  return { contrast: getContrast(), toggle: toggleContrast, set: setContrast }
}
