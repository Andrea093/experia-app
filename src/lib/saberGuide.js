// =============================================
// EXPERIA — Guía de orientación Saber 11.° 2026-1 (Icfes): competencias,
// afirmaciones, evidencias y la distribución de preguntas por competencia
// (tablas 17, 23, 27 y 31 de la guía). Funciones PURAS, sin React ni Supabase.
//
// ⚠️ REGLA QUE NO SE PUEDE ROMPER: cada ronda de preguntas de una sesión cumple
// la distribución por competencias de su prueba. Se exige en cuatro puntos:
// editor de la ronda, publicar la ruta, iniciar la Clase en Vivo y, en el
// servidor, al entrar a la ronda (`saber_round_problem`, migración 0084).
// Si cambian los porcentajes, cambiarlos TAMBIÉN en esa función SQL.
//
// La pregunta guarda solo `evidencia` ('2.3'): de ahí salen la afirmación y la
// competencia. La asociación del banco está en scripts/banco-preguntas/guia_mapeo.py.
// =============================================

const af = (n, text, evidencias) => ({ n, text, evidencias })

const CIENCIAS = {
  label: 'Ciencias Naturales',
  competencias: [
    { id: 'uso', label: 'Uso comprensivo del conocimiento científico', short: 'Uso comprensivo', pct: 30, afirmaciones: [
      af(4, 'Asocia fenómenos naturales con conceptos propios del conocimiento científico.', {
        '4.1': 'Relaciona los componentes de un circuito en serie y en paralelo con sus respectivos voltajes y corrientes.',
        '4.2': 'Relaciona los distintos factores que determinan la dinámica de un sistema o fenómeno para identificar su comportamiento, teniendo en cuenta las leyes de la física.',
        '4.3': 'Relaciona los tipos de energía presentes en un objeto con las interacciones que presenta el sistema con su entorno.',
        '4.4': 'Establece relaciones entre fenómenos biológicos para comprender la dinámica de lo vivo.',
        '4.5': 'Establece relaciones entre fenómenos biológicos para comprender su entorno.',
        '4.6': 'Diferencia distintos tipos de reacciones químicas y realiza de manera adecuada cálculos teniendo en cuenta la ley de conservación de la masa y carga.',
        '4.7': 'Establece relaciones entre conceptos fisicoquímicos simples (separación de mezclas, solubilidad, gases ideales) con distintos fenómenos naturales.',
        '4.8': 'Establece relaciones entre las propiedades y estructura de la materia con la formación de iones y moléculas.',
      }),
      af(5, 'Identifica las características de algunos fenómenos de la naturaleza basado en el análisis de información y conceptos propios del conocimiento científico.', {
        '5.1': 'Identifica las características fundamentales de las ondas, así como las variables y parámetros que afectan estas características en un medio de propagación.',
        '5.2': 'Identifica las formas de energía presentes en un fenómeno físico y las transformaciones que se dan entre ellas.',
        '5.3': 'Identifica los diferentes tipos de fuerzas que actúan sobre los cuerpos que conforman un sistema.',
        '5.4': 'Identifica características de algunos procesos que se dan en los ecosistemas para comprender la dinámica que se da a su interior.',
        '5.5': 'Identifica características de algunos procesos que se dan en los organismos para comprender la dinámica de lo vivo.',
        '5.6': 'Identifica las propiedades y estructura de la materia y diferencia elementos, compuestos y mezclas.',
        '5.7': 'Reconoce posibles cambios en el entorno por la explotación de un recurso o el uso de una tecnología.',
      }),
    ] },
    { id: 'explicacion', label: 'Explicación de fenómenos', short: 'Explicación', pct: 30, afirmaciones: [
      af(1, 'Analiza el potencial del uso de recursos naturales o artefactos y sus efectos sobre el entorno y la salud, así como las posibilidades de desarrollo para las comunidades.', {
        '1.1': 'Explica algunos principios para mantener la salud individual y la pública basado en principios biológicos, químicos y físicos.',
        '1.2': 'Explica cómo la explotación de un recurso o el uso de una tecnología tiene efectos positivos o negativos en las personas y en el entorno.',
        '1.3': 'Explica el uso correcto y seguro de una tecnología o artefacto en un contexto específico.',
      }),
      af(2, 'Explica cómo ocurren algunos fenómenos de la naturaleza basado en observaciones, patrones y conceptos propios del conocimiento científico.', {
        '2.1': 'Da las razones por las cuales una reacción describe un fenómeno y justifica las relaciones cuantitativas existentes, teniendo en cuenta la ley de conservación de la masa y carga.',
        '2.2': 'Reconoce las razones por las cuales la materia se puede diferenciar, según su estructura y propiedades, y justifica las diferencias entre elementos, compuestos y mezclas.',
        '2.3': 'Reconoce los atributos que definen ciertos procesos fisicoquímicos simples (separación de mezclas, solubilidad, gases ideales, cambios de fase) y da razón de la manera en que ocurren.',
        '2.4': 'Elabora explicaciones al relacionar las variables de estado que describen un sistema electrónico, argumentando a partir de los modelos básicos de circuitos.',
        '2.5': 'Elabora explicaciones al relacionar las variables de estado que describen un sistema, argumentando a partir de los modelos básicos de cinemática y dinámica newtoniana.',
        '2.6': 'Elabora explicaciones al relacionar las variables de estado que describen un sistema, argumentando a partir de los modelos básicos de la termodinámica.',
        '2.7': 'Elabora explicaciones al relacionar las variables de estado que describen un sistema, argumentando a partir de los modelos básicos de ondas.',
        '2.8': 'Analiza aspectos de los ecosistemas y da razón de cómo funcionan, de sus interrelaciones con los factores bióticos y abióticos y de sus efectos al modificarse alguna variable interna.',
        '2.9': 'Analiza la dinámica interna de los organismos y da razón de cómo funcionan sus componentes por separado y en conjunto para mantener la vida en el organismo.',
      }),
      af(3, 'Modela fenómenos de la naturaleza basado en el análisis de variables, la relación entre dos o más conceptos del conocimiento científico y de la evidencia derivada de investigaciones científicas.', {
        '3.1': 'Usa modelos físicos basados en dinámica clásica para comprender un fenómeno particular en un sistema.',
        '3.2': 'Identifica y usa modelos químicos para comprender fenómenos particulares de la naturaleza.',
        '3.3': 'Analiza y usa modelos biológicos para comprender la dinámica que se da en lo vivo y en el entorno.',
      }),
    ] },
    { id: 'indagacion', label: 'Indagación', short: 'Indagación', pct: 40, afirmaciones: [
      af(6, 'Comprende que a partir de la investigación científica se construyen explicaciones sobre el mundo natural.', {
        '6.1': 'Analiza qué tipo de pregunta puede ser contestada a partir del contexto de una investigación científica.',
        '6.2': 'Reconoce la importancia de la evidencia para comprender fenómenos naturales.',
      }),
      af(7, 'Deriva conclusiones para algunos fenómenos de la naturaleza, basándose en conocimientos científicos y en la evidencia de su propia investigación y la de otros.', {
        '7.1': 'Comunica de forma apropiada el proceso y los resultados de investigación en ciencias naturales.',
        '7.2': 'Determina si los resultados derivados de una investigación son suficientes y pertinentes para sacar conclusiones en una situación dada.',
        '7.3': 'Elabora conclusiones a partir de información o evidencias que las respalden.',
        '7.4': 'Hace predicciones basado en información, patrones y regularidades.',
      }),
      af(8, 'Observa y relaciona patrones en los datos para evaluar las predicciones.', {
        '8.1': 'Interpreta y analiza datos representados en texto, gráficas, dibujos, diagramas o tablas.',
        '8.2': 'Representa datos en gráficas y tablas.',
      }),
      af(9, 'Utiliza algunas habilidades de pensamiento y de procedimiento para evaluar predicciones.', {
        '9.1': 'Da posibles explicaciones de eventos o fenómenos consistentes con conceptos de la ciencia.',
        '9.2': 'Diseña experimentos para dar respuesta a sus preguntas.',
        '9.3': 'Elige y utiliza instrumentos adecuados para reunir datos.',
        '9.4': 'Reconoce la necesidad de registrar y clasificar la información para realizar un buen análisis.',
        '9.5': 'Usa información adicional para evaluar una predicción.',
      }),
    ] },
  ],
}

