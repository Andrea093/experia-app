// Prueba 0088 sobre PGlite: vigencia por calendario, historial de clases en
// vivo del estudiante (solo las suyas, terminadas, sin encuestas, con las
// preguntas sin responder) y comentarios de profesores (quién puede escribir y
// leer, y que el autor no se pueda falsear).
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0088_calendario_historial_comentarios.sql');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => {
  const [a, b] = [JSON.stringify(real), JSON.stringify(esp)];
  a === b ? ok(`${n} = ${a}`) : bad(`${n}: esperado ${b}, obtenido ${a}`);
};

const COL_A = 'c0000000-0000-0000-0000-00000000000a';
const COL_B = 'c0000000-0000-0000-0000-00000000000b';
const ANA = '22222222-2222-2222-2222-222222222222';   // estudiante, colegio B
const BETO = '33333333-3333-3333-3333-333333333333';  // estudiante, colegio B
const PROFE = '55555555-5555-5555-5555-555555555555';
const ADMIN = '66666666-6666-6666-6666-666666666666';
const S1 = '11111111-1111-1111-1111-111111111111';    // terminada (reciente)
const S2 = '11111111-1111-1111-1111-111111111112';    // activa
const S3 = '11111111-1111-1111-1111-111111111113';    // terminada hace dos años (vencida)
const RQ = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';     // ronda
const RP = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';     // encuesta

