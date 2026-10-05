import React from 'react'

// Tras publicar una versión nueva, una pestaña que ya estaba abierta pide los
// archivos de la versión ANTERIOR al entrar a otra pantalla (las páginas se
// cargan por partes) y esos archivos ya no existen: el navegador falla con
// "Failed to fetch dynamically imported module". No es un error de la app:
// basta recargar para traer la versión nueva. Se recarga solo UNA vez por
// minuto, para no entrar en un bucle si el problema fuera otro.
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk .* failed|Unable to preload CSS/i
const RELOAD_KEY = 'experia:chunk-reload-at'
const tryAutoReload = (error) => {
  if (!CHUNK_ERROR.test(String(error?.message || error))) return false
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch (_) { /* modo incógnito estricto: recarga igual */ }
  window.location.reload()
  return true
}

export default class ErrorBoundary extends React.Component {
  state = { error: null, showDetail: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    tryAutoReload(error)
  }

  // Resetear el error al cambiar de página (resetKey prop)
  static getDerivedStateFromProps(props, state) {
    if (state.error && props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey }
    }
    return state.resetKey !== props.resetKey ? { resetKey: props.resetKey } : null
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', gap:16, padding:24, background:'var(--bg, #F9FAFB)', fontFamily:"'Inter', sans-serif" }}>
        <div style={{ fontSize:48 }}>⚠️</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:'var(--dark, #1A1A2E)', margin:0 }}>Algo salió mal</h2>
        <p style={{ fontSize:14, color:'var(--muted, #6B7280)', maxWidth:400, textAlign:'center', lineHeight:1.6 }}>
          Ocurrió un error inesperado. Recarga la página para continuar.
        </p>
        <button onClick={() => window.location.reload()}
          style={{ padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer',
            background:'#E8732C', color:'#fff', fontSize:14, fontWeight:600,
            fontFamily:"'Inter', sans-serif" }}>
          Recargar página
        </button>
        {/* Detalle técnico (plegado): permite copiar el error exacto para
            reportarlo, también en producción. */}
        <button onClick={() => this.setState(s => ({ showDetail: !s.showDetail }))}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--muted, #6B7280)',
            fontFamily:"'Inter', sans-serif", textDecoration:'underline' }}>
          {this.state.showDetail ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
        </button>
        {(this.state.showDetail || import.meta.env.DEV) && (
          <pre style={{ fontSize:11, color:'#EF4444', background:'var(--error-bg, #FEF2F2)', padding:16,
            borderRadius:8, maxWidth:600, overflow:'auto', textAlign:'left', whiteSpace:'pre-wrap', userSelect:'text' }}>
            {this.state.error?.toString()}
            {'\n'}
            {(this.state.error?.stack || '').split('\n').slice(1, 6).join('\n')}
            {'\n'}Página: {window.location.hash || '/'}
          </pre>
        )}
      </div>
    )
  }
}
