-- ============================================================
-- Cambiar una cuenta PROVISIONAL de docente por la real (correo + nombre).
--
-- Los grupos, alumnos, plan y progreso cuelgan del ID de la cuenta, no del
-- correo: al cambiarlo aquí, el docente real entra con su correo y encuentra
-- todo listo. No hay que volver a correr grupos_jm.sql.
--
-- Uso: llenar la lista de abajo (una fila por docente) y correr todo.
-- La contraseña sigue siendo la temporal; el docente puede cambiarla desde su
-- perfil, o un admin desde Admin → Usuarios.
-- ⚠️ Si Supabase muestra el aviso de RLS, "Run and enable RLS" es seguro.
-- (Todo va en un solo bloque: el SQL Editor no conserva tablas temporales.)
-- ============================================================
do $$
declare r record; v_id uuid;
begin
  for r in select * from (values
    -- ('correo provisional',                       'correo real',            'Nombre completo real'),
    ('pendiente.docente10a.jm@ceinfes.com',         'REEMPLAZAR@correo.com',  'Nombre Docente Décimo A')
    -- , ('pendiente.docente10b.jm@ceinfes.com',     '...', '...')
    -- , ('pendiente.docente10c.jm@ceinfes.com',     '...', '...')
    -- , ('pendiente.docente10d.jm@ceinfes.com',     '...', '...')
    -- , ('pendiente.docentetarde1.jm@ceinfes.com',  '...', '...')
    -- , ('pendiente.docentetarde2.jm@ceinfes.com',  '...', '...')
    -- , ('pendiente.docentetarde3.jm@ceinfes.com',  '...', '...')
    -- , ('pendiente.docentetarde4.jm@ceinfes.com',  '...', '...')
  ) as t(actual, nuevo, nombre) loop
    if r.nuevo ilike 'REEMPLAZAR%' then
      raise exception 'Falta poner el correo real de %', r.actual;
    end if;
    select id into v_id from auth.users where lower(email) = lower(r.actual);
    if v_id is null then
      raise exception 'No existe la cuenta %', r.actual;
    end if;
    if exists (select 1 from auth.users where lower(email) = lower(r.nuevo)) then
      raise exception 'El correo % ya lo usa otra cuenta', r.nuevo;
    end if;

    update auth.users
       set email = lower(r.nuevo),
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', r.nombre)
     where id = v_id;
    update auth.identities
       set identity_data = identity_data || jsonb_build_object('email', lower(r.nuevo))
     where user_id = v_id and provider = 'email';
    update public.profiles set email = lower(r.nuevo), name = r.nombre where id = v_id;

    raise notice '% → % (%)', r.actual, lower(r.nuevo), r.nombre;
  end loop;
end $$;
