import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
// =============================================
// EXPERIA — State Store & Data (v12)
// =============================================

const createExpStore = (init) => {
  let state = { ...init }; const subs = new Set();
  return {
    get: () => state,
    set: (partial) => {
      state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
      subs.forEach(fn => fn(state));
    },
    sub: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
};
const useStore = (sel) => {
  const ref=React.useRef(XS);
  const selRef=React.useRef(sel);
  selRef.current=sel;
  const [v,sv]=React.useState(()=>sel(ref.current.get()));
  React.useEffect(()=>ref.current.sub(s=>{const n=selRef.current(s);sv(p=>p!==n?n:p);}),[]);
  return v;
};


// --- Areas ---
const AREAS = [
  { id:'lectura', name:'Lectura Crítica', icon:'📖', color:'#E8732C', bg:'#FEF3E8' },
  { id:'ciudadanas', name:'Competencias Ciudadanas', icon:'🏛️', color:'#7B3FA0', bg:'#F3E8FA' },
  { id:'ingles', name:'Inglés', icon:'🌎', color:'#3B82F6', bg:'#EFF6FF' },
  { id:'matematicas', name:'Matemáticas', icon:'📐', color:'#10B981', bg:'#F0FDF4' },
  { id:'ciencias', name:'Ciencias Naturales', icon:'🔬', color:'#F59E0B', bg:'#FFFBEB' },
];

const BADGES = {
  explorer:{id:'explorer',name:'Explorador DCE',icon:'🧭',desc:'Completaste la introducción'},
  empathist:{id:'empathist',name:'Empático Educativo',icon:'💛',desc:'Dominaste la empatía educativa'},
  designer:{id:'designer',name:'Diseñador Experiencial',icon:'✏️',desc:'Completaste diseño instruccional'},
  innovator:{id:'innovator',name:'Innovador Pedagógico',icon:'🚀',desc:'Innovación pedagógica completada'},
  master:{id:'master',name:'Maestro DCE',icon:'👑',desc:'Completaste toda la formación'},
  challenger:{id:'challenger',name:'Retador',icon:'⚡',desc:'Completaste tu primer reto'},
  speedster:{id:'speedster',name:'Veloz',icon:'⏱️',desc:'Reto avanzado completado'},
  builder:{id:'builder',name:'Constructor',icon:'🏗️',desc:'Creaste tu producto final'},
};
const LEVELS = [0,100,250,500,800,1200,1800,2500,3500];
const RUBRIC_CRITERIA = [
  { key:'pertinencia', label:'Pertinencia Pedagógica', desc:'¿La entrega es pertinente al área?' },
  { key:'calidad', label:'Calidad de la Pregunta', desc:'¿La pregunta está bien formulada?' },
  { key:'alineacion', label:'Alineación con el Área', desc:'¿Contenidos alineados con estándares del área?' },
  { key:'completitud', label:'Completitud de la Rejilla', desc:'¿La rejilla contiene todos los campos?' },
];

// ==========================================
// MODULE DEFINITIONS
// ==========================================

// --- Shared Modules (everyone) ---
const SHARED_MODULES = [
  { id:'mod1', type:'lesson', area:null, title:'Introducción al DCE', subtitle:'Módulo 1',
    desc:'Fundamentos del Diseño Centrado en Experiencias y su relevancia educativa.',
    task:'Lee todo el contenido del módulo. Cuando hayas avanzado más del 85% de la lectura, aparecerá el botón "Completar lección" para ganar 100 XP y desbloquear el primer reto.',
    duration:'45 min', xp:100, badge:'explorer', req:[], pos:{x:42,y:0}, side:'right',
    content:[
      {type:'intro',title:'¿Qué es el Diseño Centrado en Experiencias?',text:'El DCE sitúa la experiencia del estudiante como eje central del proceso educativo, creando momentos de aprendizaje significativos y transformadores.'},
      {type:'callout',icon:'💡',title:'Principio Fundamental',text:'Los estudiantes no solo aprenden contenidos — viven experiencias. La calidad de esas experiencias determina la profundidad del aprendizaje.'},
      {type:'concepts',title:'Pilares del DCE',items:[
        {t:'Empatía',d:'Comprender las necesidades, emociones y contextos de los estudiantes.'},
        {t:'Co-creación',d:'Involucrar a los estudiantes como co-diseñadores de sus experiencias.'},
        {t:'Iteración',d:'Diseñar, probar, reflexionar y mejorar continuamente.'},
        {t:'Reflexión',d:'Crear espacios para dar significado a las experiencias.'},
      ]},
      {type:'text',title:'Orígenes del DCE',text:'El DCE integra el aprendizaje experiencial de John Dewey, el Design Thinking de IDEO, y la pedagogía humanista en un marco práctico para docentes del siglo XXI.'},
      {type:'video',title:'Video introductorio: DCE en acción',
        desc:'Mira este video antes de continuar con el ejemplo práctico.',
        url:'https://www.youtube.com/watch?v=3rcULk9VLKs'},
      {type:'compare',title:'Ejemplo Práctico — Clase de Historia',label:'Revolución Industrial',
        trad:'El docente expone los hechos con diapositivas y los estudiantes toman notas.',
        dce:'Los estudiantes recrean un taller de la época, simulan roles, debaten condiciones laborales y reflexionan sobre su impacto actual.'},
    ]
  },
  { id:'ch1', type:'challenge', ctype:'dragdrop', area:null, title:'Evaluación: Introducción al DCE', subtitle:'Reto',
    desc:'Ordena las fases del DCE correctamente.', duration:'15 min', xp:150, badge:'challenger', req:['mod1'], pos:{x:62,y:1}, side:'left',
    task:'Arrastra las 5 fases del DCE y colócalas en el orden correcto: Empatizar → Definir → Idear → Prototipar → Evaluar. Haz clic en "Verificar orden" cuando estés listo.' },
  { id:'mod2', type:'lesson', area:null, title:'Empatía Educativa', subtitle:'Módulo 2',
    desc:'Técnicas para comprender las experiencias y emociones de los estudiantes.',
    task:'Lee el módulo completo sobre las 3 dimensiones de la empatía (cognitiva, emocional, contextual) y el Mapa de Empatía. Desplázate hasta el final para habilitar el botón de completar.',
    duration:'50 min', xp:120, badge:'empathist', req:['ch1'], pos:{x:36,y:2}, side:'right',
    content:[
      {type:'intro',title:'La Empatía como Competencia Docente',text:'La empatía educativa permite comprender y conectar con las experiencias y perspectivas de los estudiantes para diseñar desde esa comprensión.'},
      {type:'concepts',title:'Dimensiones de la Empatía',items:[
        {t:'Cognitiva',d:'Entender cómo piensan los estudiantes y sus modelos mentales.'},
        {t:'Emocional',d:'Conectar con las emociones durante el aprendizaje.'},
        {t:'Contextual',d:'Comprender el contexto de vida y circunstancias de cada estudiante.'},
      ]},
      {type:'callout',icon:'🗺️',title:'Mapa de Empatía',text:'Organiza lo que sabemos del estudiante en cuatro cuadrantes: piensa, siente, dice y hace.'},
    ]
  },
  { id:'ch2', type:'challenge', ctype:'empathy', area:null, title:'Mapa de Empatía Interactivo', subtitle:'Reto',
    desc:'Construye un mapa de empatía para un estudiante tipo.', duration:'20 min', xp:180, req:['mod2'], pos:{x:66,y:3}, side:'left',
    task:'Arrastra las 8 tarjetas al cuadrante correcto del Mapa de Empatía: Piensa, Siente, Dice o Hace. Coloca todas las tarjetas antes de hacer clic en "Verificar mapa".' },
];

// --- Area-specific content ---
const AREA_CONTENT = {
  lectura: {
    m3:{title:'DCE en Lectura Crítica',desc:'Diseña experiencias de lectura crítica usando el DCE.',
      content:[
        {type:'intro',title:'Lectura como Experiencia',text:'La lectura crítica no es solo decodificar texto — es vivir una experiencia cognitiva y emocional. El DCE transforma la clase de lectura en un espacio donde los estudiantes interactúan con textos de forma significativa.'},
        {type:'concepts',title:'Estrategias DCE para Lectura',items:[
          {t:'Lectura inmersiva',d:'Crear contextos que sumerjan al estudiante en el mundo del texto.'},
          {t:'Diálogo textual',d:'Facilitar conversaciones genuinas entre el lector y el texto.'},
          {t:'Análisis experiencial',d:'Conectar los textos con experiencias vividas por los estudiantes.'},
        ]},
        {type:'callout',icon:'📖',title:'Clave',text:'Pregúntate: ¿qué experiencia quiero que mis estudiantes vivan al leer este texto? No solo qué deben aprender.'},
      ]},
    m4:{title:'Evaluación Experiencial en Lectura',desc:'Métodos de evaluación experiencial para lectura crítica.',
      content:[
        {type:'intro',title:'Evaluar la Experiencia Lectora',text:'La evaluación en lectura crítica bajo el DCE va más allá de la comprensión literal. Evalúa la relación del estudiante con el texto y su capacidad de análisis crítico.'},
        {type:'concepts',title:'Instrumentos de Evaluación',items:[
          {t:'Diario de lectura reflexivo',d:'El estudiante registra sus reacciones, preguntas y conexiones con cada texto.'},
          {t:'Debate argumentativo',d:'Evaluación oral donde el estudiante defiende interpretaciones con evidencia textual.'},
          {t:'Portfolio de análisis',d:'Colección de análisis que muestra la evolución del pensamiento crítico.'},
        ]},
      ]},
    simContext:'una clase de lectura crítica sobre análisis de noticias para 10° grado',
    matchPairs:[
      {id:1,concept:'Inferencia',def:'Deducir información implícita del texto',color:'#E8732C'},
      {id:2,concept:'Propósito del autor',def:'Intención comunicativa detrás del texto',color:'#7B3FA0'},
      {id:3,concept:'Argumento',def:'Afirmación respaldada con evidencia textual',color:'#3B82F6'},
      {id:4,concept:'Sesgo',def:'Perspectiva parcial que influye en la información',color:'#10B981'},
      {id:5,concept:'Intertextualidad',def:'Relación entre diferentes textos y contextos',color:'#F59E0B'},
      {id:6,concept:'Contexto',def:'Circunstancias históricas y sociales de un texto',color:'#EC4899'},
    ],
  },
  ciudadanas: {
    m3:{title:'DCE en Competencias Ciudadanas',desc:'Diseña experiencias de formación ciudadana.',
      content:[
        {type:'intro',title:'Ciudadanía como Experiencia',text:'Las competencias ciudadanas se desarrollan viviendo experiencias democráticas, no memorizando conceptos. El DCE transforma el aula en un laboratorio de convivencia.'},
        {type:'concepts',title:'Estrategias DCE Ciudadanas',items:[
          {t:'Dilemas éticos',d:'Plantear situaciones reales que requieran toma de decisiones éticas.'},
          {t:'Simulación democrática',d:'Crear experiencias de participación, debate y consenso.'},
          {t:'Proyectos comunitarios',d:'Conectar el aprendizaje con acciones en la comunidad real.'},
        ]},
      ]},
    m4:{title:'Evaluación en Competencias Ciudadanas',desc:'Evaluar competencias ciudadanas de forma experiencial.',
      content:[
        {type:'intro',title:'Evaluar la Ciudadanía Activa',text:'La evaluación ciudadana observa cómo el estudiante actúa en situaciones que requieren empatía, pensamiento crítico y participación.'},
        {type:'concepts',title:'Instrumentos',items:[
          {t:'Portafolio ciudadano',d:'Evidencia de acciones ciudadanas y reflexión ética.'},
          {t:'Autoevaluación ética',d:'El estudiante analiza sus propias decisiones y su impacto.'},
        ]},
      ]},
    simContext:'un taller de resolución de conflictos en una comunidad escolar diversa',
    matchPairs:[
      {id:1,concept:'Participación',def:'Involucrarse activamente en decisiones colectivas',color:'#E8732C'},
      {id:2,concept:'Pluralidad',def:'Reconocer y valorar la diversidad de perspectivas',color:'#7B3FA0'},
      {id:3,concept:'Convivencia',def:'Construir relaciones respetuosas en comunidad',color:'#3B82F6'},
      {id:4,concept:'Pensamiento crítico',def:'Cuestionar y analizar situaciones sociales',color:'#10B981'},
      {id:5,concept:'Derechos humanos',def:'Garantías fundamentales de toda persona',color:'#F59E0B'},
      {id:6,concept:'Responsabilidad social',def:'Compromiso con el bienestar colectivo',color:'#EC4899'},
    ],
  },
  ingles: {
    m3:{title:'DCE en la Enseñanza del Inglés',desc:'Diseña experiencias inmersivas de aprendizaje del inglés.',
      content:[
        {type:'intro',title:'English as Experience',text:'Aprender inglés no es memorizar gramática — es vivir experiencias comunicativas auténticas. El DCE crea contextos donde el idioma se usa con propósito real.'},
        {type:'concepts',title:'Estrategias DCE para Inglés',items:[
          {t:'Inmersión contextual',d:'Crear escenarios donde el inglés sea medio, no fin.'},
          {t:'Storytelling',d:'Usar narrativas para contextualizar estructuras lingüísticas.'},
          {t:'Role-play comunicativo',d:'Simulaciones de situaciones reales que requieren inglés.'},
        ]},
      ]},
    m4:{title:'Innovación en English Teaching',desc:'Métodos innovadores para la enseñanza del inglés con DCE.',
      content:[
        {type:'intro',title:'Innovar en la Clase de Inglés',text:'La innovación en la enseñanza del inglés integra tecnología, cultura y experiencias multisensoriales para un aprendizaje significativo.'},
        {type:'concepts',title:'Técnicas Innovadoras',items:[
          {t:'Podcast estudiantil',d:'Los estudiantes crean contenido en inglés sobre temas que les interesan.'},
          {t:'Cultural exchange',d:'Conexiones con hablantes nativos para experiencias auténticas.'},
          {t:'Gamified reading',d:'Lectura gamificada con retos y misiones en inglés.'},
        ]},
      ]},
    simContext:'una actividad de conversación en inglés para estudiantes de nivel intermedio',
    matchPairs:[
      {id:1,concept:'Fluency',def:'Capacidad de comunicarse con fluidez y naturalidad',color:'#E8732C'},
      {id:2,concept:'Scaffolding',def:'Apoyo gradual que se retira a medida que el estudiante avanza',color:'#7B3FA0'},
      {id:3,concept:'Authentic input',def:'Material lingüístico real, no artificial',color:'#3B82F6'},
      {id:4,concept:'Output',def:'Producción activa del idioma por el estudiante',color:'#10B981'},
      {id:5,concept:'Communicative competence',def:'Usar el idioma de forma efectiva en contexto',color:'#F59E0B'},
      {id:6,concept:'Task-based learning',def:'Aprender el idioma realizando tareas significativas',color:'#EC4899'},
    ],
  },
  matematicas: {
    m3:{title:'DCE en Matemáticas',desc:'Diseña experiencias de aprendizaje matemático significativas.',
      content:[
        {type:'intro',title:'Matemáticas como Experiencia',text:'Las matemáticas cobran sentido cuando se viven, no cuando se memorizan. El DCE crea situaciones donde el razonamiento matemático emerge de problemas auténticos.'},
        {type:'concepts',title:'Estrategias DCE para Matemáticas',items:[
          {t:'Problemas auténticos',d:'Plantear situaciones reales que requieran pensamiento matemático.'},
          {t:'Manipulación concreta',d:'Usar materiales tangibles antes de la abstracción.'},
          {t:'Modelación matemática',d:'Conectar modelos abstractos con fenómenos observables.'},
        ]},
      ]},
    m4:{title:'Evaluación Experiencial Matemática',desc:'Evaluar competencias matemáticas de forma experiencial.',
      content:[
        {type:'intro',title:'Evaluar el Pensamiento Matemático',text:'La evaluación experiencial en matemáticas observa procesos de razonamiento, no solo resultados correctos.'},
        {type:'concepts',title:'Instrumentos',items:[
          {t:'Resolución de problemas abiertos',d:'Problemas con múltiples caminos y soluciones posibles.'},
          {t:'Exposición de estrategias',d:'El estudiante explica su razonamiento paso a paso.'},
          {t:'Proyecto de modelación',d:'Aplicar matemáticas a un fenómeno real y presentar el modelo.'},
        ]},
      ]},
    simContext:'una clase de geometría experiencial para 9° grado usando diseño de espacios reales',
    matchPairs:[
      {id:1,concept:'Razonamiento lógico',def:'Proceso ordenado de deducción e inferencia',color:'#E8732C'},
      {id:2,concept:'Modelación',def:'Representar situaciones reales con herramientas matemáticas',color:'#7B3FA0'},
      {id:3,concept:'Resolución de problemas',def:'Encontrar estrategias para situaciones desconocidas',color:'#3B82F6'},
      {id:4,concept:'Pensamiento variacional',def:'Comprender el cambio y las relaciones entre cantidades',color:'#10B981'},
      {id:5,concept:'Comunicación matemática',def:'Expresar ideas matemáticas con claridad y precisión',color:'#F59E0B'},
      {id:6,concept:'Pensamiento numérico',def:'Comprensión profunda de números y operaciones',color:'#EC4899'},
    ],
  },
  ciencias: {
    m3:{title:'DCE en Ciencias Naturales',desc:'Diseña experiencias de indagación científica.',
      content:[
        {type:'intro',title:'Ciencia como Experiencia',text:'La ciencia se aprende investigando, no leyendo sobre investigaciones. El DCE crea laboratorios de indagación donde los estudiantes son científicos activos.'},
        {type:'concepts',title:'Estrategias DCE para Ciencias',items:[
          {t:'Indagación guiada',d:'Facilitar preguntas que conduzcan a investigación genuina.'},
          {t:'Experimentos auténticos',d:'Diseñar experimentos con variables reales y resultados inciertos.'},
          {t:'Observación de campo',d:'Conectar la ciencia con fenómenos naturales observables.'},
        ]},
      ]},
    m4:{title:'Laboratorio Experiencial de Ciencias',desc:'Crear laboratorios experienciales de ciencias naturales.',
      content:[
        {type:'intro',title:'Reinventar el Laboratorio',text:'El laboratorio experiencial no sigue protocolos rígidos — plantea problemas abiertos donde los estudiantes diseñan sus propios experimentos.'},
        {type:'concepts',title:'Formatos de Laboratorio',items:[
          {t:'Lab de diseño experimental',d:'Los estudiantes crean hipótesis y diseñan procedimientos propios.'},
          {t:'Estación de observación',d:'Espacios de observación prolongada de fenómenos naturales.'},
          {t:'Feria de ciencia experiencial',d:'Presentación pública de investigaciones con demostración.'},
        ]},
      ]},
    simContext:'un laboratorio de biología experimental sobre ecosistemas para 8° grado',
    matchPairs:[
      {id:1,concept:'Hipótesis',def:'Explicación tentativa que se puede verificar experimentalmente',color:'#E8732C'},
      {id:2,concept:'Variable',def:'Factor que puede cambiar en un experimento',color:'#7B3FA0'},
      {id:3,concept:'Método científico',def:'Proceso sistemático de investigación y validación',color:'#3B82F6'},
      {id:4,concept:'Ecosistema',def:'Sistema de interacciones entre organismos y su entorno',color:'#10B981'},
      {id:5,concept:'Indagación',def:'Proceso de exploración guiado por preguntas',color:'#F59E0B'},
      {id:6,concept:'Evidencia',def:'Datos observables que respaldan una conclusión',color:'#EC4899'},
    ],
  },
};

// --- Generate area-specific modules ---
const makeAreaModules = (areaId) => {
  const ac = AREA_CONTENT[areaId]; if(!ac) return [];
  const area = AREAS.find(a => a.id === areaId);
  return [
    { id:`mod3_${areaId}`, type:'lesson', area:areaId, title:ac.m3.title, subtitle:'Módulo 3',
      desc:ac.m3.desc, duration:'50 min', xp:140, badge:'designer', req:['ch2'],
      task:'Lee cómo se aplica el DCE en tu área de formación. Explora las estrategias y ejemplos del módulo. Desplázate hasta el final para habilitar el botón de completar.',
      pos:{x:38,y:4}, side:'right', content:ac.m3.content },
    { id:`ch3_${areaId}`, type:'challenge', ctype:'simulation', area:areaId,
      title:'Simulación: '+ac.m3.title.replace('DCE en ',''), subtitle:'Reto',
      desc:'Toma decisiones pedagógicas en '+area.name+'.',
      task:'Recorre el árbol de decisiones pedagógicas. Hay 2 o 3 decisiones encadenadas. Elige la opción que mejor aplique el enfoque DCE en cada situación del escenario.',
      duration:'25 min', xp:200, req:[`mod3_${areaId}`], pos:{x:60,y:5}, side:'left',
      simContext: ac.simContext },
    { id:`mod4_${areaId}`, type:'lesson', area:areaId, title:ac.m4.title, subtitle:'Módulo 4',
      desc:ac.m4.desc, duration:'50 min', xp:140, badge:'innovator', req:[`ch3_${areaId}`],
      task:'Estudia los instrumentos de evaluación experiencial para tu área. Lee todo el contenido y completa la lección para desbloquear el último reto antes de la evaluación final.',
      pos:{x:34,y:6}, side:'right', content:ac.m4.content },
    { id:`ch4_${areaId}`, type:'challenge', ctype:'matching', area:areaId,
      title:'Conecta Conceptos: '+area.name, subtitle:'Reto',
      desc:'Conecta cada concepto con su definición correcta.',
      task:'Haz clic en un concepto (columna izquierda) y luego en su definición correcta (columna derecha) para emparejarlos. Debes conectar los 6 pares correctamente para completar el reto.',
      duration:'15 min', xp:200, badge:'speedster', req:[`mod4_${areaId}`], pos:{x:64,y:7}, side:'left',
      matchPairs: ac.matchPairs },
    { id:`final_${areaId}`, type:'evaluation', ctype:'designlab', area:areaId,
      title:'Lab DCE: '+area.name, subtitle:'Evaluación Final',
      desc:'Diseña una experiencia de aprendizaje para '+area.name+'.',
      task:'Diseña una experiencia de aprendizaje DCE completa respondiendo 5 preguntas (una por cada fase: Empatizar, Definir, Idear, Prototipar, Evaluar). Tus elecciones determinan tu nivel de alineación con el DCE.',
      duration:'30 min', xp:300, badge:'master', req:[`ch4_${areaId}`], pos:{x:50,y:8}, side:'center' },
  ];
};

// Build full module list
const ALL_MODULES = [...SHARED_MODULES];
AREAS.forEach(a => ALL_MODULES.push(...makeAreaModules(a.id)));
const MODULE_MAP = new Map(ALL_MODULES.map(m => [m.id, m]));

const getStudentModules = (areaId) => ALL_MODULES.filter(m => !m.area || m.area === areaId);

// Convierte una fila de course_modules (BD) al formato de módulo que usa la app
const dbModToAppMod = (row) => ({
  id:       row.id,
  type:     row.type,
  ctype:    row.challenge_type || null,
  title:    row.title,
  subtitle: row.subtitle || '',
  desc:     row.description || '',
  xp:       row.xp || 100,
  req:      row.requirements || [],
  badge:    null,
  area:     null,
  pos:      { x: 50, y: row.order || 0 },
  side:     'right',
  task:     '',
  content:  row.content || [],
  attachments: row.attachments || [],
  extras:   [],
  isDbModule: true,
  // datos de reto
  ...(row.challenge_data?.dragItems    ? { dragItems:    row.challenge_data.dragItems }    : {}),
  ...(row.challenge_data?.empathyCards ? { empathyCards: row.challenge_data.empathyCards } : {}),
  ...(row.challenge_data?.matchPairs   ? { matchPairs:   row.challenge_data.matchPairs }   : {}),
  ...(row.challenge_data?.simContext   ? { simContext:   row.challenge_data.simContext }    : {}),
  ...(row.challenge_data?.questions    ? { questions:    row.challenge_data.questions }     : {}),
});

// findModule se define aquí pero accede a XS de forma lazy (XS se define más adelante)
// Funciona porque JS evalúa el cuerpo de la función solo cuando se llama, no cuando se declara
function findModule(id) {
  try {
    const st = typeof XS !== 'undefined' ? XS.get() : null;
    const dbMod = (st?.courseModules || []).find(m => m.id === id);
    if (dbMod) return dbMod;
  } catch (_) {}
  return MODULE_MAP.get(id);
}

// --- Helpers ---
const calcLevel = xp => { let l=1; for(let i=1;i<LEVELS.length;i++){if(xp>=LEVELS[i])l=i+1;else break;} return l; };
const xpForNext = xp => LEVELS[calcLevel(xp)] || xp;
const xpProgress = xp => { const l=calcLevel(xp),p=LEVELS[l-1]||0,n=LEVELS[l]||xp; return n===p?1:(xp-p)/(n-p); };
// modulesOverride: si se pasa, se usa en vez de getStudentModules (para módulos de BD)
const nodeStatus = (id, done, areaId, modulesOverride) => {
  const mods = modulesOverride || getStudentModules(areaId);
  const m = mods.find(x => x.id === id) || findModule(id);
  if (!m) return 'locked';
  if (done.includes(id)) return 'completed';
  if (!mods.find(x => x.id === id)) return 'locked';
  return (m.req || []).every(r => done.includes(r)) ? 'available' : 'locked';
};
const progressPct = (done, areaId, modulesOverride) => {
  const mods = modulesOverride || getStudentModules(areaId);
  return mods.length === 0 ? 0 : Math.round((done.filter(d => mods.find(m => m.id === d)).length / mods.length) * 100);
};
const isRouteComplete = (done, areaId, modulesOverride) => {
  const mods = modulesOverride || getStudentModules(areaId);
  return mods.every(m => done.includes(m.id));
};
const gradeTotal = g => g ? Object.values(g).reduce((a,b)=>a+b,0) : 0;
const gradeMax = () => RUBRIC_CRITERIA.length * 5;

// --- Instituciones (seed) ---
const INITIAL_INSTITUTIONS = [
  { id:'inst_1', name:'IED San Francisco',                logo:null },
  { id:'inst_2', name:'Colegio Nacional Simón Bolívar',   logo:null },
  { id:'inst_3', name:'Liceo Los Andes',                  logo:null },
];

// --- Data limpia: sin registros previos ---
const MOCK_SUBMISSIONS = [];
const MOCK_ATTEMPTS = [];

const DEF = {
  isLoggedIn: false, user: null, page: 'landing', nodeId: null,
  xp: 0, completed: [], badges: [], notifications: [], selectedArea: null,
  submissions: [], challengeAttempts: [], studentMessages: [],
  accounts: [], institutions: INITIAL_INSTITUTIONS, cohorts: [],
  routeConfigs: {},
  namedRoutes: [],
  instructorInstitutions: [],
  // Multi-curso
  courses: [],              // [{ id, name, description, cover_image, color, is_active }]
  institutionCourses: [],   // [{ id, institution_id, course_id, is_active }]
  courseModules: [],        // módulos del curso inscrito (ya convertidos con dbModToAppMod)
  enrolledCourseId: null,   // id del curso en el que está inscrito el estudiante
};
export const XS = createExpStore(DEF);

// --- Actions ---
const nav = (page, nodeId) => {
  XS.set({ page, nodeId: nodeId || null });
  const { user } = XS.get();
  if (user?.id && user.role === 'student') {
    supabase.from('profiles').update({
      last_seen: new Date().toISOString(),
      current_module: nodeId || page,
    }).eq('id', user.id).then(() => {});
  }
};

const doLogout = () => {
  const wasLoggedIn = XS.get().isLoggedIn;
  XS.set({
    isLoggedIn: false, user: null, page: 'landing', nodeId: null,
    xp: 0, completed: [], badges: [], notifications: [], selectedArea: null,
  });
  if (wasLoggedIn) supabase.auth.signOut();
};
const selectArea = (areaId) => {
  const { user } = XS.get();
  XS.set({ selectedArea: areaId, page: 'map' });
  if (user?.id) {
    supabase.from('profiles').update({ area: areaId }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('selectArea:', error); });
  }
};
const changeArea = (areaId) => {
  const { user } = XS.get();
  XS.set({ selectedArea: areaId });
  if (user?.id) {
    supabase.from('profiles').update({ area: areaId }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('changeArea:', error); });
  }
};
const completeNode = (id) => {
  const s = XS.get();
  if (s.completed.includes(id)) return;
  const m = findModule(id);
  if (!m) return;
  const nxp = s.xp + (m.xp || 100), nc = [...s.completed, id], nb = [...s.badges];
  if (m.badge && !nb.includes(m.badge)) nb.push(m.badge);
  const notifs = [...s.notifications, { type:'xp', amount:m.xp || 100, id:Date.now() }];
  if (m.badge && !s.badges.includes(m.badge)) notifs.push({ type:'badge', bid:m.badge, id:Date.now()+1 });
  XS.set({ xp:nxp, completed:nc, badges:nb, notifications:notifs });
  if (s.user?.id) {
    if (s.enrolledCourseId) {
      // Nuevo: escribe en course_progress
      supabase.from('course_progress')
        .update({ xp:nxp, completed:nc, badges:nb, updated_at:new Date().toISOString() })
        .eq('user_id', s.user.id).eq('course_id', s.enrolledCourseId)
        .then(({ error }) => { if (error) console.error('completeNode course_progress:', error); });
    } else {
      // Legacy: escribe en progress
      supabase.from('progress')
        .update({ xp:nxp, completed:nc, badges:nb, updated_at:new Date().toISOString() })
        .eq('user_id', s.user.id)
        .then(({ error }) => { if (error) console.error('completeNode progress:', error); });
    }
  }
};
const recordAttempt = (challengeId, questions, score, maxScore) => {
  const s = XS.get();
  if (s.challengeAttempts.some(a => a.studentEmail === s.user.email && a.challengeId === challengeId)) return;
  const att = { id:'att_'+Date.now(), studentEmail:s.user.email, studentName:s.user.name,
    challengeId, area:s.selectedArea, questions, score, maxScore,
    date:new Date().toISOString().split('T')[0] };
  XS.set({ challengeAttempts:[...s.challengeAttempts, att] });
  supabase.from('challenge_attempts').insert({
    student_id: s.user.id, challenge_id: challengeId, area: s.selectedArea,
    questions, score, max_score: maxScore,
  }).then(({ error }) => { if (error) console.error('recordAttempt:', error); });
};

