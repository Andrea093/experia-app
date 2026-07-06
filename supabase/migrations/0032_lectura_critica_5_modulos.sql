-- ============================================================
-- 0032: Ruta "Lectura Crítica" (curso theme='detective') reducida a 6 módulos
--
-- Reemplaza TODA la ruta actual del curso (introducción DCE, retos de
-- clasificación/empatía/simulación/matching y la entrega final de 0013,
-- más los 2 retos de 0021) por exactamente 6 módulos:
--
--   1. Lección   — "El llanto de un hombre" (texto completo)
--   2. Reto quiz — Preguntas 1 a 3 sobre ese texto
--   3. Lección   — Explicaciones de las preguntas 1 a 3 (cita + por qué)
--   4. Reto quiz — "Problemas del primer mundo" (historieta, 2 imágenes) + preguntas 4 y 5
--   5. Lección   — Explicaciones de las preguntas 4 y 5 (cita + por qué)
--   6. Encuesta en vivo (poll) — sondeo de opinión sobre ambos textos, de
--      prueba para la Clase en Vivo Guiada (migración 0033). Sin respuesta
--      correcta: se resuelve sola de forma autónoma y muestra distribución
--      en vivo cuando el profesor la lanza en una sesión guiada.
--
-- ⚠️ ADVERTENCIA: esto BORRA todos los módulos existentes del curso con
--    theme='detective' (incluida la "Entrega Final"). A partir de este
--    curso ya no habrá entrega calificable por el instructor — la ruta
--    termina en el módulo 6. Progreso ya guardado en course_progress no
--    se pierde, pero quedará con IDs de módulos que ya no existen.
-- ⚠️ Reemplaza las URLs PLACEHOLDER_IMG_1 / PLACEHOLDER_IMG_2 del módulo 4
--    subiendo las 2 viñetas desde el editor de ruta del instructor
--    (Ruta → editar el reto "Problemas del primer mundo" → sección
--    "texto/imágenes de apoyo" → subir imagen). Al guardar, la URL queda
--    fijada automáticamente — no hace falta tocar SQL de nuevo.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: puede re-ejecutarse; cada corrida borra y vuelve a crear
-- los 5 módulos (con IDs nuevos) para el curso detective.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
  v_mod1_id   uuid;
  v_mod2_id   uuid;
  v_mod3_id   uuid;
  v_mod4_id   uuid;
  v_mod5_id   uuid;
