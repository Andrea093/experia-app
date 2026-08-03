-- ============================================================
-- 0051: Modo clon (estudiante clon + tutor clon) — TEMPORAL
--
-- Piloto de dos funcionalidades que después migran a otra plataforma:
--   · Marcar asistencia de los ALUMNOS de colegio del docente + acta.
--   · Tabla de efectividad de la sesión (Exploro / Desarrollo).
--
-- ⚠️ NO se agregan valores al enum `user_role`. En Postgres un valor de enum no
-- se puede eliminar nunca, y tocarlo obligaría a revisar todas las policies que
-- comparan role='student'/'instructor' (is_instructor(), user_courses, live_*,
-- presence_*, closing_records, submissions…). En su lugar el "rol clon" es una
-- VARIANTE DE INTERFAZ: `profiles.ui_variant = 'clone'`. Los permisos siguen
-- siendo exactamente los de student/instructor; lo único que cambia es lo que
-- pinta el frontend. Al desmontar el piloto basta con borrar la columna y las
-- cuatro tablas de abajo.
--
-- Recordatorio de dominio: en formación docente el "estudiante" de la plataforma
-- ES un docente. Aquí ese docente registra la asistencia y la efectividad de SUS
-- alumnos de colegio — no de sus compañeros de formación.
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- Depende de `instructor_institutions` (0005) e `institutions` (0001/0003): el
-- cuerpo de `my_institution_ids()` se valida al crear la función, así que si esas
-- tablas faltan la migración falla entera. Si eso pasa, lo más probable es que se
-- esté corriendo en el proyecto de Supabase equivocado — verificar el host contra
-- `VITE_SUPABASE_URL` antes de tocar nada.

-- ── [1] La variante de interfaz ────────────────────────────────────────────
alter table public.profiles
  add column if not exists ui_variant text;

alter table public.profiles
  drop constraint if exists profiles_ui_variant_check;

alter table public.profiles
  add constraint profiles_ui_variant_check
  check (ui_variant is null or ui_variant in ('clone'));

comment on column public.profiles.ui_variant is
  'Variante de interfaz del piloto temporal (0051). null = interfaz normal; ''clone'' = modo clon. NO es un rol: los permisos los sigue dando profiles.role.';

-- Solo el admin puede asignar la variante. 0029 ya bloquea que un usuario se
-- edite role/is_active/institution_id/cohort_id a sí mismo con el trigger
-- `trg_guard_profile_privileged`; se REEMPLAZA esa misma función (mismos
-- nombres, para no dejar dos triggers haciendo lo mismo) agregando ui_variant,
-- así un estudiante no puede concederse el piloto por API.
-- ⚠️ Se comparan las columnas vía to_jsonb en vez de `new.is_active`, etc.
-- Referenciar un campo directamente hace que plpgsql falle EN TIEMPO DE
-- EJECUCIÓN si la columna no existe (0003/0017 pueden no estar aplicadas en esta
-- base — 0005 no lo estaba). Ese fallo tumbaría CUALQUIER update de perfil de un
-- no-admin, incluido el `last_seen`/`current_module` que escribe nav() en cada
-- navegación: la plataforma entera se caería. Con to_jsonb, una columna ausente
-- simplemente no se vigila.
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  j_new jsonb := to_jsonb(new);
  j_old jsonb := to_jsonb(old);
  col   text;
begin
  if public.is_admin() then
    return new;  -- admin puede todo (AdminUsers, AdminSchools, AdminCohorts)
  end if;

  foreach col in array array['role', 'is_active', 'institution_id', 'cohort_id', 'ui_variant'] loop
    if (j_new ? col) and (j_old ? col) and (j_new -> col) is distinct from (j_old -> col) then
      raise exception 'No autorizado: no puedes cambiar %', col using errcode = '42501';
    end if;
  end loop;

  return new;
end; $$;

drop trigger if exists trg_guard_profile_privileged on public.profiles;
create trigger trg_guard_profile_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- Colegios del instructor (misma definición que 0050; se repite con `create or
-- replace` para que 0051 se pueda correr aunque 0050 aún no esté aplicada).
create or replace function public.my_institution_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select ii.institution_id from public.instructor_institutions ii
   where ii.instructor_id = auth.uid()
  union
  select pr.institution_id from public.profiles pr
   where pr.id = auth.uid() and pr.institution_id is not null;
