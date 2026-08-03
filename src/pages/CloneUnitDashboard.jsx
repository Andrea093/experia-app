import React from 'react'
import { useStore, nav, completeNode, loadCloneUnitPlan } from '../store/store.jsx'
import { useMobile, Btn, Skeleton } from '../components/ui.jsx'
import { useMyCloneGroups, GroupPicker, card, PRINT_CSS } from '../components/cloneShared.jsx'

// ── Tablero de unidades del libro (módulo `clone_dashboard`, 0052) ───────────
// Último paso de la ruta del docente clon: le muestra, de solo lectura, el orden
// en que debe trabajar las unidades del libro FÍSICO con sus alumnos y los ejes
// articuladores que aplican a cada una. Lo define su TUTOR por grupo desde
// "Grupos y listados" (CloneGroups.jsx) — aquí nada se edita.
//
// El plan cuelga del GRUPO, no del módulo: si el docente tiene más de un grupo,
// elige cuál mirar. El nodo de la ruta se completa al abrirlo (haya plan o no):
// si dependiera de que el tutor ya lo hubiera cargado, un tutor despistado
// dejaría la ruta trabada, que es justo el problema del acta de cierre (§12).

// Paleta rotativa para los ejes: el mismo eje conserva su color en todas las
// unidades (el índice sale del catálogo derivado del plan, no de la posición
// dentro de la unidad), así se reconocen de un vistazo al bajar por la lista.
const EJE_COLORS = [
  { bg: '#FEF3C7', fg: '#B45309' }, { bg: 'var(--purple-bg)', fg: 'var(--purple)' },
  { bg: '#CCFBF1', fg: '#0D9488' }, { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: 'var(--orange-bg)', fg: 'var(--orange)' }, { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#DCFCE7', fg: '#15803D' }, { bg: '#E0E7FF', fg: '#4338CA' },
]

const Chip = ({ text, color }) => (
  <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
    background: color.bg, color: color.fg, whiteSpace: 'nowrap' }}>{text}</span>
)

const Stat = ({ value, label }) => (
  <div style={{ ...card, padding: '12px 16px', minWidth: 108 }}>
    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase',
      letterSpacing: .8, marginTop: 2 }}>{label}</div>
  </div>
)

const CloneUnitDashboard = () => {
  const moduleId  = useStore(s => s.nodeId)
  const completed = useStore(s => s.completed || [])
  const isMobile  = useMobile()

  const { groups, group, groupId, setGroupId, loading: loadingGroups, error: groupsErr } = useMyCloneGroups()

  const [plan, setPlan]       = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!groupId) { setPlan(null); setLoading(loadingGroups); return }
    let alive = true
    setLoading(true)
    loadCloneUnitPlan(groupId).then(({ plan: p }) => {
      if (!alive) return
      setPlan(p); setLoading(false)
    })
    return () => { alive = false }
  }, [groupId, loadingGroups])

  // Se completa al abrirlo. completeNode ignora ids ya completados, así que el
  // efecto es idempotente aunque el docente entre varias veces.
  React.useEffect(() => {
    if (moduleId && !completed.includes(moduleId)) completeNode(moduleId)
  }, [moduleId, completed])

  const units = plan?.units || []
  // Catálogo de ejes en orden de aparición: fija el color de cada eje.
  const ejeIndex = React.useMemo(() => {
    const m = new Map()
    units.forEach(u => (u.ejes || []).forEach(e => { if (!m.has(e)) m.set(e, m.size) }))
    return m
  }, [units])
  const colorFor = (eje) => EJE_COLORS[(ejeIndex.get(eje) ?? 0) % EJE_COLORS.length]

  const pad = isMobile ? '0 16px 40px' : '0 24px 40px'

  if (loadingGroups || loading) return (
    <div style={{ height: '100%', overflow: 'auto', padding: pad }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 860 }}>
        {[1, 2, 3, 4].map(i => <Skeleton key={i} h={64} />)}
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: pad }}>
      <style>{PRINT_CSS}</style>

      <div className="no-print" style={{ display: 'flex', alignItems: 'flex-end', gap: 12,
        flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <button onClick={() => nav('map')} style={{ background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 600,
            color: 'var(--muted)', marginBottom: 4 }}>← Volver al mapa</button>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>
            Plan de unidades del libro
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '3px 0 0' }}>
            El orden en que debes trabajar las unidades con tus alumnos y los ejes articuladores de cada una.
          </p>
        </div>
        <GroupPicker groups={groups} groupId={groupId} setGroupId={setGroupId} />
        {units.length > 0 && (
          <Btn variant="secondary" size="sm" onClick={() => window.print()}>🖨 Imprimir</Btn>
        )}
      </div>

      {groupsErr && (
        <p className="no-print" style={{ fontSize: 13, color: 'var(--error)', fontWeight: 600, marginBottom: 14 }}>
          ⚠️ {groupsErr}
        </p>
      )}

      {!group ? (
        <div style={{ ...card, padding: '20px 24px', maxWidth: 620 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
            Todavía no tienes un grupo asignado
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Tu tutor crea el grupo y define ahí el plan de unidades. Apenas lo haga, lo verás en esta pantalla.
          </p>
        </div>
      ) : units.length === 0 ? (
        <div style={{ ...card, padding: '20px 24px', maxWidth: 620 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
            Tu tutor aún no ha publicado el plan
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Cuando cargue el orden de las unidades del libro para <strong>{group.name}</strong>,
            aparecerá aquí con sus ejes articuladores. Ya puedes seguir con el resto de tu ruta.
          </p>
        </div>
      ) : (
        <div id="clone-print" style={{ maxWidth: 860 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase',
              letterSpacing: .8 }}>
              {group.name}{group.grade ? ` · ${group.grade}` : ''}
            </div>
            {plan?.book_title && (
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--dark)', marginTop: 2 }}>
                📕 {plan.book_title}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <Stat value={units.length} label="Unidades" />
            <Stat value={ejeIndex.size} label="Ejes" />
          </div>

          {plan?.intro && (
            <div style={{ ...card, padding: '14px 16px', marginBottom: 16, background: 'var(--orange-bg)',
              borderColor: 'var(--orange-pale, var(--border))' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-sec)', margin: 0, lineHeight: 1.65,
                whiteSpace: 'pre-wrap' }}>{plan.intro}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {units.map((u, i) => (
              <div key={i} style={{ ...card, padding: '14px 16px', display: 'flex', gap: 14,
                alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'var(--orange)', color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 15, fontWeight: 900 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.35 }}>
                    {u.title}
                  </div>
                  {(u.ejes || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {u.ejes.map((e, j) => <Chip key={j} text={e} color={colorFor(e)} />)}
                    </div>
                  )}
                  {u.notes && (
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap' }}>{u.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {plan?.updated_at && (
            <p style={{ fontSize: 11.5, color: 'var(--subtle)', margin: '14px 0 0' }}>
              Última actualización de tu tutor: {new Date(plan.updated_at).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default CloneUnitDashboard
