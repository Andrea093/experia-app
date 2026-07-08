-- ============================================================
-- 0038: Repara (de nuevo) el progreso huérfano del MOOC "Ecosistema Digital IA"
--
-- Causa raíz (misma que 0034, ha vuelto a ocurrir): 0020_seed_ecosistema_ia_
-- course.sql hace DELETE + INSERT de los 8 módulos cada vez que se corre
-- (para reemplazar los placeholders de video por las URLs reales, por
-- ejemplo). Cada corrida genera UUIDs nuevos con gen_random_uuid(). Si algún
-- estudiante ya tenía course_progress.completed[] con los IDs viejos, esos
-- IDs dejan de existir en course_modules y nodeStatus() nunca los reconoce
-- como cumplidos: el estudiante ve 0% y todo bloqueado salvo el primer
-- módulo, aunque su XP siga reflejando el avance real.
--
-- Diferencia con 0034: aquella reparación asumía xp % 100 = 0 (estrictamente
-- 100 XP por módulo). No repara a estudiantes que además ganaron XP de otra
-- fuente (bonus de "Primeros pasos" +50, participación en foro +30, etc.),
-- que es exactamente el caso visto ahora (650 XP = 6 módulos × 100 + 50 de
-- bonus). Esta versión no depende de xp en absoluto: usa la LONGITUD del
-- arreglo completed[] (cuántos módulos había completado, sin importar cuáles
-- IDs) y remapea a los primeros N módulos actuales por "order" — el curso es
-- estrictamente secuencial, así que esto reconstruye el avance real.
--
-- Idempotente / segura de re-ejecutar: a quien ya tenga completed[] válido
-- (subconjunto de los módulos actuales) no lo toca.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
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
  LOOP
    v_n := LEAST(array_length(r.completed, 1), v_total_mods);
    UPDATE public.course_progress
       SET completed = v_module_ids[1:v_n]::text[],
           updated_at = now()
     WHERE user_id = r.user_id AND course_id = v_course_id;
    RAISE NOTICE 'Reparado user_id=% : % módulo(s) re-mapeados (tenía % ids huérfanos, xp=%)', r.user_id, v_n, array_length(r.completed, 1), r.xp;
  END LOOP;
END $$;

-- ── Verificación: ¿queda alguien con progreso huérfano SIN reparar? ──
SELECT p.name, p.email, cp.xp, cp.completed
FROM public.course_progress cp
JOIN public.profiles p ON p.id = cp.user_id
WHERE cp.course_id = (SELECT id FROM public.courses WHERE name = 'Ecosistema Digital IA — MOOC para docentes')
  AND cp.completed <> '{}'
  AND NOT (cp.completed <@ (
    SELECT array_agg(id::text) FROM public.course_modules
    WHERE course_id = (SELECT id FROM public.courses WHERE name = 'Ecosistema Digital IA — MOOC para docentes')
  ));
