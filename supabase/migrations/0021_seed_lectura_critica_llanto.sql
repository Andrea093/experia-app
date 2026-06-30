-- ============================================================
-- 0021: Lectura Crítica — "El llanto de un hombre" + "Problemas del primer mundo"
--
-- Agrega DOS retos tipo quiz al curso de Lenguaje (theme = 'detective'):
--   Reto A · El estudiante lee un TEXTO y responde 3 preguntas.
--   Reto B · El estudiante observa 2 IMÁGENES y responde 2 preguntas.
--
-- Ambos usan el nuevo campo challenge_data.passage (texto + imágenes con
-- tamaño ajustable) que la plataforma renderiza encima de las preguntas.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase (los seeds no se
--    aplican con el deploy del frontend).
-- ⚠️ Reemplaza las URLs PLACEHOLDER_IMG_1 / PLACEHOLDER_IMG_2 por las URLs
--    reales de las imágenes (súbelas a Supabase Storage o a un CDN).
-- Idempotente: borra y reinserta los retos por título dentro del curso.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
  v_order     int;
  v_id_a      uuid;
BEGIN

  -- 1) Detecta el curso de Lenguaje (tema detective)
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'detective' AND is_active = true
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un curso activo con theme=detective. Crea/ajusta el curso de Lenguaje primero.';
  END IF;

  -- 2) Idempotencia: elimina versiones previas de estos dos retos
  DELETE FROM public.course_modules
  WHERE course_id = v_course_id
    AND title IN ('El llanto de un hombre', 'Problemas del primer mundo');

  -- 3) Coloca los nuevos retos al final de la ruta actual
  SELECT COALESCE(MAX("order"), 0) INTO v_order
  FROM public.course_modules WHERE course_id = v_course_id;

  -- ══════════════════════════════════════════════
  -- RETO A (quiz) — Texto + 3 preguntas
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'El llanto de un hombre',
    'Lectura Crítica — Preguntas 1 a 3',
    'Lee el texto con atención y responde las preguntas de comprensión e interpretación.',
    'challenge', 'quiz', v_order + 1, 150, true, null,
    '{}'::text[],
    'Detective, lee entre líneas: cada palabra del autor esconde una intención.',
    $jA${
      "passage": {
        "intro": "DE ACUERDO CON EL SIGUIENTE TEXTO RESPONDE LAS PREGUNTAS 1 A 3",
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
          "correct": 0
        },
        {
          "question": "¿Cuál de las siguientes afirmaciones presenta la tesis del texto?",
          "options": [
            "El llanto de los hombres debe valorarse positivamente.",
            "El llanto es la expresión de las emociones más profundas.",
            "Los hombres se han educado para no expresar sus sentimientos.",
            "Los hombres deben llorar para mostrar su desacuerdo con el sexismo."
          ],
          "correct": 0
        },
        {
          "question": "¿Qué comportamiento social sanciona el texto?",
          "options": [
            "La incapacidad de los hombres de expresarles afecto a las mujeres.",
            "La expresión de ternura es aceptable únicamente en mujeres.",
            "La carencia de sentimientos y ternura en los hombres machistas.",
            "La rudeza y agresividad propia del comportamiento masculino."
          ],
          "correct": 2
        }
      ]
    }$jA$::jsonb
  )
  RETURNING id INTO v_id_a;

  -- ══════════════════════════════════════════════
  -- RETO B (quiz) — 2 imágenes + 2 preguntas (requiere completar el reto A)
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Problemas del primer mundo',
    'Lectura Crítica — Preguntas 4 a 5',
    'Observa las dos imágenes y responde las preguntas de interpretación.',
    'challenge', 'quiz', v_order + 2, 150, true, null,
    ARRAY[v_id_a::text],
    'Una imagen también es un texto: lee sus gestos, sus palabras y lo que callan.',
    $jB${
      "passage": {
        "intro": "RESPONDA LAS PREGUNTAS DE ACUERDO CON LA SIGUIENTE INFORMACIÓN",
        "title": "Problemas del primer mundo",
        "images": [
          {
            "url": "PLACEHOLDER_IMG_1",
            "caption": "Recuadro 1",
            "width": 340,
            "height": 420
          },
          {
            "url": "PLACEHOLDER_IMG_2",
            "caption": "Recuadro 2",
            "width": 340,
            "height": 420
          }
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
  );

  RAISE NOTICE 'Éxito: 2 retos de lectura crítica insertados en el curso % (orden % y %)', v_course_id, v_order + 1, v_order + 2;

END $$;

-- Verificación (opcional):
-- SELECT "order", title, challenge_type FROM public.course_modules
-- WHERE course_id = (SELECT id FROM public.courses WHERE theme='detective' AND is_active=true LIMIT 1)
-- ORDER BY "order";
