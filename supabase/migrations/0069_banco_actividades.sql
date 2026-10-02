-- ============================================================
-- 0069_banco_actividades.sql
-- Banco de actividades (rompehielos + pausas activas físicas) para la
-- Clase en Vivo. El contenido del banco (30 actividades con imagen) vive en
-- el frontend (src/lib/activityBank.js + public/actividades/); aquí solo:
--
--   1. live_sessions.activity_choices  { <moduleId>: <activityId> }
--      La actividad que el profesor eligió para ESTA clase. Los estudiantes
--      la leen por realtime (policy ls_select de 0022) y el host la escribe
--      con un update directo (policy ls_host_all de 0022) — sin RPC nueva.
--   2. profiles.activity_prefs         { <moduleId>: <activityId> }
--      La última que eligió el profesor en ese módulo, para que su próxima
--      clase arranque con la misma.
--   3. Reemplaza en TODOS los cursos el bloque viejo "Banco de actividades
--      rompehielo" (módulo de apertura) y "Banco de actividades físicas"
--      (pausa activa) por la sección nueva `{type:'activity'}` con su
--      actividad por defecto:
--        apertura    → bank 'ambas'   (físicas o rompehielos), rom-01
--        pausa activa → bank 'fisicas' (solo físicas),          fis-01
--      Se cruza por el título del bloque, no por "order" (0062/0065–0067
--      insertaron módulos y corrieron el orden). Solo toca el elemento del
--      bloque: el resto del contenido del módulo queda intacto.
--
-- ⚠️ Correr DESPUÉS de 0065, 0066 y 0067 (esas escriben los bloques viejos
--    que esta reemplaza). Es idempotente: se puede volver a correr.
--
-- Validaciones (el resultado sale en la tabla final "Estado"):
--   · Si ya se aplicó antes (no quedan bloques viejos y ya hay secciones
--     `activity`), no cambia nada y lo informa.
--   · Revisa si 0065/0066/0067 se corrieron (si el módulo de apertura del
--     curso aún dice "Pendiente", no se han corrido). Si falta alguna, NO se detiene —el resto de cursos sí se
--     actualiza—, pero lo avisa: en ese curso habrá que volver a correr
--     esta migración después de su 0065/0066/0067.
--
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

alter table public.live_sessions
  add column if not exists activity_choices jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists activity_prefs jsonb not null default '{}'::jsonb;

-- Resultado de esta ejecución, para la tabla final.
drop table if exists _0069_estado;
create temp table _0069_estado (paso int, estado text, detalle text);

do $$
declare
  v_viejos      int;
  v_nuevos      int;
  v_apertura    int := 0;
  v_pausa       int := 0;
  r             record;
begin
  -- ── 1. ¿Ya se corrió antes? ───────────────────────────────────────────
  select count(*) into v_viejos from public.course_modules
   where content @> '[{"type":"reveal","title":"Banco de actividades rompehielo"}]'::jsonb
      or content @> '[{"type":"reveal","title":"Banco de actividades físicas"}]'::jsonb;
  select count(*) into v_nuevos from public.course_modules
   where content @> '[{"type":"activity"}]'::jsonb;

  if v_viejos = 0 and v_nuevos > 0 then
    insert into _0069_estado values (1, 'YA APLICADA',
      format('No quedan bancos viejos y ya hay %s módulo(s) con el banco nuevo. No se cambió nada.', v_nuevos));
  elsif v_viejos = 0 then
    insert into _0069_estado values (1, 'SIN NADA QUE REEMPLAZAR',
      'No se encontró ningún "Banco de actividades rompehielo/físicas". ¿Se corrieron 0064–0067?');
  else
    -- ── 2. Reemplazo ────────────────────────────────────────────────────
    -- Apertura: banco rompehielo → actividad (físicas o rompehielos)
    update public.course_modules m
       set content = (
         select jsonb_agg(
                  case when e->>'type' = 'reveal' and e->>'title' = 'Banco de actividades rompehielo'
                       then '{"type":"activity","title":"Actividad de apertura","bank":"ambas","activityId":"rom-01"}'::jsonb
                       else e end
                  order by i)
           from jsonb_array_elements(m.content) with ordinality as t(e, i)
       )
     where m.content @> '[{"type":"reveal","title":"Banco de actividades rompehielo"}]'::jsonb;
    get diagnostics v_apertura = row_count;

    -- Pausa activa: banco de físicas → actividad (solo físicas)
    update public.course_modules m
       set content = (
         select jsonb_agg(
                  case when e->>'type' = 'reveal' and e->>'title' = 'Banco de actividades físicas'
                       then '{"type":"activity","title":"Pausa activa","bank":"fisicas","activityId":"fis-01"}'::jsonb
                       else e end
                  order by i)
           from jsonb_array_elements(m.content) with ordinality as t(e, i)
       )
     where m.content @> '[{"type":"reveal","title":"Banco de actividades físicas"}]'::jsonb;
    get diagnostics v_pausa = row_count;

    insert into _0069_estado values (1, 'APLICADA',
      format('Reemplazados: %s módulo(s) de apertura y %s de pausa activa.', v_apertura, v_pausa));
  end if;

  -- ── 3. ¿Se corrieron las migraciones previas? ─────────────────────────
  for r in
    select * from (values
      ('0065', 'Lenguaje',           'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid, 'Apertura del expediente'),
      ('0066', 'Ciencias Sociales',  '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid, 'Activar el portal'),
      ('0067', 'Ciencias Naturales', '4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid, 'Encender el laboratorio')
    ) as v(mig, curso, course_id, apertura)
  loop
    -- Señal: el módulo de apertura ya no dice "Pendiente" (0065–0067 lo llenan).
    if exists (select 1 from public.course_modules
                where course_id = r.course_id and title = r.apertura
                  and not content @> '[{"title":"Pendiente"}]'::jsonb) then
      insert into _0069_estado values (2, r.mig || ' OK', r.curso || ': ya estaba aplicada.');
    else
      insert into _0069_estado values (2, r.mig || ' FALTA',
        r.curso || ': no se ha corrido. Córrela y luego vuelve a correr esta 0069 para ese curso.');
    end if;
  end loop;
end $$;

-- ── Estado ──────────────────────────────────────────────────────────────
select estado, detalle from _0069_estado order by paso, estado;

-- Detalle (opcional): módulos que ya tienen el banco nuevo, por curso.
-- select c.name as curso, m."order", m.title, el->>'bank' as banco, el->>'activityId' as por_defecto
--   from public.course_modules m
--   join public.courses c on c.id = m.course_id
--   cross join lateral jsonb_array_elements(m.content) el
--  where el->>'type' = 'activity'
--  order by c.name, m."order";
