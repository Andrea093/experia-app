-- ============================================================
-- 0016_seed_sociales_course.sql
-- Crea el curso "Viajeros del Tiempo — Ciencias Sociales" con
-- tema time-travel y siembra los 9 modulos de formacion docente.
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
  VALUES ('Viajeros del Tiempo — Ciencias Sociales', 'ciudadanas', true, 'time-travel')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'time-travel'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear ni encontrar el curso time-travel';
  END IF;

  RAISE NOTICE 'Curso time-travel ID: %', v_course_id;

  -- ── 2. Limpiar modulos anteriores si los hubiera ────────────────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ── 3. Sembrar 9 modulos ────────────────────────────────────────────────

  -- MODULO 1 (lesson) — El Viaje Comienza
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El Viaje Comienza: Introduccion al DCE',
    'Modulo 1 — Dimensiones del Tiempo',
    'Las Ciencias Sociales comprenden el presente mirando al pasado y al futuro. Asi inicia tu viaje.',
    'lesson', 1, 100, true, null,
    'El tiempo no es un rio lineal, sino un mapa de decisiones. Hoy inicias tu propio viaje temporal como docente.',
    $j1$[
      {
        "type": "intro",
        "title": "Bienvenido al Viaje del Tiempo",
        "text": "Las Ciencias Sociales nos invitan a comprender el presente mirando hacia el pasado y el futuro. En este curso usaras el Diseno Centrado en la Experiencia (DCE) para llevar esas dimensiones temporales al aula de manera significativa."
      },
      {
        "type": "steps",
        "title": "Tres dimensiones del tiempo en el aula",
        "items": [
          { "icon": "📜", "t": "Pasado como contexto", "d": "Usar la historia para dar sentido a los fenomenos del presente." },
          { "icon": "🧭", "t": "Presente como punto de partida", "d": "Conectar la realidad de los estudiantes con los contenidos curriculares." },
          { "icon": "🔮", "t": "Futuro como horizonte", "d": "Proyectar escenarios y desarrollar pensamiento critico sobre lo que puede venir." }
        ]
      },
      {
        "type": "quote",
        "text": "La historia no se repite, pero rima. Entender esa rima es la primera habilidad del docente de sociales.",
        "author": "Prof. Kronos"
      }
    ]$j1$::jsonb
  );

  -- MODULO 2 (challenge dragdrop) — Ordena la Linea del Tiempo
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Ordena la Linea del Tiempo',
    'Reto 1 — Cronologia',
    'Ordena los hitos de la educacion colombiana del mas antiguo al mas reciente.',
    'challenge', 'dragdrop', 2, 150, true, null,
    'Arrastra cada hito al lugar que le corresponde. La cronologia es la base de todo analisis historico.',
    $j2${
      "dragItems": [
        "Pedagogia lancasteriana (1820s)",
        "Creacion de las Escuelas Normales (s. XIX)",
        "Ley General de Educacion 115 de 1994",
        "Estandares de competencias ciudadanas (2004)",
        "Plan Decenal de Educacion 2016-2026"
      ]
    }$j2$::jsonb
  );

  -- MODULO 3 (lesson) — El Estudiante en su Epoca
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El Estudiante en su Epoca',
    'Modulo 2 — Empatia Historica',
    'El pensamiento historico no es natural: debe construirse. Empieza por la perspectiva del estudiante.',
    'lesson', 3, 100, true, null,
    'Para disenar buenas experiencias historicas, primero debemos viajar a la perspectiva del estudiante.',
    $j3$[
      {
        "type": "intro",
        "title": "Que piensa y siente un estudiante de sociales?",
        "text": "El pensamiento historico no es natural; debe construirse. Antes de disenar tus lecciones, observa como tus estudiantes perciben el tiempo, la causalidad y la identidad cultural."
      },
      {
        "type": "steps",
        "title": "Observa a tu estudiante antes de disenar",
        "items": [
          { "icon": "👀", "t": "Ve y escucha", "d": "Que referentes historicos o sociales aparecen en su cotidianidad (redes, familia, barrio)?" },
          { "icon": "💭", "t": "Piensa y siente", "d": "Que emociones genera la historia en ellos: aburrimiento, orgullo, injusticia, curiosidad?" },
          { "icon": "🗣️", "t": "Dice y hace", "d": "Como hablan de lo historico? Que preguntas formulan espontaneamente?" },
          { "icon": "⚠️", "t": "Dolores", "d": "Fechas sin contexto, memorizacion sin comprension, desconexion con el presente." },
          { "icon": "🎁", "t": "Ganancias", "d": "Identidad, sentido de pertenencia, capacidad critica, habilidades de ciudadania." }
        ]
      },
      {
        "type": "quote",
        "text": "Un estudiante que conecta el pasado con su vida hoy, ya es un pensador historico.",
        "author": "Prof. Kronos"
      }
    ]$j3$::jsonb
  );

  -- MODULO 4 (challenge empathy) — Mapa de Empatia del Estudiante
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Mapa de Empatia del Estudiante',
    'Reto 2 — Empatia con el Estudiante',
    'Clasifica cada observacion de un estudiante de Ciencias Sociales en el cuadrante correcto.',
    'challenge', 'empathy', 4, 200, true, null,
    'Clasifica cada observacion en el cuadrante correcto del mapa de empatia. Esto definira tu punto de partida de diseno.',
    $j4${
      "empathyCards": [
        { "id": 1, "text": "Cree que la historia ya no cambia ni le afecta", "correct": "piensa" },
        { "id": 2, "text": "Quiere entender por que pasan las noticias de hoy", "correct": "piensa" },
        { "id": 3, "text": "Se aburre leyendo el libro de texto sobre la Independencia", "correct": "siente" },
        { "id": 4, "text": "Siente orgullo cuando aprende de la historia de su region", "correct": "siente" },
        { "id": 5, "text": "Pregunta por que se sigue repitiendo la corrupcion", "correct": "dice" },
        { "id": 6, "text": "Dice que la historia es solo memorizar fechas y nombres", "correct": "dice" },
        { "id": 7, "text": "Comparte memes historicos en sus redes sociales", "correct": "hace" },
        { "id": 8, "text": "Nunca ha visitado un museo ni un sitio historico", "correct": "hace" }
      ]
    }$j4$::jsonb
  );

  -- MODULO 5 (lesson) — Pensamiento Historico y DCE
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Pensamiento Historico y DCE',
    'Modulo 3 — El Nucleo del Viaje',
    'Como el DCE transforma la ensenanza de la historia en una experiencia viva e inolvidable.',
    'lesson', 5, 150, true, null,
    'Aqui esta el nucleo del viaje: como el DCE transforma la ensenanza de la historia en una experiencia viva.',
    $j5$[
      {
        "type": "intro",
        "title": "Del dato historico a la experiencia significativa",
        "text": "El pensamiento historico implica seis dimensiones: relevancia, evidencia, cambio y continuidad, causas y consecuencias, perspectiva historica y dimension etica. El DCE es la metodologia que convierte cada una de estas dimensiones en una experiencia que el estudiante no olvida."
      },
      {
        "type": "steps",
        "title": "Las seis dimensiones del pensamiento historico",
        "items": [
          { "icon": "🎯", "t": "Relevancia historica", "d": "Por que importa esto hoy? Disena actividades que conecten el evento historico con problemas actuales." },
          { "icon": "🔎", "t": "Evidencia y fuentes", "d": "Usa documentos primarios, fotografias, testimonios. El estudiante se convierte en historiador." },
          { "icon": "🔄", "t": "Cambio y continuidad", "d": "Muestra que permanece y que se transforma a traves del tiempo mediante lineas del tiempo vivas." },
          { "icon": "⛓️", "t": "Causa y consecuencia", "d": "Mapas causales, simulaciones de decisiones historicas, role-play de actores del pasado." },
          { "icon": "👥", "t": "Perspectiva historica", "d": "Multiples voces: el colonizador y el colonizado, el gobernante y el pueblo." },
          { "icon": "⚖️", "t": "Dimension etica", "d": "Fue justo? Que habrias hecho tu? Conectar la historia con los valores ciudadanos." }
        ]
      },
      {
        "type": "reveal",
        "title": "Como se ve una leccion DCE de historia?",
        "label": "Ver anatomia de una leccion",
        "openLabel": "Cerrar",
        "icon": "🏛️",
        "items": [
          { "t": "Pregunta esencial", "d": "Arranca con un dilema o pregunta que no tiene respuesta unica." },
          { "t": "Fuentes primarias", "d": "Los estudiantes analizan documentos, imagenes o audios de la epoca." },
          { "t": "Debate fundamentado", "d": "Argumentan usando evidencia, no opiniones vacias." },
          { "t": "Producto autentico", "d": "Crean algo real: un podcast, un mural, una propuesta ciudadana." }
        ],
        "text": "La mejor leccion de historia es aquella en que el estudiante olvida que esta en una clase."
      },
      {
        "type": "quote",
        "text": "La mejor leccion de historia es aquella en que el estudiante olvida que esta en una clase.",
        "author": "Prof. Kronos"
      }
    ]$j5$::jsonb
  );

  -- MODULO 6 (challenge simulation) — Decision en el Tiempo
  -- Nota: el frontend renderiza una simulacion pedagogica generica (SIM_TREE).
  -- El contenido de challenge_data se conserva para uso futuro pero hoy se ignora.
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Decision en el Tiempo',
    'Reto 3 — Decisiones Pedagogicas',
    'Eres docente en un momento de cambio historico. Cada decision afecta como comprenden la historia.',
    'challenge', 'simulation', 6, 250, true, null,
    'El portal te lleva a un momento clave. Eres un maestro. Como ensenas en medio de la historia viva?',
    $j6${
      "simContext": "Es 1991 en Colombia. Se esta redactando la nueva Constitucion y tus estudiantes de secundaria quieren entender que significa. Tienes una clase de 45 minutos.",
      "steps": [
        {
          "prompt": "Como introduces el tema de la Constitucion?",
          "options": [
            { "text": "Lees el articulo 1 directamente del texto", "outcome": "Los estudiantes escuchan pero no conectan. La norma queda abstracta.", "score": 1 },
            { "text": "Les preguntas que reglas tienen en casa y como se establecieron", "outcome": "Conectas con su experiencia. Ahora la Constitucion tiene sentido para ellos.", "score": 3 },
            { "text": "Pones un video sobre la Asamblea Constituyente", "outcome": "Contextualiza bien, pero la experiencia sigue siendo pasiva.", "score": 2 }
          ]
        },
        {
          "prompt": "Un estudiante pregunta: para que sirve la Constitucion si nadie la cumple?",
          "options": [
            { "text": "Le dices que hay que respetar las normas y sigues la clase", "outcome": "Oportunidad perdida. La pregunta era una puerta a la ciudadania critica.", "score": 1 },
            { "text": "Abres el debate: que ejemplos conocen de incumplimiento? Que se puede hacer?", "outcome": "Perfecto. Transformas una pregunta en pensamiento ciudadano activo.", "score": 3 },
            { "text": "Le dices que lo investigue para la proxima clase", "outcome": "Buena intencion, pero el momento de aprendizaje emocional se pierde.", "score": 2 }
          ]
        },
        {
          "prompt": "Para cerrar la clase, que propones como producto final?",
          "options": [
            { "text": "Cuestionario escrito sobre los articulos estudiados", "outcome": "Evalua memorizacion, no comprension ni ciudadania activa.", "score": 1 },
            { "text": "Que propongan un articulo para la Constitucion de su salon", "outcome": "Autentico, colaborativo y conectado a su realidad. Excelente cierre DCE.", "score": 3 },
            { "text": "Exposicion grupal sobre un derecho fundamental", "outcome": "Buena opcion, aunque el producto podria ser mas autentico.", "score": 2 }
          ]
        }
      ]
    }$j6$::jsonb
  );

  -- MODULO 7 (lesson) — Ciudadania Activa: Evaluacion Autentica
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Ciudadania Activa: Evaluacion Autentica',
    'Modulo 4 — Evaluacion en Sociales',
    'La evaluacion autentica va mas alla de fechas: evalua si el estudiante usa el pensamiento historico.',
    'lesson', 7, 150, true, null,
    'El viaje culmina cuando el estudiante no solo sabe historia, sino que actua como ciudadano.',
    $j7$[
      {
        "type": "intro",
        "title": "Evaluacion que transforma, no que mide",
        "text": "En Ciencias Sociales, la evaluacion autentica va mucho mas alla de fechas y nombres. Evalua si el estudiante puede usar el pensamiento historico para comprender el presente y proyectarse al futuro."
      },
      {
        "type": "steps",
        "title": "Cinco formas de evaluar de verdad",
        "items": [
          { "icon": "📔", "t": "Portafolio del viajero", "d": "Coleccion de evidencias: analisis de fuentes, reflexiones, propuestas ciudadanas." },
          { "icon": "🎭", "t": "Debate con roles historicos", "d": "El estudiante argumenta desde la perspectiva de un actor del pasado con evidencia real." },
          { "icon": "📍", "t": "Proyecto de incidencia local", "d": "Investigan un problema de su comunidad con perspectiva historica y proponen soluciones." },
          { "icon": "🖼️", "t": "Museo del aula", "d": "Crean exhibiciones para explicar eventos historicos a otros cursos." },
          { "icon": "🎙️", "t": "Podcast o documental", "d": "Producen contenido sobre un tema historico con investigacion propia." }
        ]
      },
      {
        "type": "reveal",
        "title": "Rubrica de evaluacion DCE en Sociales",
        "label": "Ver rubrica sugerida",
        "openLabel": "Cerrar rubrica",
        "icon": "📋",
        "items": [
          { "t": "Pensamiento historico (30%)", "d": "Usa evidencia, comprende causalidad, analiza perspectivas multiples." },
          { "t": "Conexion presente-pasado (25%)", "d": "Relaciona el contenido historico con fenomenos actuales de manera fundamentada." },
          { "t": "Ciudadania activa (25%)", "d": "Propone soluciones, participa criticamente, respeta la diferencia." },
          { "t": "Comunicacion (20%)", "d": "Expresa ideas con claridad, usa lenguaje apropiado, sustenta con fuentes." }
        ],
        "text": "El estudiante que entiende el pasado tiene mas opciones para construir el futuro."
      },
      {
        "type": "quote",
        "text": "El estudiante que entiende el pasado tiene mas opciones para construir el futuro.",
        "author": "Prof. Kronos"
      }
    ]$j7$::jsonb
  );

  -- MODULO 8 (challenge matching) — Conecta Conceptos y Estrategias
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Conecta Conceptos y Estrategias',
    'Reto 4 — Pensamiento Historico',
    'Cada dimension del pensamiento historico tiene una estrategia DCE que la activa.',
    'challenge', 'matching', 8, 200, true, null,
    'Cada concepto de pensamiento historico tiene una estrategia DCE que lo activa. Encuentra el par correcto.',
    $j8${
      "matchPairs": [
        { "id": 1, "concept": "Relevancia historica", "def": "Pregunta esencial conectada al presente" },
        { "id": 2, "concept": "Analisis de fuentes", "def": "Estudiante como historiador con documentos primarios" },
        { "id": 3, "concept": "Cambio y continuidad", "def": "Linea del tiempo viva con hitos comparativos" },
        { "id": 4, "concept": "Perspectiva historica", "def": "Role-play con multiples voces del pasado" },
        { "id": 5, "concept": "Dimension etica", "def": "Dilema moral basado en un evento historico real" },
        { "id": 6, "concept": "Causalidad historica", "def": "Mapa causal colaborativo con evidencia" }
      ]
    }$j8$::jsonb
  );

  -- MODULO 9 (final_delivery) — El Diario del Viajero
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line)
  VALUES (
    v_course_id,
    'El Diario del Viajero',
    'Entrega Final — Viajeros del Tiempo',
    'Documenta tu aprendizaje y tu propuesta para llevar el pensamiento historico vivo a tu aula.',
    'final_delivery', 9, 300, true, null,
    'El viaje termina cuando lo documentas. Tu diario de aprendizaje es la prueba de que cruzaste el portal.'
  );

  RAISE NOTICE '9 modulos del curso Viajeros del Tiempo insertados correctamente para curso %', v_course_id;

END $$;
