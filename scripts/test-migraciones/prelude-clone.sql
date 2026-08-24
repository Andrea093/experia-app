-- Arnés mínimo para probar 0059: lo que 0051/0054 crean de la tabla de
-- efectividad. NO es una migración; solo existe para las pruebas locales.

create extension if not exists pgcrypto with schema public;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(), name text not null);

create table if not exists public.profiles (id uuid primary key);

create table if not exists public.clone_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid,
  institution_id uuid references public.institutions(id));

create table if not exists public.clone_attendance (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.clone_groups(id) on delete cascade,
  session_date date not null default current_date,
  entries jsonb not null default '[]'::jsonb,
  status text not null default 'draft');

-- de 0051 + 0054
create table if not exists public.clone_effectiveness (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.clone_groups(id) on delete cascade,
  teacher_id    uuid,
  attendance_id uuid references public.clone_attendance(id) on delete set null,
  session_date  date not null default current_date,
  title         text,
  sections      jsonb not null default '{}'::jsonb,
  summary       jsonb not null default '{}'::jsonb,
  status        text not null default 'draft' check (status in ('draft','final')),
  finalized_at  timestamptz,
  unit_label    text,
  unit          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now());
