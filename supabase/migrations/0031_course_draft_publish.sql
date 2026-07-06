-- ============================================================
-- 0031_course_draft_publish.sql
-- Borrador / Publicar para el fork de curso por colegio (tutores).
--
-- Antes, "Guardar cambios" escribía DIRECTO en course_modules — lo que ya
-- ven los estudiantes — sin forma de probar cambios sin publicarlos.
-- Ahora el editor guarda primero un borrador (courses.draft_modules) y
-- solo al pulsar "Publicar" se aplica a course_modules real (mismo camino
-- que ya existía: saveCourseModules).
--
-- Se mantiene UNA sola copia editable por colegio (como hoy) — el borrador
-- vive en la MISMA fila de courses, no se crean copias/forks adicionales.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Aditiva/idempotente.
-- ============================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS draft_modules    jsonb,       -- snapshot del editor (moduleList) sin publicar; NULL = sin borrador pendiente
  ADD COLUMN IF NOT EXISTS draft_name       text,        -- nombre personalizado pendiente de publicar
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz;
