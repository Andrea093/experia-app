-- ============================================================
-- DEMO: dejar a un tutor con DOS colegios para probar la barra
-- "🏫 Colegio" del editor de ruta (cambiar de versión / crear la copia).
--
-- Qué hace (idempotente, se puede correr varias veces):
--  1) Toma al tutor por nombre (debe haber exactamente uno).
--  2) Su colegio actual = el de instructor_institutions o, si no tiene, el del
--     perfil. Se le asigna en instructor_institutions.
--  3) Crea (si no existe) el colegio "Colegio Demo (pruebas)" y se lo asigna.
--  4) Habilita en el colegio demo TODOS los cursos base (las asignaturas) que
--     ya están habilitados en su colegio actual, y le da acceso al tutor a ellos.
--
-- ⚠️ Por qué un colegio de PRUEBA y no uno real: habilitar un curso en un
-- colegio se lo concede a todos sus estudiantes al iniciar sesión
-- (sync_my_institution_courses, 0028). El colegio demo no tiene estudiantes.
--
-- Para deshacer: borrar el colegio demo (cascada a instructor_institutions,
-- institution_courses y a las copias de curso ligadas por institution_id).
--   delete from public.institutions where name = 'Colegio Demo (pruebas)';
--
-- ⚠️ Si Supabase muestra el aviso de RLS, "Run and enable RLS" es seguro.
-- ============================================================
do $$
declare
  v_tutor_name text := 'Paola Andrea Albornoz%';   -- ← cambiar si es otro tutor
  v_demo_name  text := 'Colegio Demo (pruebas)';
  v_tutor uuid; v_n int;
  v_home  uuid; v_demo uuid;
  v_courses int;
begin
  select count(*), min(id::text)::uuid into v_n, v_tutor
    from public.profiles where name ilike v_tutor_name and role in ('instructor','admin');
  if v_n <> 1 then
    raise exception 'Se esperaba 1 tutor con nombre "%", hay %', v_tutor_name, v_n;
  end if;

  -- Colegio actual del tutor
  select ii.institution_id into v_home
    from public.instructor_institutions ii
    join public.institutions i on i.id = ii.institution_id
   where ii.instructor_id = v_tutor and i.name <> v_demo_name
   order by ii.created_at limit 1;
  if v_home is null then
    select institution_id into v_home from public.profiles where id = v_tutor;
  end if;
  if v_home is null then
    raise exception 'El tutor no tiene colegio (ni asignado ni en su perfil)';
  end if;

  -- Colegio demo
  insert into public.institutions (name) values (v_demo_name)
  on conflict (name) do nothing;
  select id into v_demo from public.institutions where name = v_demo_name;

  -- Asignar ambos colegios al tutor
  insert into public.instructor_institutions (instructor_id, institution_id)
  values (v_tutor, v_home), (v_tutor, v_demo)
  on conflict (instructor_id, institution_id) do nothing;

  -- Asignaturas: cursos base habilitados en su colegio → también en el demo
  insert into public.institution_courses (institution_id, course_id, is_active)
  select v_demo, ic.course_id, true
    from public.institution_courses ic
    join public.courses c on c.id = ic.course_id
   where ic.institution_id = v_home and ic.is_active and c.parent_course_id is null and c.is_active
  on conflict (institution_id, course_id) do update set is_active = true;
  get diagnostics v_courses = row_count;

  -- Acceso del tutor a esos cursos (el editor solo lista cursos con acceso)
  insert into public.user_courses (user_id, course_id, is_active)
  select v_tutor, ic.course_id, true
    from public.institution_courses ic
   where ic.institution_id = v_demo and ic.is_active
  on conflict (user_id, course_id) do update set is_active = true;

  raise notice 'Tutor %: colegios % y % (demo). Cursos habilitados en el demo: %',
    v_tutor, v_home, v_demo, v_courses;
end $$;

-- Verificación
select i.name as colegio, c.name as curso
  from public.instructor_institutions ii
  join public.profiles p      on p.id = ii.instructor_id and p.name ilike 'Paola Andrea Albornoz%'
  join public.institutions i  on i.id = ii.institution_id
  join public.institution_courses ic on ic.institution_id = i.id and ic.is_active
  join public.courses c       on c.id = ic.course_id and c.parent_course_id is null
 order by c.name, i.name;
