// Prueba la migración 0076 (resultados Saber en el módulo 3) sobre PGlite.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0076_bitacora_resultados_saber.sql');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`alter table public.courses add column parent_course_id uuid references public.courses(id);`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const curso = async (id, name, parent, m3content, m3type = 'lesson') => {
  await q(`insert into public.courses (id, name, parent_course_id) values ($1, $2, $3)`, [id, name, parent]);
  for (let o = 1; o <= 7; o++) {
    await q(`insert into public.course_modules (course_id, title, "order", type, content) values ($1, $2, $3, $4, $5::jsonb)`,
      [id, `Módulo ${o}`, o, o === 3 ? m3type : 'lesson', o === 3 ? m3content : '[{"type":"text","title":"x","text":"y"}]']);
  }
};
const BITACORA = JSON.stringify([{ type: 'intro', title: 'Bitácora', text: '00:25–00:35 · 10 min' }, { type: 'text', title: 'Revisión', text: 'Contenido del tutor' }]);
const PEND = JSON.stringify([{ type: 'intro', title: 'Pendiente', text: 'Por definir' }]);

await curso(U(1), 'Sala de Escape - Matematicas', null, BITACORA);
await curso('88136e1a-4564-45bd-b514-0ad6690b182c', 'Sala de Escape — mi versión', U(1), BITACORA);
await curso(U(2), 'Detectives', null, PEND);
await curso('d4aa2014-aa49-46d1-8ac3-7e5842fc8dc1', 'Detectives — mi versión', U(2), BITACORA);
await curso(U(3), 'Laboratorio de Ciencias Naturales — Biología', null, BITACORA);
await curso('4d2af3cd-767e-4e14-a364-23fd596ada10', 'Laboratorio de Ciencias Naturales — Biología — Versión 1', U(3), BITACORA);
await curso(U(4), 'Laboratorio de Ciencias Naturales — Física', null, BITACORA);
await curso(U(5), 'Viajeros del Tiempo', null, BITACORA);
await curso('9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3', 'Viajeros del Tiempo — mi versión', U(5), BITACORA, 'challenge');

console.log('\n=== APLICACIÓN ===');
let est;
try { est = (await db.exec(read(MIG))).at(-1).rows; ok('0076 aplica'); }
catch (e) { bad(`0076 falló: ${e.message}`); process.exit(1); }
est.forEach(r => console.log(`       ${r.asignatura.padEnd(18)} ${r.estado.padEnd(20)} ${r.detalle}`));
const n = (rows, e) => rows.filter(r => r.estado === e).length;
esperar('módulos 3 con la sección agregada', n(est, 'APLICADA'), 8);
esperar('módulo 3 que no es lección (se respeta)', n(est, 'NO TOCADO'), 1);
esperar('Química no existe (se informa)', n(est, 'CURSO NO ENCONTRADO'), 1);

console.log('\n=== IDEMPOTENCIA ===');
const est2 = (await db.exec(read(MIG))).at(-1).rows;
esperar('segunda corrida: nada nuevo', n(est2, 'APLICADA'), 0);
esperar('segunda corrida: ya aplicadas', n(est2, 'YA APLICADA'), 8);

console.log('\n=== CONTENIDO ===');
const mods = await q(`select c.name, m.content from public.course_modules m join public.courses c on c.id = m.course_id
                       where m."order" = 3 and m.content @> '[{"type":"saber-results"}]'::jsonb`);
esperar('una sola sección por módulo', mods.every(m => m.content.filter(s => s.type === 'saber-results').length === 1), true);
esperar('se conserva el contenido del tutor', mods.filter(m => m.content.some(s => s.title === 'Revisión')).length, 7);
esperar('se retira "Pendiente"', mods.some(m => m.content.some(s => s.title === 'Pendiente')), false);
const sec = (name) => mods.find(m => m.name === name).content.find(s => s.type === 'saber-results');
esperar('datos marcados como sintéticos', mods.every(m => m.content.find(s => s.type === 'saber-results').synthetic === true), true);
esperar('Biología resalta su componente', sec('Laboratorio de Ciencias Naturales — Biología').focus, 'Biológico');
esperar('Física resalta su componente', sec('Laboratorio de Ciencias Naturales — Física').focus, 'Físico');
esperar('Matemáticas: 3 competencias', sec('Sala de Escape - Matematicas').competencias.length, 3);
esperar('niveles suman 100', mods.every(m => m.content.find(s => s.type === 'saber-results').niveles.reduce((a, x) => a + x.pct, 0) === 100), true);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
