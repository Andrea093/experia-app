// Prueba el seed 0060 (curso demo "Por qué esa es la respuesta") sobre un
// Postgres real: que aplique, que sea idempotente y que el contenido tenga la
// forma que renderiza el frontend.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG  = path.resolve(HERE, '..', '..', 'supabase', 'migrations');
const SEED = path.join(MIG, '0060_seed_curso_por_que_esa_respuesta.sql');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok  = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));

console.log('\n=== APLICACIÓN ===');
try { await db.exec(read(SEED)); ok('0060 aplica'); }
catch (e) { bad(`0060 falló: ${e.message}`); process.exit(1); }
try { await db.exec(read(SEED)); ok('0060 es idempotente (reejecutable)'); }
catch (e) { bad(`no es idempotente: ${e.message}`); }

const q = async (sql) => (await db.query(sql)).rows;

console.log('\n=== ESTRUCTURA DEL CURSO ===');
esperar('cursos con ese nombre (no se duplica)',
  (await q(`select count(*)::int c from public.courses where name='Por qué esa es la respuesta'`))[0].c, 1);
esperar('módulos', (await q(`select count(*)::int c from public.course_modules m join public.courses c on c.id=m.course_id where c.name='Por qué esa es la respuesta'`))[0].c, 3);
esperar('tema visual en NULL (no colisiona con el seed 0021)',
  (await q(`select coalesce(theme,'NULL') t from public.courses where name='Por qué esa es la respuesta'`))[0].t, 'NULL');

const mods = await q(`select m."order", m.title, m.type, m.challenge_type, m.requirements, m.area_id
                        from public.course_modules m join public.courses c on c.id=m.course_id
                       where c.name='Por qué esa es la respuesta' order by m."order"`);
console.log('       ' + mods.map(m => `${m.order}. ${m.title} [${m.type}${m.challenge_type ? '/' + m.challenge_type : ''}]`).join('\n       '));
esperar('el quiz es el módulo 2', mods[1]?.challenge_type, 'quiz');

// area_id DEBE ir en NULL: dbRowsToCourseModules (store.jsx) filtra los módulos
// por el área seleccionada del estudiante, así que un area_id distinto de la
// suya los esconde TODOS y el mapa muestra 'Ruta en preparación'.
esperar('módulos con area_id NULL (visibles en cualquier área)',
  (await q(`select count(*)::int c from public.course_modules m join public.courses c on c.id=m.course_id where c.name='Por qué esa es la respuesta' and m.area_id is null`))[0].c, 3);

// Encadenamiento: cada módulo exige el anterior, y el UUID debe existir
const enc = await q(`select count(*)::int c from public.course_modules m
                      where m.requirements <> '{}'
                        and exists (select 1 from public.course_modules p where p.id::text = m.requirements[1])`);
esperar('módulos encadenados con un UUID real', enc[0].c, 2);

console.log('\n=== EL QUIZ ===');
const cd = (await q(`select challenge_data cd from public.course_modules where challenge_type='quiz'`))[0].cd;
esperar('preguntas', cd.questions.length, 3);
esperar('preguntas con análisis (explanation)', cd.questions.filter(x => x.explanation).length, 3);
esperar('preguntas con timeLimit (Modo Aula en Vivo)', cd.questions.filter(x => x.timeLimit).length, 3);
esperar('preguntas con points', cd.questions.filter(x => x.points).length, 3);
esperar('preguntas con difficulty', cd.questions.filter(x => x.difficulty).length, 3);
esperar('todas con 4 opciones', cd.questions.every(x => x.options.length === 4), 'true');
esperar('índice correcto dentro de rango', cd.questions.every(x => x.correct >= 0 && x.correct < x.options.length), 'true');
esperar('el passage tiene párrafos', cd.passage.paragraphs.length, 3);

// El análisis debe estar ESTRUCTURADO: negrilla + saltos de línea + los 3 bloques
console.log('\n=== CALIDAD DEL ANÁLISIS ===');
cd.questions.forEach((x, i) => {
  const e = x.explanation;
  const problemas = [];
  if (!/\*\*/.test(e))                       problemas.push('sin negrilla');
  if (!e.includes('\n'))                     problemas.push('sin saltos de línea');
  if (!/Por qué cae|Por qué caen/.test(e))   problemas.push('no analiza los distractores');
  if (e.length < 500)                        problemas.push(`muy corto (${e.length})`);
  if (e.length > 1800)                       problemas.push(`demasiado largo (${e.length})`);
  // Debe nombrar las tres opciones incorrectas
  const letras = ['A','B','C','D'].filter((_, j) => j !== x.correct);
  const faltan = letras.filter(L => !e.includes(`**${L}**`));
  if (faltan.length) problemas.push(`no nombra ${faltan.join('/')}`);
  problemas.length
    ? bad(`P${i + 1}: ${problemas.join(', ')}`)
    : ok(`P${i + 1}: ${e.length} caracteres, estructurado, analiza los 3 distractores`);
});

console.log('\n=== LECCIONES ===');
for (const o of [1, 3]) {
  const c = (await q(`select content from public.course_modules where "order"=${o}`))[0].content;
  const tipos = c.map(s => s.type);
  const validos = ['intro','text','quote','steps','reveal','image','callout','concepts','compare','video','embed','checklist','download','pdf','pagebreak'];
  const malos = tipos.filter(t => !validos.includes(t));
  malos.length ? bad(`módulo ${o}: tipos de sección inválidos → ${malos}`)
               : ok(`módulo ${o}: ${c.length} secciones (${tipos.join(', ')})`);
  // steps/concepts/reveal usan claves t/d
  const items = c.filter(s => ['steps','concepts','reveal'].includes(s.type)).flatMap(s => s.items || []);
  const sinTD = items.filter(it => !it.t || !it.d);
  sinTD.length ? bad(`módulo ${o}: ${sinTD.length} item(s) sin claves t/d`)
               : ok(`módulo ${o}: ${items.length} items con claves t/d correctas`);
}

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
