-- ============================================================
-- Copia la ruta de un colegio (su "— mi versión") a OTRO colegio.
--
-- Hace lo mismo que el botón de la plataforma (forkCourseForInstitution en
-- store.jsx, con sourceCourseId): crea la copia del colegio destino colgando del
-- curso base y le clona los módulos PUBLICADOS del fork de origen, con ids
-- nuevos y los prerrequisitos remapeados a esos ids (si no, la ruta queda
-- trabada después del primer módulo). El borrador del origen no se copia.
--
-- No toca la ruta de origen ni el progreso de nadie. Si el colegio destino ya
-- tiene su copia, no hace nada (para no duplicarla).
-- ⚠️ Si Supabase muestra el aviso de RLS, "Run and enable RLS" es seguro.
-- ============================================================
do $$
declare
  -- ── Parámetros ──
  v_origen_nombre  text := '%genia construye%mi versi%';         -- fork a copiar (ilike)
  v_colegio_nombre text := '%salette%';                         -- colegio destino (ilike)
  -- ─────────────────
  v_src public.courses; v_inst uuid; v_fork uuid; v_n int;
  v_map jsonb := '{}'::jsonb;
  m public.course_modules;
begin
  select * into v_src from public.courses
   where name ilike v_origen_nombre and parent_course_id is not null and is_active
   order by created_at limit 1;
  if v_src.id is null then raise exception 'No encontré el curso de origen %', v_origen_nombre; end if;

  if (select count(*) from public.institutions where name ilike v_colegio_nombre) > 1 then
    raise exception 'Hay varios colegios que coinciden con %', v_colegio_nombre;
  end if;
  select id into v_inst from public.institutions where name ilike v_colegio_nombre;
  if v_inst is null then raise exception 'No existe el colegio %', v_colegio_nombre; end if;
  if v_inst = v_src.institution_id then raise exception 'El origen ya es de ese colegio'; end if;

  select id into v_fork from public.courses
   where parent_course_id = v_src.parent_course_id and institution_id = v_inst and is_active;
  if v_fork is not null then
    raise notice 'El colegio ya tiene su copia (%): no se hizo nada', v_fork;
    return;
  end if;

  -- Nombre/tema siempre del curso BASE, como en la plataforma.
  insert into public.courses (name, description, cover_image, color, theme, area_id,
                              is_active, owner_id, parent_course_id, institution_id)
  select b.name || ' — mi versión', b.description, b.cover_image, b.color, b.theme, b.area_id,
         true, v_src.owner_id, b.id, v_inst
    from public.courses b where b.id = v_src.parent_course_id
  returning id into v_fork;

  -- ids viejos → nuevos
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

  raise notice 'Ruta copiada: % módulos de "%" → colegio %', v_n, v_src.name, v_colegio_nombre;
end $$;

-- Verificación: las dos copias deben tener los mismos módulos en el mismo orden.
select i.name as colegio, c.name as curso, count(m.id) as modulos,
       count(*) filter (where m.type = 'clone_dashboard') as plan_unidades
  from public.courses c
  join public.institutions i on i.id = c.institution_id
  left join public.course_modules m on m.course_id = c.id
 where c.name ilike '%genia construye%mi versi%' and c.is_active
 group by i.name, c.name;
