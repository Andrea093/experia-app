-- Arnés mínimo: reproduce lo que Supabase ya trae y lo que 0001/0005 crean,
-- para poder aplicar 0055/0056/0057 contra un Postgres limpio.
-- NO forma parte del proyecto: vive solo en el scratchpad.

create extension if not exists pgcrypto with schema public;
create schema if not exists extensions;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase ya trae este grant sobre `extensions`; se replica porque sin él
-- cualquier cast a `extensions.vector` desde el cliente da 42501.
grant usage on schema extensions to anon, authenticated, service_role;

-- Supabase concede automáticamente privilegios sobre las tablas nuevas de
-- `public`. Se replica aquí porque 0057 no lleva GRANT explícitos y depende de
-- ese comportamiento.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- auth schema de Supabase
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::uuid;
$$;

-- ── storage de Supabase (lo mínimo que toca 0058) ──────────────────────────
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.objects to authenticated;
grant select on storage.buckets to authenticated;

-- ── de 0001_init.sql ───────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student','instructor','admin');
  end if;
end $$;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.profiles (
  id uuid primary key,
  role public.user_role not null default 'student',
  institution_id uuid references public.institutions(id)
);

create or replace function public.is_instructor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'instructor');
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'admin');
$$;

-- ── de 0005_instructor_institutions_routes.sql ─────────────────────────────
create table if not exists public.instructor_institutions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_at timestamptz not null default now()
);
