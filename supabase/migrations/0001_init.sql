-- ============ ROL como enum ============
create type user_role as enum ('student', 'instructor', 'admin');

-- ============ INSTITUCIONES ============
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  logo text,
  created_at timestamptz default now()
);

-- ============ PERFILES (extiende auth.users) ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  avatar text,
  role user_role not null default 'student',
  area text,
  institution_id uuid references public.institutions(id),
  created_at timestamptz default now()
);
create index on public.profiles (role);
create index on public.profiles (institution_id);

-- ============ PROGRESO POR USUARIO ============
create table public.progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  xp int default 0,
  completed text[] default '{}',
  badges text[] default '{}',
  updated_at timestamptz default now()
);

-- ============ ENTREGAS (con historial) ============
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  area text,
  rejilla_name text, rejilla_data jsonb,
  pregunta_name text, pregunta_data jsonb,
  grade int, feedback text,
  status text default 'pending' check (status in ('pending','graded','returned','approved')),
  return_count int default 0, return_notes text,
  instr_rejilla_name text, instr_rejilla_data jsonb,
  instr_pregunta_name text, instr_pregunta_data jsonb,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.submissions (student_id);
create index on public.submissions (status);

-- ============ INTENTOS DE RETOS ============
create table public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id text, area text,
  questions jsonb, score int, max_score int,
  created_at timestamptz default now()
);

-- ============ MENSAJES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  type text, return_notes text,
  submission_id uuid references public.submissions(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============ HELPERS DE ROL ============
create or replace function public.is_instructor()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'instructor');
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============ RLS ============
alter table public.institutions        enable row level security;
alter table public.profiles            enable row level security;
alter table public.progress            enable row level security;
alter table public.submissions         enable row level security;
alter table public.challenge_attempts  enable row level security;
alter table public.messages            enable row level security;

-- INSTITUTIONS
create policy "anyone read institutions" on institutions for select using (auth.uid() is not null);
create policy "admin write institutions" on institutions for all
  using (public.is_admin()) with check (public.is_admin());

-- PROFILES
create policy "read profiles"            on profiles for select using (id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "update own profile"       on profiles for update using (id = auth.uid());
create policy "admin manage profiles"    on profiles for all    using (public.is_admin()) with check (public.is_admin());

-- PROGRESS
create policy "own progress"             on progress for all    using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "instructor admin read"    on progress for select using (public.is_instructor() or public.is_admin());

-- SUBMISSIONS
create policy "student read own subs"    on submissions for select using (student_id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "student insert subs"      on submissions for insert with check (student_id = auth.uid());
create policy "student update own subs"  on submissions for update using (student_id = auth.uid());
create policy "instructor grade subs"    on submissions for update using (public.is_instructor() or public.is_admin());

-- CHALLENGE ATTEMPTS
create policy "student own attempts"     on challenge_attempts for select using (student_id = auth.uid() or public.is_instructor() or public.is_admin());
create policy "student insert attempts"  on challenge_attempts for insert with check (student_id = auth.uid());

-- MESSAGES
create policy "recipient read msgs"      on messages for select using (to_user_id = auth.uid() or public.is_admin());
create policy "instructor admin send"    on messages for insert with check (public.is_instructor() or public.is_admin());
create policy "recipient mark read"      on messages for update using (to_user_id = auth.uid());

-- ============ TRIGGER: auto-crear perfil al registrar usuario ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_role user_role;
begin
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'student');
  insert into public.profiles (id, email, name, avatar, role, area, institution_id)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email),1)),
    v_role,
    new.raw_user_meta_data->>'area',
    nullif(new.raw_user_meta_data->>'institution_id','')::uuid
  );
  insert into public.progress (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ INSTITUCIONES INICIALES (ajusta a las tuyas) ============
insert into public.institutions (name) values
  ('IED San Francisco'),
  ('Colegio Nacional Simón Bolívar'),
  ('Liceo Los Andes');
