-- ============================================================
-- 0022: Modo Aula en Vivo (quiz sincrónico tipo Kahoot, dirigido por el profe)
--
-- Tablas:
--   live_sessions       · estado de la sesión (fase, pregunta actual, snapshot SIN respuestas)
--   live_session_keys   · respuestas correctas + explicación (NO legible por estudiantes)
--   live_participants   · quien se unió por PIN (nombre, apellido, correo, salón) + puntaje
--   live_answers        · respuestas enviadas (1 por participante/pregunta)
--
-- Seguridad: las respuestas correctas viven en live_session_keys (solo el host la
-- lee). Estudiantes leen live_sessions (snapshot sin 'correct'). Toda escritura de
-- estudiante pasa por funciones SECURITY DEFINER que validan estado y calculan el
-- puntaje en el servidor (anti-trampa). El "revelado" lo controla el profesor.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── Tablas ──────────────────────────────────────────────────
create table if not exists public.live_sessions (
  id                  uuid primary key default gen_random_uuid(),
  course_id           uuid,
  module_id           uuid,
  host_id             uuid not null,
  title               text,
  code                text not null,
  status              text not null default 'lobby',   -- lobby | active | ended
  phase               text not null default 'lobby',   -- lobby | question | reveal | explanation | leaderboard | podium
  current_index       int  not null default 0,
  total_questions     int  not null default 0,
  time_limit_s        int  not null default 20,
  question_started_at timestamptz,
  questions           jsonb not null default '[]'::jsonb,  -- snapshot SIN 'correct'
  current_reveal      jsonb,                                -- {correct, explanation, explanationImage} (solo en reveal/explanation)
  created_at          timestamptz default now(),
  ended_at            timestamptz
);
create unique index if not exists live_sessions_code_active_idx
  on public.live_sessions (code) where status <> 'ended';

create table if not exists public.live_session_keys (
  session_id uuid primary key references public.live_sessions(id) on delete cascade,
  host_id    uuid,
  answer_key jsonb not null default '[]'::jsonb            -- [{correct,points,time_limit_s,explanation,explanationImage}]
);

create table if not exists public.live_participants (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id    uuid,
  nombre     text not null,
  apellido   text,
  correo     text,
  salon      text,
  score      int not null default 0,
  streak     int not null default 0,
  joined_at  timestamptz default now(),
  last_seen  timestamptz default now()
);
create index if not exists live_participants_session_idx on public.live_participants(session_id);

create table if not exists public.live_answers (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.live_sessions(id) on delete cascade,
  participant_id uuid not null references public.live_participants(id) on delete cascade,
  question_index int  not null,
  answer_index   int,
  is_correct     boolean,
  response_ms    int,
  points         int  not null default 0,
  created_at     timestamptz default now(),
  unique (participant_id, question_index)
);
create index if not exists live_answers_session_idx on public.live_answers(session_id, question_index);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.live_sessions      enable row level security;
alter table public.live_session_keys  enable row level security;
alter table public.live_participants  enable row level security;
alter table public.live_answers       enable row level security;

drop policy if exists ls_select   on public.live_sessions;
drop policy if exists ls_host_all  on public.live_sessions;
drop policy if exists lk_host_sel  on public.live_session_keys;
drop policy if exists lp_select    on public.live_participants;
drop policy if exists la_select    on public.live_answers;

-- Sesión: lectura pública (snapshot sin respuestas); el host puede gestionar la suya.
create policy ls_select  on public.live_sessions for select using (true);
create policy ls_host_all on public.live_sessions for all
  using (host_id = auth.uid()) with check (host_id = auth.uid());

-- Llaves: SOLO el host las lee. (Las escrituras van por funciones SECURITY DEFINER.)
create policy lk_host_sel on public.live_session_keys for select using (host_id = auth.uid());

-- Participantes y respuestas: lectura pública (leaderboard / distribución).
-- Las escrituras van exclusivamente por las funciones SECURITY DEFINER de abajo.
create policy lp_select on public.live_participants for select using (true);
create policy la_select on public.live_answers      for select using (true);

-- ── Realtime ────────────────────────────────────────────────
do $$ begin
  begin alter publication supabase_realtime add table public.live_sessions;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.live_participants; exception when duplicate_object then null; end;
end $$;

-- ── RPC: crear sesión (instructor) ──────────────────────────
create or replace function public.create_live_session(
  p_course_id uuid, p_module_id uuid, p_title text, p_questions jsonb, p_default_time int default 20
) returns public.live_sessions
language plpgsql security definer set search_path = public as $$
declare
  v_code text; v_snapshot jsonb := '[]'::jsonb; v_keys jsonb := '[]'::jsonb;
  q jsonb; v_sess public.live_sessions;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

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

