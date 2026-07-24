-- ============================================================
-- 0042: Código presencial SIN vencimiento (antes expiraba a las 3h)
--
-- Cambios sobre 0039:
--   • presence_gates.expires_at pasa a ser NULLABLE; NULL = no vence.
--   • generate_presence_code inserta expires_at = NULL (sin límite). Sigue
--     invalidando el código anterior del módulo (un solo activo por módulo).
--   • redeem_presence_code acepta el código si está activo Y (no vence O aún
--     no ha vencido) — retrocompatible con códigos viejos que sí tenían fecha.
--   • FIX de un bug que venía de 0039: la función devuelve una columna `code`
--     y a la vez consultaba `presence_gates.code` sin calificar → Postgres
--     lanzaba «column reference "code" is ambiguous» y NUNCA generaba código.
--     Ahora la subconsulta usa alias de tabla (g.code) para desambiguar.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase, DESPUÉS de 0039.
-- Idempotente (CREATE OR REPLACE + ALTER IF).
-- ============================================================

-- 1) La fecha de vencimiento deja de ser obligatoria; el default deja de sumar 3h.
alter table public.presence_gates alter column expires_at drop not null;
alter table public.presence_gates alter column expires_at drop default;

-- 2) Generar código: sin vencimiento (expires_at = NULL)
create or replace function public.generate_presence_code(p_module_id uuid)
returns table (code text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not (public.is_instructor() or public.is_admin()) then
    raise exception 'No autorizado';
  end if;

  -- Invalida el código anterior de este módulo (máx. 1 activo por módulo)
  update public.presence_gates
    set active = false
    where module_id = p_module_id and active;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    -- alias `g` para desambiguar g.code del OUT column `code` de la función
    exit when not exists (
      select 1 from public.presence_gates g
      where g.module_id = p_module_id and g.code = v_code and g.active
    );
  end loop;

  insert into public.presence_gates (module_id, host_id, code, active, expires_at)
  values (p_module_id, auth.uid(), v_code, true, null);

  return query select v_code, null::timestamptz;
end; $$;

-- 3) Canjear código: válido si activo y (sin vencimiento O aún vigente)
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
      and (expires_at is null or expires_at > now())
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
