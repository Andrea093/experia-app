-- ============================================================
-- 0020: Curso "Ecosistema Digital IA — MOOC para docentes"
--
-- Crea el curso + 8 módulos (lecciones con video) con DESBLOQUEO SECUENCIAL:
-- cada módulo requiere completar el anterior (requirements = [id previo]).
-- Cada módulo lleva una sección "intro" (propósito) y una sección "video"
-- con URL placeholder (se reemplaza por la URL real de YouTube más adelante).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase (los seeds no se
--    aplican con el deploy del frontend).
-- Idempotente: si el curso ya existe (por nombre), reutiliza su id y
-- reemplaza sus módulos.
-- ============================================================

DO $$
DECLARE
  v_course_id   uuid;
  v_placeholder text := 'https://www.youtube.com/watch?v=PLACEHOLDER';
  v_prev        uuid := NULL;  -- id del módulo anterior (para el desbloqueo)
  v_id          uuid;          -- id del módulo recién insertado
BEGIN

  -- 1) Crear el curso (o reutilizar si ya existe por nombre)
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE name = 'Ecosistema Digital IA — MOOC para docentes'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (name, description, color, is_active)
    VALUES (
      'Ecosistema Digital IA — MOOC para docentes',
      'Curso de introducción y uso del Ecosistema Digital IA, que guía al docente desde el acceso a la plataforma hasta la activación de planes de refuerzo y acciones pedagógicas de aula.',
      '#2563EB',
      true
    )
    RETURNING id INTO v_course_id;
    RAISE NOTICE 'Curso creado: %', v_course_id;
  ELSE
    RAISE NOTICE 'Curso ya existía, se reutiliza: %', v_course_id;
  END IF;

  -- 2) Limpia módulos previos de este curso (idempotencia)
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- 3) Inserta los 8 módulos en orden, encadenando requirements.
  --    El primer módulo queda con requirements vacío (disponible de entrada);
  --    cada módulo siguiente requiere el id del anterior.

  -- ── Momento 0 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Introducción al MOOC',
     'Momento 0 · Ecosistema Digital IA',
     'Presentar el sentido del ecosistema, el objetivo del MOOC y la lógica de trabajo: diagnóstico, interpretación, intervención y seguimiento.',
     'lesson', 1, 100, true, null,
     '{}'::text[],
     ('[
        {"type":"intro","title":"Introducción al MOOC","text":"Presentar el sentido del ecosistema, el objetivo del MOOC y la lógica de trabajo: diagnóstico, interpretación, intervención y seguimiento."},
        {"type":"video","title":"Video 1. Bienvenida y propósito del Ecosistema Digital IA","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 1 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Acceso a la plataforma',
     'Momento 1 · Ecosistema Digital IA',
     'Explicar cómo el usuario ingresa, valida sus credenciales y reconoce el entorno inicial.',
     'lesson', 2, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Acceso a la plataforma","text":"Explicar cómo el usuario ingresa, valida sus credenciales y reconoce el entorno inicial."},
        {"type":"video","title":"Video 2. Ingreso y validación de acceso","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 2 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Reconocimiento del entorno',
     'Momento 2 · Ecosistema Digital IA',
     'Mostrar la función del menú Evaluar dentro del ecosistema.',
     'lesson', 3, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Reconocimiento del entorno","text":"Mostrar la función del menú Evaluar dentro del ecosistema."},
        {"type":"video","title":"Video 3. Menús principales","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 3 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Creación del instrumento',
     'Momento 3 · Ecosistema Digital IA',
     'Guiar al docente en la configuración inicial de una prueba o simulacro.',
     'lesson', 4, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Creación del instrumento","text":"Guiar al docente en la configuración inicial de una prueba o simulacro."},
        {"type":"video","title":"Video 4. Generar y configurar el primer instrumento","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 4 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Lectura de resultados',
     'Momento 4 · Ecosistema Digital IA',
     'Explicar cómo consultar resultados y qué información puede analizar el docente.',
     'lesson', 5, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Lectura de resultados","text":"Explicar cómo consultar resultados y qué información puede analizar el docente."},
        {"type":"video","title":"Video 5. Seguimiento y visualización de resultados","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 5 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Planes de refuerzo individual',
     'Momento 5 · Ecosistema Digital IA',
     'Mostrar cómo activar planes personalizados para los estudiantes de acuerdo con sus necesidades específicas.',
     'lesson', 6, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Planes de refuerzo individual","text":"Mostrar cómo activar planes personalizados para los estudiantes de acuerdo con sus necesidades específicas."},
        {"type":"video","title":"Video 6. Activación de planes de refuerzo individuales","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 6 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Priorización pedagógica',
     'Momento 6 · Ecosistema Digital IA',
     'Explicar cómo reconocer brechas de aprendizaje relevantes a partir de los resultados.',
     'lesson', 7, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Priorización pedagógica","text":"Explicar cómo reconocer brechas de aprendizaje relevantes a partir de los resultados."},
        {"type":"video","title":"Video 7. Identificación de brechas prioritarias","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  -- ── Momento 7 ──
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, requirements, content)
  VALUES (v_course_id,
     'Acciones para el aula',
     'Momento 7 · Ecosistema Digital IA',
     'Orientar al docente sobre cómo usar la información para planear acciones colectivas o de aula.',
     'lesson', 8, 100, true, null,
     ARRAY[v_prev::text],
     ('[
        {"type":"intro","title":"Acciones para el aula","text":"Orientar al docente sobre cómo usar la información para planear acciones colectivas o de aula."},
        {"type":"video","title":"Video 8. Activación de acciones pedagógicas para el aula","desc":"Video propuesto para este momento. (Pendiente de cargar la URL real.)","url":"' || v_placeholder || '"}
      ]')::jsonb)
  RETURNING id INTO v_id;
  v_prev := v_id;

  RAISE NOTICE 'Éxito: 8 módulos secuenciales insertados para "Ecosistema Digital IA" (id: %)', v_course_id;

END $$;

-- Verificación (opcional): lista los módulos creados en orden con su requisito
-- SELECT "order", title, requirements FROM public.course_modules
-- WHERE course_id = (SELECT id FROM public.courses WHERE name = 'Ecosistema Digital IA — MOOC para docentes')
-- ORDER BY "order";
