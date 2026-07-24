-- ============================================================
-- 0044: Ventana de disponibilidad por módulo (entrega final)
--
-- El tutor puede definir un rango de fechas en el que el módulo de entrega
-- (final_delivery) está disponible para el estudiante:
--   • course_modules.available_from  (timestamptz, nullable): abre en esta fecha
--   • course_modules.available_until (timestamptz, nullable): cierra en esta fecha
-- NULL en cualquiera = sin límite por ese lado. Las dos NULL = siempre disponible.
--
-- Se recrea get_course_modules_for_student (0040) para que devuelva estas dos
-- columnas al estudiante (el Grid muestra el tiempo restante / fechas y bloquea
-- fuera de la ventana). El cierre "duro" real lo hace el Grid en el cliente; si
-- se quisiera blindar por servidor, se podría vaciar content/challenge_data
-- fuera de la ventana igual que con requires_presence_code — por ahora no es
-- necesario porque la entrega no tiene contenido sensible.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase, DESPUÉS de 0040.
-- Aditiva e idempotente.
-- ============================================================

alter table public.course_modules
  add column if not exists available_from  timestamptz,
  add column if not exists available_until timestamptz;

comment on column public.course_modules.available_from is
  'Ventana de disponibilidad: el módulo abre en esta fecha (NULL = sin inicio).';
comment on column public.course_modules.available_until is
  'Ventana de disponibilidad: el módulo cierra en esta fecha (NULL = sin fin).';

-- Recrear la RPC del estudiante para incluir las dos columnas nuevas.
-- DROP primero: al agregar columnas al RETURNS TABLE cambia el tipo de retorno,
-- y CREATE OR REPLACE no permite cambiarlo (error 42P13). DROP + CREATE sí.
drop function if exists public.get_course_modules_for_student(uuid);
create or replace function public.get_course_modules_for_student(p_course_id uuid)
returns table (
  id uuid, course_id uuid, title text, subtitle text, description text,
  type text, challenge_type text, "order" int, is_enabled boolean, xp int,
  content jsonb, attachments jsonb, challenge_data jsonb, requirements text[],
  area_id text, character_line text, requires_presence_code boolean,
  available_from timestamptz, available_until timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  return query
  select
    cm.id, cm.course_id, cm.title, cm.subtitle, cm.description,
    cm.type, cm.challenge_type, cm."order", cm.is_enabled, cm.xp,
    case
      when cm.requires_presence_code and not exists (
        select 1 from public.presence_unlocks pu
        where pu.user_id = auth.uid() and pu.module_id = cm.id
      ) then '[]'::jsonb
      else coalesce(cm.content, '[]'::jsonb)
    end as content,
    cm.attachments,
    case
      when cm.requires_presence_code and not exists (
        select 1 from public.presence_unlocks pu
        where pu.user_id = auth.uid() and pu.module_id = cm.id
      ) then '{}'::jsonb
      else coalesce(cm.challenge_data, '{}'::jsonb)
    end as challenge_data,
    cm.requirements, cm.area_id, cm.character_line, cm.requires_presence_code,
    cm.available_from, cm.available_until
  from public.course_modules cm
  where cm.course_id = p_course_id and cm.is_enabled = true
  order by cm."order";
end; $$;

grant execute on function public.get_course_modules_for_student(uuid) to authenticated;