const submitProduct = (rejillaName, preguntaName, rejillaData, preguntaData) => {
  const s = XS.get();
  const tempId = 'sub_' + Date.now();
  const sub = { id:tempId, studentName:s.user.name, studentEmail:s.user.email,
    studentInstitution:'', area:s.selectedArea,
    rejillaName, preguntaName, rejillaData:rejillaData||null, preguntaData:preguntaData||null,
    date:new Date().toISOString().split('T')[0], grade:null, feedback:'', status:'pending' };
  XS.set({ submissions:[...s.submissions, sub] });
  supabase.from('submissions').insert({
    student_id: s.user.id, area: s.selectedArea,
    rejilla_name: rejillaName, rejilla_data: rejillaData,
    pregunta_name: preguntaName, pregunta_data: preguntaData,
    status: 'pending',
  }).select().single().then(({ data, error }) => {
    if (error) { console.error('submitProduct:', error); return; }
    XS.set(st => ({ submissions: st.submissions.map(su => su.id === tempId ? { ...su, id: data.id } : su) }));
  });
};

const gradeSubmission = (subId, grade, feedback) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = sub ? {
      id: 'msg_' + Date.now(), toEmail: sub.studentEmail, type: 'graded',
      grade, feedback, date: new Date().toISOString().split('T')[0], read: false, submissionId: subId,
    } : null;
    return {
      submissions: s.submissions.map(su => su.id === subId ? { ...su, grade, feedback, status: 'graded' } : su),
      studentMessages: newMsg ? [...(s.studentMessages || []), newMsg] : (s.studentMessages || []),
    };
  });
  supabase.from('submissions').update({ grade, feedback, status:'graded' }).eq('id', subId)
    .then(({ error }) => { if (error) console.error('gradeSubmission:', error); });
};

