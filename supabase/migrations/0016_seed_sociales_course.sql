-- ============================================================
-- 0016_seed_sociales_course.sql
-- Crea el curso "Viajeros del Tiempo — Ciencias Sociales" con
-- tema time-travel y siembra los 9 modulos de formacion docente.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- Requiere migracion 0012 (columnas theme y character_line).
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

  -- M1: Lección introductoria — El viaje comienza
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_m1', 'lesson', 1,
    'El Viaje Comienza: Introducción al DCE', 100, 'El tiempo no es un río lineal, sino un mapa de decisiones. Hoy inicias tu propio viaje temporal como docente.',
    $j1$[
      {"type":"heading","text":"Bienvenido al Viaje del Tiempo"},
      {"type":"text","text":"Las Ciencias Sociales nos invitan a comprender el presente mirando hacia el pasado y el futuro. En este curso usarás el Diseño Centrado en la Experiencia (DCE) para llevar esas dimensiones temporales al aula de manera significativa."},
      {"type":"steps","items":[
        {"title":"Pasado como contexto","text":"Usar la historia para dar sentido a los fenómenos del presente."},
        {"title":"Presente como punto de partida","text":"Conectar la realidad de los estudiantes con los contenidos curriculares."},
        {"title":"Futuro como horizonte","text":"Proyectar escenarios y desarrollar pensamiento crítico sobre lo que puede venir."}
      ]},
      {"type":"quote","text":"La historia no se repite, pero rima. Entender esa rima es la primera habilidad del docente de sociales.","author":"Prof. Kronos"}
    ]$j1$
  );

  -- C1: Reto drag-drop — Ordena la línea del tiempo
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_c1', 'challenge', 2,
    'Reto 1: Ordena la Línea del Tiempo', 150, 'Arrastra cada hito al lugar que le corresponde. La cronología es la base de todo análisis histórico.',
    $j2$[
      {"type":"text","text":"Arrastra cada hito histórico de la educación colombiana al periodo que le corresponde."},
      {"type":"drag-drop","items":[
        "Ley General de Educación 115 de 1994",
        "Creación de las Escuelas Normales (s. XIX)",
        "Competencias ciudadanas 2004",
        "Plan Decenal de Educación 2016-2026",
        "Pedagogía lancasteriana (1800s)"
      ]}
    ]$j2$
  );

  -- M2: Lección empatía — El estudiante en su época
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_m2', 'lesson', 3,
    'El Estudiante en su Época: Mapa de Empatía', 100, 'Para diseñar buenas experiencias históricas, primero debemos viajar a la perspectiva del estudiante.',
    $j3$[
      {"type":"heading","text":"¿Qué piensa y siente un estudiante de sociales?"},
      {"type":"text","text":"El pensamiento histórico no es natural; debe construirse. Antes de diseñar tus lecciones, observa cómo tus estudiantes perciben el tiempo, la causalidad y la identidad cultural."},
      {"type":"steps","items":[
        {"title":"Ve y escucha","text":"¿Qué referentes históricos o sociales aparecen en su cotidianidad (redes, familia, barrio)?"},
        {"title":"Piensa y siente","text":"¿Qué emociones genera la historia en ellos: aburrimiento, orgullo, injusticia, curiosidad?"},
        {"title":"Dice y hace","text":"¿Cómo hablan de lo histórico? ¿Qué preguntas formulan espontáneamente?"},
        {"title":"Dolores","text":"Fechas sin contexto, memorización sin comprensión, desconexión con el presente."},
        {"title":"Ganancias","text":"Identidad, sentido de pertenencia, capacidad crítica, habilidades de ciudadanía."}
      ]},
      {"type":"quote","text":"Un estudiante que conecta el pasado con su vida hoy, ya es un pensador histórico.","author":"Prof. Kronos"}
    ]$j3$
  );

  -- C2: Reto empathy — Mapa de empatía del estudiante de sociales
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_c2', 'challenge', 4,
    'Reto 2: Mapa de Empatía del Estudiante', 200, 'Clasifica cada observación en el cuadrante correcto del mapa de empatía. Esto definirá tu punto de partida de diseño.',
    $j4$[
      {"type":"text","text":"Ubica cada observación de un estudiante de Ciencias Sociales en el cuadrante correspondiente del mapa de empatía."},
      {"type":"empathy","cards":[
        {"text":"Se aburre leyendo el libro de texto sobre la Independencia","zone":"pain"},
        {"text":"Pregunta por qué se sigue repitiendo la corrupción","zone":"think"},
        {"text":"Comparte memes históricos en redes sociales","zone":"do"},
        {"text":"Siente orgullo cuando aprende de su región","zone":"feel"},
        {"text":"Nunca ha visitado un museo histórico","zone":"do"},
        {"text":"Cree que la historia ya no cambia","zone":"think"},
        {"text":"Quiere entender las noticias de hoy","zone":"gain"},
        {"text":"Le da vergüenza no saber sobre eventos recientes","zone":"pain"}
      ]}
    ]$j4$
  );

  -- M3: Lección específica — Pensamiento histórico y DCE
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_m3', 'lesson', 5,
    'Pensamiento Histórico y DCE', 150, 'Aquí está el núcleo del viaje: cómo el DCE transforma la enseñanza de la historia en una experiencia viva.',
    $j5$[
      {"type":"heading","text":"Del dato histórico a la experiencia significativa"},
      {"type":"text","text":"El pensamiento histórico implica seis dimensiones: relevancia, evidencia, cambio y continuidad, causas y consecuencias, perspectiva histórica y dimensión ética. El DCE es la metodología que convierte cada una de estas dimensiones en una experiencia que el estudiante no olvida."},
      {"type":"steps","items":[
        {"title":"1. Relevancia histórica","text":"¿Por qué importa esto hoy? Diseña actividades que conecten el evento histórico con problemas actuales."},
        {"title":"2. Evidencia y fuentes","text":"Usa documentos primarios, fotografías, testimonios. El estudiante se convierte en historiador."},
        {"title":"3. Cambio y continuidad","text":"Muestra qué permanece y qué transforma a través del tiempo mediante líneas del tiempo vivas."},
        {"title":"4. Causa y consecuencia","text":"Mapas causales, simulaciones de decisiones históricas, role-play de actores del pasado."},
        {"title":"5. Perspectiva histórica","text":"Múltiples voces: el colonizador y el colonizado, el gobernante y el pueblo."},
        {"title":"6. Dimensión ética","text":"¿Fue justo? ¿Qué habrías hecho tú? Conectar la historia con los valores ciudadanos."}
      ]},
      {"type":"reveal","title":"¿Cómo se ve una lección DCE de historia?","items":[
        {"title":"Pregunta esencial","text":"Arranca con un dilema o pregunta que no tiene respuesta única."},
        {"title":"Fuentes primarias","text":"Los estudiantes analizan documentos, imágenes o audios de la época."},
        {"title":"Debate fundamentado","text":"Argumentan usando evidencia, no opiniones vacías."},
        {"title":"Producto auténtico","text":"Crean algo real: un podcast, un mural, una propuesta ciudadana."}
      ]},
      {"type":"quote","text":"La mejor lección de historia es aquella en que el estudiante olvida que está en una clase.","author":"Prof. Kronos"}
    ]$j5$
  );

  -- C3: Simulación — Decisión en un momento histórico
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_c3', 'challenge', 6,
    'Reto 3: Decisión en el Tiempo', 250, 'El portal te lleva a 1810. Eres un maestro en la Nueva Granada. ¿Cómo teaches en medio de una revolución?',
    $j6$[
      {"type":"text","text":"Simulación: Eres docente en un momento de cambio histórico. Cada decisión afecta cómo tus estudiantes comprenden la historia."},
      {"type":"simulation","context":"Es 1991 en Colombia. Se está redactando la nueva Constitución y tus estudiantes de secundaria quieren entender qué significa. Tienes una clase de 45 minutos.","steps":[
        {"question":"¿Cómo introduces el tema de la Constitución?",
         "options":[
           {"text":"Lees el artículo 1 directamente del texto","feedback":"Los estudiantes escuchan pero no conectan. La norma queda abstracta.","score":1},
           {"text":"Les preguntas qué reglas tienen en casa y cómo se establecieron","feedback":"Conectas con su experiencia. Ahora la Constitución tiene sentido para ellos.","score":3},
           {"text":"Pones un video sobre la Asamblea Constituyente","feedback":"Contextualiza bien, pero la experiencia sigue siendo pasiva.","score":2}
         ]},
        {"question":"Un estudiante pregunta: '¿Para qué sirve la Constitución si nadie la cumple?'",
         "options":[
           {"text":"Le dices que hay que respetar las normas y sigues la clase","feedback":"Oportunidad perdida. La pregunta era una puerta a la ciudadanía crítica.","score":1},
           {"text":"Abres el debate: ¿qué ejemplos conocen de incumplimiento? ¿qué se puede hacer?","feedback":"Perfecto. Transformas una pregunta en pensamiento ciudadano activo.","score":3},
           {"text":"Le dices que lo investiguen para la próxima clase","feedback":"Buena intención, pero el momento de aprendizaje emocional se pierde.","score":2}
         ]},
        {"question":"Para cerrar la clase, ¿qué propones como producto final?",
         "options":[
           {"text":"Cuestionario escrito sobre los artículos estudiados","feedback":"Evalúa memorización, no comprensión ni ciudadanía activa.","score":1},
           {"text":"Que propongan un artículo para la Constitución de su salón","feedback":"Auténtico, colaborativo y conectado a su realidad. Excelente cierre DCE.","score":3},
           {"text":"Exposición grupal sobre un derecho fundamental","feedback":"Buena opción, aunque el producto podría ser más auténtico.","score":2}
         ]}
      ]}
    ]$j6$
  );

  -- M4: Lección evaluativa — Ciudadanía y pedagogía crítica
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_m4', 'lesson', 7,
    'Ciudadanía Activa: Evaluación Auténtica en Sociales', 150, 'El viaje culmina cuando el estudiante no solo sabe historia, sino que actúa como ciudadano.',
    $j7$[
      {"type":"heading","text":"Evaluación que transforma, no que mide"},
      {"type":"text","text":"En Ciencias Sociales, la evaluación auténtica va mucho más allá de fechas y nombres. Evalúa si el estudiante puede usar el pensamiento histórico para comprender el presente y proyectarse al futuro."},
      {"type":"steps","items":[
        {"title":"Portafolio del viajero","text":"Colección de evidencias: análisis de fuentes, reflexiones, propuestas ciudadanas."},
        {"title":"Debate con roles históricos","text":"El estudiante argumenta desde la perspectiva de un actor del pasado con evidencia real."},
        {"title":"Proyecto de incidencia local","text":"Investigan un problema de su comunidad con perspectiva histórica y proponen soluciones."},
        {"title":"Museo del aula","text":"Crean exhibiciones para explicar eventos históricos a otros cursos."},
        {"title":"Podcast o documental","text":"Producen contenido sobre un tema histórico con investigación propia."}
      ]},
      {"type":"reveal","title":"Rúbrica de evaluación DCE en Sociales","items":[
        {"title":"Pensamiento histórico (30%)","text":"Usa evidencia, comprende causalidad, analiza perspectivas múltiples."},
        {"title":"Conexión presente-pasado (25%)","text":"Relaciona el contenido histórico con fenómenos actuales de manera fundamentada."},
        {"title":"Ciudadanía activa (25%)","text":"Propone soluciones, participa críticamente, respeta la diferencia."},
        {"title":"Comunicación (20%)","text":"Expresa ideas con claridad, usa lenguaje apropiado, sustenta con fuentes."}
      ]},
      {"type":"quote","text":"El estudiante que entiende el pasado tiene más opciones para construir el futuro.","author":"Prof. Kronos"}
    ]$j7$
  );

  -- C4: Reto matching — Conceptos de Ciencias Sociales
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_c4', 'challenge', 8,
    'Reto 4: Conecta Conceptos y Estrategias', 200, 'Cada concepto de pensamiento histórico tiene una estrategia DCE que lo activa. Encuentra el par correcto.',
    $j8$[
      {"type":"text","text":"Conecta cada dimensión del pensamiento histórico con la estrategia pedagógica DCE más adecuada."},
      {"type":"matching","pairs":[
        {"left":"Relevancia histórica","right":"Pregunta esencial conectada al presente"},
        {"left":"Análisis de fuentes","right":"Estudiante como historiador con documentos primarios"},
        {"left":"Cambio y continuidad","right":"Línea del tiempo viva con hitos comparativos"},
        {"left":"Perspectiva histórica","right":"Role-play con múltiples voces del pasado"},
        {"left":"Dimensión ética","right":"Dilema moral basado en evento histórico real"},
        {"left":"Causalidad histórica","right":"Mapa causal colaborativo con evidencia"}
      ]}
    ]$j8$
  );

  -- Final: Entrega del viajero
  INSERT INTO public.course_modules
    (course_id, module_id, type, order_index, title, xp, character_line, content)
  VALUES (v_course_id, 'soc_final', 'final_delivery', 9,
    'Entrega Final: El Diario del Viajero', 300, 'El viaje termina cuando lo documentas. Tu diario de aprendizaje es la prueba de que cruzaste el portal.',
    $j9$[
      {"type":"heading","text":"Tu Diario del Viajero"},
      {"type":"text","text":"Has completado el recorrido por el tiempo. Ahora es momento de documentar tu aprendizaje y tu propuesta pedagógica para llevar el pensamiento histórico vivo a tu aula de Ciencias Sociales."},
      {"type":"steps","items":[
        {"title":"Documento 1 — Secuencia Didáctica DCE","text":"Diseña una secuencia de 3 clases para un tema de tu área usando las 6 dimensiones del pensamiento histórico. Incluye actividades, recursos y evaluación auténtica."},
        {"title":"Documento 2 — Reflexión del Viajero","text":"¿Qué cambia en tu práctica docente después de este viaje? Describe 3 transformaciones concretas que implementarás y por qué crees que impactarán a tus estudiantes."}
      ]},
      {"type":"quote","text":"No regresaste al mismo punto de partida. El viaje te cambió. Eso es exactamente lo que busca el DCE.","author":"Prof. Kronos"}
    ]$j9$
  );

  RAISE NOTICE 'Modulos de Ciencias Sociales sembrados correctamente para curso %', v_course_id;

END $$;
