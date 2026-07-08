-- ============================================================
-- 0034: Repara progreso huérfano del MOOC "Ecosistema Digital IA"
--
-- Causa raíz: 0020_seed_ecosistema_ia_course.sql borra y reinserta los 8
-- módulos en cada corrida (IDs nuevos con gen_random_uuid() cada vez). Si
-- se volvió a ejecutar esa migración (p.ej. para cargar las URLs reales de
-- los videos) DESPUÉS de que algún estudiante ya hubiera completado uno o
-- más módulos, su course_progress.completed[] quedó con IDs que ya no
-- existen en course_modules — nodeStatus() nunca los reconoce como
-- cumplidos y el estudiante queda bloqueado sin poder avanzar, aunque su
-- XP ya refleje el avance real.
--
-- Este script:
--   1) Detecta estudiantes de este curso cuyo completed[] tiene algún id
--      que YA NO EXISTE en los módulos actuales (huérfano).
--   2) Asume curso estrictamente secuencial, 100 XP por módulo (como está
--      sembrado hoy): re-mapea completed[] a los primeros N módulos
--      actuales (por "order"), con N = xp/100 (tope: total de módulos).
--   3) Dejar intacto a cualquiera cuyo completed[] ya sea válido
--      (idempotente / seguro de re-ejecutar).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ⚠️ Antes de aplicar, revisa el SELECT de verificación al final: si algún
--    estudiante tiene xp que no es múltiplo de 100 (progreso ganado de
--    otra forma, p.ej. ajustado a mano por un admin), este script NO lo
--    toca — quedará listado para revisión manual aparte.
-- ============================================================

DO $$
DECLARE
  v_course_id   uuid;
  v_module_ids  uuid[];
  v_total_mods  int;
  r             record;
  v_n           int;
BEGIN
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE name = 'Ecosistema Digital IA — MOOC para docentes';

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el curso "Ecosistema Digital IA — MOOC para docentes".';
  END IF;

  SELECT array_agg(id ORDER BY "order") INTO v_module_ids
  FROM public.course_modules WHERE course_id = v_course_id;
  v_total_mods := coalesce(array_length(v_module_ids, 1), 0);

  IF v_total_mods = 0 THEN
    RAISE EXCEPTION 'El curso no tiene módulos actualmente — nada que reparar.';
  END IF;

  FOR r IN
    SELECT cp.user_id, cp.completed, cp.xp
    FROM public.course_progress cp
    WHERE cp.course_id = v_course_id
      AND cp.completed <> '{}'
      AND NOT (cp.completed <@ v_module_ids::text[])   -- tiene algún id huérfano
      AND cp.xp % 100 = 0                               -- solo casos "limpios": xp = N módulos completos
  LOOP
    v_n := LEAST(r.xp / 100, v_total_mods);
    UPDATE public.course_progress
       SET completed = v_module_ids[1:v_n]::text[],
           updated_at = now()
     WHERE user_id = r.user_id AND course_id = v_course_id;
    RAISE NOTICE 'Reparado user_id=% : % módulo(s) re-mapeados (xp=%)', r.user_id, v_n, r.xp;
  END LOOP;
END $$;

-- ── Verificación: ¿queda alguien con progreso huérfano SIN reparar? ──
-- (por ejemplo, xp que no es múltiplo de 100 — requiere revisión manual)
SELECT p.name, p.email, cp.xp, cp.completed
FROM public.course_progress cp
JOIN public.profiles p ON p.id = cp.user_id
WHERE cp.course_id = (SELECT id FROM public.courses WHERE name = 'Ecosistema Digital IA — MOOC para docentes')
  AND cp.completed <> '{}'
  AND NOT (cp.completed <@ (
    SELECT array_agg(id::text) FROM public.course_modules
    WHERE course_id = (SELECT id FROM public.courses WHERE name = 'Ecosistema Digital IA — MOOC para docentes')
  ));
