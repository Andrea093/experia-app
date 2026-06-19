-- 0013: Módulos iniciales del curso Lenguaje — Detectives de Texto
-- Ejecutar en Supabase SQL Editor DESPUÉS de crear el curso con theme='detective'
-- Reemplaza COURSE_ID con el UUID real del curso Lenguaje

DO $$
DECLARE
  v_course_id uuid;
BEGIN

  -- Auto-detecta el curso con tema detective (ajusta el nombre si es distinto)
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'detective' AND is_active = true
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un curso activo con theme=detective. Crea primero el curso en AdminCourses.';
  END IF;

  RAISE NOTICE 'Insertando módulos para curso: %', v_course_id;

  -- Limpia módulos anteriores de este curso (área transversal = null)
  DELETE FROM public.course_modules
  WHERE course_id = v_course_id AND type != 'final_delivery';

  -- ══════════════════════════════════════════════
  -- MÓDULO 1 — Introducción: El arte de leer entre líneas
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El arte de leer entre líneas',
    'Módulo 1 — Lectura Crítica',
    'Descubre qué significa realmente leer de manera crítica y por qué es la habilidad más poderosa de un detective del texto.',
    'lesson', 1, 150, true, null,
    'Detective, cada texto es una escena del crimen. Las palabras mienten, ocultan y revelan. Empieza por aquí.',
    '[
      {
        "type": "intro",
        "title": "Bienvenido al caso",
        "text": "Leer críticamente no significa desconfiar de todo. Significa hacerle las preguntas correctas al texto: ¿quién lo escribió?, ¿con qué intención?, ¿qué deja por fuera? Un buen detective del texto nunca acepta la primera versión de los hechos."
      },
      {
        "type": "image",
        "title": "La escena del texto",
        "url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80",
        "caption": "Todo texto tiene un autor, un contexto y una intención oculta."
      },
      {
        "type": "quote",
        "text": "El lector crítico no pregunta qué dice el texto, sino por qué lo dice así y no de otra manera.",
        "author": "Inspectora Vera Clío"
      },
      {
        "type": "steps",
        "title": "El protocolo del detective lector",
        "items": [
          { "icon": "🔍", "t": "Observa el contexto", "d": "¿Dónde fue publicado? ¿Cuándo? ¿Para qué audiencia?" },
          { "icon": "🖊️", "t": "Identifica al autor", "d": "¿Quién firma? ¿Qué intereses tiene? ¿Qué credenciales?" },
          { "icon": "🎯", "t": "Detecta la intención", "d": "¿Informa, persuade, entretiene o manipula?" },
          { "icon": "⚖️", "t": "Evalúa la evidencia", "d": "¿Los datos tienen fuente? ¿Los argumentos son sólidos?" },
          { "icon": "📋", "t": "Formula tu veredicto", "d": "¿Qué conclusión puedes sostener con evidencia?" }
        ]
      },
      {
        "type": "callout",
        "icon": "🕵️",
        "title": "¿Sabías esto?",
        "text": "Los estudiantes que practican lectura crítica obtienen un 40% mejor desempeño en pruebas de comprensión lectora que quienes solo leen de forma literal. La diferencia está en las preguntas que se hacen."
      },
      {
        "type": "concepts",
        "title": "Conceptos clave del expediente",
        "items": [
          { "t": "Lectura literal", "d": "Entender lo que el texto dice explícitamente, sin interpretación." },
          { "t": "Lectura inferencial", "d": "Deducir lo que el texto implica pero no dice directamente." },
          { "t": "Lectura crítica", "d": "Evaluar el texto, cuestionar sus supuestos y valorar su validez." },
          { "t": "Intención comunicativa", "d": "El propósito que tiene el autor al producir el texto." }
        ]
      }
    ]'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- RETO 1 — Identifica el nivel de lectura
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Clasifica la evidencia',
    'Reto 1 — Lectura Crítica',
    'Ordena cada pregunta según el nivel de lectura que representa: literal, inferencial o crítica.',
    'challenge', 'dragdrop', 2, 100, true, null,
    '¡Primera prueba, detective! Clasifica estas preguntas por nivel de lectura. El orden importa.',
    '{
      "dragItems": [
        { "id": "d1", "text": "¿Qué personaje aparece en el texto?", "correctZone": "literal" },
        { "id": "d2", "text": "¿Por qué el autor usa ese tono tan formal?", "correctZone": "critica" },
        { "id": "d3", "text": "¿Qué conclusión puedes sacar del final?", "correctZone": "inferencial" },
        { "id": "d4", "text": "¿Cuántos párrafos tiene el texto?", "correctZone": "literal" },
        { "id": "d5", "text": "¿A quién beneficia este discurso?", "correctZone": "critica" },
        { "id": "d6", "text": "¿Qué habrá sentido el personaje en esa escena?", "correctZone": "inferencial" }
      ],
      "zones": [
        { "id": "literal", "label": "Lectura Literal" },
        { "id": "inferencial", "label": "Lectura Inferencial" },
        { "id": "critica", "label": "Lectura Crítica" }
      ]
    }'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- MÓDULO 2 — El texto y su contexto
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El texto y su contexto',
    'Módulo 2 — Lectura Crítica',
    'Todo texto nace en un momento, un lugar y una circunstancia. Aprende a leer el contexto como el detective lee la escena del crimen.',
    'lesson', 3, 150, true, null,
    'El contexto es el primer testigo. Antes de leer una sola línea, ya hay pistas valiosas en quién escribe, cuándo y para quién.',
    '[
      {
        "type": "intro",
        "title": "La escena antes del texto",
        "text": "Un periodista que publica en un medio financiado por una empresa farmacéutica no escribirá igual que uno independiente. El contexto no determina si el texto miente, pero sí nos alerta sobre qué preguntas hacer."
      },
      {
        "type": "compare",
        "title": "Lectura sin contexto vs. con contexto",
        "label": "El mismo texto puede leerse de formas muy distintas",
        "trad": "\"El producto X mejoró la salud de 9 de cada 10 usuarios\" → Parece un hecho.",
        "dce": "Mismo dato, pero el estudio fue financiado por el fabricante y solo duró 2 semanas → La pista cambia todo."
      },
      {
        "type": "reveal",
        "label": "🗂️ Abrir expediente: tipos de contexto",
        "openLabel": "Cerrar expediente",
        "icon": "🗂️",
        "items": [
          { "t": "Contexto histórico", "d": "Momento en que fue producido el texto. Las ideas tienen fecha de vencimiento." },
          { "t": "Contexto social", "d": "A qué grupo social pertenece el autor y qué intereses representa." },
          { "t": "Contexto editorial", "d": "El medio que lo publica: ¿quién lo financia? ¿qué línea editorial tiene?" },
          { "t": "Contexto cultural", "d": "Los valores y creencias implícitas que el texto da por sentadas." }
        ]
      },
      {
        "type": "steps",
        "title": "Cómo analizar el contexto de un texto",
        "items": [
          { "icon": "📅", "t": "Fecha de publicación", "d": "¿Cuándo fue escrito? ¿Qué pasaba en el mundo en ese momento?" },
          { "icon": "🏛️", "t": "Medio o soporte", "d": "¿Dónde apareció? ¿Blog personal, diario oficial, red social, libro académico?" },
          { "icon": "👤", "t": "Perfil del autor", "d": "¿Quién es? ¿Tiene formación en el tema? ¿A qué institución pertenece?" },
          { "icon": "🎯", "t": "Audiencia objetivo", "d": "¿Para quién fue escrito? El destinatario moldea el mensaje." }
        ]
      },
      {
        "type": "callout",
        "icon": "📌",
        "title": "Pista del caso",
        "text": "En lenguaje, el contexto NO es una excusa para descalificar un texto. Es una herramienta para leerlo con más precisión. Un texto de propaganda puede contener datos verdaderos; uno académico puede tener sesgos."
      }
    ]'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- RETO 2 — Mapa de empatía del autor
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'El perfil del sospechoso',
    'Reto 2 — Lectura Crítica',
    'Construye el mapa de empatía del autor del texto para entender qué siente, piensa, dice y hace.',
    'challenge', 'empathy', 4, 100, true, null,
    'Todo autor deja huellas. El mapa de empatía es tu herramienta para reconstruir quién está detrás del texto.',
    '{
      "empathyCards": [
        { "id": "e1", "text": "Usa un lenguaje técnico para parecer experto", "zone": "dice" },
        { "id": "e2", "text": "Quiere convencer al lector de su postura", "zone": "piensa" },
        { "id": "e3", "text": "Selecciona solo los datos que lo favorecen", "zone": "hace" },
        { "id": "e4", "text": "Teme que su argumento sea rebatido", "zone": "siente" },
        { "id": "e5", "text": "Presenta sus opiniones como hechos objetivos", "zone": "dice" },
        { "id": "e6", "text": "Cree que su perspectiva es la única válida", "zone": "piensa" },
        { "id": "e7", "text": "Omite las fuentes que contradicen su tesis", "zone": "hace" },
        { "id": "e8", "text": "Siente urgencia de publicar antes que otros", "zone": "siente" }
      ]
    }'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- MÓDULO 3 — Argumentos, falacias y evidencia
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Argumentos, falacias y evidencia',
    'Módulo 3 — Lectura Crítica',
    'Aprende a distinguir un argumento sólido de una falacia disfrazada. La herramienta más poderosa del detective lector.',
    'lesson', 5, 200, true, null,
    'Aquí el caso se complica, detective. No todos los argumentos son lo que parecen. Algunos son trampas perfectamente construidas.',
    '[
      {
        "type": "intro",
        "title": "No todo lo que suena lógico lo es",
        "text": "Una falacia es un argumento que parece válido pero tiene un error en su estructura lógica. Los textos persuasivos las usan con frecuencia porque funcionan: apelan a las emociones, a la autoridad o al miedo para evadir el razonamiento."
      },
      {
        "type": "image",
        "title": "La evidencia en el tablero",
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        "caption": "Un argumento sin evidencia es solo una opinión con buena presentación."
      },
      {
        "type": "concepts",
        "title": "Tipos de falacias más comunes",
        "items": [
          { "t": "Ad hominem", "d": "Atacar al autor en vez de al argumento. Ejemplo: No le creas, es un político." },
          { "t": "Hombre de paja", "d": "Distorsionar el argumento del otro para rebatirlo más fácilmente." },
          { "t": "Pendiente resbaladiza", "d": "Asumir que una acción llevará inevitablemente a consecuencias extremas." },
          { "t": "Apelación a la autoridad", "d": "Usar a una figura famosa como prueba, sin argumentos reales." },
          { "t": "Falsa dicotomía", "d": "Presentar solo dos opciones cuando hay más posibilidades." },
          { "t": "Apelación al miedo", "d": "Usar amenazas o consecuencias aterradoras para forzar una conclusión." }
        ]
      },
      {
        "type": "reveal",
        "label": "🔍 Analizar evidencia: ¿qué hace válido un argumento?",
        "openLabel": "Cerrar análisis",
        "icon": "🔍",
        "items": [
          { "t": "Fuente verificable", "d": "La evidencia proviene de una fuente que puede consultarse y tiene credibilidad." },
          { "t": "Relevancia", "d": "La evidencia realmente apoya la conclusión que se quiere demostrar." },
          { "t": "Suficiencia", "d": "Hay suficiente evidencia; un solo caso no prueba la regla." },
          { "t": "Actualidad", "d": "Los datos son recientes y no han sido desmentidos por estudios posteriores." }
        ]
      },
      {
        "type": "quote",
        "text": "Una falacia bien construida es más peligrosa que una mentira obvia. La mentira se ve; la falacia se siente como verdad.",
        "author": "Inspectora Vera Clío"
      },
      {
        "type": "callout",
        "icon": "⚠️",
        "title": "Alerta del caso",
        "text": "En tus clases, cuando pidas a los estudiantes que argumenten, recuerda: el objetivo no es ganar el debate, sino construir argumentos válidos con evidencia real. La diferencia es fundamental para la formación ciudadana."
      }
    ]'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- RETO 3 — Simulación: El interrogatorio al texto
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'El interrogatorio al texto',
    'Reto 3 — Lectura Crítica',
    'Tienes un texto sospechoso ante ti. Elige qué preguntas hacerle en cada etapa del interrogatorio.',
    'challenge', 'simulation', 6, 150, true, null,
    'Este es el momento clave, detective. El texto está aquí. ¿Sabes qué preguntas hacerle?',
    '{
      "simContext": "Tienes frente a ti un artículo de opinión publicado en una revista de negocios que afirma que reducir el salario mínimo aumentaría el empleo. El autor es director de una asociación de empresarios. Debes interrogar el texto paso a paso.",
      "steps": [
        {
          "prompt": "Primer paso: ¿Por dónde empiezas el interrogatorio?",
          "options": [
            { "text": "Identifico quién escribió el texto y qué intereses tiene", "correct": true, "feedback": "Correcto. El contexto del autor es la primera pista. Sabemos que representa a empresarios, lo que puede sesgar su perspectiva." },
            { "text": "Busco si el argumento tiene sentido emocional", "correct": false, "feedback": "Las emociones son importantes, pero no son el primer paso. Primero: ¿quién habla y desde dónde?" },
            { "text": "Cuento cuántas palabras tiene el texto", "correct": false, "feedback": "La extensión no es una pista relevante en el análisis crítico." }
          ]
        },
        {
          "prompt": "Segundo paso: El texto usa el dato: en países con salario mínimo bajo, el desempleo es menor. ¿Qué haces?",
          "options": [
            { "text": "Lo acepto porque viene con un número concreto", "correct": false, "feedback": "Los números pueden ser verdaderos pero usados de forma engañosa. Correlación no implica causalidad." },
            { "text": "Verifico la fuente y pregunto qué otros factores explican esa correlación", "correct": true, "feedback": "Exacto. Un dato puede ser real y aun así ser una falacia si omite variables. Aquí podría haber falsa causalidad." },
            { "text": "Lo rechazo porque el autor tiene conflicto de interés", "correct": false, "feedback": "Cuidado: rechazar un dato solo por la fuente es falacia ad hominem. Verifica el dato por sus méritos." }
          ]
        },
        {
          "prompt": "Tercer paso: El texto dice: todos los economistas serios están de acuerdo. ¿Qué tipo de recurso es este?",
          "options": [
            { "text": "Una apelación a la autoridad sin nombres ni fuentes", "correct": true, "feedback": "¡Exacto! Decir todos los expertos sin citar a nadie específico es una falacia clásica. ¿Cuáles economistas? ¿Dónde lo publicaron?" },
            { "text": "Una evidencia sólida que respalda el argumento", "correct": false, "feedback": "No. Una afirmación sin fuente concreta no es evidencia, sin importar cuántos expertos mencione vagamente." },
            { "text": "Una falsa dicotomía", "correct": false, "feedback": "No exactamente. La falsa dicotomía plantea solo dos opciones. Aquí el problema es la autoridad no verificable." }
          ]
        }
      ]
    }'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- MÓDULO 4 — Diseñar experiencias de lectura crítica
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Diseñar experiencias de lectura crítica',
    'Módulo 4 — Lectura Crítica',
    'Ahora que eres un detective del texto, aprende a formar otros detectives. Cómo diseñar actividades que desarrollen lectura crítica en tus estudiantes.',
    'lesson', 7, 200, true, null,
    'El mejor detective no trabaja solo. Tu misión final es entrenar a los próximos lectores críticos. Este módulo es sobre eso.',
    '[
      {
        "type": "intro",
        "title": "De detective a formador de detectives",
        "text": "Desarrollar lectura crítica en el aula no significa llenar tableros con preguntas difíciles. Significa crear situaciones donde los estudiantes necesiten cuestionar, comparar, inferir y evaluar. El docente diseña el caso; el estudiante lo resuelve."
      },
      {
        "type": "steps",
        "title": "Cómo diseñar una actividad de lectura crítica",
        "items": [
          { "icon": "📰", "t": "Elige textos con tensión", "d": "Selecciona textos que tengan un punto de vista claro, un contexto interesante o un argumento debatible." },
          { "icon": "❓", "t": "Formula preguntas de los 3 niveles", "d": "Combina preguntas literales, inferenciales y críticas en cada actividad." },
          { "icon": "🔄", "t": "Incluye textos en contradicción", "d": "Presenta dos textos con posturas opuestas sobre el mismo tema. La comparación activa el pensamiento crítico." },
          { "icon": "🗣️", "t": "Crea espacio para el debate", "d": "Los estudiantes defienden su interpretación con evidencia del texto, no con opiniones vacías." },
          { "icon": "📋", "t": "Evalúa el proceso, no solo la respuesta", "d": "Califica cómo el estudiante llegó a su conclusión, no solo si acertó o no." }
        ]
      },
      {
        "type": "reveal",
        "label": "📂 Ver banco de preguntas críticas listas para usar",
        "openLabel": "Cerrar banco",
        "icon": "📂",
        "items": [
          { "t": "Sobre el autor", "d": "¿Qué intereses puede tener el autor al escribir esto? ¿Qué deja por fuera?" },
          { "t": "Sobre la evidencia", "d": "¿Qué datos usa para apoyar su argumento? ¿Son verificables?" },
          { "t": "Sobre el lenguaje", "d": "¿Qué palabras elige? ¿Podría haber usado otras? ¿Por qué estas?" },
          { "t": "Sobre el lector", "d": "¿A quién convence este texto? ¿A quién no? ¿Por qué?" },
          { "t": "Sobre las alternativas", "d": "¿Cómo se vería este tema desde otra perspectiva? ¿Quién no aparece en el texto?" }
        ]
      },
      {
        "type": "callout",
        "icon": "🏆",
        "title": "Diseño Centrado en Experiencias",
        "text": "Una actividad de lectura crítica bien diseñada no empieza con el texto, empieza con la pregunta que quieres que el estudiante se haga. Primero la pregunta, luego el texto que la activa."
      },
      {
        "type": "image",
        "title": "El aula como sala de investigación",
        "url": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
        "caption": "Cada estudiante con un texto diferente, todos con la misma pregunta. Eso es diseño de experiencias."
      }
    ]'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- RETO 4 — Matching: Conceptos y definiciones
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Conecta las pistas',
    'Reto 4 — Lectura Crítica',
    'Conecta cada concepto del caso con su definición correcta. El expediente está casi cerrado.',
    'challenge', 'matching', 8, 100, true, null,
    '¡Casi lo tienes, detective! Conecta las pistas. Este es el último reto antes del veredicto final.',
    '{
      "matchPairs": [
        { "left": "Falacia ad hominem", "right": "Atacar a la persona en vez de a su argumento" },
        { "left": "Lectura inferencial", "right": "Deducir lo que el texto no dice explícitamente" },
        { "left": "Contexto editorial", "right": "El medio que publica el texto y sus intereses" },
        { "left": "Falsa dicotomía", "right": "Presentar solo dos opciones cuando hay más" },
        { "left": "Evidencia verificable", "right": "Dato que proviene de una fuente consultable" },
        { "left": "Intención comunicativa", "right": "El propósito que tiene el autor al escribir" }
      ]
    }'::jsonb
  );

  -- ══════════════════════════════════════════════
  -- ENTREGA FINAL — Laboratorio del Detective
  -- ══════════════════════════════════════════════
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line)
  VALUES (
    v_course_id,
    'El expediente final',
    'Entrega Final — Lectura Crítica',
    'Diseña y entrega tu unidad didáctica de lectura crítica: una secuencia de actividades que conviertan a tus estudiantes en detectives del texto.',
    'final_delivery', 9, 300, true, null,
    '¡El caso está a punto de cerrarse, detective! Esta es tu entrega. El expediente completo. Tu mejor trabajo.'
  );

  RAISE NOTICE 'Éxito: 9 módulos insertados para el curso Detectives de Texto (id: %)', v_course_id;

END $$;
