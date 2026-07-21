-- ============================================================
-- 0040: Ocultar en el servidor el contenido de los módulos con
-- código presencial (fix de seguridad sobre 0039)
--
-- Problema: 0039 solo ocultaba en el frontend el contenido de un módulo
-- con requires_presence_code=true (componente PresenceGate). Pero el
-- contenido real (content, challenge_data — incluye respuestas correctas
-- de quiz) ya viajaba completo al navegador desde el primer login, porque
-- loadStudentSession/switchCourse/loadCourseModules hacían un
-- `select('*')` plano sobre course_modules. Cualquier estudiante podía
-- verlo con DevTools (pestaña Network) sin necesitar el código.
--
-- Fix: los tres puntos de carga de módulos del ESTUDIANTE (login/restore,
-- cambio de curso, inscripción) pasan a usar esta función en vez del
-- select plano. La función solo vacía content/challenge_data de los
-- módulos que están gateados Y que el usuario aún no ha desbloqueado en
-- presence_unlocks — el resto de columnas (título, tipo, xp, etc.) se
-- devuelve igual, así el mapa/candado siguen funcionando.
--
-- El editor de ruta (instructor) sigue leyendo course_modules directo:
-- necesita ver/editar el contenido completo siempre.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase, DESPUÉS de 0039.
-- Idempotente: CREATE OR REPLACE.
-- ============================================================

create or replace function public.get_course_modules_for_student(p_course_id uuid)
returns table (
  id uuid, course_id uuid, title text, subtitle text, description text,
  type text, challenge_type text, "order" int, is_enabled boolean, xp int,
  content jsonb, attachments jsonb, challenge_data jsonb, requirements text[],
  area_id text, character_line text, requires_presence_code boolean
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
    cm.requirements, cm.area_id, cm.character_line, cm.requires_presence_code
  from public.course_modules cm
  where cm.course_id = p_course_id and cm.is_enabled = true
  order by cm."order";
end; $$;

grant execute on function public.get_course_modules_for_student(uuid) to authenticated;
