-- ============================================================
-- 0060: Curso demo "Por qué esa es la respuesta"
--
-- Curso de Lectura Crítica cuyo centro pedagógico NO son las preguntas sino el
-- ANÁLISIS que viene después de cada una: por qué la opción correcta lo es y,
-- sobre todo, por qué cada distractor resulta tentador y dónde exactamente se
-- cae. Es el material pensado para la demo del Modo Aula en Vivo (§8), donde
-- el ciclo es pregunta → resultados → explicación → tabla de posiciones.
--
-- Estructura: 3 módulos, 1 solo reto tipo `quiz` con 3 preguntas.
--   1. Lección — el método de tres pasos (corta, es la preparación)
--   2. Quiz    — texto + 3 preguntas con análisis extenso por pregunta
--   3. Lección — cómo llevar el método al aula
--
-- Las tres preguntas llevan `explanation` con la MISMA estructura fija:
-- por qué la correcta es correcta · un ejemplo del mismo recurso · por qué cae
-- cada una de las otras tres. Esa repetición es deliberada: el estudiante
-- aprende el molde de análisis, no tres análisis sueltos.
--
-- El texto del `passage` es original, escrito para este curso — no se
-- reproduce material de terceros.
--
-- Requiere: 0007 (courses/course_modules), 0011 (course_modules.area_id),
-- 0012 (theme, character_line).
--
-- ⚠️ NO usa `courses.area_id`: esa columna NO existe en el esquema (0007 no la
-- crea y ninguna migración la agrega). Los seeds 0014/0015/0016 sí la insertan
-- y por eso fallarían tal como están escritos hoy.
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
  -- `theme` queda en NULL (tema estándar) A PROPÓSITO: el seed 0021 localiza su
  -- curso con `WHERE theme='detective' LIMIT 1`, así que ponerle un tema
  -- inmersivo a este curso lo volvería un candidato y 0021 podría escribir sus
  -- retos aquí por error. Para la demo se puede activar después con:
  --   update public.courses set theme='detective' where name='Por qué esa es la respuesta';
  -- (pero entonces no reejecutar 0021).
  SELECT id INTO v_course_id FROM public.courses
   WHERE name = 'Por qué esa es la respuesta' LIMIT 1;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (name, description, color, is_active, theme)
    VALUES (
      'Por qué esa es la respuesta',
      'Lectura crítica centrada en el análisis posterior: no basta con acertar, hay que poder sustentar por qué esa opción es la correcta y por qué las otras no.',
      '#5E4F9C', true, NULL
    )
    RETURNING id INTO v_course_id;
  END IF;

  RAISE NOTICE 'Curso "Por qué esa es la respuesta" ID: %', v_course_id;

  -- ── 2. Limpieza para reejecución ─────────────────────────────────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ══════════════════════════════════════════════════════════════
  -- MÓDULO 1 (lesson) — El método
  -- ══════════════════════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled,
     area_id, character_line, content)
  VALUES (
    v_course_id,
    'Acertar no es entender',
    'Módulo 1 — El método de los tres pasos',
    'Un estudiante puede marcar la opción correcta por descarte, por intuición o por azar. Este módulo enseña a sustentar la elección.',
    'lesson', 1, 100, true, 'lectura',
    'Antes de responder, aprende a mirar cómo está construida la trampa.',
    $j1$[
      {
        "type": "intro",
        "title": "El problema de la respuesta correcta",
        "text": "En una pregunta de cuatro opciones, marcar bien al azar tiene un 25 % de probabilidad. Por descarte, mucho más. Eso significa que la respuesta correcta, por sí sola, no prueba que el estudiante entendió nada. Lo que prueba comprensión es poder decir por qué las otras tres están mal."
      },
      {
        "type": "quote",
        "text": "Un distractor bien construido no es una mentira: es una verdad que no responde la pregunta.",
        "author": "Principio de diseño de ítems"
      },
      {
        "type": "steps",
        "title": "Los tres pasos, siempre en este orden",
        "items": [
          { "icon": "🎯", "t": "1. ¿Qué pide exactamente?", "d": "No es lo mismo la tesis que el tema, ni la intención que el contenido. Subraya el verbo de la pregunta antes de mirar las opciones." },
          { "icon": "📍", "t": "2. ¿Dónde lo dice el texto?", "d": "La respuesta correcta siempre se puede anclar a un fragmento concreto. Si no puedes señalarlo con el dedo, todavía no la tienes." },
          { "icon": "🔍", "t": "3. ¿Por qué caen las otras?", "d": "Cada distractor falla por una razón distinta y nombrable: dice algo verdadero pero ajeno, exagera, invierte una relación o responde otra pregunta." }
        ]
      },
      {
        "type": "compare",
        "title": "Dos formas de responder la misma pregunta",
        "label": "El estudiante marca lo mismo en ambos casos. Solo uno aprendió.",
        "trad": "\"Puse la B porque las otras me sonaban raras.\" No hay anclaje al texto ni razón nombrable. Si el examen cambia la redacción, el acierto se pierde.",
        "dce": "\"Puse la B porque el texto dice X en el tercer párrafo; la A dice algo cierto pero de otro tema, y la C invierte la relación de causa.\" Esto se sostiene en cualquier examen."
      },
      {
        "type": "callout",
        "icon": "⚠️",
        "title": "El error más común al enseñar esto",
        "text": "Explicar solo por qué la correcta es correcta. El estudiante que falló no eligió la correcta: eligió otra, y necesita saber qué lo atrajo hacia ella. El análisis de los distractores no es un adorno del final, es la clase."
      },
      {
        "type": "checklist",
        "title": "Antes de pasar al reto, verifica que puedes",
        "items": [
          "Distinguir tesis, tema e intención en un mismo texto",
          "Señalar el fragmento exacto que sustenta una respuesta",
          "Nombrar el tipo de falla de un distractor, no solo decir que está mal"
        ]
      }
    ]$j1$::jsonb
  )
  RETURNING id INTO v_id_1;

  -- ══════════════════════════════════════════════════════════════
  -- MÓDULO 2 (quiz) — 3 preguntas, análisis extenso en cada una
  -- ══════════════════════════════════════════════════════════════
  -- Las explicaciones usan el markup ligero del proyecto: **negrilla** y saltos
  -- de línea reales (RichText los respeta con whiteSpace:pre-wrap, tanto en
  -- `challenges.jsx` como en el Modo Aula en Vivo).
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp,
     is_enabled, area_id, requirements, character_line, challenge_data)
  VALUES (
    v_course_id,
    'El examen que nadie reprobó',
    'Módulo 2 — Tres preguntas, tres análisis',
    'Lee el texto y responde. Después de cada pregunta viene lo importante: el análisis de por qué esa es la respuesta.',
    'challenge', 'quiz', 2, 300, true, 'lectura',
    ARRAY[v_id_1::text],
    'Tres preguntas. Lo que aprendes está en lo que viene después de cada una.',
    $jQ${
      "passage": {
        "intro": "DE ACUERDO CON EL SIGUIENTE TEXTO, RESPONDE LAS PREGUNTAS 1 A 3",
        "title": "EL EXAMEN QUE NADIE REPROBÓ",
        "paragraphs": [
          "Un colegio decidió un experimento incómodo: durante un trimestre, ningún estudiante recibiría nota. Nada de números, nada de puestos, nada de cuadro de honor. Solo comentarios escritos sobre lo que cada uno había logrado y sobre lo que todavía le faltaba. Los profesores estaban aterrados. Los padres, furiosos. Los estudiantes, desconcertados.",
          "Lo primero que llegó fue el silencio. Sin una nota que perseguir, varios estudiantes simplemente dejaron de entregar. ¿Para qué? Durante tres semanas el experimento pareció un fracaso rotundo, y el rector estuvo a punto de cancelarlo.",
          "Pero en la cuarta semana pasó algo raro. Una estudiante preguntó, por primera vez en su vida escolar, si podía volver a entregar un trabajo. No para subir la nota —no había nota— sino porque había entendido, leyendo el comentario de su profesora, qué era exactamente lo que le faltaba. Ese trimestre no midió cuánto sabían los estudiantes. Midió algo más incómodo: cuánto de lo que llamábamos aprendizaje era, en realidad, obediencia."
        ],
        "source": "Texto original elaborado para este curso."
      },
      "passingScore": 67,
      "maxAttempts": 3,
      "passMessage": "Bien. Ahora lo que importa: revisa los tres análisis, incluso los de las preguntas que acertaste.",
      "failMessage": "No pasa nada. Lee los análisis con calma: están escritos para que veas dónde estaba la trampa.",
      "questions": [
        {
          "question": "En el segundo párrafo, la pregunta **«¿Para qué?»** cumple la función de:",
          "options": [
            "expresar la duda del propio autor sobre el experimento.",
            "reproducir el razonamiento de los estudiantes desde su punto de vista.",
            "cuestionar la decisión del rector de mantener el experimento.",
            "interpelar al lector con una pregunta retórica sin respuesta."
          ],
          "correct": 1,
          "difficulty": "media",
          "timeLimit": 45,
          "points": 1000,
          "explanation": "**Por qué la B es la correcta.**\nEsa pregunta no tiene quién la firme. No dice «los estudiantes se preguntaban para qué», ni la encierra en comillas: la voz de los estudiantes entra directo en el texto, sin aviso. Es discurso indirecto libre, y el anclaje está en la frase justo anterior —«dejaron de entregar»—: la pregunta explica esa decisión desde adentro de quien la tomó.\n\n**El mismo recurso, en otro ejemplo:**\n«Miró el reloj por tercera vez. ¿Valía la pena seguir esperando?» La pregunta no es del narrador. Es del personaje, contada por el narrador sin marcarla.\n\n**Por qué caen las otras tres:**\n**A** — atribuye la duda al autor, pero el autor no duda: en el tercer párrafo defiende el experimento y saca de él su conclusión. Es tentadora porque confunde *quién habla* con *quién escribe*.\n**C** — inventa un juicio que no existe. El texto dice que el rector «estuvo a punto de cancelarlo» y ahí se detiene, sin aprobarlo ni criticarlo. Además invierte el dato: la duda del rector era cancelar, no mantener.\n**D** — una pregunta retórica no espera respuesta. Esta sí la tiene, y el propio texto la da en la misma frase. Es el distractor más difícil: acierta en que es una pregunta que no se responde en voz alta, pero se equivoca en a quién pertenece."
        },
        {
          "question": "¿Cuál de las siguientes afirmaciones recoge la **tesis** del texto?",
          "options": [
            "Las calificaciones numéricas deberían eliminarse de la escuela.",
            "Los estudiantes solo se esfuerzan cuando hay una nota de por medio.",
            "Buena parte de lo que la escuela evalúa como aprendizaje es obediencia.",
            "La retroalimentación escrita enseña más que una calificación numérica."
          ],
          "correct": 2,
          "difficulty": "alta",
          "timeLimit": 60,
          "points": 1200,
          "explanation": "**Por qué la C es la correcta.**\nLa tesis es lo que el texto quiere *sostener*, no lo que *cuenta*. Todo el relato —el experimento, el silencio, la estudiante de la cuarta semana— existe para llegar a la última frase: «cuánto de lo que llamábamos aprendizaje era, en realidad, obediencia». Ahí está el anclaje, literal.\n\n**Cómo reconocer una tesis:**\nSi eliminas la frase y el texto se queda sin punto, era la tesis. Si eliminas «los padres estaban furiosos», el texto sobrevive. Si eliminas la última frase, el experimento se queda sin significado.\n\n**Por qué caen las otras tres:**\n**A** — es la conclusión que el lector *podría* sacar, pero el texto nunca la propone. Ojo con este tipo de distractor: pide que confundas la tesis del autor con tu propia opinión sobre el tema.\n**B** — describe lo que pasó en las tres primeras semanas, no lo que el texto concluye. Es un hecho del relato ascendido a tesis. Y el cuarto párrafo lo desmiente: la estudiante volvió a entregar sin nota de por medio.\n**D** — verdadera, defendible y ajena. El texto no compara la eficacia de dos métodos de evaluación; usa el comentario escrito como el detonante de una escena, no como la afirmación que quiere probar. Es el distractor clásico: **algo cierto que responde otra pregunta.**"
        },
        {
          "question": "La organización del texto puede describirse como:",
          "options": [
            "una tesis inicial seguida de tres ejemplos que la confirman.",
            "un experimento, su fracaso aparente y un hallazgo que reinterpreta todo.",
            "una comparación sistemática entre dos modelos de evaluación.",
            "una cronología de los cambios en la evaluación escolar."
          ],
          "correct": 1,
          "difficulty": "media",
          "timeLimit": 45,
          "points": 1000,
          "explanation": "**Por qué la B es la correcta.**\nHay un párrafo por movimiento, y se pueden señalar con el dedo: el primero plantea el experimento, el segundo lo muestra fracasando, el tercero gira con un «Pero» y reinterpreta lo anterior. La tesis **no** está al principio: aparece en la última línea, y solo tiene sentido gracias a lo que vino antes.\n\n**Por qué importa la estructura:**\nEs lo que distingue un texto argumentativo de uno narrativo. Aquí el autor no te dice qué pensar y luego lo demuestra: te hace recorrer el fracaso para que la conclusión te caiga encima. Si la tesis estuviera en el primer párrafo, el texto perdería toda su fuerza.\n\n**Por qué caen las otras tres:**\n**A** — invierte el orden. Es la estructura más común en un texto argumentativo escolar, y por eso es el distractor más elegido: se responde con el molde aprendido en lugar de con el texto que se tiene enfrente.\n**C** — hay dos modelos de evaluación implicados, cierto, pero el texto nunca los contrasta punto por punto. Una comparación sistemática necesita criterios paralelos; aquí hay un relato en orden cronológico.\n**D** — confunde «los hechos van en orden temporal» con «el texto es una cronología». Una cronología recorre un periodo largo con varios hitos; esto es un solo episodio de un trimestre."
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
    'Enseñar el análisis, no la respuesta',
    'Módulo 3 — Del método a la clase',
    'Cómo convertir el análisis de distractores en una rutina de aula que no dependa de tener un banco de preguntas.',
    'lesson', 3, 100, true, 'lectura',
    ARRAY[v_id_2::text],
    'Lo que acabas de hacer tres veces es lo que tus estudiantes tienen que aprender a hacer solos.',
    $j3$[
      {
        "type": "intro",
        "title": "El patrón que se repite",
        "text": "Los tres análisis que acabas de leer tienen la misma forma: por qué la correcta lo es, un ejemplo del mismo recurso, y por qué falla cada distractor. Esa repetición no fue pereza de redacción: es el molde. Cuando un estudiante lo ha recorrido cinco o seis veces, empieza a aplicarlo sin que se lo pidan."
      },
      {
        "type": "concepts",
        "title": "Los cuatro tipos de distractor",
        "items": [
          { "t": "Verdadero pero ajeno", "d": "Afirma algo que el texto sostiene, pero que no responde lo que se preguntó. El más difícil de descartar." },
          { "t": "Molde aprendido", "d": "Es la respuesta que sería correcta en la mayoría de los textos. Se elige sin leer, por costumbre." },
          { "t": "Relación invertida", "d": "Toma los elementos correctos y voltea la causa, el orden o el sujeto." },
          { "t": "Opinión del lector", "d": "Dice lo que el estudiante ya pensaba del tema. Se confunde la tesis del autor con la propia." }
        ]
      },
      {
        "type": "steps",
        "title": "La rutina de aula, en 10 minutos",
        "items": [
          { "icon": "🗳️", "t": "Voten primero, discutan después", "d": "Cada estudiante marca en silencio. Sin esto, los primeros en hablar deciden por todos." },
          { "icon": "🙋", "t": "Que defienda quien falló", "d": "Pregunta qué hacía atractiva la opción que eligieron. Ahí aparece el tipo de distractor, dicho por ellos." },
          { "icon": "📍", "t": "Exige el fragmento", "d": "«¿Dónde lo dice?» Sin señalar la línea, la respuesta no cuenta, aunque sea la correcta." },
          { "icon": "🏷️", "t": "Ponle nombre a la trampa", "d": "Cierra clasificando cada distractor con uno de los cuatro tipos. Es lo que se transfiere al siguiente examen." }
        ]
      },
      {
        "type": "callout",
        "icon": "🎯",
        "title": "En el Modo Aula en Vivo",
        "text": "Este curso está armado para lanzarse desde Aula en Vivo: los estudiantes responden desde su celular, ven los resultados, luego el análisis en pantalla y después la tabla de posiciones. La pausa de la explicación entre el revelado y el ranking es justo el momento de la rutina de arriba — no la saltes por avanzar."
      },
      {
        "type": "reveal",
        "title": "Una advertencia sobre el ranking",
        "icon": "🏆",
        "label": "Ver la advertencia",
        "items": [
          { "t": "El puntaje premia la rapidez", "d": "En vivo, responder rápido vale más. Es lo que hace divertido el juego, pero no es lo que quieres enseñar." },
          { "t": "Compensa en la discusión", "d": "Reconoce en voz alta al que sustentó mejor, no solo al que lidera la tabla. Si el único premio es la velocidad, enseñas a adivinar rápido." }
        ]
      }
    ]$j3$::jsonb
  );

  RAISE NOTICE 'Curso sembrado: 3 módulos (lección + quiz de 3 preguntas + lección).';
END $$;

-- ── Verificación ────────────────────────────────────────────────────────────
-- Esperado: 3 módulos, y el quiz con 3 preguntas, las 3 con explicación.
select m."order", m.title, m.type, m.challenge_type,
       jsonb_array_length(coalesce(m.challenge_data->'questions', '[]'::jsonb)) as preguntas,
       (select count(*) from jsonb_array_elements(coalesce(m.challenge_data->'questions', '[]'::jsonb)) q
         where q->>'explanation' is not null) as con_analisis
  from public.course_modules m
  join public.courses c on c.id = m.course_id
 where c.name = 'Por qué esa es la respuesta'
 order by m."order";
