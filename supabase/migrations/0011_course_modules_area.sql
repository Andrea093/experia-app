-- ============================================================
-- 0011: Alcance por área (transversal) en course_modules
--   area_id IS NULL  → módulo TRANSVERSAL: se muestra en todas las áreas
--   area_id = '<id>' → módulo específico de esa área de formación
-- También habilita el tipo 'final_delivery' (entrega final), que el
-- código ya inserta pero el CHECK original de 0007 rechazaba.
-- ============================================================

-- 1) Columna de área (transversal por defecto = NULL)
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS area_id text;

COMMENT ON COLUMN public.course_modules.area_id IS
  'Área de formación (lectura, ciudadanas, ingles, matematicas, ciencias). NULL = transversal: visible para todas las áreas.';

CREATE INDEX IF NOT EXISTS course_modules_area_idx
  ON public.course_modules (course_id, area_id);

-- 2) Permitir el tipo final_delivery además de los existentes.
--    El CHECK inline de 0007 se nombra automáticamente course_modules_type_check.
ALTER TABLE public.course_modules
  DROP CONSTRAINT IF EXISTS course_modules_type_check;

ALTER TABLE public.course_modules
  ADD CONSTRAINT course_modules_type_check
  CHECK (type IN ('lesson', 'challenge', 'evaluation', 'final_delivery'));

-- 3) Backfill del curso DCE sembrado en 0008.
--    El 4º grupo del UUID codifica el área (0000 = transversal, ya queda NULL):
--      0001 = lectura · 0002 = ciudadanas · 0003 = ingles · 0004 = matematicas · 0005 = ciencias
--    Solo toca filas aún sin área asignada (idempotente).
UPDATE public.course_modules SET area_id = 'lectura'     WHERE area_id IS NULL AND id::text LIKE '10000000-0000-0000-0001-%';
UPDATE public.course_modules SET area_id = 'ciudadanas'  WHERE area_id IS NULL AND id::text LIKE '10000000-0000-0000-0002-%';
UPDATE public.course_modules SET area_id = 'ingles'      WHERE area_id IS NULL AND id::text LIKE '10000000-0000-0000-0003-%';
UPDATE public.course_modules SET area_id = 'matematicas' WHERE area_id IS NULL AND id::text LIKE '10000000-0000-0000-0004-%';
UPDATE public.course_modules SET area_id = 'ciencias'    WHERE area_id IS NULL AND id::text LIKE '10000000-0000-0000-0005-%';
