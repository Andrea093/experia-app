-- ============================================================
-- 0077_bitacora_resultados_saber_todas_las_copias.sql
-- GENERADO por scripts/build-bitacora.mjs — no editar a mano.
--
-- Refuerzo de 0076 (resultados Saber en el módulo 3 "Bitácora"). 0076 solo
-- alcanzaba el curso base y sus copias directas, y solo el módulo de
-- "order" 3. Aquí:
--   · se recorre la familia COMPLETA de cada asignatura (copias de copias);
--   · el módulo se busca por título ("Bitácora…") y, si no hay, por "order" 3;
--   · si ya tiene la sección, no se duplica (idempotente);
--   · si 0076 la había puesto en otro módulo (copia con otro orden), se
--     retira de ahí para que quede solo en la Bitácora.
-- Al final muestra DOS tablas de resultado:
--   1) qué se cambió, curso por curso;
--   2) por colegio: qué curso cargan sus estudiantes y si ya ve la sección.
--      Si una fila dice "NO" ahí, ese es el colegio que no ve las gráficas.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0077_estado;
create temp table _0077_estado (asignatura text, estado text, curso text, modulo text);
drop table if exists _0077_familia;
create temp table _0077_familia (asignatura text, base_id uuid, course_id uuid);

do $$
declare
  f record; c record; m record;
