// closing_record = acta de cierre. Es el único tipo que NO resuelve el estudiante
// (lo diligencia el tutor) y por eso se filtra de la ruta en `dbRowsToCourseModules`.
// clone_dashboard = tablero del plan de unidades del libro (piloto clon, 0052).
// El contenido no vive en el módulo sino en el plan que el tutor carga por grupo
// desde "Grupos y listados": aquí el módulo solo es la puerta de entrada.
export const TYPE_LABELS = { lesson: 'MÓDULO', challenge: 'RETO', evaluation: 'EVALUACIÓN', final_delivery: 'ENTREGA FINAL', closing_record: 'ACTA DE CIERRE', clone_dashboard: 'PLAN DE UNIDADES' }
export const TYPE_COLORS = { lesson: 'var(--orange)', challenge: 'var(--purple)', evaluation: '#0D9488', final_delivery: '#0D9488', closing_record: '#B45309', clone_dashboard: '#1D4ED8' }
export const TYPE_BG    = { lesson: 'var(--orange-bg)', challenge: 'var(--purple-bg)', evaluation: '#CCFBF1', final_delivery: '#CCFBF1', closing_record: '#FEF3C7', clone_dashboard: '#DBEAFE' }

export const PAIR_COLORS = ['#E8732C','#7B3FA0','#3B82F6','#10B981','#F59E0B','#EC4899']

export const CHALLENGE_TYPES = [
  { id:'dragdrop',   label:'Arrastrar y ordenar', emoji:'🧩', desc:'Ordena elementos en secuencia correcta' },
  { id:'empathy',    label:'Mapa de empatía',     emoji:'🗺️', desc:'Clasifica tarjetas en cuadrantes' },
  { id:'simulation', label:'Simulación',           emoji:'🎭', desc:'Árbol de decisiones pedagógicas' },
  { id:'matching',   label:'Conectar conceptos',  emoji:'🔗', desc:'Empareja conceptos con definiciones' },
  { id:'quiz',       label:'Quiz',                 emoji:'📝', desc:'Preguntas de opción múltiple' },
  { id:'truefalse',  label:'Verdadero / Falso',   emoji:'⚖️', desc:'Marca cada afirmación como verdadera o falsa' },
  { id:'fillblank',  label:'Completar espacios',  emoji:'✏️', desc:'Completa los huecos del texto con el banco de palabras' },
  { id:'poll',       label:'Encuesta en vivo',     emoji:'📊', desc:'Pregunta de opinión sin respuesta correcta — muestra la distribución en vivo' },
]

export const CTYPE_EMOJI = { dragdrop:'🧩', empathy:'🗺️', simulation:'🎭', matching:'🔗', quiz:'📝', truefalse:'⚖️', fillblank:'✏️', poll:'📊' }

export const SECTION_TYPES = [
  { id: 'intro',   label: '📖 Introducción',  icon: '📖' },
  { id: 'text',    label: '📄 Texto',          icon: '📄' },
  { id: 'callout', label: '💡 Destacado',      icon: '💡' },
  { id: 'video',   label: '🎬 Video YouTube',  icon: '🎬' },
  { id: 'embed',   label: '🧩 Embed (Genially, etc.)', icon: '🧩' },
  { id: 'image',   label: '🖼️ Imagen',         icon: '🖼️' },
  // pdf = se LEE dentro de la lección (visor incrustado); download = se BAJA.
  // Para un documento largo, el visor evita tener que subirlo como una imagen
  // gigante que descuadra la página.
  { id: 'pdf',     label: '📕 Documento PDF (visor)', icon: '📕' },
  { id: 'checklist', label: '✅ Checklist',     icon: '✅' },
  { id: 'download', label: '📄 Material descargable', icon: '📄' },
]
