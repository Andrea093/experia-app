-- ============================================================
-- 0041: Reutilizar entre colegios la ruta ya editada de un curso
--
-- Objetivo (pedido del usuario): un tutor quiere TOMAR la versión que otra
-- profesora dejó lista en OTRO colegio y usarla como punto de partida en el
-- suyo — sin tener que estar asignado a ese otro colegio y sin rehacer la
-- ruta desde cero.
--
-- Bloqueo que corrige: la policy de SELECT de `courses` (0024, "read
-- courses") solo dejaba ver un fork si eras su dueño (owner_id), admin, o
-- del colegio del fork (profiles.institution_id / instructor_institutions).
-- Por eso el fork de otra profesora en otro colegio era INVISIBLE para el
-- tutor que quería reutilizarlo — no aparecía en el selector "Empezar
-- desde" / "Importar de otro colegio" del editor de ruta.
--
-- Fix: cualquier INSTRUCTOR (o admin) puede LEER todos los forks ACTIVOS
-- (courses con parent_course_id IS NOT NULL). El contenido de una ruta es
-- material pedagógico pensado para compartirse — no hay PII de estudiantes
-- en `courses`. La ESCRITURA sigue igual de restringida que en 0024/0025
-- (un tutor solo puede editar/crear el fork de un colegio al que está
-- asignado), así que ver el fork ajeno NO permite modificarlo: solo clonarlo
-- hacia un fork nuevo de su propio colegio.
--
-- Los cursos BASE (parent_course_id IS NULL) conservan su regla de siempre.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente (CREATE OR REPLACE POLICY vía DROP + CREATE).
-- ============================================================

DROP POLICY IF EXISTS "read courses" ON public.courses;
CREATE POLICY "read courses"
  ON public.courses FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Cursos base: visibles para cualquiera (regla original 0024)
      owner_id IS NULL
      OR owner_id = auth.uid()
      OR public.is_admin()
      OR institution_id IN (
        SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
      )
      -- NUEVO: cualquier instructor puede leer los forks activos de CUALQUIER
      -- colegio, para poder reutilizarlos como plantilla (solo lectura).
      OR (public.is_instructor() AND parent_course_id IS NOT NULL AND is_active)
    )
  );
