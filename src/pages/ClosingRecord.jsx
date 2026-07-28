import React from 'react'
import {
  useStore, nav, loadCourseRoster, loadClosingRecord, saveClosingRecord,
  loadFinalClosingRecord, getCourseDisplayName,
} from '../store/store.jsx'
import { useMobile, Btn, Skeleton, CheckIc, XIc } from '../components/ui.jsx'
import { supabase } from '../lib/supabaseClient.js'

// ── Acta de cierre ───────────────────────────────────────────────────────────
// La diligencia el TUTOR al cerrar el curso con un grupo: confirma asistencia
// contra el listado que cargó el admin, agrega observaciones y genera el acta.
// El PDF sale por el diálogo de impresión (mismo camino que los certificados):
// `@media print` deja en la hoja solo el documento.
//
// "Grupo" = curso + colegio. Un mismo curso aplicado en dos colegios tiene dos
// actas distintas, cada una con su listado.
//
// El docente-estudiante (aquí el "estudiante" es un docente en formación) VE el
// acta como constancia, pero en modo lectura y solo cuando el tutor ya la cerró:
// la RLS de 0050 no le entrega borradores. El nodo de su ruta se marca completo
// en ese momento (efecto en map.jsx).

const hoy = () => new Date().toISOString().slice(0, 10)

