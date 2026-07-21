-- ============================================================
-- 0039: Código presencial — bloquear un paso de la ruta hasta que
-- el profe lo active en clase
--
-- Cualquier nodo de la ruta (módulo/reto/evaluación) se puede marcar con
-- course_modules.requires_presence_code = true. El estudiante no puede ver
-- el contenido de ese nodo hasta ingresar un código corto que el profe
-- genera y dice en voz alta en clase — pensado para asegurar que esa parte
-- se resuelva estando físicamente presente, no en cualquier momento/lugar.
--
-- Mismo patrón de seguridad que Modo Aula en Vivo (0022): el código vigente
-- vive en presence_gates, que SOLO el host puede leer (sin policy de select
-- pública, análogo a live_session_keys). Toda escritura de estudiante pasa
-- por redeem_presence_code, SECURITY DEFINER, que valida el código en el
-- servidor y nunca lo revela. Una vez desbloqueado, queda desbloqueado
-- (presence_unlocks, upsert idempotente — mismo patrón que
-- complete_course_module de 0035).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE.
-- ============================================================

-- ── Columna nueva en course_modules ──────────────────────────
alter table public.course_modules
  add column if not exists requires_presence_code boolean not null default false;

-- ── Tablas ──────────────────────────────────────────────────
create table if not exists public.presence_gates (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.course_modules(id) on delete cascade,
  host_id     uuid not null,
  code        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '3 hours')
);
create unique index if not exists presence_gates_active_module_idx
  on public.presence_gates(module_id) where active;

create table if not exists public.presence_unlocks (
  user_id     uuid not null,
  module_id   uuid not null references public.course_modules(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.presence_gates   enable row level security;
alter table public.presence_unlocks enable row level security;

drop policy if exists presence_gates_host_select on public.presence_gates;
create policy presence_gates_host_select on public.presence_gates
  for select using (host_id = auth.uid());

drop policy if exists presence_unlocks_own_select on public.presence_unlocks;
create policy presence_unlocks_own_select on public.presence_unlocks
  for select using (user_id = auth.uid());

-- Sin policies de insert/update para ningún rol: toda escritura pasa por las
-- funciones SECURITY DEFINER de abajo.

-- ── RPC: generar código (instructor/admin) ───────────────────
create or replace function public.generate_presence_code(p_module_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_expires timestamptz := now() + interval '3 hours';
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado';
  end if;

  update public.presence_gates
    set active = false
    where module_id = p_module_id and active;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.presence_gates
      where module_id = p_module_id and code = v_code and active
    );
  end loop;

  insert into public.presence_gates (module_id, host_id, code, active, expires_at)
  values (p_module_id, auth.uid(), v_code, true, v_expires);

  return query select v_code, v_expires;
end; $$;

-- ── RPC: canjear código (estudiante) ─────────────────────────
create or replace function public.redeem_presence_code(p_module_id uuid, p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  select exists (
    select 1 from public.presence_gates
    where module_id = p_module_id
      and code = p_code
      and active
      and expires_at > now()
  ) into v_ok;

  if v_ok then
    insert into public.presence_unlocks (user_id, module_id)
    values (auth.uid(), p_module_id)
    on conflict (user_id, module_id) do nothing;
  end if;

  return v_ok;
end; $$;

grant execute on function public.generate_presence_code(uuid) to authenticated;
grant execute on function public.redeem_presence_code(uuid, text) to authenticated;
