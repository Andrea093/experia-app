-- ============================================================
-- 0033: Clase en Vivo Guiada — el profesor marca el paso de TODA la ruta
--
-- Extiende Modo Aula en Vivo (0022 + 0029) de "un quiz suelto" a "toda la
-- ruta del curso guiada en vivo": lección, encuesta o reto quiz, uno a uno,
-- controlados por el profesor. Los estudiantes conectados ven exactamente
-- el mismo módulo que el profesor en cada momento (no navegan libremente).
--
-- Cambios:
--   · live_participants: unique(session_id, user_id) — unirse es idempotente.
--   · _snapshot_module_questions(): factoriza el snapshot de preguntas
--     (antes vivía inline en create_live_session) para reusarlo cada vez
--     que el profesor entra a un nuevo módulo interactivo. Soporta
--     challenge_type='poll' (encuesta, sin 'correct').
--   · create_live_session(): nueva firma — ya NO recibe preguntas del
--     cliente, solo crea la sesión "vacía" (module_id=null); el profesor
--     entra al primer módulo con live_goto_module().
--   · live_goto_module(): NUEVA — mueve el puntero de módulo actual dentro
--     de la ruta del curso (lección / encuesta / quiz interactivo / o
--     pass-through para lo no sincrónico).
--   · live_complete_module_for_participants(): NUEVA — al avanzar, otorga
--     XP y agrega el módulo a course_progress.completed para cada
--     participante conectado (nunca resetea progreso existente).
--   · join_live_session_for_course(): NUEVA — el estudiante logueado se
--     une a la sesión activa de SU curso (sin PIN, autocompleta nombre/
--     correo desde su perfil). Coexiste con join_live_session (PIN, anónimo).
--   · submit_live_answer(): ahora tolera 'correct' nulo (encuesta): registra
--     la respuesta sin calificar ni sumar puntaje ni afectar la racha.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE / DO $$ guards.
-- ============================================================

-- ── live_participants: unirse debe ser idempotente por usuario logueado ──
-- (los NULL de la vía anónima por PIN no chocan entre sí: Postgres no
-- compara NULLs como iguales en una restricción UNIQUE).
do $$ begin
  alter table public.live_participants
    add constraint live_participants_session_user_uniq unique (session_id, user_id);
exception when duplicate_object then null;
end $$;

-- ── Snapshot de preguntas de un módulo (quiz o encuesta) ─────────────────
-- Uso interno únicamente: NO se otorga EXECUTE a authenticated/anon, para
-- no filtrar la respuesta correcta a un cliente que la invoque directo.
-- Las funciones SECURITY DEFINER que la llaman (mismo dueño) sí pueden.
create or replace function public._snapshot_module_questions(p_module_id uuid, p_default_time int default 20)
returns jsonb
language plpgsql set search_path = public as $$
declare
  v_questions jsonb;
  v_snapshot  jsonb := '[]'::jsonb;
  v_keys      jsonb := '[]'::jsonb;
  q jsonb;
begin
  select challenge_data->'questions' into v_questions from public.course_modules where id = p_module_id;

  for q in select value from jsonb_array_elements(coalesce(v_questions, '[]'::jsonb)) as t(value) loop
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'question',     q->>'question',
      'options',      coalesce(q->'options', '[]'::jsonb),
      'image',        q->>'image',
      'imageHeight',  q->'imageHeight',
      'time_limit_s', coalesce(nullif(q->>'timeLimit','')::int, p_default_time)
    ));
    v_keys := v_keys || jsonb_build_array(jsonb_build_object(
      -- 'correct' queda NULL cuando la pregunta no lo trae (encuesta): sin
      -- respuesta correcta, submit_live_answer solo registra la elección.
      'correct',          (q->>'correct')::int,
      'points',           coalesce(nullif(q->>'points','')::int, 1000),
      'time_limit_s',     coalesce(nullif(q->>'timeLimit','')::int, p_default_time),
      'explanation',      q->>'explanation',
      'explanationImage', q->>'explanationImage'
    ));
  end loop;

  return jsonb_build_object('snapshot', v_snapshot, 'keys', v_keys);
end; $$;
revoke execute on function public._snapshot_module_questions(uuid, int) from public;