const returnSubmission = (subId, returnNotes, instrRejillaName, instrRejillaData, instrPreguntaName, instrPreguntaData) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = { id:'msg_'+Date.now(), toEmail:sub?.studentEmail, type:'return',
      returnNotes, date:new Date().toISOString().split('T')[0], read:false, submissionId:subId };
    return {
      submissions: s.submissions.map(su => su.id===subId ? {
        ...su, status:'returned', returnCount:(su.returnCount||0)+1, returnNotes,
        grade:null, feedback:'',
        instrRejillaName:instrRejillaName||null, instrRejillaData:instrRejillaData||null,
        instrPreguntaName:instrPreguntaName||null, instrPreguntaData:instrPreguntaData||null,
      } : su),
      studentMessages: [...(s.studentMessages||[]), newMsg],
    };
  });
  const currentSub = XS.get().submissions.find(su => su.id === subId);
  supabase.from('submissions').update({
    status:'returned', return_notes:returnNotes,
    return_count: (currentSub?.returnCount || 0), grade:null, feedback:'',
    instr_rejilla_name:instrRejillaName||null, instr_rejilla_data:instrRejillaData||null,
    instr_pregunta_name:instrPreguntaName||null, instr_pregunta_data:instrPreguntaData||null,
  }).eq('id', subId).then(({ error }) => { if (error) console.error('returnSubmission:', error); });
};

