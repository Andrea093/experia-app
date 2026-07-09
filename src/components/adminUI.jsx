import React from 'react'
import { createPortal } from 'react-dom'
import { useMobile } from './ui.jsx'

// =============================================================
// KIT VISUAL DE ADMINISTRACIÓN
// Componentes compartidos por AdminUsers / AdminSchools / AdminCourses
// para que las tres páginas se vean y se manejen igual.
// =============================================================

// ── Encabezado de página con acciones a la derecha ───────────
export const PageHead = ({ title, subtitle, children }) => {
  const isMobile = useMobile()
  return (
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>}
    </div>
  )
}

// ── Fila de tarjetas de métricas ─────────────────────────────
export const StatsRow = ({ stats }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
    {stats.map((s, i) => (
      <div key={i} style={{ padding: '14px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: s.color || 'var(--dark)' }}>{s.value}</span>
          {s.icon && <span style={{ fontSize: 16 }}>{s.icon}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
      </div>
    ))}
  </div>
)

// ── Buscador con lupa ────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder, style }) => (
  <div style={{ flex: '1 1 200px', position: 'relative', minWidth: 180, ...style }}>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 10, border: '1.5px solid var(--border)',
        fontFamily: 'var(--font)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
        background: 'var(--white)', color: 'var(--dark)', transition: 'border-color .2s' }}
      onFocus={e => e.target.style.borderColor = 'var(--orange)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
  </div>
)

// ── Tabs tipo segmento (filtros de rol, estado…) ─────────────
export const SegmentedTabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)}
        style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          background: active === t.key ? 'var(--dark)' : 'var(--bg-alt)',
          color: active === t.key ? '#fff' : 'var(--muted)', transition: 'all .2s' }}>
        {t.label}
      </button>
    ))}
  </div>
)

// ── Pastilla de estado ───────────────────────────────────────
export const Pill = ({ tone = 'muted', children, style, onClick, title }) => {
  const tones = {
    success: { bg: 'var(--success-bg, #CCFBF1)', color: 'var(--success)' },
    error:   { bg: 'var(--error-bg, #FEE2E2)',   color: 'var(--error)' },
    warn:    { bg: 'var(--warn-bg, #FEF3C7)',    color: 'var(--warn)' },
    purple:  { bg: 'var(--purple-bg)',            color: 'var(--purple)' },
    orange:  { bg: 'var(--orange-bg)',            color: 'var(--orange)' },
    muted:   { bg: 'var(--bg-alt)',               color: 'var(--muted)' },
  }
  const t = tones[tone] || tones.muted
  const base = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
    padding: '3px 9px', borderRadius: 20, background: t.bg, color: t.color, whiteSpace: 'nowrap',
    border: 'none', fontFamily: 'var(--font)', ...style }
  if (onClick) return <button onClick={onClick} title={title} style={{ ...base, cursor: 'pointer' }}>{children}</button>
  return <span title={title} style={base}>{children}</span>
}

// ── Estado vacío ─────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, desc, children }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 16, border: '2px dashed var(--border)', background: 'var(--white)' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    {title && <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{title}</p>}
    {desc && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: children ? 20 : 0 }}>{desc}</p>}
    {children}
  </div>
)

// ── Avatar de usuario (inicial o foto) ───────────────────────
export const UserAvatar = ({ acc, size = 34, bg = 'var(--orange-bg)', color = 'var(--orange)' }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.round(size * 0.38), fontWeight: 700, color }}>
    {acc?.avatar?.startsWith?.('http')
      ? <img src={acc.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : (acc?.avatar || acc?.name?.charAt(0)?.toUpperCase() || '?')}
  </div>
)

// ── Paginación ───────────────────────────────────────────────
// Hook: recorta una lista a la página actual y se auto-corrige si el
// filtro reduce el total (evita quedar en una página que ya no existe).
export const usePaged = (list, perPage = 25) => {
  const [page, setPage] = React.useState(1)
  const pages = Math.max(1, Math.ceil(list.length / perPage))
  React.useEffect(() => { if (page > pages) setPage(pages) }, [page, pages])
  const safePage = Math.min(page, pages)
  const paged = React.useMemo(
    () => list.slice((safePage - 1) * perPage, safePage * perPage),
    [list, safePage, perPage]
  )
  return { paged, page: safePage, pages, setPage, total: list.length }
}

