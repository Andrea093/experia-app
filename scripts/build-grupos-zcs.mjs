// Genera scripts/grupos_zcs.sql: colegio Zoraida Cadavid de Sierra en GENIA
// Construye (piloto clon) — colegio, ruta, cuentas de los docentes y grupos.
//
//   PowerShell: $env:PASS_TEMPORAL='...'; node scripts/build-grupos-zcs.mjs
//
// Docentes en scripts/data/grupos_zcs.mjs. Alumnos y resultados se leen de
// Insumos/Nuevos colegios/Pilotaje Zoraida Cadavid de Sierra/ (no versionado).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { COLEGIO, SUFIJO, DOCENTES, LIBRO_QUIMICA_U3 } from './data/grupos_zcs.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const INSUMOS = path.join(here, '..', 'Insumos', 'Nuevos colegios', 'Pilotaje Zoraida Cadavid de Sierra')
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const PASS_TEMPORAL = process.env.PASS_TEMPORAL
if (!PASS_TEMPORAL) throw new Error('Falta la variable de entorno PASS_TEMPORAL')

const rows = (file, sheetIdx) => {
  const wb = XLSX.readFile(path.join(INSUMOS, file))
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[sheetIdx]], { header: 1, defval: '' })
}

// ── Listado: [documento, "Apellidos, Nombres"] por salón ────────────────────
const listado = rows('Listado Décimo A y B-Institución Zoraida Cadavid De Sierra.xlsx', 0).slice(1)
  .filter(r => r[5])
  .map(r => ({ salon: String(r[1]).trim().slice(-1), doc: String(r[4]).trim(), nombre: String(r[5]).trim() }))
const alumnos = (salon) => listado.filter(a => a.salon === salon)
  .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

// ── Resultados por eje y priorización de unidades ──────────────────────────
// Ambas hojas: encabezado en la fila 5, datos hasta la primera fila vacía.
const tabla = (file, idx) => {
  const r = rows(file, idx)
  const h = r.findIndex(x => /^(Área CEINFES|Prioridad)$/.test(String(x[0]).trim()))
  const out = []
  for (const x of r.slice(h + 1)) { if (x[0] === '' || x[1] === '') break; out.push(x) }
  return out
}
const pct = (v) => Math.round(Number(v) * 1000) / 10   // 0.433 → 43.3
const unidadTitulo = (s) => String(s).trim().replace(/^UNIDAD (\d)$/i, 'Unidad $1')

const resultados = (materia, salon) => {
  const file = `Resultados_y_priorizacion_${materia}_Decimo_${salon}.xlsx`
  const ejes = tabla(file, 0).map(([label, v]) => ({ label: String(label).trim().replace(/\.$/, '') + '.', value: pct(v) }))
  const unidades = tabla(file, 1).map(([, u, idx, nota]) => ({ title: unidadTitulo(u), priority: pct(idx), notes: String(nota).trim() }))
  return { ejes, unidades }
}

const GRUPOS = DOCENTES.filter(d => d.materia).flatMap(d => d.salones.map(s => {
  const etiqueta = d.materia === 'Quimica' ? 'Química' : 'Sociales'
  // `distintivo`: dos docentes con la misma materia y salón (el nombre del grupo
  // de los que ya existen no cambia, o se duplicarían al volver a correr).
  const nombre = `Décimo ${s} - ${etiqueta} - ${SUFIJO}` + (d.distintivo ? ` (${d.distintivo})` : '')
  return { docente: d, salon: s, nombre, materia: d.materia,
           alumnos: alumnos(s), ...resultados(d.materia, s) }
}))

for (const g of GRUPOS) {
  if (!g.alumnos.length) throw new Error(`${g.nombre}: sin alumnos`)
  if (new Set(g.alumnos.map(a => a.doc)).size !== g.alumnos.length) throw new Error(`${g.nombre}: documentos repetidos`)
  if (!g.ejes.length || !g.unidades.length) throw new Error(`${g.nombre}: sin resultados o priorización`)
}

