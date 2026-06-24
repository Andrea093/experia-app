-- ============================================================
-- 0014_seed_matematicas_course.sql
-- Crea el curso "Sala de Escape - Matematicas" con tema escape-room
-- y siembra los 9 modulos de formacion docente en matematicas.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- Requiere migracion 0012 (columnas theme y character_line).
--
-- Esquema real de course_modules (ver 0007/0011): id uuid auto,
-- columnas "order", is_enabled, area_id, challenge_type, challenge_data.
-- Las formas de content/challenge_data coinciden con lo que renderiza
-- el frontend (lesson.jsx y challenges.jsx). Plantilla: 0013.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
BEGIN

  -- ── 1. Crear el curso si no existe ──────────────────────────────────────
  INSERT INTO public.courses (name, area_id, is_active, theme)
  VALUES ('Sala de Escape - Matematicas', 'matematicas', true, 'escape-room')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'escape-room'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear ni encontrar el curso escape-room';
  END IF;

  RAISE NOTICE 'Curso escape-room ID: %', v_course_id;

  -- ── 2. Limpiar modulos previos (para re-ejecutar limpiamente) ────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ── 3. Sembrar los 9 modulos ─────────────────────────────────────────────

  -- MODULO 1 (lesson) — La Puerta del Numero
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'La Puerta del Numero',
    'Modulo 1 — Pensamiento Matematico',
    'Comprende que pensar matematicamente es mucho mas que calcular: es razonar, modelar y comunicar.',
    'lesson', 1, 100, true, null,
    'Bienvenido a la Sala de Escape. La primera puerta se abre comprendiendo que las matematicas son mas que numeros.',
    $j1$[
      {
        "type": "intro",
        "title": "El pensamiento matematico en la ensenanza",
        "text": "Pensar matematicamente no es solo calcular. Es razonar, argumentar, modelar situaciones reales y comunicar ideas con precision. Como docentes, nuestra tarea es abrir esa puerta para nuestros estudiantes."
      },
      {
        "type": "quote",
        "text": "Las matematicas no son mas que un lenguaje de patrones. Quien aprende a verlos, aprende a leer el universo.",
        "author": "Henri Poincare"
      },
      {
        "type": "steps",
        "title": "Las cuatro competencias matematicas",
        "items": [
          { "icon": "🔢", "t": "Razonamiento", "d": "Identificar patrones, formular conjeturas y construir argumentos logicos." },
          { "icon": "📐", "t": "Modelacion", "d": "Traducir situaciones del mundo real al lenguaje matematico y viceversa." },
          { "icon": "🔗", "t": "Comunicacion", "d": "Expresar ideas matematicas de forma clara, oral y escrita." },
          { "icon": "🧩", "t": "Resolucion", "d": "Aplicar estrategias para resolver problemas desconocidos o novedosos." }
        ]
      },
      {
        "type": "text",
        "text": "El Diseno Centrado en la Experiencia (DCE) propone que el docente disene situaciones donde el estudiante explore, se equivoque y construya significado. No memorizacion: comprension profunda."
      },
      {
        "type": "reveal",
        "title": "Reflexion: Que tipo de docente matematico quieres ser?",
        "label": "Abrir reflexion",
        "openLabel": "Cerrar reflexion",
        "icon": "🤔",
        "items": [
          { "t": "Transmisor de formulas", "d": "El docente explica, el estudiante repite. Funciona a corto plazo, pero no construye comprension duradera." },
          { "t": "Facilitador de exploracion", "d": "El docente plantea retos, guia el razonamiento y valida las ideas de los estudiantes. Genera aprendizaje significativo." },
          { "t": "Disenador de experiencias", "d": "El docente crea situaciones autenticas donde las matematicas emergen como herramienta necesaria. El nivel mas transformador." }
        ],
        "text": "Antes de continuar, piensa en un momento en que una leccion de matematicas te cambio la forma de ver algo. Que hizo ese docente diferente? La respuesta sera tu guia en este curso."
      }
    ]$j1$::jsonb
  );

  -- MODULO 2 (challenge dragdrop) — Secuencia de Acceso
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Secuencia de Acceso',
    'Reto 1 — Pensamiento Matematico',
    'Ordena las fases del proceso de ensenanza matematica segun el enfoque DCE.',
    'challenge', 'dragdrop', 2, 150, true, null,
    'Ordena los pasos correctamente y escucharas el clic de la cerradura abrirse.',
    $j2${
      "dragItems": [
        "Plantear una situacion problematica de la vida real",
        "Explorar y manipular el problema de forma libre",
        "Identificar los conceptos matematicos involucrados",
        "Formalizar el concepto con definiciones y simbolos",
        "Aplicar el concepto en nuevos contextos",
        "Reflexionar sobre el proceso de aprendizaje"
      ]
    }$j2$::jsonb
  );

  -- MODULO 3 (lesson) — El Cuarto de las Proporciones
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El Cuarto de las Proporciones',
    'Modulo 2 — Razonamiento Proporcional',
    'El pensamiento proporcional, uno de los conceptos mas potentes y mas malentendidos de la escuela.',
    'lesson', 3, 120, true, null,
    'La proporcion es la llave que equilibra los dos lados de la cerradura. Sin equilibrio, la puerta no gira.',
    $j3$[
      {
        "type": "intro",
        "title": "Razon, proporcion y pensamiento proporcional",
        "text": "El pensamiento proporcional es uno de los conceptos mas potentes en la educacion primaria y secundaria. Comprenderlo profundamente como docente te permite anticipar las dificultades de tus estudiantes y disenar mejores experiencias."
      },
      {
        "type": "steps",
        "title": "Tres ideas que debes dominar",
        "items": [
          { "icon": "⚖️", "t": "Razon", "d": "Comparacion multiplicativa entre dos cantidades: si hay 3 manzanas por cada 2 naranjas, la razon es 3:2." },
          { "icon": "🔄", "t": "Proporcion", "d": "Igualdad entre dos razones: a/b = c/d. La base de porcentajes, escalas y tasas de cambio." },
          { "icon": "📊", "t": "Pensamiento proporcional", "d": "La capacidad de reconocer y usar relaciones multiplicativas en contextos variados. Se desarrolla gradualmente, no se transmite de golpe." }
        ]
      },
      {
        "type": "quote",
        "text": "Un estudiante que solo memoriza reglas de proporciones sin comprender su significado es como alguien que sabe las notas de una cancion pero no puede escuchar la melodia.",
        "author": "Hans Freudenthal, Matematica Realista"
      },
      {
        "type": "image",
        "title": "La balanza como modelo de la proporcion",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Scale_of_justice_2_new.svg/800px-Scale_of_justice_2_new.svg.png",
        "caption": "La balanza como modelo fisico de la proporcion: equilibrio entre razones iguales."
      },
      {
        "type": "reveal",
        "title": "Errores clasicos que cometen los estudiantes",
        "label": "Abrir expediente de errores",
        "openLabel": "Cerrar expediente",
        "icon": "🗂️",
        "items": [
          { "t": "Razonamiento aditivo en contextos multiplicativos", "d": "El estudiante suma en lugar de multiplicar. Ejemplo: si 2 chocolates cuestan 500, creen que 5 cuestan 503." },
          { "t": "Invertir la razon", "d": "Confunden a/b con b/a. Critico en problemas de velocidad, densidad y escalas." },
          { "t": "Porcentaje como numero absoluto", "d": "El 20% de 50 y el 20% de 200 producen resultados distintos, pero muchos estudiantes los tratan igual." }
        ],
        "text": "Conocer los obstaculos tipicos te permite disenar actividades que los anticipen."
      }
    ]$j3$::jsonb
  );

  -- MODULO 4 (challenge empathy) — Mapa de Obstaculos
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Mapa de Obstaculos',
    'Reto 2 — Empatia con el Estudiante',
    'Construye el mapa de empatia de un estudiante de grado 7 con dificultades en fracciones y porcentajes.',
    'challenge', 'empathy', 4, 150, true, null,
    'Para abrir la puerta del aprendizaje, primero debes entrar a la mente de quien aprende.',
    $j4${
      "empathyCards": [
        { "id": 1, "text": "Cree que las fracciones no sirven para nada en la vida real", "correct": "piensa" },
        { "id": 2, "text": "Piensa que es malo para las matematicas y nunca mejorara", "correct": "piensa" },
        { "id": 3, "text": "Siente verguenza cuando pasa al tablero a resolver porcentajes", "correct": "siente" },
        { "id": 4, "text": "Se frustra cuando la respuesta no le sale a la primera", "correct": "siente" },
        { "id": 5, "text": "Dice: profe, esto cuando lo voy a usar?", "correct": "dice" },
        { "id": 6, "text": "Pregunta si puede usar la calculadora para todo", "correct": "dice" },
        { "id": 7, "text": "Copia el procedimiento sin entender por que funciona", "correct": "hace" },
        { "id": 8, "text": "Evita participar y se esconde en la ultima fila", "correct": "hace" }
      ]
    }$j4$::jsonb
  );

  -- MODULO 5 (lesson) — La Sala de los Datos
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'La Sala de los Datos',
    'Modulo 3 — Pensamiento Estadistico',
    'Ensenamos estadistica para que los estudiantes lean el mundo con sentido critico, no para memorizar formulas.',
    'lesson', 5, 130, true, null,
    'Los datos son pistas ocultas en los numeros. Aprender a leerlos abre puertas que otros no pueden ver.',
    $j5$[
      {
        "type": "intro",
        "title": "Estadistica y pensamiento estadistico en el aula",
        "text": "Vivimos en la era de los datos. Ensenamos estadistica para que los estudiantes lean el mundo con sentido critico: no para que memoricen formulas de media y moda, sino para que tomen decisiones informadas."
      },
      {
        "type": "steps",
        "title": "El ciclo del pensamiento estadistico",
        "items": [
          { "icon": "❓", "t": "Plantear una pregunta estadistica", "d": "Una pregunta estadistica tiene variabilidad: distintas personas responderian diferente. Ejemplo: Cuantas horas duermes por noche?" },
          { "icon": "📋", "t": "Recoger datos", "d": "Decidir que datos, como recogerlos y de quien. La calidad del dato determina la calidad de la conclusion." },
          { "icon": "📊", "t": "Analizar y representar", "d": "Elegir la representacion adecuada: tabla, grafico de barras, histograma, diagrama de puntos. Cada uno revela algo diferente." },
          { "icon": "💡", "t": "Interpretar y comunicar", "d": "Formular conclusiones honestas: lo que los datos muestran y lo que NO muestran." }
        ]
      },
      {
        "type": "quote",
        "text": "Los datos no hablan por si solos. Necesitan un interprete que comprenda su contexto, sus limitaciones y sus posibilidades.",
        "author": "George Box, estadistico"
      },
      {
        "type": "reveal",
        "title": "Actividades de alta calidad para estadistica en el aula",
        "label": "Ver actividades recomendadas",
        "openLabel": "Cerrar actividades",
        "icon": "🔬",
        "items": [
          { "t": "Censos del salon", "d": "Recoger datos reales del grupo: tiempos de desplazamiento, gustos, habitos. Los estudiantes se convierten en datos y en analistas." },
          { "t": "Lectura critica de graficos", "d": "Analizar graficos de periodicos o redes sociales que pueden ser enganosos. Excelente para pensamiento critico." },
          { "t": "Mini-investigaciones", "d": "Grupos de 3-4 estudiantes formulan su propia pregunta estadistica, recogen datos y presentan conclusiones." }
        ],
        "text": "Estas actividades generan pensamiento estadistico autentico, no solo calculo mecanico."
      }
    ]$j5$::jsonb
  );

  -- MODULO 6 (challenge simulation) — El Panel de Control
  -- Nota: el frontend renderiza una simulacion pedagogica generica (SIM_TREE).
  -- El contenido de challenge_data se conserva para uso futuro pero hoy se ignora.
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'El Panel de Control',
    'Reto 3 — Decisiones Pedagogicas',
    'Toma decisiones de diseno para una clase de sistemas de ecuaciones y observa su impacto.',
    'challenge', 'simulation', 6, 200, true, null,
    'Cada decision pedagogica activa o desactiva una palanca del aprendizaje. Elige con sabiduria.',
    $j6${
      "simContext": "Eres docente de matematicas en grado 8. Tienes que planear una clase sobre sistemas de ecuaciones lineales y debes tomar decisiones pedagogicas clave.",
      "steps": [
        {
          "prompt": "Como introduces el tema de sistemas de ecuaciones?",
          "options": [
            { "text": "Explico el metodo de sustitucion en el tablero con ejemplos numericos", "outcome": "Los estudiantes copian los pasos pero no comprenden cuando aplicarlos. Resultado mecanico.", "score": 1 },
            { "text": "Planteo una situacion: dos amigos quieren comprar boletas para el mismo concierto con distintos presupuestos", "outcome": "Los estudiantes sienten la necesidad del sistema. El modelo emerge naturalmente.", "score": 3 },
            { "text": "Doy la definicion formal y luego ejercicios de practica", "outcome": "Accesible pero desconectado del contexto real. Comprension parcial.", "score": 2 }
          ]
        },
        {
          "prompt": "Un estudiante dice: profe, para que sirve esto en la vida real? Como respondes?",
          "options": [
            { "text": "Le digo que es parte del curriculo y que necesita aprenderlo para el examen", "outcome": "El estudiante cierra la mente. La motivacion cae.", "score": 1 },
            { "text": "Le muestro ejemplos de uso en ingenieria, economia y programacion", "outcome": "Interesante pero abstracto. Mejora un poco la motivacion.", "score": 2 },
            { "text": "Convierto su pregunta en el proyecto del bimestre: investigar un problema real que se resuelva con sistemas", "outcome": "El estudiante se vuelve protagonista. La pregunta se transforma en motor de aprendizaje.", "score": 3 }
          ]
        },
        {
          "prompt": "Como evaluas si los estudiantes comprendieron los sistemas de ecuaciones?",
          "options": [
            { "text": "Quiz de 10 ejercicios mecanicos por sustitucion o eliminacion", "outcome": "Mide procedimiento, no comprension. Muchos pasan sin entender.", "score": 1 },
            { "text": "Pido que expliquen con sus palabras cuando hay solucion unica, ninguna o infinitas", "outcome": "Evalua comprension conceptual. Deben razonar, no solo operar.", "score": 3 },
            { "text": "Taller de problemas en grupo con distintos contextos", "outcome": "Evalua aplicacion y comunicacion. Buen balance.", "score": 2 }
          ]
        }
      ]
    }$j6$::jsonb
  );

  -- MODULO 7 (lesson) — El Corredor Logico
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El Corredor Logico',
    'Modulo 4 — Argumentacion Matematica',
    'Argumentar en matematicas es construir un camino logico que convenza a cualquier persona razonable.',
    'lesson', 7, 130, true, null,
    'La logica es el mapa de la mazmorra. Sin ella, cada corredor conduce a un callejon sin salida.',
    $j7$[
      {
        "type": "intro",
        "title": "Argumentacion matematica: el arte de demostrar",
        "text": "Argumentar en matematicas no es pelear. Es construir un camino logico que convenza a cualquier persona razonable. La argumentacion es la columna vertebral del pensamiento matematico avanzado y puede ensenarse desde la primaria."
      },
      {
        "type": "steps",
        "title": "El ciclo de la demostracion",
        "items": [
          { "icon": "🔍", "t": "Conjetura", "d": "Una idea que parece verdadera pero aun no esta demostrada. El punto de partida de toda matematica creativa." },
          { "icon": "🧪", "t": "Verificacion", "d": "Probar la conjetura con casos especificos. Si falla en uno, la conjetura es falsa. Si funciona en muchos, motiva la busqueda de una demostracion." },
          { "icon": "📝", "t": "Demostracion", "d": "Un argumento riguroso y general que prueba que la conjetura es siempre verdadera, sin importar el caso." },
          { "icon": "🔄", "t": "Generalizacion", "d": "Extender el resultado a contextos mas amplios. El ciclo comienza de nuevo con nuevas conjeturas." }
        ]
      },
      {
        "type": "quote",
        "text": "No me convences con ejemplos; me convences con argumentos. Pero los ejemplos me ayudan a creer que vale la pena buscar el argumento.",
        "author": "Paul Halmos, matematico"
      },
      {
        "type": "reveal",
        "title": "Como cultivar la argumentacion matematica en el aula",
        "label": "Ver estrategias de aula",
        "openLabel": "Cerrar estrategias",
        "icon": "📂",
        "items": [
          { "t": "Rutinas de pensamiento matematico", "d": "Comenzar cada clase con una conjetura abierta: Siempre, a veces o nunca? Los estudiantes argumentan su posicion con ejemplos y contraejemplos." },
          { "t": "Galeria de errores", "d": "Mostrar soluciones con errores intencionados y pedir que los estudiantes identifiquen y corrijan el razonamiento incorrecto." },
          { "t": "Debate matematico estructurado", "d": "Un estudiante presenta su solucion, otro la cuestiona, un tercero ofrece una alternativa. El docente orquesta sin revelar la respuesta." }
        ],
        "text": "Estas estrategias funcionan desde primero de primaria hasta bachillerato."
      }
    ]$j7$::jsonb
  );

  -- MODULO 8 (challenge matching) — Conexiones Ocultas
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Conexiones Ocultas',
    'Reto 4 — Matematicas en la Vida',
    'Conecta cada concepto matematico con la situacion cotidiana que mejor lo representa.',
    'challenge', 'matching', 8, 150, true, null,
    'Las matematicas estan en todas partes. Quien aprende a ver las conexiones, encuentra llaves que otros no notan.',
    $j8${
      "matchPairs": [
        { "id": 1, "concept": "Funcion lineal", "def": "El costo total de un taxi segun los kilometros recorridos" },
        { "id": 2, "concept": "Probabilidad", "def": "Decidir cuantos paraguas llevar al campamento segun el pronostico" },
        { "id": 3, "concept": "Geometria de areas", "def": "Calcular cuantas baldosas se necesitan para cubrir un salon" },
        { "id": 4, "concept": "Estadistica descriptiva", "def": "Comparar las notas del salon para saber si la prueba fue facil o dificil" },
        { "id": 5, "concept": "Sistemas de ecuaciones", "def": "Mezclar dos cafes de distinto precio para obtener una mezcla a precio fijo" },
        { "id": 6, "concept": "Razon y proporcion", "def": "Convertir una receta para 4 personas a una para 10 personas" }
      ]
    }$j8$::jsonb
  );

  -- MODULO 9 (final_delivery) — La Llave Maestra
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line)
  VALUES (
    v_course_id,
    'La Llave Maestra',
    'Entrega Final — Sala de Escape',
    'Disena la experiencia matematica que abrira la mente de tus estudiantes y entrega tu propuesta.',
    'final_delivery', 9, 300, true, null,
    'Has llegado al final de la Sala de Escape. La llave maestra eres tu: un docente que disena experiencias que abren mentes.'
  );

  RAISE NOTICE '9 modulos del curso Sala de Escape - Matematicas insertados correctamente.';

END $$;
