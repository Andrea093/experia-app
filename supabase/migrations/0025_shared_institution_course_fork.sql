-- ============================================================
-- 0025_shared_institution_course_fork.sql
-- Convierte el "fork por tutor" (0024) en UN SOLO fork COMPARTIDO
-- por (curso default, colegio).
--
-- Problema que corrige: con 0024, cada tutor que personalizaba un
-- curso creaba SU PROPIA copia (owner_id = ese tutor). Si un colegio
-- tenía 2+ tutores asignados y ambos personalizaban el mismo curso,
-- quedaban 2 copias activas con el mismo (parent_course_id,
-- institution_id). La resolución del lado del estudiante
-- (loadStudentSession.js) espera como máximo 1 fila — con 2, la
-- consulta falla en silencio y el estudiante termina viendo el curso
-- default, ignorando el trabajo de AMBOS tutores.
--
-- Nuevo modelo: la copia sigue existiendo por (curso default, colegio),
-- pero CUALQUIER tutor asignado a ese colegio (vía instructor_institutions,
-- o vía profiles.institution_id como fallback legado) puede verla y
-- editarla — no solo quien la creó. `owner_id` se conserva como dato
-- informativo (quién la creó primero), ya no como filtro de permisos.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente. Requiere que 0024 ya se haya ejecutado.
-- ============================================================

-- ── 1. courses: escritura por colegio asignado (no solo por dueño) ──────────
DROP POLICY IF EXISTS "owner manage own courses" ON public.courses;

CREATE POLICY "institution instructors manage course fork"
  ON public.courses FOR ALL
  USING (
    public.is_instructor()
    AND parent_course_id IS NOT NULL
    AND (
      institution_id IN (
        SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
      )
      OR institution_id IN (
        SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.is_instructor()
    AND parent_course_id IS NOT NULL
    AND (
      institution_id IN (
        SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
      )
      OR institution_id IN (
        SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- ── 2. course_modules: escritura por colegio asignado (vía el fork) ─────────
DROP POLICY IF EXISTS "owner manage own course_modules" ON public.course_modules;

CREATE POLICY "institution instructors manage fork course_modules"
  ON public.course_modules FOR ALL
  USING (
    public.is_instructor()
    AND course_id IN (
      SELECT c.id FROM public.courses c
      WHERE c.parent_course_id IS NOT NULL
        AND (
          c.institution_id IN (
            SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
          )
          OR c.institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (
    public.is_instructor()
    AND course_id IN (
      SELECT c.id FROM public.courses c
      WHERE c.parent_course_id IS NOT NULL
        AND (
          c.institution_id IN (
            SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
          )
          OR c.institution_id IN (
            SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
          )
        )
    )
  );

-- ── 3. Limpieza de duplicados existentes (si dos tutores ya forkearon el
--    mismo curso para el mismo colegio) — se queda con la copia más antigua
--    y se desactiva el resto para que la resolución del estudiante deje de
--    fallar. Revisa el resultado antes de asumir cuál copia "gana".
-- ============================================================
-- SELECT id, name, owner_id, parent_course_id, institution_id, created_at
--   FROM public.courses
--   WHERE parent_course_id IS NOT NULL
--   ORDER BY parent_course_id, institution_id, created_at;
--
-- UPDATE public.courses SET is_active = false
--   WHERE id IN (
--     SELECT id FROM (
--       SELECT id, ROW_NUMBER() OVER (
--         PARTITION BY parent_course_id, institution_id ORDER BY created_at ASC
--       ) AS rn
--       FROM public.courses WHERE parent_course_id IS NOT NULL
--     ) ranked WHERE rn > 1
--   );
