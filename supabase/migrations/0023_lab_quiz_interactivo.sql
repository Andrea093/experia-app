-- ============================================================
-- 0023_lab_quiz_interactivo.sql
-- Agrega al curso "Laboratorio de Ciencias Naturales" (theme = 'lab')
-- un reto tipo QUIZ que estrena las funcionalidades de interacción
-- recientes:
--   • challenge_data.passage  → texto + imagen mostrados ENCIMA de las preguntas
--   • por pregunta: image + imageHeight, explanation + explanationImage,
--                   timeLimit, points, difficulty
--   Estos campos también alimentan el "Modo Aula en Vivo" (quiz sincrónico
--   tipo Kahoot): timeLimit/points => puntaje del servidor, explanation =>
--   fase de revelado.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase (los seeds NO se
--    aplican con el deploy del frontend).
-- Idempotente: borra y reinserta el reto por título dentro del curso.
-- El reto queda SIN requisitos (requirements '{}') => desbloqueado de una,
-- listo para probar en el flujo normal y para snapshotear en Aula en Vivo.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
  v_order     int;
BEGIN

  -- 1) Detecta el curso de Laboratorio de Ciencias Naturales (tema lab)
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'lab' AND is_active = true
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un curso activo con theme=lab. Ejecuta primero 0015_seed_ciencias_course.sql';
  END IF;

  -- 2) Idempotencia: elimina versiones previas de este reto
  DELETE FROM public.course_modules
  WHERE course_id = v_course_id
    AND title = 'Fenómenos bajo la lupa';

  -- 3) Colócalo al final de la ruta actual
  SELECT COALESCE(MAX("order"), 0) INTO v_order
  FROM public.course_modules WHERE course_id = v_course_id;

  -- ══════════════════════════════════════════════
  -- RETO (quiz) — 4 preguntas con opciones avanzadas por pregunta
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Fenómenos bajo la lupa',
    'Reto Interactivo — Ciencia Cotidiana',
    'Observa el fenómeno, responde contra reloj y aprende con la explicación de cada respuesta. Listo también para el Modo Aula en Vivo.',
    'challenge', 'quiz', v_order + 1, 200, true, null,
    '{}'::text[],
    'Cada fenómeno esconde un principio. Cronómetro en marcha: observa, razona y responde.',
    $q${
      "passage": {
        "intro": "OBSERVA LA IMAGEN Y RESPONDE LAS SIGUIENTES PREGUNTAS",
        "title": "El laboratorio está en todas partes",
        "paragraphs": [
          "Los principios científicos no viven solo en los libros: se manifiestan en la cocina, en el cielo y en el cuerpo. En este reto vas a conectar fenómenos cotidianos con la ciencia que los explica."
        ],
        "images": [
          {
            "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Water_molecule_3D.svg/640px-Water_molecule_3D.svg.png",
            "caption": "La molécula de agua (H2O): su estructura polar explica muchas de sus propiedades.",
            "width": 300,
            "height": 240
          }
        ],
        "imagesLayout": "row",
        "source": "Imagen: Wikimedia Commons."
      },
      "questions": [
        {
          "question": "Un barco de acero flota, pero una bola del mismo acero se hunde. ¿Qué principio lo explica?",
          "options": [
            "El principio de Arquímedes: cuenta la densidad media del objeto, no el material.",
            "La ley de la gravedad: el barco pesa menos que la bola.",
            "La tensión superficial del agua sostiene al barco.",
            "El acero cambia de composición al darle forma de barco."
          ],
          "correct": 0,
          "difficulty": "media",
          "timeLimit": 25,
          "points": 1000,
          "explanation": "El barco desplaza un gran volumen de agua (incluye aire en su interior), por lo que su densidad MEDIA es menor que la del agua y flota. La bola maciza tiene una densidad media mayor y se hunde. El material es el mismo; lo que cambia es la densidad media."
        },
        {
          "question": "Al frotar un globo contra el cabello y acercarlo a la pared, el globo se queda pegado. Esto ocurre por:",
          "options": [
            "Magnetismo: el globo se imanta con la fricción.",
            "Electricidad estática: la fricción transfiere electrones y crea cargas opuestas.",
            "Presión del aire que empuja el globo contra la pared.",
            "Adhesión química entre el plástico y la pintura."
          ],
          "correct": 1,
          "difficulty": "facil",
          "timeLimit": 20,
          "points": 800,
          "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Balloon_static_electricity.jpg/480px-Balloon_static_electricity.jpg",
          "imageHeight": 220,
          "explanation": "La fricción transfiere electrones entre el cabello y el globo, dejándolos con cargas opuestas. El globo cargado induce una redistribución de cargas en la pared y se produce una atracción electrostática."
        },
        {
          "question": "En la fotosíntesis, ¿cuál es el PRODUCTO principal para la planta y de dónde proviene el oxígeno liberado?",
          "options": [
            "El producto principal es el oxígeno, y proviene del CO2.",
            "El producto principal es la glucosa, y el oxígeno proviene del agua.",
            "El producto principal es el agua, y el oxígeno proviene de la glucosa.",
            "El producto principal es el CO2, y el oxígeno proviene del aire."
          ],
          "correct": 1,
          "difficulty": "dificil",
          "timeLimit": 30,
          "points": 1200,
          "explanation": "El objetivo de la fotosíntesis es producir glucosa (energía química). El oxígeno es un SUBPRODUCTO y proviene de la ruptura de las moléculas de agua (fotólisis), no del CO2. Es un error conceptual muy común entre estudiantes."
        },
        {
          "question": "Estás diseñando un experimento para saber si la música hace crecer más rápido a las plantas. ¿Qué hace que el experimento sea 'justo'?",
          "options": [
            "Usar la mayor cantidad posible de plantas distintas.",
            "Mantener iguales todas las condiciones salvo la variable estudiada, con un grupo control.",
            "Elegir de antemano el resultado que esperas confirmar.",
            "Medir solo el grupo que escucha música para ahorrar tiempo."
          ],
          "correct": 1,
          "difficulty": "media",
          "timeLimit": 25,
          "points": 1000,
          "explanation": "Un experimento justo aísla la variable independiente (la música) manteniendo constantes las demás condiciones (luz, agua, especie, temperatura) e incluye un grupo control (sin música) para comparar. Así se puede atribuir cualquier diferencia a la variable estudiada."
        }
      ]
    }$q$::jsonb
  );

  RAISE NOTICE 'Éxito: reto quiz interactivo insertado en el curso lab % (orden %).', v_course_id, v_order + 1;

END $$;

-- Verificación (opcional):
-- SELECT "order", title, challenge_type FROM public.course_modules
-- WHERE course_id = (SELECT id FROM public.courses WHERE theme='lab' AND is_active=true LIMIT 1)
-- ORDER BY "order";