const approveSubmission = (subId, grade, feedback) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = sub ? {
      id: 'msg_' + Date.now(), toEmail: sub.studentEmail, type: 'approved',
      grade, feedback, date: new Date().toISOString().split('T')[0], read: false, submissionId: subId,
    } : null;
    return {
      submissions: s.submissions.map(su => su.id === subId ? { ...su, grade, feedback, status: 'approved' } : su),
      studentMessages: newMsg ? [...(s.studentMessages || []), newMsg] : (s.studentMessages || []),
    };
  });
  supabase.from('submissions').update({ grade, feedback, status:'approved' }).eq('id', subId)
    .then(({ error }) => { if (error) console.error('approveSubmission:', error); });
};

const resubmitProduct = (subId, rejillaName, preguntaName, rejillaData, preguntaData) => {
  XS.set(s => ({
    submissions: s.submissions.map(sub => {
      if (sub.id !== subId) return sub;
      const historyEntry = { rejillaName:sub.rejillaName, rejillaData:sub.rejillaData,
        preguntaName:sub.preguntaName, preguntaData:sub.preguntaData,
        date:sub.date, version:(sub.history||[]).length+1 };
      return { ...sub, rejillaName, preguntaName, rejillaData, preguntaData,
        status:'pending', date:new Date().toISOString().split('T')[0],
        history:[...(sub.history||[]), historyEntry] };
    })
  }));
  // Leer historial actual, luego actualizar
  supabase.from('submissions').select('history, rejilla_name, rejilla_data, pregunta_name, pregunta_data, created_at')
    .eq('id', subId).single().then(({ data, error }) => {
      if (error) { console.error('resubmitProduct read:', error); return; }
      const historyEntry = {
        rejilla_name:data.rejilla_name, rejilla_data:data.rejilla_data,
        pregunta_name:data.pregunta_name, pregunta_data:data.pregunta_data,
        date:data.created_at?.split('T')[0], version:(data.history?.length||0)+1,
      };
      supabase.from('submissions').update({
        rejilla_name:rejillaName, rejilla_data:rejillaData,
        pregunta_name:preguntaName, pregunta_data:preguntaData,
        status:'pending', grade:null, feedback:'',
        history:[...(data.history||[]), historyEntry],
      }).eq('id', subId).then(({ error:e }) => { if (e) console.error('resubmitProduct update:', e); });
    });
};
const resetStudentProgress = async (userId, userEmail) => {
  const { error } = await supabase.functions.invoke('reset-student-progress', {
    body: { userId },
  });
  if (error) { console.error('resetStudentProgress:', error); return; }
  XS.set(s => ({
    submissions: s.submissions.filter(su => su.studentEmail !== userEmail),
    challengeAttempts: s.challengeAttempts.filter(a => a.studentEmail !== userEmail),
  }));
};

