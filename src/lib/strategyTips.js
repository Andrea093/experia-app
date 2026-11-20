// =============================================
// EXPERIA — Tips de estrategia para el PROFESOR en la Clase en Vivo (nov 2026)
// Al mostrar la respuesta correcta, el panel del profesor (y la presentación)
// muestran un tip para responder ese TIPO de pregunta, según su competencia,
// para que el profesor profundice en la estrategia y no solo en la respuesta.
//
// ⚠️ BORRADOR PARA REVISIÓN DEL EQUIPO ACADÉMICO. Son estrategias generales de
// resolución escritas para Experia (no se tomaron textos de la guía del Icfes):
// la guía solo aporta las competencias a las que se asocian. El equipo
// académico debe revisarlas y ajustarlas; editar aquí y desplegar.
//
// Llave: competencia.id de saberGuide.js. Las tres asignaturas de Ciencias
// comparten guía (mismas competencias). Lo ve SOLO el profesor.
// =============================================

export const STRATEGY_TIPS = {
  // ---- Ciencias Naturales (Biología, Química, Física) ----
  uso: {
    title: 'Uso comprensivo del conocimiento científico',
    steps: [
      'Pide que nombren el concepto que está detrás de la pregunta antes de mirar las opciones.',
      'Descarta en voz alta las opciones que usan palabras científicas correctas pero con una relación equivocada.',
      'Pregunta: «¿Qué tendría que ser cierto para que esta opción fuera la correcta?».',
    ],
  },
  explicacion: {
    title: 'Explicación de fenómenos',
    steps: [
      'Separa el QUÉ pasa (lo observado) del POR QUÉ pasa (la causa) en el enunciado.',
      'Busquen la opción que explica la causa, no la que solo repite lo observado con otras palabras.',
      'Revisen si la explicación sirve también para un caso parecido: si no, probablemente es incompleta.',
    ],
  },
  indagacion: {
    title: 'Indagación',
    steps: [
      'Identifiquen la pregunta del experimento: qué se cambia (variable) y qué se mide.',
      'Lean ejes, unidades y escalas de tablas y gráficas antes de comparar valores.',
      'Una conclusión válida solo dice lo que los datos permiten; descarten las que generalizan de más.',
    ],
  },
  // ---- Matemáticas ----
  interpretacion: {
    title: 'Interpretación y representación',
    steps: [
      'Antes de calcular, describan con palabras qué muestra la tabla o gráfica y en qué unidades.',
      'Ubiquen el dato exacto que pide la pregunta; muchos errores vienen de leer la fila o el eje equivocado.',
      'Comparen la opción elegida con la representación: ¿coincide el orden de magnitud?',
    ],
  },
  formulacion: {
    title: 'Formulación y ejecución',
    steps: [
      'Escriban los datos, la incógnita y la relación que los une antes de operar.',
      'Estimen el resultado aproximado; descarten opciones fuera de ese rango.',
      'Verifiquen reemplazando la respuesta en el enunciado.',
    ],
  },
  argumentacion: {
    title: 'Argumentación',
    steps: [
      'Ante «la afirmación es correcta/incorrecta porque…», decidan primero si la afirmación es verdadera y luego cuál razón la sostiene.',
      'Busquen un contraejemplo: si existe uno, la afirmación general es falsa.',
      'Desconfíen de las razones ciertas que no tienen relación con lo que se pregunta.',
    ],
  },
  // ---- Lectura crítica ----
  local: {
    title: 'Contenidos locales',
    steps: [
      'Vuelvan al fragmento exacto del texto que menciona la pregunta y léanlo con la frase anterior y la siguiente.',
      'La respuesta suele ser una paráfrasis: no tiene que repetir las mismas palabras.',
      'Descarten opciones que agregan información que el texto no dice.',
    ],
  },
  global: {
    title: 'Articulación de las partes del texto',
    steps: [
      'Pidan que resuman cada párrafo en una frase y digan cómo se conecta con el siguiente.',
      'Fíjense en conectores (sin embargo, por lo tanto, además): revelan la función de cada parte.',
      'La idea global abarca todo el texto; descarten opciones que solo describen un párrafo.',
    ],
  },
  reflexion: {
    title: 'Reflexión y evaluación del texto',
    steps: [
      'Identifiquen la intención del autor: informar, convencer, criticar o narrar.',
      'Distingan los hechos de las opiniones y revisen con qué evidencias se sostienen.',
      'Pregunten: «¿Qué haría más fuerte o más débil este argumento?».',
    ],
  },
  // ---- Sociales y Ciudadanas ----
  social: {
    title: 'Pensamiento social',
    steps: [
      'Ubiquen el concepto o la institución (derecho, mecanismo, época) que está en juego.',
      'Relacionen la situación con lo que ese concepto permite o protege.',
      'Descarten opciones que confunden instituciones o funciones parecidas.',
    ],
  },
  perspectivas: {
    title: 'Interpretación y análisis de perspectivas',
    steps: [
      'Identifiquen quiénes son los actores y qué interés tiene cada uno.',
      'Pregunten cómo vería la situación cada actor; la respuesta suele reconocer más de un punto de vista.',
      'Desconfíen de las opciones que juzgan sin considerar el contexto de quien habla.',
    ],
  },
  reflexivo: {
    title: 'Pensamiento reflexivo y sistémico',
    steps: [
      'Hagan un mapa rápido de causas y consecuencias: ¿qué dimensiones (económica, política, ambiental, cultural) aparecen?',
      'Evalúen los efectos de una decisión a corto y a largo plazo.',
      'La mejor opción suele considerar varias dimensiones del problema a la vez.',
    ],
  },
}

// Para preguntas sin evidencia asignada (quizzes propios).
export const GENERAL_TIP = {
  title: 'Estrategia general',
  steps: [
    'Lean la pregunta antes de releer el contexto: así saben qué buscar.',
    'Descarten primero las opciones claramente incorrectas y comparen las que quedan.',
    'Pidan a un estudiante que acertó explicar cómo llegó a la respuesta.',
  ],
}

export const tipForCompetencia = (competenciaId) => STRATEGY_TIPS[competenciaId] || GENERAL_TIP