-- ── RPC: crear sesión (instructor) — ahora solo el "cascarón" ────────────
-- El profesor entra al primer módulo llamando live_goto_module() aparte,
-- así toda la lógica de snapshot/fase vive en un solo lugar.
drop function if exists public.create_live_session(uuid, uuid, text, jsonb, int);
create or replace function public.create_live_session(p_course_id uuid, p_title text)
returns public.live_sessions
language plpgsql security definer set search_path = public as $$
declare v_code text; v_sess public.live_sessions;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.live_sessions where code = v_code and status <> 'ended');
  end loop;

  insert into public.live_sessions(course_id, module_id, host_id, title, code, status, phase,
    current_index, total_questions, time_limit_s, questions)
  values (p_course_id, null, auth.uid(), p_title, v_code, 'lobby', 'lobby', 0, 0, 20, '[]'::jsonb)
  returning * into v_sess;

  insert into public.live_session_keys(session_id, host_id, answer_key)
  values (v_sess.id, auth.uid(), '[]'::jsonb);

  return v_sess;
end; $$;

-- ── RPC: mover el puntero de módulo actual (instructor) ──────────────────
create or replace function public.live_goto_module(p_session uuid, p_module_id uuid, p_default_time int default 20)
returns public.live_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_mod public.course_modules; v_snap jsonb; v_phase text;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.host_id <> auth.uid() then raise exception 'No autorizado'; end if;

  select * into v_mod from public.course_modules where id = p_module_id and course_id = v_sess.course_id;
  if v_mod.id is null then raise exception 'El módulo no pertenece a esta sesión'; end if;

  if v_mod.type = 'challenge' and v_mod.challenge_type in ('quiz', 'poll') then
    v_phase := 'lobby'; -- el profesor abre la primera pregunta con live_set_phase('question')
    v_snap  := public._snapshot_module_questions(p_module_id, p_default_time);
  else
    -- Lección, entrega final, evaluación, u otro tipo de reto no sincrónico:
    -- solo pass-through informativo, sin ciclo de preguntas.
    v_phase := 'lesson';
    v_snap  := jsonb_build_object('snapshot', '[]'::jsonb, 'keys', '[]'::jsonb);
  end if;

  update public.live_sessions set
    module_id            = p_module_id,
    status               = 'active',
    phase                = v_phase,
    current_index        = 0,
    total_questions      = coalesce(jsonb_array_length(v_snap->'snapshot'), 0),
    questions            = coalesce(v_snap->'snapshot', '[]'::jsonb),
    current_reveal       = null,
    question_started_at  = null
  where id = p_session
  returning * into v_sess;

  update public.live_session_keys set answer_key = coalesce(v_snap->'keys', '[]'::jsonb)
  where session_id = p_session;

  return v_sess;
end; $$;

