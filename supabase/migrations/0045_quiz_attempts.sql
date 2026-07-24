-- ============================================================
-- 0045: Intentos y puntaje mínimo en retos tipo Quiz
--
-- • El quiz gana un límite de intentos configurable (challenge_data.maxAttempts,
--   NULL/0 = ilimitados) y un puntaje mínimo para continuar (challenge_data.
--   passingScore, ya existía). Si no se aprueba, no se desbloquea el siguiente
--   módulo; si se agotan los intentos, el estudiante debe acercarse al tutor.
-- • quiz_attempts: cuenta los intentos por (estudiante, módulo) y si ya aprobó.
--   Se escribe SOLO por RPC SECURITY DEFINER (mismo patrón anti-trampa que el
--   resto). El tutor puede reiniciar los intentos de un estudiante.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente.
-- ============================================================

create table if not exists public.quiz_attempts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  module_id  uuid not null references public.course_modules(id) on delete cascade,
  attempts   int  not null default 0,
  passed     boolean not null default false,
  best_score int,
  best_max   int,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table public.quiz_attempts enable row level security;

-- Lectura: el estudiante ve lo suyo; instructor/admin ven todo (para su panel).
drop policy if exists quiz_attempts_read on public.quiz_attempts;
create policy quiz_attempts_read on public.quiz_attempts
  for select using (user_id = auth.uid() or public.is_instructor() or public.is_admin());
-- Sin policies de insert/update/delete: toda escritura pasa por las RPC de abajo.

-- Registrar un intento (lo llama el estudiante al terminar el quiz). Incrementa
-- el contador, marca aprobado si corresponde (queda pegado en true), guarda el
-- mejor puntaje. Devuelve el estado nuevo.
create or replace function public.record_quiz_attempt(p_module_id uuid, p_passed boolean, p_score int, p_max int)
returns table (attempts int, passed boolean)
language plpgsql security definer set search_path = public as $$
declare v_attempts int; v_passed boolean;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  insert into public.quiz_attempts (user_id, module_id, attempts, passed, best_score, best_max, updated_at)
  values (auth.uid(), p_module_id, 1, coalesce(p_passed, false), p_score, p_max, now())
  on conflict (user_id, module_id) do update
    set attempts   = public.quiz_attempts.attempts + 1,
        passed     = public.quiz_attempts.passed or coalesce(excluded.passed, false),
        best_score = greatest(coalesce(public.quiz_attempts.best_score, 0), coalesce(excluded.best_score, 0)),
        best_max   = excluded.best_max,
        updated_at = now()
  returning public.quiz_attempts.attempts, public.quiz_attempts.passed
  into v_attempts, v_passed;

  return query select v_attempts, v_passed;
end; $$;

-- Reiniciar los intentos de un estudiante en un reto (solo instructor/admin).
create or replace function public.reset_quiz_attempts(p_user_id uuid, p_module_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado';
  end if;
  delete from public.quiz_attempts where user_id = p_user_id and module_id = p_module_id;
end; $$;

grant execute on function public.record_quiz_attempt(uuid, boolean, int, int) to authenticated;
grant execute on function public.reset_quiz_attempts(uuid, uuid) to authenticated;