// ── SQL ────────────────────────────────────────────────────────────────────
const COLEGIO_ID = `(select id from public.institutions where name = ${q(COLEGIO)})`
const BASE_ID = `(select id from public.courses where name ilike '%genia construye%' and parent_course_id is null and is_active order by created_at limit 1)`
const emails = DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')
const out = []

out.push(`-- ============================================================
-- GENERADO por scripts/build-grupos-zcs.mjs — no editar a mano.
-- ${COLEGIO} en GENIA Construye (piloto clon, producto sustituto).
-- ⚠️ Tiene datos de menores y la contraseña temporal: NO versionar.
--
-- Qué hace (idempotente: se puede volver a correr):
--   1. Crea el colegio y le habilita GENIA Construye (curso base).
--   2. Le crea su ruta ("— mi versión") copiando la PUBLICADA del colegio
--      "Producto sus…", con ids nuevos y prerrequisitos remapeados. Si el
--      colegio ya tiene su versión, no la toca.
--   3. Crea las cuentas de los docentes (rol student, colegio asignado),
--      les da acceso + matrícula + progreso vacío en GENIA Construye y les
--      activa el MODO CLON.
--   4. Un grupo por docente y salón con su listado de alumnos, la gráfica de
--      ejes y las unidades priorizadas de ese salón.
-- Todo en una transacción: si algo falla, no queda nada a medias.
-- ⚠️ Correr en el SQL Editor. Si sale el aviso de RLS, "Run and enable RLS" es seguro.
-- ============================================================
begin;

-- ── 0. Precondiciones ──
do $$
begin
  if (select count(*) from public.courses where name ilike '%genia construye%' and parent_course_id is null and is_active) <> 1 then
    raise exception 'Se esperaba exactamente un curso base GENIA Construye activo';
  end if;
  if (select count(*) from public.institutions where name ilike 'producto sus%') <> 1 then
    raise exception 'Se esperaba exactamente un colegio "Producto sus…" (origen de la ruta)';
  end if;
  if not exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'No hay ningún admin para activar el modo clon';
  end if;
end $$;

-- ── 1. Colegio + curso habilitado ──
insert into public.institutions (name)
select ${q(COLEGIO)}
 where not exists (select 1 from public.institutions where name = ${q(COLEGIO)});

insert into public.institution_courses (institution_id, course_id, is_active)
select ${COLEGIO_ID}, ${BASE_ID}, true
 where not exists (select 1 from public.institution_courses
                    where institution_id = ${COLEGIO_ID} and course_id = ${BASE_ID});
update public.institution_courses set is_active = true
 where institution_id = ${COLEGIO_ID} and course_id = ${BASE_ID};

-- ── 2. Ruta del colegio (copia de la de "Producto sus…") ──
do $$
declare
  v_base uuid := ${BASE_ID};
  v_inst uuid := ${COLEGIO_ID};
  v_src public.courses; v_fork uuid; v_n int;
  v_map jsonb := '{}'::jsonb;
  m public.course_modules;
begin
  select id into v_fork from public.courses
   where parent_course_id = v_base and institution_id = v_inst and is_active;
  if v_fork is not null then
    raise notice 'El colegio ya tiene su ruta (%): no se tocó', v_fork;
    return;
  end if;

  select c.* into v_src from public.courses c
    join public.institutions i on i.id = c.institution_id
   where c.parent_course_id = v_base and c.is_active and i.name ilike 'producto sus%'
   order by c.created_at limit 1;
  if v_src.id is null then raise exception 'El colegio "Producto sus…" no tiene ruta propia de GENIA Construye'; end if;

  insert into public.courses (name, description, cover_image, color, theme, area_id,
                              is_active, owner_id, parent_course_id, institution_id)
  select b.name || ' — mi versión', b.description, b.cover_image, b.color, b.theme, b.area_id,
         true, v_src.owner_id, b.id, v_inst
    from public.courses b where b.id = v_base
  returning id into v_fork;

  for m in select * from public.course_modules where course_id = v_src.id loop
    v_map := v_map || jsonb_build_object(m.id::text, gen_random_uuid());
  end loop;

  insert into public.course_modules
  select (jsonb_populate_record(null::public.course_modules,
            to_jsonb(cm) || jsonb_build_object(
              'id',           v_map ->> cm.id::text,
              'course_id',    v_fork,
              'created_at',   now(),
              'requirements', coalesce((select jsonb_agg(v_map ->> r)
                                          from unnest(cm.requirements) r
                                         where v_map ? r), '[]'::jsonb)
            ))).*
    from public.course_modules cm
   where cm.course_id = v_src.id;
  get diagnostics v_n = row_count;
  raise notice 'Ruta creada: % módulos copiados de "%"', v_n, v_src.name;
end $$;

-- ── 3. Cuentas de los docentes (se omiten las que ya existen) ──
-- Los tokens van como '' (no NULL): GoTrue falla al iniciar sesión si están en NULL.
do $$
declare r record; v_id uuid; v_inst uuid := ${COLEGIO_ID};
begin
  for r in select * from (values
${DOCENTES.map(d => `    (${q(d.email.toLowerCase())}, ${q(d.nombre)}, ${q(d.area)})`).join(',\n')}
  ) as t(email, nombre, area) loop
    if exists (select 1 from auth.users where lower(email) = r.email) then
      raise notice 'La cuenta % ya existía: no se tocó su contraseña', r.email;
      continue;
    end if;
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', r.email,
            extensions.crypt(${q(PASS_TEMPORAL)}, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_strip_nulls(jsonb_build_object('name', r.nombre, 'role', 'student',
                                                 'area', r.area, 'institution_id', v_inst)),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', r.email, 'email_verified', true),
            'email', now(), now(), now());
    raise notice 'Cuenta creada: %', r.email;
  end loop;
end $$;

-- Colegio + modo clon. El guard de 0029/0051 solo deja cambiar esas columnas a
-- un admin: se actúa como uno SOLO dentro de esta transacción (set_config local).
do $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', (select id from public.profiles where role = 'admin' order by created_at limit 1),
                      'role', 'authenticated')::text, true);
  update public.profiles
     set institution_id = ${COLEGIO_ID}, ui_variant = 'clone', is_active = true
   where lower(email) in (${emails});
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Acceso + matrícula + progreso vacío (nunca pisa uno existente).
insert into public.user_courses (user_id, course_id, is_active)
select p.id, ${BASE_ID}, true from public.profiles p where lower(p.email) in (${emails})
on conflict (user_id, course_id) do update set is_active = true;

insert into public.course_enrollments (student_id, course_id, institution_id)
select p.id, ${BASE_ID}, ${COLEGIO_ID} from public.profiles p where lower(p.email) in (${emails})
on conflict (student_id, course_id) do nothing;

insert into public.course_progress (user_id, course_id, xp, completed, badges)
select p.id, ${BASE_ID}, 0, '{}', '{}' from public.profiles p where lower(p.email) in (${emails})
on conflict (user_id, course_id) do nothing;
`)

