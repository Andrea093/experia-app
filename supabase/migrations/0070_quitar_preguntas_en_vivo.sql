-- ============================================================
-- 0070_quitar_preguntas_en_vivo.sql
-- Deja las rutas de las 4 asignaturas con SOLO sus 7 módulos originales:
-- retira los retos "Pregunta en Vivo 1/2" que 0062 intercaló en
-- "Sala de Escape - Matematicas — mi versión" (88136e1a-…). Las preguntas
-- de la clase en vivo las sube el equipo académico desde el editor de ruta.
-- (0065–0067 ya no los crean en Lenguaje, Sociales ni Ciencias; si por
-- alguna razón existieran ahí, esta migración también los retira.)
--
-- Qué hace:
--   1. Borra los módulos cuyo título empieza por "Pregunta en Vivo" en los
--      4 cursos de colegio (Matemáticas, Lenguaje, Sociales, Ciencias).
--   2. Los quita del progreso de los estudiantes (course_progress.completed).
--      El XP ya ganado NO se descuenta.
--   3. Renumera el "order" de cada curso afectado a 1..N sin huecos.
--
-- ⚠️ BORRAR UN MÓDULO BORRA EN CASCADA sus intentos de quiz
--    (quiz_attempts, quiz_attempt_answers) y desliga challenge_attempts
--    (module_id → null). La tabla final "Estado" informa cuántos había.
--    Las respuestas dadas en la Clase en Vivo (live_answers) NO se tocan.
--
-- Idempotente: si ya se corrió, no encuentra nada y lo informa.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0070_estado;
create temp table _0070_estado (paso int, estado text, detalle text);

do $$
declare
  v_cursos uuid[] := array[
    '88136e1a-4564-45bd-b514-0ad6690b182c'::uuid,  -- Sala de Escape - Matematicas — mi versión
    'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid,  -- Detectives — mi versión (Lenguaje)
    '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid,  -- Viajeros del Tiempo — mi versión (Sociales)
    '4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid   -- Laboratorio — Versión 1 (Ciencias)
  ];
  v_ids     uuid[];
  v_txt     text[];
  v_titulos text;
  v_qa      int := 0;
  v_ca      int := 0;
  v_prog    int := 0;
  v_borrados int := 0;
  r         record;
begin
  select array_agg(id), array_agg(id::text), string_agg(title, ' · ' order by title)
    into v_ids, v_txt, v_titulos
    from public.course_modules
   where course_id = any(v_cursos) and title like 'Pregunta en Vivo%';

  if v_ids is null then
    insert into _0070_estado values (1, 'YA APLICADA',
      'No hay módulos "Pregunta en Vivo" en ninguno de los 4 cursos. No se cambió nada.');
  else
    -- Lo que se va a perder, para dejar constancia.
    select count(*) into v_qa from public.quiz_attempts where module_id = any(v_ids);
    select count(*) into v_ca from public.challenge_attempts where module_id = any(v_ids);

    -- Progreso: quitar esos ids de los módulos completados.
    update public.course_progress
       set completed = array(select x from unnest(completed) x where x <> all(v_txt))
     where completed && v_txt;
    get diagnostics v_prog = row_count;

    delete from public.course_modules where id = any(v_ids);
    get diagnostics v_borrados = row_count;

    insert into _0070_estado values (1, 'APLICADA',
      format('Borrados %s módulo(s): %s.', v_borrados, v_titulos));
    insert into _0070_estado values (2, 'DATOS',
      format('%s intento(s) de quiz borrados en cascada, %s intento(s) de reto desligados, progreso ajustado en %s estudiante(s).',
             v_qa, v_ca, v_prog));
  end if;

  -- Renumerar 1..N sin huecos (también corrige huecos previos).
  update public.course_modules m
     set "order" = n.rn
    from (select id, row_number() over (partition by course_id order by "order", id) as rn
            from public.course_modules where course_id = any(v_cursos)) n
   where m.id = n.id and m."order" is distinct from n.rn;

  -- Resultado por curso.
  for r in
    select c.name, count(m.id) as n,
           string_agg(m."order" || '. ' || m.title, '  ·  ' order by m."order") as ruta
      from public.courses c
      left join public.course_modules m on m.course_id = c.id
     where c.id = any(v_cursos)
     group by c.name
  loop
    insert into _0070_estado values (3,
      case when r.n = 7 then r.name || ' — 7 módulos ✓' else r.name || ' — ' || r.n || ' módulos (revisar)' end,
      r.ruta);
  end loop;
end $$;

select estado, detalle from _0070_estado order by paso, estado;
