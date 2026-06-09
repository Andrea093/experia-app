export const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN' }
export const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#10B981' }
export const TYPE_BG    = { lesson: 'var(--orange-bg)', challenge: 'var(--purple-bg)', evaluation: '#D1FAE5' }

export const PAIR_COLORS = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B','#EC4899']

export const CHALLENGE_TYPES = [
  { id:'dragdrop',   label:'Arrastrar y ordenar', emoji:'🧩', desc:'Ordena elementos en secuencia correcta' },
  { id:'empathy',    label:'Mapa de empatía',     emoji:'🗺️', desc:'Clasifica tarjetas en cuadrantes' },
  { id:'simulation', label:'Simulación',           emoji:'🎭', desc:'Árbol de decisiones pedagógicas' },
  { id:'matching',   label:'Conectar conceptos',  emoji:'🔗', desc:'Empareja conceptos con definiciones' },
  { id:'quiz',       label:'Quiz',                 emoji:'📝', desc:'Preguntas de opción múltiple' },
]

export const CTYPE_EMOJI = { dragdrop:'🧩', empathy:'🗺️', simulation:'🎭', matching:'🔗', quiz:'📝' }

export const SECTION_TYPES = [
  { id: 'intro',   label: '📖 Introducción',  icon: '📖' },
  { id: 'text',    label: '📄 Texto',          icon: '📄' },
  { id: 'callout', label: '💡 Destacado',      icon: '💡' },
  { id: 'video',   label: '🎬 Video YouTube',  icon: '🎬' },
]