// ---- Route Config ----
// Clave en routeConfigs: `${area}__${institutionId || 'global'}`
const routeKey = (area, institutionId) => `${area}__${institutionId || 'global'}`;

const loadRouteConfigs = async () => {
  const { data, error } = await supabase.from('route_configs').select('*');
  if (error) { console.error('loadRouteConfigs:', error); return; }
  const configs = {};
  const namedRoutes = [];
  (data || []).forEach(row => {
    const key = routeKey(row.area, row.institution_id);
    configs[key] = { modules: row.modules || [], customModules: row.custom_modules || [] };
    namedRoutes.push({
      id: row.id, name: row.name || row.area, area: row.area,
      institution_id: row.institution_id || null,
      modules: row.modules || [], customModules: row.custom_modules || [],
    });
  });
  XS.set({ routeConfigs: configs, namedRoutes });
};

// Guarda una ruta para un área + colegio específico (institution_id null = global)
const saveRouteConfig = async (area, modules, customModules, name, institutionId, existingId) => {
  const instId = institutionId || null;
  const key = routeKey(area, instId);
  XS.set(s => ({ routeConfigs: { ...s.routeConfigs, [key]: { modules, customModules } } }));
  const payload = {
    area, modules, custom_modules: customModules,
    updated_at: new Date().toISOString(),
    name: name || area,
    institution_id: instId,
  };
  let error;
  if (existingId) {
    ({ error } = await supabase.from('route_configs').update(payload).eq('id', existingId));
  } else {
    ({ error } = await supabase.from('route_configs')
      .upsert(payload, { onConflict: 'area,institution_id' }));
  }
  if (error) { console.error('saveRouteConfig:', error); return; }
  await loadRouteConfigs();
};

