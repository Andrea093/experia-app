-- =============================================
-- 0088 — Ajustes del testeo de la Clase en Vivo (nov 2026)
--
-- 1. institutions.calendar ('A' | 'B'): calendario escolar del colegio. Se
--    pide al crear un colegio (Admin → Colegios). Define hasta cuándo el
--    estudiante puede repasar sus clases en vivo: antes de su Prueba Saber.
--      · Calendario B → hasta el 31 de marzo siguiente a la clase.
--      · Calendario A → hasta el 30 de junio siguiente a la clase.
--      · Sin calendario → sin límite (hasta que el admin lo asigne).
--    La regla vive SOLO en live_review_until(); para cambiar las fechas,
--    reemplazar esa función.
--
-- 2. live_my_history(): las clases en vivo TERMINADAS en las que participó
--    el estudiante (por auth.uid(), sin token), con cada pregunta que se hizo,
--    lo que respondió, si acertó, y la pregunta completa (opciones, respuesta
--    correcta y explicación) para repasar. Las encuestas no entran. La
--    pregunta sale de course_modules: con la clase ya terminada, la respuesta
--    correcta deja de ser secreta.
--
-- 3. platform_feedback: comentarios de los profesores sobre la plataforma
--    ("Ayúdanos a mejorar"). Solo instructores/admin escriben; solo el admin
--    lee. Nombre, correo, rol y colegio los completa un trigger desde el
--    perfil (no se pueden falsear desde el navegador).
--
-- Aditiva e idempotente. EJECUTAR en el SQL Editor de Supabase.
-- Probada con scripts/test-migraciones/run-historial-comentarios.mjs.
-- =============================================

-- ── 1. Calendario del colegio ─────────────────────────────────────────────
alter table public.institutions add column if not exists calendar text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'institutions_calendar_chk') then
    alter table public.institutions
      add constraint institutions_calendar_chk check (calendar is null or calendar in ('A', 'B'));
  end if;
end $$;

-- Último día en que se puede repasar una clase dada en `p_at` (hora de Colombia).
create or replace function public.live_review_until(p_at timestamptz, p_calendar text)
returns date language sql immutable as $$
  select case upper(coalesce(p_calendar, ''))
    when 'B' then make_date(extract(year from (p_at at time zone 'America/Bogota'))::int
                            + case when extract(month from (p_at at time zone 'America/Bogota')) > 3 then 1 else 0 end, 3, 31)
    when 'A' then make_date(extract(year from (p_at at time zone 'America/Bogota'))::int
                            + case when extract(month from (p_at at time zone 'America/Bogota')) > 6 then 1 else 0 end, 6, 30)
    else null
  end
$$;

-- ── 2. Historial de clases en vivo del estudiante ─────────────────────────
create or replace function public.live_my_history()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_cal text;
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_out jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = '42501'; end if;

  select i.calendar into v_cal
    from public.profiles p left join public.institutions i on i.id = p.institution_id
   where p.id = v_uid;

  select coalesce(jsonb_agg(t.item order by t.ended_at desc), '[]'::jsonb) into v_out
  from (
    select coalesce(s.ended_at, s.created_at) as ended_at,
           jsonb_build_object(
             'session_id', s.id,
             'title', s.title,
             'course_id', s.course_id,
             'course_name', c.name,
             'ended_at', coalesce(s.ended_at, s.created_at),
             'score', lp.score,
             'calendar', v_cal,
             'available_until', public.live_review_until(coalesce(s.ended_at, s.created_at), v_cal),
             'items', (
               select coalesce(jsonb_agg(jsonb_build_object(
                        'module_id', q.module_id,
                        'module_title', cm.title,
                        'bank', cm.challenge_data->>'bank',
                        'question_index', q.question_index,
                        'answered', mine.id is not null,
                        'answer', mine.answer_index,
                        'correct', coalesce(mine.is_correct, false),
                        'question', cm.challenge_data->'questions'->q.question_index
                      ) order by q.first_at, q.question_index), '[]'::jsonb)
                 from (
                   select a.module_id, a.question_index, min(a.created_at) as first_at
                     from public.live_answers a
                    where a.session_id = s.id
                    group by a.module_id, a.question_index
                 ) q
                 left join public.course_modules cm on cm.id = q.module_id
                 left join public.live_answers mine
                        on mine.participant_id = lp.id
                       and mine.question_index = q.question_index
                       and mine.module_id is not distinct from q.module_id
                where coalesce(cm.challenge_type, 'quiz') <> 'poll'
             )
           ) as item
      from public.live_participants lp
      join public.live_sessions s on s.id = lp.session_id
      left join public.courses c on c.id = s.course_id
     where lp.user_id = v_uid
       and s.status = 'ended'
       and (public.live_review_until(coalesce(s.ended_at, s.created_at), v_cal) is null
            or public.live_review_until(coalesce(s.ended_at, s.created_at), v_cal) >= v_today)
     order by coalesce(s.ended_at, s.created_at) desc
     limit 40
  ) t;

  return v_out;
end $$;

revoke execute on function public.live_my_history() from public;
grant execute on function public.live_my_history() to authenticated;

-- ── 3. Comentarios de los profesores ──────────────────────────────────────
create table if not exists public.platform_feedback (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid default auth.uid(),
  user_name      text,
  user_email     text,
  role           text,
  institution_id uuid,
  page           text,
  category       text,
  rating         smallint,
  message        text not null,
  status         text not null default 'nuevo',
  created_at     timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'platform_feedback_rating_chk') then
    alter table public.platform_feedback add constraint platform_feedback_rating_chk check (rating is null or rating between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'platform_feedback_message_chk') then
    alter table public.platform_feedback add constraint platform_feedback_message_chk check (char_length(btrim(message)) between 3 and 4000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'platform_feedback_status_chk') then
    alter table public.platform_feedback add constraint platform_feedback_status_chk check (status in ('nuevo', 'revisado', 'resuelto'));
  end if;
end $$;
create index if not exists platform_feedback_created_idx on public.platform_feedback (created_at desc);

-- Quién escribe sale del perfil, no de lo que mande el navegador.
create or replace function public.platform_feedback_fill()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prof public.profiles;
begin
  new.user_id := auth.uid();
  select * into v_prof from public.profiles where id = new.user_id;
  new.user_name := v_prof.name;
  new.user_email := v_prof.email;
  new.role := v_prof.role::text;
  new.institution_id := v_prof.institution_id;
  new.status := 'nuevo';
  new.created_at := now();
  return new;
end $$;
drop trigger if exists platform_feedback_fill on public.platform_feedback;
create trigger platform_feedback_fill before insert on public.platform_feedback
  for each row execute function public.platform_feedback_fill();

alter table public.platform_feedback enable row level security;
drop policy if exists pf_insert_staff on public.platform_feedback;
create policy pf_insert_staff on public.platform_feedback for insert to authenticated
  with check (public.is_instructor() or public.is_admin());
drop policy if exists pf_admin_read on public.platform_feedback;
create policy pf_admin_read on public.platform_feedback for select to authenticated
  using (public.is_admin());
drop policy if exists pf_admin_update on public.platform_feedback;
create policy pf_admin_update on public.platform_feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists pf_admin_delete on public.platform_feedback;
create policy pf_admin_delete on public.platform_feedback for delete to authenticated
  using (public.is_admin());
