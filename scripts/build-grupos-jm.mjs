// Genera, desde scripts/data/grupos_jm.mjs:
//   scripts/out/docentes_jm.xlsx   → para Admin → Usuarios → carga masiva
//   scripts/grupos_jm.sql          → grupos + alumnos + plan (gráfica de ejes)
//
//   node scripts/build-grupos-jm.mjs
//
// La gráfica de cada grupo = promedio del % por eje de los estudiantes que
// presentaron (los ausentes no cuentan). Se redondea a un decimal.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { EJES, DOCENTES, GRUPOS } from './data/grupos_jm.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const PASS_TEMPORAL = 'Ceinfes2026*'

// ── Validaciones ────────────────────────────────────────────────────────────
for (const g of GRUPOS) {
  if (!DOCENTES.some(d => d.key === g.key)) throw new Error(`${g.key}: sin docente`)
  const docs = new Set(g.alumnos.map(a => a[0]))
  if (docs.size !== g.alumnos.length) throw new Error(`${g.key}: documentos repetidos`)
  g.ejes.forEach((r, i) => { if (r.length !== EJES.length) throw new Error(`${g.key} fila ${i}: ${r.length} ejes`) })
  if (g.ejes.length > g.alumnos.length) throw new Error(`${g.key}: más resultados que alumnos`)
}

const promedios = (filas) => EJES.map((_, j) =>
  Math.round(filas.reduce((s, r) => s + r[j], 0) / filas.length * 10) / 10)

// ── Excel de docentes ──────────────────────────────────────────────────────
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
const ws = XLSX.utils.aoa_to_sheet([
  ['Nombre', 'Email', 'Contraseña', 'Rol', 'Área', 'Institución'],
  ...DOCENTES.map(d => [d.nombre, d.email, PASS_TEMPORAL, 'student', 'ciencias', '']),  // la carga masiva exige área
])
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Docentes')
XLSX.writeFile(wb, path.join(here, 'out', 'docentes_jm.xlsx'))

// ── SQL ────────────────────────────────────────────────────────────────────
const out = []
out.push(`-- ============================================================
-- GENERADO por scripts/build-grupos-jm.mjs — no editar a mano.
-- Grupos del Colegio Molinos y Marrueco JM (piloto clon, producto sustituto).
--
-- ⚠️ ANTES: crear las cuentas de docentes (scripts/out/docentes_jm.xlsx en
--    Admin → Usuarios → carga masiva). Este script falla si falta alguna.
-- ⚠️ Correr también 0068_clone_plan_book_url.sql antes (usa plan.book_url).
--
-- Qué hace (idempotente: se puede volver a correr tras cambiar los datos):
--   1. Toma como MODELO al docente del grupo "ONCE": los docentes nuevos
--      quedan con su misma institución, modo clon y acceso a los mismos cursos.
--   2. Crea/actualiza un grupo por docente y REEMPLAZA su listado de alumnos.
--   3. Plan de cada grupo: copia unidades, libro e indicaciones del plan de
--      ONCE (solo si el grupo aún no tiene plan propio) y SIEMPRE pone la
--      gráfica de ejes con los resultados de ese grupo.
-- Todo en una transacción: si algo falla, no queda nada a medias.
-- ============================================================
begin;

create temp table _modelo on commit drop as
select g.teacher_id, g.institution_id, g.course_id, g.id as group_id
  from public.clone_groups g
 where g.name ilike 'once' and g.is_active
 order by g.created_at limit 1;

do $$ begin
  if not exists (select 1 from _modelo) then
    raise exception 'No se encontró el grupo modelo "ONCE".';
  end if;
end $$;
`)

