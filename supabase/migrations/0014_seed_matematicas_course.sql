-- ============================================================
-- 0014_seed_matematicas_course.sql
-- Crea el curso "Sala de Escape - Matematicas" con tema escape-room
-- y siembra los 9 modulos de formacion docente en matematicas.
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
  VALUES ('Sala de Escape - Matematicas', 'matematicas', true, 'escape-room')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'escape-room'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear ni encontrar el curso escape-room';
  END IF;

  RAISE NOTICE 'Curso escape-room ID: %', v_course_id;

  -- ── 2. Limpiar modulos previos (para re-ejecutar limpiamente) ────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ── 3. Sembrar los 9 modulos ─────────────────────────────────────────────

  -- MODULO 1: Lesson — La Puerta del Numero
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_m1', v_course_id,
    'La Puerta del Numero',
    'lesson', 100,
    '{"x":62}'::jsonb,
    '[]'::jsonb,
    $j1${
      "sections": [
        {
          "type": "heading",
          "text": "El pensamiento matematico en la ensenanza"
        },
        {
          "type": "text",
          "text": "Pensar matematicamente no es solo calcular. Es razonar, argumentar, modelar situaciones reales y comunicar ideas con precision. Como docentes, nuestra tarea es abrir esa puerta para nuestros estudiantes."
        },
        {
          "type": "quote",
          "text": "Las matematicas no son mas que un lenguaje de patrones. Quien aprende a verlos, aprende a leer el universo.",
          "author": "Henri Poincare"
        },
        {
          "type": "heading",
          "text": "Las cuatro competencias matematicas"
        },
        {
          "type": "steps",
          "items": [
            { "icon": "🔢", "title": "Razonamiento", "text": "Identificar patrones, formular conjeturas y construir argumentos logicos." },
            { "icon": "📐", "title": "Modelacion", "text": "Traducir situaciones del mundo real al lenguaje matematico y viceversa." },
            { "icon": "🔗", "title": "Comunicacion", "text": "Expresar ideas matematicas de forma clara, oral y escrita." },
            { "icon": "🧩", "title": "Resolucion", "text": "Aplicar estrategias para resolver problemas desconocidos o novedosos." }
          ]
        },
        {
          "type": "text",
          "text": "El Diseno Centrado en la Experiencia (DCE) propone que el docente disenye situaciones donde el estudiante explore, se equivoque y construya significado. No memorizacion: comprension profunda."
        },
        {
          "type": "reveal",
          "title": "Reflexion: Que tipo de docente matematico quieres ser?",
          "text": "Antes de continuar, piensa en un momento en que una leccion de matematicas te cambio la forma de ver algo. Que hizo ese docente diferente? La respuesta sera tu guia en este curso.",
          "items": [
            { "title": "Transmisor de formulas", "desc": "El docente explica, el estudiante repite. Funciona a corto plazo, pero no construye comprension duradera." },
            { "title": "Facilitador de exploracion", "desc": "El docente plantea retos, guia el razonamiento y valida las ideas de los estudiantes. Genera aprendizaje significativo." },
            { "title": "Disenador de experiencias", "desc": "El docente crea situaciones autenticas donde las matematicas emergen como herramienta necesaria. El nivel mas transformador." }
          ]
        }
      ]
    }$j1$::jsonb,
    'Bienvenido a la Sala de Escape. La primera puerta se abre comprendiendo que las matematicas son mas que numeros.'
  );

  -- MODULO 2: Challenge dragdrop — Secuencia de Acceso
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_c1', v_course_id,
    'Secuencia de Acceso',
    'challenge', 150,
    '{"x":38}'::jsonb,
    '["mat_m1"]'::jsonb,
    $j2${
      "ctype": "drag-drop",
      "instructions": "Ordena las fases del proceso de ensenanza matematica segun el enfoque DCE. La secuencia correcta abre la siguiente puerta.",
      "phrases": [
        "Plantear una situacion problematica de la vida real",
        "Explorar y manipular el problema de forma libre",
        "Identificar los conceptos matematicos involucrados",
        "Formalizar el concepto con definiciones y simbolos",
        "Aplicar el concepto en nuevos contextos",
        "Reflexionar sobre el proceso de aprendizaje"
      ]
    }$j2$::jsonb,
    'Ordena los pasos correctamente y escucharas el clic de la cerradura abrirse.'
  );

  -- MODULO 3: Lesson — El Cuarto de las Proporciones
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_m2', v_course_id,
    'El Cuarto de las Proporciones',
    'lesson', 120,
    '{"x":65}'::jsonb,
    '["mat_c1"]'::jsonb,
    $j3${
      "sections": [
        {
          "type": "heading",
          "text": "Razon, proporcion y pensamiento proporcional"
        },
        {
          "type": "text",
          "text": "El pensamiento proporcional es uno de los conceptos mas potentes en la educacion primaria y secundaria. Comprenderlo profundamente como docente te permite anticipar las dificultades de tus estudiantes y disenar mejores experiencias."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "⚖️", "title": "Razon", "text": "Comparacion multiplicativa entre dos cantidades: si hay 3 manzanas por cada 2 naranjas, la razon es 3:2." },
            { "icon": "🔄", "title": "Proporcion", "text": "Igualdad entre dos razones: a/b = c/d. La base de porcentajes, escalas y tasas de cambio." },
            { "icon": "📊", "title": "Pensamiento proporcional", "text": "La capacidad de reconocer y usar relaciones multiplicativas en contextos variados. Se desarrolla gradualmente, no se transmite de golpe." }
          ]
        },
        {
          "type": "quote",
          "text": "Un estudiante que solo memoriza reglas de proporciones sin comprender su significado es como alguien que sabe las notas de una cancion pero no puede escuchar la melodia.",
          "author": "Freudenthal, Matematica Realista"
        },
        {
          "type": "image",
          "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Scale_of_justice_2_new.svg/800px-Scale_of_justice_2_new.svg.png",
          "alt": "Balanza de la justicia — metafora de la proporcion",
          "caption": "La balanza como modelo fisico de la proporcion: equilibrio entre razones iguales."
        },
        {
          "type": "reveal",
          "title": "Errores clasicos que cometen los estudiantes",
          "text": "Conocer los obstaculos tipicos te permite disenayr actividades que los anticipen.",
          "items": [
            { "title": "Razonamiento aditivo en contextos multiplicativos", "desc": "El estudiante suma en lugar de multiplicar. Ejemplo: si 2 chocolates cuestan 500, creen que 5 cuestan 503." },
            { "title": "Invertir la razon", "desc": "Confunden a/b con b/a. Critico en problemas de velocidad, densidad y escalas." },
            { "title": "Porcentaje como numero absoluto", "desc": "El 20% de 50 y el 20% de 200 producen resultados distintos, pero muchos estudiantes los tratan igual." }
          ]
        }
      ]
    }$j3$::jsonb,
    'La proporcion es la llave que equilibra los dos lados de la cerradura. Sin equilibrio, la puerta no gira.'
  );

  -- MODULO 4: Challenge empathy — Mapa de Obstaculos
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_c2', v_course_id,
    'Mapa de Obstaculos',
    'challenge', 150,
    '{"x":35}'::jsonb,
    '["mat_m2"]'::jsonb,
    $j4${
      "ctype": "empathy",
      "persona": "Un estudiante de grado 7 que tiene dificultades con fracciones y porcentajes",
      "instructions": "Organiza cada observacion en el cuadrante correcto del mapa de empatia del estudiante."
    }$j4$::jsonb,
    'Para abrir la puerta del aprendizaje, primero debes entrar a la mente de quien aprende.'
  );

  -- MODULO 5: Lesson — La Sala de los Datos
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_m3', v_course_id,
    'La Sala de los Datos',
    'lesson', 130,
    '{"x":63}'::jsonb,
    '["mat_c2"]'::jsonb,
    $j5${
      "sections": [
        {
          "type": "heading",
          "text": "Estadistica y pensamiento estadistico en el aula"
        },
        {
          "type": "text",
          "text": "Vivimos en la era de los datos. Ensenamos estadistica para que los estudiantes lean el mundo con sentido critico: no para que memoricen formulas de media y moda, sino para que tomen decisiones informadas."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "❓", "title": "Plantear una pregunta estadistica", "text": "Una pregunta estadistica tiene variabilidad: distintas personas responderian diferente. Ejemplo: Cuantas horas duermes por noche?" },
            { "icon": "📋", "title": "Recoger datos", "text": "Decidir que datos, como recogerlos y de quien. La calidad del dato determina la calidad de la conclusion." },
            { "icon": "📊", "title": "Analizar y representar", "text": "Elegir la representacion adecuada: tabla, grafico de barras, histograma, diagrama de puntos. Cada uno revela algo diferente." },
            { "icon": "💡", "title": "Interpretar y comunicar", "text": "Formular conclusiones honradas: lo que los datos muestran y lo que NO muestran." }
          ]
        },
        {
          "type": "quote",
          "text": "Los datos no hablan por si solos. Necesitan un interprete que comprenda su contexto, sus limitaciones y sus posibilidades.",
          "author": "George Box, estadistico"
        },
        {
          "type": "reveal",
          "title": "Actividades de alta calidad para estadistica en el aula",
          "text": "Estas actividades generan pensamiento estadistico autentico, no solo calculo mecanico.",
          "items": [
            { "title": "Censos del salon", "desc": "Recoger datos reales del grupo: tiempos de desplazamiento, gustos, habitos. Los estudiantes se convierten en datos y en analistias." },
            { "title": "Lectura critica de graficos", "desc": "Analizar graficos de periodicos o redes sociales que pueden ser enganosos. Excelente para pensamiento critico." },
            { "title": "Mini-investigaciones", "desc": "Grupos de 3-4 estudiantes formulan su propia pregunta estadistica, recogen datos y presentan conclusiones." }
          ]
        }
      ]
    }$j5$::jsonb,
    'Los datos son pistas ocultas en los numeros. Aprender a leerlos abre puertas que otros no pueden ver.'
  );

  -- MODULO 6: Challenge simulation — El Panel de Control
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_c3', v_course_id,
    'El Panel de Control',
    'challenge', 200,
    '{"x":37}'::jsonb,
    '["mat_m3"]'::jsonb,
    $j6${
      "ctype": "simulation",
      "context": "Eres docente de matematicas en grado 8. Tienes que planear una clase sobre sistemas de ecuaciones lineales. Debes tomar decisiones pedagogicas clave.",
      "steps": [
        {
          "prompt": "Como introduces el tema de sistemas de ecuaciones?",
          "options": [
            { "text": "Explico el metodo de sustitucion en el tablero con ejemplos numericos", "outcome": "Los estudiantes copian los pasos pero no comprenden cuando aplicarlos. Resultado: mecanico.", "score": 1 },
            { "text": "Planteo una situacion: dos amigos quieren comprar boletas para el mismo concierto con distintos presupuestos", "outcome": "Los estudiantes sienten la necesidad del sistema. El modelo emerge naturalmente.", "score": 3 },
            { "text": "Doy la definicion formal y luego ejercicios de practica", "outcome": "Accesible pero desconectado del contexto real. Comprension parcial.", "score": 2 }
          ]
        },
        {
          "prompt": "Un estudiante dice: profe, para que sirve esto en la vida real? Como respondes?",
          "options": [
            { "text": "Le digo que es parte del curriculo y que necesita aprenderlo para el examen", "outcome": "El estudiante cierra la mente. La pregunta sigue sin respuesta y la motivacion cae.", "score": 1 },
            { "text": "Le muestro ejemplos de uso en ingenieria, economia y programacion", "outcome": "Interesante pero abstracto para el estudiante. Mejora un poco la motivacion.", "score": 2 },
            { "text": "Convierto su pregunta en el proyecto del bimestre: investigar un problema real que se resuelva con sistemas", "outcome": "El estudiante se convierte en el protagonista. La pregunta se transforma en motor de aprendizaje.", "score": 3 }
          ]
        },
        {
          "prompt": "Como evaluas si los estudiantes comprendieron los sistemas de ecuaciones?",
          "options": [
            { "text": "Quiz de 10 ejercicios mecanicos para resolver por sustitucion o eliminacion", "outcome": "Mide procedimiento, no comprension. Muchos pasan sin entender.", "score": 1 },
            { "text": "Pido que expliquen con sus palabras cuando tiene solucion unica, cuando no tiene y cuando tiene infinitas soluciones", "outcome": "Evalua comprension conceptual. Los estudiantes deben razonar, no solo operar.", "score": 3 },
            { "text": "Taller de problemas en grupo con distintos contextos", "outcome": "Evalua aplicacion y comunicacion. Buen balance entre proceso y resultado.", "score": 2 }
          ]
        }
      ]
    }$j6$::jsonb,
    'Cada decision pedagogica activa o desactiva una palanca del aprendizaje. Elige con sabiduria.'
  );

  -- MODULO 7: Lesson — El Corredor Logico
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_m4', v_course_id,
    'El Corredor Logico',
    'lesson', 130,
    '{"x":64}'::jsonb,
    '["mat_c3"]'::jsonb,
    $j7${
      "sections": [
        {
          "type": "heading",
          "text": "Argumentacion matematica: el arte de demostrar"
        },
        {
          "type": "text",
          "text": "Argumentar en matematicas no es pelear. Es construir un camino logico que convenza a cualquier persona razonable. La argumentacion es la columna vertebral del pensamiento matematico avanzado y puede ensenarse desde la primaria."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "🔍", "title": "Conjetura", "text": "Una idea que parece verdadera pero aun no esta demostrada. El punto de partida de toda matematica creativa." },
            { "icon": "🧪", "title": "Verificacion", "text": "Probar la conjetura con casos especificos. Si falla en uno, la conjetura es falsa. Si funciona en muchos, motiva la busqueda de una demostracion." },
            { "icon": "📝", "title": "Demostracion", "text": "Un argumento riguroso y general que prueba que la conjetura es siempre verdadera, sin importar el caso." },
            { "icon": "🔄", "title": "Generalizacion", "text": "Extender el resultado a contextos mas amplios. El ciclo comienza de nuevo con nuevas conjeturas." }
          ]
        },
        {
          "type": "quote",
          "text": "No me convences con ejemplos; me convences con argumentos. Pero los ejemplos me ayudan a creer que vale la pena buscar el argumento.",
          "author": "Paul Halmos, matematico"
        },
        {
          "type": "reveal",
          "title": "Como cultivar la argumentacion matematica en el aula",
          "text": "Estas estrategias funcionan desde primero de primaria hasta bachillerato.",
          "items": [
            { "title": "Rutinas de pensamiento matematico", "desc": "Comenzar cada clase con una conjetura abierta: Siempre, a veces o nunca? Los estudiantes argumentan su posicion con ejemplos y contraejemplos." },
            { "title": "Galeria de errores", "desc": "Mostrar soluciones con errores intencionados y pedir que los estudiantes identifiquen y corrijan el razonamiento incorrecto." },
            { "title": "Debate matematico estructurado", "desc": "Un estudiante presenta su solucion, otro la cuestiona, un tercero ofrece una alternativa. El docente orquesta sin revelar la respuesta." }
          ]
        }
      ]
    }$j7$::jsonb,
    'La logica es el mapa de la mazmorra. Sin ella, cada corredor conduce a un callejon sin salida.'
  );

  -- MODULO 8: Challenge matching — Conexiones Ocultas
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_c4', v_course_id,
    'Conexiones Ocultas',
    'challenge', 150,
    '{"x":36}'::jsonb,
    '["mat_m4"]'::jsonb,
    $j8${
      "ctype": "matching",
      "instructions": "Conecta cada concepto matematico con la situacion cotidiana que mejor lo representa. Cada conexion correcta activa un mecanismo de la puerta final.",
      "pairs": [
        { "concept": "Funcion lineal", "match": "El costo total de un taxi segun los kilometros recorridos" },
        { "concept": "Probabilidad", "match": "Decidir cuantos paraguas llevar al campamento segun el pronostico del tiempo" },
        { "concept": "Geometria de areas", "match": "Calcular cuantas baldosas se necesitan para cubrir un salon" },
        { "concept": "Estadistica descriptiva", "match": "Comparar las notas del salon para saber si la prueba fue muy facil o muy dificil" },
        { "concept": "Sistemas de ecuaciones", "match": "Combinar dos tipos de cafe de distinto precio para obtener una mezcla a precio fijo" },
        { "concept": "Razon y proporcion", "match": "Convertir una receta para 4 personas a una para 10 personas" },
        { "concept": "Exponencial", "match": "Calcular cuantas veces se comparte una publicacion en redes si cada persona la comparte con 3 amigos" }
      ]
    }$j8$::jsonb,
    'Las matematicas estan en todas partes. Quien aprende a ver las conexiones, encuentra llaves que otros no notan.'
  );

  -- MODULO 9: Final delivery — La Llave Maestra
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'mat_final', v_course_id,
    'La Llave Maestra',
    'final_delivery', 300,
    '{"x":50}'::jsonb,
    '["mat_c4"]'::jsonb,
    $j9${
      "instructions": "Has abierto todas las puertas. Ahora disenyas la experiencia que abrira la mente de tus estudiantes.",
      "rubric": [
        {
          "title": "Situacion problematica",
          "desc": "Presenta una situacion de la vida real que genere la necesidad de usar matematicas. Debe ser relevante para el contexto de tus estudiantes."
        },
        {
          "title": "Competencias matematicas",
          "desc": "Identifica cuales de las cuatro competencias (razonamiento, modelacion, comunicacion, resolucion) desarrolla tu diseno y como."
        },
        {
          "title": "Secuencia de aprendizaje",
          "desc": "Describe las etapas de tu leccion: exploracion libre, formalizacion y aplicacion. Que hace el estudiante en cada momento?"
        },
        {
          "title": "Evaluacion autentica",
          "desc": "Como evaluaras la comprension y no solo el procedimiento? Propone al menos una estrategia de evaluacion formativa."
        },
        {
          "title": "Reflexion DCE",
          "desc": "Explica como tu diseno aplica los principios del Diseno Centrado en la Experiencia aprendidos en este curso."
        }
      ]
    }$j9$::jsonb,
    'Has llegado al final de la Sala de Escape. La llave maestra eres tu: un docente que disenya experiencias que abren mentes.'
  );

  RAISE NOTICE '9 modulos del curso Sala de Escape - Matematicas insertados correctamente.';

END $$;