begin
  for f in
    select * from (values
    ('Matemáticas', (select coalesce(parent_course_id, id) from public.courses where id = '88136e1a-4564-45bd-b514-0ad6690b182c'::uuid), $bmat${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Matemáticas","area":"Matemáticas","year":"2025","synthetic":true,"score":{"school":47,"national":50},"competencias":[{"name":"Interpretación y representación","school":58,"national":55},{"name":"Formulación y ejecución","school":44,"national":49},{"name":"Argumentación","school":37,"national":42}],"componentes":[{"name":"Numérico-variacional","school":52,"national":51},{"name":"Geométrico-métrico","school":41,"national":46},{"name":"Aleatorio","school":49,"national":50}],"niveles":[{"name":"Nivel 1","pct":19},{"name":"Nivel 2","pct":43},{"name":"Nivel 3","pct":31},{"name":"Nivel 4","pct":7}]}$bmat$::jsonb),
    ('Lenguaje', (select coalesce(parent_course_id, id) from public.courses where id = 'd4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid), $blec${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Lectura Crítica","area":"Lectura Crítica","year":"2025","synthetic":true,"score":{"school":52,"national":53},"competencias":[{"name":"Identificar y entender contenidos locales","school":64,"national":62},{"name":"Comprender cómo se articulan las partes del texto","school":51,"national":53},{"name":"Reflexionar y evaluar el contenido","school":39,"national":45}],"componentes":[{"name":"Textos literarios (continuos)","school":56,"national":55},{"name":"Textos informativos (continuos)","school":50,"national":52},{"name":"Textos discontinuos","school":43,"national":49}],"niveles":[{"name":"Nivel 1","pct":12},{"name":"Nivel 2","pct":38},{"name":"Nivel 3","pct":41},{"name":"Nivel 4","pct":9}]}$blec$::jsonb),
    ('Biología', (select coalesce(parent_course_id, id) from public.courses where id = '4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid), $bbio${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Biológico"}$bbio$::jsonb),
    ('Física', (select id from public.courses where parent_course_id is null and name like '%Ciencias Naturales — Física' order by created_at limit 1), $bfis${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Físico"}$bfis$::jsonb),
    ('Química', (select id from public.courses where parent_course_id is null and name like '%Ciencias Naturales — Química' order by created_at limit 1), $bqui${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Naturales","area":"Ciencias Naturales","year":"2025","synthetic":true,"score":{"school":49,"national":50},"competencias":[{"name":"Uso comprensivo del conocimiento científico","school":55,"national":53},{"name":"Explicación de fenómenos","school":47,"national":49},{"name":"Indagación","school":40,"national":46}],"componentes":[{"name":"Biológico","school":54,"national":52},{"name":"Químico","school":45,"national":48},{"name":"Físico","school":42,"national":47},{"name":"Ciencia, tecnología y sociedad","school":50,"national":50}],"niveles":[{"name":"Nivel 1","pct":15},{"name":"Nivel 2","pct":44},{"name":"Nivel 3","pct":34},{"name":"Nivel 4","pct":7}],"focus":"Químico"}$bqui$::jsonb),
    ('Ciencias Sociales', (select coalesce(parent_course_id, id) from public.courses where id = '9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid), $bsoc${"type":"saber-results","title":"Así le fue al colegio en la Prueba Saber — Ciencias Sociales y Ciudadanas","area":"Ciencias Sociales y Ciudadanas","year":"2025","synthetic":true,"score":{"school":46,"national":49},"competencias":[{"name":"Pensamiento social","school":53,"national":52},{"name":"Interpretación y análisis de perspectivas","school":45,"national":48},{"name":"Pensamiento reflexivo y sistémico","school":38,"national":44}],"componentes":[{"name":"Historia y cultura","school":51,"national":50},{"name":"Espacio, territorio, ambiente y población","school":44,"national":48},{"name":"Poder, economía y organizaciones sociales","school":41,"national":46}],"niveles":[{"name":"Nivel 1","pct":20},{"name":"Nivel 2","pct":42},{"name":"Nivel 3","pct":31},{"name":"Nivel 4","pct":7}]}$bsoc$::jsonb)
    ) as t(label, base_id, sec)
  loop
    if f.base_id is null then
      insert into _0077_estado values (f.label, 'CURSO NO ENCONTRADO', '—', 'No existe en esta base de datos.');
      continue;
    end if;

    insert into _0077_familia
      with recursive fam as (
        select id from public.courses where id = f.base_id
        union
        select ch.id from public.courses ch join fam on ch.parent_course_id = fam.id
      )
      select f.label, f.base_id, id from fam;

    for c in
      select co.id, co.name from public.courses co
       where co.id in (select course_id from _0077_familia where base_id = f.base_id)
       order by co.parent_course_id nulls first, co.name
    loop
      select * into m from public.course_modules
       where course_id = c.id and type = 'lesson' and title ilike '%bit_cora%'
       order by "order" limit 1;
      if m.id is null then
        select * into m from public.course_modules where course_id = c.id and "order" = 3;
      end if;

      if m.id is null then
        insert into _0077_estado values (f.label, 'SIN MÓDULO 3', c.name, '—');
      elsif m.type <> 'lesson' then
        insert into _0077_estado values (f.label, 'NO TOCADO', c.name, format('%s (no es una lección: %s)', m.title, m.type));
      elsif m.content @> '[{"type":"saber-results"}]'::jsonb then
        insert into _0077_estado values (f.label, 'YA LA TENÍA', c.name, m.title);
      else
        update public.course_modules
           set content = coalesce((
                 select jsonb_agg(e order by i)
                   from jsonb_array_elements(coalesce(m.content, '[]'::jsonb)) with ordinality as t(e, i)
                  where coalesce(e->>'title', '') <> 'Pendiente'
               ), '[]'::jsonb) || jsonb_build_array(f.sec),
               updated_at = now()
         where id = m.id;
        insert into _0077_estado values (f.label, 'AGREGADA AHORA', c.name, m.title);
      end if;

      -- Si 0076 la puso en otro módulo de este curso (la Bitácora no estaba en
      -- el orden 3), se retira de ahí: queda solo en la Bitácora.
      if m.id is not null and m.type = 'lesson' then
        with fuera as (
          update public.course_modules cm
             set content = coalesce((
                   select jsonb_agg(e order by i)
                     from jsonb_array_elements(cm.content) with ordinality as t(e, i)
                    where e->>'type' is distinct from 'saber-results'
                 ), '[]'::jsonb),
                 updated_at = now()
           where cm.course_id = c.id and cm.id <> m.id
             and cm.content @> '[{"type":"saber-results"}]'::jsonb
          returning cm.title
        )
        insert into _0077_estado select f.label, 'RETIRADA DE OTRO MÓDULO', c.name, title from fuera;
      end if;
    end loop;
  end loop;
end $$;

-- 1) Qué se cambió
select asignatura, estado, curso, modulo from _0077_estado order by asignatura, estado, curso;

-- 2) Qué ve cada colegio. Mismo criterio que la app (loadStudentSession):
--    el estudiante matriculado en un curso carga la copia ACTIVA de ese curso
--    para su colegio si existe; si no, el curso mismo.
--    ⚠️ course_enrollments usa student_id (no user_id).
with matriculas as (
  select fa.asignatura, ce.course_id, p.institution_id, ce.student_id
    from public.course_enrollments ce
    join public.profiles p on p.id = ce.student_id and p.role = 'student'
    join _0077_familia fa on fa.course_id = ce.course_id
), efectivo as (
  select mt.*, coalesce((
           select k.id from public.courses k
            where k.parent_course_id = mt.course_id and k.institution_id = mt.institution_id and k.is_active
            order by k.created_at limit 1), mt.course_id) as curso_efectivo
    from matriculas mt
)
select ef.asignatura,
       coalesce(i.name, '(sin colegio)')                              as colegio,
       co.name                                                        as curso_que_carga,
       count(distinct ef.student_id)                                  as estudiantes,
       case when exists (
         select 1 from public.course_modules cm
          where cm.course_id = ef.curso_efectivo and cm.is_enabled
            and cm.content @> '[{"type":"saber-results"}]'::jsonb
       ) then 'SÍ' else 'NO' end                                      as ve_la_seccion
  from efectivo ef
  join public.courses co on co.id = ef.curso_efectivo
  left join public.institutions i on i.id = ef.institution_id
 group by ef.asignatura, i.name, co.name, ef.curso_efectivo
 order by ve_la_seccion, ef.asignatura, colegio;
