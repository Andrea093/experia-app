-- ============================================================
-- 0067_replicar_ciencias.sql
-- Ciencias Naturales: llena con contenido real 3 de los 5 módulos "Pendiente" del curso
-- "Laboratorio de Ciencias Naturales — Versión 1" (4d2af3cd-767e-4e14-a364-23fd596ada10),
-- igual que 0064 en Matemáticas:
--
--   Apertura            -> banco de actividades rompehielo
--   Estructura Saber    -> estructura de la Prueba Saber del área
--   Pausa activa        -> banco de actividades SOLO físicas
--
-- Los módulos 4 (primera ronda) y 6 (ronda final) NO se tocan: sus
-- preguntas las sube el equipo académico (oct 2026). Siguen diciendo
-- "Pendiente" hasta entonces.
-- La ruta queda con sus 7 módulos originales y NADA MÁS.
-- ⚠️ Oct 2026: se QUITÓ de este archivo (antes de correrlo) la inserción de
--    los dos retos "Pregunta en Vivo 1/2": ninguna asignatura los lleva; las
--    preguntas de la clase en vivo las sube el equipo académico desde el
--    editor de ruta. En Matemáticas, donde 0062 sí los creó, los retira 0070.
--
-- Cada UPDATE cruza por TÍTULO y exige que el módulo TODAVÍA diga
-- "Pendiente": es idempotente y no pisa una edición manual posterior.
-- Correr ANTES de 0069 (que reemplaza los bancos de apertura y pausa activa
-- por el banco nuevo con imágenes).
--
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

-- ── Módulo 1: Encender el laboratorio — banco de actividades rompehielo ────
UPDATE public.course_modules
   SET content = $m1$[
  {"text":"00:00–00:10 · 10 min","type":"intro","title":"Encender el laboratorio"},
  {"icon":"🗣️","text":"“Encendamos el laboratorio.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad rompehielo — cognitiva o física, a elección del tutor.","type":"text","title":"Qué es este bloque"},
  {"text":"Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos. — Debe ser corta y de instrucciones simples: el grupo apenas está entrando.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades rompehielo","label":"Ver banco de actividades 🎲","openLabel":"Cerrar banco","icon":"🎲","items":[
    {"t":"Uno, dos, tres… conmigo (física, 2 min)","d":"En parejas, uno hace un gesto simple (aplaudir, chasquear, saltar) y el otro lo repite lo más rápido posible; cada 3 rondas cambian de pareja. Sirve para activar el cuerpo sin necesitar espacio ni materiales."},
    {"t":"La palabra encadenada (cognitiva, 3 min)","d":"En círculo, cada persona dice una palabra relacionada con ciencias naturales que empiece con la última letra de la palabra anterior (ej. 'célula' → 'átomo' → 'oxígeno'). Quien se demore más de 5 segundos o repita una palabra sigue en el juego, pero propone la siguiente categoría."},
    {"t":"Sondeo rápido de manos (cognitiva/social, 2 min)","d":"El tutor lanza preguntas rápidas de sí o no relacionadas con la sesión ('¿quién ya presentó la Prueba Saber?', '¿a quién le gusta más la biología que la física?') y el grupo responde levantando la mano. Sin materiales, ideal para grupos grandes."},
    {"t":"Espejo en parejas (física, 3 min)","d":"En parejas, uno hace movimientos lentos con brazos y manos mientras el otro los imita como un espejo; a la mitad del tiempo intercambian el rol de quien dirige. Ayuda a bajar la tensión inicial con humor."},
    {"t":"Bingo de presentación express (cognitiva/social, 5 min)","d":"Se reparte una cuadrícula con frases cortas ('le gusta la química', 'ha enseñado más de 10 años', 'prefiere la biología'); cada quien debe conseguir la firma de un colega distinto por cada casilla que le aplique. Gana quien complete una línea primero. Requiere imprimir la cuadrícula con anticipación."}
  ]}
]$m1$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Encender el laboratorio'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 2: Protocolo del experimento — estructura de la Prueba Saber ────
UPDATE public.course_modules
   SET content = $m2$[
  {"text":"00:10–00:25 · 15 min","type":"intro","title":"Protocolo del experimento"},
  {"icon":"🗣️","text":"“Antes de experimentar, el protocolo del experimento.”","type":"callout","title":"Frase de apertura"},
  {"text":"Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.","type":"text","title":"Qué es este bloque"},
  {"text":"Se apoya en el material único del área, distribuido aparte. — Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.","type":"text","title":"Cómo ejecutarlo"},
  {"text":"Antes de practicar con las preguntas de las siguientes rondas, conviene que el grupo reconozca cómo está armada la prueba real — así entienden qué se les va a exigir y por qué las preguntas se sienten como se sienten.","type":"text","title":"Antes de empezar"},
  {"type":"steps","title":"Estructura de la Prueba Saber — Ciencias Naturales","items":[
    {"icon":"📝","t":"Formato de las preguntas","d":"Selección múltiple con única respuesta, cuatro opciones marcadas A, B, C y D, frecuentemente a partir de una situación experimental, gráfico o tabla de datos. No hay penalización por responder incorrectamente, así que siempre conviene marcar una opción aunque haya duda."},
    {"icon":"🧠","t":"Competencias evaluadas","d":"Las preguntas se agrupan en tres competencias: uso comprensivo del conocimiento científico (aplicar conceptos de física, química y biología), explicación de fenómenos (dar razones de por qué ocurre algo), e indagación (interpretar datos, gráficas y diseños experimentales)."},
    {"icon":"🔬","t":"Áreas que integra","d":"La prueba combina preguntas de física, química y biología, muchas veces conectadas mediante una misma situación o experimento — no se evalúan las tres áreas por separado, sino de forma integrada."},
    {"icon":"📊","t":"Cómo se califica","d":"El puntaje NO es un simple porcentaje de aciertos: se calcula con un modelo estadístico (Teoría de Respuesta al Ítem) que pondera la dificultad de cada pregunta, y se reporta en una escala de 0 a 100. Por eso dos personas con el mismo número de aciertos pueden obtener puntajes distintos si acertaron preguntas de diferente dificultad."}
  ]}
]$m2$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Protocolo del experimento'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;