// ---- Instructor Institutions ----
const loadInstructorInstitutions = async () => {
  const { data, error } = await supabase.from('instructor_institutions').select('*');
  if (error) { console.error('loadInstructorInstitutions:', error); return; }
  XS.set({ instructorInstitutions: data || [] });
};

const assignInstructorInstitution = async (instructorId, institutionId) => {
  const { error } = await supabase.from('instructor_institutions')
    .insert({ instructor_id: instructorId, institution_id: institutionId });
  if (error) { console.error('assignInstructorInstitution:', error); return; }
  await loadInstructorInstitutions();
};

const removeInstructorInstitution = async (instructorId, institutionId) => {
  const { error } = await supabase.from('instructor_institutions')
    .delete().eq('instructor_id', instructorId).eq('institution_id', institutionId);
  if (error) { console.error('removeInstructorInstitution:', error); return; }
  await loadInstructorInstitutions();
};

const assignRouteToInstitution = async (routeId, institutionId) => {
  const { error } = await supabase.from('route_configs')
    .update({ institution_id: institutionId || null }).eq('id', routeId);
  if (error) { console.error('assignRouteToInstitution:', error); return; }
  await loadRouteConfigs();
};

const getRouteModules = (areaId, routeConfigs, institutionId) => {
  const defaultMods = getStudentModules(areaId);
  // Busca primero la config específica del colegio, luego la global
  const config = routeConfigs?.[routeKey(areaId, institutionId)]
    || routeConfigs?.[routeKey(areaId, null)];
  if (!config || (!config.modules?.length && !config.customModules?.length)) return defaultMods;

  const configMap = {};
  (config.modules || []).forEach(mc => { configMap[mc.id] = mc; });

  const sorted = [...defaultMods]
    .sort((a, b) => (configMap[a.id]?.order ?? 999) - (configMap[b.id]?.order ?? 999))
    .filter(m => configMap[m.id] ? configMap[m.id].enabled !== false : true)
    .map(m => ({
      ...m,
      ...(configMap[m.id]?.override || {}),
      extras: configMap[m.id]?.extras || [],
    }));

  (config.customModules || [])
    .filter(cm => cm.enabled !== false)
    .forEach(cm => {
      const isChallenge = cm.type === 'challenge';
      const mod = {
        id: cm.id,
        type: cm.type || 'lesson',
        ctype: cm.ctype || null,
        title: cm.title,
        subtitle: isChallenge ? 'Reto' : 'Módulo adicional',
        desc: cm.desc || '', xp: cm.xp || 50, req: [], area: areaId,
        content: cm.content || [],
        questions: cm.questions || [],
        isCustom: true, badge: null,
        pos: { x: 50, y: cm.order || 0 }, side: 'right',
        task: cm.task || '', extras: [],
      };
      const insertAt = sorted.findIndex(m => (configMap[m.id]?.order ?? 999) > (cm.order ?? 999));
      if (insertAt === -1) sorted.push(mod); else sorted.splice(insertAt, 0, mod);
    });

  return sorted;
};

