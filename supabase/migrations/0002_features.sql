-- ============================================================
-- MIGRACIÓN 0002 — Real-time presencia + Cohortes
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ── Presencia en tiempo real ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz,
  ADD COLUMN IF NOT EXISTS current_module text;

-- ── Cohortes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cohorts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  area        text,                          -- null = aplica a todas las áreas
  deadline    timestamptz,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES public.cohorts(id);

-- ── RLS para cohorts ─────────────────────────────────────────
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read cohorts"
  ON cohorts FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin manage cohorts"
  ON cohorts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen  ON public.profiles (last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort_id  ON public.profiles (cohort_id);

-- ── Habilitar Realtime en profiles (para presencia) ──────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