-- ── Módulo 5: Pausa activa en el laboratorio — banco SOLO físicas ─────────
UPDATE public.course_modules
   SET content = $m5$[
  {"text":"01:10–01:20 · 10 min","type":"intro","title":"Pausa activa en el laboratorio"},
  {"icon":"🗣️","text":"“Pausa activa en el laboratorio.”","type":"callout","title":"Frase de apertura"},
  {"text":"Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.","type":"text","title":"Qué es este bloque"},
  {"text":"A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio. — Sirve de puente antes del bloque más largo y exigente de la sesión.","type":"text","title":"Cómo ejecutarlo"},
  {"type":"reveal","title":"Banco de actividades físicas","label":"Ver banco de actividades 🤸","openLabel":"Cerrar banco","icon":"🤸","items":[
    {"t":"Estiramiento guiado de pie (2 min)","d":"De pie junto a su puesto, el grupo sigue una secuencia corta guiada por el tutor: brazos arriba, giro de hombros, estiramiento lateral del cuello. No requiere materiales ni espacio adicional."},
    {"t":"El barco se hunde (4 min)","d":"El tutor da instrucciones tipo 'formen grupos de 3' o 'toquen algo de color azul' y el grupo debe moverse rápido para cumplirlas; quien se quede sin grupo o sin tocar el objeto sigue jugando proponiendo la siguiente instrucción. Clásico energizante que solo necesita espacio para moverse."},
    {"t":"Simón dice (3 min)","d":"El tutor da órdenes de movimiento ('salten', 'toquen su cabeza') pero el grupo solo debe obedecer si la orden empieza con 'Simón dice'; quien se equivoque da una palmada y sigue en el juego. Ritmo rápido, ideal para recuperar energía."},
    {"t":"Caminata cruzada (2 min)","d":"De pie, cada persona toca su rodilla derecha con la mano izquierda y luego la rodilla izquierda con la mano derecha, repitiendo el patrón por unos 20 segundos. Es un ejercicio de coordinación cruzada que ayuda a reactivar la atención sin necesitar espacio."}
  ]}
]$m5$::jsonb
 WHERE course_id = '4d2af3cd-767e-4e14-a364-23fd596ada10'
   AND title = 'Pausa activa en el laboratorio'
   AND content @> '[{"title":"Pendiente"}]'::jsonb;
