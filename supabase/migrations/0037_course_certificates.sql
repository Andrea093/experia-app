-- ============================================================
-- 0037_course_certificates.sql
-- Certificado personalizable por curso (no solo el de DCE en Grid.jsx).
--
-- El tutor lo habilita y edita desde el Editor de Ruta (personalización del
-- curso, misma fila `courses` que ya usan draft_modules/draft_name — ver
-- 0031). Sigue el mismo patrón borrador/publicar: `draft_certificate` es lo
-- que el tutor está editando sin publicar; las columnas certificate_* son lo
-- que YA ven los estudiantes.
--
-- Se emite automáticamente (sin calificación de instructor) cuando el
-- estudiante completa el 100% de los módulos habilitados de su ruta —
-- a diferencia del certificado DCE (Grid.jsx), que depende de la
-- aprobación de una Entrega Final calificada. Esto es necesario porque no
-- todos los cursos personalizados tienen Entrega Final (ej. MOOCs por
-- video como Ecosistema IA).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase. Aditiva/idempotente.
-- ============================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_enabled          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_title             text,   -- ej. "Ecosistema IA"; NULL = usa el nombre del curso
  ADD COLUMN IF NOT EXISTS certificate_achievement_text  text,   -- ej. "ha completado satisfactoriamente el curso de..."
  ADD COLUMN IF NOT EXISTS certificate_signatory_name    text,   -- ej. "Prof. Juan Pérez"
  ADD COLUMN IF NOT EXISTS certificate_signatory_role    text,   -- ej. "Instructor · IED San Francisco"
  ADD COLUMN IF NOT EXISTS draft_certificate             jsonb;  -- snapshot del editor sin publicar; NULL = sin borrador pendiente

-- La tabla `certificates` (0010) hoy solo modela el certificado DCE (ligado a
-- una submission calificada). Se agrega soporte para certificados de curso,
-- con el contenido "congelado" al momento de emisión (si el tutor edita el
-- certificado después, los ya emitidos no cambian retroactivamente).
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS course_id         uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS course_title      text,
  ADD COLUMN IF NOT EXISTS achievement_text  text,
  ADD COLUMN IF NOT EXISTS signatory_name    text,
  ADD COLUMN IF NOT EXISTS signatory_role    text;

-- Idempotencia: un solo certificado de curso por estudiante+curso (submission_id
-- ya cumple ese rol para el flujo DCE vía su propio UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_uniq
  ON public.certificates (user_id, course_id) WHERE course_id IS NOT NULL;