export const SABER_GUIDES = {
  matematicas: {
    label: 'Matemáticas',
    competencias: [
      { id: 'interpretacion', label: 'Interpretación y representación', short: 'Interpretación', pct: 34, afirmaciones: [
        af(1, 'Comprende y transforma la información cuantitativa y esquemática presentada en distintos formatos.', {
          '1.1': 'Da cuenta de las características básicas de la información presentada en diferentes formatos, como series, gráficas, tablas y esquemas.',
          '1.2': 'Transforma la representación de una o más piezas de información.',
        }),
      ] },
      { id: 'formulacion', label: 'Formulación y ejecución', short: 'Formulación', pct: 43, afirmaciones: [
        af(2, 'Frente a un problema que involucre información cuantitativa, plantea e implementa estrategias que lleven a soluciones adecuadas.', {
          '2.1': 'Diseña planes para la solución de problemas que involucran información cuantitativa o esquemática.',
          '2.2': 'Ejecuta un plan de solución para un problema que involucra información cuantitativa o esquemática.',
          '2.3': 'Resuelve un problema que involucra información cuantitativa o esquemática.',
        }),
      ] },
      { id: 'argumentacion', label: 'Argumentación', short: 'Argumentación', pct: 23, afirmaciones: [
        af(3, 'Valida procedimientos y estrategias matemáticas utilizadas para dar solución a problemas.', {
          '3.1': 'Plantea afirmaciones que sustentan o refutan una interpretación dada a la información disponible en el marco de la solución de un problema.',
          '3.2': 'Argumenta a favor o en contra de un procedimiento para resolver un problema a la luz de criterios presentados o establecidos.',
          '3.3': 'Establece la validez o pertinencia de una solución propuesta a un problema dado.',
        }),
      ] },
    ],
  },
  // En Lectura crítica la guía distribuye las preguntas por AFIRMACIÓN.
  lectura: {
    label: 'Lectura crítica',
    competencias: [
      { id: 'local', label: 'Identifica y entiende los contenidos locales', short: 'Contenidos locales', pct: 25, afirmaciones: [
        af(1, 'Identifica y entiende los contenidos locales que conforman un texto.', {
          '1.1': 'Entiende el significado de los elementos locales que constituyen un texto.',
          '1.2': 'Identifica los eventos narrados de manera explícita en un texto (literario, descriptivo, caricatura o cómic) y los personajes involucrados (si los hay).',
        }),
      ] },
      { id: 'global', label: 'Comprende cómo se articulan las partes de un texto', short: 'Articulación', pct: 42, afirmaciones: [
        af(2, 'Comprende cómo se articulan las partes de un texto para darle un sentido global.', {
          '2.1': 'Comprende la estructura formal de un texto y la función de sus partes.',
          '2.2': 'Identifica y caracteriza las diferentes voces o situaciones presentes en un texto.',
          '2.3': 'Comprende las relaciones entre diferentes partes o enunciados de un texto.',
          '2.4': 'Identifica y caracteriza las ideas o afirmaciones presentes en un texto informativo.',
          '2.5': 'Identifica el tipo de relación existente entre diferentes elementos de un texto (discontinuo).',
        }),
      ] },
      { id: 'reflexion', label: 'Reflexiona a partir de un texto y evalúa su contenido', short: 'Reflexión', pct: 33, afirmaciones: [
        af(3, 'Reflexiona a partir de un texto y evalúa su contenido.', {
          '3.1': 'Establece la validez e implicaciones de un enunciado de un texto (argumentativo o expositivo).',
          '3.2': 'Establece relaciones entre un texto y otros textos o enunciados.',
          '3.3': 'Reconoce contenidos valorativos presentes en un texto.',
          '3.4': 'Reconoce las estrategias discursivas en un texto.',
          '3.5': 'Contextualiza adecuadamente un texto o la información contenida en este.',
        }),
      ] },
    ],
  },
  sociales: {
    label: 'Sociales y Ciudadanas',
    competencias: [
      { id: 'social', label: 'Pensamiento social', short: 'Pensamiento social', pct: 30, afirmaciones: [
        af(1, 'Comprende modelos conceptuales, sus características y contextos de aplicación.', {
          '1.1': 'Identifica y usa conceptos sociales básicos (económicos, políticos, culturales y geográficos).',
          '1.2': 'Conoce el modelo de Estado Social de Derecho y su aplicación en Colombia.',
          '1.3': 'Conoce la organización del Estado: las funciones y alcances de las ramas del poder y de los organismos de control.',
          '1.4': 'Conoce los mecanismos que los ciudadanos tienen a su disposición para participar activamente en la democracia y para garantizar el respeto de sus derechos.',
        }),
        af(2, 'Comprende dimensiones espaciales y temporales de eventos, problemáticas y prácticas sociales.', {
          '2.1': 'Localiza en el tiempo y en el espacio eventos históricos y prácticas sociales.',
          '2.2': 'Relaciona dimensiones históricas y geográficas de eventos y problemáticas sociales.',
          '2.3': 'Relaciona problemáticas o prácticas sociales con características del espacio geográfico.',
        }),
      ] },
      { id: 'perspectivas', label: 'Interpretación y análisis de perspectivas', short: 'Perspectivas', pct: 40, afirmaciones: [
        af(3, 'Contextualiza y evalúa usos de fuentes y argumentos.', {
          '3.1': 'Inscribe una fuente primaria dada en un contexto económico, político o cultural.',
          '3.2': 'Evalúa posibilidades y limitaciones del uso de una fuente para apoyar argumentos o explicaciones.',
          '3.3': 'Devela prejuicios e intenciones en enunciados o argumentos.',
        }),
        af(4, 'Comprende perspectivas de distintos actores y grupos sociales.', {
          '4.1': 'Reconoce y compara perspectivas de actores y grupos sociales.',
          '4.2': 'Reconoce que las cosmovisiones, ideologías y roles sociales influyen en diferentes argumentos, posiciones y conductas.',
          '4.3': 'Establece relaciones entre las perspectivas de los individuos en una situación conflictiva y las propuestas de solución.',
        }),
      ] },
      { id: 'reflexivo', label: 'Pensamiento reflexivo y sistémico', short: 'Reflexivo y sistémico', pct: 30, afirmaciones: [
        af(5, 'Evalúa usos sociales de las ciencias sociales.', {
          '5.1': 'Analiza modelos conceptuales y sus usos en decisiones sociales.',
        }),
        af(6, 'Comprende que los problemas y sus soluciones involucran distintas dimensiones y reconoce relaciones entre estas.', {
          '6.1': 'Establece relaciones que hay entre dimensiones presentes en una situación problemática.',
          '6.2': 'Analiza los efectos en distintas dimensiones que tendría una posible intervención.',
        }),
      ] },
    ],
  },
  biologia: CIENCIAS,
  quimica: CIENCIAS,
  fisica: CIENCIAS,
}