-- ── RPC: otorgar XP/completado a los participantes conectados ───────────
-- Se llama sobre el módulo que se deja atrás, justo antes de avanzar.
-- Idempotente: si el participante ya tenía el módulo en completed[], no
-- vuelve a sumar XP. Nunca resetea progreso existente (mismo invariante
-- que enrollInCourse/setUserCourseAccess en el store).
create or replace function public.live_complete_module_for_participants(p_session uuid, p_module_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions; v_xp int; r record;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.host_id <> auth.uid() then raise exception 'No autorizado'; end if;

  select xp into v_xp from public.course_modules where id = p_module_id;
  if v_xp is null then return; end if;

  for r in
    select distinct user_id from public.live_participants
     where session_id = p_session and user_id is not null
  loop
    insert into public.course_progress (user_id, course_id, xp, completed)
    values (r.user_id, v_sess.course_id, v_xp, array[p_module_id::text])
    on conflict (user_id, course_id) do update
      set xp = public.course_progress.xp
             + case when p_module_id::text = any(public.course_progress.completed) then 0 else v_xp end,
          completed = case when p_module_id::text = any(public.course_progress.completed)
                            then public.course_progress.completed
                            else public.course_progress.completed || p_module_id::text end,
          updated_at = now();
  end loop;
end; $$;

-- ── RPC: unirse a la sesión guiada del curso (estudiante logueado) ───────
-- A diferencia de join_live_session (PIN, anónimo), esta SIEMPRE requiere
-- sesión autenticada y autocompleta nombre/correo desde el perfil.
create or replace function public.join_live_session_for_course(p_course_id uuid)
returns public.live_participants
language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions; v_prof public.profiles; v_p public.live_participants;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  select * into v_sess from public.live_sessions
   where course_id = p_course_id and status <> 'ended'
   order by created_at desc limit 1;
  if v_sess.id is null then raise exception 'No hay una sesión en vivo activa para este curso'; end if;

  -- Idempotente: si ya está unido (recarga de página), devuelve su fila.
  select * into v_p from public.live_participants
   where session_id = v_sess.id and user_id = auth.uid();
  if v_p.id is not null then return v_p; end if;

  select * into v_prof from public.profiles where id = auth.uid();

  insert into public.live_participants(session_id, user_id, nombre, correo, claim_token)
  values (v_sess.id, auth.uid(), coalesce(v_prof.name, 'Estudiante'), v_prof.email, gen_random_uuid())
  returning * into v_p;
  return v_p;
end; $$;

-- ── submit_live_answer: tolera 'correct' nulo (encuesta) ─────────────────
-- Misma firma que 0029 (uuid,uuid,int,int,uuid) — no hace falta re-otorgar
-- permisos, pero se re-otorgan igual por claridad/seguridad.
create or replace function public.submit_live_answer(
  p_session uuid, p_participant uuid, p_index int, p_answer int, p_token uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_part public.live_participants;
  v_key jsonb; v_correct int; v_base int; v_limit int;
  v_elapsed numeric; v_frac numeric; v_points int; v_ok boolean; v_existing public.live_answers;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.phase <> 'question' or v_sess.current_index <> p_index then
    raise exception 'La pregunta no está abierta';
  end if;

  select * into v_part from public.live_participants
   where id = p_participant and session_id = p_session;
  if v_part.id is null then raise exception 'Participante inválido'; end if;
  if v_part.claim_token is not null and v_part.claim_token is distinct from p_token then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select * into v_existing from public.live_answers
   where participant_id = p_participant and question_index = p_index;
  if v_existing.id is not null then
    return jsonb_build_object('already', true, 'points', v_existing.points, 'is_correct', v_existing.is_correct);
  end if;

  select answer_key->p_index into v_key from public.live_session_keys where session_id = p_session;
  v_correct := (v_key->>'correct')::int;  -- NULL en encuestas: sin respuesta correcta
  v_base    := coalesce((v_key->>'points')::int, 1000);
  v_limit   := coalesce((v_key->>'time_limit_s')::int, v_sess.time_limit_s, 20);
  v_elapsed := extract(epoch from (now() - coalesce(v_sess.question_started_at, now())));

  if v_correct is null then
    -- Encuesta: se registra la elección, sin calificar ni sumar puntaje.
    v_ok := null;
    v_points := 0;
  else
    v_ok := (p_answer = v_correct);
    if v_ok then
      v_frac   := least(1.0, greatest(0.0, v_elapsed / nullif(v_limit, 0)));
      v_points := round(v_base * (1 - 0.5 * v_frac));
    else
      v_points := 0;
    end if;
  end if;

  insert into public.live_answers(session_id, participant_id, question_index, answer_index, is_correct, response_ms, points)
  values (p_session, p_participant, p_index, p_answer, v_ok, round(v_elapsed * 1000), v_points);

  update public.live_participants
     set score = score + v_points,
         streak = case when v_correct is null then streak  -- encuesta no afecta racha
                       when v_ok then streak + 1 else 0 end,
         last_seen = now()
   where id = p_participant;

  return jsonb_build_object('already', false, 'is_correct', v_ok, 'points', v_points);
end; $$;

-- ── Permisos de ejecución ─────────────────────────────────────────────
grant execute on function public.create_live_session(uuid, text)                          to authenticated;
grant execute on function public.live_goto_module(uuid, uuid, int)                         to authenticated;
grant execute on function public.live_complete_module_for_participants(uuid, uuid)         to authenticated;
grant execute on function public.join_live_session_for_course(uuid)                        to authenticated;
grant execute on function public.submit_live_answer(uuid, uuid, int, int, uuid)            to anon, authenticated;

-- Verificación (opcional):
-- select id, code, status, phase, module_id, course_id from public.live_sessions order by created_at desc limit 5;
