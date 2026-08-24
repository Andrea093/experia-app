-- ============================================================
-- 0055: Habilitar pgvector
--
-- Requisito de 0056 (corpus normativo con búsqueda semántica). Se instala en el
-- schema `extensions` — la convención de Supabase — y NO en `public`, para que
-- las tablas del proyecto no compartan namespace con los tipos y operadores de
-- la extensión. Consecuencia: los tipos se escriben calificados
-- (`extensions.vector(1536)`) y las funciones que usan `<=>` llevan
-- `set search_path = ..., extensions`.
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

create extension if not exists vector with schema extensions;
