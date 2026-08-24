-- ============================================================
-- 0060: Curso demo "Por qué esa es la respuesta"
--
-- El estudiante responde preguntas de MATEMÁTICAS y, después de cada una,
-- recibe un análisis con tres partes fijas:
--
--   1. CÓMO ESTÁ CONSTRUIDA LA PREGUNTA — qué evalúa de verdad, cuál es el dato
--      ancla y cuál es ruido. Es la anatomía del ítem.
--   2. LA LÓGICA, PASO A PASO — el razonamiento completo hasta el resultado,
--      más una comprobación de sentido común.
--   3. POR QUÉ CAEN LAS OTRAS — cada distractor con el error que lo produce,
--      dicho con nombre propio.
--
-- Esa estructura se repite idéntica en las tres preguntas A PROPÓSITO: el
-- estudiante no aprende tres soluciones, aprende el molde con el que se
-- desarma cualquier pregunta de opción múltiple.
--
-- Los tres distractores de cada pregunta corresponden a errores REALES y
-- nombrables (proporcionalidad invertida, relación aditiva por multiplicativa,
-- paso incompleto, confusión de dimensión), no a números al azar. El módulo 3
-- los clasifica.
--
-- Pensado para la demo del Modo Aula en Vivo (§8): pregunta → resultados →
-- explicación → tabla de posiciones.
--
-- Requiere: 0007 (courses/course_modules), 0011 (course_modules.area_id),
-- 0012 (theme, character_line).
--
-- ⚠️ `course_modules.area_id` va en NULL. `dbRowsToCourseModules` (store.jsx)
-- filtra los módulos por el área seleccionada del estudiante: con un área
-- distinta de la suya, se le esconden TODOS y el mapa dice "Ruta en
-- preparación". Los seeds 0014 y 0021 usan NULL por la misma razón.
--
-- ⚠️ NO usa `courses.area_id`: esa columna NO existe (0007 no la crea y ninguna
-- migración la agrega). Los seeds 0014/0015/0016 sí la insertan, y por eso
-- fallarían tal como están escritos hoy.
--
-- Idempotente: reejecutar borra y reinserta los módulos del curso.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
  v_id_1      uuid;
  v_id_2      uuid;
