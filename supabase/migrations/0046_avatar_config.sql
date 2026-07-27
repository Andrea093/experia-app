-- ============================================================
-- 0046: Avatar del estudiante (personaje propio de los cursos temáticos)
--
-- • profiles.avatar_config: configuración del avatar SVG paramétrico que el
--   estudiante arma en Perfil → "Mi avatar" (piel, cabello, ojos, atuendo,
--   accesorio, marco y alias). Vive en profiles y NO en la matrícula, para que
--   el mismo avatar acompañe a la persona en TODOS sus cursos.
--
-- Nada más: la política "update own profile" (0001) ya permite al usuario
-- escribir su propia fila, y el trigger guard_profile_privileged_columns (0029)
-- es una lista NEGRA (role/is_active/institution_id/cohort_id), así que esta
-- columna queda permitida sin tocar seguridad.
--
-- No afecta a ningún curso existente: sin avatar la columna queda NULL y el
-- frontend degrada al comportamiento actual (sin pestaña, sin conversación).
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Aditiva e idempotente.
-- ============================================================

alter table public.profiles
  add column if not exists avatar_config jsonb;

comment on column public.profiles.avatar_config is
  'Avatar SVG paramétrico del estudiante ({v, skin, hair, hairColor, eyes, outfit, outfitColor, accessory, frame, alias}). NULL = aún no lo ha creado. Global por persona: se mantiene igual en todos sus cursos.';
