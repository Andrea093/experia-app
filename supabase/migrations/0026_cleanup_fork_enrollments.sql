-- ============================================================
-- 0026_cleanup_fork_enrollments.sql
-- Limpia matrículas/accesos que apuntan a un FORK (copia de tutor
-- por colegio, parent_course_id != null) en vez de al curso PADRE.
--
-- Contexto: los forks son copias que reemplazan de forma transparente
-- al curso padre para los estudiantes de un colegio. El estudiante debe
-- estar matriculado en el PADRE; el fork se resuelve solo al cargar los
-- módulos (loadStudentSession / resolveCourseForStudent).
--
-- Síntoma que corrige: un estudiante veía en "Selecciona tu curso" tanto
-- el curso original como su copia "— <fecha>" (y a veces el original
-- duplicado). Esto pasó porque el fork quedó listado en el gestor de
-- cursos del admin y, al asignarlo a un colegio, autoEnroll matriculó a
-- todos sus estudiantes en la copia. El frontend ya no muestra forks en
-- los selectores; esta migración arregla los datos ya existentes.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Corre PRIMERO la sección A (diagnóstico), revisa, y LUEGO la B.
-- ============================================================

-- ── SECCIÓN A · DIAGNÓSTICO (solo SELECT, no cambia nada) ────────────────────

-- A.1 · Todos los forks existentes (parent_course_id != null)
SELECT id, name, parent_course_id, institution_id, owner_id, is_active, created_at
  FROM public.courses
  WHERE parent_course_id IS NOT NULL
  ORDER BY parent_course_id, institution_id, created_at;

-- A.2 · Estado concreto de un estudiante (ej. adriana.vargas@ceinfes.com):
--       sus matrículas y accesos, marcando cuáles apuntan a un fork.
SELECT p.email,
       c.id            AS course_id,
       c.name          AS course_name,
       c.parent_course_id,
       (c.parent_course_id IS NOT NULL) AS es_fork,
       'enrollment'    AS origen
  FROM public.course_enrollments ce
  JOIN public.profiles p ON p.id = ce.student_id
  JOIN public.courses  c ON c.id = ce.course_id
  WHERE p.email = 'adriana.vargas@ceinfes.com'
UNION ALL
SELECT p.email, c.id, c.name, c.parent_course_id,
       (c.parent_course_id IS NOT NULL), 'user_courses(' || uc.is_active || ')'
  FROM public.user_courses uc
  JOIN public.profiles p ON p.id = uc.user_id
  JOIN public.courses  c ON c.id = uc.course_id
  WHERE p.email = 'adriana.vargas@ceinfes.com';


-- ── SECCIÓN B · LIMPIEZA (descomenta para aplicar, tras revisar A) ───────────
-- Estrategia: garantiza matrícula/acceso/progreso en el curso PADRE (sin
-- perder avances), y luego elimina las filas que apuntan al fork. Es
-- idempotente. NO borra progreso: lo migra al padre solo si el padre no
-- tenía progreso previo.

BEGIN;

-- B.1 · Asegurar matrícula en el curso PADRE de todo fork matriculado
INSERT INTO public.course_enrollments (student_id, course_id, institution_id)
SELECT ce.student_id, c.parent_course_id, ce.institution_id
  FROM public.course_enrollments ce
  JOIN public.courses c ON c.id = ce.course_id
  WHERE c.parent_course_id IS NOT NULL
ON CONFLICT (student_id, course_id) DO NOTHING;

-- B.2 · Asegurar acceso (user_courses) en el curso PADRE
INSERT INTO public.user_courses (user_id, course_id, is_active)
SELECT uc.user_id, c.parent_course_id, true
  FROM public.user_courses uc
  JOIN public.courses c ON c.id = uc.course_id
  WHERE c.parent_course_id IS NOT NULL AND uc.is_active
ON CONFLICT (user_id, course_id) DO NOTHING;

-- B.3 · Migrar progreso del fork al padre (solo si el padre no tiene)
INSERT INTO public.course_progress (user_id, course_id, xp, completed, badges)
SELECT cp.user_id, c.parent_course_id, cp.xp, cp.completed, cp.badges
  FROM public.course_progress cp
  JOIN public.courses c ON c.id = cp.course_id
  WHERE c.parent_course_id IS NOT NULL
ON CONFLICT (user_id, course_id) DO NOTHING;

-- B.4 · Eliminar matrículas/accesos que apuntan a un fork (ya migrados)
DELETE FROM public.course_enrollments ce
  USING public.courses c
  WHERE ce.course_id = c.id AND c.parent_course_id IS NOT NULL;

DELETE FROM public.user_courses uc
  USING public.courses c
  WHERE uc.course_id = c.id AND c.parent_course_id IS NOT NULL;

-- B.5 · Desasignar cualquier fork de institution_courses para que
--       autoEnroll no vuelva a matricular a nadie en la copia.
UPDATE public.institution_courses ic SET is_active = false
  FROM public.courses c
  WHERE ic.course_id = c.id AND c.parent_course_id IS NOT NULL;

COMMIT;

-- ── Verificación posterior (debe quedar sin filas) ───────────────────────────
-- SELECT COUNT(*) AS matriculas_a_forks
--   FROM public.course_enrollments ce JOIN public.courses c ON c.id = ce.course_id
--   WHERE c.parent_course_id IS NOT NULL;