const findModuleInConfig = (id) => {
  const configs = XS.get().routeConfigs;
  for (const area of Object.keys(configs)) {
    const found = (configs[area].customModules || []).find(m => m.id === id);
    if (found) return {
      id: found.id,
      type: found.type || 'lesson',
      ctype: found.ctype || null,
      title: found.title,
      subtitle: found.type === 'challenge' ? 'Reto' : 'Módulo adicional',
      desc: found.desc || '',
      xp: found.xp || 50,
      req: [],
      content: found.content || [],
      questions: found.questions || [],
      isCustom: true,
      task: found.task || '',
      extras: [],
    };
  }
  return null;
};

const updateAvatar = (url) => {
  const { user } = XS.get();
  XS.set(s => ({
    user: s.user ? { ...s.user, avatar: url } : null,
    accounts: s.accounts.map(a => a.id === s.user?.id ? { ...a, avatar: url } : a),
  }));
  if (user?.id) {
    supabase.from('profiles').update({ avatar: url }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('updateAvatar:', error); });
  }
};
const dismissNotif = id => XS.set(s=>({notifications:s.notifications.filter(n=>n.id!==id)}));
const dismissStudentMessage = (msgId) => XS.set(s=>({studentMessages:(s.studentMessages||[]).map(m=>m.id===msgId?{...m,read:true}:m)}));

const changeAccountArea = (email, newArea) => {
  XS.set(s => ({ accounts: s.accounts.map(a => a.email === email ? { ...a, area: newArea } : a) }));
  supabase.from('profiles').update({ area: newArea }).eq('email', email)
    .then(({ error }) => { if (error) console.error('changeAccountArea:', error); });
};

const createAccount = (name, email, pass, role, area, institution) => {
  const avatar = name.trim().charAt(0).toUpperCase();
  // Optimistic local update para que la UI responda de inmediato
  XS.set(s => ({ accounts: [...s.accounts, { email:email.trim(), pass, name:name.trim(), avatar, role, area:area||null, institution:institution||'' }] }));
  // Crear en Supabase via Edge Function
  supabase.functions.invoke('bulk-create-users', {
    body: { users: [{ name: name.trim(), email: email.trim(), pass, role, area: area||null }] }
  }).then(({ data, error }) => {
    if (error) console.error('createAccount error:', error);
    else if (data?.results?.[0]?.ok === false) console.error('createAccount failed:', data.results[0].error);
  });
};
const deleteAccount = (email) => {
  // Optimistic: quitar de la UI inmediatamente
  XS.set(s => ({ accounts: s.accounts.filter(a => a.email !== email) }));
  // Borrar de Supabase Auth via Edge Function
  supabase.functions.invoke('delete-user', { body: { email } })
    .then(({ data, error }) => {
      if (error) console.error('deleteAccount error:', error);
      else if (data?.error) console.error('deleteAccount failed:', data.error);
    });
};

