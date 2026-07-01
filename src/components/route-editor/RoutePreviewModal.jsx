import React from 'react'
import { Modal } from '../ui.jsx'
import { CHALLENGE_TYPES, CTYPE_EMOJI } from './constants.js'
import { getCharacter } from '../../lib/characters.jsx'
import { LessonBody } from '../../pages/lesson.jsx'
import { CHALLENGE_COMPONENTS } from '../../pages/challenges.jsx'
import { setPreviewMode } from '../../store/store.jsx'

// Etiqueta legible por tema inmersivo (el personaje/paleta viene de characters.jsx)
const THEME_LABELS = {
  detective: 'Tema Detective',
  'escape-room': 'Tema Escape Room',
  lab: 'Tema Laboratorio',
  'time-travel': 'Tema Viaje en el Tiempo',
}

// Deriva la paleta visual del preview a partir del personaje del tema.
const themePalette = (theme) => {
  const character = theme ? getCharacter(theme) : null
  if (!character) return null
  const accent = character.ui.nameColor
  const base = character.ui.bgAvatar
  return {
    accent, base,
    gradient: `linear-gradient(135deg, ${base} 0%, ${accent}26 140%)`,
    glow: character.ui.glow,
    Avatar: character.Avatar,
    charName: character.name,
    label: THEME_LABELS[theme] || 'Tema inmersivo',
  }
}

// Normaliza el módulo del editor a la forma que consumen los componentes del
// estudiante: fusiona `override` para reflejar los cambios (aún sin publicar).
const toStudentMod = (m) => ({ ...m, ...(m.override || {}) })

// Nota para el paso de Entrega Final (el estudiante sube documentos en otra pantalla).
const FinalDeliveryNote = ({ mod }) => (
  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
    <div style={{ fontSize: 44, marginBottom: 12 }}>🎯</div>
    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{mod.title || 'Entrega Final'}</h3>
    {mod.desc && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 8px' }}>{mod.desc}</p>}
    <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 460, margin: '0 auto' }}>
      En este paso el estudiante sube sus documentos (rejilla y pregunta) para que el instructor los revise y califique.
    </p>
  </div>
)

// ── Route Preview Modal (list + drill-down que renderiza la vista real del estudiante) ──
const RoutePreviewModal = ({ open, onClose, area, moduleList, customModules, theme }) => {
  const [viewing, setViewing] = React.useState(null)
  const themed = React.useMemo(() => themePalette(theme), [theme])

  React.useEffect(() => { if (!open) setViewing(null) }, [open])

  // Mientras se explora un módulo/reto en vista previa, ningún intento del reto
  // se registra ni afecta el progreso real (recordAttempt queda en no-op).
  React.useEffect(() => {
    setPreviewMode(!!(open && viewing))
    return () => setPreviewMode(false)
  }, [open, viewing])

  const merged = React.useMemo(() => {
    if (!moduleList) return []
    const base = moduleList.map((m, i) => ({ ...m, _order: i }))
    const customs = (customModules || []).map(m => ({ ...m, isCustom: true, _order: (m.order ?? 999) + 0.5 }))
    return [...base, ...customs].sort((a, b) => a._order - b._order)
  }, [moduleList, customModules])

  const enabled = merged.filter(m => m.enabled !== false)

  if (viewing) {
    const isLesson = viewing.type === 'lesson'
    const isFinal  = viewing.type === 'final_delivery'
    const studentMod = toStudentMod(viewing)
    const Comp = (!isLesson && !isFinal)
      ? (CHALLENGE_COMPONENTS[studentMod.ctype] || CHALLENGE_COMPONENTS.designlab)
      : null

    return (
      <Modal open={open} onClose={onClose} title={viewing.title} width={760}>
        <div style={{ maxHeight: '80vh', overflow: 'auto', paddingRight: 4 }}>
          {/* Barra de vista previa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setViewing(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
              ← Volver a la ruta
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
              padding: '5px 10px', borderRadius: 8,
              background: themed ? `${themed.accent}1a` : 'var(--orange-bg)',
              color: themed ? themed.accent : 'var(--orange)' }}>
              👁 Vista previa — así lo ve el estudiante
            </span>
            {viewing.xp > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', background: 'var(--orange-bg)', padding: '4px 10px', borderRadius: 8 }}>
                +{viewing.xp} XP
              </span>
            )}
            {viewing.isCustom && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: '#CCFBF1', color: 'var(--success)' }}>PERSONALIZADO</span>
            )}
          </div>

          {/* Pantalla real del estudiante */}
          <div style={{ background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)',
            padding: '28px 20px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {isLesson && <LessonBody mod={studentMod} />}
              {isFinal && <FinalDeliveryNote mod={studentMod} />}
              {Comp && (
                <>
                  {studentMod.task && (
                    <div className="ls-task-box" style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>📋</span>
                      <div>
                        <div className="ls-task-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>¿Qué debes hacer?</div>
                        <p className="ls-task-text" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{studentMod.task}</p>
                      </div>
                    </div>
                  )}
                  <Comp mod={studentMod} onComplete={() => setViewing(null)} />
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Vista previa de la ruta" width={600}>
      <div style={{ maxHeight: '75vh', overflow: 'auto', paddingRight: 4 }}>
        {themed ? (
          <div style={{ padding: '16px 18px', borderRadius: 14, marginBottom: 18,
            background: themed.gradient, border: `1.5px solid ${themed.accent}40`,
            boxShadow: themed.glow, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden', border: `2px solid ${themed.accent}`, background: themed.base }}>
              <themed.Avatar />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: themed.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
                {themed.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{themed.charName}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 3 }}>
                {enabled.length} activo{enabled.length !== 1 ? 's' : ''}
                {' · '}{enabled.reduce((s, m) => s + (m.xp || 0), 0)} XP
                {' · '}<span style={{ color: themed.accent }}>Haz clic en cualquier tarjeta para verla como el estudiante</span>
              </div>
            </div>
          </div>
        ) : area && (
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
                    border: isDisabled ? '1px dashed var(--border)' : mod.isCustom ? '2px solid #CCFBF1' : '1px solid var(--border)',
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
                      {mod.isCustom && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: '#CCFBF1', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: .8 }}>PERSONALIZADO</span>}
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
