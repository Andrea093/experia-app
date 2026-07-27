import React from 'react'
import { avatarDataUri, resolvedColors, normalizeAvatar, RANKS, rankFromLevel } from './avatarKit.jsx'

// =============================================================================
// EXPERIA — Cuerpo y armadura del avatar (arte propio, SVG plano)
// -----------------------------------------------------------------------------
// La cabeza viene de DiceBear (avatarKit.jsx) y el cuerpo lo dibujamos aquí:
// ningún estilo de DiceBear trae armaduras ni progresión, así que el equipo es
// arte nuestro. El trazo es plano y de formas gruesas para casar con «Big Smile».
//
// Se usa SOLO en tamaños grandes (perfil, celebración): a 44 px la armadura no
// se distingue y el progreso se lee en el marco del retrato (ver Avatar en
// avatarKit.jsx). Misma configuración, dos formas de pintarla.
//
// Lienzo 200×280. Referencias fijas (respetarlas al agregar piezas):
//   cabeza  → recuadro x 38..162, y 0..124
//   barbilla del estilo → y ≈ 101 (medido con una reglilla sobre el render)
//   hombros → y 108 · cintura y 206 · pie del torso y 280
// El cuello visible son ~7 px a propósito: la cabeza de Big Smile es enorme y
// con más cuello el conjunto se ve desgarbado.
// =============================================================================

const HEAD = { x: 38, y: 0, w: 124, h: 124 }

// Color de la energía del rango máximo (gemas, alas, anillo de runas).
const LEGEND_HUE = '#8E7BE8'

// Aclarar/oscurecer un hex para sombras y brillos sin pedir más colores.
const shade = (hex, amount) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + amount))))
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ─── Piezas ──────────────────────────────────────────────────────────────────

const Cape = ({ color }) => (
  <g>
    <path d="M72 112 C32 146 20 238 24 280 L176 280 C180 238 168 146 128 112 Z" fill={color} />
    <path d="M72 112 C48 146 38 232 38 280 L24 280 C20 238 32 146 72 112 Z" fill={shade(color, -.25)} />
  </g>
)

// Capa de leyenda: más ancha, con forro dorado a la vista y bajo dentado.
const CapeLegend = ({ color, lining }) => (
  <g>
    <path d="M70 110 C22 148 6 238 10 280 L190 280 C194 238 178 148 130 110 Z" fill={color} />
    <path d="M70 110 C44 148 32 232 32 280 L10 280 C6 238 22 148 70 110 Z" fill={shade(color, -.28)} />
    {/* forro dorado del borde interior */}
    <path d="M70 110 C48 142 38 214 38 262 L52 262 C52 212 60 146 78 118 Z" fill={lining} opacity=".85" />
    <path d="M130 110 C152 142 162 214 162 262 L148 262 C148 212 140 146 122 118 Z" fill={lining} opacity=".85" />
    {/* bajo dentado */}
    <path d="M10 280 L26 262 L42 280 L58 262 L74 280 L90 262 L106 280 L122 262 L138 280 L154 262 L170 280 L186 262 L190 280 Z"
      fill={shade(color, -.35)} />
  </g>
)

