-- ============================================================
-- 0047: Clases en vivo que nunca terminan
--
-- SÍNTOMA REPORTADO: "no puedo finalizar las clases en vivo" y "a los
-- estudiantes siempre les aparece que hay una clase para unirse aunque el
-- profesor no la tenga".
--
-- CAUSA: una sesión solo pasaba a status='ended' con el botón "Finalizar clase
-- en vivo", que en el panel SOLO aparecía al llegar al último módulo. Si el
-- profesor cerraba el panel a mitad de camino (o simplemente cerraba la
-- pestaña), la fila quedaba con status='lobby'/'active' para siempre. Y el
-- banner del estudiante busca cualquier sesión del curso con status <> 'ended',
-- así que la invitación se quedaba pegada indefinidamente.
--
-- ARREGLO EN TRES CAPAS:
--   1. Frontend: botón "Finalizar clase en vivo" disponible en todo momento y
--      aviso explícito al salir sin finalizar (LiveHost.jsx).
--   2. Frontend: el banner ignora sesiones de más de 8 h (liveClient.js).
--   3. Esta migración: al crear una clase nueva se cierran las anteriores del
--      mismo curso, y se limpian de una vez las que quedaron colgadas.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- ── [1] Limpieza de una sola vez: cerrar las sesiones colgadas ──────────────
-- Cierra todo lo que lleve más de 8 horas abierto. Las clases en curso de hoy
-- no se tocan.
update public.live_sessions
   set status = 'ended',
       ended_at = coalesce(ended_at, now())
 where status <> 'ended'
   and created_at < now() - interval '8 hours';

-- ── [2] Crear una clase cierra las anteriores del mismo curso ───────────────
-- Un curso no puede tener dos clases en vivo a la vez: si el profesor arranca
-- una nueva, la anterior queda finalizada. Evita que se acumulen zombis.
create or replace function public.create_live_session(
  p_course_id uuid, p_module_id uuid, p_title text, p_questions jsonb, p_default_time int default 20
) returns public.live_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_code text; v_snapshot jsonb := '[]'::jsonb; v_keys jsonb := '[]'::jsonb;
  q jsonb; v_sess public.live_sessions;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  -- Cierra cualquier clase anterior del mismo curso que siguiera abierta.
  update public.live_sessions
     set status = 'ended', ended_at = coalesce(ended_at, now())
   where course_id = p_course_id and status <> 'ended';

  for q in select value from jsonb_array_elements(coalesce(p_questions, '[]'::jsonb)) as t(value) loop
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'question',     q->>'question',
      'options',      coalesce(q->'options', '[]'::jsonb),
      'image',        q->>'image',
      'imageHeight',  q->'imageHeight',
      'time_limit_s', coalesce(nullif(q->>'timeLimit','')::int, p_default_time)
    ));
    v_keys := v_keys || jsonb_build_array(jsonb_build_object(
      'correct',          coalesce((q->>'correct')::int, 0),
      'points',           coalesce(nullif(q->>'points','')::int, 1000),
      'time_limit_s',     coalesce(nullif(q->>'timeLimit','')::int, p_default_time),
      'explanation',      q->>'explanation',
      'explanationImage', q->>'explanationImage'
    ));
  end loop;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.live_sessions where code = v_code and status <> 'ended');
  end loop;

  insert into public.live_sessions(course_id, module_id, host_id, title, code, status, phase,
    current_index, total_questions, time_limit_s, questions)
  values (p_course_id, p_module_id, auth.uid(), p_title, v_code, 'lobby', 'lobby',
    0, jsonb_array_length(coalesce(p_questions, '[]'::jsonb)), p_default_time, v_snapshot)
  returning * into v_sess;

  insert into public.live_session_keys(session_id, host_id, answer_key)
  values (v_sess.id, auth.uid(), v_keys);

  return v_sess;
end; $$;

grant execute on function public.create_live_session(uuid,uuid,text,jsonb,int) to authenticated;

comment on function public.create_live_session(uuid,uuid,text,jsonb,int) is
  'Crea una Clase en Vivo Guiada. Desde 0047 cierra primero cualquier sesión anterior del mismo curso que siguiera abierta.';
