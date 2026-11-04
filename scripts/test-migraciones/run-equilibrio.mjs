// Prueba 0084 (distribución por competencias de la Guía Saber 11) sobre PGlite:
// - la función SQL da el MISMO veredicto que checkRound del frontend;
// - una ronda desequilibrada del banco se reemplaza; una equilibrada se conserva;
// - una con preguntas propias no se toca, pero el servidor no deja entrar a ella;
// - es idempotente.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const read = (p) => fs.readFileSync(p, 'utf8');
const { checkRound, SABER_GUIDES } = await import(pathToFileURL(path.join(ROOT, 'src/lib/saberGuide.js')).href);
const bank = JSON.parse(read(path.join(ROOT, 'src/lib/questionBank.json')));

let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column draft_modules jsonb;
  create role authenticated;
  create table public.live_sessions (id uuid primary key default gen_random_uuid(), module_id uuid);`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const byId = Object.fromEntries(bank.questions.map(x => [x.id, x]));
// Pregunta como quedó en la BD antes de 0084: sin evidencia.
const vieja = (id) => ({ id, question: byId[id].question, options: byId[id].options, correct: byId[id].correct });
const ronda = async (course, order, area, n, questions, type = 'challenge') => (await q(
  `insert into public.course_modules (course_id, title, "order", content, type, challenge_type, challenge_data)
   values ($1,$2,$3,'[]',$4,'quiz',$5) returning id`,
  [course, `Ronda ${order}`, order, type, JSON.stringify({ bank: area, bankRound: n, passingScore: 0, questions })]))[0].id;

await q(`insert into public.courses (id, name) values ($1,'Sala de Escape')`, [U(1)]);
await q(`insert into public.courses (id, name, draft_modules) values ($1,'Sala — Colegio A','[{"bank":"matematicas"}]')`, [U(2)]);

// Las de antes (no cumplen: 4 de argumentación en vez de 2).
const viejaR1 = ['mate-01', 'mate-02', 'mate-03', 'mate-04', 'mate-05', 'mate-06', 'mate-07', 'mate-08', 'mate-14', 'mate-15'];
const desequilibrada = await ronda(U(1), 4, 'matematicas', 1, viejaR1.map(vieja));
// Elegida por un tutor, ya cumple 4/4/2: se conserva tal cual.
const elegidas = ['mate-04', 'mate-06', 'mate-08', 'mate-12', 'mate-05', 'mate-10', 'mate-11', 'mate-14', 'mate-01', 'mate-09'];
const equilibrada = await ronda(U(1), 6, 'matematicas', 2, elegidas.map(vieja));
// Con una pregunta propia: no se toca y queda bloqueada.
const propia = await ronda(U(2), 4, 'matematicas', 1, [...viejaR1.map(vieja), { id: 'q_1a2b3c4d', question: 'Mía', options: ['a', 'b'], correct: 0 }]);
const leccion = (await q(`insert into public.course_modules (course_id, title, "order", content) values ($1,'Apertura',1,'[]') returning id`, [U(1)]))[0].id;
const titulosAntes = JSON.stringify(await q(`select id, title, "order", xp from public.course_modules order by id`));

console.log('\n=== 0084 ===');
const MIG = path.join(ROOT, 'supabase/migrations/0084_equilibrio_competencias_saber.sql');
let est;
try { est = (await db.exec(read(MIG))).at(-1).rows; ok('0084 aplica'); }
catch (e) { bad(`0084 falló: ${e.message}`); process.exit(1); }
const estado = (id) => q(`select challenge_data from public.course_modules where id=$1`, [id]).then(r => r[0].challenge_data);
const conteo = (s) => est.filter(r => r.estado.startsWith(s)).length;
esperar('EQUILIBRADA', conteo('EQUILIBRADA'), 1);
esperar('REEMPLAZADA', conteo('REEMPLAZADA'), 1);
esperar('NO TOCADO', conteo('NO TOCADO'), 1);
esperar('BORRADOR PENDIENTE', conteo('BORRADOR'), 1);

const d = await estado(desequilibrada);
esperar('reemplazada = predeterminadas', d.questions.map(x => x.id).join(), bank.defaults.matematicas.r1.join());
esperar('reemplazada cumple en el frontend', checkRound('matematicas', d.questions).ok, true);
esperar('reemplazada conserva sus ajustes', d.bankRound, 1);
const e = await estado(equilibrada);
esperar('equilibrada conserva sus preguntas', e.questions.map(x => x.id).join(), elegidas.join());
esperar('equilibrada recibe evidencias', e.questions.every(x => x.evidencia), true);
const p = await estado(propia);
esperar('propia conserva sus 11 preguntas', p.questions.length, 11);
esperar('propia: las del banco reciben evidencia', p.questions.slice(0, 10).every(x => x.evidencia), true);
esperar('título, orden y XP intactos', JSON.stringify(await q(`select id, title, "order", xp from public.course_modules order by id`)), titulosAntes);

console.log('\n=== Trigger en la clase en vivo ===');
const sesion = (await q(`insert into public.live_sessions (module_id) values (null) returning id`))[0].id;
const entrar = async (mod) => { try { await q(`update public.live_sessions set module_id=$1 where id=$2`, [mod, sesion]); return null; } catch (err) { return err.message; } };
esperar('entra a una lección', await entrar(leccion), null);
esperar('entra a la ronda equilibrada', await entrar(equilibrada), null);
const rechazo = await entrar(propia);
rechazo?.includes('no cumple la distribución') ? ok(`rechaza la desequilibrada: ${rechazo}`) : bad(`debió rechazar: ${rechazo}`);

console.log('\n=== SQL y frontend dan el mismo veredicto ===');
// Muestras al azar (semilla fija) de todas las áreas y de varios tamaños.
let seed = 42;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
let casos = 0, cumplen = 0, distintos = 0;
for (const area of Object.keys(SABER_GUIDES)) {
  const pool = bank.questions.filter(x => x.area === area);
  for (const n of [0, 3, 5, 7, 10, 11, 12, 15, 20]) {
    const armados = [];
    for (let i = 0; i < 25; i++) armados.push(Array.from({ length: n }, () => pool[rnd(pool.length)]));
    // Además, una que cumple exacto: la toma del frontend por competencia.
    const req = checkRound(area, Array.from({ length: n }, () => pool[0])).rows;
    const exacta = req.flatMap(r => pool.filter(x => SABER_GUIDES[area].competencias.find(c => c.id === r.id)
      .afirmaciones.some(a => a.evidencias[x.evidencia])).slice(0, r.required));
    armados.push(exacta);
    for (const qs of armados) {
      const js = checkRound(area, qs).ok;
      const minimos = qs.map(x => ({ id: x.id, evidencia: x.evidencia }));
      const [{ problema }] = await q(`select public.saber_round_problem($1::jsonb) as problema`, [JSON.stringify({ bank: area, questions: minimos })]);
      casos++; if (js) cumplen++;
      if (js !== (problema === null)) { distintos++; console.log('  distinto', area, n, js, problema); }
    }
  }
}
esperar(`discrepancias en ${casos} casos (${cumplen} cumplen)`, distintos, 0);
esperar('el catálogo produjo casos que cumplen', cumplen > 0, true);

console.log('\n=== Idempotente ===');
const antes = JSON.stringify(await q(`select id, challenge_data from public.course_modules order by id`));
est = (await db.exec(read(MIG))).at(-1).rows;
esperar('la segunda vez no cambia nada', JSON.stringify(await q(`select id, challenge_data from public.course_modules order by id`)) === antes, true);
esperar('ahora equilibradas', conteo('EQUILIBRADA'), 2);
esperar('ya no reemplaza', conteo('REEMPLAZADA'), 0);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
