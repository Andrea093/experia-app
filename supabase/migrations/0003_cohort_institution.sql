-- Vincula cohortes a una institución específica
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cohorts_institution_id ON public.cohorts (institution_id);
