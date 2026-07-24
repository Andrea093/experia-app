-- ============================================================
-- 0043: Intensidad horaria del certificado, configurable por curso
--
-- • courses.certificate_hours: horas que el tutor define para el certificado
--   del curso (junto a certificate_title/achievement_text/etc. de 0037).
-- • certificates.hours: se "congela" al emitir el certificado (igual que
--   course_title/achievement_text) para que la página pública de verificación
--   lo muestre aunque el curso cambie después.
--
-- El borrador del editor (courses.draft_certificate, jsonb) NO necesita cambio
-- de esquema: el campo `hours` viaja dentro del JSON.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente.
-- ============================================================

alter table public.courses
  add column if not exists certificate_hours int;

alter table public.certificates
  add column if not exists hours int;

comment on column public.courses.certificate_hours is
  'Intensidad horaria mostrada en el certificado del curso. NULL = no se muestra.';
comment on column public.certificates.hours is
  'Horas congeladas al emitir el certificado (snapshot de courses.certificate_hours).';
