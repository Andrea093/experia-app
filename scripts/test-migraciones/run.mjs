// Aplica 0055/0056/0057 sobre un Postgres real (PGlite = Postgres en WASM) con
// pgvector, y corre las pruebas de aislamiento RLS y de validación de citas.
import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG  = path.resolve(HERE, '..', '..', 'supabase', 'migrations');

const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;

const ok  = (m) => console.log(`  OK   ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };

function esperar(nombre, real, esperado) {
  if (String(real) === String(esperado)) ok(`${nombre} = ${real}`);
  else bad(`${nombre}: esperado ${esperado}, obtenido ${real}`);
}

const db = await PGlite.create({ extensions: { vector, pgcrypto } });

// ── Aplicar ────────────────────────────────────────────────────────────────
const pasos = [
  ['prelude (arnés: roles, auth, 0001, 0005)', path.join(HERE, 'prelude.sql')],
  ['0055_habilitar_pgvector.sql',  path.join(MIG, '0055_habilitar_pgvector.sql')],
  ['0056_corpus_normativo.sql',    path.join(MIG, '0056_corpus_normativo.sql')],
  ['0057_planes_estudio.sql',      path.join(MIG, '0057_planes_estudio.sql')],
  ['0058_bucket_corpus_normativo.sql', path.join(MIG, '0058_bucket_corpus_normativo.sql')],
];

console.log('\n=== APLICACIÓN ===');
for (const [nombre, file] of pasos) {
  try {
    await db.exec(read(file));
    console.log(`  OK   ${nombre}`);
  } catch (e) {
    console.log(`  FALLO ${nombre}\n       ${e.message}`);
    process.exit(1);
  }
}

// ── Idempotencia: correrlas dos veces no debe romper ───────────────────────
console.log('\n=== IDEMPOTENCIA (segunda pasada) ===');
for (const [nombre, file] of pasos.slice(1)) {
  try { await db.exec(read(file)); console.log(`  OK   ${nombre}`); }
  catch (e) { bad(`${nombre} no es idempotente: ${e.message}`); }
}

// ── Estructura ─────────────────────────────────────────────────────────────
console.log('\n=== ESTRUCTURA ===');
const q = async (sql, params) => (await db.query(sql, params)).rows;

esperar('extensión vector en schema `extensions`',
  (await q(`select n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='vector'`))[0]?.nspname,
  'extensions');

esperar('índices en corpus.normativo',
  (await q(`select count(*)::int c from pg_indexes where schemaname='corpus' and tablename='normativo'`))[0].c, 6);

esperar('índice HNSW presente',
  (await q(`select count(*)::int c from pg_indexes where indexname='idx_normativo_embedding' and indexdef ilike '%hnsw%'`))[0].c, 1);

esperar('policies en corpus.normativo (solo lectura)',
  (await q(`select count(*)::int c from pg_policy where polrelid='corpus.normativo'::regclass`))[0].c, 1);

esperar('authenticated usa schema corpus',
  (await q(`select has_schema_privilege('authenticated','corpus','usage') b`))[0].b, true);
esperar('authenticated lee corpus.normativo',
  (await q(`select has_table_privilege('authenticated','corpus.normativo','select') b`))[0].b, true);
esperar('authenticated NO inserta en corpus.normativo',
  (await q(`select has_table_privilege('authenticated','corpus.normativo','insert') b`))[0].b, false);

esperar('policies en planes_estudio',
  (await q(`select count(*)::int c from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='planes_estudio'`))[0].c, 2);
esperar('policies en institution_academic_profiles',
  (await q(`select count(*)::int c from pg_policy p join pg_class c on c.oid=p.polrelid where c.relname='institution_academic_profiles'`))[0].c, 2);

esperar('defaults de id usan gen_random_uuid',
  (await q(`select count(*)::int c from information_schema.columns
             where table_schema='public' and column_name='id'
               and table_name in ('planes_estudio','institution_academic_profiles')
               and column_default like '%gen_random_uuid%'`))[0].c, 2);

esperar('bucket corpus-normativo es privado',
  (await q(`select public::text p from storage.buckets where id='corpus-normativo'`))[0]?.p, 'false');
esperar('bucket solo acepta PDF',
  (await q(`select array_to_string(allowed_mime_types,',') m from storage.buckets where id='corpus-normativo'`))[0]?.m, 'application/pdf');
esperar('policies del bucket en storage.objects (solo lectura)',
  (await q(`select count(*)::int c from pg_policy p join pg_class c on c.oid=p.polrelid
             where c.relname='objects' and p.polcmd='r'`))[0].c, 1);
esperar('storage.objects SIN policies de escritura',
  (await q(`select count(*)::int c from pg_policy p join pg_class c on c.oid=p.polrelid
             where c.relname='objects' and p.polcmd<>'r'`))[0].c, 0);

// ── Datos sintéticos (nunca datos reales — Ley 1581) ───────────────────────
await db.exec(read(path.join(HERE, 'seed.sql')));

// ── Pruebas de RLS ─────────────────────────────────────────────────────────
console.log('\n=== AISLAMIENTO RLS ===');

const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // instructor Colegio A (por instructor_institutions)
const B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; // instructor Colegio B (por profiles.institution_id)
const E = 'cccccccc-cccc-cccc-cccc-cccccccccccc'; // estudiante Colegio A
const D = 'dddddddd-dddd-dddd-dddd-dddddddddddd'; // admin

// Cada prueba corre en su propia transacción, como `authenticated` con el JWT
// del usuario — igual que una request real de PostgREST.
async function como(uid, fn) {
  await db.exec('begin');
  await db.exec(`set local role authenticated`);
  await db.exec(`set local request.jwt.claims = '{"sub":"${uid}","role":"authenticated"}'`);
  try { return await fn(); }
  finally { await db.exec('rollback'); }
}

const cuenta = async (sql) => (await db.query(sql)).rows[0].c;

await como(A, async () => {
  esperar('T1 instructor A ve planes', await cuenta(`select count(*)::int c from public.planes_estudio`), 1);
  esperar('T1 instructor A ve perfiles academicos', await cuenta(`select count(*)::int c from public.institution_academic_profiles`), 1);
  // 3 fragmentos sembrados, 1 derogado → la policy debe ocultar solo ese
  esperar('T1 instructor A ve corpus vigente (2 de 3)', await cuenta(`select count(*)::int c from corpus.normativo`), 2);
});

await como(B, async () => {
  esperar('T2 instructor B ve planes', await cuenta(`select count(*)::int c from public.planes_estudio`), 1);
  esperar('T2 instructor B NO ve el plan del Colegio A',
    await cuenta(`select count(*)::int c from public.planes_estudio where institution_id='11111111-1111-1111-1111-111111111111'`), 0);
});

// Escritura cruzada: debe ser rechazada por el WITH CHECK
await como(B, async () => {
  try {
    await db.query(`insert into public.planes_estudio (institution_id, datos_entrada, plan_generado)
                    values ('11111111-1111-1111-1111-111111111111','{}'::jsonb,'{}'::jsonb)`);
    bad('T3 instructor B pudo crear un plan en el Colegio A');
  } catch (e) {
    if (/row-level security/i.test(e.message)) ok('T3 insert cruzado rechazado por RLS');
    else bad(`T3 falló por otra razón: ${e.message}`);
  }
});

await como(E, async () => {
  esperar('T4 estudiante LEE el plan de su colegio', await cuenta(`select count(*)::int c from public.planes_estudio`), 1);
  try {
    await db.query(`insert into public.planes_estudio (institution_id, datos_entrada, plan_generado)
                    values ('11111111-1111-1111-1111-111111111111','{}'::jsonb,'{}'::jsonb)`);
    bad('T4 el estudiante pudo CREAR un plan');
  } catch (e) {
    if (/row-level security/i.test(e.message)) ok('T4 estudiante no puede escribir planes');
    else bad(`T4 falló por otra razón: ${e.message}`);
  }
});

await como(D, async () => {
  esperar('T5 admin ve los planes de ambos colegios', await cuenta(`select count(*)::int c from public.planes_estudio`), 2);
  try {
    await db.query(`insert into corpus.normativo (id,documento,tipo_norma,referencia_corta,texto)
                    values ('hack-1','Norma inventada','ley','Art. 1','Texto falso')`);
    bad('T5 se pudo ESCRIBIR el corpus desde el cliente');
  } catch (e) {
    ok(`T5 corpus cerrado a escritura (${e.message.split('\n')[0]})`);
  }
});

// ── Validación determinista de citas ───────────────────────────────────────
console.log('\n=== VALIDACIÓN DE CITAS ===');
await como(A, async () => {
  const r = await db.query(`select cita_invalida from public.validar_citas_plan('99999999-9999-9999-9999-999999999999') order by 1`);
  const got = r.rows.map(x => x.cita_invalida).sort();
  const esp = ['derogado-x', 'inventada-999'];
  if (JSON.stringify(got) === JSON.stringify(esp))
    ok(`T6 detecta cita derogada e inventada, y acepta la vigente → ${JSON.stringify(got)}`);
  else bad(`T6 esperado ${JSON.stringify(esp)}, obtenido ${JSON.stringify(got)}`);
});

// ── RPC de búsqueda ────────────────────────────────────────────────────────
console.log('\n=== RPC buscar_corpus ===');
await como(A, async () => {
  try {
    const r = await db.query(
      `select id, referencia_corta, round(similitud::numeric,4) as similitud
         from public.buscar_corpus($1::extensions.vector(1024), null, null, null, 8)`,
      ['[' + Array.from({length:1024}, (_,i) => (i===0?1:0)).join(',') + ']']);
    console.log('       filas:', JSON.stringify(r.rows));
    esperar('T7 buscar_corpus solo devuelve lo vigente y con embedding', r.rows.length, 1);
  } catch (e) { bad(`T7 buscar_corpus falló: ${e.message}`); }
});

// Filtros por área y grado
await como(A, async () => {
  const emb = '[' + Array.from({length:1024}, (_,i) => (i===0?1:0)).join(',') + ']';
  const n = async (area, grado, temas) => (await db.query(
    `select count(*)::int c from public.buscar_corpus($1::extensions.vector(1024), $2, $3, $4, 8)`,
    [emb, area, grado, temas])).rows[0].c;
  esperar('T8 filtro area="Matematicas"', await n('Matematicas', null, null), 1);
  esperar('T8 filtro area="Quimica" (no aplica)', await n('Quimica', null, null), 0);
  esperar('T8 filtro grado=9', await n(null, 9, null), 1);
  esperar('T8 filtro grado=2 (no aplica)', await n(null, 2, null), 0);
  esperar('T8 filtro temas', await n(null, null, ['curriculo']), 1);
});

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
