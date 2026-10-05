// Prueba la migración 0075 (rondas de preguntas del banco en los módulos 4 y 6)
// sobre un Postgres real (PGlite): que aplique, que sea idempotente, que solo
// toque los módulos sin contenido propio y que el snapshot de la clase en vivo
// lleve texto de lectura y pista SIN la respuesta correcta.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIG  = path.resolve(HERE, '..', '..', 'supabase', 'migrations', '0075_rondas_banco_preguntas.sql');
const read = (p) => fs.readFileSync(p, 'utf8');
let fallos = 0;
const ok  = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { fallos++; console.log(`  FALLO ${m}`); };
const esperar = (n, real, esp) => String(real) === String(esp) ? ok(`${n} = ${real}`) : bad(`${n}: esperado ${esp}, obtenido ${real}`);

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(read(path.join(HERE, 'prelude-curso.sql')));
await db.exec(`
  alter table public.courses add column parent_course_id uuid references public.courses(id);
  alter table public.courses add column institution_id uuid;
  alter table public.courses add column draft_modules jsonb;
  create role authenticated;`);
const q = async (sql, p) => (await db.query(sql, p)).rows;

// Siete módulos: 1 apertura · 2 Saber · 3 bitácora · 4 ronda · 5 pausa · 6 ronda · 7 cierre
const PEND = `'[{"type":"intro","title":"Pendiente","text":"Por definir"}]'::jsonb`;
const BANCO_VIEJO = `'[{"type":"intro","title":"Primera ronda"},{"type":"callout","title":"Frase de apertura","text":"¡A jugar!"},{"type":"reveal","title":"Banco de preguntas — nivel medio-alto (10)","items":[]}]'::jsonb`;
const curso = async (id, name, parent, m4, m6) => {
  await q(`insert into public.courses (id, name, parent_course_id) values ($1, $2, $3)`, [id, name, parent]);
  for (let o = 1; o <= 7; o++) {
    const content = o === 4 ? m4 : o === 6 ? m6 : `'[{"type":"text","title":"Bloque ${o}","text":"x"}]'::jsonb`;
    await db.exec(`insert into public.course_modules (course_id, title, "order", content)
                   values ('${id}', 'Módulo ${o}', ${o}, ${content})`);
  }
};
const U = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
await curso(U(1), 'Sala de Escape - Matematicas', null, PEND, PEND);
await curso('88136e1a-4564-45bd-b514-0ad6690b182c', 'Sala de Escape — mi versión', U(1), BANCO_VIEJO, BANCO_VIEJO);
await curso(U(2), 'Detectives', null, PEND, PEND);
// Fork de Lenguaje con la ronda final ya editada a mano por el tutor: NO se toca.
await curso('d4aa2014-aa49-46d1-8ac3-7e5842fc8dc1', 'Detectives — mi versión', U(2), PEND,
  `'[{"type":"text","title":"Mis preguntas","text":"hechas a mano"}]'::jsonb`);
await curso(U(3), 'Laboratorio de Ciencias Naturales — Biología', null, PEND, PEND);
await curso('4d2af3cd-767e-4e14-a364-23fd596ada10', 'Laboratorio de Ciencias Naturales — Biología — Versión 1', U(3), PEND, PEND);
await curso(U(4), 'Laboratorio de Ciencias Naturales — Física', null, PEND, PEND);
// Química no existe en esta base: debe informarlo sin fallar.
// Un curso de otra asignatura con módulos "Pendiente": no debe tocarse.
await curso(U(5), 'Viajeros del Tiempo', null, PEND, PEND);
// Biología tiene un borrador sin publicar en el editor: debe avisarse.
await q(`update public.courses set draft_modules = '[]'::jsonb where id = '4d2af3cd-767e-4e14-a364-23fd596ada10'`);

