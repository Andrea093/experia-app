export const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL' }
export const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#0D9488', final_delivery: '#0D9488' }
export const TYPE_BG    = { lesson: 'var(--orange-bg)', challenge: 'var(--purple-bg)', evaluation: '#CCFBF1', final_delivery: '#CCFBF1' }

export const PAIR_COLORS = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B','#EC4899']

export const CHALLENGE_TYPES = [
  { id:'dragdrop',   label:'Arrastrar y ordenar', emoji:'🧩', desc:'Ordena elementos en secuencia correcta' },
  { id:'empathy',    label:'Mapa de empatía',     emoji:'🗺️', desc:'Clasifica tarjetas en cuadrantes' },
  { id:'simulation', label:'Simulación',           emoji:'🎭', desc:'Árbol de decisiones pedagógicas' },
  { id:'matching',   label:'Conectar conceptos',  emoji:'🔗', desc:'Empareja conceptos con definiciones' },
  { id:'quiz',       label:'Quiz',                 emoji:'📝', desc:'Preguntas de opción múltiple' },
  { id:'truefalse',  label:'Verdadero / Falso',   emoji:'⚖️', desc:'Marca cada afirmación como verdadera o falsa' },
  { id:'fillblank',  label:'Completar espacios',  emoji:'✏️', desc:'Completa los huecos del texto con el banco de palabras' },
]

export const CTYPE_EMOJI = { dragdrop:'🧩', empathy:'🗺️', simulation:'🎭', matching:'🔗', quiz:'📝', truefalse:'⚖️', fillblank:'✏️' }

export const SECTION_TYPES = [
  { id: 'intro',   label: '📖 Introducción',  icon: '📖' },
  { id: 'text',    label: '📄 Texto',          icon: '📄' },
  { id: 'callout', label: '💡 Destacado',      icon: '💡' },
  { id: 'video',   label: '🎬 Video YouTube',  icon: '🎬' },
  { id: 'embed',   label: '🧩 Embed (Genially, etc.)', icon: '🧩' },
]
