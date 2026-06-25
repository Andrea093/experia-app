-- ============================================================
-- 0019: El admin puede gestionar course_progress de cualquier usuario
--
-- Necesario para la INSCRIPCIÓN AUTOMÁTICA por colegio: al asignar un
-- curso a una institución, el admin crea filas de course_progress para
-- todos sus estudiantes. Las políticas previas (0007) solo permitían al
-- dueño escribir su propio progreso.
-- (course_enrollments ya permite INSERT del admin vía la política
--  "student enroll" WITH CHECK is_admin de 0007.)
-- ============================================================

CREATE POLICY "admin manage course_progress"
  ON public.course_progress FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
