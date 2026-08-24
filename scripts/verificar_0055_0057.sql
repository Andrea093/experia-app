-- ============================================================
-- Verificación post-aplicación de 0055 / 0056 / 0057
--
-- Sustituye al paso `supabase db diff --linked` del plan: la CLI NO opera sobre
-- este repo (no hay `supabase/config.toml`, así que `db diff` y `db push` fallan
-- con "Cannot find project ref" pese a existir `.temp/linked-project.json`).
-- Las migraciones se corren a mano en el SQL Editor — convención del proyecto,
-- documentada en CLAUDE.md §"migrations run manually in Supabase SQL Editor".
--
-- CÓMO USARLO: pegar por bloques en el SQL Editor DESPUÉS de aplicar las tres
-- migraciones. Todo es de solo lectura. Cada bloque dice qué debe salir.
--
-- Antes de aplicar nada, `scripts/test-migraciones/` corre las tres migraciones
-- sobre un Postgres real con pgvector (PGlite) y prueba RLS y validación de
-- citas sin tocar Supabase. Esto de aquí confirma el resultado EN PRODUCCIÓN.
-- ============================================================


-- ══ [0] DIAGNÓSTICO DE UNA SOLA CONSULTA ═══════════════════════════════════
-- Pegar SOLO este bloque y mirar la columna `ok`. Todo debe decir 'OK'.
-- Los bloques [1]-[9] de abajo son el detalle de cada cosa, por si algo falla.
with chequeos(orden, chequeo, resultado, esperado) as (
  values
  (1, 'extension vector en schema extensions',
      coalesce((select n.nspname from pg_extension e
                  join pg_namespace n on n.oid = e.extnamespace
                 where e.extname = 'vector'), 'NO INSTALADA'), 'extensions'),
  (2, 'schema corpus existe',
      coalesce((select nspname from pg_namespace where nspname='corpus'), 'NO'), 'corpus'),
  (3, 'corpus.normativo con RLS activa',
      coalesce((select c.relrowsecurity::text from pg_class c
                  join pg_namespace n on n.oid=c.relnamespace
                 where n.nspname='corpus' and c.relname='normativo'), 'NO EXISTE'), 'true'),
  (4, 'policies en corpus.normativo (solo 1, de SELECT)',
      coalesce((select count(*)::text from pg_policy
                 where polrelid = to_regclass('corpus.normativo')
                   and polcmd = 'r'), '0'), '1'),
  (5, 'corpus.normativo SIN policies de escritura',
      coalesce((select count(*)::text from pg_policy
                 where polrelid = to_regclass('corpus.normativo')
                   and polcmd <> 'r'), '0'), '0'),
  (6, 'authenticated USA schema corpus',
      case when to_regnamespace('corpus') is null then 'SIN SCHEMA'
           else has_schema_privilege('authenticated','corpus','usage')::text end, 'true'),
  (7, 'authenticated LEE corpus.normativo',
      case when to_regclass('corpus.normativo') is null then 'SIN TABLA'
           else has_table_privilege('authenticated','corpus.normativo','select')::text end, 'true'),
  (8, 'authenticated NO escribe corpus.normativo',
      case when to_regclass('corpus.normativo') is null then 'SIN TABLA'
           else has_table_privilege('authenticated','corpus.normativo','insert')::text end, 'false'),
  (9, '>> authenticated USA schema extensions (critico para la RPC)',
      case when to_regnamespace('extensions') is null then 'SIN SCHEMA'
           else has_schema_privilege('authenticated','extensions','usage')::text end, 'true'),
  (10, 'indice HNSW sobre el embedding',
      (select count(*)::text from pg_indexes
        where schemaname='corpus' and indexname='idx_normativo_embedding'
          and indexdef ilike '%hnsw%'), '1'),
  (11, 'indices de corpus.normativo (5 + PK)',
      (select count(*)::text from pg_indexes
        where schemaname='corpus' and tablename='normativo'), '6'),
  (12, 'policies en planes_estudio',
      (select count(*)::text from pg_policy p join pg_class c on c.oid=p.polrelid
        where c.relname='planes_estudio'), '2'),
  (13, 'policies en institution_academic_profiles',
      (select count(*)::text from pg_policy p join pg_class c on c.oid=p.polrelid
        where c.relname='institution_academic_profiles'), '2'),
  (14, 'planes_estudio con RLS activa',
      coalesce((select relrowsecurity::text from pg_class
                 where oid = to_regclass('public.planes_estudio')), 'NO EXISTE'), 'true'),
  (15, 'institution_academic_profiles con RLS activa',
      coalesce((select relrowsecurity::text from pg_class
                 where oid = to_regclass('public.institution_academic_profiles')), 'NO EXISTE'), 'true'),
  (16, 'funcion buscar_corpus',
      (select count(*)::text from pg_proc where proname='buscar_corpus'), '1'),
  (17, 'funcion validar_citas_plan',
      (select count(*)::text from pg_proc where proname='validar_citas_plan'), '1'),
  (18, 'buscar_corpus ignora lo no indexado (embedding is not null)',
      coalesce((select (prosrc ilike '%embedding is not null%')::text
                  from pg_proc where proname='buscar_corpus' limit 1), 'NO EXISTE'), 'true'),
  -- 0058 (bucket). Si aun no la corriste, 19-21 diran NO EXISTE / 0.
  (19, 'bucket corpus-normativo es PRIVADO',
      coalesce((select public::text from storage.buckets
                 where id='corpus-normativo'), 'NO EXISTE'), 'false'),
  (20, 'bucket solo acepta PDF',
      coalesce((select array_to_string(allowed_mime_types, ',') from storage.buckets
                 where id='corpus-normativo'), 'NO EXISTE'), 'application/pdf'),
  (21, 'policy de lectura del bucket, sin policies de escritura',
      (select count(*)::text from pg_policy
        where polrelid = to_regclass('storage.objects')
          and polname = 'corpus normativo lectura autenticados'
          and polcmd = 'r'), '1')
)
select orden, chequeo, resultado, esperado,
       case when resultado = esperado then 'OK' else '*** REVISAR ***' end as ok
  from chequeos
 order by orden;


