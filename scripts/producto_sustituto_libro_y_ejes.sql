-- ============================================================
-- GenIA Construye "— mi versión" — dos ajustes a la ruta:
--   [A] El PDF "SABERES 11 PLATA QUÍMICA UNIDAD 3" sale de la lección
--       "Gestión integral de las clases" y pasa a la ventana del
--       "Plan de unidades del libro" (clone_dashboard), junto a los ejes y el
--       orden de las unidades. Solo se mueve ESA sección; la lección conserva
--       todo lo demás (guías de priorización, asistencia, efectividad…).
--   [B] Carga la gráfica "Desempeño por área CEINFES — Química" en el plan de
--       cada grupo del curso.
--
-- ⚠️ NO ES UNA MIGRACIÓN: apunta a datos concretos de producción. Correr a mano
--    en el SQL Editor. Todo va en una transacción: si algo no cuadra, no cambia nada.
-- ⚠️ DESPUÉS: recarga el editor de Ruta (F5) ANTES de tocar "Publicar". El
--    editor publica la lista que tenía cargada y desharía estos cambios.
-- ============================================================

begin;

-- ── [A] MOVER EL LIBRO AL TABLERO ──────────────────────────────────────────
-- La sección se ubica por su TÍTULO, no por su posición: si alguien reordena la
-- lección antes de correr esto, igual se mueve la correcta.
-- Idempotente: si la sección ya no está en la lección, no hace nada.
DO $$
DECLARE
  v_titulo text := 'SABERES 11 PLATA QUÍMICA UNIDAD 3';
  v_course uuid;
  v_leccion uuid;
  v_dash uuid;
  v_sec jsonb;
BEGIN
  SELECT id INTO v_course FROM public.courses
   WHERE name ILIKE '%genia construye%mi versi%';
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'No se encontró el curso "GenIA Construye — mi versión"';
  END IF;

  SELECT id INTO v_dash FROM public.course_modules
   WHERE course_id = v_course AND type = 'clone_dashboard' LIMIT 1;
  IF v_dash IS NULL THEN
    RAISE EXCEPTION 'El curso no tiene el módulo "Plan de unidades del libro". '
      'Agrégalo desde el editor de ruta, publica y vuelve a correr este script.';
  END IF;

  SELECT m.id, s.sec INTO v_leccion, v_sec
    FROM public.course_modules m
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(m.content, '[]'::jsonb)) AS s(sec)
   WHERE m.course_id = v_course AND m.id <> v_dash
     AND s.sec->>'title' = v_titulo
   LIMIT 1;
  IF v_leccion IS NULL THEN
    RAISE NOTICE 'La sección "%" ya no está en ninguna lección: nada que mover.', v_titulo;
    RETURN;
  END IF;

  -- Quitarla de la lección (conserva el orden del resto).
  UPDATE public.course_modules m
     SET content = (SELECT coalesce(jsonb_agg(e ORDER BY i), '[]'::jsonb)
                      FROM jsonb_array_elements(m.content) WITH ORDINALITY AS t(e, i)
                     WHERE e->>'title' IS DISTINCT FROM v_titulo)
   WHERE m.id = v_leccion;

  -- Agregarla al final del tablero (sin duplicar si ya estaba).
  UPDATE public.course_modules
     SET content = coalesce(content, '[]'::jsonb) || jsonb_build_array(v_sec)
   WHERE id = v_dash
     AND NOT coalesce(content, '[]'::jsonb) @> jsonb_build_array(jsonb_build_object('title', v_titulo));

  RAISE NOTICE 'Libro movido al Plan de unidades del libro.';
END $$;


-- ── [B] GRÁFICA DE EJES EN EL PLAN DE CADA GRUPO ───────────────────────────
-- value = % de respuestas CORRECTAS. color = slot 1..8 de la paleta (--viz-N).
-- Los grupos pueden tener asignado el fork o su curso padre: se cubren ambos.
-- Si el grupo ya tenía plan, solo se reemplaza la gráfica (unidades, libro e
-- indicaciones quedan intactos). Si no tenía, se crea un plan solo con ella.
with cursos as (
  select id from public.courses where name ilike '%genia construye%mi versi%'
  union
  select parent_course_id from public.courses
   where name ilike '%genia construye%mi versi%' and parent_course_id is not null
), grafica as (
  select jsonb_build_object(
    'title', 'Desempeño por área CEINFES — Química',
    'bars', jsonb_build_array(
      jsonb_build_object('label', 'Conexión entre las reglas de la física, la química y el universo.', 'value', 25, 'color', 1),
      jsonb_build_object('label', 'Propiedades y clasificación de la materia.', 'value', 45, 'color', 2),
      jsonb_build_object('label', 'Diseño de experimentos para obtener resultados y conclusiones.', 'value', 50, 'color', 3),
      jsonb_build_object('label', 'Explicaciones y respuestas a preguntas con modelos científicos.', 'value', 50, 'color', 4),
      jsonb_build_object('label', 'Ideas y evidencias en la comunicación científica.', 'value', 20, 'color', 5),
      jsonb_build_object('label', 'Relación entre los cambios de la materia y tu día a día.', 'value', 35, 'color', 6)
    )) as chart
)
insert into public.clone_unit_plans (group_id, chart)
select g.id, (select chart from grafica)
  from public.clone_groups g
 where g.course_id in (select id from cursos) and g.is_active
on conflict (group_id) do update set chart = excluded.chart;

-- Verificación: debe listar al menos un grupo con 6 barras.
select g.name as grupo, g.course_id, jsonb_array_length(p.chart->'bars') as barras
  from public.clone_unit_plans p join public.clone_groups g on g.id = p.group_id
 where p.chart->>'title' = 'Desempeño por área CEINFES — Química';

commit;
