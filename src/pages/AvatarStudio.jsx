import React from 'react'
import { useStore, saveAvatarConfig, selectAvatarConfig, selectThemedCourses, calcLevel } from '../store/store.jsx'
import { Btn } from '../components/ui.jsx'
import {
  Avatar, SKIN_COLORS, HAIRS, HAIR_COLORS, EYES, MOUTHS, ACCESSORIES, BODY_COLORS, FRAMES,
  RANKS, rankFromLevel, randomAvatar, normalizeAvatar, avatarDisplayName, labelOf, AVATAR_CREDIT,
} from '../lib/avatarKit.jsx'
import { AvatarBody } from '../lib/avatarBody.jsx'

// =============================================================================
// AvatarStudio — pestaña "Mi avatar" del perfil
// -----------------------------------------------------------------------------
// Solo se monta si el estudiante tiene algún curso con tema inmersivo (el guard
// está en profile.jsx). El avatar se guarda en profiles.avatar_config, así que
// es el mismo en todos sus cursos.
//
// Las opciones se eligen viendo el resultado: cada botón es el MISMO avatar con
// una sola pieza cambiada, no un ícono abstracto. Las miniaturas se pintan con
// el valor DIFERIDO de la configuración (useDeferredValue): el retrato grande
// responde al instante y la parrilla se pone al día un pelo después.
// =============================================================================

const Section = ({ title, hint, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase',
      letterSpacing: .6, marginBottom: hint ? 2 : 10 }}>{title}</div>
    {hint && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{hint}</div>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
  </div>
)

const PieceBtn = React.memo(({ cfg, patch, active, label, onClick }) => (
  <button onClick={onClick} title={label} aria-pressed={active} aria-label={label}
    style={{
      padding: 3, borderRadius: 13, cursor: 'pointer', lineHeight: 0, background: 'var(--white)',
      border: active ? '2px solid var(--orange)' : '1.5px solid var(--border)',
      boxShadow: active ? 'var(--sh-sm)' : 'none',
      transform: active ? 'translateY(-2px)' : 'none',
      transition: 'transform .18s var(--ease-out), border-color .18s, box-shadow .18s',
    }}>
    <Avatar cfg={{ ...cfg, ...patch }} size={54} />
  </button>
))

const ColorBtn = ({ color, ring, active, label, onClick }) => (
  <button onClick={onClick} title={label} aria-pressed={active} aria-label={label}
    style={{
      width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', padding: 0,
      background: color,
      border: active ? '3px solid var(--orange)' : `2px solid ${ring || 'rgba(0,0,0,.12)'}`,
      boxShadow: active ? 'var(--sh-md)' : 'none',
      transform: active ? 'scale(1.08)' : 'none',
      transition: 'transform .18s var(--ease-spring), border-color .18s',
    }} />
)

