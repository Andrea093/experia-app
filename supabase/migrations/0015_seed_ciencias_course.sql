-- ============================================================
-- 0015_seed_ciencias_course.sql
-- Crea el curso "Laboratorio de Ciencias Naturales" con tema lab
-- y siembra los 9 modulos de formacion docente en ciencias.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- Requiere migracion 0012 (columnas theme y character_line).
--
-- Esquema real de course_modules (ver 0007/0011): id uuid auto,
-- columnas "order", is_enabled, area_id, challenge_type, challenge_data.
-- Las formas de content/challenge_data coinciden con lo que renderiza
-- el frontend (lesson.jsx y challenges.jsx). Plantilla: 0013.
-- ============================================================

DO $$
DECLARE
  v_course_id uuid;
BEGIN

  -- ── 1. Crear el curso si no existe ──────────────────────────────────────
  INSERT INTO public.courses (name, area_id, is_active, theme)
  VALUES ('Laboratorio de Ciencias Naturales', 'ciencias', true, 'lab')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE theme = 'lab'
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear ni encontrar el curso lab';
  END IF;

  RAISE NOTICE 'Curso lab ID: %', v_course_id;

  -- ── 2. Limpiar modulos previos ────────────────────────────────────────────
  DELETE FROM public.course_modules WHERE course_id = v_course_id;

  -- ── 3. Sembrar los 9 modulos ─────────────────────────────────────────────

  -- MODULO 1 (lesson) — El Metodo Cientifico en el Aula
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'El Metodo Cientifico en el Aula',
    'Modulo 1 — Ciencia que se Vive',
    'Invierte el proceso: de memorizar definiciones a observar, preguntar y experimentar.',
    'lesson', 1, 100, true, null,
    'La ciencia empieza con asombro. Si tu clase no genera asombro, algo falta en el diseno.',
    $j1$[
      {
        "type": "intro",
        "title": "Ciencia que se vive, no ciencia que se memoriza",
        "text": "La gran paradoja de la ensenanza de ciencias: estudiantes que memorizan definiciones de osmosis, fotosintesis y celula procariota... pero que nunca han observado realmente la naturaleza. El Diseno Centrado en la Experiencia propone invertir ese proceso."
      },
      {
        "type": "quote",
        "text": "La ciencia no es un conjunto de hechos. Es una manera de pensar: esceptica, curiosa, dispuesta a cambiar de opinion ante la evidencia.",
        "author": "Carl Sagan, astronomo"
      },
      {
        "type": "steps",
        "title": "El ciclo del pensamiento cientifico",
        "items": [
          { "icon": "👁️", "t": "Observar", "d": "Prestar atencion al mundo con todos los sentidos. Registrar sin juzgar. La observacion sistematica es una habilidad que se aprende." },
          { "icon": "❓", "t": "Preguntar", "d": "Formular preguntas investigables: que tienen respuesta observable o medible. Diferencia entre pregunta filosofica y cientifica." },
          { "icon": "💡", "t": "Hipotetizar", "d": "Proponer una explicacion provisional y verificable. No es adivinar: es razonar a partir de lo que ya se sabe." },
          { "icon": "🔬", "t": "Experimentar", "d": "Disenar una prueba justa que aisle las variables. Control vs. experimental. La raiz de la credibilidad cientifica." },
          { "icon": "📊", "t": "Analizar y concluir", "d": "Interpretar datos con honestidad. Aceptar cuando la evidencia contradice la hipotesis. Eso tambien es ciencia." }
        ]
      },
      {
        "type": "reveal",
        "title": "Ciencia cotidiana vs. ciencia escolar: la gran brecha",
        "label": "Comparar enfoques",
        "openLabel": "Cerrar comparacion",
        "icon": "🔭",
        "items": [
          { "t": "Ciencia real", "d": "Parte de preguntas genuinas. Los errores son datos. Las conclusiones son provisionales. El proceso importa tanto como el resultado." },
          { "t": "Ciencia escolar tradicional", "d": "Parte de definiciones a memorizar. Los errores son fracasos. Las conclusiones ya estan en el libro. El resultado importa mas que el proceso." },
          { "t": "Ciencia escolar DCE", "d": "Parte de fenomenos reales y preguntas de los estudiantes. Los errores revelan pensamiento. El proceso de investigacion es el aprendizaje mismo." }
        ],
        "text": "Analiza estas diferencias y reflexiona sobre tu practica actual."
      }
    ]$j1$::jsonb
  );

  -- MODULO 2 (challenge dragdrop) — Orden del Protocolo
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Orden del Protocolo',
    'Reto 1 — Metodo Cientifico',
    'Ordena los pasos de una investigacion en la secuencia correcta del metodo cientifico.',
    'challenge', 'dragdrop', 2, 150, true, null,
    'Un protocolo bien ordenado es la diferencia entre un experimento y una ocurrencia. Demuestra que sabes la diferencia.',
    $j2${
      "dragItems": [
        "Observar que las plantas de la casa de la abuela parecen mas saludables porque ella les habla",
        "Formular la pregunta: la musica clasica hace crecer mas rapido a las plantas?",
        "Hipotetizar: las plantas expuestas a musica clasica crecen un 20% mas que las plantas en silencio",
        "Disenar el experimento con grupo control (silencio) y grupo experimental (musica), misma especie y condiciones",
        "Medir el crecimiento de ambos grupos durante 4 semanas y registrar los datos",
        "Analizar los datos y concluir si la hipotesis se confirma, se rechaza o se necesita mas informacion"
      ]
    }$j2$::jsonb
  );

  -- MODULO 3 (lesson) — Biologia que Conecta con la Vida
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Biologia que Conecta con la Vida',
    'Modulo 2 — Biologia desde el Asombro',
    'La biologia estudia la vida, y tus estudiantes son vida: la asignatura mas personal de todas.',
    'lesson', 3, 120, true, null,
    'La biologia estudia la vida. Y tus estudiantes son vida. No necesitas ir lejos para encontrar el laboratorio.',
    $j3$[
      {
        "type": "intro",
        "title": "Ensenando biologia desde el asombro y la conexion",
        "text": "La biologia estudia la vida. Y los estudiantes son vida. Entonces, la biologia deberia ser la asignatura mas personal y relevante de todas. El reto del docente es tender ese puente: desde los conceptos abstractos hasta la experiencia corporal y cotidiana."
      },
      {
        "type": "steps",
        "title": "Tres puentes hacia la vida",
        "items": [
          { "icon": "🦠", "t": "La celula como ciudad", "d": "La analogia funciona porque los estudiantes ya conocen ciudades. El nucleo como alcaldia, las mitocondrias como plantas de energia, la membrana como muralla. Las analogias movilizan el conocimiento previo." },
          { "icon": "🌿", "t": "Ecosistema en un frasco", "d": "Un ecosistema cerrado en un frasco de vidrio demuestra ciclos biogeoquimicos, cadenas alimenticias y equilibrio ecologico mejor que cualquier diagrama del libro." },
          { "icon": "💗", "t": "El cuerpo humano como laboratorio", "d": "Medir frecuencia cardiaca antes y despues de ejercicio. Observar la respiracion. Calcular tiempos de reaccion. El cuerpo del estudiante es el mejor instrumento del laboratorio." }
        ]
      },
      {
        "type": "quote",
        "text": "Cada vez que un nino toca una hoja, huele una flor o atrapa un insecto, esta haciendo biologia. El aula solo necesita conectar esa experiencia con el lenguaje cientifico.",
        "author": "E.O. Wilson, biologo"
      },
      {
        "type": "reveal",
        "title": "Errores conceptuales comunes en biologia escolar",
        "label": "Ver errores frecuentes",
        "openLabel": "Cerrar errores",
        "icon": "🧬",
        "items": [
          { "t": "Evolucion como progreso lineal", "d": "Los estudiantes creen que las especies evolucionan porque quieren adaptarse. La evolucion no tiene proposito ni direccion: es seleccion natural sobre variacion aleatoria." },
          { "t": "La fotosintesis produce oxigeno como producto principal", "d": "El oxigeno es un subproducto. El objetivo de la fotosintesis es producir glucosa. El oxigeno sale del agua, no del CO2." },
          { "t": "Los virus son seres vivos", "d": "Debatir si los virus son seres vivos o no es un excelente punto de entrada para discutir las caracteristicas de la vida. No hay una respuesta unica correcta." }
        ],
        "text": "Conocer las ideas previas de tus estudiantes te permite anticiparlas en el diseno de la clase."
      }
    ]$j3$::jsonb
  );

  -- MODULO 4 (challenge empathy) — Mapa de Curiosidades
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Mapa de Curiosidades',
    'Reto 2 — Empatia con el Estudiante',
    'Construye el mapa de empatia de un estudiante de grado 6 que cree que las ciencias son aburridas.',
    'challenge', 'empathy', 4, 150, true, null,
    'Antes de cambiar lo que un estudiante piensa de las ciencias, necesitas entender por que piensa lo que piensa.',
    $j4${
      "empathyCards": [
        { "id": 1, "text": "Cree que las ciencias son solo copiar definiciones del tablero", "correct": "piensa" },
        { "id": 2, "text": "Piensa que los experimentos son cosa de cientificos, no de el", "correct": "piensa" },
        { "id": 3, "text": "Se aburre cuando la clase es solo dictado y transcripcion", "correct": "siente" },
        { "id": 4, "text": "Se emociona cuando ve un video de animales o del espacio", "correct": "siente" },
        { "id": 5, "text": "Dice: para que estudio esto si nunca lo voy a usar?", "correct": "dice" },
        { "id": 6, "text": "Pregunta cosas raras: por que el cielo es azul, por que flotamos en el agua", "correct": "dice" },
        { "id": 7, "text": "Mira videos de experimentos caseros en su tiempo libre", "correct": "hace" },
        { "id": 8, "text": "Se distrae y juega cuando la clase no lo involucra", "correct": "hace" }
      ]
    }$j4$::jsonb
  );

  -- MODULO 5 (lesson) — Quimica sin Fobias
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Quimica sin Fobias',
    'Modulo 3 — La Materia que nos Rodea',
    'La quimica esta en la cocina, los cosmeticos, el agua y el aire: solo hay que aprender a verla.',
    'lesson', 5, 130, true, null,
    'La quimica no esta en los libros. Esta en tu cocina, en tu cuerpo, en el cielo. Aprende a verla ahi primero.',
    $j5$[
      {
        "type": "intro",
        "title": "Por que la quimica genera tanto rechazo y como cambiarlo",
        "text": "La quimica tiene mala reputacion en el aula: formulas que no tienen sentido, balanceo de ecuaciones sin contexto, y una nomenclatura que parece disenada para excluir. Pero la quimica esta en todo: en la cocina, en los cosmeticos, en el agua que tomamos, en el aire que respiramos."
      },
      {
        "type": "steps",
        "title": "Tres puertas de entrada a la quimica",
        "items": [
          { "icon": "🍳", "t": "La cocina como laboratorio", "d": "La coccion de un huevo es desnaturalizacion de proteinas. El bizcocho que sube es una reaccion quimica (bicarbonato + acido). La caramelizacion del azucar es quimica organica en tiempo real." },
          { "icon": "💊", "t": "Medicamentos y quimica de la vida", "d": "La aspirina, el ibuprofeno, los antihistaminicos: todos son moleculas. Entender que son compuestos quimicos con estructuras especificas desmitifica la quimica y la hace relevante." },
          { "icon": "🌊", "t": "El agua: la molecula mas importante", "d": "H2O como punto de entrada a la quimica: polaridad, puentes de hidrogeno, tension superficial, disolucion. Una molecula, infinitas conexiones con la vida cotidiana." }
        ]
      },
      {
        "type": "image",
        "title": "La molecula de agua",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Water_molecule_3D.svg/800px-Water_molecule_3D.svg.png",
        "caption": "La molecula de agua: ejemplo perfecto de como la estructura determina las propiedades."
      },
      {
        "type": "quote",
        "text": "No ensenes quimica como si fuera un idioma muerto. Ensenala como el lenguaje secreto de todo lo que existe.",
        "author": "Marie Curie, quimica y fisica"
      },
      {
        "type": "reveal",
        "title": "Experimentos de bajo costo, alto impacto",
        "label": "Ver experimentos sencillos",
        "openLabel": "Cerrar experimentos",
        "icon": "⚗️",
        "items": [
          { "t": "Columna de densidades", "d": "Aceite, agua y jarabe de maiz en un vaso. Introduce objetos y predice donde flotaran. Introduce densidad, polaridad y mezclas de forma visual e inolvidable." },
          { "t": "Indicador de col morada", "d": "La col morada hervida sirve como indicador de pH. Prueba con limon, bicarbonato, jabon y agua. Toda la quimica de acidos y bases con ingredientes de cocina." },
          { "t": "Polimeros con borax", "d": "Mezcla de pega blanca y borax crea un polimero no-newtoniano. Los estudiantes hacen ciencia de materiales con las manos." }
        ],
        "text": "Demostraciones que generan asombro sin necesidad de laboratorio equipado."
      }
    ]$j5$::jsonb
  );

  -- MODULO 6 (challenge simulation) — Disena tu Experimento
  -- Nota: el frontend renderiza una simulacion pedagogica generica (SIM_TREE).
  -- El contenido de challenge_data se conserva para uso futuro pero hoy se ignora.
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Disena tu Experimento',
    'Reto 3 — Decisiones Pedagogicas',
    'Toma decisiones de diseno para una unidad sobre cambio climatico y observa su impacto.',
    'challenge', 'simulation', 6, 200, true, null,
    'Las mejores decisiones pedagogicas convierten el aula en un laboratorio de pensamiento critico.',
    $j6${
      "simContext": "Eres docente de ciencias naturales en grado 8. Vas a disenar una unidad sobre cambio climatico y debes tomar decisiones sobre como abordarlo en el aula.",
      "steps": [
        {
          "prompt": "Como introduces el tema de cambio climatico con tus estudiantes?",
          "options": [
            { "text": "Explico el efecto invernadero con el diagrama del libro y dicto apuntes sobre las consecuencias", "outcome": "Los estudiantes copian informacion pero no la conectan con su vida. El tema se siente lejano.", "score": 1 },
            { "text": "Muestro noticias recientes de fenomenos climaticos extremos en Colombia y pregunto: que han notado en su region?", "outcome": "El tema se vuelve local y personal. Conectan la ciencia con su experiencia directa.", "score": 3 },
            { "text": "Presento un documental sobre el Artico y el derretimiento de los glaciares", "outcome": "Visualmente impactante pero sigue siendo lejano. Falta la conexion local.", "score": 2 }
          ]
        },
        {
          "prompt": "Un estudiante dice: el cambio climatico no existe, lo invento la ciencia para asustar. Como respondes?",
          "options": [
            { "text": "Le corrijo directamente: el cambio climatico es real y hay consenso cientifico", "outcome": "Correcto en contenido, pero puede generar resistencia si lo siente como ataque.", "score": 1 },
            { "text": "Le pregunto: de donde viene esa informacion? Como podriamos verificarla? Que evidencia cambiaria tu opinion?", "outcome": "Convierte la negacion en una leccion de pensamiento critico y evaluacion de fuentes.", "score": 3 },
            { "text": "Lo ignoro para no interrumpir y sigo con el tema", "outcome": "La oportunidad de aprendizaje se pierde. Aprenden que sus preguntas no importan.", "score": 0 }
          ]
        },
        {
          "prompt": "Como evaluaras lo que aprendieron sobre cambio climatico?",
          "options": [
            { "text": "Examen escrito sobre causas, consecuencias y soluciones", "outcome": "Evalua memoria y comprension basica. No muestra si pueden aplicar el conocimiento.", "score": 1 },
            { "text": "Disenan una campana de concientizacion para la comunidad escolar basada en evidencia", "outcome": "Aplica conocimiento, desarrolla comunicacion cientifica y tiene impacto real.", "score": 3 },
            { "text": "Cada grupo investiga una solucion tecnologica y la presenta al salon", "outcome": "Desarrolla investigacion y comunicacion. Buen balance.", "score": 2 }
          ]
        }
      ]
    }$j6$::jsonb
  );

  -- MODULO 7 (lesson) — Fisica: el Arte de Entender el Movimiento
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line, content)
  VALUES (
    v_course_id,
    'Fisica: el Arte de Entender el Movimiento',
    'Modulo 4 — Fuerzas y Energia',
    'La fisica esta en cada cosa que se mueve, cada luz que prende y cada sonido que se escucha.',
    'lesson', 7, 130, true, null,
    'La fisica no se entiende leyendo: se entiende sintiendo. Mueve algo, lanza algo. Eso es fisica.',
    $j7$[
      {
        "type": "intro",
        "title": "Fisica sin ecuaciones vacias: el movimiento que se siente",
        "text": "La fisica es la ciencia que mas miedo genera. Las ecuaciones parecen imposibles, los problemas parecen trampas, y la conexion con la vida cotidiana parece inexistente. Pero la fisica esta en cada cosa que se mueve, en cada luz que prende, en cada sonido que se escucha."
      },
      {
        "type": "steps",
        "title": "Tres formas de sentir la fisica",
        "items": [
          { "icon": "🎯", "t": "Las leyes de Newton en el cuerpo", "d": "Sentir la inercia: ponerse de pie rapidamente en un bus. Sentir la fuerza de reaccion: empujar una pared. El cuerpo es el laboratorio de Newton. Primero vivir, luego formalizar." },
          { "icon": "⚡", "t": "Electricidad en la vida real", "d": "Por que se pega la ropa en el secador? Por que el relampago busca los arboles? La electrostatica como puerta de entrada a los circuitos." },
          { "icon": "🎵", "t": "El sonido que se ve", "d": "Sal en un parlante vibrando. Arena en un plato metalico resonante (figuras de Chladni). El sonido como onda visible convierte el concepto abstracto en experiencia directa." }
        ]
      },
      {
        "type": "quote",
        "text": "Si no puedes explicarlo de forma sencilla, es que no lo entiendes suficientemente bien.",
        "author": "Richard Feynman, fisico"
      },
      {
        "type": "reveal",
        "title": "Actividades de fisica sin equipos costosos",
        "label": "Ver actividades de bajo costo",
        "openLabel": "Cerrar actividades",
        "icon": "🚀",
        "items": [
          { "t": "Rampa de canicas", "d": "Cartulina y canicas para investigar velocidad, aceleracion y friccion. Variables controlables, resultados medibles, matematica emergente." },
          { "t": "Puente de espagueti", "d": "Disenar el puente mas resistente con spaghetti crudo y malvaviscos. Ingenieria, fuerzas y trabajo en equipo en 45 minutos." },
          { "t": "Cohete de agua", "d": "Botella de plastico con agua y aire a presion. Tercera ley de Newton en accion. Los estudiantes disenan, prueban, fallan y mejoran." }
        ],
        "text": "La fisica experimental no necesita laboratorio equipado: necesita creatividad."
      }
    ]$j7$::jsonb
  );

  -- MODULO 8 (challenge matching) — Fenomenos y Principios
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, challenge_type, "order", xp, is_enabled, area_id, character_line, challenge_data)
  VALUES (
    v_course_id,
    'Fenomenos y Principios',
    'Reto 4 — Ciencia Cotidiana',
    'Conecta cada fenomeno cotidiano con el principio cientifico que lo explica.',
    'challenge', 'matching', 8, 150, true, null,
    'Cada fenomeno que ves tiene una explicacion cientifica. Quien aprende a conectarlos, aprende a leer el universo.',
    $j8${
      "matchPairs": [
        { "id": 1, "concept": "Un cubo de hielo se derrite en la mano", "def": "Transferencia de calor y cambio de estado de la materia" },
        { "id": 2, "concept": "El arcoiris aparece despues de la lluvia", "def": "Refraccion y dispersion de la luz blanca en el agua" },
        { "id": 3, "concept": "Un barco de acero flota pero una bola de acero se hunde", "def": "Principio de Arquimedes: densidad media del objeto respecto al fluido" },
        { "id": 4, "concept": "Las plantas se doblan hacia la ventana con luz", "def": "Fototropismo: respuesta de las plantas al estimulo luminoso" },
        { "id": 5, "concept": "La leche se corta al anadir limon", "def": "Desnaturalizacion de proteinas por cambio de pH (reaccion acido-base)" },
        { "id": 6, "concept": "El globo se pega a la pared tras frotarlo en el cabello", "def": "Electricidad estatica: transferencia de electrones por friccion" }
      ]
    }$j8$::jsonb
  );

  -- MODULO 9 (final_delivery) — El Gran Experimento
  INSERT INTO public.course_modules
    (course_id, title, subtitle, description, type, "order", xp, is_enabled, area_id, character_line)
  VALUES (
    v_course_id,
    'El Gran Experimento',
    'Entrega Final — Laboratorio',
    'Disena la experiencia cientifica que transformara el aula de tus estudiantes y entrega tu propuesta.',
    'final_delivery', 9, 300, true, null,
    'Has llegado al final del laboratorio. El gran experimento no esta en el tubo de ensayo: esta en el diseno de tu clase.'
  );

  RAISE NOTICE '9 modulos del curso Laboratorio de Ciencias Naturales insertados correctamente.';

END $$;
