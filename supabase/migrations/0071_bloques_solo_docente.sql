-- ============================================================
-- 0071_bloques_solo_docente.sql
-- Oculta al ESTUDIANTE la guía de clase que hoy ve en sus lecciones:
-- las secciones tituladas "Qué es este bloque" y "Cómo ejecutarlo" pasan a
-- `tutorOnly: true`. El frontend (LessonBody, lesson.jsx) no se las muestra
-- al estudiante; instructor y admin las siguen viendo, marcadas como
-- "👩‍🏫 Solo docente" (editor de ruta, vista previa y Clase en Vivo).
--
-- Aplica a TODOS los cursos (cruza por título de la sección). Desde el
-- editor de ruta se puede marcar/desmarcar cualquier otra sección con la
-- casilla "Solo visible para el docente".
--
-- Idempotente: si ya se corrió, no encuentra nada y lo informa.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0071_estado;
create temp table _0071_estado (estado text, detalle text);

do $$
declare
  v_titulos text[] := array['Qué es este bloque', 'Cómo ejecutarlo'];
  v_modulos int;
begin
  update public.course_modules m
     set content = (
       select jsonb_agg(
                case when e->>'title' = any(v_titulos) and coalesce((e->>'tutorOnly')::boolean, false) = false
                     then e || '{"tutorOnly": true}'::jsonb
                     else e end
                order by i)
         from jsonb_array_elements(m.content) with ordinality as t(e, i)
     )
   where jsonb_typeof(m.content) = 'array'
     and exists (select 1 from jsonb_array_elements(case when jsonb_typeof(m.content) = 'array' then m.content else '[]'::jsonb end) e
                  where e->>'title' = any(v_titulos)
                    and coalesce((e->>'tutorOnly')::boolean, false) = false);
  get diagnostics v_modulos = row_count;

  if v_modulos = 0 then
    insert into _0071_estado values ('YA APLICADA', 'No quedaban secciones visibles con esos títulos. No se cambió nada.');
  else
    insert into _0071_estado values ('APLICADA', format('%s módulo(s) actualizados.', v_modulos));
  end if;
end $$;

-- Resumen por curso: cuántas secciones quedaron solo para el docente.
insert into _0071_estado
select c.name, count(*) || ' sección(es) solo docente'
  from public.course_modules m
  join public.courses c on c.id = m.course_id
  cross join lateral jsonb_array_elements(case when jsonb_typeof(m.content) = 'array' then m.content else '[]'::jsonb end) e
 where jsonb_typeof(m.content) = 'array' and (e->>'tutorOnly')::boolean
 group by c.name;

select estado, detalle from _0071_estado;