BEGIN

  -- 1) Detecta el curso de Lenguaje (tema detective)
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'detective' AND is_active = true
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un curso activo con theme=detective.';
  END IF;

  -- 2) Borra TODA la ruta existente de este curso (deja el curso vacío)
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 1 (lección) — Texto: "El llanto de un hombre"
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, character_line, content)
  VALUES (
    v_course_id,
    'El llanto de un hombre',
    'Módulo 1 — Lectura Crítica',
    'Lee con atención este texto de opinión sobre la masculinidad y el llanto. En el próximo módulo responderás preguntas sobre él.',
    'lesson', 1, 100, true, null,
    '{}'::text[],
    'Detective, todo caso empieza con un buen expediente. Lee cada palabra: la clave está en el segundo párrafo.',
    '[
      {"type":"intro","title":"Antes de comenzar","text":"A continuación vas a leer un texto de opinión sobre la masculinidad y el llanto. Léelo con atención, párrafo por párrafo: en el siguiente módulo responderás preguntas de comprensión e interpretación basadas en él."},
      {"type":"text","title":"El llanto de un hombre","text":"Los hombres. Seres insensibles. ¡Machos verdaderos! Superiores a las mujeres que lloran y sienten. Sin derecho a la ternura, sin permiso para sentir afecto por otros hombres, sin permiso para expresar verbalmente afecto o amor a las mujeres. Con la prohibición social contundente de decir \"te quiero\" a sus hijos e hijas. Los hombres de mi cultura, moldeados no al fuego sino al frío, con troqueles de acero para que sean hombres verdaderos, es decir, conforme a los permisos culturales y las prohibiciones sociales que no los dejan ser humanos, solo hombres. Hombres de hierro y acero incrustados en diamantes. Nada de endebles de carne y hueso. Esto es para las mujeres."},
      {"type":"text","text":"¡Qué horrible! Un día vi llorar en la \"pantalla\" a un portero profesional de fútbol. No parecía un hombre del modelo Occidental colombiano. Parecía troquelado en otro molde, traído no sé de dónde. Y lo más terrible es que es verdaderamente colombiano y famoso deportista. Es un ídolo de multitudes, pero llora. Y no se ha escondido después de que todo el mundo lo vio llorando como un niño o quizás como una niña en la percepción de algunos."},
      {"type":"text","text":"¿Y qué es el llanto? ¿Un simple río de lágrimas? ¿La expresión de rictus faciales que afean a las personas? El llanto es mucho más. La expresión profundamente humana del dolor físico o del alma y el corazón en adultos vivientes y con sentimientos naturales. El llanto es la proclama de nuestra capacidad de sentir, de amar con ardor y santo desespero, de sufrir por nuestro propio pesar y por el dolor de los demás. Es un privilegio humano que supera el chillido de los animales y que manifiesta esta condición única de los humanos con su capacidad de ser conscientes del dolor y la alegría."},
      {"type":"text","text":"Qué horrible es la prohibición de llorar. Qué castrante es no poder derramar una o muchas lágrimas en presencia de otros hombres y mujeres. Nos roba la capacidad de expresar algunos de los más humanos de nuestros sentimientos, de revelar con la transparencia de una lágrima la ternura de que somos capaces los machos humanos."},
      {"type":"text","text":"¡Nada más bello que un hombre llorando! Es un testimonio de que es una persona humana, con sentimientos, escapado del macho artificial para ser el hombre real y valioso que sabe tanto de coraje y valor como de amor, ternura y dolor."},
      {"type":"text","text":"Todo hombre que llora merece un monumento. Monumento a la masculinidad con corazón. Al humanismo. Al sentimiento. A la auténtica hombría. A la revolución de la ternura. Atreverse a llorar, contradiciendo los mandatos tiranos de la cultura, merece mucho más que una mención de honor. El llanto de un hombre es un monumento viviente, mejor que los de piedra y bronce."},
      {"type":"callout","icon":"📖","title":"Fuente","text":"Tomado y adaptado de: Giraldo Neira, O. (2003). El llanto de un hombre. En Los Héroes también lloran por una auténtica masculinidad."}
    ]'::jsonb
  )
  RETURNING id INTO v_mod1_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 2 (reto quiz) — Preguntas 1 a 3
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Preguntas: El llanto de un hombre',
    'Módulo 2 — Lectura Crítica',
    'Responde las 3 preguntas de comprensión e interpretación sobre el texto que acabas de leer.',
    'challenge', 'quiz', 2, 150, true, null,
    ARRAY[v_mod1_id::text],
    '¡A resolver el caso! Responde con la evidencia del texto en mente.',
    $jA${
      "passage": {
        "intro": "DE ACUERDO CON EL TEXTO DEL MÓDULO ANTERIOR, RESPONDE LAS PREGUNTAS 1 A 3",
        "title": "EL LLANTO DE UN HOMBRE",
        "paragraphs": [
          "Los hombres. Seres insensibles. ¡Machos verdaderos! Superiores a las mujeres que lloran y sienten. Sin derecho a la ternura, sin permiso para sentir afecto por otros hombres, sin permiso para expresar verbalmente afecto o amor a las mujeres. Con la prohibición social contundente de decir \"te quiero\" a sus hijos e hijas. Los hombres de mi cultura, moldeados no al fuego sino al frío, con troqueles de acero para que sean hombres verdaderos, es decir, conforme a los permisos culturales y las prohibiciones sociales que no los dejan ser humanos, solo hombres. Hombres de hierro y acero incrustados en diamantes. Nada de endebles de carne y hueso. Esto es para las mujeres.",
          "¡Qué horrible! Un día vi llorar en la \"pantalla\" a un portero profesional de fútbol. No parecía un hombre del modelo Occidental colombiano. Parecía troquelado en otro molde, traído no sé de dónde. Y lo más terrible es que es verdaderamente colombiano y famoso deportista. Es un ídolo de multitudes, pero llora. Y no se ha escondido después de que todo el mundo lo vio llorando como un niño o quizás como una niña en la percepción de algunos.",
          "¿Y qué es el llanto? ¿Un simple río de lágrimas? ¿La expresión de rictus faciales que afean a las personas? El llanto es mucho más. La expresión profundamente humana del dolor físico o del alma y el corazón en adultos vivientes y con sentimientos naturales. El llanto es la proclama de nuestra capacidad de sentir, de amar con ardor y santo desespero, de sufrir por nuestro propio pesar y por el dolor de los demás. Es un privilegio humano que supera el chillido de los animales y que manifiesta esta condición única de los humanos con su capacidad de ser conscientes del dolor y la alegría.",
          "Qué horrible es la prohibición de llorar. Qué castrante es no poder derramar una o muchas lágrimas en presencia de otros hombres y mujeres. Nos roba la capacidad de expresar algunos de los más humanos de nuestros sentimientos, de revelar con la transparencia de una lágrima la ternura de que somos capaces los machos humanos.",
          "¡Nada más bello que un hombre llorando! Es un testimonio de que es una persona humana, con sentimientos, escapado del macho artificial para ser el hombre real y valioso que sabe tanto de coraje y valor como de amor, ternura y dolor.",
          "Todo hombre que llora merece un monumento. Monumento a la masculinidad con corazón. Al humanismo. Al sentimiento. A la auténtica hombría. A la revolución de la ternura. Atreverse a llorar, contradiciendo los mandatos tiranos de la cultura, merece mucho más que una mención de honor. El llanto de un hombre es un monumento viviente, mejor que los de piedra y bronce."
        ],
        "source": "Tomado y adaptado de: Giraldo Neira, O. (2003). El llanto de un hombre. En Los Héroes también lloran por una auténtica masculinidad."
      },
      "questions": [
        {
          "question": "En el segundo párrafo del texto, la expresión \"¡Qué horrible!\" representa:",
          "options": [
            "la perspectiva del autor.",
            "el punto de vista del futbolista.",
            "una perspectiva común de un televidente.",
            "el punto de vista de todos los colombianos."
          ],
          "correct": 2
        },
        {
          "question": "¿Cuál de las siguientes afirmaciones presenta la tesis del texto?",
          "options": [
            "El llanto de los hombres debe valorarse positivamente.",
            "El llanto es la expresión de las emociones más profundas.",
            "Los hombres se han educado para no expresar sus sentimientos.",
            "Los hombres deben llorar para mostrar su desacuerdo con el sexismo."
          ],
          "correct": 1
        },
        {
          "question": "¿Qué comportamiento social sanciona el texto?",
          "options": [
            "La incapacidad de los hombres de expresarles afecto a las mujeres.",
            "La expresión de ternura es aceptable únicamente en mujeres.",
            "La carencia de sentimientos y ternura en los hombres machistas.",
            "La rudeza y agresividad propia del comportamiento masculino."
          ],
          "correct": 3
        }
      ]
    }$jA$::jsonb
  )
  RETURNING id INTO v_mod2_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 3 (lección) — Explicaciones de las preguntas 1 a 3
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, character_line, content)
  VALUES (
    v_course_id,
    'Explicaciones: El llanto de un hombre',
    'Módulo 3 — Lectura Crítica',
    'Revisa por qué cada respuesta de las preguntas 1 a 3 es la correcta, con el fragmento del texto que la sustenta.',
    'lesson', 3, 100, true, null,
    ARRAY[v_mod2_id::text],
    'Revisemos juntos el expediente: aquí está la evidencia detrás de cada veredicto.',
    '[
      {"type":"intro","title":"Repaso de tus respuestas","text":"Antes de continuar, repasa por qué cada respuesta es la correcta. Vuelve al texto del módulo 1 si tienes dudas."},
      {"type":"quote","text":"¡Qué horrible! Un día vi llorar en la \"pantalla\" a un portero profesional de fútbol.","author":"Fragmento citado — Pregunta 1"},
      {"type":"text","title":"Pregunta 1 · Respuesta correcta: c) una perspectiva común de un televidente","text":"La expresión \"¡Qué horrible!\" no puede ser la voz del autor, quien defiende el llanto masculino en todo el ensayo, ni la del futbolista, que llora sin esconderse. Es la reacción de asombro y reproche de quien ve la escena por televisión y la juzga desde el estereotipo tradicional de masculinidad: la reacción típica de un televidente que aún no ha cuestionado ese estereotipo."},
      {"type":"quote","text":"El llanto es mucho más. La expresión profundamente humana del dolor físico o del alma y el corazón en adultos vivientes y con sentimientos naturales.","author":"Fragmento citado — Pregunta 2"},
      {"type":"text","title":"Pregunta 2 · Respuesta correcta: b) El llanto es la expresión de las emociones más profundas","text":"Todo el texto defiende el llanto masculino como manifestación genuina de humanidad. Su tesis central no es solo señalar el machismo, sino afirmar que llorar es la expresión más profunda de las emociones humanas — por eso el autor dedica un párrafo completo a definir el llanto en esos términos."},
      {"type":"quote","text":"Seres insensibles. ¡Machos verdaderos!... Hombres de hierro y acero incrustados en diamantes.","author":"Fragmento citado — Pregunta 3"},
      {"type":"text","title":"Pregunta 3 · Respuesta correcta: d) La rudeza y agresividad propia del comportamiento masculino","text":"El texto sanciona el modelo del \"hombre de hierro y acero\": la dureza, insensibilidad y rudeza que la cultura impone a los hombres. No se trata solo de la ausencia de sentimientos, sino de esa conducta agresiva naturalizada como \"lo masculino verdadero\"."}
    ]'::jsonb
  )
  RETURNING id INTO v_mod3_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 4 (reto quiz) — "Problemas del primer mundo" (2 imágenes) + preguntas 4 y 5
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Problemas del primer mundo',
    'Módulo 4 — Lectura Crítica',
    'Observa la historieta y responde las preguntas 4 y 5 de interpretación.',
    'challenge', 'quiz', 4, 150, true, null,
    ARRAY[v_mod3_id::text],
    'Nuevo caso, detective: ahora la evidencia son imágenes. Obsérvalas con cuidado.',
    $jB${
      "passage": {
        "intro": "RESPONDA LAS PREGUNTAS DE ACUERDO CON LA SIGUIENTE INFORMACIÓN",
        "title": "Problemas del primer mundo",
        "images": [
          { "url": "PLACEHOLDER_IMG_1", "caption": "Recuadro 1", "width": 340, "height": 420 },
          { "url": "PLACEHOLDER_IMG_2", "caption": "Recuadro 2", "width": 340, "height": 420 }
        ],
        "imagesLayout": "row",
        "source": "Tira cómica. Laura Pacheco - letspacheco.com"
      },
      "questions": [
        {
          "question": "¿Qué se concluye del recuadro 1?",
          "options": [
            "La mamá está feliz de que su hijo pase el día frente al computador.",
            "El niño desobedece la orden que le da su mamá.",
            "La mamá regaña a su hijo por ir al parque.",
            "El niño prefiere quedarse frente al computador antes que ir al parque."
          ],
          "correct": 3
        },
        {
          "question": "¿Cuál de los siguientes enunciados del texto contiene un juicio de valor?",
          "options": [
            "¡Deja el ordenador ahora mismo!",
            "No puede ser bueno que te tires toda la tarde ahí solo.",
            "Ahora mismo te sales a jugar con los niños de verdad.",
            "Si son los niños de mi clase."
          ],
          "correct": 1
        }
      ]
    }$jB$::jsonb
  )
  RETURNING id INTO v_mod4_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 5 (lección) — Explicaciones de las preguntas 4 y 5
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, character_line, content)
  VALUES (
    v_course_id,
    'Explicaciones: Problemas del primer mundo',
    'Módulo 5 — Lectura Crítica',
    'Revisa por qué cada respuesta de las preguntas 4 y 5 es la correcta, con el fragmento de la historieta que la sustenta.',
    'lesson', 5, 100, true, null,
    ARRAY[v_mod4_id::text],
    'Cerremos el expediente: así se lee la evidencia visual.',
    '[
      {"type":"intro","title":"Repaso de tus respuestas","text":"Vuelve a mirar los dos recuadros de la historieta (módulo 4) si tienes dudas sobre estas respuestas."},
      {"type":"quote","text":"Pero mamá... / Si son los niños de mi clase...","author":"Fragmento citado — Recuadro 1, Pregunta 4"},
      {"type":"text","title":"Pregunta 4 · Respuesta correcta: d) El niño prefiere quedarse frente al computador antes que ir al parque","text":"Aunque el niño no lo dice de forma directa, sus respuestas muestran resistencia a dejar el computador y una justificación para seguir conectado (\"son los niños de mi clase\"). El recuadro 2, donde aparece solo en un parque vacío, confirma que su verdadera preferencia era quedarse frente a la pantalla."},
      {"type":"quote","text":"No puede ser bueno que te tires toda la tarde ahí solo.","author":"Fragmento citado — Recuadro 1, Pregunta 5"},
      {"type":"text","title":"Pregunta 5 · Respuesta correcta: b) \"No puede ser bueno que te tires toda la tarde ahí solo.\"","text":"A diferencia de las demás frases —que son órdenes directas (\"¡Deja el ordenador!\", \"sales a jugar\") o una afirmación del niño (\"son los niños de mi clase\")—, esta expresión de la mamá incluye una valoración subjetiva (\"no puede ser bueno\") sobre la conducta de su hijo, sin aportar una prueba objetiva. Eso es, por definición, un juicio de valor."}
    ]'::jsonb
  )
  RETURNING id INTO v_mod5_id;

  -- ══════════════════════════════════════════════
  -- MÓDULO 6 (encuesta en vivo / poll) — Sondeo de opinión, de prueba
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Encuesta: tu opinión sobre los dos casos',
    'Módulo 6 — Lectura Crítica',
    'Sondeo de opinión sin respuesta correcta — sirve para probar la Clase en Vivo Guiada.',
    'challenge', 'poll', 6, 50, true, null,
    ARRAY[v_mod5_id::text],
    'Último punto del expediente, detective: aquí no hay respuesta correcta, solo tu opinión.',
    $jC${
      "questions": [
        {
          "question": "¿Qué tan de acuerdo estás con que los hombres deberían poder llorar libremente, como plantea el primer texto?",
          "options": [
            "Totalmente de acuerdo",
            "De acuerdo",
            "Neutral",
            "En desacuerdo"
          ]
        },
        {
          "question": "En la historieta \"Problemas del primer mundo\", ¿con quién estás más de acuerdo?",
          "options": [
            "Con la mamá: hay que salir a jugar con niños de verdad",
            "Con Hugo: los amigos de clase también son reales",
            "Depende del contexto",
            "Ninguno de los dos"
          ]
        }
      ]
    }$jC$::jsonb
  );

  RAISE NOTICE 'Éxito: ruta de Lectura Crítica reducida a 6 módulos para el curso % (mod1=%, mod2=%, mod3=%, mod4=%, mod5=%)', v_course_id, v_mod1_id, v_mod2_id, v_mod3_id, v_mod4_id, v_mod5_id;

END $$;

-- Verificación (opcional):
-- SELECT "order", title, type, challenge_type FROM public.course_modules
-- WHERE course_id = (SELECT id FROM public.courses WHERE theme='detective' AND is_active=true LIMIT 1)
-- ORDER BY "order";