for (const g of GRUPOS) {
  const bars = g.ejes.map((e, i) => `jsonb_build_object('label', ${q(e.label)}, 'value', ${e.value}, 'color', ${(i % 8) + 1})`)
  const units = g.unidades.map(u =>
    `jsonb_build_object('title', ${q(u.title)}, 'ejes', '[]'::jsonb, 'notes', ${q(u.notes)}, 'coverage', null, 'priority', ${u.priority}, 'level', null)`)
  const quimica = g.materia === 'Quimica'
  const u1 = Number(g.unidades[0].title.match(/Unidad (\d)/)?.[1])
  const libro = quimica && u1 === 3 ? LIBRO_QUIMICA_U3 : null
  out.push(`-- ── ${g.nombre} (${g.alumnos.length} alumnos) — ${g.docente.nombre} ──
-- Ejes: ${g.ejes.map(e => e.value).join(' · ')}
-- Unidades: ${g.unidades.map(u => u.title.split(':')[0]).join(' → ')}
do $$
declare v_teacher uuid; v_group uuid;
begin
  select id into v_teacher from public.profiles where lower(email) = ${q(g.docente.email.toLowerCase())};

  select id into v_group from public.clone_groups
   where name = ${q(g.nombre)} and teacher_id = v_teacher;
  if v_group is null then
    insert into public.clone_groups (name, grade, teacher_id, institution_id, course_id, is_active)
    values (${q(g.nombre)}, 'Décimo', v_teacher, ${COLEGIO_ID}, ${BASE_ID}, true)
    returning id into v_group;
  else
    update public.clone_groups set grade = 'Décimo', is_active = true, institution_id = ${COLEGIO_ID}
     where id = v_group;
  end if;

  delete from public.clone_group_students where group_id = v_group;
  insert into public.clone_group_students (group_id, full_name, document, sort_order) values
${g.alumnos.map((a, i) => `    (v_group, ${q(a.nombre)}, ${q(a.doc)}, ${i})`).join(',\n')};
${quimica ? `
  -- Química: indicaciones del plan modelo "ONCE" (si existe y el grupo aún no tiene plan).
  insert into public.clone_unit_plans (group_id, book_title, book_url, intro)
  select v_group, m.book_title, m.book_url, m.intro
    from public.clone_unit_plans m
   where m.group_id = (select g.id from public.clone_groups g where g.name ilike 'once' and g.is_active
                        order by g.created_at limit 1)
  on conflict (group_id) do nothing;` : ''}
  insert into public.clone_unit_plans (group_id) values (v_group)
  on conflict (group_id) do nothing;

  update public.clone_unit_plans set
    chart = jsonb_build_object(
      'title', ${q(`Desempeño por eje articulador — ${g.nombre}`)},
      'bars', jsonb_build_array(
        ${bars.join(',\n        ')})),
    units = jsonb_build_array(
      ${units.join(',\n      ')})${libro ? `,
    -- Libro de su unidad #1: solo si el tutor no subió otro.
    book_title = case when book_url is null then ${q(libro.title)} else book_title end,
    book_url   = coalesce(book_url, ${q(libro.url)})` : ''}
   where group_id = v_group;
end $$;
`)
}

