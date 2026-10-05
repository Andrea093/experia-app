import React from 'react'

// =============================================
// Resultados Saber del colegio (sección de lección `saber-results`).
// Módulo 3 ("Bitácora") de las rutas por asignatura: cómo le va al colegio
// por COMPETENCIA y por COMPONENTE de la prueba, frente al promedio nacional,
// y cómo se reparten sus estudiantes en los 4 niveles de desempeño.
//
// Los datos viajan dentro de la sección (content jsonb) — hoy son SINTÉTICOS
// (`synthetic: true`, lo dice la tarjeta). Cuando haya resultados reales del
// colegio basta con reemplazar los números de la sección; el componente no
// cambia.
//
//   { type:'saber-results', title, area, year, synthetic,
//     score: { school, national },                       // puntaje 0–100
//     competencias: [{ name, school, national }],        // % de acierto
//     componentes:  [{ name, school, national }],
//     niveles:      [{ name, pct }]   (4, de 1 a 4; suman 100)
//     focus?: nombre del componente a resaltar (cursos de Biología/Física/Química) }
//
// Gráficas (guía dataviz): barras horizontales finas de UNA serie (colegio,
// --viz-1) con una marca de referencia (promedio nacional, tinta neutra) —
// no barras dobles; valor en la punta; grilla de líneas finas; niveles como
// barra 100 % apilada con rampa ORDINAL de un solo tono y 2 px de separación.
// Toda cifra también está en "Ver como tabla"; el tooltip no es la única vía.
// =============================================

const pctFmt = (v) => `${Math.round(v)} %`
const signFmt = (d) => (d > 0 ? `+${d}` : `${d}`)

// Rampa ordinal de un solo tono, validada (styles.css → --lvl-1..4), con su
// tinta legible para las cifras dentro de cada tramo.
const LEVEL_FILL = [1, 2, 3, 4].map(i => `var(--lvl-${i})`)
const LEVEL_INK  = [1, 2, 3, 4].map(i => `var(--lvl-ink-${i})`)
// Barras "de contexto" cuando se resalta un componente: el paso más tenue de
// la misma rampa (pasa el mínimo de contraste contra la superficie).
const MUTED_BAR = 'var(--lvl-1)'

const card = { background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }
const h4 = { fontSize: 14.5, fontWeight: 800, color: 'var(--dark)', margin: '0 0 2px' }
const sub = { fontSize: 12, color: 'var(--muted)', margin: '0 0 14px' }

const StatTile = ({ label, value, delta, deltaText, note }) => (
  <div style={{ ...card, padding: '14px 16px', flex: '1 1 180px', minWidth: 0 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.15, marginTop: 4, overflowWrap: 'anywhere' }}>{value}</div>
    {delta != null && (
      // El signo y la palabra cargan el sentido; el color solo lo refuerza.
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4, color: delta >= 0 ? 'var(--success)' : 'var(--error)' }}>
        {delta >= 0 ? '▲' : '▼'} {deltaText}
      </div>
    )}
    {note && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{note}</div>}
  </div>
)

const Legend = ({ items }) => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12, color: 'var(--text-sec)' }}>
    {items.map((it, i) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{it.key}{it.label}</span>
    ))}
  </div>
)
const BarKey = ({ color = 'var(--viz-1)' }) => <i style={{ width: 14, height: 10, borderRadius: '0 3px 3px 0', background: color, display: 'inline-block' }} />
const TickKey = () => <i style={{ width: 2, height: 14, background: 'var(--dark)', opacity: .75, display: 'inline-block' }} />