const bulkCreateAccounts = (users) => {
  const { institutions } = XS.get();
  const instByName = {};
  (institutions || []).forEach(i => { instByName[i.name.toLowerCase().trim()] = i.id; });

  // Optimistic local update
  XS.set(s => {
    const existing = new Set(s.accounts.map(a => a.email));
    const newAccounts = users.filter(u => !existing.has(u.email.trim()))
      .map(u => ({ email:u.email.trim(), pass:u.pass.toString(), name:u.name.trim(),
        avatar:u.name.trim().charAt(0).toUpperCase(), role:u.role||'student', area:u.area||null, institution:u.institution||'' }));
    return { accounts: [...s.accounts, ...newAccounts] };
  });
  // Resolver institution_id antes de llamar al edge function
  const usersWithIds = users.map(u => ({
    ...u,
    institution_id: instByName[(u.institution || '').toLowerCase().trim()] || null,
  }));
  supabase.functions.invoke('bulk-create-users', { body: { users: usersWithIds } })
    .then(({ data, error }) => {
      if (error) console.error('bulkCreate error:', error);
    });
};

const createInstitution = (name) => {
  const tempId = 'inst_' + Date.now();
  XS.set(s => ({ institutions: [...(s.institutions || INITIAL_INSTITUTIONS), { id: tempId, name, logo: null }] }));
  supabase.from('institutions').insert({ name }).select().single().then(({ data, error }) => {
    if (error) { console.error('createInstitution:', error); return; }
    XS.set(s => ({ institutions: (s.institutions || []).map(i => i.id === tempId ? { ...i, id: data.id } : i) }));
  });
};
const updateInstitution = (id, name) => {
  XS.set(s => ({ institutions: (s.institutions || []).map(i => i.id === id ? { ...i, name } : i) }));
  supabase.from('institutions').update({ name }).eq('id', id).then(({ error }) => {
    if (error) console.error('updateInstitution:', error);
  });
};
const deleteInstitution = (id) => {
  XS.set(s => ({ institutions: (s.institutions || []).filter(i => i.id !== id) }));
  supabase.from('institutions').delete().eq('id', id).then(({ error }) => {
    if (error) console.error('deleteInstitution:', error);
  });
};

// ---- Módulos de curso para estudiante ----
const loadCourseModules = async (courseId) => {
  if (!courseId) return;
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_enabled', true)
    .order('"order"');
  if (error) { console.error('loadCourseModules:', error); return; }
  XS.set({
    courseModules: (data || []).map(dbModToAppMod),
    enrolledCourseId: courseId,
  });
};

const enrollInCourse = async (courseId) => {
  const { user } = XS.get();
  if (!user?.id) return;
  // Crear o actualizar matrícula
  await supabase.from('course_enrollments').upsert(
    { student_id: user.id, course_id: courseId, institution_id: null },
    { onConflict: 'student_id,course_id' }
  );
  // Crear registro de progreso si no existe
  await supabase.from('course_progress').upsert(
    { user_id: user.id, course_id: courseId, xp: 0, completed: [], badges: [] },
    { onConflict: 'user_id,course_id' }
  );
  await loadCourseModules(courseId);
  // Limpiar progreso en memoria y cargar desde course_progress
  const { data: cp } = await supabase.from('course_progress')
    .select('*').eq('user_id', user.id).eq('course_id', courseId).single();
  XS.set({
    xp: cp?.xp || 0,
    completed: cp?.completed || [],
    badges: cp?.badges || [],
  });
};

// ---- Cursos (multi-ruta) ----
const loadCourses = async () => {
  const [{ data: coursesData }, { data: icData }] = await Promise.all([
    supabase.from('courses').select('*').order('created_at'),
    supabase.from('institution_courses').select('*'),
  ]);
  XS.set({
    courses: coursesData || [],
    institutionCourses: icData || [],
  });
};

const createCourse = async ({ name, description, color, coverImage }) => {
  const { data, error } = await supabase.from('courses').insert({
    name, description, color: color || '#E8732C',
    cover_image: coverImage || null, is_active: true,
  }).select().single();
  if (error) { console.error('createCourse:', error); throw new Error(error.message); }
  await loadCourses();
  return data;
};

const updateCourse = async (id, fields) => {
  const { error } = await supabase.from('courses').update({
    ...fields,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) { console.error('updateCourse:', error); return; }
  await loadCourses();
};

const deleteCourse = async (id) => {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) { console.error('deleteCourse:', error); return; }
  await loadCourses();
};

const toggleCourseForInstitution = async (courseId, institutionId, active) => {
  const { institutionCourses } = XS.get();
  const existing = institutionCourses.find(
    ic => ic.course_id === courseId && ic.institution_id === institutionId
  );
  if (existing) {
    await supabase.from('institution_courses')
      .update({ is_active: active }).eq('id', existing.id);
  } else {
    await supabase.from('institution_courses')
      .insert({ course_id: courseId, institution_id: institutionId, is_active: active });
  }
  await loadCourses();
};

export {
  useStore, AREAS, BADGES, LEVELS, RUBRIC_CRITERIA, ALL_MODULES, AREA_CONTENT,
  INITIAL_INSTITUTIONS,
  getStudentModules, findModule,
  calcLevel, xpForNext, xpProgress, nodeStatus, progressPct, isRouteComplete, gradeTotal, gradeMax,
  nav, doLogout, selectArea, changeArea, completeNode, recordAttempt,
  submitProduct, resubmitProduct, gradeSubmission, returnSubmission, approveSubmission,
  dismissNotif, dismissStudentMessage, updateAvatar, resetStudentProgress,
  loadRouteConfigs, saveRouteConfig, getRouteModules, findModuleInConfig, routeKey,
  loadInstructorInstitutions, assignInstructorInstitution, removeInstructorInstitution,
  assignRouteToInstitution,
  createAccount, deleteAccount, changeAccountArea,
  bulkCreateAccounts, createInstitution, updateInstitution, deleteInstitution,
  loadCourses, createCourse, updateCourse, deleteCourse, toggleCourseForInstitution,
  loadCourseModules, enrollInCourse, dbModToAppMod,
};
