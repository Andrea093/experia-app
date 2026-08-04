-- ============================================================
-- 0054: Unidad trabajada en la tabla de efectividad — MODO CLON, TEMPORAL
--
-- El docente indica sobre QUÉ unidad del libro aplicó la sesión. Las unidades
-- salen del plan que su tutor cargó (clone_unit_plans.units, 0052), así que la
-- tabla de efectividad y el plan de unidades quedan hablando del mismo objeto.
--
-- ⚠️ Se guarda el TEXTO de la unidad, no un id ni un índice. Las unidades viven
-- dentro de un jsonb que el tutor reemplaza entero cada vez que recarga el plan:
-- un índice apuntaría a otra unidad después de un reordenamiento, y una tabla ya
-- cerrada quedaría diciendo algo distinto de lo que el docente registró. El
-- texto es una foto, igual que `entries` en las actas.
--
-- Depende de 0051. Aditiva e idempotente.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

alter table public.clone_effectiveness
  add column if not exists unit_label text;

-- Los DATOS de esa unidad (ejes articuladores, notas del tutor, cobertura /
-- prioridad / nivel), copiados también al registrar. El informe impreso los
-- muestra, y por eso tienen que quedar congelados con la tabla: si se leyeran
-- del plan al momento de imprimir, reimprimir un informe cerrado meses después
-- podría mostrar unos ejes distintos de los que se trabajaron ese día.
alter table public.clone_effectiveness
  add column if not exists unit jsonb not null default '{}'::jsonb;

comment on column public.clone_effectiveness.unit_label is
  'Unidad del libro sobre la que se aplicó la sesión. Texto copiado del plan de unidades del grupo (clone_unit_plans.units) al momento de registrar: es un snapshot, no una referencia.';
comment on column public.clone_effectiveness.unit is
  'Snapshot de esa unidad al registrar: {title, ejes, notes, coverage, priority, level}. Es lo que imprime el informe — nunca se releé del plan, que el tutor puede haber cambiado después.';
