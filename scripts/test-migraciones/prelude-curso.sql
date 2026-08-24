-- Arnés mínimo para probar el seed 0060: courses + course_modules según
-- 0007 + 0011 (area_id) + 0012 (theme, character_line). No es una migración.
create extension if not exists pgcrypto with schema public;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image text,
  color text default '#E8732C',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  theme text default null);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  subtitle text,
  description text,
  type text not null default 'lesson'
    check (type in ('lesson','challenge','evaluation','final_delivery','closing_record','clone_dashboard')),
  challenge_type text,
  "order" int not null default 0,
  is_enabled boolean not null default true,
  xp int not null default 100,
  content jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  challenge_data jsonb default '{}'::jsonb,
  requirements text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  area_id text,
  character_line text);
