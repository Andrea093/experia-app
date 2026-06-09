import React from 'react'
import { Modal } from '../ui.jsx'
import { CHALLENGE_TYPES, CTYPE_EMOJI } from './constants.js'

// ── Lesson content display (read-only) ──────────────────────
const LessonPreviewContent = ({ mod }) => {
  const renderSection = (sec, i) => {
    if (sec.type === 'intro') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{sec.title}</h3>
        <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.8 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'text') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>{sec.title}</h4>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.8 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'callout') return (
      <div key={i} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '4px solid var(--purple)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>{sec.icon || '💡'}</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple-deep)' }}>{sec.title}</h4>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{sec.text}</p>
      </div>
    )
    if (sec.type === 'concepts') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{sec.title}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
          {(sec.items || []).map((item, j) => (
            <div key={j} style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--white)' }}>
              <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>{item.t}</h5>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    )
    if (sec.type === 'compare') return (
      <div key={i} style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{sec.title}</h4>
        <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 10 }}>{sec.label}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Enfoque Tradicional</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{sec.trad}</p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Enfoque DCE</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{sec.dce}</p>
          </div>
        </div>
      </div>
    )
    if (sec.type === 'video') {
      const vid = sec.url?.includes('v=') ? sec.url.split('v=')[1]?.split('&')[0] : sec.url?.split('youtu.be/')[1]?.split('?')[0] || sec.url
      return (
        <div key={i} style={{ marginBottom: 24 }}>
          {sec.title && <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>{sec.title}</h4>}
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--sh-md)' }}>
            <iframe src={`https://www.youtube.com/embed/${vid}?rel=0`} title={sec.title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      {mod.task && (
        <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 12,
          background: '#FFF7ED', border: '1.5px solid #FDBA74', marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>¿Qué debe hacer el estudiante?</div>
            <p style={{ fontSize: 13, color: '#7C2D12', lineHeight: 1.6, margin: 0 }}>{mod.task}</p>
          </div>
        </div>
      )}
      {(mod.content || []).map((sec, i) => renderSection(sec, i))}
      {!(mod.content?.length) && (
        <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Este módulo no tiene contenido configurado aún.</p>
      )}
    </div>
  )
}

