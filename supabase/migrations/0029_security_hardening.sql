-- ============================================================
-- 0029: Endurecimiento de seguridad (sin afectar el aplicativo)
--
-- Corrige:
--   [CRÍTICO] Escalación de privilegios: un usuario podía cambiar su propio
--             role/is_active/institution_id/cohort_id vía la API (la política
--             "update own profile" no tenía WITH CHECK por columna).
--   [MEDIO]   Instructores podían leer perfiles de TODAS las instituciones.
--   [MEDIO]   Aula en Vivo: correo/user_id de participantes eran legibles por
--             cualquiera (anon). Se ocultan por column-privileges.
--   [MEDIO]   submit_live_answer no validaba dueño del participante: se añade
--             claim_token (secreto por participante) + validación de sesión.
--
-- Idempotente. Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- No cambia ningún comportamiento visible del frontend.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- [1] PERFILES — impedir auto-escalación de campos sensibles
-- ────────────────────────────────────────────────────────────
-- La política "update own profile" (0001) permite a un usuario actualizar su
-- propia fila, pero NO restringía qué columnas. Un trigger BEFORE UPDATE rechaza
-- cambios a columnas privilegiadas salvo que el actor sea admin. Las acciones
-- legítimas del cliente (last_seen, current_module, avatar, area, onboarded,
-- onboarding_bonus) no tocan estas columnas, así que no se ven afectadas. Los
-- admins (is_admin()) siguen pudiendo cambiarlas desde AdminUsers/AdminCohorts.

create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;  -- admin puede todo (AdminUsers, AdminSchools, AdminCohorts)
  end if;

  if new.role is distinct from old.role then
    raise exception 'No autorizado: no puedes cambiar el rol' using errcode = '42501';
  end if;
  if new.is_active is distinct from old.is_active then
    raise exception 'No autorizado: no puedes cambiar el estado activo' using errcode = '42501';
  end if;
  if new.institution_id is distinct from old.institution_id then
    raise exception 'No autorizado: no puedes cambiar la institución' using errcode = '42501';
  end if;
  if new.cohort_id is distinct from old.cohort_id then
    raise exception 'No autorizado: no puedes cambiar la cohorte' using errcode = '42501';
  end if;

  return new;
end; $$;

drop trigger if exists trg_guard_profile_privileged on public.profiles;
create trigger trg_guard_profile_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ────────────────────────────────────────────────────────────
-- [2] PERFILES — acotar lectura de instructores a su institución
-- ────────────────────────────────────────────────────────────
-- Antes: cualquier instructor podía leer TODOS los perfiles (PII de otras
-- instituciones). Ahora un instructor solo lee su propio perfil y los de su
-- misma institución. Coincide con lo que ya hace el frontend (sessionData.js
-- filtra por institution_id), así que no cambia el comportamiento visible.
-- Un instructor SIN institución conserva visibilidad amplia (evita regresión).

create or replace function public.my_institution()
returns uuid language sql security definer stable set search_path = public as $$
  select institution_id from public.profiles where id = auth.uid();
$$;

drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  or (
    public.is_instructor()
    and (public.my_institution() is null or institution_id = public.my_institution())
  )
);

-- ────────────────────────────────────────────────────────────
-- [3] AULA EN VIVO — ocultar PII (correo/user_id) de participantes
-- ────────────────────────────────────────────────────────────
-- live_participants es de lectura pública (para el leaderboard). El frontend
-- solo muestra nombre/apellido/salón/puntaje; correo y user_id nunca se leen en
-- la UI. Restringimos las columnas legibles por anon/authenticated para que el
-- correo deje de estar expuesto. La escritura sigue por RPC SECURITY DEFINER.

-- claim_token: secreto por participante (lo recibe solo quien se une, vía la RPC
-- join_live_session). NO es legible por la tabla. Sirve para validar quién envía
-- respuestas. Nullable/sin default: los participantes previos (token null) no se
-- bloquean; los nuevos quedan protegidos.
alter table public.live_participants add column if not exists claim_token uuid;

revoke select on public.live_participants from anon, authenticated;
grant  select (id, session_id, nombre, apellido, salon, score, streak, joined_at, last_seen)
  on public.live_participants to anon, authenticated;

-- El host (profesor) puede recuperar el roster COMPLETO (incl. correo) de su
-- propia sesión mediante esta función (p.ej. para exportar asistencia).
create or replace function public.live_roster(p_session uuid)
returns setof public.live_participants
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.live_sessions
                 where id = p_session and host_id = auth.uid()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  return query
    select * from public.live_participants
     where session_id = p_session
     order by score desc, joined_at asc;
end; $$;
grant execute on function public.live_roster(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────
-- [4] AULA EN VIVO — validar dueño del participante al responder
-- ────────────────────────────────────────────────────────────
-- Antes: cualquier anon podía enviar respuestas en nombre de otro participante
-- (los IDs eran públicos). Ahora se valida (a) que el participante pertenece a
-- la sesión y (b) el claim_token secreto. Compatible hacia atrás: si el
-- participante no tiene token (creado antes de esta migración), no se exige.

-- join: ahora genera y devuelve claim_token al que se une (solo a él).
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

  insert into public.live_participants(session_id, user_id, nombre, apellido, correo, salon, claim_token)
  values (v_sess.id, auth.uid(), trim(p_nombre), nullif(trim(p_apellido),''),
          nullif(trim(p_correo),''), nullif(trim(p_salon),''), gen_random_uuid())
  returning * into v_p;
  return v_p;
end; $$;

-- submit: nuevo parámetro p_token. Valida sesión + token del participante.
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

  -- El participante debe existir y pertenecer a ESTA sesión.
  select * into v_part from public.live_participants
   where id = p_participant and session_id = p_session;
  if v_part.id is null then raise exception 'Participante inválido'; end if;
  -- Si tiene token (unido tras esta migración), debe coincidir.
  if v_part.claim_token is not null and v_part.claim_token is distinct from p_token then
    raise exception 'No autorizado' using errcode = '42501';
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

-- Re-otorgar ejecución (la firma de submit cambió: hay que conceder la nueva).
grant execute on function public.join_live_session(text,text,text,text,text)        to anon, authenticated;
grant execute on function public.submit_live_answer(uuid,uuid,int,int,uuid)          to anon, authenticated;