console.log('\n=== APLICACIÓN ===');
let estado;
try { estado = (await db.exec(read(MIG))).at(-1).rows; ok('0075 aplica'); }
catch (e) { bad(`0075 falló: ${e.message}`); process.exit(1); }
estado.forEach(r => console.log(`       ${r.asignatura.padEnd(12)} ${r.estado.padEnd(20)} ${r.detalle}`));
const cuenta = (rows, e) => rows.filter(r => r.estado === e).length;
esperar('módulos convertidos', cuenta(estado, 'APLICADA'), 13);
esperar('módulos editados a mano que se respetan', cuenta(estado, 'NO TOCADO'), 1);
esperar('asignaturas no encontradas (Química)', cuenta(estado, 'CURSO NO ENCONTRADO'), 1);
esperar('borradores sin publicar avisados', cuenta(estado, 'BORRADOR PENDIENTE'), 1);

console.log('\n=== IDEMPOTENCIA ===');
const est2 = (await db.exec(read(MIG))).at(-1).rows;
esperar('segunda corrida: nada nuevo', cuenta(est2, 'APLICADA'), 0);
esperar('segunda corrida: ya aplicadas', cuenta(est2, 'YA APLICADA'), 13);

console.log('\n=== FORMA DE LOS MÓDULOS ===');
const rondas = await q(`select m.*, c.name curso from public.course_modules m join public.courses c on c.id = m.course_id
                         where m.challenge_data ? 'bank' order by c.name, m."order"`);
esperar('todas en posición 4 o 6', rondas.every(m => [4, 6].includes(m.order)), true);
esperar('todas son reto quiz por dentro', rondas.every(m => m.type === 'challenge' && m.challenge_type === 'quiz'), true);
esperar('ninguna frena la ruta (passingScore 0)', rondas.every(m => m.challenge_data.passingScore === 0), true);
const mate4 = rondas.find(m => m.course_id === '88136e1a-4564-45bd-b514-0ad6690b182c' && m.order === 4);
esperar('se conserva la frase de apertura', mate4.content.some(s => s.title === 'Frase de apertura'), true);
esperar('se retira el banco viejo en texto', mate4.content.some(s => (s.title || '').startsWith('Banco de preguntas')), false);
const pend = rondas.filter(m => m.content.some(s => s.title === 'Pendiente')).length;
esperar('se retira el marcador "Pendiente"', pend, 0);
esperar('Sociales intacto', (await q(`select count(*)::int c from public.course_modules where course_id = $1 and type = 'lesson'`, [U(5)]))[0].c, 7);
const todas = rondas.flatMap(m => m.challenge_data.questions);
esperar('preguntas con pista', todas.every(x => x.hint), true);
esperar('preguntas con 4 opciones y clave en rango', todas.every(x => x.options.length === 4 && x.correct >= 0 && x.correct < 4), true);
const lect = rondas.find(m => m.challenge_data.bank === 'lectura' && m.order === 4);
esperar('lectura: cada pregunta trae su texto', lect.challenge_data.questions.every(x => x.passage), true);

console.log('\n=== SNAPSHOT DE LA CLASE EN VIVO ===');
const snap = (await q(`select public._snapshot_module_questions($1, 20) s`, [lect.id]))[0].s;
esperar('preguntas en el snapshot', snap.snapshot.length, lect.challenge_data.questions.length);
esperar('el snapshot NO lleva la respuesta', snap.snapshot.some(x => 'correct' in x || 'explanation' in x), false);
esperar('el snapshot lleva el texto de lectura', snap.snapshot.every(x => x.passage?.intro), true);
esperar('el snapshot lleva la pista', snap.snapshot.every(x => x.hint), true);
esperar('las claves sí llevan la respuesta', snap.keys.every(k => Number.isInteger(k.correct)), true);
esperar('tiempo por pregunta respetado', snap.snapshot[0].time_limit_s, lect.challenge_data.questions[0].timeLimit);

console.log(`\n=== RESULTADO: ${fallos === 0 ? 'TODO OK' : fallos + ' FALLO(S)'} ===`);
process.exit(fallos === 0 ? 0 : 1);
