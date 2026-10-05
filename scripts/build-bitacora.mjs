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

// ── 0077: refuerzo — toda la familia de cada curso + diagnóstico por colegio ──
// 0076 solo alcanzó el curso base y sus copias DIRECTAS, y solo el módulo de
// "order" 3: los estudiantes cuyo colegio carga una copia de copia, o cuya
// Bitácora no está en la posición 3, no veían las gráficas.
const sql77 = `-- ============================================================
-- 0077_bitacora_resultados_saber_todas_las_copias.sql
-- GENERADO por scripts/build-bitacora.mjs — no editar a mano.
--
-- Refuerzo de 0076 (resultados Saber en el módulo 3 "Bitácora"). 0076 solo
-- alcanzaba el curso base y sus copias directas, y solo el módulo de
-- "order" 3. Aquí:
--   · se recorre la familia COMPLETA de cada asignatura (copias de copias);
--   · el módulo se busca por título ("Bitácora…") y, si no hay, por "order" 3;
--   · si ya tiene la sección, no se duplica (idempotente);
--   · si 0076 la había puesto en otro módulo (copia con otro orden), se
--     retira de ahí para que quede solo en la Bitácora.
-- Al final muestra DOS tablas de resultado:
--   1) qué se cambió, curso por curso;
--   2) por colegio: qué curso cargan sus estudiantes y si ya ve la sección.
--      Si una fila dice "NO" ahí, ese es el colegio que no ve las gráficas.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0077_estado;
create temp table _0077_estado (asignatura text, estado text, curso text, modulo text);
drop table if exists _0077_familia;
create temp table _0077_familia (asignatura text, base_id uuid, course_id uuid);

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
      insert into _0077_estado values (f.label, 'CURSO NO ENCONTRADO', '—', 'No existe en esta base de datos.');
      continue;
    end if;

    insert into _0077_familia
      with recursive fam as (
        select id from public.courses where id = f.base_id
        union
        select ch.id from public.courses ch join fam on ch.parent_course_id = fam.id
      )
      select f.label, f.base_id, id from fam;

    for c in
      select co.id, co.name from public.courses co
       where co.id in (select course_id from _0077_familia where base_id = f.base_id)
       order by co.parent_course_id nulls first, co.name
    loop
      select * into m from public.course_modules
       where course_id = c.id and type = 'lesson' and title ilike '%bit_cora%'
       order by "order" limit 1;
      if m.id is null then
        select * into m from public.course_modules where course_id = c.id and "order" = 3;
      end if;

      if m.id is null then
        insert into _0077_estado values (f.label, 'SIN MÓDULO 3', c.name, '—');
      elsif m.type <> 'lesson' then
        insert into _0077_estado values (f.label, 'NO TOCADO', c.name, format('%s (no es una lección: %s)', m.title, m.type));
      elsif m.content @> '[{"type":"saber-results"}]'::jsonb then
        insert into _0077_estado values (f.label, 'YA LA TENÍA', c.name, m.title);
      else
        update public.course_modules
           set content = coalesce((
                 select jsonb_agg(e order by i)
                   from jsonb_array_elements(coalesce(m.content, '[]'::jsonb)) with ordinality as t(e, i)
                  where coalesce(e->>'title', '') <> 'Pendiente'
               ), '[]'::jsonb) || jsonb_build_array(f.sec),
               updated_at = now()
         where id = m.id;
        insert into _0077_estado values (f.label, 'AGREGADA AHORA', c.name, m.title);
      end if;

      -- Si 0076 la puso en otro módulo de este curso (la Bitácora no estaba en
      -- el orden 3), se retira de ahí: queda solo en la Bitácora.
      if m.id is not null and m.type = 'lesson' then
        with fuera as (
          update public.course_modules cm
             set content = coalesce((
                   select jsonb_agg(e order by i)
                     from jsonb_array_elements(cm.content) with ordinality as t(e, i)
                    where e->>'type' is distinct from 'saber-results'
                 ), '[]'::jsonb),
                 updated_at = now()
           where cm.course_id = c.id and cm.id <> m.id
             and cm.content @> '[{"type":"saber-results"}]'::jsonb
          returning cm.title
        )
        insert into _0077_estado select f.label, 'RETIRADA DE OTRO MÓDULO', c.name, title from fuera;
      end if;
    end loop;
  end loop;
end $$;

-- 1) Qué se cambió
select asignatura, estado, curso, modulo from _0077_estado order by asignatura, estado, curso;

-- 2) Qué ve cada colegio. Mismo criterio que la app (loadStudentSession):
--    el estudiante matriculado en un curso carga la copia ACTIVA de ese curso
--    para su colegio si existe; si no, el curso mismo.
--    ⚠️ course_enrollments usa student_id (no user_id).
with matriculas as (
  select fa.asignatura, ce.course_id, p.institution_id, ce.student_id
    from public.course_enrollments ce
    join public.profiles p on p.id = ce.student_id and p.role = 'student'
    join _0077_familia fa on fa.course_id = ce.course_id
), efectivo as (
  select mt.*, coalesce((
           select k.id from public.courses k
            where k.parent_course_id = mt.course_id and k.institution_id = mt.institution_id and k.is_active
            order by k.created_at limit 1), mt.course_id) as curso_efectivo
    from matriculas mt
)
select ef.asignatura,
       coalesce(i.name, '(sin colegio)')                              as colegio,
       co.name                                                        as curso_que_carga,
       count(distinct ef.student_id)                                  as estudiantes,
       case when exists (
         select 1 from public.course_modules cm
          where cm.course_id = ef.curso_efectivo and cm.is_enabled
            and cm.content @> '[{"type":"saber-results"}]'::jsonb
       ) then 'SÍ' else 'NO' end                                      as ve_la_seccion
  from efectivo ef
  join public.courses co on co.id = ef.curso_efectivo
  left join public.institutions i on i.id = ef.institution_id
 group by ef.asignatura, i.name, co.name, ef.curso_efectivo
 order by ve_la_seccion, ef.asignatura, colegio;
`
const out77 = path.join(ROOT, 'supabase/migrations/0077_bitacora_resultados_saber_todas_las_copias.sql')
fs.writeFileSync(out77, sql77)
console.log('Escrito', path.relative(ROOT, out77), `(${(sql77.length / 1024).toFixed(1)} KB)`)
