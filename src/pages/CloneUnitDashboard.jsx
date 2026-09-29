import React from 'react'
import { useStore, nav, completeNode, loadCloneUnitPlan, findModule } from '../store/store.jsx'
import { useMobile, Btn, Skeleton } from '../components/ui.jsx'
import { useMyCloneGroups, GroupPicker, card, PRINT_CSS, fmtPct1, vizColor } from '../components/cloneShared.jsx'
import { LessonSection } from './lesson.jsx'

// ── Tablero de unidades del libro (módulo `clone_dashboard`, 0052) ───────────
// Último paso de la ruta del docente clon: le muestra, de solo lectura, el orden
// en que debe trabajar las unidades del libro FÍSICO con sus alumnos y la gráfica
// de ejes articuladores. Lo define su TUTOR por grupo desde "Grupos y listados"
// (CloneGroups.jsx) — aquí nada se edita.
//
// ⚠️ "Ejes articuladores" = las barras de la gráfica (`plan.chart`, 0053). Los
// `ejes` por unidad (0052) siguen en los datos pero NO se pintan aquí (sep 2026,
// a pedido del piloto): dos cosas distintas con el mismo nombre confundían.
//
// El plan cuelga del GRUPO, no del módulo: si el docente tiene más de un grupo,
// elige cuál mirar. El nodo de la ruta se completa al abrirlo (haya plan o no):
// si dependiera de que el tutor ya lo hubiera cargado, un tutor despistado
// dejaría la ruta trabada, que es justo el problema del acta de cierre (§12).

// ── Gráfica de ejes articuladores ───────────────────────────────────────────
// Barras horizontales parametrizadas por el TUTOR: él escribe el texto de cada
// eje, su valor y su color. Aquí no se calcula ni se ordena nada — se pinta lo
// que él cargó, en el orden en que lo dejó.
//
// ⚠️ La escala es 0–100 LITERAL (barra llena = 100), no relativa al mayor: así
// dos grupos o dos planes distintos se pueden comparar mirando la misma barra.
// ⚠️ Cada barra lleva SIEMPRE su nombre y su valor en texto: la paleta de
// `--viz-N` está validada para daltonismo con esa condición (ver styles.css).
// No convertir los rótulos en leyenda ni en tooltip.
// El valor se muestra tal cual (sin "%"): el tutor puede estar cargando un
// porcentaje o un puntaje, y poner un símbolo que él no escribió sería inventar
// una unidad. La escala la explica la nota al pie.
const fmtVal = (n) => Number.isFinite(n) ? String(Math.round(n * 10) / 10).replace('.', ',') : '—'