// ── Challenge answer-key preview ─────────────────────────────
const ChallengePreviewContent = ({ mod }) => {
  if (mod.ctype === 'dragdrop') {
    const items = mod.dragItems || mod.override?.dragItems || ['Empatizar','Definir','Idear','Prototipar','Evaluar']
    const colors = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B']
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante arrastrará estos elementos y deberá colocarlos en este orden:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
              background: 'var(--white)', border: `2px solid ${colors[i % colors.length]}30` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: colors[i % colors.length] + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14,
                color: colors[i % colors.length], flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{item}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>✓ Posición correcta</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'empathy') {
    const cards = mod.empathyCards || mod.override?.empathyCards || []
    const quadrants = ['piensa','siente','dice','hace']
    const qIcons = { piensa:'🧠', siente:'❤️', dice:'💬', hace:'🤲' }
    const qColors = { piensa:'#3B82F6', siente:'#EF4444', dice:'#10B981', hace:'#F59E0B' }
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante clasificará estas tarjetas en los cuadrantes del Mapa de Empatía:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {quadrants.map(q => {
            const qCards = cards.filter(c => c.correct === q)
            return (
              <div key={q} style={{ padding: '12px 14px', borderRadius: 12, background: qColors[q] + '10', border: `1.5px solid ${qColors[q]}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{qIcons[q]}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: qColors[q] }}>{q.charAt(0).toUpperCase() + q.slice(1)}</span>
                </div>
                {qCards.length === 0 ? <p style={{ fontSize: 11, color: 'var(--subtle)', fontStyle: 'italic', margin: 0 }}>Sin tarjetas</p>
                  : qCards.map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--dark)', padding: '6px 8px', borderRadius: 8,
                      background: 'var(--white)', marginBottom: 4, border: '1px solid ' + qColors[q] + '30' }}>{c.text}</div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'matching') {
    const pairs = mod.matchPairs || mod.override?.matchPairs || []
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante conectará cada concepto con su definición correcta:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--white)', border: `2px solid ${p.color}`, fontWeight: 700, fontSize: 13, color: p.color }}>{p.concept}</div>
              <span style={{ fontSize: 18, color: 'var(--success)' }}>↔</span>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: p.color + '10', border: `1.5px solid ${p.color}50`, fontSize: 13, color: 'var(--dark)' }}>{p.def}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (mod.ctype === 'simulation') {
    const tree = mod.simTree || mod.override?.simTree || {}
    const nodeIds = Object.keys(tree)
    if (!nodeIds.length) return <p style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin árbol de decisiones configurado.</p>
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante navegará por este árbol de decisiones pedagógicas:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nodeIds.map(nid => {
            const node = tree[nid]
            return (
              <div key={nid} style={{ padding: '12px 14px', borderRadius: 12,
                background: node.end ? '#F0FDF4' : 'var(--white)',
                border: node.end ? '1px solid #BBF7D0' : '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: node.end ? 'var(--success)' : 'var(--orange)',
                  textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>
                  {nid === 'start' ? '🟢 INICIO' : node.end ? '✅ RESULTADO' : `📍 ${nid}`}
                </div>
                <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.6, margin: 0, marginBottom: node.options?.length ? 8 : 0 }}>{node.text}</p>
                {node.options?.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                    background: 'var(--bg)', marginBottom: 4, border: '1px solid var(--border)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: opt.points===3?'var(--success)':opt.points===2?'var(--warn)':'var(--error)',
                      color:'#fff', fontWeight: 800, fontSize: 11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {opt.points}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--dark)', flex: 1 }}>{opt.text}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>→ {opt.next}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>El color del badge indica los puntos: 🟢 3pts · 🟡 2pts · 🔴 1pt</p>
      </div>
    )
  }

  if (mod.ctype === 'quiz') {
    const qs = mod.questions || []
    return (
      <div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>El estudiante responderá {qs.length} pregunta{qs.length !== 1 ? 's' : ''} de opción múltiple:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {qs.map((q, qi) => (
            <div key={qi} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--white)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 10 }}>{qi + 1}. {q.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                    background: oi === q.correct ? '#F0FDF4' : 'var(--bg)',
                    border: oi === q.correct ? '1.5px solid var(--success)' : '1px solid var(--border)' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, background: oi === q.correct ? 'var(--success)' : 'var(--bg-alt)',
                      color: oi === q.correct ? '#fff' : 'var(--muted)', fontWeight: 700, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: oi === q.correct ? 600 : 400 }}>{opt}</span>
                    {oi === q.correct && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ Correcta</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>Vista previa no disponible para este tipo de reto.</p>
}

// ── Route Preview Modal (list + drill-down) ──────────────────
const RoutePreviewModal = ({ open, onClose, area, moduleList, customModules }) => {
  const [viewing, setViewing] = React.useState(null)

  React.useEffect(() => { if (!open) setViewing(null) }, [open])

  const merged = React.useMemo(() => {
    if (!moduleList) return []
    const base = moduleList.map((m, i) => ({ ...m, _order: i }))
    const customs = (customModules || []).map(m => ({ ...m, isCustom: true, _order: (m.order ?? 999) + 0.5 }))
    return [...base, ...customs].sort((a, b) => a._order - b._order)
  }, [moduleList, customModules])

  const enabled = merged.filter(m => m.enabled !== false)

  if (viewing) {
    const isLesson = viewing.type === 'lesson'
    return (
      <Modal open={open} onClose={onClose} title={viewing.title} width={680}>
        <div style={{ maxHeight: '78vh', overflow: 'auto', paddingRight: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setViewing(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              ← Volver a la ruta
            </button>
            {viewing.xp > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-bg)', padding: '4px 10px', borderRadius: 8 }}>
                +{viewing.xp} XP
              </span>
            )}
            {viewing.isCustom && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: '#D1FAE5', color: 'var(--success)' }}>PERSONALIZADO</span>
            )}
          </div>
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--gradient)', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              {viewing.subtitle || (isLesson ? 'Módulo' : 'Reto')}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{viewing.title}</h2>
            {viewing.desc && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>{viewing.desc}</p>}
            <div style={{ marginTop: 10, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,.2)', display: 'inline-block' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>👁 MODO VISTA PREVIA — Solo visible para el instructor</span>
            </div>
          </div>
          {isLesson ? <LessonPreviewContent mod={viewing} /> : <ChallengePreviewContent mod={viewing} />}
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Vista previa de la ruta" width={600}>
      <div style={{ maxHeight: '75vh', overflow: 'auto', paddingRight: 4 }}>
        {area && (
          <div style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 18,
            background: `linear-gradient(135deg, ${area.color}18, ${area.color}06)`,
            border: `2px solid ${area.color}25`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{area.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>{area.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {enabled.length} activo{enabled.length !== 1 ? 's' : ''}
                {' · '}{enabled.reduce((s, m) => s + (m.xp || 0), 0)} XP total
                {' · '}<span style={{ color: 'var(--orange)' }}>Haz clic en cualquier tarjeta para ver su contenido</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {merged.map((mod, i) => {
            const isChallenge = mod.type === 'challenge' || mod.type === 'evaluation'
            const isDisabled = mod.enabled === false
            const color = isChallenge ? 'var(--purple)' : 'var(--orange)'
            const bg    = isChallenge ? 'var(--purple-bg)' : 'var(--orange-bg)'
            const emoji = isChallenge ? (CTYPE_EMOJI[mod.ctype] || '⚡') : '📖'
            return (
              <React.Fragment key={mod.id || i}>
                <div onClick={() => !isDisabled && setViewing(mod)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, background: isDisabled ? 'var(--bg)' : 'var(--white)',
                    border: isDisabled ? '1px dashed var(--border)' : mod.isCustom ? '2px solid #D1FAE5' : '1px solid var(--border)',
                    opacity: isDisabled ? .45 : 1, cursor: isDisabled ? 'default' : 'pointer', transition: 'all .15s' }}
                  onMouseEnter={e => !isDisabled && (e.currentTarget.style.boxShadow = 'var(--sh-md)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: isDisabled ? 'var(--bg-alt)' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {isDisabled ? '🔒' : emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: bg, color, textTransform: 'uppercase', letterSpacing: .8 }}>
                        {isChallenge ? (CHALLENGE_TYPES.find(t => t.id === mod.ctype)?.label || 'RETO') : 'MÓDULO'}
                      </span>
                      {mod.isCustom && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#D1FAE5', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: .8 }}>PERSONALIZADO</span>}
                      {mod.override && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>EDITADO</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDisabled ? 'var(--subtle)' : 'var(--dark)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                  </div>
                  {mod.xp > 0 && !isDisabled && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-bg)', padding: '3px 7px', borderRadius: 7, flexShrink: 0 }}>+{mod.xp}</span>}
                  {!isDisabled && <span style={{ fontSize: 16, color: 'var(--muted)', flexShrink: 0 }}>›</span>}
                </div>
                {i < merged.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 2, height: 10, background: isDisabled ? 'var(--border)' : 'var(--orange)', borderRadius: 2, opacity: .4 }} />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {!merged.length && <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>No hay módulos configurados.</p>}

        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)',
          display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {[
            { label: 'Módulos', value: enabled.filter(m => m.type === 'lesson').length, color: 'var(--orange)' },
            { label: 'Retos',   value: enabled.filter(m => m.type !== 'lesson').length, color: 'var(--purple)' },
            { label: 'Custom',  value: merged.filter(m => m.isCustom).length,           color: 'var(--success)' },
            { label: 'XP',      value: enabled.reduce((s, m) => s + (m.xp || 0), 0),  color: 'var(--warn)' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default RoutePreviewModal
