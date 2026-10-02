-- ============================================================
-- 0072_estructura_saber_diapositivas.sql
-- Módulo 2 (estructura de la Prueba Saber) de las 4 asignaturas: pone las
-- diapositivas oficiales del área (imágenes fijas, se ven GRANDES y con
-- pantalla completa) en lugar del bloque de texto "Estructura de la Prueba
-- Saber — <área>" que dejaron 0064–0067.
--
--   Matemáticas        "Las reglas del escape"      → 2 diapositivas
--   Lenguaje           "El manual del detective"    → 2 (Lectura crítica)
--   Ciencias Sociales  "Las reglas del viaje"       → 2
--   Ciencias Naturales "Protocolo del experimento"  → 3 (física, química y
--                       biología se evalúan integradas: estructura,
--                       competencias/componentes y distribución por componente)
--
-- Las imágenes viven en el frontend: public/estructura-saber/*.jpg.
-- Sección nueva `{type:'slides'}` (lesson.jsx → SlidesSection).
--
-- Cruza por TÍTULO del módulo (todos los cursos que lo tengan). Si el módulo
-- tiene el bloque de texto de la estructura, lo reemplaza en su lugar; si no,
-- agrega las diapositivas al final. No toca un módulo que ya tenga
-- diapositivas → idempotente.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0072_estado;
create temp table _0072_estado (estado text, detalle text);

do $$
declare
  r record;
  v_slides jsonb;
  v_n int;
begin
  for r in
    select * from (values
      ('Las reglas del escape',     'Matemáticas',      '["matematicas-1","matematicas-2"]'::jsonb, null::text),
      ('El manual del detective',   'Lectura Crítica',  '["lectura-1","lectura-2"]'::jsonb, null),
      ('Las reglas del viaje',      'Ciencias Sociales','["sociales-1","sociales-2"]'::jsonb, null),
      ('Protocolo del experimento', 'Ciencias Naturales','["ciencias-1","ciencias-2","ciencias-3"]'::jsonb,
        'Física, química y biología (más Ciencia, Tecnología y Sociedad) se evalúan de forma integrada.')
    ) as v(titulo, area, imgs, descr)
  loop
    v_slides := jsonb_build_object(
      'type', 'slides',
      'title', 'Estructura de la prueba Saber 11 — ' || r.area,
      'desc', coalesce(r.descr, ''),
      'images', (select jsonb_agg(jsonb_build_object('url', '/estructura-saber/' || x || '.jpg', 'caption', '') order by i)
                   from jsonb_array_elements_text(r.imgs) with ordinality as t(x, i))
    );

    update public.course_modules m
       set content = case
         when exists (select 1 from jsonb_array_elements(m.content) e
                       where e->>'type' = 'steps' and e->>'title' like 'Estructura de la Prueba Saber%')
         then (select jsonb_agg(case when e->>'type' = 'steps' and e->>'title' like 'Estructura de la Prueba Saber%'
                                     then v_slides else e end order by i)
                 from jsonb_array_elements(m.content) with ordinality as t(e, i))
         else m.content || jsonb_build_array(v_slides)
       end
     where m.title = r.titulo
       and jsonb_typeof(m.content) = 'array'
       and not m.content @> '[{"type":"slides"}]'::jsonb;
    get diagnostics v_n = row_count;

    insert into _0072_estado values (
      case when v_n > 0 then 'APLICADA' else 'SIN CAMBIOS' end,
      format('%s (módulo "%s"): %s módulo(s) actualizados.', r.area, r.titulo, v_n));
  end loop;
end $$;

-- Verificación: módulos con diapositivas, por curso.
insert into _0072_estado
select c.name, m.title || ' — ' || jsonb_array_length(e->'images') || ' diapositiva(s)'
  from public.course_modules m
  join public.courses c on c.id = m.course_id
  cross join lateral jsonb_array_elements(case when jsonb_typeof(m.content) = 'array' then m.content else '[]'::jsonb end) e
 where e->>'type' = 'slides';

select estado, detalle from _0072_estado;