const TransversalChart = ({ title, bars }) => (
  <div style={{ ...card, padding: '16px 18px' }}>
    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)', margin: '0 0 14px' }}>
      {title || 'Ejes articuladores'}
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {bars.map((b, i) => (
        <div key={i} title={`${b.label} — ${fmtVal(b.value)} de 100`}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            {/* El nombre se parte en varias líneas en vez de cortarse: los ejes
                son frases completas y un "…" escondía justo la parte que las
                distingue. */}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-sec)', flex: 1,
              minWidth: 0, lineHeight: 1.35 }}>
              {b.label}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--dark)',
              fontVariantNumeric: 'tabular-nums' }}>{fmtVal(b.value)}</span>
          </div>
          {/* La pista completa ES la escala: su ancho representa el 100. */}
          <div style={{ height: 10, borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
            {/* printColorAdjust: sin esto el navegador descarta los fondos al
                imprimir y las barras salen en blanco. */}
            <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, b.value))}%`,
              background: vizColor(b.color), borderRadius: '3px 6px 6px 3px',
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
          </div>
        </div>
      ))}
    </div>
    <p style={{ fontSize: 11, color: 'var(--subtle)', margin: '12px 0 0' }}>
      La barra completa equivale a 100. Los valores los define tu tutor.
    </p>
  </div>
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

  // Material del libro: vive en el `content` del PROPIO módulo (se edita en el
  // editor de ruta como cualquier lección), porque es el mismo para todos los
  // grupos del curso — a diferencia del plan, que es por grupo. Se muestra
  // aunque el tutor aún no haya cargado el plan: el docente necesita el libro
  // desde el primer día.
  // El PDF propio del GRUPO (`plan.book_url`, 0068) tiene prioridad: cada
  // docente puede trabajar una unidad priorizada distinta.
  const courseModules = useStore(s => s.courseModules)
  const bookSections = React.useMemo(() => {
    if (plan?.book_url) return [{ type: 'pdf', title: plan.book_title || 'Libro', url: plan.book_url }]
    return (findModule(moduleId)?.content || []).filter(s => s && s.type !== 'pagebreak')
  }, [moduleId, courseModules, plan])

  const units = plan?.units || []

  // La gráfica solo aparece si el tutor cargó barras; un plan sin ellas sigue
  // siendo un plan válido (solo el orden de trabajo).
  const chartBars = React.useMemo(
    () => (plan?.chart?.bars || []).filter(b => b && b.label), [plan])

  // "Cuando se pueda": solo con las dos cosas cargadas y en pantalla ancha.
  const twoCols = !isMobile && chartBars.length > 0 && units.length > 0

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
            El orden en que debes trabajar las unidades con tus alumnos y los ejes articuladores.
          </p>
        </div>
        <GroupPicker groups={groups} groupId={groupId} setGroupId={setGroupId} />
        {(units.length > 0 || chartBars.length > 0) && (
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
      ) : units.length === 0 && chartBars.length === 0 ? (
        <div style={{ ...card, padding: '20px 24px', maxWidth: 620 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', margin: '0 0 6px' }}>
            Tu tutor aún no ha publicado el plan
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Cuando cargue el orden de las unidades del libro para <strong>{group.name}</strong>,
            aparecerá aquí junto con los ejes articuladores. Ya puedes seguir con el resto de tu ruta.
          </p>
        </div>
      ) : (
        <div id="clone-print" style={{ maxWidth: twoCols ? 1180 : 860 }}>
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

          {/* Cada tarjeta solo aparece si hay de qué contar: un cero se lee como
              "no hay nada" justo al lado de lo que sí está cargado. */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {units.length > 0 && <Stat value={units.length} label="Unidades" />}
            {chartBars.length > 0 && <Stat value={chartBars.length} label="Ejes articuladores" />}
          </div>

          {plan?.intro && (
            <div style={{ ...card, padding: '14px 16px', marginBottom: 16, background: 'var(--orange-bg)',
              borderColor: 'var(--orange-pale, var(--border))' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-sec)', margin: 0, lineHeight: 1.65,
                whiteSpace: 'pre-wrap' }}>{plan.intro}</p>
            </div>
          )}

          {/* Ejes y orden LADO A LADO cuando hay espacio: son las dos mitades
              de la misma indicación y el docente las cruza mientras planea. En
              móvil (o si falta una de las dos) se apilan — a menos de ~380 px
              por columna, ni los nombres de los ejes ni los títulos de las
              unidades caben sin partirse. */}
          <div style={{ display: 'grid', gap: 16, alignItems: 'start',
            gridTemplateColumns: twoCols ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr' }}>
            {chartBars.length > 0 && (
              // En dos columnas la gráfica queda fija: la lista de unidades es
              // larga y la idea es poder cruzarla con los ejes sin devolverse.
              <div style={twoCols ? { position: 'sticky', top: 0 } : undefined}>
                <TransversalChart title={plan?.chart?.title} bars={chartBars} />
              </div>
            )}

            {units.length > 0 && <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)', margin: '0 0 10px' }}>
                Orden de trabajo
              </h3>
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
                  {(typeof u.coverage === 'number' || typeof u.priority === 'number' || u.level) && (
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6,
                      fontSize: 12, color: 'var(--muted)' }}>
                      {typeof u.coverage === 'number' && (
                        <span>Cobertura diagnóstica{' '}
                          <strong style={{ color: 'var(--text-sec)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPct1(u.coverage)}</strong>
                        </span>
                      )}
                      {typeof u.priority === 'number' && (
                        <span>Prioridad{' '}
                          <strong style={{ color: 'var(--text-sec)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPct1(u.priority)}</strong>
                        </span>
                      )}
                      {u.level && <span>Nivel <strong style={{ color: 'var(--text-sec)' }}>{u.level}</strong></span>}
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
            </div>}
          </div>

          {plan?.updated_at && (
            <p style={{ fontSize: 11.5, color: 'var(--subtle)', margin: '14px 0 0' }}>
              Última actualización de tu tutor: {new Date(plan.updated_at).toLocaleDateString('es-CO')}
            </p>
          )}
        </div>
      )}

      {/* El libro, en la misma ventana que los ejes y el orden de trabajo: el
          docente lo consulta mientras cruza ambas cosas. Fuera de #clone-print
          a propósito — un PDF incrustado no se imprime. */}
      {bookSections.length > 0 && (
        <div className="no-print" style={{ maxWidth: twoCols ? 1180 : 860, marginTop: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)', margin: '0 0 4px' }}>
            📕 Libro
          </h3>
          {bookSections.map((sec, i) => <LessonSection key={i} section={sec} index={i} />)}
        </div>
      )}
    </div>
  )
}

export default CloneUnitDashboard