// Alas de energía — el efecto que separa a Leyenda de Maestro de un vistazo.
const EnergyWings = ({ uid, color }) => {
  const feathers = [
    'M74 126 C48 108 26 104 8 114 C28 122 46 134 64 148 Z',
    'M72 146 C44 138 22 142 6 156 C28 160 46 168 66 178 Z',
    'M72 166 C48 166 28 176 18 192 C40 192 58 198 70 206 Z',
  ]
  return (
    <g className="av-body-wings">
      <defs>
        <linearGradient id={`w${uid}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity=".75" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`wr${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity=".75" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {feathers.map((d, i) => <path key={'l' + i} d={d} fill={`url(#w${uid})`} />)}
      <g transform="translate(200 0) scale(-1 1)">
        {feathers.map((d, i) => <path key={'r' + i} d={d} fill={`url(#wr${uid})`} />)}
      </g>
    </g>
  )
}

// Anillo de runas que gira lentamente detrás de la figura.
const RuneRing = ({ color }) => (
  <g className="av-body-ring">
    <circle cx="100" cy="152" r="94" fill="none" stroke={color} strokeWidth="3"
      strokeDasharray="7 16" strokeLinecap="round" opacity=".55" />
    <circle cx="100" cy="152" r="82" fill="none" stroke={color} strokeWidth="1.5"
      strokeDasharray="2 10" opacity=".4" />
  </g>
)

// Destello en cruz sobre la gema central.
const GemSparkle = ({ x, y, color }) => (
  <g className="av-body-gemshine" style={{ transformOrigin: `${x}px ${y}px` }}>
    <path d={`M${x} ${y - 17} L${x + 4} ${y} L${x} ${y + 17} L${x - 4} ${y} Z`} fill={color} opacity=".9" />
    <path d={`M${x - 17} ${y} L${x} ${y - 4} L${x + 17} ${y} L${x} ${y + 4} Z`} fill={color} opacity=".9" />
  </g>
)

const Torso = ({ cloth }) => (
  <g>
    <path d="M48 280 C48 194 56 122 80 109 L120 109 C144 122 152 194 152 280 Z" fill={cloth} />
    {/* sombra lateral */}
    <path d="M120 109 C144 122 152 194 152 280 L132 280 C134 198 130 130 114 112 Z"
      fill={shade(cloth, -.18)} />
  </g>
)

// Cuello enrollado de la ropa: tapa la unión entre la barbilla y el torso.
const Collar = ({ color }) => (
  <path d="M76 108 C86 99 114 99 124 108 C114 118 86 118 76 108 Z" fill={color} />
)

// Costuras que insinúan los brazos, para que el torso no sea una mancha plana.
const Sleeves = ({ color }) => (
  <g fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".8">
    <path d="M66 134 C60 178 58 232 58 280" />
    <path d="M134 134 C140 178 142 232 142 280" />
  </g>
)

// Bandolera cruzada — el mismo guiño que llevan los tutores ilustrados.
// Con `bag` cuelga el morral al final de la correa (si no, parece cinturón de
// seguridad); con `buckle`, una hebilla a media correa.
const Strap = ({ color, buckle, bag }) => (
  <g>
    <path d="M74 106 L132 280" stroke={color} strokeWidth="11" strokeLinecap="butt" fill="none" />
    <path d="M74 106 L132 280" stroke={shade(color, .22)} strokeWidth="3" fill="none" opacity=".5" />
    {buckle && <rect x="92" y="158" width="15" height="11" rx="2.5" fill={buckle} transform="rotate(18 99 163)" />}
    {bag && (
      <g>
        <rect x="112" y="224" width="46" height="42" rx="7" fill={shade(color, -.12)} />
        <path d="M112 240 H158" stroke={shade(color, -.45)} strokeWidth="3.5" />
        <rect x="128" y="234" width="14" height="12" rx="2.5" fill={shade(color, .3)} />
      </g>
    )}
  </g>
)

const Pauldron = ({ x, metal, metalDark, big, gem }) => (
  <g transform={`translate(${x} 120)`}>
    <ellipse rx={big ? 26 : 21} ry={big ? 20 : 15} fill={metal} />
    <path d={big ? 'M-26 0 A26 20 0 0 1 26 0 Z' : 'M-21 0 A21 15 0 0 1 21 0 Z'} fill={shade(metal, .18)} />
    <ellipse rx={big ? 26 : 21} ry={big ? 20 : 15} fill="none" stroke={metalDark} strokeWidth="2.5" />
    {gem && <>
      {/* púas de cristal del rango máximo */}
      <path d="M-14 -8 L-10 -26 L-4 -9 Z" fill={gem} opacity=".9" />
      <path d="M4 -10 L10 -30 L15 -8 Z" fill={gem} opacity=".9" />
      <circle cy="-2" r="4.5" fill={gem} stroke={metalDark} strokeWidth="1.5" />
    </>}
  </g>
)

// Hombrera de tela (rango explorador): todavía no es metal.
const Epaulette = ({ x, cloth, trim }) => (
  <g transform={`translate(${x} 122)`}>
    <path d="M-19 0 C-19 -11 19 -11 19 0 C19 6 -19 6 -19 0 Z" fill={cloth} />
    <path d="M-19 1 C-8 6 8 6 19 1" fill="none" stroke={trim} strokeWidth="2.5" />
  </g>
)

const Belt = ({ metal, metalDark, y = 204 }) => (
  <g>
    <rect x="52" y={y} width="96" height="16" rx="4" fill={shade(metal, -.45)} />
    <rect x="88" y={y - 3} width="24" height="22" rx="4" fill={metal} stroke={metalDark} strokeWidth="2" />
  </g>
)

const ChestPlate = ({ uid, metal, metalDark, accent, gem, star, shine }) => (
  <g>
    {shine && (
      <defs>
        <linearGradient id={`m${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(metal, .35)} />
          <stop offset="45%" stopColor={metal} />
          <stop offset="100%" stopColor={shade(metal, -.25)} />
        </linearGradient>
      </defs>
    )}
    <path d="M62 280 C62 194 70 132 86 118 L114 118 C130 132 138 194 138 280 Z"
      fill={shine ? `url(#m${uid})` : metal} />
    <path d="M114 118 C130 132 138 194 138 280 L122 280 C124 198 118 136 106 120 Z" fill={shade(metal, -.2)} />
    <path d="M86 118 L100 140 L114 118" fill="none" stroke={metalDark} strokeWidth="3" strokeLinecap="round" />
    <path d="M100 140 L100 196" stroke={metalDark} strokeWidth="2.5" />
    {accent && <path d="M68 180 L132 180" stroke={accent} strokeWidth="3" strokeLinecap="round" opacity=".9" />}
    {star && <path d="M100 152 L104 163 L116 163 L106 170 L110 182 L100 175 L90 182 L94 170 L84 163 L96 163 Z"
      fill={shade(metal, .3)} stroke={metalDark} strokeWidth="1.5" />}
    {gem && <>
      <circle cx="100" cy="160" r="11" fill={gem} stroke={metalDark} strokeWidth="2" />
      <circle cx="96.5" cy="156.5" r="3.5" fill="#fff" opacity=".6" />
    </>}
  </g>
)

const Gorget = ({ metal, metalDark }) => (
  <path d="M76 110 C86 101 114 101 124 110 C114 120 86 120 76 110 Z"
    fill={metal} stroke={metalDark} strokeWidth="2" />
)

// Chispas del rango máximo.
const LEGEND_SPARKS = [
  { x: 30, y: 120, r: 3.2, d: '0s' },   { x: 170, y: 140, r: 2.4, d: '.7s' },
  { x: 44, y: 210, r: 2.8, d: '1.3s' }, { x: 158, y: 226, r: 3.4, d: '.4s' },
  { x: 100, y: 92, r: 2.6, d: '1.7s' }, { x: 22, y: 168, r: 3.6, d: '2.2s' },
  { x: 182, y: 186, r: 2.2, d: '1.0s' }, { x: 64, y: 96, r: 2.8, d: '2.6s' },
  { x: 138, y: 88, r: 3.0, d: '.2s' },  { x: 12, y: 238, r: 2.4, d: '1.9s' },
  { x: 188, y: 252, r: 2.8, d: '2.9s' }, { x: 78, y: 250, r: 2.2, d: '1.5s' },
]

// ─── Composición por rango ───────────────────────────────────────────────────

const ArmorForRank = ({ rank, cloth, metal, metalDark, uid }) => {
  switch (rank) {
    case 1: // Aprendiz — túnica de estudiante: cuello enrollado y bandolera
      return (
        <g>
          <Torso cloth={cloth} />
          <Sleeves color={shade(cloth, -.28)} />
          <Strap color={shade(cloth, -.42)} bag />
          <Collar color={shade(cloth, -.3)} />
          <path d="M56 208 L144 208" stroke={shade(cloth, -.3)} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )
    case 2: // Explorador — chaqueta abierta, hombreras de tela y cinturón de cuero
      return (
        <g>
          <Torso cloth={shade(cloth, .12)} />
          {/* solapas de la chaqueta, abiertas sobre la camisa */}
          <path d="M48 280 C48 194 56 122 80 109 L98 124 L94 280 Z" fill={shade(cloth, -.3)} />
          <path d="M152 280 C152 194 144 122 120 109 L102 124 L106 280 Z" fill={shade(cloth, -.42)} />
          <Sleeves color={shade(cloth, -.5)} />
          <Strap color="#6B4A2A" buckle={metal} />
          <Belt metal="#7A5230" metalDark="#4E3320" y={202} />
          <Epaulette x={66} cloth={shade(cloth, -.3)} trim={metal} />
          <Epaulette x={134} cloth={shade(cloth, -.42)} trim={metal} />
          <Collar color={shade(cloth, -.36)} />
        </g>
      )
    case 3: // Especialista — peto ligero y dos hombreras
      return (
        <g>
          <Torso cloth={cloth} />
          <Sleeves color={shade(cloth, -.28)} />
          <ChestPlate metal={metal} metalDark={metalDark} />
          <Belt metal={metal} metalDark={metalDark} />
          <Pauldron x={66} metal={metal} metalDark={metalDark} />
          <Pauldron x={134} metal={metal} metalDark={metalDark} />
        </g>
      )
    case 4: // Maestro — armadura completa, gola, hombreras grandes y estrella
      return (
        <g>
          <Torso cloth={cloth} />
          <ChestPlate metal={metal} metalDark={metalDark} accent={shade(metal, -.35)} star />
          <Belt metal={metal} metalDark={metalDark} />
          <Pauldron x={62} metal={metal} metalDark={metalDark} big />
          <Pauldron x={138} metal={metal} metalDark={metalDark} big />
          <Gorget metal={metal} metalDark={metalDark} />
        </g>
      )
    default: // 5 · Leyenda — metal con brillo, cristales y gema viva
      return (
        <g>
          <Torso cloth={cloth} />
          <ChestPlate uid={uid} metal={metal} metalDark={metalDark}
            accent={LEGEND_HUE} gem={LEGEND_HUE} shine />
          <GemSparkle x={100} y={160} color="#fff" />
          <Belt metal={metal} metalDark={metalDark} />
          <Pauldron x={62} metal={metal} metalDark={metalDark} big gem={LEGEND_HUE} />
          <Pauldron x={138} metal={metal} metalDark={metalDark} big gem={LEGEND_HUE} />
          <Gorget metal={metal} metalDark={metalDark} />
          {/* filos encendidos */}
          <path d="M62 280 C62 194 70 132 86 118" fill="none" stroke="#FFF3B8" strokeWidth="3" opacity=".95" />
          <path d="M138 280 C138 194 130 132 114 118" fill="none" stroke="#FFF3B8" strokeWidth="3" opacity=".95" />
        </g>
      )
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────

// `fill`: el SVG se adapta al contenedor (lo usa la conversación con el tutor,
// donde el alto lo manda el CSS). Sin `fill` manda `size` en píxeles.
export const AvatarBody = ({ cfg, rank = 1, size = 240, expression = 'idle', showRankName = false, fill = false }) => {
  const a = React.useMemo(() => normalizeAvatar(cfg), [cfg])
  const r = RANKS[Math.min(RANKS.length, Math.max(1, rank)) - 1]
  const colors = resolvedColors(a)
  const head = React.useMemo(() => avatarDataUri(a, expression, 'full'), [a, expression])
  const cape = rank >= 4 ? colors.body : null
  const legend = rank >= 5
  // Ids únicos por instancia: en la escalera de rangos hay varios avatares en la
  // misma página y los degradados no pueden compartir id.
  const uid = React.useId().replace(/:/g, '')

  return (
    <div style={fill
      ? { width: '100%', height: '100%' }
      : { display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg viewBox="0 0 200 280"
        {...(fill
          ? { preserveAspectRatio: 'xMidYMax meet', style: { width: '100%', height: '100%', display: 'block' } }
          : { width: size, height: Math.round(size * 1.4) })}
        xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Avatar, rango ${r.name}`}>
        {/* halo del rango */}
        {rank >= 4 && (
          <ellipse cx="100" cy="150" rx="96" ry="120" fill={legend ? LEGEND_HUE : '#E3B341'}
            opacity={legend ? .2 : .12} className="av-body-halo" />
        )}
        {legend && <RuneRing color="#E3B341" />}
        {legend && <EnergyWings uid={uid} color={LEGEND_HUE} />}
        {cape && (legend
          ? <CapeLegend color={shade(cape, -.4)} lining="#E3B341" />
          : <Cape color={shade(cape, -.35)} />)}
        {/* cuello corto: nace bajo la barbilla (y≈101) y muere en el cuello de la ropa */}
        <path d="M88 90 L112 90 L112 116 L88 116 Z" fill={colors.skin} />
        <path d="M88 90 L112 90 L112 99 C104 104 96 104 88 99 Z" fill={shade(colors.skin, -.18)} />
        <ArmorForRank rank={rank} cloth={colors.body} metal={r.metal} metalDark={r.metalDark} uid={uid} />
        <image href={head} x={HEAD.x} y={HEAD.y} width={HEAD.w} height={HEAD.h} />
        {legend && LEGEND_SPARKS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 3 === 0 ? LEGEND_HUE : '#FFF3B8'}
            className="av-body-spark" style={{ animationDelay: s.d }} />
        ))}
      </svg>
      {showRankName && (
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase',
          color: r.ring,
        }}>{r.emblem ? r.emblem + ' ' : ''}{r.name}</div>
      )}
    </div>
  )
}

export { RANKS, rankFromLevel }
export default AvatarBody
