// Prueba 0078 (rondas de Ciencias Sociales) sobre PGlite: familia completa
// (base, copia por colegio y copia de copia), idempotencia y snapshot en vivo.
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
  alter table public.courses add column draft_modules jsonb;
  create role authenticated;`);
const q = async (sql, p) => (await db.query(sql, p)).rows;
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const PEND = JSON.stringify([{ type: 'intro', title: 'Pendiente', text: 'x' }, { type: 'callout', title: 'Frase de apertura', text: '¡Viajemos!' }]);
const curso = async (id, name, parent) => {
  await q(`insert into public.courses (id, name, parent_course_id) values ($1,$2,$3)`, [id, name, parent]);
  for (let o = 1; o <= 7; o++) await q(`insert into public.course_modules (course_id, title, "order", content) values ($1,$2,$3,$4::jsonb)`,
    [id, `Módulo ${o}`, o, [4, 6].includes(o) ? PEND : '[]']);
};
await curso(U(1), 'Viajeros del Tiempo', null);
await curso('9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3', 'Viajeros del Tiempo — mi versión', U(1));
await curso(U(2), 'Viajeros del Tiempo — Colegio C', '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3');

// 0075 trae la función del snapshot (la que lleva texto de lectura y pista).
await db.exec(read(path.join(MIGS, '0075_rondas_banco_preguntas.sql')));

console.log('\n=== 0078 ===');
let est;
try { est = (await db.exec(read(path.join(MIGS, '0078_rondas_sociales.sql')))).at(-1).rows; ok('0078 aplica'); }
catch (e) { bad(`0078 falló: ${e.message}`); process.exit(1); }
est.forEach(r => console.log(`       ${r.estado.padEnd(14)} ${r.curso.padEnd(36)} ${r.detalle}`));
esperar('módulos convertidos (3 cursos × 2 rondas)', est.filter(r => r.estado === 'APLICADA').length, 6);
const est2 = (await db.exec(read(path.join(MIGS, '0078_rondas_sociales.sql')))).at(-1).rows;
esperar('segunda corrida: ya aplicadas', est2.filter(r => r.estado === 'YA APLICADA').length, 6);

const rondas = await q(`select * from public.course_modules where challenge_data ? 'bank'`);
esperar('todas son del banco de sociales', rondas.every(m => m.challenge_data.bank === 'sociales'), true);
esperar('se conserva la frase de apertura', rondas.every(m => m.content.some(s => s.title === 'Frase de apertura')), true);
const r6 = rondas.find(m => m.order === 6 && m.course_id === U(2));
esperar('ronda final: solo dificultad alta', r6.challenge_data.questions.every(x => x.difficulty === 'dificil'), true);
const snap = (await q(`select public._snapshot_module_questions($1, 20) s`, [r6.id]))[0].s;
esperar('en vivo: lleva la pista', snap.snapshot.every(x => x.hint), true);
esperar('en vivo: NO lleva la respuesta', snap.snapshot.some(x => 'correct' in x), false);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