// Una ronda más corta dejaría competencias sin ninguna pregunta.
export const MIN_ROUND_QUESTIONS = 5

export const evidenceInfo = (area, code) => {
  for (const competencia of SABER_GUIDES[area]?.competencias || []) {
    for (const afirmacion of competencia.afirmaciones) {
      if (afirmacion.evidencias[code]) {
        return { code, competencia, afirmacion, evidencia: afirmacion.evidencias[code] }
      }
    }
  }
  return null
}

// Los porcentajes de la guía casi nunca dan números enteros (34 % de 10 = 3,4).
// Método del mayor residuo: a cada competencia su parte entera, y lo que falta
// a las de mayor residuo (empate: la primera de la guía). La suma siempre es n.
export const requiredDistribution = (area, n) => {
  const comps = SABER_GUIDES[area]?.competencias || []
  const rows = comps.map((c, i) => ({ id: c.id, i, count: Math.floor(c.pct * n / 100), rest: (c.pct * n) % 100 }))
  let left = n - rows.reduce((s, r) => s + r.count, 0)
  for (const r of [...rows].sort((a, b) => b.rest - a.rest || a.i - b.i)) {
    if (left-- <= 0) break
    r.count++
  }
  return Object.fromEntries(rows.map(r => [r.id, r.count]))
}

