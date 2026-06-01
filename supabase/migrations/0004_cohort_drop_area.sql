-- Elimina el campo area de cohorts: la relación es cohort → institution, no por área
ALTER TABLE public.cohorts DROP COLUMN IF EXISTS area;
