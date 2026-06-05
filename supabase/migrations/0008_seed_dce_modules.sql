-- ============================================================
-- 0008: Seed de módulos del curso DCE en course_modules
-- Migra los módulos hardcodeados a la BD para hacer la ruta dinámica
-- ============================================================

-- Módulos compartidos (primeros 4 nodos, aplican a todas las áreas del DCE)
INSERT INTO public.course_modules
  (id, course_id, title, subtitle, description, type, challenge_type, "order", xp, requirements, content, challenge_data)
VALUES

-- mod1: Introducción al DCE
('10000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000001',
 'Introducción al DCE', 'Módulo 1',
 'Fundamentos del Diseño Centrado en Experiencias y su relevancia educativa.',
 'lesson', null, 1, 100, '{}',
 '[
   {"type":"intro","title":"¿Qué es el Diseño Centrado en Experiencias?","text":"El DCE sitúa la experiencia del estudiante como eje central del proceso educativo, creando momentos de aprendizaje significativos y transformadores."},
   {"type":"callout","icon":"💡","title":"Principio Fundamental","text":"Los estudiantes no solo aprenden contenidos — viven experiencias. La calidad de esas experiencias determina la profundidad del aprendizaje."},
   {"type":"concepts","title":"Pilares del DCE","items":[{"t":"Empatía","d":"Comprender las necesidades, emociones y contextos de los estudiantes."},{"t":"Co-creación","d":"Involucrar a los estudiantes como co-diseñadores de sus experiencias."},{"t":"Iteración","d":"Diseñar, probar, reflexionar y mejorar continuamente."},{"t":"Reflexión","d":"Crear espacios para dar significado a las experiencias."}]},
   {"type":"text","title":"Orígenes del DCE","text":"El DCE integra el aprendizaje experiencial de John Dewey, el Design Thinking de IDEO, y la pedagogía humanista en un marco práctico para docentes del siglo XXI."},
   {"type":"video","title":"Video introductorio: DCE en acción","desc":"Mira este video antes de continuar con el ejemplo práctico.","url":"https://www.youtube.com/watch?v=3rcULk9VLKs"},
   {"type":"compare","title":"Ejemplo Práctico — Clase de Historia","label":"Revolución Industrial","trad":"El docente expone los hechos con diapositivas y los estudiantes toman notas.","dce":"Los estudiantes recrean un taller de la época, simulan roles, debaten condiciones laborales y reflexionan sobre su impacto actual."}
 ]'::jsonb,
 '{}'::jsonb),

-- ch1: Reto Introducción
('10000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0000-000000000001',
 'Evaluación: Introducción al DCE', 'Reto',
 'Ordena las fases del DCE correctamente.',
 'challenge', 'dragdrop', 2, 150, ARRAY['10000000-0000-0000-0000-000000000001'],
 '[]'::jsonb,
 '{"dragItems":["Empatizar","Definir","Idear","Prototipar","Evaluar"]}'::jsonb),

-- mod2: Empatía Educativa
('10000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0000-000000000001',
 'Empatía Educativa', 'Módulo 2',
 'Técnicas para comprender las experiencias y emociones de los estudiantes.',
 'lesson', null, 3, 120, ARRAY['10000000-0000-0000-0000-000000000002'],
 '[
   {"type":"intro","title":"La Empatía como Competencia Docente","text":"La empatía educativa permite comprender y conectar con las experiencias y perspectivas de los estudiantes para diseñar desde esa comprensión."},
   {"type":"concepts","title":"Dimensiones de la Empatía","items":[{"t":"Cognitiva","d":"Entender cómo piensan los estudiantes y sus modelos mentales."},{"t":"Emocional","d":"Conectar con las emociones durante el aprendizaje."},{"t":"Contextual","d":"Comprender el contexto de vida y circunstancias de cada estudiante."}]},
   {"type":"callout","icon":"🗺️","title":"Mapa de Empatía","text":"Organiza lo que sabemos del estudiante en cuatro cuadrantes: piensa, siente, dice y hace."}
 ]'::jsonb,
 '{}'::jsonb),

