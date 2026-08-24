-- ============================================================
-- 0058: Bucket privado `corpus-normativo` (Storage)
--
-- Donde viven los PDF oficiales de los que sale el corpus de 0056. La tabla
-- `corpus.normativo` guarda el TEXTO troceado; aquí queda el DOCUMENTO FUENTE,
-- para poder abrir la norma completa desde una cita y para poder re-extraer el
-- corpus sin volver a rastrear los originales en internet.
--
-- El puente entre ambos es `corpus.normativo.storage_path`, que apunta a la
-- ruta del objeto dentro de este bucket.
--
-- Los buckets previos del proyecto (`avatars`, `attachments`) se crearon a mano
-- en el dashboard y no tienen migración. Este sí la lleva: sus policies son
-- parte del modelo de seguridad del agente (quién puede subir normativa es
-- exactamente tan sensible como quién puede escribir `corpus.normativo`), y
-- deben quedar versionadas y revisables, no enterradas en la UI.
--
-- ⚠️ Depende de 0056. Aditiva e idempotente.
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ── [1] El bucket ──────────────────────────────────────────────────────────
-- PRIVADO (`public = false`): el acceso pasa siempre por RLS + URL firmada.
-- Los documentos son normativa pública, pero un bucket público es una URL
-- adivinable y sin control — no hay razón para renunciar al control.
--
-- Límite de 50 MB: el Decreto 1075 completo ronda las 1.000 páginas.
-- Solo PDF: el pipeline de extracción (Fase 2, PyMuPDF) no lee otra cosa, y
-- restringir el mime type cierra la puerta a subir cualquier archivo aquí.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('corpus-normativo', 'corpus-normativo', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── [2] Policies ───────────────────────────────────────────────────────────
-- Mismo criterio que `corpus.normativo` en 0056, y por la misma razón: la
-- normativa se LEE desde la plataforma y se ESCRIBE por proceso de servidor.
-- Si el docente pudiera subir un PDF aquí, podría meter al corpus un texto que
-- el agente citaría como si fuera ley.

-- Lectura: cualquier usuario autenticado, solo dentro de este bucket.
drop policy if exists "corpus normativo lectura autenticados" on storage.objects;
create policy "corpus normativo lectura autenticados"
  on storage.objects for select to authenticated
  using (bucket_id = 'corpus-normativo');

-- Sin policy de insert/update/delete → solo `service_role`, que bypassea RLS.
-- La carga se hace desde el dashboard (sesión de admin del proyecto, que NO
-- pasa por estas policies) o desde el script de ingesta con la service key.

comment on policy "corpus normativo lectura autenticados" on storage.objects is
  'Bucket corpus-normativo (0058): lectura para autenticados, escritura solo service_role. Espeja la policy de corpus.normativo.';


-- ── [3] Convención de rutas ────────────────────────────────────────────────
-- El path NO es libre: `corpus.normativo.storage_path` lo referencia y el
-- pipeline de extracción recorre el bucket por prefijo de tipo.
--
--   {tipo_norma}/{slug-documento}/{archivo}.pdf
--
--   ley/ley-115-1994/ley-115-1994.pdf
--   decreto/decreto-1075-2015/decreto-1075-2015-libro2-parte3.pdf
--   decreto/decreto-1850-2002/decreto-1850-2002.pdf
--   dba/dba-matematicas/dba-matematicas-v2.pdf
--   ebc/ebc-lenguaje/ebc-lenguaje.pdf
--   lineamiento/lineamientos-curriculares-lengua/lineamientos-lengua.pdf
--
-- `{tipo_norma}` usa EXACTAMENTE los mismos valores que el CHECK de
-- corpus.normativo.tipo_norma: ley | decreto | dba | ebc | lineamiento.
-- El slug va en minúsculas, sin tildes y con guiones — el nombre bonito del
-- documento vive en `corpus.normativo.documento`, no en la ruta.