// ¿Esta lista de preguntas cumple la distribución? `problems` trae las frases
// que se le muestran al tutor; vacía = cumple.
export const checkRound = (area, questions = []) => {
  const guide = SABER_GUIDES[area]
  if (!guide) return { ok: true, n: questions.length, rows: [], untagged: [], problems: [] }
  const n = questions.length
  const required = requiredDistribution(area, n)
  const actual = Object.fromEntries(guide.competencias.map(c => [c.id, 0]))
  const untagged = []
  questions.forEach((q, i) => {
    const info = evidenceInfo(area, q.evidencia)
    if (info) actual[info.competencia.id]++
    else untagged.push(i)
  })
  const rows = guide.competencias.map(c => ({
    id: c.id, label: c.label, short: c.short, pct: c.pct,
    required: required[c.id], actual: actual[c.id], ok: required[c.id] === actual[c.id],
  }))
  const problems = []
  if (n < MIN_ROUND_QUESTIONS) problems.push(`La ronda necesita al menos ${MIN_ROUND_QUESTIONS} preguntas para cubrir todas las competencias (tiene ${n}).`)
  if (untagged.length) problems.push(`${untagged.length === 1 ? 'La pregunta' : 'Las preguntas'} ${untagged.map(i => i + 1).join(', ')} no ${untagged.length === 1 ? 'tiene' : 'tienen'} evidencia de la guía asignada.`)
  rows.filter(r => !r.ok).forEach(r => {
    const d = r.required - r.actual
    problems.push(`${r.short}: ${d > 0 ? `faltan ${d}` : `sobran ${-d}`} (debe tener ${r.required} de ${n}, tiene ${r.actual}).`)
  })
  return { ok: problems.length === 0, n, rows, untagged, problems }
}

