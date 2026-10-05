// Prueba 0079 sobre PGlite: el caso de Ciencias Sociales, donde el módulo 7
// también se llama "Bitácora…" y 0077 dejó la sección ahí. Tras 0079 debe
// quedar SOLO en el módulo de "order" 3, en toda la familia del curso.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGS = path.resolve(HERE, '..', '..', 'supabase', 'migrations');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column parent_course_id uuid references public.courses(id);
  alter table public.courses add column institution_id uuid;
  create table public.institutions (id uuid primary key default gen_random_uuid(), name text);
  create table public.profiles (id uuid primary key default gen_random_uuid(), role text, institution_id uuid);
  create table public.course_enrollments (student_id uuid, course_id uuid, institution_id uuid,
    primary key (student_id, course_id));`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SOCIALES = ['Viajemos', 'Estructura Saber', 'Revisemos la línea de tiempo', 'Primera ronda', 'Pausa', 'Ronda final', 'Cierre: bitácora de llegada'];
const curso = async (id, name, parent, inst) => {
  await q(`insert into public.courses (id, name, parent_course_id, institution_id) values ($1,$2,$3,$4)`, [id, name, parent, inst]);
  for (let o = 1; o <= 7; o++)
    await q(`insert into public.course_modules (course_id, title, "order", type, content) values ($1,$2,$3,'lesson',$4::jsonb)`,
      [id, SOCIALES[o - 1], o, JSON.stringify([{ type: 'text', title: 'Contenido', text: 'x' }])]);
};
const COLE_A = U(901), COLE_B = U(902);
await q(`insert into public.institutions values ($1,'Ceinfes'),($2,'Open Green')`, [COLE_A, COLE_B]);
await curso(U(1), 'Viajeros del Tiempo — Ciencias Sociales', null, null);
await curso('9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3', 'Viajeros — mi versión', U(1), COLE_A);
await curso(U(2), 'Viajeros — copia de copia', '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3', COLE_B);
const [{ id: est }] = await q(`insert into public.profiles (role, institution_id) values ('student',$1) returning id`, [COLE_A]);
await q(`insert into public.course_enrollments values ($1,$2,$3)`, [est, U(1), COLE_A]);

const enOrden = async (course) => (await q(`select "order" from public.course_modules where course_id=$1 and content @> '[{"type":"saber-results"}]'::jsonb order by 1`, [course])).map(r => r.order).join();

await db.exec(read(path.join(MIGS, '0076_bitacora_resultados_saber.sql')));
await db.exec(read(path.join(MIGS, '0077_bitacora_resultados_saber_todas_las_copias.sql')));
console.log('\n=== Estado tras 0076 + 0077 (el bug) ===');
esperar('mi versión: sección en el módulo', await enOrden('9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'), '7');

console.log('\n=== 0079 ===');
let res;
try { res = await db.exec(read(path.join(MIGS, '0079_bitacora_siempre_modulo_3.sql'))); ok('0079 aplica'); }
catch (e) { bad(`0079 falló: ${e.message}`); process.exit(1); }
res.at(-2).rows.forEach(r => console.log(`       ${r.asignatura.padEnd(18)} ${r.estado.padEnd(24)} ${r.curso} · ${r.modulo}`));
for (const [n, id] of [['curso base', U(1)], ['mi versión', '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'], ['copia de copia', U(2)]])
  esperar(`${n}: sección solo en el módulo`, await enOrden(id), '3');
esperar('se conserva el contenido del módulo 7', (await q(`select count(*)::int c from public.course_modules where course_id=$1 and "order"=7 and content @> '[{"title":"Contenido"}]'::jsonb`, ['9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3']))[0].c, 1);
esperar('tabla por colegio: todos SÍ', res.at(-1).rows.every(r => r.ve_la_seccion === 'SÍ'), true);

const res2 = await db.exec(read(path.join(MIGS, '0079_bitacora_siempre_modulo_3.sql')));
esperar('segunda corrida: nada agregado ni retirado', res2.at(-2).rows.filter(r => !['YA LA TENÍA', 'CURSO NO ENCONTRADO'].includes(r.estado)).length, 0);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
