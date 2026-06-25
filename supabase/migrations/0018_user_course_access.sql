-- ============================================================
-- 0018: Control de acceso a cursos POR USUARIO
-- Estrategia: ADITIVA — no toca tablas existentes
--
-- Modelo ESTRICTO: un curso solo está disponible para un
-- estudiante/instructor si existe una fila aquí con is_active=true.
-- Los admins nunca se restringen.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  is_active   boolean NOT NULL DEFAULT true,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS user_courses_user_id_idx ON public.user_courses (user_id);

-- ============ RLS ============
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Cada usuario lee su propio acceso; instructores/admins también leen
CREATE POLICY "read own user_courses"
  ON public.user_courses FOR SELECT
  USING (user_id = auth.uid() OR public.is_instructor() OR public.is_admin());

-- Solo los admins asignan/revocan acceso
CREATE POLICY "admin manage user_courses"
  ON public.user_courses FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- BACKFILL: preserva el comportamiento actual al aplicar la
-- migración para no bloquear a usuarios existentes.
-- ============================================================

-- 1) A cada estudiante/instructor, otorga los cursos que hoy están
--    habilitados para su institución.
INSERT INTO public.user_courses (user_id, course_id, is_active)
SELECT p.id, ic.course_id, true
FROM public.profiles p
JOIN public.institution_courses ic
  ON ic.institution_id = p.institution_id AND ic.is_active = true
WHERE p.role IN ('student', 'instructor')
ON CONFLICT (user_id, course_id) DO NOTHING;

-- 2) Otorga también cualquier curso en el que el estudiante ya esté
--    inscrito (por si su institución no lo tenía habilitado).
INSERT INTO public.user_courses (user_id, course_id, is_active)
SELECT ce.student_id, ce.course_id, true
FROM public.course_enrollments ce
ON CONFLICT (user_id, course_id) DO NOTHING;
