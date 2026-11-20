import React from 'react'
import { useStore } from '../store/store.jsx'
import { Btn, useMobile } from '../components/ui.jsx'
import { PageHead, StatsRow, SearchInput, SegmentedTabs, Pill, EmptyState } from '../components/adminUI.jsx'
import { FEEDBACK_CATEGORIES, fetchFeedback, setFeedbackStatus } from '../lib/feedback.js'
// =============================================
// EXPERIA — Admin → Comentarios de profesores ("Ayúdanos a mejorar", 0088)
// Lista lo que escriben los instructores desde el botón de su cabecera: quién,
// de qué colegio, sobre qué, en qué página estaba, su calificación y el
// comentario. El admin lo marca como revisado/resuelto y lo exporta a Excel.
// =============================================

const STATUS = {
  nuevo:    { label: 'Nuevo', tone: 'orange' },
  revisado: { label: 'Revisado', tone: 'purple' },
  resuelto: { label: 'Resuelto', tone: 'success' },
}
const catLabel = (id) => FEEDBACK_CATEGORIES.find(c => c.id === id)?.label || '—'
const fmtDate = (iso) => new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const AdminFeedback = () => {
  const isMobile = useMobile()
  const institutions = useStore(s => s.institutions) || []
  const [rows, setRows] = React.useState(null)
  const [error, setError] = React.useState('')
  const [filter, setFilter] = React.useState('nuevo')
  const [search, setSearch] = React.useState('')

  const load = React.useCallback(() => {
    setError('')
    fetchFeedback().then(setRows).catch(e => { setError(e.message || 'No se pudieron cargar'); setRows([]) })
  }, [])
  React.useEffect(() => { load() }, [load])

  const instName = (id) => institutions.find(i => i.id === id)?.name || '—'
  const list = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows || []).filter(r => (filter === 'todos' || r.status === filter)
      && (!q || `${r.message} ${r.user_name} ${r.user_email} ${instName(r.institution_id)}`.toLowerCase().includes(q)))
  }, [rows, filter, search, institutions]) // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id, status) => {
    setRows(rs => rs.map(r => (r.id === id ? { ...r, status } : r)))
    try { await setFeedbackStatus(id, status) } catch (e) { alert('No se pudo actualizar: ' + e.message); load() }
  }

  const exportXlsx = async () => {
    const XLSX = await import('xlsx')
    const data = (rows || []).map(r => ({
      Fecha: fmtDate(r.created_at), Profesor: r.user_name, Correo: r.user_email, Colegio: instName(r.institution_id),
      Tema: catLabel(r.category), Calificación: r.rating || '', Página: r.page || '', Comentario: r.message, Estado: STATUS[r.status]?.label || r.status,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 80 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Comentarios')
    XLSX.writeFile(wb, `comentarios-profesores-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const count = (st) => (rows || []).filter(r => r.status === st).length
  const rated = (rows || []).filter(r => r.rating)
  const avg = rated.length ? (rated.reduce((a, r) => a + r.rating, 0) / rated.length).toFixed(1) : '—'

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <PageHead title="Comentarios de profesores" subtitle="Lo que escriben los instructores desde «Ayúdanos a mejorar»">
        <Btn variant="secondary" onClick={load}>↻ Actualizar</Btn>
        <Btn variant="gradient" onClick={exportXlsx} disabled={!rows?.length}>⬇ Exportar Excel</Btn>
      </PageHead>

      <StatsRow stats={[
        { label: 'Nuevos', value: count('nuevo'), color: 'var(--orange)', icon: '💬' },
        { label: 'Revisados', value: count('revisado'), color: 'var(--purple)' },
        { label: 'Resueltos', value: count('resuelto'), color: 'var(--success)' },
        { label: 'Calificación promedio', value: avg, color: '#F59E0B', icon: '★' },
      ]} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <SegmentedTabs active={filter} onChange={setFilter} tabs={[
          { key: 'nuevo', label: `Nuevos (${count('nuevo')})` },
          { key: 'revisado', label: 'Revisados' },
          { key: 'resuelto', label: 'Resueltos' },
          { key: 'todos', label: 'Todos' },
        ]} />
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por texto, profesor o colegio" style={{ flex: '1 1 240px' }} />
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}. ¿Ya se aplicó la migración 0088?</p>}
      {rows === null ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cargando…</p>
      ) : list.length === 0 ? (
        <EmptyState icon="💬" title="Sin comentarios aquí" desc={filter === 'nuevo' ? 'No hay comentarios nuevos por revisar.' : 'No hay comentarios con este filtro.'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(r => (
            <div key={r.id} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <b style={{ fontSize: 14, color: 'var(--dark)' }}>{r.user_name || 'Sin nombre'}</b>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.user_email} · {instName(r.institution_id)}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{fmtDate(r.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Pill tone="purple">{catLabel(r.category)}</Pill>
                {r.rating && <Pill tone="warn">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Pill>}
                {r.page && <Pill>Página: {r.page}</Pill>}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{r.message}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Estado:</span>
                {Object.entries(STATUS).map(([k, v]) => (
                  <Pill key={k} tone={r.status === k ? v.tone : 'muted'} onClick={() => r.status !== k && changeStatus(r.id, k)}
                    style={{ cursor: 'pointer', opacity: r.status === k ? 1 : .6 }}>{r.status === k ? '● ' : ''}{v.label}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminFeedback
