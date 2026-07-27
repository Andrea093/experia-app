import React from 'react'
import { Style, Avatar as DiceAvatar } from '@dicebear/core'
import definition from '@dicebear/styles/big-smile.json'

// =============================================================================
// EXPERIA — Kit de avatar del estudiante (DiceBear · estilo "Big Smile")
// -----------------------------------------------------------------------------
// Arte: «Custom Avatar» de Ashley Seo — licencia CC BY 4.0.
// ⚠️ CC BY OBLIGA A DAR CRÉDITO donde se muestren los avatares. El crédito vive
// en AVATAR_CREDIT (abajo) y se pinta al pie del estudio. Si algún día se cambia
// de estilo, revisar la licencia del nuevo en https://www.dicebear.com/licenses/
//
// Motor: @dicebear/core (MIT). Todo se genera en el navegador: sin llamadas de
// red ni servicio externo.
//
// Lo que se guarda en profiles.avatar_config son IDS de variante, nunca SVG ni
// colores calculados, así que el arte puede actualizarse sin migrar datos:
//
//   { v:4, hair, hairColor, eyes, mouth, skin, accessory, bodyColor, frame, alias }
//
// Un id desconocido (catálogo viejo, JSON manipulado) cae al valor por defecto
// en normalizeAvatar: el avatar guardado nunca puede romper el render.
//
// El avatar vive en profiles → es el mismo en TODOS los cursos de esa persona.
// =============================================================================

export const AVATAR_VERSION = 4

export const AVATAR_CREDIT = {
  text: '«Custom Avatar» de Ashley Seo, CC BY 4.0 — generado con DiceBear',
  authorUrl: 'https://www.ashleyseo.com/',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
}

const style = new Style(definition)

// ─── Catálogos derivados de la definición del estilo ─────────────────────────
// Si DiceBear agrega variantes al actualizar, aparecen solas en el editor; solo
// habría que ponerles nombre en LABELS.
const variantsOf = (name) => Object.keys(definition.components?.[name]?.variants || {})
const colorsOf = (name) => definition.colors?.[name]?.values || []

const LABELS = {
  // peinados
  bangs: 'Flequillo', bowlCutHair: 'Corte tazón', braids: 'Trenzas', bunHair: 'Moño',
  curlyBob: 'Bob rizado', curlyShortHair: 'Rizado corto', froBun: 'Afro con moño',
  halfShavedHead: 'Rapado a un lado', mohawk: 'Mohicano', shavedHead: 'Rapado',
  shortHair: 'Corto', straightHair: 'Liso largo', wavyBob: 'Bob ondulado',
  // ojos
  angry: 'Enojado', cheery: 'Alegre', confused: 'Confundido', normal: 'Normal',
  sad: 'Triste', sleepy: 'Adormilado', starstruck: 'Deslumbrado', winking: 'Guiño',
  // bocas
  awkwardSmile: 'Sonrisa tímida', braces: 'Brackets', gapSmile: 'Sonrisa con diastema',
  kawaii: 'Kawaii', openSad: 'Boca triste', openedSmile: 'Sonrisa abierta',
  teethSmile: 'Sonrisa con dientes', unimpressed: 'Sin gracia',
  // accesorios
  catEars: 'Orejas de gato', clownNose: 'Nariz de payaso', faceMask: 'Tapabocas',
  glasses: 'Gafas', mustache: 'Bigote', sailormoonCrown: 'Corona', sleepMask: 'Antifaz',
  sunglasses: 'Gafas de sol',
}
export const labelOf = (id) => LABELS[id] || id

export const HAIRS       = variantsOf('hair')        // 13
export const EYES        = variantsOf('eyes')        // 8
export const MOUTHS      = variantsOf('mouth')       // 8
export const ACCESSORIES = variantsOf('accessories') // 8 (opcional)

// Las paletas vienen del propio estilo: son las que el arte espera.
const SKIN_NAMES = ['Muy claro', 'Claro', 'Beige', 'Dorado', 'Canela', 'Moreno', 'Café', 'Oscuro']
const HAIR_NAMES = ['Negro', 'Café oscuro', 'Castaño', 'Rubio', 'Violeta', 'Verde azulado', 'Naranja', 'Dorado']

export const SKIN_COLORS = colorsOf('skin').map((hex, i) => ({
  id: 'k' + (i + 1), name: SKIN_NAMES[i] || 'Tono ' + (i + 1), hex: hex.replace('#', ''),
}))
export const HAIR_COLORS = colorsOf('hair').map((hex, i) => ({
  id: 'c' + (i + 1), name: HAIR_NAMES[i] || 'Color ' + (i + 1), hex: hex.replace('#', ''),
}))

// Color del equipo (el cuerpo/armadura lo dibujamos nosotros, ver avatarBody.jsx).
export const BODY_COLORS = [
  { id: 'b1', name: 'Índigo',   hex: '3F4A8A' },
  { id: 'b2', name: 'Turquesa', hex: '1F7F87' },
  { id: 'b3', name: 'Verde',    hex: '3D7A46' },
  { id: 'b4', name: 'Ámbar',    hex: 'C9832B' },
  { id: 'b5', name: 'Naranja',  hex: 'C2562B' },
  { id: 'b6', name: 'Vino',     hex: '8C2F45' },
  { id: 'b7', name: 'Violeta',  hex: '6B4A9E' },
  { id: 'b8', name: 'Grafito',  hex: '3B4048' },
]

// Marco del retrato. Los cuatro del medio riman con las paletas de los temas
// inmersivos para que el avatar no desentone al lado del tutor.
export const FRAMES = [
  { id: 'f1', name: 'Neutro', ring: '#8A93A6', bg: 'radial-gradient(circle at 50% 30%, #E9EDF3 0%, #C8D0DC 100%)' },
  { id: 'f2', name: 'Ámbar',  ring: '#D4A017', bg: 'radial-gradient(circle at 50% 30%, #FBEFD2 0%, #E4C778 100%)' },
  { id: 'f3', name: 'Fuego',  ring: '#F0A500', bg: 'radial-gradient(circle at 50% 30%, #FFE9C7 0%, #F5C06A 100%)' },
  { id: 'f4', name: 'Bio',    ring: '#00B368', bg: 'radial-gradient(circle at 50% 30%, #DDF7EA 0%, #9BE0C2 100%)' },
  { id: 'f5', name: 'Cosmos', ring: '#5B8DD9', bg: 'radial-gradient(circle at 50% 30%, #E2E9FA 0%, #A8BCE8 100%)' },
  { id: 'f6', name: 'Coral',  ring: '#E0567A', bg: 'radial-gradient(circle at 50% 30%, #FDE3EA 0%, #F2A9BC 100%)' },
]

// ─── Configuración por defecto y normalización ───────────────────────────────

export const DEFAULT_AVATAR = {
  v: AVATAR_VERSION,
  hair: HAIRS.includes('shortHair') ? 'shortHair' : HAIRS[0],
  hairColor: 'c2',
  eyes: EYES.includes('normal') ? 'normal' : EYES[0],
  mouth: MOUTHS.includes('openedSmile') ? 'openedSmile' : MOUTHS[0],
  skin: 'k3',
  accessory: null,
  bodyColor: 'b1',
  frame: 'f1',
  alias: '',
}

const inList = (list, v, fallback) => (list.includes(v) ? v : fallback)
const byId = (list, id, fallbackId) =>
  list.find(x => x.id === id) || list.find(x => x.id === fallbackId) || list[0]

export const normalizeAvatar = (cfg) => {
  const c = cfg && typeof cfg === 'object' ? cfg : {}
  const d = DEFAULT_AVATAR
  return {
    v: AVATAR_VERSION,
    hair:      inList(HAIRS, c.hair, d.hair),
    hairColor: byId(HAIR_COLORS, c.hairColor, d.hairColor).id,
    eyes:      inList(EYES, c.eyes, d.eyes),
    mouth:     inList(MOUTHS, c.mouth, d.mouth),
    skin:      byId(SKIN_COLORS, c.skin, d.skin).id,
    accessory: c.accessory && ACCESSORIES.includes(c.accessory) ? c.accessory : null,
    bodyColor: byId(BODY_COLORS, c.bodyColor, d.bodyColor).id,
    frame:     byId(FRAMES, c.frame, d.frame).id,
    alias:     typeof c.alias === 'string' ? c.alias.slice(0, 24) : '',
  }
}

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const randomAvatar = (alias = '') => normalizeAvatar({
  hair: rnd(HAIRS), hairColor: rnd(HAIR_COLORS).id,
  eyes: rnd(EYES), mouth: rnd(MOUTHS), skin: rnd(SKIN_COLORS).id,
  accessory: Math.random() < 0.3 ? rnd(ACCESSORIES) : null,
  bodyColor: rnd(BODY_COLORS).id,
  frame: rnd(FRAMES).id, alias,
})

// Colores resueltos, para que el cuerpo (avatarBody.jsx) pinte con la misma
// paleta que la cabeza sin volver a leer los catálogos.
export const resolvedColors = (cfg) => {
  const a = normalizeAvatar(cfg)
  return {
    skin: '#' + byId(SKIN_COLORS, a.skin, DEFAULT_AVATAR.skin).hex,
    hair: '#' + byId(HAIR_COLORS, a.hairColor, DEFAULT_AVATAR.hairColor).hex,
    body: '#' + byId(BODY_COLORS, a.bodyColor, DEFAULT_AVATAR.bodyColor).hex,
  }
}

// Nombre con el que el tutor se dirige a la persona: el alias si lo puso, si no
// el primer nombre real.
export const avatarDisplayName = (cfg, userName = '') => {
  const alias = (cfg?.alias || '').trim()
  if (alias) return alias
  return (userName || '').trim().split(/\s+/)[0] || 'colega'
}

// ─── Expresiones ─────────────────────────────────────────────────────────────
// Big Smile trae ojos y bocas con nombre semántico, así que las expresiones son
// nítidas de verdad (a diferencia de otros estilos de trazo fino).
export const EXPRESSIONS = ['idle', 'happy', 'sad', 'wow']

const EXPRESSION_PATCH = {
  idle:  {},                                                        // respeta lo que eligió la persona
  happy: { eyesVariant: 'cheery',     mouthVariant: 'openedSmile' },
  sad:   { eyesVariant: 'sad',        mouthVariant: 'openSad' },
  wow:   { eyesVariant: 'starstruck', mouthVariant: 'kawaii' },
}

// ─── Rangos (progresión visible) ─────────────────────────────────────────────
// El avatar sube de rango con el nivel del curso activo. Se lee de dos formas:
//   · en pequeño → el marco del retrato (metal del aro, aura, emblema)
//   · en grande  → la armadura del cuerpo entero (ver avatarBody.jsx)
// Los 9 niveles de LEVELS (store) se agrupan de a dos en estos 5 rangos.
export const RANKS = [
  { id: 1, name: 'Aprendiz',     emblem: null, ring: '#9AA3B2', metal: '#9AA3B2', metalDark: '#6E7686', glow: null, auraClass: null },
  { id: 2, name: 'Explorador',   emblem: null, ring: '#B0763C', metal: '#C08447', metalDark: '#8A5525', glow: null, auraClass: null },
  { id: 3, name: 'Especialista', emblem: '✦',  ring: '#B9C2CC', metal: '#CBD4DE', metalDark: '#8D97A4', glow: '0 0 14px rgba(185,194,204,.55)', auraClass: null },
  { id: 4, name: 'Maestro',      emblem: '★',  ring: '#E3B341', metal: '#EFC65A', metalDark: '#A97F1E', glow: '0 0 18px rgba(227,179,65,.6)', auraClass: 'av-aura' },
  { id: 5, name: 'Leyenda',      emblem: '♛',  ring: '#8E7BE8', metal: '#EFC65A', metalDark: '#A97F1E', glow: '0 0 22px rgba(142,123,232,.7), 0 0 40px rgba(227,179,65,.35)', auraClass: 'av-aura av-aura-legend' },
]

// Nivel del estudiante (1–9 de LEVELS) → rango (1–5).
export const rankFromLevel = (level = 1) =>
  Math.min(RANKS.length, Math.max(1, Math.ceil((Number(level) || 1) / 2)))

// ─── Render ──────────────────────────────────────────────────────────────────

// Encuadre: en Big Smile la cabeza llena el lienzo y va ligeramente descentrada,
// así que hay que encogerla y correrla para que quepa entera en el círculo del
// marco (medido variante por variante, incluidos los peinados altos como froBun
// y mohawk). Si se cambia de estilo hay que recalibrar estos tres números.
const FRAMING = { scale: 0.74, translateX: 2, translateY: -3 }