const db = await PGlite.create();
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create type public.user_role as enum ('student', 'instructor', 'admin');
  create table public.institutions (id uuid primary key, name text);
  create table public.profiles (id uuid primary key, email text, name text, role public.user_role, institution_id uuid);
  create table public.courses (id uuid primary key, name text);
  create table public.course_modules (id uuid primary key, title text, challenge_type text, challenge_data jsonb);
  create table public.live_sessions (id uuid primary key, course_id uuid, title text, status text, created_at timestamptz default now(), ended_at timestamptz);
  create table public.live_participants (id uuid primary key, session_id uuid, user_id uuid, score int default 0);
  create table public.live_answers (id uuid primary key default gen_random_uuid(), session_id uuid, participant_id uuid, module_id uuid,
    question_index int, answer_index int, is_correct boolean, created_at timestamptz default now());
  create function public.is_instructor() returns boolean language sql stable as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'instructor') $$;
  create function public.is_admin() returns boolean language sql stable as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

  insert into public.institutions values ('${COL_A}', 'Colegio A'), ('${COL_B}', 'Colegio B');
  insert into public.profiles values
    ('${ANA}', 'ana@x.co', 'Ana', 'student', '${COL_B}'), ('${BETO}', 'beto@x.co', 'Beto', 'student', '${COL_B}'),
    ('${PROFE}', 'profe@x.co', 'Profe', 'instructor', '${COL_A}'), ('${ADMIN}', 'admin@x.co', 'Admin', 'admin', null);
  insert into public.courses values ('99999999-9999-9999-9999-999999999999', 'Matemáticas');
  insert into public.course_modules values
    ('${RQ}', 'Primera ronda', 'quiz', '{"bank":"matematicas","questions":[{"question":"¿2+2?","options":["3","4"],"correct":1},{"question":"¿3+3?","options":["6","7"],"correct":0}]}'),
    ('${RP}', 'Encuesta', 'poll', '{"questions":[{"question":"¿Te gustó?","options":["Sí","No"]}]}');
  insert into public.live_sessions values
    ('${S1}', '99999999-9999-9999-9999-999999999999', 'Clase 1', 'ended', now() - interval '1 hour', now()),
    ('${S2}', '99999999-9999-9999-9999-999999999999', 'Clase 2', 'active', now(), null),
    ('${S3}', '99999999-9999-9999-9999-999999999999', 'Clase vieja', 'ended', now() - interval '2 years', now() - interval '2 years');
  insert into public.live_participants values
    ('a1000000-0000-0000-0000-000000000001', '${S1}', '${ANA}', 900),
    ('b1000000-0000-0000-0000-000000000001', '${S1}', '${BETO}', 400),
    ('a2000000-0000-0000-0000-000000000001', '${S2}', '${ANA}', 0),
    ('a3000000-0000-0000-0000-000000000001', '${S3}', '${ANA}', 100);
  -- S1: Ana responde la 0 (bien); Beto responde la 0 y la 1; Ana no alcanza la 1. Encuesta: ambos.
  insert into public.live_answers (session_id, participant_id, module_id, question_index, answer_index, is_correct) values
    ('${S1}', 'a1000000-0000-0000-0000-000000000001', '${RQ}', 0, 1, true),
    ('${S1}', 'b1000000-0000-0000-0000-000000000001', '${RQ}', 0, 0, false),
    ('${S1}', 'b1000000-0000-0000-0000-000000000001', '${RQ}', 1, 0, true),
    ('${S1}', 'a1000000-0000-0000-0000-000000000001', '${RP}', 0, 0, null),
    ('${S3}', 'a3000000-0000-0000-0000-000000000001', '${RQ}', 0, 1, true);`);

try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0088 aplica'); } catch (e) { bad('0088 falló: ' + e.message); process.exit(1); }
try { await db.exec(fs.readFileSync(MIG, 'utf8')); ok('0088 es idempotente'); } catch (e) { bad('segunda corrida: ' + e.message); }

const como = (uid) => db.exec(`select set_config('test.uid', '${uid || ''}', false)`);
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];

console.log('\nVigencia por calendario');
esperar('B, clase en noviembre 2026', await scalar(`select public.live_review_until('2026-11-18 10:00-05', 'B')::text`), '2027-03-31');
esperar('B, clase en febrero 2027', await scalar(`select public.live_review_until('2027-02-10 10:00-05', 'B')::text`), '2027-03-31');
esperar('A, clase en noviembre 2026', await scalar(`select public.live_review_until('2026-11-18 10:00-05', 'A')::text`), '2027-06-30');
esperar('A, clase en mayo 2027', await scalar(`select public.live_review_until('2027-05-02 10:00-05', 'A')::text`), '2027-06-30');
esperar('sin calendario', await scalar(`select public.live_review_until(now(), null)`), null);
try { await db.exec(`update public.institutions set calendar = 'C' where id = '${COL_A}'`); bad('calendario C debía fallar'); }
catch { ok('calendario inválido rechazado'); }

console.log('\nHistorial del estudiante (colegio sin calendario: sin límite)');
await como(ANA);
let h = await scalar(`select public.live_my_history()`);
esperar('sesiones de Ana (solo terminadas, la más reciente primero)', h.map(x => x.title), ['Clase 1', 'Clase vieja']);
const c1 = h[0];
esperar('preguntas de la clase 1 (sin la encuesta)', c1.items.length, 2);
esperar('la 0: respondió y acertó', [c1.items[0].answered, c1.items[0].correct, c1.items[0].answer], [true, true, 1]);
esperar('la 1: no alcanzó a responder', [c1.items[1].answered, c1.items[1].correct], [false, false]);
esperar('trae la pregunta completa para repasar', c1.items[1].question.correct, 0);
esperar('puntaje', c1.score, 900);

console.log('\nCon calendario B, la clase de hace dos años ya venció');
await db.exec(`update public.institutions set calendar = 'B' where id = '${COL_B}'`);
h = await scalar(`select public.live_my_history()`);
esperar('sesiones visibles', h.map(x => x.title), ['Clase 1']);
esperar('trae su fecha límite', !!h[0].available_until, true);

console.log('\nOtro estudiante solo ve lo suyo');
await como(BETO);
h = await scalar(`select public.live_my_history()`);
esperar('Beto: una clase, dos respuestas', [h.length, h[0].items.filter(i => i.answered).length], [1, 2]);
await como(null);
try { await db.query(`select public.live_my_history()`); bad('sin sesión debía fallar'); } catch { ok('sin sesión: rechazado'); }

console.log('\nComentarios de profesores');
await db.exec(`grant all on public.platform_feedback to authenticated`);
await db.exec(`create role tester; grant authenticated to tester; grant usage on schema auth, public to tester; grant all on all tables in schema public to tester; grant execute on all functions in schema public, auth to tester;`);
const comoRol = async (uid, fn) => { await como(uid); await db.exec('set role tester'); try { return await fn(); } finally { await db.exec('reset role'); } };
await comoRol(PROFE, () => db.exec(`insert into public.platform_feedback (message, page, rating, user_name) values ('El cronómetro debería verse más grande', 'live-host', 4, 'Nombre falso')`));
const fila = (await db.query(`select user_id, user_name, role, institution_id, status from public.platform_feedback`)).rows[0];
esperar('autor tomado del perfil (no el que mandó el navegador)', [fila.user_id, fila.user_name, fila.role, fila.institution_id, fila.status], [PROFE, 'Profe', 'instructor', COL_A, 'nuevo']);
try { await comoRol(ANA, () => db.exec(`insert into public.platform_feedback (message) values ('hola mundo')`)); bad('estudiante no debía poder comentar'); }
catch { ok('estudiante: no puede comentar'); }
try { await comoRol(PROFE, () => db.exec(`insert into public.platform_feedback (message) values ('x')`)); bad('mensaje vacío debía fallar'); }
catch { ok('mensaje demasiado corto: rechazado'); }
esperar('el profesor no ve los comentarios', await comoRol(PROFE, () => scalar(`select count(*)::int from public.platform_feedback`)), 0);
esperar('el admin sí los ve', await comoRol(ADMIN, () => scalar(`select count(*)::int from public.platform_feedback`)), 1);

console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTodo OK');
process.exit(fallos ? 1 : 0);
