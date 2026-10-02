-- ============================================================
-- 0073_ciencias_en_tres_cursos.sql
-- Ciencias Naturales se separa en TRES rutas independientes (paneles aparte):
--
--   Ciencias Naturales — Biología  ← el curso ACTUAL renombrado: conserva su
--                                    id, sus copias por colegio, módulos,
--                                    progreso, entregas y certificados.
--   Ciencias Naturales — Física    ← curso nuevo
--   Ciencias Naturales — Química   ← curso nuevo
--
-- Los dos nuevos son COPIA de la ruta actual (mismo tema "lab", mismos 7
-- módulos, actividades y diapositivas), para ajustar cada materia después
-- desde el editor de ruta:
--   · curso base nuevo      ← módulos del curso base actual
--   · copia por colegio nueva ← módulos de la copia por colegio actual
--     (la que realmente ven los estudiantes y editan los tutores)
--   Ids de módulos nuevos y prerrequisitos (`requirements`) remapeados.
--
-- Acceso: los MISMOS colegios (institution_courses), docentes y estudiantes
-- (user_courses + course_enrollments) del curso actual reciben los dos
-- nuevos, con progreso vacío (course_progress) — arrancan de cero.
--
-- Idempotente: si ya existe "Ciencias Naturales — Física", no hace nada.
-- Todo corre en un solo bloque: si algo falla, no queda nada a medias.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0073_estado;
create temp table _0073_estado (paso int, estado text, detalle text);

-- Copia TODOS los módulos de un curso a otro con ids nuevos y los
-- prerrequisitos remapeados a esos ids (mismo criterio que
-- forkCourseForInstitution en store.jsx). Función temporal: se borra al final.
create or replace function public._0073_copiar_modulos(p_from uuid, p_to uuid)
returns void language plpgsql as $f$
declare
  v_map jsonb := '{}'::jsonb;  -- id viejo -> id nuevo
  r record;
begin
  for r in select id from public.course_modules where course_id = p_from loop
    v_map := v_map || jsonb_build_object(r.id::text, gen_random_uuid()::text);
  end loop;

  insert into public.course_modules
  select (jsonb_populate_record(null::public.course_modules,
            to_jsonb(m) || jsonb_build_object(
              'id', v_map->>(m.id::text),
              'course_id', p_to,
              'requirements', coalesce((select jsonb_agg(v_map->>x) from unnest(m.requirements) x where v_map ? x), '[]'::jsonb),
              'created_at', now(), 'updated_at', now()))).*
    from public.course_modules m
   where m.course_id = p_from;
end $f$;

do $$
declare
  v_fork_ref  uuid := '4d2af3cd-767e-4e14-a364-23fd596ada10'; -- copia por colegio conocida (0067)
  v_base      public.courses;
  v_old_name  text;
  v_new_base  uuid;
  v_new_fork  uuid;
  v_fork      public.courses;
  v_materia   text;
  v_mods      int;
