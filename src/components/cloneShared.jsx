import React from 'react'
import { loadCloneGroups } from '../store/store.jsx'

// ── Piezas compartidas del piloto MODO CLON (temporal, 0051) ────────────────
// Las dos páginas del docente (asistencia y efectividad) trabajan siempre sobre
// UN grupo de alumnos de colegio, así que comparten el selector y los estilos.
// Al desmontar el piloto se borra este archivo con las páginas.

export const hoy = () => new Date().toISOString().slice(0, 10)

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export const fmtFecha = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return `${day} de ${MESES[m - 1]} de ${y}`
}

export const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
  border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14,
  outline: 'none', background: 'var(--white)', color: 'var(--dark)',
}

export const lbl = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: .8, display: 'block', marginBottom: 5,
}

export const card = {
  background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14,
}

// Grupos visibles para el usuario actual. La RLS de 0051 ya decide el alcance
// (el docente ve solo los suyos; el tutor los de sus colegios), así que aquí no
// se vuelve a filtrar por rol.
export const useMyCloneGroups = () => {
  const [groups, setGroups]   = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError]     = React.useState('')
  const [groupId, setGroupId] = React.useState('')

  const reload = React.useCallback(async () => {
    setLoading(true)
    const { groups: rows, error: e } = await loadCloneGroups()
    setGroups(rows); setError(e || ''); setLoading(false)
    return rows
  }, [])

  React.useEffect(() => { reload() }, [reload])
  // Si solo tiene un grupo, se elige solo: es el caso normal del docente.
  React.useEffect(() => {
    if (!groupId && groups.length) setGroupId(groups[0].id)
  }, [groups, groupId])

  const group = groups.find(g => g.id === groupId) || null
  return { groups, group, groupId, setGroupId, loading, error, reload }
}

export const GroupPicker = ({ groups, groupId, setGroupId, label = 'Grupo' }) => {
  if (groups.length <= 1) return null
  return (
    <div style={{ minWidth: 200 }}>
      <label style={lbl}>{label}</label>
      <select value={groupId} onChange={e => setGroupId(e.target.value)} style={inp}>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}{g.grade ? ` · ${g.grade}` : ''}</option>
        ))}
      </select>
    </div>
  )
}

// Estado vacío común: sin grupo asignado no hay nada que hacer en ninguna de las
// dos páginas, y la acción correctiva es del tutor, no del docente.
export const SinGrupo = ({ error }) => (
  <div style={{ ...card, padding: '20px 24px', maxWidth: 620 }}>
    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
      Todavía no tienes un grupo asignado
    </p>
    <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
      Tu tutor crea el grupo y carga el listado de tus alumnos. Apenas lo haga,
      aquí podrás marcar la asistencia y registrar la tabla de efectividad.
    </p>
    {error && (
      <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 12, marginBottom: 0 }}>
        ⚠️ {error}
      </p>
    )}
  </div>
)

// Cabecera común de las páginas del docente clon.
export const CloneHead = ({ title, subtitle, children }) => (
  <div className="no-print" style={{ display: 'flex', alignItems: 'flex-end', gap: 12,
    flexWrap: 'wrap', marginBottom: 18 }}>
    <div style={{ flex: 1, minWidth: 200 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '3px 0 0' }}>{subtitle}</p>}
    </div>
    {children}
  </div>
)

// Lee un .xlsx/.xls/.csv y devuelve las filas como objetos con las claves
// normalizadas (sin tildes, minúsculas). Lo usan el listado de alumnos y la
// importación de la tabla de efectividad.
export const nrmKey = (str) => str.toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

export const readSheet = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
  reader.onload = async (e) => {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      resolve(rows.map(row => {
        const n = {}
        Object.keys(row).forEach(k => { n[nrmKey(k)] = row[k] })
        return n
      }))
    } catch { reject(new Error('Debe ser un archivo .xlsx, .xls o .csv')) }
  }
  reader.readAsArrayBuffer(file)
})

// Porcentajes del plan de unidades (0052). Excel entrega una celda con formato
// de porcentaje como FRACCIÓN (7,6 % → 0.076), pero un tutor también puede
// escribir "7,6%" o 7.6 a secas. Se normaliza todo a porcentaje:
//   · texto con % → el número tal cual ("7,6%" → 7.6)
//   · número ≤ 1  → se asume fracción de Excel (0.076 → 7.6)
//   · resto       → ya viene en porcentaje (7.6 → 7.6)
// ⚠️ El caso ambiguo es el 1: un "1" suelto se lee como 100 %. Es el precio de
// aceptar las dos formas; la plantilla usa celdas con formato de porcentaje.
export const parsePct = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null
  const str = String(raw).trim()
  const hasSign = str.includes('%')
  const n = typeof raw === 'number' ? raw : parseFloat(str.replace('%', '').replace(',', '.'))
  if (!Number.isFinite(n)) return null
  const pct = (!hasSign && Math.abs(n) > 0 && Math.abs(n) <= 1) ? n * 100 : n
  return Math.round(pct * 10) / 10
}

export const fmtPct1 = (n) =>
  n === null || n === undefined ? '—' : `${n.toFixed(1).replace('.', ',')}%`

// CSS de impresión compartido: en el piloto solo debe salir el documento.
export const PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #clone-print, #clone-print * { visibility: visible !important; }
    #clone-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 24px; }
    .no-print { display: none !important; }
    #clone-print table { page-break-inside: auto; }
    #clone-print tr { page-break-inside: avoid; page-break-after: auto; }
  }
`