export const Pagination = ({ page, pages, setPage, total, label = 'registros' }) => {
  if (pages <= 1) return null
  const btn = (disabled) => ({ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
    background: 'var(--white)', color: disabled ? 'var(--subtle)' : 'var(--text-sec)',
    fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{total} {label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={btn(page <= 1)} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Anterior</button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)' }}>{page} / {pages}</span>
        <button style={btn(page >= pages)} disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente →</button>
      </div>
    </div>
  )
}

// ── Panel lateral (drawer) ───────────────────────────────────
// Para detalle de una entidad sin perder el contexto de la lista.
export const Drawer = ({ open, onClose, title, subtitle, width = 520, children, headerExtra }) => {
  const isMobile = useMobile()
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.45)', animation: 'fadeUp .15s ease' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1201,
        width: isMobile ? '100%' : width, maxWidth: '100vw', background: 'var(--white)',
        boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid var(--border)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          {headerExtra}
          <button onClick={onClose} aria-label="Cerrar"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)',
              color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 22px 32px' }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Tabs internas del drawer ─────────────────────────────────
export const DrawerTabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--bg-alt)', marginBottom: 16 }}>
    {tabs.map(t => (
      <button key={t.key} onClick={() => onChange(t.key)}
        style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          background: active === t.key ? 'var(--white)' : 'transparent',
          color: active === t.key ? 'var(--dark)' : 'var(--muted)',
          boxShadow: active === t.key ? 'var(--sh-sm)' : 'none', transition: 'all .15s' }}>
        {t.label}
      </button>
    ))}
  </div>
)

// ── Menú de acciones por fila (⋯) ────────────────────────────
// Portal + getBoundingClientRect para no recortarse con el overflow de tablas.
export const RowMenu = ({ items }) => {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState(null)
  const btnRef = React.useRef(null)
  const panelRef = React.useRef(null)
  const width = 210

  const place = React.useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const margin = 8
    const left = Math.max(margin, Math.min(r.right - width, window.innerWidth - width - margin))
    const panelH = items.length * 40 + 12
    const below = window.innerHeight - r.bottom
    const openUp = below < panelH && r.top > below
    setPos({
      left,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? (window.innerHeight - r.top + 6) : undefined,
    })
  }, [items.length])

  const toggle = () => { if (!open) place(); setOpen(o => !o) }

  React.useEffect(() => {
    if (!open) return
    const onScroll = (e) => { if (panelRef.current && panelRef.current.contains(e.target)) return; setOpen(false) }
    const onResize = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onResize) }
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button ref={btnRef} type="button" onClick={toggle} title="Acciones"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8, border: '1.5px solid var(--border)',
          background: open ? 'var(--bg)' : 'var(--white)', color: 'var(--text-sec)',
          cursor: 'pointer', fontSize: 18, fontWeight: 700, lineHeight: 1, padding: 0 }}>
        ⋯
      </button>
      {open && pos && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <div ref={panelRef} style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom,
            zIndex: 1001, width, background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--sh-lg)', padding: 6 }}>
            {items.map((it, i) => (
              <button key={i} type="button" onClick={() => { setOpen(false); it.onClick() }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                  padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none',
                  color: it.danger ? 'var(--error)' : 'var(--text-sec)', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = it.danger ? 'var(--error-bg)' : 'var(--bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ width: 18, textAlign: 'center' }}>{it.icon}</span>{it.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── Sección colapsable (para paneles secundarios) ────────────
export const Collapsible = ({ title, subtitle, defaultOpen = false, children }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div style={{ borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 24, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
          padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>
      {open && <div style={{ padding: '0 24px 20px' }}>{children}</div>}
    </div>
  )
}

export const inputStyle = (hasErr) => ({
  width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
  border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
  fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', color: 'var(--dark)',
})
