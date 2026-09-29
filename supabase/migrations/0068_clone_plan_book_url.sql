-- ============================================================
-- 0068: PDF del libro por GRUPO en el plan de unidades — MODO CLON, TEMPORAL
--
-- Cada docente (grupo) puede tener una unidad priorizada distinta, así que el
-- PDF del libro que ve en el tablero ya no puede vivir solo en el módulo de la
-- ruta (que es uno por curso). `book_url` es la URL pública del PDF (bucket
-- `attachments`) de la unidad de ESE grupo. NULL = el tablero muestra el libro
-- que traiga el `content` del módulo clone_dashboard, como antes.
--
-- Depende de 0052 (clone_unit_plans). Aditiva e idempotente.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

alter table public.clone_unit_plans
  add column if not exists book_url text;

comment on column public.clone_unit_plans.book_url is
  'PDF del libro (unidad priorizada) de este grupo. NULL = se usa el libro del módulo clone_dashboard.';
