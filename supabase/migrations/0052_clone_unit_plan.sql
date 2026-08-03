-- ============================================================
-- 0052: Plan de unidades del libro (tablero del módulo 5) — MODO CLON, TEMPORAL
--
-- Extiende el piloto de 0051. El TUTOR clon define, para cada grupo, en qué
-- orden deben trabajarse las unidades del libro físico y qué ejes articuladores
-- aplican a cada una. El DOCENTE (el "estudiante" de la plataforma) lo consulta
-- como un tablero de solo lectura en el último módulo de su ruta de formación.
--
-- El plan cuelga del GRUPO, no del curso ni del módulo: cada docente lleva su
-- propio ritmo con sus alumnos de colegio, que es justo lo que 0051 modela con
-- `clone_groups`. El módulo de la ruta solo es la puerta por donde se entra.
--
-- ⚠️ Depende de 0051 (clone_groups, my_institution_ids). Si 0051 no está
-- aplicada, esta migración falla entera — correrlas en orden.
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ── [1] Habilitar el tipo de módulo ────────────────────────────────────────
-- Se repite la lista completa (el CHECK no se puede "extender"): si mañana se
-- agrega otro tipo, hay que volver a escribirla entera aquí. Ver 0011 y 0050.
alter table public.course_modules
  drop constraint if exists course_modules_type_check;

alter table public.course_modules
  add constraint course_modules_type_check
  check (type in ('lesson', 'challenge', 'evaluation', 'final_delivery',
                  'closing_record', 'clone_dashboard'));

-- ── [2] El plan de unidades del grupo ──────────────────────────────────────
-- Uno por grupo (unique): el tablero del docente muestra el plan de SU grupo.
-- `units` es un array ordenado; el orden del array ES el orden en que el docente
-- debe trabajar las unidades — no se guarda un campo `order` aparte para que no
-- puedan contradecirse.
create table if not exists public.clone_unit_plans (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null unique references public.clone_groups(id) on delete cascade,
  book_title text,                                   -- "Matemáticas 9 — Serie X"
  intro      text,                                   -- indicaciones generales del tutor
  units      jsonb not null default '[]'::jsonb,
    -- [{ title, ejes: [text], notes, coverage, priority, level }]
    --   ← el índice del array manda el orden de trabajo
    --   coverage/priority: número en PORCENTAJE (27.6 = 27,6 %) o null si el
    --   tutor no lo cargó. level: texto libre ('Alta', 'Media'…), lo trae el
    --   Excel; no se deriva del puntaje.
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clone_unit_plans enable row level security;

-- Lectura: el docente dueño del grupo, el tutor de ese colegio, el admin.
-- Misma condición que `clone_groups_read` (0051), repetida explícitamente en vez
-- de apoyarse en que la RLS de clone_groups aplique dentro del subquery.
drop policy if exists clone_unit_plans_read on public.clone_unit_plans;
create policy clone_unit_plans_read on public.clone_unit_plans
  for select using (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_unit_plans.group_id
         and (g.teacher_id = auth.uid()
              or public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  );

-- Escritura: SOLO tutor/admin. El docente consulta el plan, nunca lo edita —
-- es la indicación que le baja su tutor.
drop policy if exists clone_unit_plans_write on public.clone_unit_plans;
create policy clone_unit_plans_write on public.clone_unit_plans
  for all using (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_unit_plans.group_id
         and (public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  ) with check (
    exists (
      select 1 from public.clone_groups g
       where g.id = clone_unit_plans.group_id
         and (public.is_admin()
              or (public.is_instructor() and (
                    g.institution_id is null
                    or not exists (select 1 from public.my_institution_ids())
                    or g.institution_id in (select * from public.my_institution_ids()))))
    )
  );

-- ── [3] updated_at ─────────────────────────────────────────────────────────
-- No se reutiliza `guard_finalized_clone_doc` (0051) porque esa función lee
-- `old.status`, y el plan no se cierra: el tutor lo ajusta durante todo el
-- piloto (el libro se reprograma).
create or replace function public.touch_clone_unit_plan()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_touch_clone_unit_plan on public.clone_unit_plans;
create trigger trg_touch_clone_unit_plan
  before update on public.clone_unit_plans
  for each row execute function public.touch_clone_unit_plan();

comment on table public.clone_unit_plans is
  'PILOTO TEMPORAL (0052). Orden de las unidades del libro físico + ejes articuladores por unidad, definido por el tutor para UN grupo. El docente lo consulta en el módulo clone_dashboard de su ruta.';
comment on column public.clone_unit_plans.units is
  'Array ORDENADO: [{title, ejes:[text], notes, coverage, priority, level}]. La posición en el array es el orden en que debe trabajarse la unidad. coverage/priority van en porcentaje (27.6 = 27,6 %) o null.';
