-- ============================================================
-- 0050: Acta de cierre (asistencia + observaciones → PDF)
--
-- Nuevo tipo de módulo `closing_record`. Lo DILIGENCIA el tutor (confirma la
-- asistencia contra un listado que el admin cargó por Excel y agrega
-- observaciones); el docente-estudiante lo VE como constancia y lo descarga en
-- PDF. Aquí el "estudiante" es un docente en formación, así que el acta de
-- cierre es un documento que también le pertenece.
--
-- ⚠️ El nodo SÍ aparece en la ruta del estudiante y se marca completo cuando el
-- tutor CIERRA el acta (efecto en map.jsx, igual que la entrega aprobada). Es
-- decir: **si el tutor nunca la cierra, el nodo siguiente y el certificado del
-- grupo quedan bloqueados.** Es el comportamiento pedido; si aparece un grupo
-- trabado al final de la ruta, revisar primero si el acta quedó en borrador.
--
-- "Grupo" = curso + colegio. Por eso tanto el listado como el acta llevan
-- `institution_id`: un mismo curso aplicado en dos colegios tiene dos actas.
--
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ── [1] Habilitar el tipo de módulo ────────────────────────────────────────
alter table public.course_modules
  drop constraint if exists course_modules_type_check;

alter table public.course_modules
  add constraint course_modules_type_check
  check (type in ('lesson', 'challenge', 'evaluation', 'final_delivery', 'closing_record'));

-- ── [2] Listado de asistentes (lo carga el ADMIN por Excel) ────────────────
-- Es la lista oficial del grupo, independiente de las matrículas: al acta puede
-- ir gente que no es usuario de la plataforma.
create table if not exists public.course_roster (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  full_name      text not null,
  document       text,
  email          text,
  extra          jsonb not null default '{}'::jsonb,  -- columnas sueltas del Excel
  sort_order     int not null default 0,
  uploaded_by    uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists course_roster_scope_idx
  on public.course_roster (course_id, institution_id, sort_order);

alter table public.course_roster enable row level security;

drop policy if exists course_roster_read on public.course_roster;
create policy course_roster_read on public.course_roster
  for select using (public.is_instructor() or public.is_admin());

-- Solo el admin carga y borra el listado (el tutor lo consume, no lo edita).
drop policy if exists course_roster_admin_write on public.course_roster;
create policy course_roster_admin_write on public.course_roster
  for all using (public.is_admin()) with check (public.is_admin());

-- ── [3] El acta ─────────────────────────────────────────────────────────────
-- `entries` es un SNAPSHOT del listado en el momento de diligenciar: si después
-- se recarga el Excel, el acta ya firmada no cambia. Un acta por (módulo, colegio).
create table if not exists public.closing_records (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.course_modules(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  institution_id   uuid references public.institutions(id) on delete set null,
  instructor_id    uuid references public.profiles(id) on delete set null,
  session_date     date,
  place            text,
  general_comments text,
  entries          jsonb not null default '[]'::jsonb,
    -- [{ name, document, email, present: bool, comment }]
  status           text not null default 'draft' check (status in ('draft', 'final')),
  finalized_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Una sola acta de cierre por grupo. El índice único trata NULL como valor
-- (coalesce) porque un curso sin colegio asignado igual debe tener una sola.
create unique index if not exists closing_records_group_uidx
  on public.closing_records (module_id, coalesce(institution_id, '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.closing_records enable row level security;

-- Instructor: solo las actas de los colegios a los que está asignado (mismo
-- criterio que 0029/0049; sin asignación explícita cae al del perfil).
create or replace function public.my_institution_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select ii.institution_id from public.instructor_institutions ii
   where ii.instructor_id = auth.uid()
  union
  select pr.institution_id from public.profiles pr
   where pr.id = auth.uid() and pr.institution_id is not null;
$$;

grant execute on function public.my_institution_ids() to authenticated;

drop policy if exists closing_records_read on public.closing_records;
create policy closing_records_read on public.closing_records
  for select using (
    public.is_admin()
    or (public.is_instructor() and (
          institution_id is null
          or not exists (select 1 from public.my_institution_ids())
          or institution_id in (select * from public.my_institution_ids())
    ))
  );

drop policy if exists closing_records_write on public.closing_records;
create policy closing_records_write on public.closing_records
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

-- El docente-estudiante (en formación docente el "estudiante" ES el docente) ve
-- el acta de SU grupo como constancia, pero SOLO cuando ya está cerrada: un
-- borrador a medio diligenciar no debe salir de manos del tutor. Es lectura; no
-- hay policy de escritura para estudiantes.
-- El acta puede vivir en el fork del colegio mientras la matrícula apunta al
-- curso original, así que se acepta cualquiera de los dos.
drop policy if exists closing_records_student_read on public.closing_records;
create policy closing_records_student_read on public.closing_records
  for select using (
    status = 'final'
    and exists (
      select 1
        from public.course_enrollments ce
        left join public.courses c on c.id = closing_records.course_id
       where ce.student_id = auth.uid()
         and (ce.course_id = closing_records.course_id
              or ce.course_id = c.parent_course_id)
    )
  );

-- Un acta cerrada no se vuelve a editar (salvo admin, para corregir un error).
create or replace function public.guard_finalized_closing_record()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'final' and not public.is_admin() then
    raise exception 'El acta ya fue cerrada y no puede modificarse' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_guard_finalized_closing_record on public.closing_records;
create trigger trg_guard_finalized_closing_record
  before update on public.closing_records
  for each row execute function public.guard_finalized_closing_record();

comment on table public.closing_records is
  'Acta de cierre por grupo (módulo closing_record + colegio). entries es un snapshot del listado al diligenciar; una vez status=final solo un admin puede modificarla.';
