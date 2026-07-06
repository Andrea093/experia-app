-- ============================================================
-- 0028_sync_institution_courses_access.sql
-- "Auto-conceder al estudiante los cursos habilitados para SU colegio"
--
-- Cierra el hueco del modelo estricto (user_courses): la auto-inscripción
-- por colegio (autoEnrollInstitutionStudents) solo corre sobre los estudiantes
-- que EXISTÍAN al momento de habilitar el curso. Un estudiante que se registra
-- DESPUÉS —o al que le falló el autoEnroll— no tenía fila en user_courses y por
-- eso no veía el curso aunque su colegio lo tuviera habilitado.
--
-- Esta función se llama al iniciar sesión del estudiante (loadStudentSession).
-- Como user_courses solo lo escriben admins (RLS 0018), se usa SECURITY DEFINER,
-- pero acotada de forma segura: SOLO concede los cursos activos del PROPIO colegio
-- del que llama (auth.uid()). Un estudiante no puede concederse nada que su colegio
-- no tenga habilitado.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Aditiva/idempotente.
-- ============================================================

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

  -- Acceso (gate estricto): conceder los cursos habilitados para MI colegio que
  -- aún no tengo. ON CONFLICT DO NOTHING preserva las revocaciones POR USUARIO
  -- (fila con is_active=false que un admin puso a propósito) — el override
  -- individual gana, nunca se reactiva aquí.
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

-- Cualquier usuario autenticado puede sincronizar LO SUYO (la función se acota a
-- auth.uid() internamente, así que no hay forma de tocar el acceso de otro).
GRANT EXECUTE ON FUNCTION public.sync_my_institution_courses() TO authenticated;
