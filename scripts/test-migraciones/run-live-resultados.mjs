// Prueba 0086 sobre PGlite: la segunda ronda registra y suma aunque repita el
// número de pregunta, no se puede responder dos veces, y live_my_results cuenta
// bien (encuestas fuera, preguntas sin responder dentro, token y momento validados).
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0086_live_resultados_competencia.sql');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => {
  const [a, b] = [JSON.stringify(real), JSON.stringify(esp)];
  a === b ? ok(`${n} = ${a}`) : bad(`${n}: esperado ${b}, obtenido ${a}`);
};

const S = '11111111-1111-1111-1111-111111111111';
const ANA = '22222222-2222-2222-2222-222222222222';
const BETO = '33333333-3333-3333-3333-333333333333';
const TOKEN = '44444444-4444-4444-4444-444444444444';
const R1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const R2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const db = await PGlite.create();
await db.exec(`
  create role anon; create role authenticated;
  create table public.live_sessions (id uuid primary key, module_id uuid, status text default 'active', phase text, current_index int,
    question_started_at timestamptz, time_limit_s int, questions jsonb);
  create table public.live_session_keys (session_id uuid primary key, answer_key jsonb);
  create table public.live_participants (id uuid primary key, session_id uuid, claim_token uuid, score int default 0,
    streak int default 0, last_seen timestamptz);
  create table public.course_modules (id uuid primary key, challenge_data jsonb);
  -- Igual que 0022: UNIQUE sin nombre explícito.
  create table public.live_answers (id uuid primary key default gen_random_uuid(), session_id uuid, participant_id uuid,
    question_index int not null, answer_index int, is_correct boolean, response_ms int, points int not null default 0,
    created_at timestamptz default now(), unique (participant_id, question_index));
  insert into public.course_modules values
    ('${R1}', '{"bank":"matematicas","questions":[{"evidencia":"1.1"},{"evidencia":"2.1"}]}'),
    ('${R2}', '{"bank":"matematicas","questions":[{"evidencia":"1.2"},{"evidencia":"3.1"}]}');
  insert into public.live_sessions values ('${S}', '${R1}', 'active', 'question', 0, now(), 120, '[{"time_limit_s":120},{"time_limit_s":120}]');
  insert into public.live_session_keys values ('${S}', '[{"correct":1,"points":1000},{"correct":0,"points":1000}]');
  insert into public.live_participants (id, session_id, claim_token) values ('${ANA}', '${S}', '${TOKEN}'), ('${BETO}', '${S}', null);`);

try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0086 aplica'); } catch (e) { bad('0086 falló: ' + e.message); process.exit(1); }
try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0086 es idempotente'); } catch (e) { bad('segunda corrida: ' + e.message); }

const responder = async (part, idx, ans, token = null) =>
  (await db.query(`select public.submit_live_answer('${S}', '${part}', ${idx}, ${ans}, ${token ? `'${token}'` : 'null'}) as r`)).rows[0].r;
const abrir = (mod, idx, key) => db.exec(`
  update public.live_sessions set module_id = '${mod}', phase = 'question', current_index = ${idx}, question_started_at = now() where id = '${S}';
  ${key ? `update public.live_session_keys set answer_key = '${key}' where session_id = '${S}';` : ''}`);
const resultados = async (part, token = null) =>
  (await db.query(`select public.live_my_results('${S}', '${part}', ${token ? `'${token}'` : 'null'}) as r`)).rows[0].r;
const falla = async (n, fn, msg) => {
  try { await fn(); bad(`${n}: debía fallar`); }
  catch (e) { e.message.includes(msg) ? ok(`${n}: rechazado`) : bad(`${n}: error inesperado: ${e.message}`); }
};

// Primera ronda. Ana acierta la 0.
let r = await responder(ANA, 0, 1, TOKEN);
esperar('ronda 1, pregunta 0: acierto', r.is_correct, true);
const puntajeR1 = r.points;
r = await responder(ANA, 0, 1, TOKEN);
esperar('doble respuesta en la misma ronda', r.already, true);
await responder(BETO, 0, 0);
await falla('resultados antes de terminar', () => resultados(ANA, TOKEN), 'aún no termina');