-- ── [1] La extensión quedó en `extensions`, no en `public` ─────────────────
-- Esperado: 1 fila → vector | extensions
select e.extname, n.nspname as schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
 where e.extname = 'vector';


-- ── [2] Nada se tocó fuera de lo nuevo ─────────────────────────────────────
-- El chequeo que reemplaza al "revisar el diff línea por línea": ninguna tabla
-- preexistente debió cambiar. Esperado: las tablas de negocio siguen ahí y con
-- RLS activa. Si `institutions`, `profiles` o `courses` no aparecen → DETENERSE.
select c.relname as tabla, c.relrowsecurity as rls_activa
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relkind = 'r'
   and c.relname in ('institutions','profiles','courses','institution_courses',
                     'instructor_institutions','course_modules',
                     'institution_academic_profiles','planes_estudio')
 order by c.relname;


-- ── [3] El corpus existe y está cerrado a escritura ────────────────────────
-- Esperado: corpus.normativo con rls_activa = true.
select c.relname, c.relrowsecurity as rls_activa
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'corpus';

-- Esperado: EXACTAMENTE 1 policy, de comando SELECT ('r').
-- Si aparece cualquier policy de INSERT/UPDATE/DELETE → alguien abrió la norma
-- a escritura desde el cliente. Debe escribir solo service_role.
select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
  from pg_policy
 where polrelid = 'corpus.normativo'::regclass;


-- ── [4] Los GRANT del corpus ───────────────────────────────────────────────
-- La RLS filtra filas pero NO otorga acceso: sin estos privilegios
-- `buscar_corpus` (security invoker) falla con "permission denied for schema".
-- Esperado: true, true.
select has_schema_privilege('authenticated', 'corpus', 'usage')      as usa_schema,
       has_table_privilege ('authenticated', 'corpus.normativo', 'select') as lee_tabla;

-- Esperado: authenticated NO puede escribir. Debe dar false, false, false.
select has_table_privilege('authenticated', 'corpus.normativo', 'insert') as inserta,
       has_table_privilege('authenticated', 'corpus.normativo', 'update') as actualiza,
       has_table_privilege('authenticated', 'corpus.normativo', 'delete') as borra;

-- ⚠️ EL ÚNICO CHEQUE QUE NO SE PUDO VERIFICAR FUERA DE SUPABASE.
-- `buscar_corpus` recibe un `extensions.vector(1024)`, así que el cliente
-- necesita USAGE sobre el schema `extensions` para castear el embedding. En un
-- proyecto Supabase estándar ese grant ya viene puesto; si aquí sale false,
-- toda llamada a la RPC desde el frontend fallará con 42501 y hay que
-- agregarlo:  grant usage on schema extensions to authenticated;
-- Esperado: true.
select has_schema_privilege('authenticated', 'extensions', 'usage') as usa_extensions;


-- ── [5] Los índices del corpus ─────────────────────────────────────────────
-- Esperado: 5 índices + la PK → embedding (hnsw), areas, grados, temas (gin),
-- fts (gin). El HNSW se crea con la tabla vacía; no hay que reconstruirlo
-- después de cargar el corpus.
select indexname, indexdef
  from pg_indexes
 where schemaname = 'corpus' and tablename = 'normativo'
 order by indexname;


-- ── [6] Las funciones nuevas, con su firma real ────────────────────────────
-- Esperado: buscar_corpus (public) y validar_citas_plan (public), ambas stable.
select n.nspname as schema,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer,
       p.proconfig as search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where p.proname in ('buscar_corpus','validar_citas_plan');


-- ── [7] Las policies del puente multi-tenant ───────────────────────────────
-- Esperado: 2 policies por tabla (una SELECT 'r', una ALL '*').
select c.relname as tabla, p.polname, p.polcmd
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
 where c.relname in ('institution_academic_profiles','planes_estudio')
 order by c.relname, p.polname;


-- ── [8] Humo: la RPC responde con el corpus vacío ──────────────────────────
-- No valida relevancia (aún no hay embeddings), solo que la firma, el operador
-- <=> y el search_path resuelven. Esperado: 0 filas, SIN error.
select * from public.buscar_corpus(
  array_fill(0::real, array[1024])::extensions.vector(1024),
  null, null, null, 8
);


-- ── [9] Aislamiento RLS con un instructor real ─────────────────────────────
-- Reemplazar UUID_USUARIO_REAL por un `profiles.id` con role='instructor'.
-- Esperado: `planes_estudio` = 0 (aún no hay datos) y, sobre todo, que las
-- consultas NO fallen por permisos. Cuando existan planes de OTRA institución,
-- este conteo debe seguir sin verlos.
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"UUID_USUARIO_REAL","role":"authenticated"}';
--   select count(*) from public.planes_estudio;
--   select count(*) from public.institution_academic_profiles;
--   select count(*) from corpus.normativo;
--   reset role;
--
-- Se deja comentado a propósito: `set local` solo tiene efecto dentro de una
-- transacción, así que hay que correrlo envuelto en begin; ... rollback;
