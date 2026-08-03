-- ============================================================
-- 0053: Gráfica de ejes transversales del plan de unidades — MODO CLON, TEMPORAL
--
-- Reemplaza la gráfica de "puntaje de prioridad" (que se derivaba de los
-- puntajes por unidad) por una gráfica PARAMETRIZABLE: el tutor escribe cada
-- eje transversal, su valor (0–100, que es el largo de la barra) y su color,
-- escogido entre los ocho de la paleta de gráficas.
--
-- ⚠️ Los campos por unidad (coverage/priority/level de 0052) SIGUEN existiendo y
-- se muestran como texto bajo cada unidad — ya no alimentan ninguna gráfica.
-- No hace falta migrar datos: viven dentro de `units` (jsonb).
--
-- Depende de 0052 (clone_unit_plans). Aditiva e idempotente.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

alter table public.clone_unit_plans
  add column if not exists chart jsonb not null default '{}'::jsonb;

comment on column public.clone_unit_plans.chart is
  'Gráfica de ejes transversales: {title, bars:[{label, value, color}]}. value = 0..100 (porcentaje literal: barra llena = 100). color = slot 1..8 de la paleta de gráficas (--viz-N en styles.css), NO un hex — así el modo oscuro y cualquier recalibración de la paleta se aplican solos.';
