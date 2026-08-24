-- ============================================================
-- 0059: Los conteos de una pregunta no pueden superar a los estudiantes
--
-- En la tabla de efectividad, cada pregunta guarda cuántos estudiantes marcaron
-- A, B, C y D. Esa suma NO puede ser mayor que el total de estudiantes de la
-- sección (que es, por definición, cuántos asistieron: la UI trae el botón
-- "Usar los N que asistieron" para llenarlo desde el acta).
--
-- Si 18 asistieron y los conteos suman 23, hay un error de captura. Y no es
-- inocuo: `valorDePregunta()` devuelve 'Dat.error' cuando los aciertos superan
-- al total, el P.E.P. pasa del 100 %, y la efectividad del grupo queda inflada
-- en un informe que se imprime, se firma y se le entrega al colegio.
--
-- Hoy esto se detecta pero NO se impide: `effectiveness.js` marca la pregunta
-- con `esValida = false`, la UI la pinta en rojo, y al cerrar la tabla sale un
-- `confirm()` que el docente puede aceptar igual. La regla de negocio vivía
-- solo en el navegador; esta migración la baja a la base de datos, donde no se
-- puede saltar ni desde la consola ni desde un import de Excel.
--
-- ⚠️ OJO A LA DIFERENCIA CON EL FRONTEND: `effectiveness.js` exige IGUALDAD
-- (`suma === total`) para marcar la pregunta como válida. Aquí solo se prohíbe
-- el EXCESO (`suma > total`). Es deliberado: que sumen MENOS es un estado
-- legítimo — el docente está capturando a medias y guarda un borrador, o hubo
-- estudiantes que no respondieron esa pregunta. Que sumen MÁS es imposible.
-- La alerta amarilla del frontend sigue siendo útil para el caso "no cuadra";
-- la base solo bloquea lo que no puede haber pasado.
--
-- Depende de 0051 (clone_effectiveness) y 0054 (columna unit).
-- Aditiva e idempotente. ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- ============================================================

-- ── [1] Lectura tolerante de un conteo ─────────────────────────────────────
-- Espeja `num()` de src/lib/effectiveness.js: lo que no sea un número finito y
-- no negativo vale 0. El jsonb puede traer null, cadena vacía, texto de un
-- Excel mal pegado o un decimal; nada de eso debe tumbar el trigger con un
-- error de casteo — se trata como 0, igual que en el navegador.
create or replace function public.conteo_estudiantes(v text)
returns int language sql immutable as $$
  select case
           when v is null then 0
           when v ~ '^\s*[0-9]+(\.[0-9]+)?\s*$' then trunc(v::numeric)::int
           else 0
         end;
$$;

comment on function public.conteo_estudiantes(text) is
  'Convierte un valor de conteo del jsonb a entero >= 0. Espeja num() de src/lib/effectiveness.js: lo no numérico o negativo vale 0.';

-- ── [2] La regla ───────────────────────────────────────────────────────────
create or replace function public.valida_conteos_clone_effectiveness()
returns trigger language plpgsql as $$
declare
  v_key     text;
  v_label   text;
  v_seccion jsonb;
  v_total   int;
  v_q       jsonb;
  v_suma    int;
begin
  foreach v_key in array array['exploro', 'desarrollo'] loop
    v_seccion := new.sections -> v_key;
    if v_seccion is null then continue; end if;

    v_total := public.conteo_estudiantes(v_seccion ->> 'total_estudiantes');

    -- Sección sin total todavía: no hay contra qué comparar. Es el estado
    -- normal de un borrador recién abierto, y `reportable` en el frontend ya
    -- impide guardarlo como informe. No se bloquea aquí.
    if v_total <= 0 then continue; end if;

    v_label := case v_key when 'exploro' then 'Exploro mis competencias'
                          else 'Desarrollo mis competencias' end;

    for v_q in
      select * from jsonb_array_elements(coalesce(v_seccion -> 'questions', '[]'::jsonb))
    loop
      -- Las preguntas no aplicadas se excluyen, igual que en sectionStats():
      -- si la pregunta no se trabajó en la sesión, sus conteos no representan
      -- nada y no deben bloquear el guardado.
      continue when (v_q ->> 'aplicada') = 'false';

      v_suma := public.conteo_estudiantes(v_q ->> 'a')
              + public.conteo_estudiantes(v_q ->> 'b')
              + public.conteo_estudiantes(v_q ->> 'c')
              + public.conteo_estudiantes(v_q ->> 'd');

      if v_suma > v_total then
        raise exception
          '% — pregunta %: los conteos suman % y solo hubo % estudiantes. Revisa A/B/C/D o el total de la sección.',
          v_label,
          coalesce(v_q ->> 'n', '?'),
          v_suma,
          v_total
        using errcode = '23514';   -- check_violation
      end if;
    end loop;
  end loop;

  return new;
end; $$;

comment on function public.valida_conteos_clone_effectiveness() is
  'Impide que A+B+C+D de una pregunta supere el total de estudiantes de su sección. Solo bloquea el exceso; que sumen menos es un borrador legítimo.';

-- ── [3] El trigger ─────────────────────────────────────────────────────────
-- Nombre con `v` a propósito: los triggers de un mismo evento disparan en orden
-- alfabético, y `trg_guard_finalized_clone_effectiveness` (0051) tiene que
-- correr ANTES. Así, al editar una tabla ya cerrada, el docente ve "este
-- documento ya fue cerrado" y no un mensaje sobre conteos que no puede corregir.
drop trigger if exists trg_valida_conteos_clone_effectiveness on public.clone_effectiveness;
create trigger trg_valida_conteos_clone_effectiveness
  before insert or update on public.clone_effectiveness
  for each row execute function public.valida_conteos_clone_effectiveness();


-- ── [4] ¿Hay filas viejas que ya violan la regla? ──────────────────────────
-- El trigger solo mira lo que se inserte o edite de aquí en adelante; lo ya
-- guardado no se toca. Esta consulta las lista. Las cerradas (`final`) no se
-- pueden arreglar sin un admin — decidir caso por caso si vale reabrirlas.
-- Resultado vacío = no hay nada que arrastrar.
select e.id,
       e.session_date,
       e.status,
       g.name  as grupo,
       s.key   as seccion,
       q ->> 'n' as pregunta,
       public.conteo_estudiantes(q ->> 'a') + public.conteo_estudiantes(q ->> 'b')
     + public.conteo_estudiantes(q ->> 'c') + public.conteo_estudiantes(q ->> 'd') as suma,
       public.conteo_estudiantes(s.value ->> 'total_estudiantes') as total_estudiantes
  from public.clone_effectiveness e
  join public.clone_groups g on g.id = e.group_id
  cross join lateral jsonb_each(e.sections) as s(key, value)
  cross join lateral jsonb_array_elements(coalesce(s.value -> 'questions', '[]'::jsonb)) as q
 where public.conteo_estudiantes(s.value ->> 'total_estudiantes') > 0
   and coalesce(q ->> 'aplicada', 'true') <> 'false'
   and public.conteo_estudiantes(q ->> 'a') + public.conteo_estudiantes(q ->> 'b')
     + public.conteo_estudiantes(q ->> 'c') + public.conteo_estudiantes(q ->> 'd')
     > public.conteo_estudiantes(s.value ->> 'total_estudiantes')
 order by e.session_date desc, s.key, (q ->> 'n')::int;