// 1. Docentes
out.push(`-- ── 1. Docentes: modo clon + institución + acceso igual al modelo ──`)
const emails = DOCENTES.map(d => q(d.email)).join(', ')
out.push(`do $$
declare v_faltan text;
begin
  select string_agg(e, ', ') into v_faltan
    from unnest(array[${emails}]) e
   where not exists (select 1 from public.profiles p where lower(p.email) = lower(e));
  if v_faltan is not null then
    raise exception 'Faltan cuentas: %. Créalas primero con la carga masiva.', v_faltan;
  end if;
end $$;

update public.profiles p
   set ui_variant = 'clone',
       institution_id = coalesce((select institution_id from public.profiles where id = (select teacher_id from _modelo)), p.institution_id)
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')});

insert into public.user_courses (user_id, course_id, is_active)
select p.id, uc.course_id, true
  from public.profiles p
  cross join public.user_courses uc
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and uc.user_id = (select teacher_id from _modelo) and uc.is_active
on conflict (user_id, course_id) do update set is_active = true;

insert into public.course_enrollments (student_id, course_id, institution_id)
select p.id, ce.course_id, ce.institution_id
  from public.profiles p
  cross join public.course_enrollments ce
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and ce.student_id = (select teacher_id from _modelo)
on conflict (student_id, course_id) do nothing;

-- Progreso vacío (nunca pisa uno existente).
insert into public.course_progress (user_id, course_id, xp, completed, badges)
select p.id, ce.course_id, 0, '{}', '{}'
  from public.profiles p
  cross join public.course_enrollments ce
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and ce.student_id = (select teacher_id from _modelo)
on conflict (user_id, course_id) do nothing;
`)

// 2 y 3. Grupos
for (const g of GRUPOS) {
  const d = DOCENTES.find(x => x.key === g.key)
  const vals = promedios(g.ejes)
  const bars = EJES.map((label, i) => `jsonb_build_object('label', ${q(label)}, 'value', ${vals[i]}, 'color', ${i + 1})`)
  out.push(`-- ── ${g.nombre} (${g.alumnos.length} alumnos, ${g.ejes.length} presentaron) ──
-- Gráfica: ${vals.join(' · ')}
do $$
declare v_teacher uuid; v_group uuid;
begin
  select id into v_teacher from public.profiles where lower(email) = ${q(d.email.toLowerCase())};

  select id into v_group from public.clone_groups
   where name = ${q(g.nombre)} and institution_id is not distinct from (select institution_id from _modelo);
  if v_group is null then
    insert into public.clone_groups (name, grade, teacher_id, institution_id, course_id, is_active)
    values (${q(g.nombre)}, ${q(g.grado)}, v_teacher,
            (select institution_id from _modelo), (select course_id from _modelo), true)
    returning id into v_group;
  else
    update public.clone_groups set teacher_id = v_teacher, grade = ${q(g.grado)}, is_active = true
     where id = v_group;
  end if;

  delete from public.clone_group_students where group_id = v_group;
  insert into public.clone_group_students (group_id, full_name, document, sort_order) values
${g.alumnos.map((a, i) => `    (v_group, ${q(a[1])}, ${q(a[0])}, ${i})`).join(',\n')};

  -- Plan: si el grupo no tiene, parte del de ONCE (unidades, libro, indicaciones).
  insert into public.clone_unit_plans (group_id, book_title, book_url, intro, units, chart)
  select v_group, m.book_title, m.book_url, m.intro, m.units, '{}'::jsonb
    from public.clone_unit_plans m where m.group_id = (select group_id from _modelo)
  on conflict (group_id) do nothing;
  insert into public.clone_unit_plans (group_id) values (v_group)
  on conflict (group_id) do nothing;

  update public.clone_unit_plans set chart = jsonb_build_object(
    'title', 'Desempeño por eje articulador — ${g.nombre.replace(/'/g, "''")}',
    'bars', jsonb_build_array(
      ${bars.join(',\n      ')}))
   where group_id = v_group;
end $$;
`)
}

out.push(`-- Verificación
select g.name as grupo, p.email as docente, g.grade,
       (select count(*) from public.clone_group_students s where s.group_id = g.id) as alumnos,
       jsonb_array_length(coalesce(u.units, '[]'::jsonb)) as unidades,
       jsonb_array_length(coalesce(u.chart->'bars', '[]'::jsonb)) as ejes
  from public.clone_groups g
  join public.profiles p on p.id = g.teacher_id
  left join public.clone_unit_plans u on u.group_id = g.id
 where g.name in (${GRUPOS.map(g => q(g.nombre)).join(', ')})
 order by g.name;

commit;
`)

fs.writeFileSync(path.join(here, 'grupos_jm.sql'), out.join('\n'))
for (const g of GRUPOS) console.log(g.nombre.padEnd(16), promedios(g.ejes).join(' · '))
console.log('\n→ scripts/grupos_jm.sql\n→ scripts/out/docentes_jm.xlsx')
