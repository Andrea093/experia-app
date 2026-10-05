// Genera supabase/migrations/0076_bitacora_resultados_saber.sql: agrega al
// módulo 3 ("Bitácora") de cada ruta de asignatura la sección `saber-results`
// (src/components/SaberResults.jsx) con resultados del colegio por competencia
// y componente de la Prueba Saber.
//
//   node scripts/build-bitacora.mjs
//
// ⚠️ Los datos de abajo son SINTÉTICOS (ejemplo verosímil, `synthetic: true`):
// cuando lleguen los resultados reales de cada colegio, se reemplazan aquí —o
// directamente en la sección del módulo— y la tarjeta deja de decir "ejemplo".
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const YEAR = '2025'
const NIVELES = (a, b, c, d) => [
  { name: 'Nivel 1', pct: a }, { name: 'Nivel 2', pct: b }, { name: 'Nivel 3', pct: c }, { name: 'Nivel 4', pct: d },
]
const r = (name, school, national) => ({ name, school, national })

const CIENCIAS = {
  area: 'Ciencias Naturales',
  score: { school: 49, national: 50 },
  competencias: [
    r('Uso comprensivo del conocimiento científico', 55, 53),
    r('Explicación de fenómenos', 47, 49),
    r('Indagación', 40, 46),
  ],
  componentes: [
    r('Biológico', 54, 52), r('Químico', 45, 48), r('Físico', 42, 47), r('Ciencia, tecnología y sociedad', 50, 50),
  ],
  niveles: NIVELES(15, 44, 34, 7),
}

const DATA = {
  matematicas: {
    area: 'Matemáticas',
    score: { school: 47, national: 50 },
    competencias: [
      r('Interpretación y representación', 58, 55),
      r('Formulación y ejecución', 44, 49),
      r('Argumentación', 37, 42),
    ],
    componentes: [r('Numérico-variacional', 52, 51), r('Geométrico-métrico', 41, 46), r('Aleatorio', 49, 50)],
    niveles: NIVELES(19, 43, 31, 7),
  },
  lectura: {
    area: 'Lectura Crítica',
    score: { school: 52, national: 53 },
    competencias: [
      r('Identificar y entender contenidos locales', 64, 62),
      r('Comprender cómo se articulan las partes del texto', 51, 53),
      r('Reflexionar y evaluar el contenido', 39, 45),
    ],
    componentes: [r('Textos literarios (continuos)', 56, 55), r('Textos informativos (continuos)', 50, 52), r('Textos discontinuos', 43, 49)],
    niveles: NIVELES(12, 38, 41, 9),
  },
  biologia: { ...CIENCIAS, focus: 'Biológico' },
  fisica:   { ...CIENCIAS, focus: 'Físico' },
  quimica:  { ...CIENCIAS, focus: 'Químico' },
  sociales: {
    area: 'Ciencias Sociales y Ciudadanas',
    score: { school: 46, national: 49 },
    competencias: [
      r('Pensamiento social', 53, 52),
      r('Interpretación y análisis de perspectivas', 45, 48),
      r('Pensamiento reflexivo y sistémico', 38, 44),
    ],
    componentes: [
      r('Historia y cultura', 51, 50),
      r('Espacio, territorio, ambiente y población', 44, 48),
      r('Poder, economía y organizaciones sociales', 41, 46),
    ],
    niveles: NIVELES(20, 42, 31, 7),
  },
}

const FAMILIAS = [
  { key: 'matematicas', label: 'Matemáticas', ref: "'88136e1a-4564-45bd-b514-0ad6690b182c'::uuid" },
  { key: 'lectura',     label: 'Lenguaje',    ref: "'d4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid" },
  { key: 'biologia',    label: 'Biología',    ref: "'4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid" },
  { key: 'fisica',      label: 'Física',      nombre: 'Ciencias Naturales — Física' },
  { key: 'quimica',     label: 'Química',     nombre: 'Ciencias Naturales — Química' },
  { key: 'sociales',    label: 'Ciencias Sociales', ref: "'9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid" },
]

