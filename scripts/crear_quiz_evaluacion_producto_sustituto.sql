-- ============================================================
-- Crea el reto "Evaluación de la ruta" (15 preguntas) al FINAL de la ruta
-- del curso Formación Docente · Producto Sustituto.
--
-- Contenido: Evaluacion_Ruta_Formacion_Docente_1.md — 15 preguntas de opción
-- múltiple sobre los módulos 1, 2 y 3, con la hoja de respuestas aplicada.
--
-- ⚠️ ESTO NO ES UNA MIGRACIÓN. Apunta a un curso concreto por su UUID, que solo
-- existe en la base de producción. Por eso vive en scripts/ y no en migrations/.
--
-- ⚠️ ANTES DE CORRERLO, LEE "EL CURSO DESTINO" ABAJO.
-- ⚠️ DESPUÉS DE CORRERLO: recarga el editor de Ruta (F5) ANTES de tocar
--    "Publicar". El editor publica la lista de módulos que tenía cargada; si
--    publicas con una sesión abierta desde antes, este módulo nuevo NO estará
--    en esa lista y `saveCourseModules` lo BORRARÁ por considerarlo eliminado.
-- ============================================================

-- ── EL CURSO DESTINO ────────────────────────────────────────────────────────
-- Hay TRES cursos con este nombre y no son intercambiables:
--
--   BASE   'Formacion Docente - Producto Sustituto'
--          → lo ven los estudiantes de colegios SIN versión propia
--   FORK   a0d38833-f43f-499b-9396-bb6596f9e5b9  "GenIA Construye"
--          → colegio b743cac4… (Ceinfes)
--   FORK   c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64  "— mi versión"
--          → colegio 47661484… ← ESTE es el que resuelve produtosus@ceinfes.com
--
-- Por defecto se usa el TERCERO: es el que estabas editando en pantalla y el
-- único que ese estudiante va a ver. Si quieres otro, cambia el UUID de abajo.
-- Para ponerlo en el curso BASE, reemplaza el bloque por una búsqueda por
-- nombre: (select id from public.courses
--           where name = 'Formacion Docente - Producto Sustituto'
--             and parent_course_id is null)

