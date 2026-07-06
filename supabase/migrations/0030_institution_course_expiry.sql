-- ============================================================
-- 0030_institution_course_expiry.sql
-- Fecha de vencimiento por institución para un curso habilitado.
--
-- institution_courses.expires_at (NULL = indefinido). Al vencer:
--  1) se inhabilita la fila de institution_courses (deja de contar como
--     habilitado en el panel de admin y detiene nuevas auto-inscripciones), y
--  2) se REVOCA (is_active=false) el acceso YA otorgado en user_courses a los
--     estudiantes de ese colegio para ese curso — no solo se detienen accesos
--     nuevos. No se borra nada (ni matrícula ni progreso), igual que cualquier
--     otra revocación en este modelo (ver CLAUDE.md).
--
-- Igual que el gate is_active de perfiles/instituciones (0017): a un usuario
-- YA logueado no se le corta la sesión en caliente — queda bloqueado en su
-- PRÓXIMA sesión, que es cuando loadStudentSession vuelve a llamar
-- sync_my_institution_courses.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Aditiva/idempotente.
-- ============================================================

ALTER TABLE public.institution_courses
  ADD COLUMN IF NOT EXISTS expires_at timestamptz; -- NULL = indefinido

CREATE OR REPLACE FUNCTION public.sync_my_institution_courses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_inst  uuid;
  granted  integer := 0;
BEGIN
  SELECT institution_id INTO my_inst FROM public.profiles WHERE id = auth.uid();
  IF my_inst IS NULL THEN
    RETURN 0;
  END IF;

  -- Vencimiento: institution_courses no es dato sensible (todos lo leen, 0007),
  -- así que se des-habilita de forma global (no acotado a my_inst) — refleja el
  -- estado real en el panel de admin apenas cualquier usuario del sistema haga login.
  UPDATE public.institution_courses
     SET is_active = false
   WHERE is_active = true
     AND expires_at IS NOT NULL
     AND expires_at < now();

  -- Revocar (nunca borrar) el acceso YA otorgado a MÍ MISMO para cursos de mi
  -- colegio cuya fecha venció. Acotado a auth.uid(): un estudiante no puede
  -- tocar el acceso de otro. Solo REDUCE acceso, nunca lo concede, así que
  -- ejecutarlo con SECURITY DEFINER es seguro.
  UPDATE public.user_courses uc
     SET is_active = false
   WHERE uc.user_id = auth.uid()
     AND uc.is_active = true
     AND EXISTS (
       SELECT 1 FROM public.institution_courses ic
       WHERE ic.institution_id = my_inst
         AND ic.course_id = uc.course_id
         AND ic.expires_at IS NOT NULL
         AND ic.expires_at < now()
     );

  -- Acceso (gate estricto): conceder los cursos habilitados para MI colegio que
  -- aún no tengo. ON CONFLICT DO NOTHING preserva las revocaciones POR USUARIO
  -- (fila con is_active=false que un admin puso a propósito, o la que acabamos
  -- de poner arriba por vencimiento) — el override individual gana, nunca se
  -- reactiva aquí.
  WITH ins AS (
    INSERT INTO public.user_courses (user_id, course_id, is_active)
    SELECT auth.uid(), ic.course_id, true
    FROM public.institution_courses ic
    WHERE ic.institution_id = my_inst AND ic.is_active = true
    ON CONFLICT (user_id, course_id) DO NOTHING
    RETURNING course_id
  )
  SELECT count(*) INTO granted FROM ins;

  -- Mantener las 3 tablas sincronizadas (ver CLAUDE.md): matrícula + progreso
  -- vacío para los cursos del colegio, sin resetear lo existente.
  INSERT INTO public.course_enrollments (student_id, course_id, institution_id)
  SELECT auth.uid(), ic.course_id, my_inst
  FROM public.institution_courses ic
  WHERE ic.institution_id = my_inst AND ic.is_active = true
  ON CONFLICT (student_id, course_id) DO NOTHING;

  INSERT INTO public.course_progress (user_id, course_id, xp, completed, badges)
  SELECT auth.uid(), ic.course_id, 0, '{}'::text[], '{}'::text[]
  FROM public.institution_courses ic
  WHERE ic.institution_id = my_inst AND ic.is_active = true
  ON CONFLICT (user_id, course_id) DO NOTHING;

  RETURN granted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_my_institution_courses() TO authenticated;
