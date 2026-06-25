-- ============================================================
-- 0017_active_users_institutions.sql
-- Permite al admin activar/desactivar usuarios y colegios.
-- Un usuario queda bloqueado si su perfil está inactivo O si su
-- institución está inactiva (el bloqueo se aplica en el frontend:
-- login.jsx y main.jsx; los admin nunca se bloquean).
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_active IS
  'false = cuenta desactivada por el admin; el usuario no puede iniciar sesión.';
COMMENT ON COLUMN public.institutions.is_active IS
  'false = colegio suspendido; todos sus usuarios quedan bloqueados.';
