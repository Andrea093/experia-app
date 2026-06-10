import React from 'react'

export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', gap:16, padding:24, background:'var(--bg, #F9FAFB)', fontFamily:"'DM Sans', sans-serif" }}>
        <div style={{ fontSize:48 }}>⚠️</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:'var(--dark, #1A1A2E)', margin:0 }}>Algo salió mal</h2>
        <p style={{ fontSize:14, color:'var(--muted, #6B7280)', maxWidth:400, textAlign:'center', lineHeight:1.6 }}>
          Ocurrió un error inesperado. Recarga la página para continuar.
        </p>
        <button onClick={() => window.location.reload()}
          style={{ padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer',
            background:'#E8732C', color:'#fff', fontSize:14, fontWeight:600,
            fontFamily:"'DM Sans', sans-serif" }}>
          Recargar página
        </button>
        {import.meta.env.DEV && (
          <pre style={{ fontSize:11, color:'#EF4444', background:'var(--error-bg, #FEF2F2)', padding:16,
            borderRadius:8, maxWidth:600, overflow:'auto', textAlign:'left' }}>
            {this.state.error?.toString()}
          </pre>
        )}
      </div>
    )
  }
}
