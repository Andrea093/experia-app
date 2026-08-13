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

// Paleta de la gráfica de ejes transversales (0053). Los planes guardan el SLOT
// (1..8), no el hex: el color real sale de `--viz-N` (styles.css), que ya tiene
// su propio paso para modo oscuro. Ver la nota de validación en styles.css antes
// de agregar o cambiar un color.
export const VIZ_SLOTS = [
  { slot: 1, name: 'Azul' }, { slot: 2, name: 'Naranja' },
  { slot: 3, name: 'Aqua' }, { slot: 4, name: 'Amarillo' },
  { slot: 5, name: 'Magenta' }, { slot: 6, name: 'Verde' },
  { slot: 7, name: 'Violeta' }, { slot: 8, name: 'Rojo' },
]
export const vizColor = (slot) => `var(--viz-${Math.min(8, Math.max(1, slot || 1))})`

// ── Marca CEINFES en los documentos impresos ────────────────────────────────
// ⚠️ Hex LITERALES, no variables CSS, a propósito: los documentos del piloto se
// imprimen sobre papel blanco y no deben seguir ni el modo oscuro ni el acento
// alternativo que el usuario tenga activo (`--purple` cambia con
// `data-accent`). Los valores son los del brandbook — Naranja Evolución, Morado
// Formación, Azul Pensamiento y Verde Transformación — y coinciden con los de
// `:root` en styles.css.
export const BRAND = {
  orange: '#EC671A', orangeSoft: '#FEF0E6',
  purple: '#5E4F9C', purpleSoft: '#F0EDF7',
  blue:   '#3A5BA7', blueSoft:   '#EEF2FA',
  green:  '#024B4E', greenSoft:  '#E8F1F0',
  dark:   '#1A1A2E', gray: '#5A5A6E', line: '#E5E7EB',
}

// Logo CEINFES para los documentos impresos.
// ⚠️ `logo-ceinfes.png` es un lienzo CUADRADO (4500×4500) donde el wordmark
// ocupa apenas ~15 % del alto y va centrado; el resto es transparente. Darle un
// `height` lo deja diminuto —el error obvio— así que se dimensiona por ANCHO,
// como en el resto de la app, y se recorta el vacío con un contenedor de alto
// `w * CROP` y overflow hidden. Sin ese recorte el logo se lleva 190 px de
// altura en blanco.
// ⚠️ Va SIN la clase `logo-img`: esa clase lo invierte a blanco en modo oscuro
// (styles.css) y aquí el fondo es siempre la hoja blanca.
const LOGO_CROP = 0.22

export const BrandLogo = ({ w = 190 }) => (
  <div style={{ width: w, height: Math.round(w * LOGO_CROP), position: 'relative',
    overflow: 'hidden', flexShrink: 0 }}>
    <img src="/logo-ceinfes.png" alt="CEINFES"
      style={{ width: w, height: 'auto', position: 'absolute', left: 0, top: '50%',
        transform: 'translateY(-50%)' }} />
  </div>
)

// Cabecera de marca de un documento impreso: logo, filete tricolor, título y
// los datos de contexto como fichas.
export const PrintDocHeader = ({ title, subtitle, meta = [] }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <BrandLogo w={190} />
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase',
        color: BRAND.purple, textAlign: 'right', lineHeight: 1.5 }}>
        Experia<br />
        <span style={{ color: BRAND.gray, letterSpacing: .9 }}>Formación docente en DCE</span>
      </div>
    </div>

    {/* Filete tricolor de marca: Naranja Evolución · Morado Formación · Verde
        Transformación, en ese orden de peso. */}
    <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
      <div style={{ flex: 6, background: BRAND.orange }} />
      <div style={{ flex: 2, background: BRAND.purple }} />
      <div style={{ flex: 1, background: BRAND.green }} />
    </div>

    <h1 style={{ fontSize: 19, fontWeight: 900, letterSpacing: .3, color: BRAND.dark,
      margin: '16px 0 3px', textAlign: 'center' }}>{title}</h1>
    {subtitle && (
      <div style={{ fontSize: 12.5, color: BRAND.gray, textAlign: 'center' }}>{subtitle}</div>
    )}

    {meta.length > 0 && (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
        {meta.filter(m => m?.value).map((m, i) => (
          <span key={i} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 20,
            background: BRAND.orangeSoft, color: BRAND.dark, border: `1px solid ${BRAND.orange}33` }}>
            <span style={{ color: BRAND.orange, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: .5, fontSize: 9 }}>{m.label}</span>{' '}{m.value}
          </span>
        ))}
      </div>
    )}
  </div>
)

// Título de bloque numerado, con el color de marca de ese bloque.
export const PrintSection = ({ n, title, color, tint, note, children }) => (
  <div style={{ marginBottom: 26 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      background: tint, borderLeft: `4px solid ${color}`, padding: '7px 11px',
      borderRadius: '0 8px 8px 0', pageBreakAfter: 'avoid' }}>
      <span style={{ width: 17, height: 17, borderRadius: '50%', background: color, color: '#fff',
        fontSize: 10, fontWeight: 900, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 12.5, fontWeight: 900, textTransform: 'uppercase',
        letterSpacing: .8, color }}>{title}</span>
      {note && (
        <span style={{ marginLeft: 'auto', fontSize: 10, color: BRAND.gray, textAlign: 'right' }}>{note}</span>
      )}
    </div>
    {children}
  </div>
)

// Pie de marca del documento.
export const PrintDocFooter = ({ nota }) => (
  <div style={{ marginTop: 26, borderTop: `2px solid ${BRAND.orange}`, paddingTop: 8,
    display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
    <BrandLogo w={110} />
    <span style={{ fontSize: 8.5, color: BRAND.gray, textAlign: 'right', lineHeight: 1.5 }}>
      Experia by CEINFES · Formación docente en Diseño Centrado en Experiencias
      {nota && <><br />{nota}</>}
    </span>
  </div>
)

// CSS de impresión compartido: en el piloto solo debe salir el documento.
// ⚠️ `print-color-adjust: exact` es obligatorio: sin él los navegadores quitan
// los fondos y los filetes de color y el documento sale en blanco y negro.
export const PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #clone-print, #clone-print * { visibility: visible !important; }
    #clone-print {
      position: absolute; left: 0; top: 0; width: 100%; padding: 0 24px;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    #clone-print * {
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    #clone-print table { page-break-inside: auto; }
    #clone-print tr { page-break-inside: avoid; page-break-after: auto; }
    #clone-print thead { display: table-header-group; }
  }
`
