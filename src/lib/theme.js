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

// Acentos disponibles (alternativas al morado). `preview` alimenta los
// swatches del selector en Perfil.
export const ACCENTS = [
  { id: 'morado',    name: 'Morado',    color: '#7B3FA0', preview: 'linear-gradient(125deg,#5E2D82,#7B3FA0 40%,#B84B8A 70%,#E8732C)' },
  { id: 'azul',      name: 'Azul',      color: '#2563EB', preview: 'linear-gradient(125deg,#1E40AF,#2563EB 40%,#B85C9E 70%,#E8732C)' },
  { id: 'esmeralda', name: 'Esmeralda', color: '#0D9488', preview: 'linear-gradient(125deg,#0F766E,#0D9488 40%,#F59E0B 70%,#E8732C)' },
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
