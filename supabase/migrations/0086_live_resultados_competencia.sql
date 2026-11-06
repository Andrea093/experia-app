-- =============================================
-- 0086 — Clase en Vivo: respuestas por módulo y resultados por competencia
-- =============================================
-- Dos cambios que van juntos:
--
-- 1. BUG: la ronda final no sumaba. live_answers era único por
--    (participante, número de pregunta), sin distinguir el módulo. Una clase
--    guiada pasa por dos rondas (módulos 4 y 6) con la numeración desde 0, así
--    que al responder la pregunta N de la segunda ronda, submit_live_answer
--    encontraba la de la primera, devolvía `already` y no registraba ni sumaba.
--    Ahora la respuesta se identifica también por módulo.
--
-- 2. Cada respuesta guarda module_id, evidencia y bank (área), y la RPC
--    live_my_results le devuelve al estudiante sus resultados al terminar la
--    clase. La evidencia se copia AL RESPONDER: live_session_keys se reescribe
--    en cada módulo, y una edición posterior de la ruta no debe cambiar los
--    resultados de una clase ya dada. La competencia NO se guarda: sale de la
--    evidencia con src/lib/saberGuide.js, la fuente única de la guía.
--
-- El resto de submit_live_answer es idéntico a 0083.
-- Aditiva e idempotente. Compatible con el frontend anterior.
-- EJECUTAR en el SQL Editor ANTES de desplegar el frontend: este ya filtra
-- live_answers por module_id.
-- =============================================

alter table public.live_answers
  add column if not exists module_id uuid,
  add column if not exists evidencia text,
  add column if not exists bank      text;

-- La única restricción UNIQUE de la tabla es la de (participante, pregunta). Se
-- busca por tipo y no por nombre: la creó 0022 sin nombre explícito.
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
     where conrelid = 'public.live_answers'::regclass and contype = 'u'
  loop
    execute format('alter table public.live_answers drop constraint %I', r.conname);
  end loop;
end $$;

-- coalesce: en un índice único los NULL no chocan entre sí, y las sesiones sin
-- módulo (y las filas anteriores a esta migración) deben seguir protegidas
-- contra una doble respuesta.
create unique index if not exists live_answers_unica
  on public.live_answers (participant_id, coalesce(module_id, '00000000-0000-0000-0000-000000000000'::uuid), question_index);

create or replace function public.submit_live_answer(
  p_session uuid, p_participant uuid, p_index int, p_answer int, p_token uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_part public.live_participants;
  v_key jsonb; v_correct int; v_base int; v_limit int;
  v_elapsed numeric; v_frac numeric; v_points int; v_ok boolean; v_existing public.live_answers;
  v_evidencia text; v_bank text;
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
   where participant_id = p_participant and question_index = p_index
     and module_id is not distinct from v_sess.module_id;
  if v_existing.id is not null then
    return jsonb_build_object('already', true, 'points', v_existing.points, 'is_correct', v_existing.is_correct);
  end if;

  select answer_key->p_index into v_key from public.live_session_keys where session_id = p_session;
  v_correct := (v_key->>'correct')::int;  -- NULL en encuestas: sin respuesta correcta
  v_base    := coalesce((v_key->>'points')::int, 1000);
  v_limit   := coalesce(nullif(v_sess.questions->p_index->>'time_limit_s','')::int,
                         (v_key->>'time_limit_s')::int, v_sess.time_limit_s, 20);
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

  select challenge_data->'questions'->p_index->>'evidencia', challenge_data->>'bank'
    into v_evidencia, v_bank
    from public.course_modules where id = v_sess.module_id;

  insert into public.live_answers(session_id, participant_id, question_index, answer_index, is_correct, response_ms, points, module_id, evidencia, bank)
  values (p_session, p_participant, p_index, p_answer, v_ok, round(v_elapsed * 1000), v_points, v_sess.module_id, v_evidencia, v_bank);

  update public.live_participants
     set score = score + v_points,
         streak = case when v_correct is null then streak  -- encuesta no afecta racha
                       when v_ok then streak + 1 else 0 end,
         last_seen = now()
   where id = p_participant;

  return jsonb_build_object('already', false, 'is_correct', v_ok, 'points', v_points);
end; $$;

grant execute on function public.submit_live_answer(uuid, uuid, int, int, uuid) to anon, authenticated;

-- Resultados de UN participante, solo con la clase terminada. Una pregunta cuenta
-- si alguien de la sesión la respondió, así que quien dejó pasar una la ve como no
-- acertada (answered=false) en vez de que se le reduzca el total. Las encuestas
-- (is_correct NULL) no se califican y no entran.
create or replace function public.live_my_results(
  p_session uuid, p_participant uuid, p_token uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_part public.live_participants; v_items jsonb;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.status <> 'ended' and v_sess.phase <> 'podium' then
    raise exception 'La clase aún no termina';
  end if;

  select * into v_part from public.live_participants
   where id = p_participant and session_id = p_session;
  if v_part.id is null then raise exception 'Participante inválido'; end if;
  if v_part.claim_token is not null and v_part.claim_token is distinct from p_token then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'module_id', q.module_id,
           'question_index', q.question_index,
           'evidencia', q.evidencia,
           'bank', q.bank,
           'answered', mine.id is not null,
           'correct', coalesce(mine.is_correct, false)
         ) order by q.first_at, q.question_index), '[]'::jsonb)
    into v_items
    from (
      select distinct on (a.module_id, a.question_index)
             a.module_id, a.question_index, a.evidencia, a.bank,
             min(a.created_at) over (partition by a.module_id, a.question_index) as first_at
        from public.live_answers a
       where a.session_id = p_session and a.is_correct is not null
       order by a.module_id, a.question_index, a.created_at
    ) q
    left join public.live_answers mine
      on mine.session_id = p_session
     and mine.participant_id = p_participant
     and mine.question_index = q.question_index
     and mine.module_id is not distinct from q.module_id;

  return jsonb_build_object('items', v_items);
end; $$;

revoke execute on function public.live_my_results(uuid, uuid, uuid) from public;
grant execute on function public.live_my_results(uuid, uuid, uuid) to anon, authenticated;
