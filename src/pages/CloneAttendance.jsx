import React from 'react'
import {
  useStore, loadCloneGroupStudents, loadCloneAttendance, saveCloneAttendance,
} from '../store/store.jsx'
import { useMobile, Btn, Skeleton, CheckIc, XIc } from '../components/ui.jsx'
import {
  hoy, fmtFecha, inp, lbl, card, useMyCloneGroups, GroupPicker, SinGrupo,
  CloneHead, PRINT_CSS,
} from '../components/cloneShared.jsx'

// ── Marcar asistencia — MODO CLON (piloto temporal, 0051) ───────────────────
// El docente-estudiante marca qué alumnos de SU grupo de colegio asistieron a la
// sesión y genera el acta. El listado lo carga el tutor clon (CloneGroups.jsx);
// el docente no lo edita.
//
// Un acta por grupo y fecha (índice único en 0051). `entries` es un snapshot del
// listado al diligenciar: si el tutor recarga el Excel después, un acta ya
// cerrada no cambia. Cerrar el acta la congela (trigger en 0051).
//
// El PDF sale por window.print() + @media print, igual que los certificados y el
// acta de cierre: no hay librería de PDF en el proyecto y no hace falta.

const rowToEntry = (r) => ({
  name: r.full_name, document: r.document || '', email: r.email || '',
  present: false, comment: '',
})