$$;

grant execute on function public.my_institution_ids() to authenticated;

-- ── [2] El grupo: los alumnos de colegio de UN docente ─────────────────────
-- Lo crea el TUTOR clon y se lo asigna a un docente (`teacher_id`). Ese docente
-- es el único que marca asistencia y captura efectividad sobre él.
create table if not exists public.clone_groups (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,                                   -- "11-A", "Grupo 3"…
  grade          text,                                             -- grado/nivel, opcional
  teacher_id     uuid not null references public.profiles(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  course_id      uuid references public.courses(id) on delete set null,
  created_by     uuid references public.profiles(id) on delete set null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists clone_groups_teacher_idx on public.clone_groups (teacher_id);
create index if not exists clone_groups_inst_idx    on public.clone_groups (institution_id);

alter table public.clone_groups enable row level security;

-- El docente ve SOLO sus grupos. El tutor, los de sus colegios.
drop policy if exists clone_groups_read on public.clone_groups;
create policy clone_groups_read on public.clone_groups
  for select using (
    teacher_id = auth.uid()
    or public.is_admin()
    or (public.is_instructor() and (
          institution_id is null
          or not exists (select 1 from public.my_institution_ids())
          or institution_id in (select * from public.my_institution_ids())
    ))
  );

-- El docente NO crea ni borra grupos: el listado es responsabilidad del tutor.
drop policy if exists clone_groups_write on public.clone_groups;
create policy clone_groups_write on public.clone_groups
  for all using (
    public.is_admin()
    or (public.is_instructor() and (
          institution_id is null
          or not exists (select 1 from public.my_institution_ids())
          or institution_id in (select * from public.my_institution_ids())
    ))
  ) with check (
    public.is_admin()
    or (public.is_instructor() and (
          institution_id is null
          or not exists (select 1 from public.my_institution_ids())
          or institution_id in (select * from public.my_institution_ids())
    ))
  );

-- ── [3] Los alumnos del grupo (los carga el tutor por Excel) ───────────────
-- No son usuarios de la plataforma: son los alumnos de colegio del docente. Por
-- eso es tabla propia y no matrículas (mismo criterio que `course_roster`).
create table if not exists public.clone_group_students (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.clone_groups(id) on delete cascade,
  full_name  text not null,
  document   text,
  email      text,
  extra      jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists clone_group_students_group_idx
  on public.clone_group_students (group_id, sort_order);

alter table public.clone_group_students enable row level security;

-- Se repite la condición de clone_groups_read en vez de apoyarse en que la RLS
-- de clone_groups aplique dentro del subquery: explícito y sin sorpresas.
drop policy if exists clone_group_students_read on public.clone_group_students;
create policy clone_group_students_read on public.clone_group_students
  for select using (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_group_students.group_id
         and (g.teacher_id = auth.uid()
              or public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  );

drop policy if exists clone_group_students_write on public.clone_group_students;
create policy clone_group_students_write on public.clone_group_students
  for all using (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_group_students.group_id
         and (public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  ) with check (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_group_students.group_id
         and (public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  );

-- ── [4] Acta de asistencia (la diligencia el DOCENTE) ──────────────────────
-- Una por grupo y fecha. `entries` es un SNAPSHOT del listado al diligenciar:
-- si el tutor recarga el Excel después, un acta ya cerrada no cambia (mismo
-- criterio que `closing_records.entries` de 0050).
create table if not exists public.clone_attendance (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.clone_groups(id) on delete cascade,
  teacher_id   uuid not null references public.profiles(id) on delete cascade,
  session_date date not null default current_date,
  topic        text,
  place        text,
  notes        text,
  entries      jsonb not null default '[]'::jsonb,
    -- [{ name, document, email, present: bool, comment }]
  status       text not null default 'draft' check (status in ('draft', 'final')),
  finalized_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists clone_attendance_group_date_uidx
  on public.clone_attendance (group_id, session_date);

alter table public.clone_attendance enable row level security;

-- El docente escribe y lee las suyas; el tutor/admin solo LEE (es evidencia).
-- El WITH CHECK exige además que el grupo sea SUYO: si solo mirara teacher_id,
-- un docente podría crear un acta colgada del grupo de otro.
drop policy if exists clone_attendance_owner on public.clone_attendance;
create policy clone_attendance_owner on public.clone_attendance
  for all using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.clone_groups g
                 where g.id = clone_attendance.group_id and g.teacher_id = auth.uid())
  );

drop policy if exists clone_attendance_staff_read on public.clone_attendance;
create policy clone_attendance_staff_read on public.clone_attendance
  for select using (
    public.is_admin()
    or (public.is_instructor() and exists (
          select 1 from public.clone_groups g
           where g.id = clone_attendance.group_id
             and (g.institution_id is null
                  or not exists (select 1 from public.my_institution_ids())
                  or g.institution_id in (select * from public.my_institution_ids()))
    ))
  );

-- ── [5] Tabla de efectividad (la captura el DOCENTE) ───────────────────────
-- `sections` guarda lo CAPTURADO (conteos por pregunta); `summary` guarda lo
-- CALCULADO. El cálculo canónico vive en src/lib/effectiveness.js y se recomputa
-- en cada guardado: `summary` es una foto para reportes/exportación, nunca la
-- fuente de verdad.
create table if not exists public.clone_effectiveness (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.clone_groups(id) on delete cascade,
  teacher_id    uuid not null references public.profiles(id) on delete cascade,
  attendance_id uuid references public.clone_attendance(id) on delete set null,
  session_date  date not null default current_date,
  title         text,
  sections      jsonb not null default '{}'::jsonb,
    -- { exploro:    { total_estudiantes, questions:[{n,correcta,a,b,c,d,aplicada}] },
    --   desarrollo: { total_estudiantes, questions:[...] } }
  summary       jsonb not null default '{}'::jsonb,
    -- { exploro:{efectividadGrupo,efectividadMaxima,aplicadas}, desarrollo:{...},
    --   efectividadSesion }
  status        text not null default 'draft' check (status in ('draft', 'final')),
  finalized_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists clone_effectiveness_group_idx
  on public.clone_effectiveness (group_id, session_date desc);

alter table public.clone_effectiveness enable row level security;

drop policy if exists clone_effectiveness_owner on public.clone_effectiveness;
create policy clone_effectiveness_owner on public.clone_effectiveness
  for all using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (select 1 from public.clone_groups g
                 where g.id = clone_effectiveness.group_id and g.teacher_id = auth.uid())
  );

drop policy if exists clone_effectiveness_staff_read on public.clone_effectiveness;
create policy clone_effectiveness_staff_read on public.clone_effectiveness
  for select using (
    public.is_admin()
    or (public.is_instructor() and exists (
          select 1 from public.clone_groups g
           where g.id = clone_effectiveness.group_id
             and (g.institution_id is null
                  or not exists (select 1 from public.my_institution_ids())
                  or g.institution_id in (select * from public.my_institution_ids()))
    ))
  );

-- ── [6] Un acta/tabla cerrada no se vuelve a editar (salvo admin) ──────────
create or replace function public.guard_finalized_clone_doc()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'final' and not public.is_admin() then
    raise exception 'Este documento ya fue cerrado y no puede modificarse' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_guard_finalized_clone_attendance on public.clone_attendance;
create trigger trg_guard_finalized_clone_attendance
  before update on public.clone_attendance
  for each row execute function public.guard_finalized_clone_doc();

drop trigger if exists trg_guard_finalized_clone_effectiveness on public.clone_effectiveness;
create trigger trg_guard_finalized_clone_effectiveness
  before update on public.clone_effectiveness
  for each row execute function public.guard_finalized_clone_doc();

comment on table public.clone_groups is
  'PILOTO TEMPORAL (0051). Grupo de alumnos de colegio de un docente-estudiante. Lo crea el tutor clon; el docente solo lo consume.';
comment on table public.clone_attendance is
  'PILOTO TEMPORAL (0051). Acta de asistencia por grupo y fecha, diligenciada por el docente. entries es un snapshot del listado.';
comment on table public.clone_effectiveness is
  'PILOTO TEMPORAL (0051). Tabla de efectividad (Exploro/Desarrollo). sections = capturado, summary = calculado (fuente: src/lib/effectiveness.js).';
