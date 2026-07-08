-- ============================================================
-- 0035: Completar módulo de forma atómica en el servidor
--
-- Causa raíz del bug de "no se desbloquea el siguiente módulo": completeNode
-- (store.jsx) calculaba el nuevo completed[]/xp EN EL CLIENTE a partir del
-- estado en memoria (s.completed) y hacía un UPDATE que REEMPLAZA toda la
-- fila de course_progress. Si el navegador tenía una pestaña vieja abierta
-- (estado desactualizado en memoria — típico tras re-sembrar un curso o con
-- el service worker de la PWA), esa pestaña podía SOBRESCRIBIR avances más
-- recientes hechos en otra pestaña/sesión, corrompiendo completed[] con
-- mezclas de IDs viejos y nuevos (visto en vivo con Yeimy Bustos).
--
-- complete_course_module() mueve el "agregar este módulo" al servidor con
-- upsert + lógica idempotente (mismo patrón que live_complete_module_for_-
-- participants de 0033): agrega el id solo si no estaba, nunca sobrescribe
-- con un arreglo completo calculado en el cliente. Inmune a pestañas viejas.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: CREATE OR REPLACE.
-- ============================================================

create or replace function public.complete_course_module(
  p_course_id uuid, p_module_id uuid, p_xp int default 100, p_badge text default null
) returns public.course_progress
language plpgsql security definer set search_path = public as $$
declare v_row public.course_progress;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  insert into public.course_progress (user_id, course_id, xp, completed, badges)
  values (
    auth.uid(), p_course_id, coalesce(p_xp, 100),
    array[p_module_id::text],
    case when p_badge is not null then array[p_badge] else '{}'::text[] end
  )
  on conflict (user_id, course_id) do update
    set xp = public.course_progress.xp
           + case when p_module_id::text = any(public.course_progress.completed) then 0 else coalesce(p_xp, 100) end,
        completed = case when p_module_id::text = any(public.course_progress.completed)
                          then public.course_progress.completed
                          else public.course_progress.completed || p_module_id::text end,
        badges = case when p_badge is not null and not (p_badge = any(public.course_progress.badges))
                       then public.course_progress.badges || p_badge
                       else public.course_progress.badges end,
        updated_at = now()
  returning * into v_row;

  return v_row;
end; $$;

grant execute on function public.complete_course_module(uuid, uuid, int, text) to authenticated;
