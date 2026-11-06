-- =============================================
-- 0087 — Clase en Vivo: resultados al terminar una ronda antes de tiempo
-- =============================================
-- El profesor puede cerrar una ronda sin haber hecho todas sus preguntas y seguir
-- con la secuencia didáctica: fase 'round_end'. live_set_phase ya acepta esa fase
-- sin cambios y solo el profesor de la sesión puede ponerla.
--
-- Cambio único respecto a 0086: live_my_results también responde en 'round_end'.
-- El frontend filtra por module_id para mostrar solo la ronda que se acaba de cerrar.
--
-- Aditiva e idempotente. EJECUTAR en el SQL Editor ANTES de desplegar el frontend.
-- =============================================

create or replace function public.live_my_results(
  p_session uuid, p_participant uuid, p_token uuid default null
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_part public.live_participants; v_items jsonb;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.status <> 'ended' and v_sess.phase not in ('podium', 'round_end') then
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
