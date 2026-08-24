-- ============================================================
-- 0057: Puente multi-tenant del agente de planes de estudio
--
--   1. `institution_academic_profiles` — el formulario progresivo del colegio
--      (áreas, intensidad horaria, PEI, modelo pedagógico). Es el contexto que
--      hace que el plan generado sea de ESE colegio y no un plan genérico.
--   2. `planes_estudio` — lo que produce el agente, con su entrada, sus citas y
--      el resultado de la validación, versionado.
--
-- La RLS está calcada del patrón real de `courses`: pertenencia por
-- `instructor_institutions` O por `profiles.institution_id`. No se inventa un
-- patrón nuevo.
--
-- `gen_random_uuid()` (pgcrypto), consistente con las 54 migraciones previas:
-- `uuid_generate_v4()` no se usa en ninguna parte del esquema.
--
-- ⚠️ Depende de 0056 (corpus.normativo) y de 0001 (institutions, profiles,
-- is_admin, is_instructor) / 0005 (instructor_institutions).
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- Perfil académico institucional: el formulario progresivo
-- (áreas, intensidad horaria, PEI, modelo pedagógico)
-- ============================================================
create table if not exists public.institution_academic_profiles (
  id                uuid primary key default gen_random_uuid(),
  institution_id    uuid not null unique
                    references public.institutions(id) on delete cascade,
  modelo_pedagogico text,
  pei               jsonb,
  niveles_ofrecidos text[] not null default '{}',
  areas_estudio     jsonb not null default '[]',
  estado_formulario text not null default 'en_progreso'
                    check (estado_formulario in ('en_progreso','completo')),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

alter table public.institution_academic_profiles enable row level security;

drop policy if exists "leer perfil academico de mi institucion"
  on public.institution_academic_profiles;
create policy "leer perfil academico de mi institucion"
  on public.institution_academic_profiles for select to authenticated
  using (
    is_admin()
    or institution_id in (
      select ii.institution_id from instructor_institutions ii
      where ii.instructor_id = auth.uid()
    )
    or institution_id in (
      select p.institution_id from profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "escribir perfil academico de mi institucion"
  on public.institution_academic_profiles;
create policy "escribir perfil academico de mi institucion"
  on public.institution_academic_profiles for all to authenticated
  using (
    is_admin()
    or (is_instructor() and (
      institution_id in (
        select ii.institution_id from instructor_institutions ii
        where ii.instructor_id = auth.uid()
      )
      or institution_id in (
        select p.institution_id from profiles p where p.id = auth.uid()
      )
    ))
  )
  with check (
    is_admin()
    or (is_instructor() and (
      institution_id in (
        select ii.institution_id from instructor_institutions ii
        where ii.instructor_id = auth.uid()
      )
      or institution_id in (
        select p.institution_id from profiles p where p.id = auth.uid()
      )
    ))
  );

-- ============================================================
-- Planes de estudio generados por el agente
-- ============================================================
create table if not exists public.planes_estudio (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid not null references public.institutions(id) on delete cascade,
  creado_por      uuid references auth.users(id),
  datos_entrada   jsonb not null,
  plan_generado   jsonb not null,
  citas           jsonb not null default '[]',
  validacion      jsonb not null default '{}',
  estado          text not null default 'borrador'
                  check (estado in ('borrador','validado','aprobado','archivado')),
  version         int not null default 1,
  plan_padre_id   uuid references public.planes_estudio(id),
  creado_en       timestamptz not null default now()
);

create index if not exists idx_planes_institucion on public.planes_estudio(institution_id);
create index if not exists idx_planes_estado on public.planes_estudio(estado);

alter table public.planes_estudio enable row level security;

drop policy if exists "leer planes de mi institucion" on public.planes_estudio;
create policy "leer planes de mi institucion"
  on public.planes_estudio for select to authenticated
  using (
    is_admin()
    or institution_id in (
      select ii.institution_id from instructor_institutions ii
      where ii.instructor_id = auth.uid()
    )
    or institution_id in (
      select p.institution_id from profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "escribir planes de mi institucion" on public.planes_estudio;
create policy "escribir planes de mi institucion"
  on public.planes_estudio for all to authenticated
  using (
    is_admin()
    or (is_instructor() and (
      institution_id in (
        select ii.institution_id from instructor_institutions ii
        where ii.instructor_id = auth.uid()
      )
      or institution_id in (
        select p.institution_id from profiles p where p.id = auth.uid()
      )
    ))
  )
  with check (
    is_admin()
    or (is_instructor() and (
      institution_id in (
        select ii.institution_id from instructor_institutions ii
        where ii.instructor_id = auth.uid()
      )
      or institution_id in (
        select p.institution_id from profiles p where p.id = auth.uid()
      )
    ))
  );

-- ============================================================
-- Validación determinista de citas — el join que justifica
-- tener corpus y planes en la misma base de datos
-- ============================================================
-- Tercer anillo de contención: no le cree al LLM que citó bien, compruébelo.
-- Devuelve las citas del plan que NO existen (o ya no están vigentes) en el
-- corpus. Vacío = todas las citas son verificables.
create or replace function public.validar_citas_plan(plan_id uuid)
returns table (cita_invalida text)
language sql stable security invoker
as $$
  select cita
  from public.planes_estudio p,
       lateral jsonb_array_elements_text(p.citas) as cita
  where p.id = plan_id
    and not exists (
      select 1 from corpus.normativo c
      where c.id = cita and c.vigente = true
    );
$$;

comment on table public.institution_academic_profiles is
  'Formulario progresivo del colegio (0057): PEI, modelo pedagógico, áreas e intensidad horaria. Contexto de entrada del agente generador.';
comment on table public.planes_estudio is
  'Plan generado por el agente (0057), versionado. `citas` guarda los ids de corpus.normativo que lo respaldan; `validacion` el veredicto de los anillos determinista y LLM-judge.';
comment on column public.planes_estudio.citas is
  'Array JSON de ids TEXT de corpus.normativo. Sin FK a propósito: el corpus se recarga por lotes y un plan aprobado no debe romperse ni borrarse en cascada. Se comprueba con validar_citas_plan().';
comment on function public.validar_citas_plan(uuid) is
  'Devuelve las citas del plan que no existen o no están vigentes en corpus.normativo. Resultado vacío = plan verificable.';