const section = (key) => {
  const d = DATA[key]
  const s = { type: 'saber-results', title: `Así le fue al colegio en la Prueba Saber — ${d.area}`, area: d.area, year: YEAR, synthetic: true,
    score: d.score, competencias: d.competencias, componentes: d.componentes, niveles: d.niveles }
  if (d.focus) s.focus = d.focus
  // Comprobaciones: niveles suman 100 y los porcentajes están en 0–100.
  const sum = s.niveles.reduce((a, n) => a + n.pct, 0)
  if (sum !== 100) throw new Error(`${key}: niveles suman ${sum}`)
  for (const x of [...s.competencias, ...s.componentes]) {
    if ([x.school, x.national].some(v => v < 0 || v > 100)) throw new Error(`${key}: ${x.name} fuera de rango`)
  }
  return s
}

const familias = FAMILIAS.map(f => {
  const base = f.ref
    ? `(select coalesce(parent_course_id, id) from public.courses where id = ${f.ref})`
    : `(select id from public.courses where parent_course_id is null and name like '%${f.nombre}' order by created_at limit 1)`
  const tag = 'b' + f.key.slice(0, 3)
  return `    ('${f.label}', ${base}, $${tag}$${JSON.stringify(section(f.key))}$${tag}$::jsonb)`
}).join(',\n')

const sql = `-- ============================================================
-- 0076_bitacora_resultados_saber.sql
-- GENERADO por scripts/build-bitacora.mjs — no editar a mano.
--
-- Módulo 3 ("Bitácora") de las rutas por asignatura: agrega la sección
-- \`saber-results\` con gráficas de cómo le va al colegio en la Prueba Saber
-- por COMPETENCIA y por COMPONENTE (frente al promedio nacional) y la
-- distribución en NIVELES de desempeño (src/components/SaberResults.jsx).
--
-- ⚠️ DATOS SINTÉTICOS de ejemplo (\`synthetic: true\`; la tarjeta lo dice).
--    Al tener los resultados reales del colegio, se reemplazan los números.
--
-- Qué hace, en cada curso de la asignatura (base + copias por colegio):
--   · toma el módulo de "order" 3 (debe ser una lección);
--   · retira el marcador "Pendiente" si lo tenía;
--   · AGREGA la sección al final, conservando todo lo demás.
-- Idempotente: si el módulo ya tiene la sección, lo informa y no la duplica.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0076_estado;
create temp table _0076_estado (asignatura text, estado text, detalle text);

do $$
declare
  f record; c record; m record;
begin
  for f in
    select * from (values
${familias}
    ) as t(label, base_id, sec)
  loop
    if f.base_id is null then
      insert into _0076_estado values (f.label, 'CURSO NO ENCONTRADO', 'No existe en esta base de datos: no se cambió nada.');
      continue;
    end if;

    for c in
      select id, name from public.courses
       where id = f.base_id or parent_course_id = f.base_id
       order by parent_course_id nulls first, name
    loop
      select * into m from public.course_modules where course_id = c.id and "order" = 3;
      if m.id is null then
        insert into _0076_estado values (f.label, 'SIN MÓDULO 3', c.name);
      elsif m.type <> 'lesson' then
        insert into _0076_estado values (f.label, 'NO TOCADO', format('%s · %s: no es una lección (%s).', c.name, m.title, m.type));
      elsif m.content @> '[{"type":"saber-results"}]'::jsonb then
        insert into _0076_estado values (f.label, 'YA APLICADA', c.name || ' · ' || m.title);
      else
        update public.course_modules
           set content = coalesce((
                 select jsonb_agg(e order by i)
                   from jsonb_array_elements(coalesce(m.content, '[]'::jsonb)) with ordinality as t(e, i)
                  where coalesce(e->>'title', '') <> 'Pendiente'
               ), '[]'::jsonb) || jsonb_build_array(f.sec),
               updated_at = now()
         where id = m.id;
        insert into _0076_estado values (f.label, 'APLICADA', c.name || ' · ' || m.title);
      end if;
    end loop;
  end loop;
end $$;

select asignatura, estado, detalle from _0076_estado order by asignatura, estado, detalle;
`

const out = path.join(ROOT, 'supabase/migrations/0076_bitacora_resultados_saber.sql')
fs.writeFileSync(out, sql)
console.log('Escrito', path.relative(ROOT, out), `(${(sql.length / 1024).toFixed(1)} KB)`)