out.push(`-- ── Verificación ──
-- Docentes: colegio y modo clon deben salir 'ok'; ruta = módulos de la versión del colegio.
select p.email, p.name, p.role,
       case when p.institution_id is not distinct from ${COLEGIO_ID} then 'ok' else 'FALTA colegio' end as colegio,
       case when p.ui_variant = 'clone' then 'ok' else 'FALTA modo clon' end as modo_clon,
       exists (select 1 from public.user_courses uc where uc.user_id = p.id and uc.course_id = ${BASE_ID} and uc.is_active) as acceso,
       exists (select 1 from public.course_enrollments ce where ce.student_id = p.id and ce.course_id = ${BASE_ID}) as matricula,
       (select count(*) from public.course_modules m join public.courses c on c.id = m.course_id
         where c.parent_course_id = ${BASE_ID} and c.institution_id = ${COLEGIO_ID} and c.is_active) as modulos_ruta
  from public.profiles p
 where lower(p.email) in (${emails})
 order by p.name;

select g.name as grupo, p.name as docente,
       (select count(*) from public.clone_group_students s where s.group_id = g.id) as alumnos,
       jsonb_array_length(coalesce(u.units, '[]'::jsonb)) as unidades,
       jsonb_array_length(coalesce(u.chart->'bars', '[]'::jsonb)) as ejes,
       u.units->0->>'title' as unidad_1, u.book_title as libro
  from public.clone_groups g
  join public.profiles p on p.id = g.teacher_id
  left join public.clone_unit_plans u on u.group_id = g.id
 where g.name like '% - ${SUFIJO}%'
 order by g.name;

commit;
`)

fs.writeFileSync(path.join(here, 'grupos_zcs.sql'), out.join('\n'))
for (const g of GRUPOS) console.log(g.nombre.padEnd(28), `${g.alumnos.length} alumnos`, '·', g.unidades.map(u => u.title.split(':')[0]).join(' → '))
console.log('\n→ scripts/grupos_zcs.sql')
