// Prueba 0077 (refuerzo de 0076) sobre PGlite: aplica 0076 y luego 0077 en
// una base que reproduce los dos casos que dejaban a estudiantes sin las
// gráficas: una copia de copia, y una copia cuya Bitácora no está en el orden 3.
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

// titles: lista de 7 títulos; la "Bitácora" puede estar en cualquier posición
const curso = async (id, name, parent, inst, titles) => {
  await q(`insert into public.courses (id, name, parent_course_id, institution_id) values ($1,$2,$3,$4)`, [id, name, parent, inst]);
  for (let o = 1; o <= 7; o++) {
    await q(`insert into public.course_modules (course_id, title, "order", type, content) values ($1,$2,$3,'lesson',$4::jsonb)`,
      [id, titles[o - 1], o, JSON.stringify([{ type: 'text', title: 'Contenido', text: titles[o - 1] }])]);
  }
};
const NORMAL = ['Encender la sala', 'Las reglas del escape', 'Bitácora de intentos anteriores', 'Primera ronda', 'Recarga', 'Ronda final', 'Cierre'];
const MOVIDA = ['Encender la sala', 'Las reglas del escape', 'Actividad extra', 'Bitácora de intentos anteriores', 'Recarga', 'Ronda final', 'Cierre'];

const COLE_A = U(901), COLE_B = U(902), COLE_C = U(903);
await q(`insert into public.institutions values ($1,'Colegio A'),($2,'Colegio B'),($3,'Colegio C')`, [COLE_A, COLE_B, COLE_C]);
await curso(U(1), 'Sala de Escape - Matematicas', null, null, NORMAL);
await curso('88136e1a-4564-45bd-b514-0ad6690b182c', 'Sala de Escape — mi versión', U(1), COLE_A, NORMAL);
// Copia de colegio B con la Bitácora en la posición 4 (0076 la pone en el 3, mal)
await curso(U(2), 'Sala de Escape — Colegio B', U(1), COLE_B, MOVIDA);
// Copia DE LA COPIA (colegio C importó la del colegio A): 0076 no la alcanza
await curso(U(3), 'Sala de Escape — Colegio C', '88136e1a-4564-45bd-b514-0ad6690b182c', COLE_C, NORMAL);

// Estudiantes: A y B matriculados en el curso base (cargan su copia), C en la copia de A
const est = async (inst, course) => { const [{ id }] = await q(`insert into public.profiles (role, institution_id) values ('student',$1) returning id`, [inst]);
  await q(`insert into public.course_enrollments values ($1,$2,$3)`, [id, course, inst]) };
await est(COLE_A, U(1)); await est(COLE_A, U(1)); await est(COLE_B, U(1)); await est(COLE_C, '88136e1a-4564-45bd-b514-0ad6690b182c');

console.log('\n=== 0076 (estado de partida) ===');
await db.exec(read(path.join(MIGS, '0076_bitacora_resultados_saber.sql')));
const tieneEn = async (course) => (await q(`select title from public.course_modules where course_id=$1 and content @> '[{"type":"saber-results"}]'::jsonb`, [course])).map(r => r.title);
esperar('0076 en colegio B la puso en (módulo equivocado)', (await tieneEn(U(2))).join(), 'Actividad extra');
esperar('0076 en la copia de copia (colegio C)', (await tieneEn(U(3))).length, 0);

console.log('\n=== 0077 ===');
let res;
try { res = await db.exec(read(path.join(MIGS, '0077_bitacora_resultados_saber_todas_las_copias.sql'))); ok('0077 aplica (incluida la tabla por colegio)'); }
catch (e) { bad(`0077 falló: ${e.message}`); process.exit(1); }
const cambios = res.at(-2).rows, porCole = res.at(-1).rows;
cambios.forEach(r => console.log(`       ${r.asignatura.padEnd(12)} ${r.estado.padEnd(24)} ${r.curso} · ${r.modulo}`));
porCole.forEach(r => console.log(`       ${r.asignatura.padEnd(12)} ${r.colegio.padEnd(12)} ${r.curso_que_carga.padEnd(30)} ${r.estudiantes} est. · ve: ${r.ve_la_seccion}`));

esperar('colegio B: ahora en la Bitácora (y solo ahí)', (await tieneEn(U(2))).join(), 'Bitácora de intentos anteriores');
esperar('colegio C (copia de copia): agregada', (await tieneEn(U(3))).join(), 'Bitácora de intentos anteriores');
esperar('se conserva el contenido del módulo', (await q(`select count(*)::int c from public.course_modules where course_id=$1 and title like 'Bitácora%' and content @> '[{"title":"Contenido"}]'::jsonb`, [U(3)]))[0].c, 1);
esperar('todos los colegios la ven', porCole.every(r => r.ve_la_seccion === 'SÍ'), true);
esperar('colegio A cuenta 2 estudiantes', porCole.find(r => r.colegio === 'Colegio A')?.estudiantes, 2);

console.log('\n=== IDEMPOTENCIA ===');
const res2 = await db.exec(read(path.join(MIGS, '0077_bitacora_resultados_saber_todas_las_copias.sql')));
esperar('segunda corrida: nada agregado', res2.at(-2).rows.filter(r => r.estado === 'AGREGADA AHORA').length, 0);
esperar('nunca hay dos secciones en un módulo', (await q(`select count(*)::int c from public.course_modules m, jsonb_array_elements(m.content) e where e->>'type'='saber-results' group by m.id having count(*) > 1`)).length, 0);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