const CloneAttendancePage = () => {
  const user     = useStore(s => s.user)
  const isMobile = useMobile()
  const { groups, group, groupId, setGroupId, loading: loadingGroups, error: groupsError } = useMyCloneGroups()

  const [loading, setLoading] = React.useState(true)
  const [roster, setRoster]   = React.useState([])
  const [actas, setActas]     = React.useState([])
  const [record, setRecord]   = React.useState(null)     // acta abierta (o null = nueva)

  const [sessionDate, setSessionDate] = React.useState(hoy())
  const [topic, setTopic]     = React.useState('')
  const [place, setPlace]     = React.useState('')
  const [notes, setNotes]     = React.useState('')
  const [entries, setEntries] = React.useState([])
  const [saving, setSaving]   = React.useState('')
  const [msg, setMsg]         = React.useState('')

  // Carga listado + historial de actas del grupo elegido.
  React.useEffect(() => {
    let alive = true
    if (!groupId) { setLoading(false); return }
    setLoading(true); setMsg('')
    ;(async () => {
      const [{ rows }, { rows: acts }] = await Promise.all([
        loadCloneGroupStudents(groupId),
        loadCloneAttendance(groupId),
      ])
      if (!alive) return
      setRoster(rows)
      setActas(acts)
      abrirNueva(rows)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [groupId])

  const abrirNueva = (rows = roster) => {
    setRecord(null)
    setSessionDate(hoy()); setTopic(''); setPlace(''); setNotes('')
    setEntries(rows.map(rowToEntry))
    setMsg('')
  }

  const abrirActa = (a) => {
    setRecord(a)
    setSessionDate(a.session_date || hoy())
    setTopic(a.topic || ''); setPlace(a.place || ''); setNotes(a.notes || '')
    setEntries(a.entries || [])
    setMsg('')
  }

  const isFinal = record?.status === 'final'
  const canEdit = !isFinal
  const setEntry = (i, key, val) => setEntries(e => e.map((x, j) => j === i ? { ...x, [key]: val } : x))
  const markAll  = (present) => setEntries(e => e.map(x => ({ ...x, present })))

  const presentes = entries.filter(e => e.present).length
  const ausentes  = entries.length - presentes

  const persist = async (finalize) => {
    if (finalize && !window.confirm(
      'Al cerrar el acta queda firmada y ya no podrás editarla. ¿Confirmas?')) return
    setSaving(finalize ? 'final' : 'draft'); setMsg('')
    const { record: saved, error } = await saveCloneAttendance({
      id: record?.id, groupId, sessionDate, topic, place, notes, entries,
    }, finalize)
    setSaving('')
    if (error) { setMsg('⚠️ ' + error); return }
    setRecord(saved)
    setActas(prev => [saved, ...prev.filter(a => a.id !== saved.id)]
      .sort((a, b) => (b.session_date || '').localeCompare(a.session_date || '')))
    setMsg(finalize ? '✅ Acta cerrada' : '💾 Borrador guardado')
  }

  if (loadingGroups || loading) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} h={48} />)}
    </div>
  )

  if (!groups.length) return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? 16 : 24 }}>
      <CloneHead title="Marcar asistencia" />
      <SinGrupo error={groupsError} />
    </div>
  )

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <style>{PRINT_CSS}</style>

      <CloneHead
        title="Marcar asistencia"
        subtitle={group ? `${group.name}${group.grade ? ` · ${group.grade}` : ''} · ${roster.length} alumno${roster.length !== 1 ? 's' : ''} en el listado` : ''}>
        <GroupPicker groups={groups} groupId={groupId} setGroupId={setGroupId} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {record && <Btn variant="secondary" size="sm" onClick={() => abrirNueva()}>+ Nueva sesión</Btn>}
          <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Generar acta de asistencia</Btn>
        </div>
      </CloneHead>

      {msg && (
        <p className="no-print" style={{ fontSize: 13, fontWeight: 600, marginBottom: 14,
          color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{msg}</p>
      )}

      {!roster.length && (
        <div className="no-print" style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF3C7', marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: '#8a6100', margin: 0, lineHeight: 1.6 }}>
            El grupo <strong>{group?.name}</strong> todavía no tiene alumnos cargados.
            Tu tutor debe subir el listado desde <strong>Grupos y listados</strong>.
          </p>
        </div>
      )}

      {/* ── Historial de sesiones ── */}
      {actas.length > 0 && (
        <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <span style={{ ...lbl, marginBottom: 0 }}>Sesiones</span>
          {actas.map(a => {
            const activo = record?.id === a.id
            return (
              <button key={a.id} onClick={() => abrirActa(a)}
                style={{ padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)',
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  border: activo ? '1.5px solid var(--orange)' : '1.5px solid var(--border)',
                  background: activo ? 'var(--orange-bg)' : 'var(--white)',
                  color: activo ? 'var(--orange)' : 'var(--text-sec)' }}>
                {a.session_date} {a.status === 'final' ? '🔒' : '✏️'}
              </button>
            )
          })}
          {record && (
            <span style={{ fontSize: 11.5, color: 'var(--subtle)' }}>
              · viendo {isFinal ? 'un acta cerrada' : 'un borrador'}
            </span>
          )}
        </div>
      )}

      {/* ── Datos de la sesión ── */}
      {canEdit && (
        <div className="no-print" style={{ display: 'grid', marginBottom: 18, gap: 12,
          gridTemplateColumns: isMobile ? '1fr' : '170px 1fr 1fr' }}>
          <div>
            <label style={lbl}>Fecha</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Tema de la sesión</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Ej. Lectura crítica — inferencias" style={inp} />
          </div>
          <div>
            <label style={lbl}>Lugar</label>
            <input value={place} onChange={e => setPlace(e.target.value)}
              placeholder="Ej. Aula 302" style={inp} />
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
            <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10 }}>
              <button onClick={() => setEntry(i, 'present', !e.present)}
                title={e.present ? 'Asistió' : 'No asistió'}
                aria-label={`${e.name}: ${e.present ? 'asistió' : 'no asistió'}`}
                style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, cursor: 'pointer', border: 'none',
                  background: e.present ? 'var(--success)' : '#FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {e.present ? <CheckIc s={14} c="#fff" /> : <XIc s={13} c="var(--error)" />}
              </button>
              <span style={{ fontSize: 11, color: 'var(--subtle)', minWidth: 20 }}>{i + 1}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                {(e.document || e.email) && (
                  <div style={{ fontSize: 11, color: 'var(--subtle)' }}>{[e.document, e.email].filter(Boolean).join(' · ')}</div>
                )}
              </div>
              <input value={e.comment} onChange={ev => setEntry(i, 'comment', ev.target.value)}
                placeholder="Observación (opcional)"
                style={{ ...inp, width: isMobile ? 110 : 240, fontSize: 12, padding: '6px 10px' }} />
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="no-print" style={{ marginBottom: 20 }}>
          <label style={lbl}>Observaciones generales</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Novedades de la sesión, compromisos…"
            style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
      )}

      {canEdit && (
        <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
          <Btn variant="secondary" disabled={!!saving || !entries.length} onClick={() => persist(false)}>
            {saving === 'draft' ? '⏳' : '💾'} Guardar borrador
          </Btn>
          <Btn variant="gradient" disabled={!!saving || !entries.length} onClick={() => persist(true)}>
            {saving === 'final' ? '⏳' : '🔒'} Cerrar acta
          </Btn>
        </div>
      )}

      {isFinal && (
        <div className="no-print" style={{ padding: '12px 16px', borderRadius: 12, background: '#CCFBF1', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#0D9488', margin: 0, fontWeight: 600 }}>
            🔒 Esta acta ya fue cerrada el {new Date(record.finalized_at || record.updated_at).toLocaleString('es-CO')}.
            Puedes imprimirla, pero no editarla.
          </p>
        </div>
      )}

      {/* ── El documento: lo único que sale impreso ── */}
      <div id="clone-print" style={{ ...card, background: '#fff', color: '#1a1a2e',
        padding: isMobile ? 20 : 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>ACTA DE ASISTENCIA</h1>
          <div style={{ fontSize: 13, color: '#444' }}>
            {group?.name}{group?.grade ? ` · ${group.grade}` : ''}
          </div>
        </div>

        <table style={{ width: '100%', fontSize: 12, marginBottom: 20, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', width: 100, color: '#666' }}>Fecha</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{fmtFecha(sessionDate)}</td>
              <td style={{ padding: '4px 0', width: 90, color: '#666' }}>Lugar</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{place || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#666' }}>Docente</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{user?.name || '—'}</td>
              <td style={{ padding: '4px 0', color: '#666' }}>Asistencia</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{presentes} de {entries.length}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#666' }}>Tema</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }} colSpan={3}>{topic || '—'}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 22 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', width: 26 }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Alumno</th>
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
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            color: '#666', marginBottom: 6 }}>Observaciones generales</div>
          <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, minHeight: 34 }}>
            {notes || '—'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 50 }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: 5, fontSize: 11 }}>
              {user?.name || ''}<br /><span style={{ color: '#666' }}>Docente</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid #1a1a2e', paddingTop: 5, fontSize: 11 }}>
              <br /><span style={{ color: '#666' }}>Coordinación</span>
            </div>
          </div>
        </div>

        {record?.finalized_at && (
          <p style={{ fontSize: 9, color: '#999', marginTop: 22, textAlign: 'center' }}>
            Acta cerrada el {new Date(record.finalized_at).toLocaleString('es-CO')} · Experia by CEINFES
          </p>
        )}
      </div>
    </div>
  )
}

export default CloneAttendancePage
