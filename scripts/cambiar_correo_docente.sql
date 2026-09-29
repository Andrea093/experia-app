-- ============================================================
-- Cambiar una cuenta PROVISIONAL de docente por la real (correo + nombre).
--
-- Los grupos, alumnos, plan y progreso cuelgan del ID de la cuenta, no del
-- correo: al cambiarlo aquí, el docente real entra con su correo y encuentra
-- todo listo. No hay que volver a correr grupos_jm.sql.
--
-- Uso: llenar la lista de abajo (una fila por docente) y correr todo.
-- La contraseña sigue siendo la temporal (Ceinfes2026*); el docente puede
-- cambiarla desde su perfil, o un admin desde Admin → Usuarios.
-- ⚠️ Si Supabase muestra el aviso de RLS, "Run and enable RLS" es seguro.
-- ============================================================
begin;

create temp table _cambios (actual text, nuevo text, nombre text) on commit drop;
insert into _cambios (actual, nuevo, nombre) values
  -- ('correo provisional',                       'correo real',            'Nombre completo real'),
  ('pendiente.docente10a.jm@ceinfes.com',        'REEMPLAZAR@correo.com',  'Nombre Docente Décimo A');
  -- ('pendiente.docente10b.jm@ceinfes.com',     '...', '...'),
  -- ('pendiente.docente10c.jm@ceinfes.com',     '...', '...'),
  -- ('pendiente.docente10d.jm@ceinfes.com',     '...', '...'),
  -- ('pendiente.docentetarde1.jm@ceinfes.com',  '...', '...'),
  -- ('pendiente.docentetarde2.jm@ceinfes.com',  '...', '...'),
  -- ('pendiente.docentetarde3.jm@ceinfes.com',  '...', '...'),
  -- ('pendiente.docentetarde4.jm@ceinfes.com',  '...', '...');

do $$
declare r record;
begin
  for r in select * from _cambios loop
    if r.nuevo ilike 'REEMPLAZAR%' then
      raise exception 'Falta poner el correo real de %', r.actual;
    end if;
    if not exists (select 1 from auth.users where lower(email) = lower(r.actual)) then
      raise exception 'No existe la cuenta %', r.actual;
    end if;
    if exists (select 1 from auth.users where lower(email) = lower(r.nuevo)) then
      raise exception 'El correo % ya lo usa otra cuenta', r.nuevo;
    end if;
  end loop;
end $$;

update auth.users u
   set email = lower(c.nuevo),
       raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', c.nombre)
  from _cambios c
 where lower(u.email) = lower(c.actual);

update auth.identities i
   set identity_data = i.identity_data || jsonb_build_object('email', lower(c.nuevo))
  from _cambios c, auth.users u
 where lower(u.email) = lower(c.nuevo) and i.user_id = u.id and i.provider = 'email';

update public.profiles p
   set email = lower(c.nuevo), name = c.nombre
  from _cambios c
 where lower(p.email) = lower(c.actual);

-- Verificación
select p.email, p.name, g.name as grupo
  from public.profiles p
  left join public.clone_groups g on g.teacher_id = p.id
 where lower(p.email) in (select lower(nuevo) from _cambios);

commit;