const AvatarStudio = () => {
  const user = useStore(s => s.user)
  const saved = useStore(selectAvatarConfig)
  // selectThemedCourses arma un array nuevo en cada llamada: se deriva con
  // useMemo desde tajadas estables del store, nunca dentro de useStore (con
  // useSyncExternalStore una referencia nueva por lectura provoca bucle).
  const courses = useStore(s => s.courses)
  const userCourses = useStore(s => s.userCourses)
  const enrolledCourseId = useStore(s => s.enrolledCourseId)
  const themedCourses = React.useMemo(
    () => selectThemedCourses({ courses, userCourses, user, enrolledCourseId }),
    [courses, userCourses, user, enrolledCourseId]
  )

  // Sin avatar guardado arrancamos con uno al azar: es más divertido que ver a
  // todo el mundo con el mismo maniquí por defecto.
  const [draft, setDraft] = React.useState(() => saved ? normalizeAvatar(saved) : randomAvatar())
  const [status, setStatus] = React.useState('idle') // idle | saving | saved | error
  const [expression, setExpression] = React.useState('idle')

  // Rango: sube con el nivel del curso activo (9 niveles → 5 rangos). En el
  // estudio se puede mirar hacia adelante para ver qué armadura viene.
  const xp = useStore(s => s.xp)
  const myRank = rankFromLevel(calcLevel(xp || 0))
  const [view, setView] = React.useState('portrait')   // portrait | body
  const [peekRank, setPeekRank] = React.useState(null) // rango que se está mirando
  const shownRank = peekRank || myRank

  // Miniaturas: se repintan con el valor diferido para no trabar el clic.
  const gridCfg = React.useDeferredValue(draft)

  const touched = React.useRef(false)
  React.useEffect(() => {
    if (!touched.current && saved) setDraft(normalizeAvatar(saved))
  }, [saved])

  const set = React.useCallback((patch) => {
    touched.current = true
    setStatus('idle')
    setDraft(d => ({ ...d, ...patch }))
  }, [])

  const savedNorm = saved ? normalizeAvatar(saved) : null
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedNorm)

  const onSave = async () => {
    setStatus('saving')
    const { error } = await saveAvatarConfig(draft)
    if (error) { setStatus('error'); return }
    touched.current = false
    setStatus('saved')
    setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2500)
  }

  const onReset = () => {
    touched.current = false
    setStatus('idle')
    setDraft(savedNorm || randomAvatar())
  }

  const displayName = avatarDisplayName(draft, user?.name)
  const courseNames = themedCourses.map(c => c.name).filter(Boolean)

  // Fila de piezas: cada botón es el avatar actual con esa sola pieza cambiada.
  const row = (key, variants) => variants.map(v => (
    <PieceBtn key={v} cfg={gridCfg} patch={{ [key]: v }} label={labelOf(v)}
      active={draft[key] === v} onClick={() => set({ [key]: v })} />
  ))

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ---- Panel del retrato (pegajoso en desktop) ---- */}
      <div style={{
        flex: '1 1 260px', minWidth: 260, maxWidth: 340, position: 'sticky', top: 0,
        padding: '24px 20px', borderRadius: 18, background: 'var(--white)',
        border: '1px solid var(--border)', boxShadow: 'var(--sh-sm)', textAlign: 'center',
      }}>
        {/* Retrato (como se ve en pequeño) o cuerpo entero con la armadura */}
        <div style={{ display: 'inline-flex', gap: 4, padding: 3, borderRadius: 10,
          background: 'var(--bg-alt)', marginBottom: 12 }}>
          {[{ id: 'portrait', label: 'Retrato' }, { id: 'body', label: 'Cuerpo' }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} aria-pressed={view === v.id}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: view === v.id ? 700 : 500,
                background: view === v.id ? 'var(--white)' : 'transparent',
                color: view === v.id ? 'var(--dark)' : 'var(--muted)',
                boxShadow: view === v.id ? 'var(--sh-sm)' : 'none' }}>{v.label}</button>
          ))}
        </div>

        {view === 'body' ? (
          <div style={{ marginBottom: 10 }}>
            <AvatarBody cfg={draft} rank={shownRank} size={168} expression={expression} showRankName />
          </div>
        ) : (
          <Avatar cfg={draft} size={190} expression={expression} rank={shownRank}
            style={{ margin: '0 auto 14px' }} />
        )}

        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)' }}>{displayName}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          {savedNorm ? 'Tu avatar en los cursos con temática' : 'Aún no has guardado tu avatar'}
        </div>

        {/* Escalera de rangos: el tuyo, y los que vienen */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
            color: 'var(--subtle)', marginBottom: 6 }}>
            Rango {peekRank && peekRank !== myRank ? '(vista previa)' : 'actual'}
          </div>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
            {RANKS.map(r => {
              const reached = r.id <= myRank
              const active = r.id === shownRank
              return (
                <button key={r.id} title={`${r.name}${reached ? '' : ' — aún no lo alcanzas'}`}
                  onClick={() => setPeekRank(r.id === myRank ? null : r.id)} aria-pressed={active}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', padding: 0,
                    fontSize: 12, fontFamily: 'var(--font)', fontWeight: 800,
                    border: active ? '2px solid var(--orange)' : `2px solid ${r.ring}`,
                    background: reached ? r.ring : 'var(--bg-alt)',
                    color: reached ? '#fff' : 'var(--subtle)',
                    opacity: reached ? 1 : .55,
                  }}>{r.emblem || r.id}</button>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.5 }}>
            Sube con tu nivel en el curso. Vas en <strong>{RANKS[myRank - 1].name}</strong>.
          </div>
        </div>

        {/* Prueba de expresiones: las mismas que usa al conversar con el tutor */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          {[
            { id: 'idle', label: 'Normal' }, { id: 'happy', label: 'Feliz' },
            { id: 'sad', label: 'Triste' }, { id: 'wow', label: 'Sorpresa' },
          ].map(e => (
            <button key={e.id} onClick={() => setExpression(e.id)} aria-pressed={expression === e.id}
              style={{
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)',
                fontSize: 11, fontWeight: expression === e.id ? 700 : 500,
                border: expression === e.id ? '1.5px solid var(--orange)' : '1.5px solid var(--border)',
                background: expression === e.id ? 'var(--orange-bg)' : 'var(--bg)',
                color: expression === e.id ? 'var(--orange)' : 'var(--muted)',
              }}>{e.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn onClick={onSave} disabled={!dirty || status === 'saving'} full>
            {status === 'saving' ? 'Guardando…' : 'Guardar avatar'}
          </Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" size="sm" full onClick={() => set(randomAvatar(draft.alias))}>
              🎲 Sorpréndeme
            </Btn>
            <Btn variant="ghost" size="sm" full onClick={onReset} disabled={!dirty}>
              Descartar
            </Btn>
          </div>
        </div>

        <div style={{ minHeight: 18, marginTop: 8, fontSize: 12, fontWeight: 600 }}>
          {status === 'saved' && <span style={{ color: 'var(--success)' }}>✓ Guardado</span>}
          {status === 'error' && <span style={{ color: 'var(--error)' }}>No se pudo guardar. Intenta de nuevo.</span>}
          {status === 'idle' && dirty && <span style={{ color: 'var(--muted)' }}>Tienes cambios sin guardar</span>}
        </div>

        {courseNames.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)',
            fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6 }}>
            Te acompañará en {courseNames.length === 1 ? 'tu curso' : 'tus cursos'}:{' '}
            <strong style={{ color: 'var(--muted)' }}>{courseNames.join(' · ')}</strong>
          </div>
        )}
      </div>

      {/* ---- Panel de opciones ---- */}
      <div style={{
        flex: '2 1 440px', minWidth: 300, padding: '24px', borderRadius: 18,
        background: 'var(--white)', border: '1px solid var(--border)',
      }}>
        <Section title="Cómo te llama el tutor"
          hint="Opcional. Si lo dejas vacío usaremos tu primer nombre.">
          <input
            value={draft.alias || ''}
            onChange={e => set({ alias: e.target.value.slice(0, 24) })}
            placeholder={(user?.name || '').split(' ')[0] || 'Tu nombre'}
            maxLength={24}
            style={{
              width: '100%', maxWidth: 280, padding: '10px 14px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--bg)', fontFamily: 'var(--font)',
              fontSize: 14, color: 'var(--dark)', outline: 'none',
            }} />
        </Section>

        <Section title="Tono de piel">
          {SKIN_COLORS.map(s => (
            <ColorBtn key={s.id} color={'#' + s.hex} label={s.name}
              active={draft.skin === s.id} onClick={() => set({ skin: s.id })} />
          ))}
        </Section>

        <Section title="Cabello">{row('hair', HAIRS)}</Section>

        <Section title="Color de cabello">
          {HAIR_COLORS.map(c => (
            <ColorBtn key={c.id} color={'#' + c.hex} label={c.name}
              active={draft.hairColor === c.id} onClick={() => set({ hairColor: c.id })} />
          ))}
        </Section>

        <Section title="Ojos" hint="Es tu gesto de base; en la conversación con el tutor cambia solo.">
          {row('eyes', EYES)}
        </Section>

        <Section title="Boca">{row('mouth', MOUTHS)}</Section>

        <Section title="Color del equipo" hint="La ropa y la armadura que se ve en el cuerpo entero.">
          {BODY_COLORS.map(c => (
            <ColorBtn key={c.id} color={'#' + c.hex} label={c.name}
              active={draft.bodyColor === c.id} onClick={() => set({ bodyColor: c.id })} />
          ))}
        </Section>

        <Section title="Accesorio">
          <PieceBtn cfg={gridCfg} patch={{ accessory: null }} label="Ninguno"
            active={!draft.accessory} onClick={() => set({ accessory: null })} />
          {row('accessory', ACCESSORIES)}
        </Section>

        <Section title="Marco">
          {FRAMES.map(f => (
            <ColorBtn key={f.id} color={f.bg} ring={f.ring} label={f.name}
              active={draft.frame === f.id} onClick={() => set({ frame: f.id })} />
          ))}
        </Section>

        <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6, paddingTop: 4 }}>
          Tu avatar es el mismo en todos tus cursos y lo puedes cambiar cuando quieras.
          No reemplaza tu foto de perfil: la foto es para la plataforma, el avatar para el mundo del curso.
          <br />
          {/* Crédito obligatorio: el arte es CC BY 4.0 */}
          Ilustraciones:{' '}
          <a href={AVATAR_CREDIT.authorUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--muted)' }}>{AVATAR_CREDIT.text}</a>.
        </div>
      </div>
    </div>
  )
}

export default AvatarStudio
