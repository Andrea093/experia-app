-- ============================================================
-- 0036: Repara requirements rotos en copias de curso por colegio (forks)
--
-- Causa raíz (corregida en forkCourseForInstitution, store.jsx): al clonar
-- los módulos de un curso para la copia de un colegio, se copiaba el
-- arreglo `requirements` TAL CUAL — apuntando a los IDs del curso PADRE —
-- pero cada módulo clonado recibía un ID nuevo en el fork. Resultado: el
-- prerrequisito de un módulo (excepto el primero) señalaba a un módulo del
-- curso padre que el estudiante nunca ve en su ruta (ve el fork), así que
-- `completed[]` jamás podía contener ese id — el módulo quedaba bloqueado
-- para siempre sin importar cuánto avanzara el estudiante.
--
-- Este script detecta CUALQUIER course_modules cuyo requirements tenga un
-- id que no pertenece a su MISMO course_id, y lo corrige apuntando al
-- módulo inmediatamente anterior (por "order") dentro de ese mismo curso —
-- exactamente el prerrequisito secuencial que se esperaba.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente: una vez corregido, ya no vuelve a coincidir la condición.
-- ============================================================

DO $$
DECLARE
  r      record;
  v_prev uuid;
BEGIN
  FOR r IN
    SELECT cm.id, cm.course_id, cm."order"
    FROM public.course_modules cm
    WHERE cm.requirements IS NOT NULL AND cm.requirements <> '{}'
      AND EXISTS (
        SELECT 1 FROM unnest(cm.requirements) req_id
        WHERE NOT EXISTS (
          SELECT 1 FROM public.course_modules cm2
          WHERE cm2.id::text = req_id AND cm2.course_id = cm.course_id
        )
      )
    ORDER BY cm.course_id, cm."order"
  LOOP
    SELECT id INTO v_prev
    FROM public.course_modules
    WHERE course_id = r.course_id AND "order" < r."order"
    ORDER BY "order" DESC LIMIT 1;

    UPDATE public.course_modules
       SET requirements = CASE WHEN v_prev IS NULL THEN '{}'::text[] ELSE ARRAY[v_prev::text] END,
           updated_at = now()
     WHERE id = r.id;

    RAISE NOTICE 'Corregido módulo % (curso %, orden %): requisito ahora %', r.id, r.course_id, r."order", v_prev;
  END LOOP;
END $$;

-- Verificación: no debería quedar ninguna fila con requirements "cruzados" entre cursos.
SELECT c.name AS curso, cm."order", cm.title, cm.requirements
FROM public.course_modules cm
JOIN public.courses c ON c.id = cm.course_id
WHERE cm.requirements IS NOT NULL AND cm.requirements <> '{}'
  AND EXISTS (
    SELECT 1 FROM unnest(cm.requirements) req_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.course_modules cm2
      WHERE cm2.id::text = req_id AND cm2.course_id = cm.course_id
    )
  );