-- ── RPC: unirse por PIN (estudiante, anónimo) ───────────────
create or replace function public.join_live_session(
  p_code text, p_nombre text, p_apellido text, p_correo text, p_salon text
) returns public.live_participants
language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions; v_p public.live_participants;
begin
  select * into v_sess from public.live_sessions
   where code = p_code and status <> 'ended' order by created_at desc limit 1;
  if v_sess.id is null then raise exception 'Sesión no encontrada o finalizada'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'El nombre es obligatorio'; end if;

  insert into public.live_participants(session_id, user_id, nombre, apellido, correo, salon)
  values (v_sess.id, auth.uid(), trim(p_nombre), nullif(trim(p_apellido),''),
          nullif(trim(p_correo),''), nullif(trim(p_salon),''))
  returning * into v_p;
  return v_p;
end; $$;

-- ── RPC: enviar respuesta (estudiante) ──────────────────────
create or replace function public.submit_live_answer(
  p_session uuid, p_participant uuid, p_index int, p_answer int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_key jsonb; v_correct int; v_base int; v_limit int;
  v_elapsed numeric; v_frac numeric; v_points int; v_ok boolean; v_existing public.live_answers;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.phase <> 'question' or v_sess.current_index <> p_index then
    raise exception 'La pregunta no está abierta';
  end if;

  select * into v_existing from public.live_answers
   where participant_id = p_participant and question_index = p_index;
  if v_existing.id is not null then
    return jsonb_build_object('already', true, 'points', v_existing.points, 'is_correct', v_existing.is_correct);
  end if;

  select answer_key->p_index into v_key from public.live_session_keys where session_id = p_session;
  v_correct := coalesce((v_key->>'correct')::int, -1);
  v_base    := coalesce((v_key->>'points')::int, 1000);
  v_limit   := coalesce((v_key->>'time_limit_s')::int, v_sess.time_limit_s, 20);
  v_elapsed := extract(epoch from (now() - coalesce(v_sess.question_started_at, now())));
  v_ok      := (p_answer = v_correct);

  if v_ok then
    v_frac   := least(1.0, greatest(0.0, v_elapsed / nullif(v_limit, 0)));
    v_points := round(v_base * (1 - 0.5 * v_frac));
  else
    v_points := 0;
  end if;

  insert into public.live_answers(session_id, participant_id, question_index, answer_index, is_correct, response_ms, points)
  values (p_session, p_participant, p_index, p_answer, v_ok, round(v_elapsed * 1000), v_points);

  update public.live_participants
     set score = score + v_points,
         streak = case when v_ok then streak + 1 else 0 end,
         last_seen = now()
   where id = p_participant;

  return jsonb_build_object('already', false, 'is_correct', v_ok, 'points', v_points);
end; $$;

-- ── RPC: control del profesor ───────────────────────────────
create or replace function public.live_set_phase(p_session uuid, p_phase text)
returns public.live_sessions language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions; v_reveal jsonb;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.host_id <> auth.uid() then raise exception 'No autorizado'; end if;

  if p_phase = 'question' then
    update public.live_sessions set phase='question', status='active',
      question_started_at=now(), current_reveal=null where id=p_session returning * into v_sess;
  elsif p_phase in ('reveal','explanation') then
    select answer_key->v_sess.current_index into v_reveal from public.live_session_keys where session_id=p_session;
    update public.live_sessions set phase=p_phase, current_reveal=v_reveal where id=p_session returning * into v_sess;
  else
    update public.live_sessions set phase=p_phase where id=p_session returning * into v_sess;
  end if;
  return v_sess;
end; $$;

create or replace function public.live_goto(p_session uuid, p_index int)
returns public.live_sessions language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions;
begin
  select * into v_sess from public.live_sessions where id=p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.host_id <> auth.uid() then raise exception 'No autorizado'; end if;
  update public.live_sessions
     set current_index = greatest(0, least(p_index, total_questions - 1)),
         phase='question', status='active', question_started_at=now(), current_reveal=null
   where id=p_session returning * into v_sess;
  return v_sess;
end; $$;

create or replace function public.live_end(p_session uuid)
returns public.live_sessions language plpgsql security definer set search_path = public as $$
declare v_sess public.live_sessions;
begin
  select * into v_sess from public.live_sessions where id=p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.host_id <> auth.uid() then raise exception 'No autorizado'; end if;
  update public.live_sessions set status='ended', phase='podium', ended_at=now()
   where id=p_session returning * into v_sess;
  return v_sess;
end; $$;

-- ── Permisos de ejecución ───────────────────────────────────
grant execute on function public.create_live_session(uuid,uuid,text,jsonb,int) to authenticated;
grant execute on function public.live_set_phase(uuid,text)                     to authenticated;
grant execute on function public.live_goto(uuid,int)                           to authenticated;
grant execute on function public.live_end(uuid)                                to authenticated;
grant execute on function public.join_live_session(text,text,text,text,text)   to anon, authenticated;
grant execute on function public.submit_live_answer(uuid,uuid,int,int)         to anon, authenticated;
