-- ============================================================
-- 0056: Corpus normativo — base RAG del agente de planes de estudio
--
-- Ley 115, Decreto 1075 (Libro 2 Parte 3), Decreto 1850, DBA, EBC, Ley 1581,
-- troceados en fragmentos citables. Es el primer anillo de contención de
-- alucinaciones: el agente solo puede fundamentar con lo que esté aquí.
--
-- Vive en el schema `corpus`, no en `public`: el corpus y los datos de negocio
-- comparten BASE DE DATOS a propósito (para poder hacer el JOIN de validación
-- de citas de 0057), pero no comparten namespace.
--
-- `id` es TEXT, no uuid: lo asigna el pipeline de chunking (Fase 3) de forma
-- estable y legible, para que la recarga por lotes use `ON CONFLICT DO UPDATE`
-- sobre el mismo fragmento en vez de duplicarlo.
--
-- Embeddings de 1024 dims (voyage-3), compatible con el índice HNSW.
--
-- ⚠️ Depende de 0055 (extensión `vector`). Correrlas en orden.
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

create schema if not exists corpus;

create table if not exists corpus.normativo (
  id               text primary key,
  documento        text not null,
  tipo_norma       text not null
                   check (tipo_norma in ('ley','decreto','dba','ebc','lineamiento')),
  jerarquia        text,
  referencia_corta text not null,
  texto            text not null,
  areas            text[] not null default '{}',
  grados           int[]  not null default '{}',
  niveles          text[] not null default '{}',
  temas            text[] not null default '{}',
  vigente          boolean not null default true,
  storage_path     text,
  fuente_pagina    int,
  embedding        extensions.vector(1024),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

-- HNSW y no ivfflat: no necesita datos para entrenarse, así que el índice se
-- crea con la tabla vacía y no hay que reconstruirlo cuando crece el corpus.
create index if not exists idx_normativo_embedding on corpus.normativo
  using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists idx_normativo_areas  on corpus.normativo using gin (areas);
create index if not exists idx_normativo_grados on corpus.normativo using gin (grados);
create index if not exists idx_normativo_temas  on corpus.normativo using gin (temas);
create index if not exists idx_normativo_fts    on corpus.normativo
  using gin (to_tsvector('spanish', texto));

alter table corpus.normativo enable row level security;

-- Mismo espíritu que "read institution_courses": cualquier usuario autenticado lee
drop policy if exists "corpus lectura autenticados" on corpus.normativo;
create policy "corpus lectura autenticados"
  on corpus.normativo for select to authenticated
  using (vigente = true);

-- Sin policy de insert/update/delete → solo service_role (bypassea RLS) escribe.
-- Ni el admin puede alterar la norma desde la app: la carga es proceso de
-- servidor (Fase 4).

-- La RLS filtra filas, pero no otorga acceso: sin estos GRANT el rol
-- `authenticated` no puede ni entrar al schema, y `buscar_corpus` —que es
-- security invoker— falla con "permission denied for schema corpus".
grant usage on schema corpus to authenticated;
grant select on corpus.normativo to authenticated;

-- RPC de búsqueda, expuesta en public para no tocar "Exposed schemas" en Settings→API
create or replace function public.buscar_corpus(
  query_embedding extensions.vector(1024),
  filtro_area     text   default null,
  filtro_grado    int    default null,
  filtro_temas    text[] default null,
  match_count     int    default 8
)
returns table (
  id text, documento text, referencia_corta text,
  texto text, areas text[], similitud float
)
language sql stable security invoker
set search_path = corpus, public, extensions
as $$
  select c.id, c.documento, c.referencia_corta, c.texto, c.areas,
         1 - (c.embedding <=> query_embedding) as similitud
  from corpus.normativo c
  where c.vigente = true
    -- Sin esto, un fragmento cargado pero AÚN NO INDEXADO entra al resultado
    -- con `similitud = null` y ocupa un cupo del top-N: contamina el contexto
    -- del generador con material que la búsqueda no pudo evaluar.
    and c.embedding is not null
    and (filtro_area  is null or c.areas  @> array[filtro_area] or c.areas  = '{}')
    and (filtro_grado is null or c.grados @> array[filtro_grado] or c.grados = '{}')
    and (filtro_temas is null or c.temas && filtro_temas)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

comment on schema corpus is
  'Corpus normativo del agente de planes de estudio (0056). Misma BD que el negocio para poder validar citas por JOIN; schema aparte para no compartir namespace.';
comment on table corpus.normativo is
  'Fragmentos citables de la normativa colombiana con embedding voyage-3 (1024 dims). Solo lectura para el cliente; la carga es proceso de servidor con service_role.';
comment on column corpus.normativo.id is
  'TEXT, no uuid: id estable asignado por el pipeline de chunking para que la recarga use ON CONFLICT DO UPDATE.';
