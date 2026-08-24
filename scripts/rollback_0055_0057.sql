-- ============================================================
-- ⚠️ DESTRUCTIVO — deshace 0055 / 0056 / 0057
--
-- Existe porque el proyecto está en plan free y no hubo backup antes de aplicar
-- esas migraciones. Es el punto de retorno manual.
--
-- SOLO borra objetos que crearon esas tres migraciones. No toca ninguna tabla
-- preexistente. Aun así: BORRA EL CORPUS Y LOS PLANES DE ESTUDIO. Si ya hay
-- algo cargado que valga la pena, exportarlo primero (bloque [0]).
--
-- Correr los bloques EN ORDEN, de abajo hacia arriba respecto a las migraciones
-- (0057 → 0056 → 0055): las dependencias van en ese sentido.
-- ============================================================


-- ── [0] ANTES DE BORRAR: exportar lo que exista ────────────────────────────
-- Correr esto primero y guardar el resultado. Si devuelve 0 en todo, el
-- rollback no pierde nada.
select 'corpus.normativo'       as tabla, count(*) from corpus.normativo
union all
select 'planes_estudio',        count(*) from public.planes_estudio
union all
select 'academic_profiles',     count(*) from public.institution_academic_profiles;

-- Para llevarse los datos (usar "Download CSV" en el SQL Editor):
--   select * from corpus.normativo;
--   select * from public.planes_estudio;
--   select * from public.institution_academic_profiles;


-- ── [1] Deshacer 0057 ──────────────────────────────────────────────────────
drop function if exists public.validar_citas_plan(uuid);
drop table if exists public.planes_estudio;
drop table if exists public.institution_academic_profiles;


-- ── [2] Deshacer 0056 ──────────────────────────────────────────────────────
drop function if exists public.buscar_corpus(
  extensions.vector(1024), text, int, text[], int);
drop table if exists corpus.normativo;
-- `restrict` a propósito, no `cascade`: si alguien creó algo más dentro de
-- `corpus`, esto falla en vez de borrarlo en silencio.
drop schema if exists corpus restrict;


-- ── [3] Deshacer 0055 ──────────────────────────────────────────────────────
-- OJO: solo si NADA más en el proyecto usa pgvector. Si otra tabla tiene una
-- columna `vector`, este drop falla (bien) o exige cascade (no usarlo).
-- Normalmente NO hace falta quitar la extensión: dejarla instalada no cuesta
-- nada y evita rehacer el paso.
-- drop extension if exists vector;


-- ── [4] Verificar que quedó limpio ─────────────────────────────────────────
-- Esperado: 0 filas en las tres.
select nspname from pg_namespace where nspname = 'corpus';
select tablename from pg_tables
 where schemaname = 'public'
   and tablename in ('planes_estudio','institution_academic_profiles');
select proname from pg_proc
 where proname in ('buscar_corpus','validar_citas_plan');
