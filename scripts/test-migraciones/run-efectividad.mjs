// Prueba la regla de 0059: los conteos A+B+C+D de una pregunta no pueden
// superar el total de estudiantes de su sección.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG  = path.resolve(HERE, '..', '..', 'supabase', 'migrations');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok  = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-clone.sql')));

// La migración termina con un SELECT de diagnóstico; exec() lo tolera.
await db.exec(read(path.join(MIG, '0059_efectividad_conteos_no_superan_total.sql')));
console.log('\n=== APLICACIÓN ===\n  OK    0059 aplica');
await db.exec(read(path.join(MIG, '0059_efectividad_conteos_no_superan_total.sql')));
console.log('  OK    0059 es idempotente');

const { rows: [g] } = await db.query(
  `insert into public.clone_groups (name) values ('11-A') returning id`);

const seccion = (total, qs) => JSON.stringify({ exploro: { total_estudiantes: total, questions: qs } });
const guardar = (sections, status = 'draft') => db.query(
  `insert into public.clone_effectiveness (group_id, sections, status) values ($1, $2::jsonb, $3) returning id`,
  [g.id, sections, status]);

const q = (n, a, b, c, d, extra = {}) => ({ n, correcta: 'A', a, b, c, d, aplicada: true, ...extra });

console.log('\n=== LA REGLA ===');

// 1. Caso normal: suman exactamente el total
try { await guardar(seccion(18, [q(1, 10, 4, 3, 1)])); ok('suma == total (18) se guarda'); }
catch (e) { bad(`suma == total fue rechazada: ${e.message}`); }

// 2. Suman menos: borrador legítimo
try { await guardar(seccion(18, [q(1, 5, 2, 0, 0)])); ok('suma < total se guarda (borrador a medias)'); }
catch (e) { bad(`suma < total fue rechazada: ${e.message}`); }

// 3. Suman más: debe bloquear
try {
  await guardar(seccion(18, [q(1, 10, 4, 3, 6)]));   // 23 > 18
  bad('suma > total SE GUARDÓ (la regla no está actuando)');
} catch (e) {
  if (/23 y solo hubo 18/.test(e.message)) ok(`suma > total bloqueada → "${e.message}"`);
  else bad(`bloqueó pero con otro mensaje: ${e.message}`);
}

// 4. El bloqueo también aplica al UPDATE, no solo al INSERT
const { rows: [r] } = await guardar(seccion(20, [q(1, 5, 5, 5, 5)]));
try {
  await db.query(`update public.clone_effectiveness set sections = $2::jsonb where id = $1`,
    [r.id, seccion(20, [q(1, 15, 5, 5, 5)])]);   // 30 > 20
  bad('el UPDATE con exceso pasó');
} catch (e) { ok('el UPDATE con exceso también se bloquea'); }

// 5. Pregunta no aplicada: se ignora, igual que en sectionStats()
try {
  await guardar(seccion(18, [q(1, 99, 99, 99, 99, { aplicada: false })]));
  ok('pregunta con aplicada=false se ignora');
} catch (e) { bad(`pregunta no aplicada bloqueó: ${e.message}`); }

// 6. Sección sin total todavía: no hay contra qué comparar
try { await guardar(seccion(0, [q(1, 3, 2, 0, 0)])); ok('sección con total 0 no bloquea (borrador nuevo)'); }
catch (e) { bad(`total 0 bloqueó: ${e.message}`); }

// 7. Basura en el jsonb: se trata como 0, no revienta el trigger
try {
  await guardar(seccion(10, [q(1, '', 'abc', null, '3.0')]));
  ok('valores no numéricos se leen como 0 sin romper el trigger');
} catch (e) { bad(`jsonb con basura rompió el trigger: ${e.message}`); }

// 8. La segunda sección también se valida
try {
  await guardar(JSON.stringify({
    exploro:    { total_estudiantes: 10, questions: [q(1, 5, 5, 0, 0)] },
    desarrollo: { total_estudiantes: 10, questions: [q(1, 9, 9, 0, 0)] },  // 18 > 10
  }));
  bad('la sección desarrollo no se validó');
} catch (e) {
  if (/Desarrollo mis competencias/.test(e.message)) ok('la sección desarrollo también se valida y se nombra en el error');
  else bad(`error inesperado: ${e.message}`);
}

// 9. El mensaje identifica la pregunta correcta
try {
  await guardar(seccion(10, [q(1, 5, 5, 0, 0), q(2, 4, 3, 3, 0), q(3, 20, 0, 0, 0)]));
  bad('no detectó la pregunta 3');
} catch (e) {
  if (/pregunta 3/.test(e.message)) ok('el error nombra la pregunta exacta (3)');
  else bad(`no nombró la pregunta 3: ${e.message}`);
}

// 10. El diagnóstico de filas viejas encuentra lo que se coló antes del trigger
await db.exec(`alter table public.clone_effectiveness disable trigger trg_valida_conteos_clone_effectiveness`);
await guardar(seccion(12, [q(1, 20, 0, 0, 0)]), 'final');
await db.exec(`alter table public.clone_effectiveness enable trigger trg_valida_conteos_clone_effectiveness`);
const diag = await db.query(`
  select e.id, s.key as seccion, q->>'n' as pregunta
    from public.clone_effectiveness e
    cross join lateral jsonb_each(e.sections) as s(key, value)
    cross join lateral jsonb_array_elements(coalesce(s.value->'questions','[]'::jsonb)) as q
   where public.conteo_estudiantes(s.value->>'total_estudiantes') > 0
     and coalesce(q->>'aplicada','true') <> 'false'
     and public.conteo_estudiantes(q->>'a') + public.conteo_estudiantes(q->>'b')
       + public.conteo_estudiantes(q->>'c') + public.conteo_estudiantes(q->>'d')
       > public.conteo_estudiantes(s.value->>'total_estudiantes')`);
if (diag.rows.length === 1) ok('el diagnóstico [4] encuentra la fila vieja que violaba la regla');
else bad(`el diagnóstico encontró ${diag.rows.length} filas, esperaba 1`);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