// Una ronda viene con dos formas según quién la lea: `mod.questions` en el
// editor y `mod.challenge_data.questions` crudo de la BD.
const roundArea  = (m) => m.bank || m.challenge_data?.bank
const roundQs    = (m) => m.questions || m.challenge_data?.questions || []
const isRound    = (m) => m?.type === 'challenge' && (m.ctype || m.challenge_type) === 'quiz' && !!roundArea(m)

// Las preguntas del banco toman su evidencia del banco (la autoridad), aunque
// la ronda se haya guardado antes de existir la asociación.
export const tagWithBank = (questions, evidenceById) =>
  questions.map(q => (evidenceById[q.id] ? { ...q, evidencia: evidenceById[q.id] } : q))

export const evidenceIndex = (bank) =>
  Object.fromEntries((bank?.questions || []).filter(q => q.evidencia).map(q => [q.id, q.evidencia]))

// Revisa todas las rondas de una ruta. `modules` sale con las evidencias del
// banco ya puestas; `problems` = [{ title, problems }] de las que no cumplen.
export const auditRounds = (moduleList, bank) => {
  const index = evidenceIndex(bank)
  const problems = []
  const modules = moduleList.map(m => {
    if (!isRound(m)) return m
    const questions = tagWithBank(roundQs(m), index)
    const check = checkRound(roundArea(m), questions)
    if (!check.ok) problems.push({ title: m.title, problems: check.problems })
    return m.questions
      ? { ...m, questions }
      : { ...m, challenge_data: { ...m.challenge_data, questions } }
  })
  return { modules, problems }
}

export const describeRoundProblems = (problems) =>
  problems.map(p => `«${p.title}»: ${p.problems.join(' ')}`).join(' — ')