-- ch2: Mapa de Empatía Interactivo
('10000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0000-000000000001',
 'Mapa de Empatía Interactivo', 'Reto',
 'Construye un mapa de empatía para un estudiante tipo.',
 'challenge', 'empathy', 4, 180, ARRAY['10000000-0000-0000-0000-000000000003'],
 '[]'::jsonb, '{}'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- Módulos por área (10 por cada área = 5 áreas × 5 módulos + 4 shared = 29 total)
INSERT INTO public.course_modules
  (id, course_id, title, subtitle, description, type, challenge_type, "order", xp, requirements, content, challenge_data)
VALUES

-- ===================== LECTURA CRÍTICA =====================
('10000000-0000-0000-0001-000000000001','00000000-0000-0000-0000-000000000001',
 'DCE en Lectura Crítica','Módulo 3','Diseña experiencias de lectura crítica usando el DCE.',
 'lesson',null,10,140,ARRAY['10000000-0000-0000-0000-000000000004'],
 '[{"type":"intro","title":"Lectura como Experiencia","text":"La lectura crítica no es solo decodificar texto — es vivir una experiencia cognitiva y emocional."},{"type":"concepts","title":"Estrategias DCE para Lectura","items":[{"t":"Lectura inmersiva","d":"Crear contextos que sumerjan al estudiante en el mundo del texto."},{"t":"Diálogo textual","d":"Facilitar conversaciones genuinas entre el lector y el texto."},{"t":"Análisis experiencial","d":"Conectar los textos con experiencias vividas por los estudiantes."}]},{"type":"callout","icon":"📖","title":"Clave","text":"¿Qué experiencia quiero que mis estudiantes vivan al leer este texto?"}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0001-000000000002','00000000-0000-0000-0000-000000000001',
 'Simulación: Lectura Crítica','Reto','Toma decisiones pedagógicas en Lectura Crítica.',
 'challenge','simulation',11,200,ARRAY['10000000-0000-0000-0001-000000000001'],
 '[]'::jsonb,'{"simContext":"una clase de lectura crítica sobre análisis de noticias para 10° grado"}'::jsonb),

('10000000-0000-0000-0001-000000000003','00000000-0000-0000-0000-000000000001',
 'Evaluación Experiencial en Lectura','Módulo 4','Métodos de evaluación experiencial para lectura crítica.',
 'lesson',null,12,140,ARRAY['10000000-0000-0000-0001-000000000002'],
 '[{"type":"intro","title":"Evaluar la Experiencia Lectora","text":"La evaluación en lectura crítica bajo el DCE va más allá de la comprensión literal."},{"type":"concepts","title":"Instrumentos de Evaluación","items":[{"t":"Diario de lectura reflexivo","d":"El estudiante registra sus reacciones, preguntas y conexiones con cada texto."},{"t":"Debate argumentativo","d":"Evaluación oral donde el estudiante defiende interpretaciones con evidencia textual."},{"t":"Portfolio de análisis","d":"Colección de análisis que muestra la evolución del pensamiento crítico."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0001-000000000004','00000000-0000-0000-0000-000000000001',
 'Conecta Conceptos: Lectura Crítica','Reto','Conecta cada concepto con su definición correcta.',
 'challenge','matching',13,200,ARRAY['10000000-0000-0000-0001-000000000003'],
 '[]'::jsonb,
 '{"matchPairs":[{"id":1,"concept":"Inferencia","def":"Deducir información implícita del texto","color":"#E8732C"},{"id":2,"concept":"Propósito del autor","def":"Intención comunicativa detrás del texto","color":"#7B3FA0"},{"id":3,"concept":"Argumento","def":"Afirmación respaldada con evidencia textual","color":"#3B82F6"},{"id":4,"concept":"Sesgo","def":"Perspectiva parcial que influye en la información","color":"#10B981"},{"id":5,"concept":"Intertextualidad","def":"Relación entre diferentes textos y contextos","color":"#F59E0B"},{"id":6,"concept":"Contexto","def":"Circunstancias históricas y sociales de un texto","color":"#EC4899"}]}'::jsonb),

('10000000-0000-0000-0001-000000000005','00000000-0000-0000-0000-000000000001',
 'Lab DCE: Lectura Crítica','Evaluación Final','Diseña una experiencia de aprendizaje para Lectura Crítica.',
 'evaluation','designlab',14,300,ARRAY['10000000-0000-0000-0001-000000000004'],
 '[]'::jsonb,'{}'::jsonb),

-- ===================== COMPETENCIAS CIUDADANAS =====================
('10000000-0000-0000-0002-000000000001','00000000-0000-0000-0000-000000000001',
 'DCE en Competencias Ciudadanas','Módulo 3','Diseña experiencias de formación ciudadana.',
 'lesson',null,20,140,ARRAY['10000000-0000-0000-0000-000000000004'],
 '[{"type":"intro","title":"Ciudadanía como Experiencia","text":"Las competencias ciudadanas se desarrollan viviendo experiencias democráticas, no memorizando conceptos."},{"type":"concepts","title":"Estrategias DCE Ciudadanas","items":[{"t":"Dilemas éticos","d":"Plantear situaciones reales que requieran toma de decisiones éticas."},{"t":"Simulación democrática","d":"Crear experiencias de participación, debate y consenso."},{"t":"Proyectos comunitarios","d":"Conectar el aprendizaje con acciones en la comunidad real."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0002-000000000002','00000000-0000-0000-0000-000000000001',
 'Simulación: Competencias Ciudadanas','Reto','Toma decisiones pedagógicas en Ciudadanas.',
 'challenge','simulation',21,200,ARRAY['10000000-0000-0000-0002-000000000001'],
 '[]'::jsonb,'{"simContext":"un taller de resolución de conflictos en una comunidad escolar diversa"}'::jsonb),

('10000000-0000-0000-0002-000000000003','00000000-0000-0000-0000-000000000001',
 'Evaluación en Competencias Ciudadanas','Módulo 4','Evaluar competencias ciudadanas de forma experiencial.',
 'lesson',null,22,140,ARRAY['10000000-0000-0000-0002-000000000002'],
 '[{"type":"intro","title":"Evaluar la Ciudadanía Activa","text":"La evaluación ciudadana observa cómo el estudiante actúa en situaciones que requieren empatía, pensamiento crítico y participación."},{"type":"concepts","title":"Instrumentos","items":[{"t":"Portafolio ciudadano","d":"Evidencia de acciones ciudadanas y reflexión ética."},{"t":"Autoevaluación ética","d":"El estudiante analiza sus propias decisiones y su impacto."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0002-000000000004','00000000-0000-0000-0000-000000000001',
 'Conecta Conceptos: Ciudadanas','Reto','Conecta cada concepto con su definición correcta.',
 'challenge','matching',23,200,ARRAY['10000000-0000-0000-0002-000000000003'],
 '[]'::jsonb,
 '{"matchPairs":[{"id":1,"concept":"Participación","def":"Involucrarse activamente en decisiones colectivas","color":"#E8732C"},{"id":2,"concept":"Pluralidad","def":"Reconocer y valorar la diversidad de perspectivas","color":"#7B3FA0"},{"id":3,"concept":"Convivencia","def":"Construir relaciones respetuosas en comunidad","color":"#3B82F6"},{"id":4,"concept":"Pensamiento crítico","def":"Cuestionar y analizar situaciones sociales","color":"#10B981"},{"id":5,"concept":"Derechos humanos","def":"Garantías fundamentales de toda persona","color":"#F59E0B"},{"id":6,"concept":"Responsabilidad social","def":"Compromiso con el bienestar colectivo","color":"#EC4899"}]}'::jsonb),

('10000000-0000-0000-0002-000000000005','00000000-0000-0000-0000-000000000001',
 'Lab DCE: Competencias Ciudadanas','Evaluación Final','Diseña una experiencia de aprendizaje para Ciudadanas.',
 'evaluation','designlab',24,300,ARRAY['10000000-0000-0000-0002-000000000004'],
 '[]'::jsonb,'{}'::jsonb),

-- ===================== INGLÉS =====================
('10000000-0000-0000-0003-000000000001','00000000-0000-0000-0000-000000000001',
 'DCE en la Enseñanza del Inglés','Módulo 3','Diseña experiencias inmersivas de aprendizaje del inglés.',
 'lesson',null,30,140,ARRAY['10000000-0000-0000-0000-000000000004'],
 '[{"type":"intro","title":"English as Experience","text":"Aprender inglés no es memorizar gramática — es vivir experiencias comunicativas auténticas."},{"type":"concepts","title":"Estrategias DCE para Inglés","items":[{"t":"Inmersión contextual","d":"Crear escenarios donde el inglés sea medio, no fin."},{"t":"Storytelling","d":"Usar narrativas para contextualizar estructuras lingüísticas."},{"t":"Role-play comunicativo","d":"Simulaciones de situaciones reales que requieren inglés."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0003-000000000002','00000000-0000-0000-0000-000000000001',
 'Simulación: Inglés','Reto','Toma decisiones pedagógicas en Inglés.',
 'challenge','simulation',31,200,ARRAY['10000000-0000-0000-0003-000000000001'],
 '[]'::jsonb,'{"simContext":"una actividad de conversación en inglés para estudiantes de nivel intermedio"}'::jsonb),

('10000000-0000-0000-0003-000000000003','00000000-0000-0000-0000-000000000001',
 'Innovación en English Teaching','Módulo 4','Métodos innovadores para la enseñanza del inglés con DCE.',
 'lesson',null,32,140,ARRAY['10000000-0000-0000-0003-000000000002'],
 '[{"type":"intro","title":"Innovar en la Clase de Inglés","text":"La innovación integra tecnología, cultura y experiencias multisensoriales."},{"type":"concepts","title":"Técnicas Innovadoras","items":[{"t":"Podcast estudiantil","d":"Los estudiantes crean contenido en inglés sobre temas que les interesan."},{"t":"Cultural exchange","d":"Conexiones con hablantes nativos para experiencias auténticas."},{"t":"Gamified reading","d":"Lectura gamificada con retos y misiones en inglés."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0003-000000000004','00000000-0000-0000-0000-000000000001',
 'Conecta Conceptos: Inglés','Reto','Conecta cada concepto con su definición correcta.',
 'challenge','matching',33,200,ARRAY['10000000-0000-0000-0003-000000000003'],
 '[]'::jsonb,
 '{"matchPairs":[{"id":1,"concept":"Fluency","def":"Capacidad de comunicarse con fluidez y naturalidad","color":"#E8732C"},{"id":2,"concept":"Scaffolding","def":"Apoyo gradual que se retira a medida que el estudiante avanza","color":"#7B3FA0"},{"id":3,"concept":"Authentic input","def":"Material lingüístico real, no artificial","color":"#3B82F6"},{"id":4,"concept":"Output","def":"Producción activa del idioma por el estudiante","color":"#10B981"},{"id":5,"concept":"Communicative competence","def":"Usar el idioma de forma efectiva en contexto","color":"#F59E0B"},{"id":6,"concept":"Task-based learning","def":"Aprender el idioma realizando tareas significativas","color":"#EC4899"}]}'::jsonb),

('10000000-0000-0000-0003-000000000005','00000000-0000-0000-0000-000000000001',
 'Lab DCE: Inglés','Evaluación Final','Diseña una experiencia de aprendizaje para Inglés.',
 'evaluation','designlab',34,300,ARRAY['10000000-0000-0000-0003-000000000004'],
 '[]'::jsonb,'{}'::jsonb),

-- ===================== MATEMÁTICAS =====================
('10000000-0000-0000-0004-000000000001','00000000-0000-0000-0000-000000000001',
 'DCE en Matemáticas','Módulo 3','Diseña experiencias de aprendizaje matemático significativas.',
 'lesson',null,40,140,ARRAY['10000000-0000-0000-0000-000000000004'],
 '[{"type":"intro","title":"Matemáticas como Experiencia","text":"Las matemáticas cobran sentido cuando se viven, no cuando se memorizan."},{"type":"concepts","title":"Estrategias DCE para Matemáticas","items":[{"t":"Problemas auténticos","d":"Plantear situaciones reales que requieran pensamiento matemático."},{"t":"Manipulación concreta","d":"Usar materiales tangibles antes de la abstracción."},{"t":"Modelación matemática","d":"Conectar modelos abstractos con fenómenos observables."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0004-000000000002','00000000-0000-0000-0000-000000000001',
 'Simulación: Matemáticas','Reto','Toma decisiones pedagógicas en Matemáticas.',
 'challenge','simulation',41,200,ARRAY['10000000-0000-0000-0004-000000000001'],
 '[]'::jsonb,'{"simContext":"una clase de geometría experiencial para 9° grado usando diseño de espacios reales"}'::jsonb),

('10000000-0000-0000-0004-000000000003','00000000-0000-0000-0000-000000000001',
 'Evaluación Experiencial Matemática','Módulo 4','Evaluar competencias matemáticas de forma experiencial.',
 'lesson',null,42,140,ARRAY['10000000-0000-0000-0004-000000000002'],
 '[{"type":"intro","title":"Evaluar el Pensamiento Matemático","text":"La evaluación experiencial en matemáticas observa procesos de razonamiento, no solo resultados correctos."},{"type":"concepts","title":"Instrumentos","items":[{"t":"Resolución de problemas abiertos","d":"Problemas con múltiples caminos y soluciones posibles."},{"t":"Exposición de estrategias","d":"El estudiante explica su razonamiento paso a paso."},{"t":"Proyecto de modelación","d":"Aplicar matemáticas a un fenómeno real y presentar el modelo."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0004-000000000004','00000000-0000-0000-0000-000000000001',
 'Conecta Conceptos: Matemáticas','Reto','Conecta cada concepto con su definición correcta.',
 'challenge','matching',43,200,ARRAY['10000000-0000-0000-0004-000000000003'],
 '[]'::jsonb,
 '{"matchPairs":[{"id":1,"concept":"Razonamiento lógico","def":"Proceso ordenado de deducción e inferencia","color":"#E8732C"},{"id":2,"concept":"Modelación","def":"Representar situaciones reales con herramientas matemáticas","color":"#7B3FA0"},{"id":3,"concept":"Resolución de problemas","def":"Encontrar estrategias para situaciones desconocidas","color":"#3B82F6"},{"id":4,"concept":"Pensamiento variacional","def":"Comprender el cambio y las relaciones entre cantidades","color":"#10B981"},{"id":5,"concept":"Comunicación matemática","def":"Expresar ideas matemáticas con claridad y precisión","color":"#F59E0B"},{"id":6,"concept":"Pensamiento numérico","def":"Comprensión profunda de números y operaciones","color":"#EC4899"}]}'::jsonb),

('10000000-0000-0000-0004-000000000005','00000000-0000-0000-0000-000000000001',
 'Lab DCE: Matemáticas','Evaluación Final','Diseña una experiencia de aprendizaje para Matemáticas.',
 'evaluation','designlab',44,300,ARRAY['10000000-0000-0000-0004-000000000004'],
 '[]'::jsonb,'{}'::jsonb),

-- ===================== CIENCIAS NATURALES =====================
('10000000-0000-0000-0005-000000000001','00000000-0000-0000-0000-000000000001',
 'DCE en Ciencias Naturales','Módulo 3','Diseña experiencias de indagación científica.',
 'lesson',null,50,140,ARRAY['10000000-0000-0000-0000-000000000004'],
 '[{"type":"intro","title":"Ciencia como Experiencia","text":"La ciencia se aprende investigando, no leyendo sobre investigaciones."},{"type":"concepts","title":"Estrategias DCE para Ciencias","items":[{"t":"Indagación guiada","d":"Facilitar preguntas que conduzcan a investigación genuina."},{"t":"Experimentos auténticos","d":"Diseñar experimentos con variables reales y resultados inciertos."},{"t":"Observación de campo","d":"Conectar la ciencia con fenómenos naturales observables."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0005-000000000002','00000000-0000-0000-0000-000000000001',
 'Simulación: Ciencias Naturales','Reto','Toma decisiones pedagógicas en Ciencias.',
 'challenge','simulation',51,200,ARRAY['10000000-0000-0000-0005-000000000001'],
 '[]'::jsonb,'{"simContext":"un laboratorio de biología experimental sobre ecosistemas para 8° grado"}'::jsonb),

('10000000-0000-0000-0005-000000000003','00000000-0000-0000-0000-000000000001',
 'Laboratorio Experiencial de Ciencias','Módulo 4','Crear laboratorios experienciales de ciencias naturales.',
 'lesson',null,52,140,ARRAY['10000000-0000-0000-0005-000000000002'],
 '[{"type":"intro","title":"Reinventar el Laboratorio","text":"El laboratorio experiencial no sigue protocolos rígidos — plantea problemas abiertos donde los estudiantes diseñan sus propios experimentos."},{"type":"concepts","title":"Formatos de Laboratorio","items":[{"t":"Lab de diseño experimental","d":"Los estudiantes crean hipótesis y diseñan procedimientos propios."},{"t":"Estación de observación","d":"Espacios de observación prolongada de fenómenos naturales."},{"t":"Feria de ciencia experiencial","d":"Presentación pública de investigaciones con demostración."}]}]'::jsonb,
 '{}'::jsonb),

('10000000-0000-0000-0005-000000000004','00000000-0000-0000-0000-000000000001',
 'Conecta Conceptos: Ciencias Naturales','Reto','Conecta cada concepto con su definición correcta.',
 'challenge','matching',53,200,ARRAY['10000000-0000-0000-0005-000000000003'],
 '[]'::jsonb,
 '{"matchPairs":[{"id":1,"concept":"Hipótesis","def":"Explicación tentativa que se puede verificar experimentalmente","color":"#E8732C"},{"id":2,"concept":"Variable","def":"Factor que puede cambiar en un experimento","color":"#7B3FA0"},{"id":3,"concept":"Método científico","def":"Proceso sistemático de investigación y validación","color":"#3B82F6"},{"id":4,"concept":"Ecosistema","def":"Sistema de interacciones entre organismos y su entorno","color":"#10B981"},{"id":5,"concept":"Indagación","def":"Proceso de exploración guiado por preguntas","color":"#F59E0B"},{"id":6,"concept":"Evidencia","def":"Datos observables que respaldan una conclusión","color":"#EC4899"}]}'::jsonb),

('10000000-0000-0000-0005-000000000005','00000000-0000-0000-0000-000000000001',
 'Lab DCE: Ciencias Naturales','Evaluación Final','Diseña una experiencia de aprendizaje para Ciencias Naturales.',
 'evaluation','designlab',54,300,ARRAY['10000000-0000-0000-0005-000000000004'],
 '[]'::jsonb,'{}'::jsonb)

ON CONFLICT (id) DO NOTHING;
