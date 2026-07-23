-- ============================================================
-- 0041: Permitir clonar entre colegios la versión ya editada de un curso
--
-- Problema: un tutor asignado a VARIOS colegios (vía instructor_institutions)
-- que ya personalizó un curso para el Colegio A no podía reusar esa versión
-- al crear la copia para el Colegio B — tenía que empezar de cero cada vez.
-- El editor de ruta (InstructorRouteEditor.jsx) ahora ofrece un selector
-- "Empezar desde" con las versiones ya existentes de OTROS colegios, pero
-- para listarlas necesita poder LEER esos forks por `courses` — y la policy
-- de SELECT de 0024 ("read courses") solo dejaba ver un fork si:
--   • es el dueño (owner_id = auth.uid()), o
--   • es admin, o
--   • profiles.institution_id (colegio ÚNICO del perfil) coincide.
-- Esto no cubre instructor_institutions (asignación a VARIOS colegios), que
-- sí se usa desde 0025 para las policies de ESCRITURA de forks. Un tutor
-- multi-colegio podía EDITAR el fork de un colegio donde está asignado por
-- instructor_institutions, pero no verlo en el selector para clonarlo.
--
-- Fix: agrega la misma condición de instructor_institutions a la policy de
-- SELECT, dejando el resto igual (los estudiantes/admins no ganan acceso
-- nuevo — solo instructores ya asignados a ese colegio como profesores).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente.
-- ============================================================

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
      OR institution_id IN (
        SELECT ii.institution_id FROM public.instructor_institutions ii WHERE ii.instructor_id = auth.uid()
      )
    )
  );