begin
  -- ── 0. ¿Ya se corrió? ──────────────────────────────────────────────────
  if exists (select 1 from public.courses where name = 'Ciencias Naturales — Física' and parent_course_id is null) then
    insert into _0073_estado values (0, 'YA APLICADA', 'Ya existe "Ciencias Naturales — Física". No se cambió nada.');
    return;
  end if;

  -- ── 1. Curso base actual de Ciencias Naturales ─────────────────────────
  select b.* into v_base
    from public.courses f join public.courses b on b.id = coalesce(f.parent_course_id, f.id)
   where f.id = v_fork_ref;
  if v_base.id is null then
    raise exception 'No se encontró el curso de Ciencias Naturales (copia %).', v_fork_ref;
  end if;
  v_old_name := v_base.name;

  -- ── 2. El actual pasa a ser Biología ───────────────────────────────────
  update public.courses
     set name = 'Ciencias Naturales — Biología',
         certificate_title = case when certificate_title is null then null else 'Ciencias Naturales — Biología' end
   where id = v_base.id;
  update public.courses
     set name = 'Ciencias Naturales — Biología' ||
                coalesce(nullif(substr(name, length(v_old_name) + 1), ''), ' — mi versión')
   where parent_course_id = v_base.id and name like v_old_name || '%';
  insert into _0073_estado values (1, 'BIOLOGÍA', format('"%s" ahora es "Ciencias Naturales — Biología" (con sus copias por colegio).', v_old_name));

  -- ── 3. Física y Química: copia del curso + rutas + accesos ─────────────
  foreach v_materia in array array['Física', 'Química'] loop

    -- 3a. Curso base nuevo (todas las columnas del actual, sin borradores)
    v_new_base := gen_random_uuid();
    insert into public.courses
    select * from jsonb_populate_record(null::public.courses,
      to_jsonb(v_base) || jsonb_build_object(
        'id', v_new_base,
        'name', 'Ciencias Naturales — ' || v_materia,
        'certificate_title', case when v_base.certificate_title is null then null else 'Ciencias Naturales — ' || v_materia end,
        'draft_modules', null, 'draft_name', null, 'created_at', now()));
    perform public._0073_copiar_modulos(v_base.id, v_new_base);

    -- 3b. Una copia nueva por cada copia por colegio del curso actual
    for v_fork in select * from public.courses where parent_course_id = v_base.id loop
      v_new_fork := gen_random_uuid();
      insert into public.courses
      select * from jsonb_populate_record(null::public.courses,
        to_jsonb(v_fork) || jsonb_build_object(
          'id', v_new_fork,
          'parent_course_id', v_new_base,
          'name', 'Ciencias Naturales — ' || v_materia ||
                  coalesce(nullif(substr(v_fork.name, length('Ciencias Naturales — Biología') + 1), ''), ' — mi versión'),
          'certificate_title', case when v_fork.certificate_title is null then null else 'Ciencias Naturales — ' || v_materia end,
          'draft_modules', null, 'draft_name', null, 'created_at', now()));
      perform public._0073_copiar_modulos(v_fork.id, v_new_fork);
    end loop;

    -- 3c. Accesos: mismos colegios, docentes y estudiantes (sin progreso)
    insert into public.institution_courses (institution_id, course_id, is_active, assigned_by, expires_at)
    select institution_id, v_new_base, is_active, assigned_by, expires_at
      from public.institution_courses where course_id = v_base.id
    on conflict (institution_id, course_id) do nothing;

    insert into public.user_courses (user_id, course_id, is_active, assigned_by)
    select user_id, v_new_base, is_active, assigned_by
      from public.user_courses where course_id = v_base.id
    on conflict (user_id, course_id) do nothing;

    insert into public.course_enrollments (student_id, course_id, institution_id)
    select student_id, v_new_base, institution_id
      from public.course_enrollments where course_id = v_base.id
    on conflict (student_id, course_id) do nothing;

    insert into public.course_progress (user_id, course_id)
    select distinct student_id, v_new_base
      from public.course_enrollments where course_id = v_base.id
    on conflict (user_id, course_id) do nothing;

    select count(*) into v_mods from public.course_modules where course_id = v_new_base;
    insert into _0073_estado values (2, upper(v_materia), format(
      'Creado "Ciencias Naturales — %s": %s módulo(s) en el curso base, %s copia(s) por colegio, %s colegio(s), %s usuario(s) con acceso.',
      v_materia, v_mods,
      (select count(*) from public.courses where parent_course_id = v_new_base),
      (select count(*) from public.institution_courses where course_id = v_new_base),
      (select count(*) from public.user_courses where course_id = v_new_base)));
  end loop;
end $$;

-- Resumen: los tres cursos y sus copias.
insert into _0073_estado
select 3, coalesce(p.name, c.name), case when c.parent_course_id is null then 'Curso base' else 'Copia: ' || c.name end
       || ' — ' || (select count(*) from public.course_modules m where m.course_id = c.id) || ' módulo(s)'
  from public.courses c left join public.courses p on p.id = c.parent_course_id
 where coalesce(p.name, c.name) like 'Ciencias Naturales — %';

drop function if exists public._0073_copiar_modulos(uuid, uuid);
select estado, detalle from _0073_estado order by paso, estado, detalle;
