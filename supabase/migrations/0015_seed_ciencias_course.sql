-- ============================================================
-- 0015_seed_ciencias_course.sql
-- Crea el curso "Laboratorio de Ciencias Naturales" con tema lab
-- y siembra los 9 modulos de formacion docente en ciencias.
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

  -- MODULO 1: Lesson — El Metodo Cientifico como Metodologia de Ensenanza
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_m1', v_course_id,
    'El Metodo Cientifico en el Aula',
    'lesson', 100,
    '{"x":62}'::jsonb,
    '[]'::jsonb,
    $j1${
      "sections": [
        {
          "type": "heading",
          "text": "Ciencia que se vive, no ciencia que se memoriza"
        },
        {
          "type": "text",
          "text": "La gran paradoja de la ensenanza de ciencias: estudiantes que memorizan definiciones de osmosis, fotosintesis y celula procariota... pero que nunca han observado realmente la naturaleza. El Diseno Centrado en la Experiencia propone invertir ese proceso."
        },
        {
          "type": "quote",
          "text": "La ciencia no es un conjunto de hechos. Es una manera de pensar: escepctica, curiosa, dispuesta a cambiar de opinion ante la evidencia.",
          "author": "Carl Sagan, astrónomo"
        },
        {
          "type": "heading",
          "text": "El ciclo del pensamiento cientifico"
        },
        {
          "type": "steps",
          "items": [
            { "icon": "👁️", "title": "Observar", "text": "Prestar atencion al mundo con todos los sentidos. Registrar sin juzgar. La observacion sistematica es una habilidad que se aprende." },
            { "icon": "❓", "title": "Preguntar", "text": "Formular preguntas investigables: que tienen respuesta observable o medible. Diferencia entre pregunta filosofica y cientifica." },
            { "icon": "💡", "title": "Hipotetizar", "text": "Proponer una explicacion provisional y verificable. No es adivinar: es razonar a partir de lo que ya se sabe." },
            { "icon": "🔬", "title": "Experimentar", "text": "Disenar una prueba justa que aisle las variables. Control vs. experimental. La raiz de la credibilidad cientifica." },
            { "icon": "📊", "title": "Analizar y concluir", "text": "Interpretar datos con honestidad. Aceptar cuando la evidencia contradice la hipotesis. Eso tambien es ciencia." }
          ]
        },
        {
          "type": "reveal",
          "title": "Ciencia cotidiana vs. ciencia escolar: la gran brecha",
          "text": "Analiza estas diferencias y reflexiona sobre tu practica actual.",
          "items": [
            { "title": "Ciencia real", "desc": "Parte de preguntas genuinas. Los errores son datos. Las conclusiones son provisionales. El proceso importa tanto como el resultado." },
            { "title": "Ciencia escolar tradicional", "desc": "Parte de definiciones a memorizar. Los errores son fracasos. Las conclusiones ya estan en el libro. El resultado importa mas que el proceso." },
            { "title": "Ciencia escolar DCE", "desc": "Parte de fenomenos reales y preguntas de los estudiantes. Los errores revelan pensamiento. El proceso de investigacion es el aprendizaje mismo." }
          ]
        }
      ]
    }$j1$::jsonb,
    'La ciencia empieza con asombro. Si tu clase no genera asombro, algo falta en el diseno.'
  );

  -- MODULO 2: Challenge dragdrop — Orden del Protocolo
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_c1', v_course_id,
    'Orden del Protocolo',
    'challenge', 150,
    '{"x":38}'::jsonb,
    '["cien_m1"]'::jsonb,
    $j2${
      "ctype": "drag-drop",
      "instructions": "Un grupo de estudiantes quiere investigar si las plantas crecen mas rapido con musica. Ordena los pasos de su investigacion en la secuencia correcta del metodo cientifico.",
      "phrases": [
        "Observar que las plantas de la casa de la abuela parecen mas saludables porque ella les habla",
        "Formular la pregunta: la musica clasica hace crecer mas rapido a las plantas?",
        "Hipotetizar: las plantas expuestas a musica clasica crecen un 20% mas que las plantas en silencio",
        "Disenar el experimento con grupo control (silencio) y grupo experimental (musica clasica), misma especie y condiciones",
        "Medir el crecimiento de ambos grupos durante 4 semanas y registrar los datos",
        "Analizar los datos y concluir si la hipotesis se confirma, se rechaza o se necesita mas informacion"
      ]
    }$j2$::jsonb,
    'Un protocolo bien ordenado es la diferencia entre un experimento y una ocurrencia. Demuestra que sabes la diferencia.'
  );

  -- MODULO 3: Lesson — Biologia: Celula, Ecosistemas y Cuerpo Humano
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_m2', v_course_id,
    'Biologia que Conecta con la Vida',
    'lesson', 120,
    '{"x":65}'::jsonb,
    '["cien_c1"]'::jsonb,
    $j3${
      "sections": [
        {
          "type": "heading",
          "text": "Ensenando biologia desde el asombro y la conexion"
        },
        {
          "type": "text",
          "text": "La biologia estudia la vida. Y los estudiantes son vida. Entonces, la biologia deberia ser la asignatura mas personal y relevante de todas. El reto del docente es tender ese puente: desde los conceptos abstractos hasta la experiencia corporal y cotidiana."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "🦠", "title": "La celula como ciudad", "text": "La analogia funciona porque los estudiantes ya conocen ciudades. El nucleo como alcaldia, las mitocondrias como plantas de energia, la membrana como muralla. Las analogias movilizan el conocimiento previo." },
            { "icon": "🌿", "title": "Ecosistema en un frasco", "text": "Un ecosistema cerrado en un frasco de vidrio demuestra ciclos biogeoquimicos, cadenas alimenticias y equilibrio ecologico mejor que cualquier diagrama del libro." },
            { "icon": "💗", "title": "El cuerpo humano como laboratorio", "text": "Medir frecuencia cardiaca antes y despues de ejercicio. Observar la respiracion. Calcular tiempos de reaccion. El cuerpo del estudiante es el mejor instrumento del laboratorio." }
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
          "text": "Conocer las misconceptions de tus estudiantes te permite anticiparlas en el diseno de la clase.",
          "items": [
            { "title": "Evolucion como progreso lineal", "desc": "Los estudiantes creen que las especies evolucionan porque quieren adaptarse. La evolucion no tiene proposito ni direccion: es seleccion natural sobre variacion aleatoria." },
            { "title": "La fotosintesis produce oxigeno como producto principal", "desc": "El oxigeno es un subproducto. El objetivo de la fotosintesis es producir glucosa. El oxigeno sale del agua, no del CO2." },
            { "title": "Los virus son seres vivos", "desc": "Debatir si los virus son seres vivos o no es un excelente punto de entrada para discutir las caracteristicas de la vida. No hay una respuesta unica correcta." }
          ]
        }
      ]
    }$j3$::jsonb,
    'La biologia estudia la vida. Y tus estudiantes son vida. No necesitas ir lejos para encontrar el laboratorio.'
  );

  -- MODULO 4: Challenge empathy — Mapa de Curiosidades
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_c2', v_course_id,
    'Mapa de Curiosidades',
    'challenge', 150,
    '{"x":35}'::jsonb,
    '["cien_m2"]'::jsonb,
    $j4${
      "ctype": "empathy",
      "persona": "Un estudiante de grado 6 que dice que las ciencias naturales son aburridas porque solo es copiar del tablero",
      "instructions": "Construye el mapa de empatia de este estudiante. Identifica lo que piensa, siente, hace y dice para disenar una clase que cambie su percepcion."
    }$j4$::jsonb,
    'Antes de cambiar lo que un estudiante piensa de las ciencias, necesitas entender por que piensa lo que piensa.'
  );

  -- MODULO 5: Lesson — Quimica Conceptual: La Materia que nos Rodea
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_m3', v_course_id,
    'Quimica sin Fobias',
    'lesson', 130,
    '{"x":63}'::jsonb,
    '["cien_c2"]'::jsonb,
    $j5${
      "sections": [
        {
          "type": "heading",
          "text": "Por que la quimica genera tanto rechazo y como cambiarlo"
        },
        {
          "type": "text",
          "text": "La quimica tiene mala reputacion en el aula: formulas que no tienen sentido, balanceo de ecuaciones sin contexto, y una nomenclatura que parece diseada para excluir. Pero la quimica esta en todo: en la cocina, en los cosmeticos, en el agua que tomamos, en el aire que respiramos."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "🍳", "title": "La cocina como laboratorio de quimica", "text": "La coccion de un huevo es desnaturalizacion de proteinas. El bizcocho que sube es una reaccion quimica (bicarbonato + acido). La caramelizacion del azucar es quimica organica en tiempo real." },
            { "icon": "💊", "title": "Medicamentos y quimica de la vida", "text": "La aspirina, el ibuprofeno, los antihistaminicos: todos son moleculas. Entender que son compuestos quimicos con estructuras especificas desmitifica la quimica y la hace relevante." },
            { "icon": "🌊", "title": "El agua: la molecula mas importante", "text": "H2O como punto de entrada a la quimica: polaridad, puentes de hidrogeno, tension superficial, disolucion. Una molecula, infinitas conexiones con la vida cotidiana." }
          ]
        },
        {
          "type": "image",
          "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Water_molecule_3D.svg/800px-Water_molecule_3D.svg.png",
          "alt": "Molecula de agua H2O en 3D",
          "caption": "La molecula de agua: ejemplo perfecto de como la estructura determina las propiedades."
        },
        {
          "type": "quote",
          "text": "No ensenes quimica como si fuera un idioma muerto. Ensanala como el lenguaje secreto de todo lo que existe.",
          "author": "Marie Curie, quimica y fisica"
        },
        {
          "type": "reveal",
          "title": "Experimentos de bajo costo, alto impacto",
          "text": "Demostraciones que generan asombro sin necesidad de laboratorio equipado.",
          "items": [
            { "title": "Columna de densidades", "desc": "Aceite, agua y jarabe de maiz en un vaso. Introduce objetos y predice donde flotaran. Introduce densidad, polaridad y mezclas de forma visual e inolvidable." },
            { "title": "Indicador de col morada", "desc": "La col morada hervida sirve como indicador pH. Prueba con limon, bicarbonato, jabon y agua. Toda la quimica de acidos y bases con ingredientes de cocina." },
            { "title": "Polimeros con borax", "desc": "Mezcla de pega blanca y borax crea un polimero no-newtoniano. Los estudiantes hacen ciencia de materiales con las manos." }
          ]
        }
      ]
    }$j5$::jsonb,
    'La quimica no esta en los libros. Esta en tu cocina, en tu cuerpo, en el cielo. Aprende a verla ahi primero.'
  );

  -- MODULO 6: Challenge simulation — Disena tu Experimento
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_c3', v_course_id,
    'Disena tu Experimento',
    'challenge', 200,
    '{"x":37}'::jsonb,
    '["cien_m3"]'::jsonb,
    $j6${
      "ctype": "simulation",
      "context": "Eres docente de ciencias naturales en grado 8. Vas a disenar una unidad sobre cambio climatico. Debes tomar decisiones sobre como abordarlo en el aula.",
      "steps": [
        {
          "prompt": "Como introduces el tema de cambio climatico con tus estudiantes?",
          "options": [
            { "text": "Explico las causas del efecto invernadero con el diagrama del libro y dicto apuntes sobre las consecuencias", "outcome": "Los estudiantes copian informacion pero no la conectan con su vida. El tema se siente lejano y abstracto.", "score": 1 },
            { "text": "Muestro noticias recientes de fenomenos climaticos extremos en Colombia y pregunto: ustedes que han notado en su ciudad o region?", "outcome": "El tema se vuelve local y personal. Los estudiantes conectan la ciencia con su experiencia directa.", "score": 3 },
            { "text": "Presento un documental sobre el Artico y el derretimiento de los glaciares", "outcome": "Visualmente impactante pero sigue siendo lejano. Mejor que el libro, pero falta la conexion local.", "score": 2 }
          ]
        },
        {
          "prompt": "Un estudiante dice: el cambio climatico no existe, lo invento la ciencia para asustar a la gente. Como respondes?",
          "options": [
            { "text": "Le corrijo directamente: el cambio climatico es real y hay consenso cientifico", "outcome": "Correcto en contenido, pero puede generar resistencia si el estudiante lo siente como ataque. Pierde la oportunidad pedagogica.", "score": 1 },
            { "text": "Le pregunto: de donde viene esa informacion? Como podriamos verificarla? Que evidencia necesitariamos para cambiar de opinion?", "outcome": "Convierte la negacion en una leccion de pensamiento critico y evaluacion de fuentes. Aprendizaje cientifico en accion.", "score": 3 },
            { "text": "Lo ignoro para no interrumpir la clase y sigo con el tema", "outcome": "La oportunidad de aprendizaje se pierde. El estudiante y sus companeros aprenden que sus preguntas no importan.", "score": 0 }
          ]
        },
        {
          "prompt": "Como evaluaras lo que aprendieron sobre cambio climatico?",
          "options": [
            { "text": "Examen escrito con preguntas sobre causas, consecuencias y soluciones del cambio climatico", "outcome": "Evalua memoria y comprension basica. No muestra si el estudiante puede aplicar el conocimiento.", "score": 1 },
            { "text": "Los estudiantes disenan una campana de concientizacion para la comunidad escolar basada en evidencia cientifica", "outcome": "Aplica conocimiento, desarrolla comunicacion cientifica y tiene impacto real. Evaluacion autentica.", "score": 3 },
            { "text": "Cada grupo investiga una solucion tecnologica al cambio climatico y la presenta al salon", "outcome": "Desarrolla investigacion y comunicacion. Buen balance entre conocimiento y aplicacion.", "score": 2 }
          ]
        }
      ]
    }$j6$::jsonb,
    'Las mejores decisiones pedagogicas convierten el aula en un laboratorio de pensamiento critico.'
  );

  -- MODULO 7: Lesson — Fisica: Fuerzas, Energia y el Mundo que se Mueve
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_m4', v_course_id,
    'Fisica: el Arte de Entender el Movimiento',
    'lesson', 130,
    '{"x":64}'::jsonb,
    '["cien_c3"]'::jsonb,
    $j7${
      "sections": [
        {
          "type": "heading",
          "text": "Fisica sin ecuaciones vacias: el movimiento que se siente"
        },
        {
          "type": "text",
          "text": "La fisica es la ciencia que mas miedo genera. Las ecuaciones parecen imposibles, los problemas parecen trampas, y la conexion con la vida cotidiana parece inexistente. Pero la fisica esta en cada cosa que se mueve, en cada luz que prende, en cada sonido que se escucha."
        },
        {
          "type": "steps",
          "items": [
            { "icon": "🎯", "title": "Las leyes de Newton en el cuerpo", "text": "Sentir la inercia: ponerse de pie rapidamente en un bus. Sentir la fuerza de reaccion: empujar una pared. El cuerpo es el laboratorio de Newton. Primero vivir, luego formalizar." },
            { "icon": "⚡", "title": "Electricidad en la vida real", "text": "Por que se pega la ropa en el secador? Por que el relampago busca los arboles? Por que es peligroso cargar el celular en la tina? La electrostatica como puerta de entrada a los circuitos." },
            { "icon": "🎵", "title": "El sonido que se ve", "text": "Sal en un parlante vibrando. Arena en un plato metalico resonante (figuras de Chladni). El sonido como onda visible convierte el concepto abstracto en experiencia directa e inolvidable." }
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
          "text": "La fisica experimental no necesita laboratorio equipado: necesita creatividad.",
          "items": [
            { "title": "Rampa de canicas", "desc": "Cartulina y canicas para investigar velocidad, aceleracion y friccion. Variables controlables, resultados medibles, matematica emergente." },
            { "title": "Puente de espagueti", "desc": "Disenar el puente mas resistente con spaghetti crudo y marshmallows. Ingenieria, fuerzas y trabajo en equipo en 45 minutos." },
            { "title": "Cohete de agua", "desc": "Botella de plastico con agua y aire a presion. Tercera ley de Newton en accion. Los estudiantes disenan, prueban, fallan y mejoran." }
          ]
        }
      ]
    }$j7$::jsonb,
    'La fisica no se entiende leyendo: se entiende sintiendo. Mueve algo, rompe algo, lanza algo. Eso es fisica.'
  );

  -- MODULO 8: Challenge matching — Fenomenos y Principios
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_c4', v_course_id,
    'Fenomenos y Principios',
    'challenge', 150,
    '{"x":36}'::jsonb,
    '["cien_m4"]'::jsonb,
    $j8${
      "ctype": "matching",
      "instructions": "Conecta cada fenomeno cotidiano con el principio cientifico que lo explica. Cada conexion correcta activa el analizador del laboratorio.",
      "pairs": [
        { "concept": "Un cubo de hielo se derrite en la mano", "match": "Transferencia de calor y cambio de estado de la materia" },
        { "concept": "El arcoiris aparece despues de la lluvia", "match": "Refraccion y dispersion de la luz blanca en el agua" },
        { "concept": "Un barco de acero flota pero una pelota de acero se hunde", "match": "Principio de Arquimedes: la densidad media del objeto respecto al fluido" },
        { "concept": "Las plantas se doblan hacia la ventana con luz", "match": "Fototropismo: respuesta de las plantas al estimulo luminoso" },
        { "concept": "La leche se corta al anadir limon", "match": "Desnaturalizacion de proteinas por cambio de pH (reaccion acido-base)" },
        { "concept": "El globo se pega a la pared despues de frotarlo en el cabello", "match": "Electricidad estatica: transferencia de electrones por friccion" },
        { "concept": "Las palomas regresan siempre al mismo lugar", "match": "Impronta y orientacion magnetica: comportamiento animal innato" }
      ]
    }$j8$::jsonb,
    'Cada fenomeno que ves tiene una explicacion cientifica. Quien aprende a conectarlos, aprende a leer el universo.'
  );

  -- MODULO 9: Final delivery — El Gran Experimento
  INSERT INTO public.course_modules
    (id, course_id, title, type, xp, pos, deps, content, character_line)
  VALUES (
    'cien_final', v_course_id,
    'El Gran Experimento',
    'final_delivery', 300,
    '{"x":50}'::jsonb,
    '["cien_c4"]'::jsonb,
    $j9${
      "instructions": "Has completado todos los experimentos del laboratorio. Ahora disenyas la experiencia cientifica que transformara el aula de tus estudiantes.",
      "rubric": [
        {
          "title": "Fenomeno de partida",
          "desc": "Elige un fenomeno natural observable en el contexto de tus estudiantes (local, cotidiano, relevante). Describe como lo introduciras en el aula para generar curiosidad genuina."
        },
        {
          "title": "Pregunta investigable",
          "desc": "Formula una pregunta cientifica que puedan investigar tus estudiantes. Debe ser verificable con recursos disponibles en la escuela o en casa."
        },
        {
          "title": "Diseno del experimento",
          "desc": "Describe el experimento que realizaran: materiales, variables (independiente, dependiente, controladas), procedimiento paso a paso y forma de registro de datos."
        },
        {
          "title": "Conexion con el curriculo",
          "desc": "Explica que concepto o estandar cientifico del grado aborda tu experimento y como lo hace de forma mas profunda que el metodo tradicional."
        },
        {
          "title": "Reflexion DCE",
          "desc": "Como aplica tu diseno los principios de Diseno Centrado en la Experiencia? Que vivira el estudiante que no podria vivir en una clase magistral?"
        }
      ]
    }$j9$::jsonb,
    'Has llegado al final del laboratorio. El gran experimento no esta en el tubo de ensayo: esta en el diseno de tu clase.'
  );

  RAISE NOTICE '9 modulos del curso Laboratorio de Ciencias Naturales insertados correctamente.';

END $$;