// Para el cuerpo entero (avatarBody.jsx) la cabeza va sin recorte circular:
// se usa el lienzo completo del estilo y el cuerpo se dibuja debajo.
const FRAMING_FULL = { scale: 1 }

const hex = (list, id, fallbackId) => byId(list, id, fallbackId).hex

const optionsFor = (a, expression, mode) => ({
  seed: 'experia',           // fijo: nada queda al azar, todo viene de la config
  size: 240,
  idRandomization: true,     // evita choques de ids entre SVGs en la misma página
  ...(mode === 'full' ? FRAMING_FULL : FRAMING),
  hairVariant: a.hair,
  hairColor: hex(HAIR_COLORS, a.hairColor, DEFAULT_AVATAR.hairColor),
  skinColor: hex(SKIN_COLORS, a.skin, DEFAULT_AVATAR.skin),
  eyesVariant: a.eyes,
  mouthVariant: a.mouth,
  accessoriesProbability: a.accessory ? 100 : 0,
  ...(a.accessory ? { accessoriesVariant: a.accessory } : {}),
  ...(EXPRESSION_PATCH[expression] || {}),
})

// Caché de data-URIs: generar un avatar cuesta décimas de milisegundo, pero el
// editor pinta decenas de miniaturas y las vuelve a pedir en cada cambio.
const cache = new Map()
const CACHE_MAX = 400

export const avatarDataUri = (cfg, expression = 'idle', mode = 'portrait') => {
  const a = normalizeAvatar(cfg)
  const key = JSON.stringify(a) + '|' + expression + '|' + mode
  const hit = cache.get(key)
  if (hit) return hit
  let uri
  try {
    uri = new DiceAvatar(style, optionsFor(a, expression, mode)).toDataUri()
  } catch (e) {
    console.error('avatarKit:', e)
    uri = ''
  }
  if (cache.size >= CACHE_MAX) cache.clear()
  cache.set(key, uri)
  return uri
}

// Solo el dibujo, sin marco (para incrustarlo en otro contenedor).
export const AvatarArt = ({ cfg, expression = 'idle', alt = '' }) => {
  const uri = React.useMemo(() => avatarDataUri(cfg, expression), [cfg, expression])
  return <img src={uri} alt={alt} draggable="false"
    style={{ width: '100%', height: '100%', display: 'block' }} />
}

// Retrato: marco circular + dibujo. Con `rank` (1–5) el marco sube de metal y
// gana aura/emblema — es la lectura del progreso en tamaños pequeños, donde un
// cuerpo entero sería ilegible. Ver RANKS en avatarBody.jsx.
export const Avatar = ({
  cfg, size = 96, expression = 'idle', frame = true, ring = null,
  rank = 0, style: sx, ...rest
}) => {
  const a = React.useMemo(() => normalizeAvatar(cfg), [cfg])
  const f = byId(FRAMES, a.frame, DEFAULT_AVATAR.frame)
  const r = rank ? RANKS[Math.min(RANKS.length, Math.max(1, rank)) - 1] : null
  const border = Math.max(2, Math.round(size * (r && rank >= 3 ? .045 : .03)))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...sx }} {...rest}>
      <div
        className={r?.auraClass || undefined}
        style={{
          width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
          background: frame ? f.bg : 'transparent',
          border: frame ? `${border}px solid ${ring || r?.ring || f.ring}` : 'none',
          boxShadow: r?.glow || undefined,
          display: 'block', position: 'relative', boxSizing: 'border-box',
        }}
      >
        <AvatarArt cfg={a} expression={expression} />
      </div>
      {/* Emblema del rango: solo a partir de tamaños donde se distingue */}
      {r?.emblem && size >= 56 && (
        <div style={{
          position: 'absolute', right: -2, bottom: -2,
          width: Math.round(size * .30), height: Math.round(size * .30),
          borderRadius: '50%', background: r.ring,
          border: `${Math.max(1, Math.round(size * .02))}px solid #fff`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.round(size * .17), lineHeight: 1,
          boxShadow: '0 2px 6px rgba(0,0,0,.35)',
        }} title={r.name}>{r.emblem}</div>
      )}
    </div>
  )
}

export default Avatar