await abrir(R1, 1);
await responder(ANA, 1, 1, TOKEN);   // Ana falla la 1. Beto no responde.

// Segunda ronda: repite los números de pregunta. Es el bug que corrige 0086.
await abrir(R2, 0, '[{"correct":2,"points":1000},{"correct":3,"points":1000}]');
r = await responder(ANA, 0, 2, TOKEN);
esperar('ronda 2, misma pregunta 0: no es "already"', r.already, false);
esperar('ronda 2, pregunta 0: acierto', r.is_correct, true);
r = await responder(ANA, 0, 2, TOKEN);
esperar('doble respuesta en la ronda 2', r.already, true);
await responder(BETO, 0, 0);

const { rows: [ana] } = await db.query(`select score, streak from public.live_participants where id = '${ANA}'`);
ana.score > puntajeR1 ? ok(`la ronda 2 suma al puntaje (${puntajeR1} → ${ana.score})`) : bad(`la ronda 2 no sumó: ${ana.score}`);

// La pregunta 1 de la ronda 2 es una encuesta: no se califica.
await abrir(R2, 1, '[{"correct":2,"points":1000},{"points":0}]');
await responder(ANA, 1, 0, TOKEN);

await db.exec(`update public.live_sessions set status = 'ended', phase = 'podium' where id = '${S}'`);

const resAna = (await resultados(ANA, TOKEN)).items;
esperar('total sin la encuesta', resAna.length, 3);
esperar('aciertos de Ana', resAna.filter(i => i.correct).length, 2);
esperar('evidencias de Ana', resAna.map(i => i.evidencia).sort(), ['1.1', '1.2', '2.1']);
esperar('área', [...new Set(resAna.map(i => i.bank))], ['matematicas']);

const resBeto = (await resultados(BETO)).items;
esperar('Beto ve también la que no respondió', resBeto.length, 3);
esperar('Beto: respondidas', resBeto.filter(i => i.answered).length, 2);
esperar('Beto: aciertos', resBeto.filter(i => i.correct).length, 0);

await falla('token ajeno', () => resultados(ANA, BETO), 'No autorizado');
await falla('sin token', () => resultados(ANA), 'No autorizado');

// El profesor finaliza antes de tiempo: la ronda tiene 2 preguntas y solo se hizo
// la primera. El total debe ser 1, no 2.
const S2 = '55555555-5555-5555-5555-555555555555';
const CARLA = '66666666-6666-6666-6666-666666666666';
await db.exec(`
  insert into public.live_sessions values ('${S2}', '${R1}', 'active', 'question', 0, now(), 120, '[{"time_limit_s":120},{"time_limit_s":120}]');
  insert into public.live_session_keys values ('${S2}', '[{"correct":1,"points":1000},{"correct":0,"points":1000}]');
  insert into public.live_participants (id, session_id) values ('${CARLA}', '${S2}');`);
const resultados2 = async () => (await db.query(`select public.live_my_results('${S2}', '${CARLA}') as r`)).rows[0].r.items;
const terminar2 = () => db.exec(`update public.live_sessions set status = 'ended', phase = 'podium' where id = '${S2}'`);

await terminar2();
esperar('clase terminada sin ninguna respuesta', await resultados2(), []);

await db.exec(`update public.live_sessions set status = 'active', phase = 'question' where id = '${S2}'`);
await db.query(`select public.submit_live_answer('${S2}', '${CARLA}', 0, 1)`);
await terminar2();
const parcial = await resultados2();
esperar('finalizar antes de tiempo: solo la pregunta que se hizo', parcial.length, 1);
esperar('finalizar antes de tiempo: su evidencia', parcial[0].evidencia, '1.1');
esperar('finalizar antes de tiempo: acierto', parcial[0].correct, true);

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exit(fallos ? 1 : 0);
