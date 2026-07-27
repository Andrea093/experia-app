-- ============================================================
-- 0048: Captura de datos para analítica de resultados
--
-- Registra cada intento de reto en su contexto de curso/módulo y guarda una
-- fila por respuesta de quiz. Es aditiva e idempotente.
-- Ejecutar manualmente en el SQL Editor de Supabase.
-- ============================================================

alter table public.challenge_attempts
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists module_id uuid references public.course_modules(id) on delete set null,
  add column if not exists attempt_no int not null default 1;

create index if not exists idx_attempts_course_created
  on public.challenge_attempts(course_id, created_at desc);
create index if not exists idx_attempts_module_created
  on public.challenge_attempts(module_id, created_at desc);
create index if not exists idx_attempts_student_challenge
  on public.challenge_attempts(student_id, challenge_id, created_at desc);

-- El cliente puede proponer attempt_no para actualización inmediata de la UI,
-- pero el servidor es la fuente de verdad y evita números repetidos.
create or replace function public.assign_challenge_attempt_no()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(max(attempt_no), 0) + 1
    into new.attempt_no
    from public.challenge_attempts
   where student_id = new.student_id
     and challenge_id is not distinct from new.challenge_id
     and course_id is not distinct from new.course_id;
  return new;
end; $$;

drop trigger if exists trg_assign_challenge_attempt_no on public.challenge_attempts;
create trigger trg_assign_challenge_attempt_no
  before insert on public.challenge_attempts
  for each row execute function public.assign_challenge_attempt_no();

create table if not exists public.quiz_attempt_answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  module_id   uuid not null references public.course_modules(id) on delete cascade,
  course_id   uuid references public.courses(id) on delete set null,
  attempt_no  int not null check (attempt_no > 0),
  item_id     text not null,
  item_index  int,
  chosen      int,
  correct     boolean not null,
  time_ms     int,
  created_at  timestamptz not null default now()
);

create index if not exists idx_quiz_answers_module_item
  on public.quiz_attempt_answers(module_id, item_id);
create index if not exists idx_quiz_answers_user_module
  on public.quiz_attempt_answers(user_id, module_id, attempt_no);

alter table public.quiz_attempt_answers enable row level security;

drop policy if exists qaa_insert_own on public.quiz_attempt_answers;
create policy qaa_insert_own on public.quiz_attempt_answers
  for insert with check (user_id = auth.uid());

drop policy if exists qaa_read on public.quiz_attempt_answers;
create policy qaa_read on public.quiz_attempt_answers
  for select using (user_id = auth.uid() or public.is_instructor() or public.is_admin());
