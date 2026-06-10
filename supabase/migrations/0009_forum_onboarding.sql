-- =============================================
-- 0009 — Foro educativo + Onboarding
-- =============================================

-- ============ ONBOARDING ============
-- onboarded: el estudiante ya vio el modal de bienvenida
-- onboarding_bonus: ya reclamó el bonus de "Primeros pasos" (+50 XP)
alter table public.profiles
  add column if not exists onboarded boolean not null default false,
  add column if not exists onboarding_bonus boolean not null default false;

-- Usuarios existentes: no mostrarles el modal de bienvenida retroactivamente
update public.profiles set onboarded = true;

-- ============ FORO EDUCATIVO ============
-- Datos del autor desnormalizados: la política RLS de profiles no permite a
-- estudiantes leer perfiles ajenos, así que el nombre/avatar se copia al publicar.
create table public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  author_role user_role not null default 'student',
  title text not null check (char_length(title) between 4 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  category text not null default 'general',
  pinned boolean not null default false,
  created_at timestamptz default now()
);
create index on public.forum_topics (category);
create index on public.forum_topics (created_at desc);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  author_role user_role not null default 'student',
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz default now()
);
create index on public.forum_replies (topic_id, created_at);

-- ============ RLS ============
alter table public.forum_topics  enable row level security;
alter table public.forum_replies enable row level security;

-- Cualquier usuario autenticado lee y publica; solo el autor edita;
-- autor, instructor o admin pueden eliminar (moderación)
create policy "auth read topics"     on forum_topics for select using (auth.uid() is not null);
create policy "auth create topics"   on forum_topics for insert with check (author_id = auth.uid());
create policy "author update topics" on forum_topics for update using (author_id = auth.uid());
create policy "moderate topics"      on forum_topics for delete
  using (author_id = auth.uid() or public.is_instructor() or public.is_admin());

create policy "auth read replies"    on forum_replies for select using (auth.uid() is not null);
create policy "auth create replies"  on forum_replies for insert with check (author_id = auth.uid());
create policy "moderate replies"     on forum_replies for delete
  using (author_id = auth.uid() or public.is_instructor() or public.is_admin());

-- Solo admin puede fijar temas (pinned) — vía función con security definer
create or replace function public.toggle_pin_topic(p_topic_id uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() and not public.is_instructor() then
    raise exception 'No autorizado';
  end if;
  update public.forum_topics set pinned = not pinned where id = p_topic_id;
end; $$;
