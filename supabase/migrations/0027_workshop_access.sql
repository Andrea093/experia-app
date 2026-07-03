-- ============================================================
-- 0027_workshop_access.sql
-- "Habilitación de taller / producto final por estudiante"
--
-- El tutor habilita, por estudiante y por curso, el tramo posterior
-- al TALLER PRESENCIAL (módulos post-taller + entrega final). Solo los
-- estudiantes que asistieron al taller (a quienes el tutor marca) pueden
-- avanzar más allá del checkpoint.
--
-- El punto de corte exacto en la ruta se define aparte; esta tabla es el
-- mecanismo de habilitación por estudiante, independiente de dónde caiga.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Aditiva/idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workshop_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  enabled     boolean NOT NULL DEFAULT true,
  granted_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS workshop_access_student_idx ON public.workshop_access (student_id);
CREATE INDEX IF NOT EXISTS workshop_access_course_idx  ON public.workshop_access (course_id);

-- Opt-in POR CURSO: solo los cursos con requires_workshop=true aplican el gate
-- del taller (entrega final / tramo post-taller bloqueado hasta que el tutor
-- habilita al estudiante). Los demás cursos siguen desbloqueando por avance.
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS requires_workshop boolean NOT NULL DEFAULT false;

-- ============ RLS ============
ALTER TABLE public.workshop_access ENABLE ROW LEVEL SECURITY;

-- Lectura: el estudiante ve lo suyo; instructores y admins ven todo.
DROP POLICY IF EXISTS "read own or staff workshop_access" ON public.workshop_access;
CREATE POLICY "read own or staff workshop_access"
  ON public.workshop_access FOR SELECT
  USING (student_id = auth.uid() OR public.is_instructor() OR public.is_admin());

-- Escritura: admins todo; instructores solo para estudiantes de SUS colegios
-- (instructor_institutions, o profiles.institution_id como fallback legado).
DROP POLICY IF EXISTS "staff manage workshop_access" ON public.workshop_access;
CREATE POLICY "staff manage workshop_access"
  ON public.workshop_access FOR ALL
  USING (
    public.is_admin() OR (
      public.is_instructor() AND student_id IN (
        SELECT p.id FROM public.profiles p
        WHERE p.institution_id IN (
          SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
          UNION
          SELECT pr.institution_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    public.is_admin() OR (
      public.is_instructor() AND student_id IN (
        SELECT p.id FROM public.profiles p
        WHERE p.institution_id IN (
          SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
          UNION
          SELECT pr.institution_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
      )
    )
  );
