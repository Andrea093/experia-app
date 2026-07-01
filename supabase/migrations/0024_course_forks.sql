-- ============================================================
-- 0024_course_forks.sql
-- "Copia de curso por tutor + colegio" (fork-on-edit)
--
-- Modelo: la plataforma tiene cursos DEFAULT (owner_id IS NULL) que quedan
-- intactos. Cuando un tutor entra a modificar un curso, se genera una COPIA
-- ligada a (tutor + su colegio):
--   • owner_id         = el tutor dueño de la copia
--   • parent_course_id = el curso default del que se copió
--   • institution_id   = el colegio al que aplica la copia
-- Los estudiantes de ESE colegio, inscritos en el curso default, ven los
-- módulos de la copia (resolución en el frontend por parent+institution).
-- Los de otros colegios siguen viendo el default.
--
-- Solo el dueño (y admins) pueden VER/EDITAR la copia; los estudiantes del
-- colegio pueden LEERLA. El default no cambia sus reglas.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente.
-- ============================================================

-- ── 1. Columnas de "fork" en courses ────────────────────────────────────────
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS owner_id         uuid REFERENCES public.profiles(id)     ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_course_id uuid REFERENCES public.courses(id)      ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS institution_id   uuid REFERENCES public.institutions(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.courses.owner_id IS
  'Tutor dueño de esta copia. NULL = curso default de la plataforma.';
COMMENT ON COLUMN public.courses.parent_course_id IS
  'Curso default del que se copió. NULL = curso original.';
COMMENT ON COLUMN public.courses.institution_id IS
  'Colegio al que aplica la copia. NULL en cursos default.';

-- Búsqueda de la copia efectiva por (curso default, colegio)
CREATE INDEX IF NOT EXISTS courses_fork_idx
  ON public.courses (parent_course_id, institution_id)
  WHERE parent_course_id IS NOT NULL;

-- ── 2. RLS de courses ───────────────────────────────────────────────────────
-- Lectura: los default los ve cualquiera; una copia solo su dueño, los admins
-- y los usuarios del colegio de la copia.
DROP POLICY IF EXISTS "read courses" ON public.courses;
CREATE POLICY "read courses"
  ON public.courses FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      owner_id IS NULL
      OR owner_id = auth.uid()
      OR public.is_admin()
      OR institution_id IN (
        SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- Escritura: los admins gestionan todo (incluye los cursos default/seeds).
-- Los instructores SOLO pueden crear/editar/borrar sus PROPIAS copias
-- (owner_id = ellos mismos). Así un tutor nunca toca un curso default.
DROP POLICY IF EXISTS "admin instructor write courses" ON public.courses;

CREATE POLICY "admin write courses"
  ON public.courses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner manage own courses"
  ON public.courses FOR ALL
  USING (public.is_instructor() AND owner_id = auth.uid())
  WITH CHECK (public.is_instructor() AND owner_id = auth.uid());

-- ── 3. RLS de course_modules ────────────────────────────────────────────────
-- Lectura: se mantiene abierta a cualquier usuario autenticado (los estudiantes
-- necesitan leer los módulos de la copia de su colegio). Solo reescribimos la
-- política de ESCRITURA para que los tutores toquen únicamente los módulos de
-- cursos que ellos poseen (sus copias); los admins gestionan todo.
DROP POLICY IF EXISTS "admin instructor write course_modules" ON public.course_modules;

CREATE POLICY "admin write course_modules"
  ON public.course_modules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "owner manage own course_modules"
  ON public.course_modules FOR ALL
  USING (
    public.is_instructor()
    AND course_id IN (SELECT c.id FROM public.courses c WHERE c.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_instructor()
    AND course_id IN (SELECT c.id FROM public.courses c WHERE c.owner_id = auth.uid())
  );

-- ── 4. Verificación (opcional) ──────────────────────────────────────────────
-- SELECT id, name, owner_id, parent_course_id, institution_id FROM public.courses ORDER BY created_at;