// Colegio (barra) vs. promedio nacional (marca) por ítem.
const CompareBars = ({ rows, focus }) => {
  const [hover, setHover] = React.useState(null)
  const TICKS = [0, 25, 50, 75, 100]
  return (
    <div>
      {rows.map((r, i) => {
        const diff = Math.round(r.school - r.national)
        const muted = focus && r.name !== focus
        return (
          <div key={r.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
            aria-label={`${r.name}: colegio ${pctFmt(r.school)}, promedio nacional ${pctFmt(r.national)}, diferencia ${signFmt(diff)}`}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 38%) 1fr', alignItems: 'center', gap: 12, padding: '6px 0', outline: 'none' }}>
            <div style={{ fontSize: 13, color: 'var(--dark)', fontWeight: muted ? 500 : 700, lineHeight: 1.3 }}>{r.name}</div>
            <div style={{ position: 'relative', height: 28 }}>
              {/* grilla: líneas finas, sólidas, recesivas */}
              {TICKS.map(t => (
                <i key={t} style={{ position: 'absolute', left: `${t}%`, top: 0, bottom: 0, width: 1, background: 'var(--border)', opacity: .7 }} />
              ))}
              {/* barra del colegio: ≤ 24 px, punta redondeada, base recta */}
              <div style={{ position: 'absolute', left: 0, top: 7, height: 14, width: `${r.school}%`, borderRadius: '0 4px 4px 0',
                background: muted ? MUTED_BAR : 'var(--viz-1)',
                transition: 'width .6s ease' }} />
              {/* marca del promedio nacional */}
              <i style={{ position: 'absolute', left: `calc(${r.national}% - 1px)`, top: 2, height: 24, width: 2, background: 'var(--dark)', opacity: .75 }} />
              {/* valor en la punta (texto en tinta, nunca en el color de la serie) */}
              <span style={{ position: 'absolute', left: `calc(${Math.max(r.school, r.national)}% + 8px)`, top: 5, fontSize: 12.5,
                fontWeight: 700, color: 'var(--dark)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {pctFmt(r.school)}
              </span>
              {hover === i && (
                <div role="tooltip" style={{ position: 'absolute', left: `min(${r.school}%, calc(100% - 190px))`, bottom: '100%', marginBottom: 4,
                  zIndex: 5, padding: '8px 10px', borderRadius: 10, background: 'var(--dark)', color: 'var(--white)', fontSize: 12,
                  lineHeight: 1.45, whiteSpace: 'nowrap', boxShadow: 'var(--sh-md)', pointerEvents: 'none' }}>
                  <b>{r.name}</b><br />
                  Colegio: {pctFmt(r.school)} · Nacional: {pctFmt(r.national)}<br />
                  Diferencia: {signFmt(diff)} puntos
                </div>
              )}
            </div>
          </div>
        )
      })}
      {/* eje: 0–100 % de acierto */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 38%) 1fr', gap: 12 }}>
        <span />
        <div style={{ position: 'relative', height: 16, fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
          {TICKS.map(t => (
            <span key={t} style={{ position: 'absolute', left: `${t}%`, transform: t === 0 ? 'none' : t === 100 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// Niveles de desempeño: barra 100 % apilada, rampa ordinal, 2 px de separación.
const LevelsBar = ({ niveles }) => {
  const [hover, setHover] = React.useState(null)
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, height: 30, background: 'var(--white)' }}>
        {niveles.map((n, i) => (
          <div key={n.name} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            aria-label={`${n.name}: ${pctFmt(n.pct)} de los estudiantes`}
            style={{ position: 'relative', flex: `${n.pct} 0 0`, minWidth: 6, background: LEVEL_FILL[i], outline: 'none',
              borderRadius: i === 0 ? '4px 0 0 4px' : i === niveles.length - 1 ? '0 4px 4px 0' : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* etiqueta adentro solo si cabe con aire; si no, la leyenda y la tabla la cargan */}
            {n.pct >= 10 && <span style={{ fontSize: 12, fontWeight: 800, color: LEVEL_INK[i] }}>{pctFmt(n.pct)}</span>}
            {hover === i && (
              <div role="tooltip" style={{ position: 'absolute', bottom: '100%', marginBottom: 6, zIndex: 5, padding: '6px 10px', borderRadius: 8,
                background: 'var(--dark)', color: 'var(--white)', fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                {n.name}: {pctFmt(n.pct)}
              </div>
            )}
          </div>
        ))}
      </div>
      <Legend items={niveles.map((n, i) => ({
        key: <i style={{ width: 12, height: 12, borderRadius: 3, background: LEVEL_FILL[i], display: 'inline-block', border: '1px solid var(--border)' }} />,
        label: `${n.name} · ${pctFmt(n.pct)}`,
      }))} />
    </div>
  )
}

const DataTable = ({ s }) => {
  const th = { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 700, fontSize: 12 }
  const td = { padding: '6px 10px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--dark)', fontVariantNumeric: 'tabular-nums' }
  const block = (title, rows) => (
    <table style={{ width: '100%', minWidth: 0, borderCollapse: 'collapse', marginBottom: 14 }}>
      <thead><tr><th style={th}>{title}</th><th style={th}>Colegio</th><th style={th}>Nacional</th><th style={th}>Diferencia</th></tr></thead>
      <tbody>{rows.map(r => (
        <tr key={r.name}><td style={td}>{r.name}</td><td style={td}>{pctFmt(r.school)}</td><td style={td}>{pctFmt(r.national)}</td>
          <td style={td}>{signFmt(Math.round(r.school - r.national))}</td></tr>
      ))}</tbody>
    </table>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      {block('Competencia', s.competencias || [])}
      {block('Componente', s.componentes || [])}
      <table style={{ width: '100%', minWidth: 0, borderCollapse: 'collapse' }}>
        <thead><tr><th style={th}>Nivel de desempeño</th><th style={th}>% de estudiantes</th></tr></thead>
        <tbody>{(s.niveles || []).map(n => <tr key={n.name}><td style={td}>{n.name}</td><td style={td}>{pctFmt(n.pct)}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

const SaberResults = ({ section: s }) => {
  const [asTable, setAsTable] = React.useState(false)
  const comps = s.competencias || []
  const parts = s.componentes || []
  const levels = s.niveles || []
  const gap = (r) => r.school - r.national
  const weakComp = [...comps].sort((a, b) => gap(a) - gap(b))[0]
  const weakPart = [...parts].sort((a, b) => gap(a) - gap(b))[0]
  const strongComp = [...comps].sort((a, b) => gap(b) - gap(a))[0]
  const high = levels.slice(2).reduce((acc, n) => acc + n.pct, 0)
  const scoreDiff = s.score ? Math.round(s.score.school - s.score.national) : null

  return (
    <div style={{ margin: '28px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>{s.title || 'Así le fue al colegio en la Prueba Saber'}</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {s.area}{s.year ? ` · ${s.year}` : ''} · % de acierto por competencia y por componente, frente al promedio nacional
          </p>
        </div>
        {s.synthetic && (
          // Fondo transparente: en los temas oscuros --bg-alt es claro y la
          // letra (clara) no se leía.
          <span style={{ fontSize: 11.5, fontWeight: 800, padding: '5px 10px', borderRadius: 20, background: 'transparent',
            color: 'var(--text-sec)', border: '1.5px dashed var(--muted)', whiteSpace: 'nowrap' }}>
            🧪 Datos de ejemplo (sintéticos)
          </span>
        )}
      </div>

      {/* Fila de indicadores */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {s.score && (
          <StatTile label="Puntaje promedio del colegio" value={`${s.score.school} / 100`} delta={scoreDiff}
            deltaText={`${Math.abs(scoreDiff)} ${scoreDiff >= 0 ? 'sobre' : 'bajo'} el promedio nacional (${s.score.national})`} />
        )}
        {levels.length === 4 && (
          <StatTile label="Estudiantes en niveles 3 y 4" value={pctFmt(high)} note="Los niveles más altos de desempeño" />
        )}
        {weakComp && (
          <StatTile label="Competencia a reforzar" value={<span style={{ fontSize: 18, lineHeight: 1.3 }}>{weakComp.name}</span>}
            note={`${pctFmt(weakComp.school)} de acierto · ${signFmt(Math.round(gap(weakComp)))} frente al país`} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setAsTable(t => !t)}
          style={{ padding: '6px 12px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-sec)' }}>
          {asTable ? '📊 Ver gráficas' : '▦ Ver como tabla'}
        </button>
      </div>

      {asTable ? (
        <div style={card}><DataTable s={s} /></div>
      ) : (<>
        {comps.length > 0 && (
          <div style={card}>
            <h4 style={h4}>Por competencia</h4>
            <p style={sub}>Qué tan bien resuelven cada tipo de tarea que pide la prueba.</p>
            <CompareBars rows={comps} />
            <Legend items={[{ key: <BarKey />, label: 'Colegio' }, { key: <TickKey />, label: 'Promedio nacional' }]} />
          </div>
        )}
        {parts.length > 0 && (
          <div style={card}>
            <h4 style={h4}>Por componente</h4>
            <p style={sub}>{s.focus ? `En qué temas de la asignatura les va mejor y peor. Resaltado: ${s.focus}.` : 'En qué temas de la asignatura les va mejor y peor.'}</p>
            <CompareBars rows={parts} focus={s.focus} />
            <Legend items={[{ key: <BarKey />, label: s.focus ? `Colegio — ${s.focus}` : 'Colegio' },
              ...(s.focus ? [{ key: <BarKey color={MUTED_BAR} />, label: 'Colegio — otros componentes' }] : []),
              { key: <TickKey />, label: 'Promedio nacional' }]} />
          </div>
        )}
        {levels.length > 0 && (
          <div style={card}>
            <h4 style={h4}>Niveles de desempeño</h4>
            <p style={sub}>Cómo se reparten los estudiantes del colegio, del nivel 1 (más bajo) al 4 (más alto).</p>
            <LevelsBar niveles={levels} />
          </div>
        )}
      </>)}

      {(weakComp || weakPart) && (
        <div style={{ ...card, background: 'var(--orange-bg)', borderColor: 'var(--orange)' }}>
          <h4 style={{ ...h4, marginBottom: 8 }}>🔎 ¿Qué nos dicen los datos?</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.65 }}>
            {strongComp && gap(strongComp) > 0 && (
              <li><b>Fortaleza:</b> {strongComp.name} ({pctFmt(strongComp.school)}, {signFmt(Math.round(gap(strongComp)))} frente al país).</li>
            )}
            {weakComp && <li><b>Competencia por reforzar:</b> {weakComp.name} — {pctFmt(weakComp.school)} de acierto ({signFmt(Math.round(gap(weakComp)))} frente al país).</li>}
            {weakPart && <li><b>Componente por reforzar:</b> {weakPart.name} — {pctFmt(weakPart.school)} ({signFmt(Math.round(gap(weakPart)))} frente al país).</li>}
            {levels.length === 4 && <li><b>{pctFmt(levels[0].pct + levels[1].pct)}</b> de los estudiantes está en los niveles 1 y 2: hay que llevarlos hacia el 3.</li>}
            <li>Las preguntas de la <b>primera ronda</b> y la <b>ronda final</b> sirven para practicar justo estas competencias.</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default SaberResults