DO $$
DECLARE
  v_course_id uuid := 'c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64';  -- ← el curso destino
  v_order     int;
  v_existe    boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.courses WHERE id = v_course_id) INTO v_existe;
  IF NOT v_existe THEN
    RAISE EXCEPTION 'No existe el curso %. Revisa el UUID.', v_course_id;
  END IF;

  -- Idempotencia: si ya se corrió antes, se reemplaza en vez de duplicar.
  DELETE FROM public.course_modules
   WHERE course_id = v_course_id AND title = 'Evaluación de la ruta';

  -- Al final de la ruta.
  SELECT COALESCE(MAX("order"), 0) + 1 INTO v_order
    FROM public.course_modules WHERE course_id = v_course_id;

  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp,
     is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Evaluación de la ruta',
    'Evaluación final — 15 preguntas',
    'Evaluación de cierre sobre los tres módulos de la ruta: contexto de la prueba Saber, la propuesta de formación y la gestión integral de clase.',
    'challenge', 'quiz', v_order, 300,
    true,
    -- area_id en NULL a propósito: con un área concreta, solo lo verían los
    -- estudiantes que tengan ESA área seleccionada y el resto no vería nada.
    NULL,
    'Última parada: 15 preguntas sobre todo lo que recorriste.',
    $QUIZ${
      "passingScore": 70,
      "questions": [
        {
          "question": "¿Para qué sirven principalmente los puntajes obtenidos en las pruebas Saber, más allá de medir el rendimiento académico?",
          "options": [
            "Como requisito único para la promoción escolar de fin de año",
            "Como criterio de selección para el ingreso a la educación superior",
            "Como base para asignar el presupuesto de cada institución educativa",
            "Como referencia para definir el calendario académico nacional"
          ],
          "correct": 1
        },
        {
          "question": "¿Cuál es el documento oficial del ICFES que brinda los objetivos, la estructura, las competencias y los tipos de pregunta de la prueba Saber 11?",
          "options": [
            "El Manual de Convivencia Escolar",
            "El Plan de Mejoramiento Institucional",
            "La Guía de Orientación Saber 11",
            "El Proyecto Educativo Institucional (PEI)"
          ],
          "correct": 2
        },
        {
          "question": "¿Cuáles son las tres partes esenciales que componen una pregunta tipo Saber?",
          "options": [
            "Enunciado, tarea y opciones de respuesta",
            "Contexto, pregunta y justificación",
            "Estímulo, consigna y rúbrica",
            "Introducción, desarrollo y evaluación"
          ],
          "correct": 0
        },
        {
          "question": "De acuerdo con el Ministerio de Educación Nacional, ¿cómo se define una competencia?",
          "options": [
            "El conjunto de contenidos memorizados que un estudiante repite fielmente durante una evaluación escrita",
            "El nivel de asistencia y puntualidad que un estudiante demuestra a lo largo del año escolar",
            "La capacidad exclusiva para resolver operaciones matemáticas de manera mecánica y repetitiva",
            "El conjunto de conocimientos, habilidades y actitudes articuladas que permiten un desempeño flexible, eficaz y consciente en contextos nuevos"
          ],
          "correct": 3
        },
        {
          "question": "¿Cuáles son las tres competencias evaluadas en el área de Ciencias Naturales?",
          "options": [
            "Comprensión lectora, argumentación y producción textual",
            "Uso comprensivo del conocimiento científico, explicación de fenómenos e indagación",
            "Pensamiento numérico, pensamiento espacial y pensamiento aleatorio",
            "Comunicación asertiva, trabajo en equipo y liderazgo"
          ],
          "correct": 1
        },
        {
          "question": "¿A qué grados están dirigidos los cursos de formación de CEINFES?",
          "options": [
            "A los grados noveno, décimo y undécimo",
            "A los grados sexto, séptimo y octavo",
            "Únicamente al grado undécimo, por ser el año de la prueba",
            "A todos los grados de primaria y bachillerato por igual"
          ],
          "correct": 0
        },
        {
          "question": "¿Cuál es el orden correcto de los cinco momentos de la secuencia didáctica para grado 11?",
          "options": [
            "Exploro mis competencias → ¿Qué procesos voy a desarrollar? → Desarrollo mis competencias → Qué debo saber/Qué voy a aprender → Aplico mis competencias",
            "¿Qué procesos voy a desarrollar? → Qué debo saber/Qué voy a aprender → Exploro mis competencias → Aplico mis competencias → Desarrollo mis competencias",
            "¿Qué procesos voy a desarrollar? → Exploro mis competencias → Qué debo saber/Qué voy a aprender → Desarrollo mis competencias → Aplico mis competencias",
            "Aplico mis competencias → Exploro mis competencias → ¿Qué procesos voy a desarrollar? → Desarrollo mis competencias → Qué debo saber/Qué voy a aprender"
          ],
          "correct": 2
        },
        {
          "question": "¿Cuántos ítems componen, respectivamente, 'Exploro mis competencias' y 'Desarrollo mis competencias'?",
          "options": [
            "15 y 10 ítems",
            "10 y 15 ítems",
            "12 y 18 ítems",
            "8 y 20 ítems"
          ],
          "correct": 1
        },
        {
          "question": "¿Cuántas unidades por área tiene el Libro Plata de Saberes 11, y cuál es su intensidad horaria total?",
          "options": [
            "6 unidades por área, con una intensidad total de 104 horas",
            "6 unidades por área, con una intensidad total de 84 horas",
            "4 unidades por área, con una intensidad total de 84 horas",
            "4 unidades por área, con una intensidad total de 104 horas"
          ],
          "correct": 2
        },
        {
          "question": "En el 'Plan de unidades del libro', ¿qué indica la 'Cobertura diagnóstica' de cada unidad?",
          "options": [
            "Cuánto se evaluó ese eje articulador en el simulacro aplicado al grupo",
            "El porcentaje de estudiantes que aprobaron la unidad el año anterior",
            "El número de páginas que ocupa la unidad dentro del libro físico",
            "El tiempo en minutos que debe durar cada sesión de esa unidad"
          ],
          "correct": 0
        },
        {
          "question": "Al marcar asistencia, ¿qué ocurre al hacer clic en 'Cerrar acta' y confirmar?",
          "options": [
            "El acta se envía automáticamente al correo electrónico de cada estudiante",
            "El acta puede seguir modificándose sin ninguna restricción de tiempo",
            "El acta se elimina por completo y debe generarse una nueva desde cero",
            "El acta queda firmada de forma definitiva y ya no se puede volver a editar"
          ],
          "correct": 3
        },
        {
          "question": "Al recolectar las respuestas ítem por ítem para la tabla de efectividad, ¿qué se debe verificar siempre?",
          "options": [
            "Que todos los estudiantes hayan marcado exactamente la misma opción de respuesta",
            "Que la suma de las opciones marcadas coincida con el total de estudiantes del grupo",
            "Que cada estudiante justifique por escrito el porqué de su respuesta elegida",
            "Que la opción A tenga siempre más votos que las demás alternativas"
          ],
          "correct": 1
        },
        {
          "question": "¿Cuál es el orden correcto de las cuatro secciones del Informe final de la sesión?",
          "options": [
            "Asistencia → Unidad del libro trabajada → Recomendaciones → Tabla de efectividad",
            "Tabla de efectividad → Recomendaciones → Unidad del libro trabajada → Asistencia",
            "Recomendaciones → Tabla de efectividad → Asistencia → Unidad del libro trabajada",
            "Unidad del libro trabajada → Asistencia → Tabla de efectividad → Recomendaciones"
          ],
          "correct": 3
        },
        {
          "question": "¿Cómo se calcula la Efectividad de la sesión cuando se aplican los dos momentos (Exploro y Desarrollo)?",
          "options": [
            "Es el promedio entre Exploro mis competencias y Desarrollo mis competencias",
            "Es la suma total de ambos momentos, sin calcular ningún promedio",
            "Se toma únicamente el resultado más alto entre los dos momentos aplicados",
            "Se toma únicamente el resultado de Desarrollo mis competencias aplicado"
          ],
          "correct": 0
        },
        {
          "question": "En el informe final, ¿qué más incluye la sección 'Unidad del libro trabajada', además de la cobertura y el nivel?",
          "options": [
            "El precio de venta del libro y el nombre de la editorial que lo publica",
            "La lista completa de docentes que han trabajado antes esa misma unidad",
            "Las indicaciones del tutor para abordar esa unidad en la institución",
            "El horario completo de clases de la institución durante toda la semana"
          ],
          "correct": 2
        }
      ]
    }$QUIZ$::jsonb
  );

  RAISE NOTICE 'Reto "Evaluación de la ruta" creado en el curso % con orden %.', v_course_id, v_order;
END $$;


-- ── Verificación ────────────────────────────────────────────────────────────
-- Esperado: el reto de último, con 15 preguntas y area_id en NULL.
select m."order", m.title, m.type, m.challenge_type, m.is_enabled,
       coalesce(m.area_id, 'NULL (correcto)') as area_id,
       jsonb_array_length(m.challenge_data->'questions') as preguntas
  from public.course_modules m
 where m.course_id = 'c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64'
 order by m."order";