BEGIN

  -- ── 1. El curso ──────────────────────────────────────────────────────────
  -- `theme = 'escape-room'`: es el tema visual que este proyecto ya asocia a
  -- MATEMÁTICAS (seed 0014, "Sala de Escape - Matematicas"). Paleta verde-ámbar
  -- sobre fondo oscuro. Al ponerlo, toda la interfaz —incluida la Clase en Vivo
  -- Guiada— se tiñe sola: los componentes se pintan con variables CSS y el
  -- atributo `data-course-theme` va en el <html> (app.jsx).
  --
  -- ⚠️ El seed 0014 localiza SU curso con `WHERE theme='escape-room' LIMIT 1`,
  -- así que ahora hay dos candidatos. Si algún día se arregla 0014 (hoy falla:
  -- inserta `courses.area_id`, columna que no existe) hay que cambiarle esa
  -- búsqueda a `WHERE name = 'Sala de Escape - Matematicas'` antes de correrlo,
  -- o podría sembrar sus 9 módulos dentro de este curso.
  SELECT id INTO v_course_id FROM public.courses
   WHERE name = 'Por qué esa es la respuesta' LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (name, description, color, is_active, theme)
    VALUES (
      'Por qué esa es la respuesta',
      'Preguntas de matemáticas con el análisis completo detrás: cómo está construida cada pregunta, con qué lógica se resuelve y qué error produce cada opción incorrecta.',
      '#5E4F9C', true, 'escape-room'
    )
    RETURNING id INTO v_course_id;
  END IF;

  RAISE NOTICE 'Curso "Por qué esa es la respuesta" ID: %', v_course_id;

  -- ── 2. Limpieza para reejecución ─────────────────────────────────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ══════════════════════════════════════════════════════════════
  -- MÓDULO 1 (lesson) — Anatomía de una pregunta
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled,
     area_id, character_line, content)
  VALUES (
    v_course_id,
    'Anatomía de una pregunta',
    'Módulo 1 — Qué hay dentro de un ítem de opción múltiple',
    'Antes de resolver, aprende a leer cómo está construida la pregunta: qué evalúa, qué dato es el ancla, qué es ruido y por qué cada opción incorrecta está ahí.',
    'lesson', 1, 100, true, NULL,
    'Una pregunta bien hecha no esconde la respuesta: esconde el razonamiento.',
    $j1$[
      {
        "type": "intro",
        "title": "El resultado no es la clase",
        "text": "En una pregunta de cuatro opciones, acertar al azar tiene un 25 % de probabilidad. Por descarte, mucho más. El número correcto, por sí solo, no prueba que el estudiante entendió: prueba que llegó. Lo que enseña es el camino — y el camino se ve mejor en los errores que en el acierto."
      },
      {
        "type": "concepts",
        "title": "Las cuatro partes de un ítem",
        "items": [
          { "t": "Lo que evalúa", "d": "No es el tema. Una pregunta de proporcionalidad puede estar evaluando si distingues lo directo de lo inverso, no si sabes multiplicar." },
          { "t": "El dato ancla", "d": "El número sin el cual el problema no se puede resolver. Encontrarlo ordena todo lo demás." },
          { "t": "El ruido", "d": "Datos que aparecen y no se usan. No están por error: están para ver si calculas con todo lo que ves." },
          { "t": "Los distractores", "d": "Cada opción incorrecta es un error típico, no un número al azar. Se puede predecir cuál va a elegir cada estudiante." }
        ]
      },
      {
        "type": "steps",
        "title": "Cómo desarmar cualquier pregunta, en este orden",
        "items": [
          { "icon": "🎯", "t": "1. ¿Qué me están preguntando?", "d": "Reescribe la pregunta con tus palabras antes de mirar las opciones. Si no puedes, todavía no la entendiste." },
          { "icon": "⚓", "t": "2. ¿Qué dato manda y cuál sobra?", "d": "Separa el ancla del ruido. Un dato que es igual en las dos situaciones del problema casi nunca entra en la operación." },
          { "icon": "🧮", "t": "3. Resuelve y comprueba el sentido", "d": "Antes de mirar las opciones, pregúntate si el resultado debía ser mayor o menor. Muchas opciones se caen sin calcular nada." },
          { "icon": "🔍", "t": "4. ¿Qué error produce cada opción?", "d": "Ponle nombre: operación invertida, resta en vez de división, paso incompleto, dimensión equivocada." }
        ]
      },
      {
        "type": "compare",
        "title": "Dos estudiantes que marcaron lo mismo",
        "label": "Ambos acertaron. Solo uno puede repetirlo la próxima vez.",
        "trad": "\"Me dio 3,6 haciendo la regla de tres.\" No sabe si era directa o inversa; le funcionó. Con los mismos números en otro orden, falla.",
        "dce": "\"Más máquinas tienen que dar menos tiempo, así que la respuesta debía ser menor que 6. Multipliqué máquinas por horas para tener el trabajo total y lo repartí entre 5.\""
      },
      {
        "type": "callout",
        "icon": "⚠️",
        "title": "El error más común al explicar",
        "text": "Explicar solo por qué la correcta es correcta. El estudiante que falló no eligió esa: eligió otra, y necesita saber qué lo llevó hasta ahí. El análisis de los distractores no es el cierre de la clase — es la clase."
      },
      {
        "type": "checklist",
        "title": "Antes de pasar al reto, comprueba que puedes",
        "items": [
          "Decir qué evalúa una pregunta sin resolverla",
          "Distinguir el dato ancla del ruido",
          "Anticipar si el resultado debe ser mayor o menor que el dato inicial",
          "Ponerle nombre al error que produce una opción incorrecta"
        ]
      }
    ]$j1$::jsonb
  )
  RETURNING id INTO v_id_1;

  -- ══════════════════════════════════════════════════════════════
  -- MÓDULO 2 (quiz) — 3 preguntas de matemáticas con análisis completo
  -- ══════════════════════════════════════════════════════════════
  -- Las explicaciones usan el markup ligero del proyecto: **negrilla** y saltos
  -- de línea reales (RichText los respeta con whiteSpace:pre-wrap, tanto en
  -- `challenges.jsx` como en el Modo Aula en Vivo).
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp,
     is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Tres preguntas, tres razonamientos',
    'Módulo 2 — Proporcionalidad, promedios y áreas',
    'Responde cada pregunta y luego lee el análisis: cómo está construida, con qué lógica se resuelve y qué error produce cada opción incorrecta.',
    'challenge', 'quiz', 2, 300, true, NULL,
    ARRAY[v_id_1::text],
    'Tres preguntas. Lo que aprendes está en lo que viene después de cada una.',
    $jQ${
      "passingScore": 67,
      "maxAttempts": 3,
      "passMessage": "Bien. Ahora lo que importa: lee los tres análisis, incluso los de las preguntas que acertaste.",
      "failMessage": "No pasa nada. Los análisis están escritos para que veas exactamente dónde se torció el razonamiento.",
      "questions": [
        {
          "question": "Tres máquinas idénticas embotellan **900 litros** de jugo en **6 horas**. ¿Cuántas horas necesitan **cinco** máquinas iguales para embotellar esos mismos 900 litros?",
          "options": [
            "10 horas",
            "3,6 horas",
            "4 horas",
            "2 horas"
          ],
          "correct": 1,
          "difficulty": "media",
          "timeLimit": 60,
          "points": 1000,
          "explanation": "**Cómo está construida la pregunta.**\nNo evalúa si sabes hacer una regla de tres: evalúa si distingues la proporcionalidad **inversa** de la directa. Y trae un ruido deliberado: los **900 litros** aparecen en el enunciado pero no entran en ningún cálculo. Es el mismo trabajo en los dos casos, así que se cancela. Regla general: **un dato que no cambia entre las dos situaciones del problema casi nunca entra en la operación.**\nEl dato ancla no son los litros, es el producto máquinas × horas.\n\n**La lógica, paso a paso.**\n1) Multiplica máquinas por horas para obtener el trabajo total: 3 × 6 = **18 máquina-hora**.\n2) Ese trabajo no cambia: son los mismos 900 litros.\n3) Repártelo entre las cinco máquinas: 18 ÷ 5 = **3,6 horas**.\n\n**La comprobación que ahorra la mitad del examen:** más máquinas tienen que dar menos tiempo. Cualquier opción **mayor que 6** está mal antes de calcular nada — eso elimina la A de un vistazo.\n\n**Por qué caen las otras.**\n**A (10 h)** — regla de tres directa: 6 × 5 ÷ 3. Es el error central que la pregunta busca: da más tiempo con más máquinas, un absurdo que el estudiante no revisa porque confía en el procedimiento.\n**C (4 h)** — resta en vez de dividir: «dos máquinas más, dos horas menos». Convierte una relación multiplicativa en aditiva.\n**D (2 h)** — divide 6 entre 3, las máquinas **iniciales**, en lugar de repartir el trabajo entre las 5 nuevas. Operación correcta, número equivocado."
        },
        {
          "question": "En un curso de **30 estudiantes**, el promedio de una prueba fue **3,0**. Se anulan las notas de los **5 estudiantes** que sacaron **1,0**. ¿Cuál es el promedio de los 25 restantes?",
          "options": [
            "3,4",
            "3,0",
            "3,6",
            "2,8"
          ],
          "correct": 0,
          "difficulty": "alta",
          "timeLimit": 75,
          "points": 1200,
          "explanation": "**Cómo está construida la pregunta.**\nEvalúa si entiendes que **un promedio no se puede arrastrar**: no es un valor que viaje con el grupo, es un cociente entre una suma y una cantidad. Para modificarlo hay que volver a la suma, cambiarla y volver a dividir.\nEl dato ancla no es el 3,0 — son los **30 estudiantes**. Sin ese número no puedes reconstruir la suma total, y sin la suma no hay problema.\n\n**La lógica, paso a paso.**\n1) Reconstruye la suma: 30 × 3,0 = **90 puntos** en total.\n2) Quita las cinco notas anuladas: 90 − (5 × 1,0) = **85**.\n3) Divide entre los que quedan: 85 ÷ 25 = **3,4**.\n\n**La comprobación:** salieron notas por debajo del promedio, así que el promedio tiene que **subir**. Todo lo que sea 3,0 o menos está mal sin calcular — eso elimina la B y la D.\n\n**Por qué caen las otras.**\n**B (3,0)** — supone que quitar estudiantes no mueve el promedio. Es el error de tratarlo como una etiqueta del curso y no como un cociente.\n**C (3,6)** — 90 ÷ 25: quitó a los estudiantes del divisor pero **olvidó quitar sus notas** de la suma.\n**D (2,8)** — 85 ÷ 30: quitó las notas de la suma pero **olvidó quitar a los estudiantes** del divisor.\nC y D son la misma operación dejada a medias, cada una por un lado distinto. Si en tu curso aparecen las dos, no hay dos errores: hay uno solo, y es que el procedimiento se aplicó sin entenderlo."
        },
        {
          "question": "El lado de un cuadrado aumenta un **20 %**. ¿En qué porcentaje aumenta su **área**?",
          "options": [
            "20 %",
            "40 %",
            "44 %",
            "4 %"
          ],
          "correct": 2,
          "difficulty": "media",
          "timeLimit": 60,
          "points": 1000,
          "explanation": "**Cómo está construida la pregunta.**\nEvalúa una sola idea: **el área no crece igual que la longitud.** Si el lado se multiplica por 1,2, el área se multiplica por 1,2 × 1,2 = 1,44. Es la confusión de dimensión, y es de las que más se repiten porque el 20 % «se siente» como la respuesta.\nNo hay dato ancla numérico: la pregunta no da ninguna medida. Eso es una pista, no un problema — significa que **el resultado no depende del tamaño del cuadrado**.\n\n**La lógica, paso a paso.**\n1) Como el resultado no depende del lado, toma uno cómodo: **lado 10**, área 100.\n2) Auméntalo un 20 %: lado **12**, área 144.\n3) Compara: 144 − 100 = 44 sobre 100 → **44 %**.\nElegir el 10 no es hacer trampa: como la respuesta es un porcentaje, cualquier lado da lo mismo. Compruébalo con 5 si quieres.\n\n**Dibújalo y se ve solo.** Al cuadrado original le pegas dos franjas laterales (20 % cada una) **y una esquinita** de 0,2 × 0,2. Las dos franjas son el 40 %; la esquina es el 4 % que casi todo el mundo olvida.\n\n**Por qué caen las otras.**\n**A (20 %)** — le aplica al área el porcentaje del lado. Confunde crecimiento lineal con crecimiento en dos dimensiones.\n**B (40 %)** — suma las dos franjas y **olvida la esquina**. Es el error más avanzado de los tres: entendió que había dos dimensiones, pero descompuso mal la figura.\n**D (4 %)** — se queda **solo con la esquina** (0,2 × 0,2) y descarta las franjas. El razonamiento inverso al de B.\nB y D juntos son el mapa del error: cada uno se quedó con una mitad de la figura."
        }
      ]
    }$jQ$::jsonb
  )
  RETURNING id INTO v_id_2;

  -- ══════════════════════════════════════════════════════════════
  -- MÓDULO 3 (lesson) — Llevarlo al aula
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled,
     area_id, requirements, character_line, content)
  VALUES (
    v_course_id,
    'Enseñar el razonamiento, no el resultado',
    'Módulo 3 — De la explicación a la rutina de clase',
    'Cómo convertir el análisis de distractores en una rutina de aula de diez minutos que funcione con cualquier pregunta.',
    'lesson', 3, 100, true, NULL,
    ARRAY[v_id_2::text],
    'Lo que acabas de hacer tres veces es lo que tus estudiantes tienen que aprender a hacer solos.',
    $j3$[
      {
        "type": "intro",
        "title": "El molde que se repite",
        "text": "Los tres análisis tienen la misma forma: cómo está construida la pregunta, la lógica paso a paso, y qué error produce cada opción. Esa repetición no fue pereza de redacción — es el molde. Después de cinco o seis veces, el estudiante empieza a aplicarlo sin que se lo pidan, incluso en preguntas que nadie le explicó."
      },
      {
        "type": "concepts",
        "title": "Los cuatro errores que producen los distractores",
        "items": [
          { "t": "Operación invertida", "d": "Aplica proporcionalidad directa donde era inversa, o multiplica donde había que dividir. La opción A de la pregunta 1." },
          { "t": "Aditivo por multiplicativo", "d": "Suma o resta donde la relación era de producto o cociente: «dos máquinas más, dos horas menos». La opción C de la pregunta 1." },
          { "t": "Paso incompleto", "d": "Hace la mitad del procedimiento. Las opciones C y D de la pregunta 2 son la misma omisión por lados distintos." },
          { "t": "Dimensión equivocada", "d": "Trata un área como si fuera una longitud, o descompone mal la figura. Las opciones A, B y D de la pregunta 3." }
        ]
      },
      {
        "type": "steps",
        "title": "La rutina de aula, en diez minutos",
        "items": [
          { "icon": "🗳️", "t": "Voten primero, discutan después", "d": "Cada estudiante marca en silencio. Sin esto, los primeros en hablar deciden por todo el salón y los demás dejan de pensar." },
          { "icon": "🙋", "t": "Que hable quien falló", "d": "Pregúntale qué hacía atractiva la opción que eligió. El nombre del error aparece dicho por ellos, que es la única forma en que se queda." },
          { "icon": "⚖️", "t": "Comprueba el sentido antes del cálculo", "d": "«¿La respuesta tenía que ser mayor o menor?» Es el hábito que más preguntas salva y el que menos se enseña." },
          { "icon": "🏷️", "t": "Ponle nombre al error", "d": "Cierra clasificando cada distractor con uno de los cuatro tipos. Eso es lo que se transfiere a la siguiente prueba." }
        ]
      },
      {
        "type": "callout",
        "icon": "🎯",
        "title": "En el Modo Aula en Vivo",
        "text": "Este curso está armado para lanzarse desde Aula en Vivo: los estudiantes responden desde el celular, ven los resultados, luego el análisis en pantalla y después la tabla de posiciones. Esa pausa entre el revelado y el ranking es justo el momento de la rutina de arriba — no la saltes por avanzar rápido."
      },
      {
        "type": "reveal",
        "title": "Una advertencia sobre el ranking",
        "icon": "🏆",
        "label": "Ver la advertencia",
        "items": [
          { "t": "El puntaje premia la rapidez", "d": "En vivo, responder rápido vale más puntos. Es lo que hace divertido el juego, pero no es lo que estás enseñando." },
          { "t": "Compensa en la discusión", "d": "Reconoce en voz alta a quien mejor sustentó, no solo a quien lidera la tabla. Si el único premio es la velocidad, enseñas a adivinar rápido." }
        ]
      }
    ]$j3$::jsonb
  );

  RAISE NOTICE 'Curso sembrado: 3 módulos (lección + quiz de 3 preguntas + lección).';
END $$;

-- ── Verificación ────────────────────────────────────────────────────────────
-- Esperado: 3 módulos, el quiz con 3 preguntas, las 3 con análisis, y area_id
-- en NULL en los tres (si no, el estudiante ve "Ruta en preparación").
select m."order", m.title, m.type, m.challenge_type,
       coalesce(m.area_id, 'NULL (correcto)') as area_id,
       jsonb_array_length(coalesce(m.challenge_data->'questions', '[]'::jsonb)) as preguntas,
       (select count(*) from jsonb_array_elements(coalesce(m.challenge_data->'questions', '[]'::jsonb)) q
         where q->>'explanation' is not null) as con_analisis
  from public.course_modules m
  join public.courses c on c.id = m.course_id
 where c.name = 'Por qué esa es la respuesta'
 order by m."order";