const fmtFecha = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${day} de ${meses[m - 1]} de ${y}`
}

const ClosingRecordPage = () => {
  const moduleId    = useStore(s => s.nodeId)
  const user        = useStore(s => s.user)
  const courses     = useStore(s => s.courses || [])
  const institutions = useStore(s => s.institutions || [])
  const isMobile = useMobile()

  const [loading, setLoading]   = React.useState(true)
  const [err, setErr]           = React.useState('')
  const [mod, setMod]           = React.useState(null)
  const [course, setCourse]     = React.useState(null)
  const [roster, setRoster]     = React.useState([])
  const [record, setRecord]     = React.useState(null)

  // Campos del acta
  const [sessionDate, setSessionDate] = React.useState(hoy())
  const [place, setPlace]             = React.useState('')
  const [comments, setComments]       = React.useState('')
  const [entries, setEntries]         = React.useState([])   // [{name,document,email,present,comment}]
  const [saving, setSaving]           = React.useState('')
  const [msg, setMsg]                 = React.useState('')

  // El colegio sale del curso: si es la copia del colegio (fork) ya lo trae.
  const institutionId = course?.institution_id || user?.institution_id || null
  const institution   = institutions.find(i => i.id === institutionId) || null
  const isStudent     = user?.role === 'student'

  React.useEffect(() => {
    let alive = true
    if (!moduleId) { setErr('No se indicó el módulo del acta'); setLoading(false); return }
    ;(async () => {
      const { data: modRow, error: me } = await supabase
        .from('course_modules').select('*').eq('id', moduleId).maybeSingle()
      if (!alive) return
      if (me || !modRow) { setErr(me?.message || 'No se encontró el módulo'); setLoading(false); return }
      setMod(modRow)
      const courseRow = courses.find(c => c.id === modRow.course_id) || null
      setCourse(courseRow)

      const instId = courseRow?.institution_id || user?.institution_id || null

      // El docente-estudiante solo lee, y solo el acta ya cerrada: no carga el
      // listado (no tiene permiso sobre course_roster ni lo necesita — el acta
      // guarda su propia copia de los asistentes en `entries`).
      if (isStudent) {
        const { record: rec } = await loadFinalClosingRecord(moduleId, instId)
        if (!alive) return
        setRecord(rec)
        if (rec) {
          setSessionDate(rec.session_date || hoy())
          setPlace(rec.place || '')
          setComments(rec.general_comments || '')
          setEntries(rec.entries || [])
        }
        setLoading(false)
        return
      }

      const [{ rows }, { record: rec }] = await Promise.all([
        loadCourseRoster(modRow.course_id, instId, courseRow?.parent_course_id || null),
        loadClosingRecord(moduleId, instId),
      ])
      if (!alive) return
      setRoster(rows)
      setRecord(rec)
      if (rec) {
        setSessionDate(rec.session_date || hoy())
        setPlace(rec.place || '')
        setComments(rec.general_comments || '')
        setEntries(rec.entries || [])
      } else {
        // Primera vez: se parte del listado, todos sin marcar.
        setEntries(rows.map(r => ({
          name: r.full_name, document: r.document || '', email: r.email || '',
          present: false, comment: '',
        })))
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [moduleId, courses.length])

  const isFinal = record?.status === 'final'
  // El docente-estudiante nunca edita. Un acta cerrada solo la corrige un admin.
  const canEdit = !isStudent && (!isFinal || user?.role === 'admin')

  const setEntry = (i, key, val) => setEntries(e => e.map((x, j) => j === i ? { ...x, [key]: val } : x))
  const markAll = (present) => setEntries(e => e.map(x => ({ ...x, present })))

  const presentes = entries.filter(e => e.present).length
  const ausentes  = entries.length - presentes

  const persist = async (finalize) => {
    if (finalize && !window.confirm(
      'Al cerrar el acta queda firmada y ya no podrás editarla. ¿Confirmas?')) return
    setSaving(finalize ? 'final' : 'draft'); setMsg('')
    const { record: saved, error } = await saveClosingRecord({
      id: record?.id, moduleId, courseId: mod.course_id, institutionId,
      sessionDate, place, generalComments: comments, entries,
    }, finalize)
    setSaving('')
    if (error) { setMsg('⚠️ ' + error); return }
    setRecord(saved)
    setMsg(finalize ? '✅ Acta cerrada' : '💾 Borrador guardado')
  }

  if (loading) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} h={48} />)}
    </div>
  )

  if (err) return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 14, color: 'var(--error)', fontWeight: 600, marginBottom: 14 }}>⚠️ {err}</p>
      <Btn variant="secondary" onClick={() => nav(isStudent ? 'map' : 'instructor-route')}>Volver</Btn>
    </div>
  )

  const courseName = getCourseDisplayName(courses, course) || course?.name || 'Curso'
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, boxSizing: 'border-box',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)' }
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #acta-print, #acta-print * { visibility: visible !important; }
          #acta-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 24px; }
          .no-print { display: none !important; }
          #acta-print table { page-break-inside: auto; }
          #acta-print tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      {/* ── Barra de acciones (no se imprime) ── */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <Btn variant="ghost" size="sm" onClick={() => nav(isStudent ? 'map' : 'instructor-route')}>← Volver</Btn>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>{mod.title || 'Acta de cierre'}</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {courseName}{institution ? ` · ${institution.name}` : ''}
          </p>
        </div>
        {isFinal && (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
            background: '#CCFBF1', color: '#0D9488', textTransform: 'uppercase', letterSpacing: .8 }}>
            Cerrada
          </span>
        )}
        {canEdit && (
          <>
            <Btn variant="secondary" size="sm" disabled={!!saving} onClick={() => persist(false)}>
              {saving === 'draft' ? '⏳' : '💾'} Guardar borrador
            </Btn>
            <Btn variant="gradient" size="sm" disabled={!!saving} onClick={() => persist(true)}>
              {saving === 'final' ? '⏳' : '🔒'} Cerrar acta
            </Btn>
          </>
        )}
        <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Imprimir / PDF</Btn>
      </div>

      {msg && <p className="no-print" style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)', marginBottom: 14 }}>{msg}</p>}

      {isStudent && !record && (
        <div className="no-print" style={{ padding: '18px 22px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
            El acta todavía no está firmada
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Tu tutor la diligencia y la cierra al terminar el curso con el grupo. Cuando lo haga,
            aquí podrás consultarla y descargarla en PDF.
          </p>
        </div>
      )}

      {!isStudent && !roster.length && !entries.length && (
        <div className="no-print" style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF3C7', marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: '#8a6100', margin: 0, lineHeight: 1.6 }}>
            No hay listado cargado para este grupo. Un administrador debe subir el Excel de asistentes
            en <strong>Admin → Cursos → Listado de asistentes</strong>, eligiendo este curso y este colegio.
          </p>
        </div>
      )}

      {/* ── Datos del acta (no se imprimen como formulario) ── */}
      {canEdit && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={lbl}>Fecha</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Lugar</label>
            <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Ej. Sala de profesores" style={inp} />
          </div>
        </div>
      )}

      {/* ── Asistencia ── */}
      {canEdit && entries.length > 0 && (
        <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
            {presentes} asistieron · {ausentes} no asistieron · {entries.length} en el listado
          </span>
          <div style={{ flex: 1 }} />
          <Btn variant="ghost" size="sm" onClick={() => markAll(true)}>Marcar todos</Btn>
          <Btn variant="ghost" size="sm" onClick={() => markAll(false)}>Desmarcar todos</Btn>
        </div>
      )}

      {canEdit && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {entries.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderRadius: 10, background: 'var(--white)', border: '1px solid var(--border)' }}>
              <button onClick={() => setEntry(i, 'present', !e.present)}
                title={e.present ? 'Asistió' : 'No asistió'}
                style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, cursor: 'pointer', border: 'none',
                  background: e.present ? 'var(--success)' : '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {e.present ? <CheckIc s={14} c="#fff" /> : <XIc s={13} c="var(--error)" />}
              </button>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                {(e.document || e.email) && (
                  <div style={{ fontSize: 11, color: 'var(--subtle)' }}>{[e.document, e.email].filter(Boolean).join(' · ')}</div>
                )}
              </div>
              <input value={e.comment} onChange={ev => setEntry(i, 'comment', ev.target.value)}
                placeholder="Observación (opcional)"
                style={{ ...inp, width: isMobile ? 120 : 260, fontSize: 12, padding: '6px 10px' }} />
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="no-print" style={{ marginBottom: 24 }}>
          <label style={lbl}>Observaciones generales</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} rows={4}
            placeholder="Desarrollo de la sesión, compromisos, novedades…"
            style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
      )}

      {/* ── El documento: esto es lo único que sale impreso ── */}
      {(!isStudent || record) && (
      <div id="acta-print" style={{ background: '#fff', color: '#1a1a2e', padding: isMobile ? 20 : 40,
        borderRadius: 14, border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>
            {institution?.name || 'Institución educativa'}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>ACTA DE CIERRE</h1>
          <div style={{ fontSize: 13, color: '#444' }}>{courseName}</div>
        </div>

        <table style={{ width: '100%', fontSize: 12, marginBottom: 20, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', width: 110, color: '#666' }}>Fecha</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{fmtFecha(sessionDate)}</td>
              <td style={{ padding: '4px 0', width: 90, color: '#666' }}>Lugar</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{place || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#666' }}>Tutor</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{user?.name || '—'}</td>
              <td style={{ padding: '4px 0', color: '#666' }}>Asistencia</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{presentes} de {entries.length}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 22 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', width: 26 }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '6px 4px', width: 100 }}>Documento</th>
              <th style={{ textAlign: 'center', padding: '6px 4px', width: 70 }}>Asistió</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Observación</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '12px 4px', color: '#888', fontStyle: 'italic' }}>Sin listado cargado.</td></tr>
            ) : entries.map((e, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '5px 4px', color: '#888' }}>{i + 1}</td>
                <td style={{ padding: '5px 4px' }}>{e.name}</td>
                <td style={{ padding: '5px 4px', color: '#555' }}>{e.document || '—'}</td>
                <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 700 }}>{e.present ? 'Sí' : 'No'}</td>
                <td style={{ padding: '5px 4px', color: '#555' }}>{e.comment || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 6 }}>
            Observaciones generales
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, minHeight: 40 }}>
            {comments || '—'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 50 }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: 5, fontSize: 11 }}>
              {user?.name || ''}<br />
              <span style={{ color: '#666' }}>Tutor</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: 5, fontSize: 11 }}>
              <br /><span style={{ color: '#666' }}>Coordinación / Rectoría</span>
            </div>
          </div>
        </div>

        {record?.finalized_at && (
          <p style={{ fontSize: 9, color: '#999', marginTop: 22, textAlign: 'center' }}>
            Acta cerrada el {new Date(record.finalized_at).toLocaleString('es-CO')} · Experia by CEINFES
          </p>
        )}
      </div>
      )}
    </div>
  )
}

export default ClosingRecordPage
