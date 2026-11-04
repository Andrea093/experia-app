-- ============================================================
-- 0085_ultima_sala_estudiante.sql
--
-- Recuerda la última sala (curso) que eligió cada estudiante: al volver a
-- ingresar entra a esa, en cualquier dispositivo. Guarda el curso base, no la
-- copia del colegio, igual que course_enrollments.
--
-- Aditiva: sin esta columna la app funciona, solo que no recuerda la sala.
-- El estudiante ya puede actualizar su propia fila de profiles y el trigger de
-- 0051 solo protege las columnas de privilegios. Si el curso se borra, vuelve a
-- NULL y entra a su primera matrícula.
--
-- Idempotente. EJECUTAR en Supabase SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists last_course_id uuid references public.courses(id) on delete set null;
