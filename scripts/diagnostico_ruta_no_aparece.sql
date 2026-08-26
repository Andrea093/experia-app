-- ============================================================
-- "Publiqué la ruta y el estudiante sigue sin verla"
--
-- Recorre en orden las cuatro condiciones que deben cumplirse para que un
-- estudiante vea los módulos que un tutor publicó en la VERSIÓN DE SU COLEGIO
-- (un fork: `courses.parent_course_id` apunta al curso original).
--
-- Cadena real, según src/store/store.jsx:
--   1. El estudiante tiene ACCESO y MATRÍCULA en el curso base.
--   2. `resolveCourseForStudent` busca un fork con
--      parent_course_id = <curso base> AND institution_id = profiles.institution_id
--      AND is_active = true.  ← si `profiles.institution_id` es NULL, NO HAY FORK
--      y el estudiante lee el curso BASE, que no es el que el tutor editó.
--   3. `get_course_modules_for_student` devuelve los módulos de ese curso.
--   4. `dbRowsToCourseModules` los FILTRA por el área seleccionada del
--      estudiante: se descarta todo módulo con `area_id` distinto de la suya
--      (area_id NULL = visible en todas).
--
-- CÓMO USARLO: corre los bloques [0], [1] y [2] EN ORDEN (el SQL Editor solo
-- muestra el resultado de la última sentencia, así que selecciona uno a la vez
-- y usa "Run selected"). Con el `fork_id` que salga en [2], corre [3].
-- Todo es de solo lectura.
--
-- Correo bajo diagnóstico: produtosus@ceinfes.com
-- Para revisar a otro estudiante, reemplaza ese correo en los bloques [0]-[2].
-- ============================================================

-- ── [0] El estudiante ──────────────────────────────────────────────────────
-- ⚠️ `institution_id` en NULL es la causa #1 de este síntoma: sin él, el
-- estudiante NUNCA resuelve el fork de su colegio y lee el curso original.
select p.id            as student_id,
       p.role,
       p.institution_id,
       i.name          as institucion,
       case when p.institution_id is null
            then '*** SIN INSTITUCIÓN → nunca verá la versión del colegio ***'
            else 'ok' end as veredicto
  from public.profiles p
  left join public.institutions i on i.id = p.institution_id
  left join auth.users u on u.id = p.id
 where u.email = 'produtosus@ceinfes.com';


-- ── [1] Cursos a los que tiene acceso y matrícula ──────────────────────────
-- `user_courses` es la compuerta estricta; `course_enrollments` la matrícula.
-- Si falta una de las dos, ver CLAUDE.md §"Course access — THREE tables".
select c.id, c.name, c.is_active,
       c.parent_course_id,
       case when c.parent_course_id is null then 'BASE' else 'FORK de colegio' end as tipo,
       uc.is_active as acceso_activo,
       (ce.student_id is not null) as matriculado
  from public.courses c
  left join public.user_courses uc
         on uc.course_id = c.id
        and uc.user_id = (select p.id from public.profiles p
                            join auth.users u on u.id = p.id
                           where u.email = 'produtosus@ceinfes.com')
  left join public.course_enrollments ce
         on ce.course_id = c.id
        and ce.student_id = (select p.id from public.profiles p
                               join auth.users u on u.id = p.id
                              where u.email = 'produtosus@ceinfes.com')
 where uc.id is not null or ce.student_id is not null
 order by c.name;


-- ── [2] ¿Existe el fork y lo va a encontrar? ───────────────────────────────
-- Replica EXACTAMENTE la consulta de `resolveCourseForStudent`. Si devuelve 0
-- filas, el estudiante lee el curso base aunque el fork exista: revisa que el
-- `institution_id` del fork sea el mismo del estudiante y que esté activo.
select base.name            as curso_base,
       fork.id              as fork_id,
       fork.name            as nombre_interno_del_fork,
       fork.institution_id  as fork_institucion,
       fork.is_active       as fork_activo,
       (select p.institution_id from public.profiles p
          join auth.users u on u.id = p.id
         where u.email = 'produtosus@ceinfes.com') as institucion_del_estudiante,
       case when fork.institution_id = (select p.institution_id from public.profiles p
                                          join auth.users u on u.id = p.id
                                         where u.email = 'produtosus@ceinfes.com')
             and fork.is_active
            then 'SÍ lo resuelve'
            else '*** NO coincide → leerá el curso BASE ***' end as veredicto
  from public.courses fork
  join public.courses base on base.id = fork.parent_course_id
 where fork.parent_course_id is not null
 order by base.name, fork.name;


-- ── [3] Los módulos publicados en el fork, con su área ─────────────────────
-- Reemplaza el id por el `fork_id` del bloque [2].
-- `area_id` NULL = lo ve cualquier estudiante. Con un valor, SOLO lo ve quien
-- tenga esa misma área seleccionada. Es la causa #2 del síntoma.
select m."order", m.title, m.type, m.is_enabled,
       coalesce(m.area_id, 'NULL → visible en todas las áreas') as area_id
  from public.course_modules m
 where m.course_id = 'c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64'
 order by m."order";

-- Resumen del filtro por área en ese curso:
select coalesce(area_id, 'NULL (visible siempre)') as area_id,
       count(*) as modulos,
       count(*) filter (where is_enabled) as habilitados
  from public.course_modules
 where course_id = 'c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64'
 group by area_id
 order by 1;


-- ── [4] ¿Quedó borrador sin publicar? ──────────────────────────────────────
-- `draft_modules` no vacío = hay cambios guardados que los estudiantes NO ven.
-- Publicar lo deja en NULL (discardCourseDraft).
select id, name,
       (draft_modules is not null) as tiene_borrador_pendiente,
       draft_updated_at,
       updated_at
  from public.courses
 where parent_course_id is not null
 order by updated_at desc nulls last
 limit 10;
